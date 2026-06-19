/**
 * Vue 接线守卫 — 静态防回归
 *
 * 背景：本项目的测试从不挂载任何 .vue 组件（无 @vue/test-utils，happy-dom 仅给工具函数用），
 * 因此"页面级接线 bug"对测试套件是不可见的。历史上曾有两类静默缺陷溜过 20+ 次提交：
 *   A) onMounted 已 import 却从未调用        → 列表进页空白，直到手动下拉刷新
 *   B) const animated = ref(false) 从未置真  → 列表容器 opacity:0，内容永远不可见
 *   C) 调用了未定义的函数（如 demand/list 的 loadList 引用 9 次却无定义）→ 进页即 ReferenceError
 *
 * 本守卫直接对每个 .vue 的 <script setup> 做静态扫描，固化这三类不变量，使未来不再回归。
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOTS = ['src/pages', 'src/components'].map(d => path.resolve(process.cwd(), d))

function walkVue(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walkVue(full))
    else if (e.name.endsWith('.vue')) out.push(full)
  }
  return out
}

const VUE_FILES = ROOTS.flatMap(walkVue)

function extractScript(src) {
  const m = src.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  return m ? m[1] : ''
}

// 抠掉字符串/注释，避免字符串里的 "foo(" 被误判为调用
function stripLiterals(code) {
  let out = '', i = 0
  while (i < code.length) {
    const c = code[i], c2 = code[i + 1]
    if (c === '/' && c2 === '/') { while (i < code.length && code[i] !== '\n') i++; continue }
    if (c === '/' && c2 === '*') { i += 2; while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++; i += 2; continue }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++
      while (i < code.length) { if (code[i] === '\\') { i += 2; continue } if (code[i] === q) { i++; break } i++ }
      continue
    }
    out += c; i++
  }
  return out
}

// 允许的"全局/宏/关键字"——调用它们不算未定义
const GLOBALS = new Set([
  // JS 内建
  'uni', 'console', 'Number', 'Math', 'JSON', 'Date', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'Boolean', 'String', 'Array', 'Object', 'RegExp', 'Error', 'Promise', 'Symbol', 'BigInt', 'Map', 'Set',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'undefined', 'NaN', 'Infinity', 'globalThis', 'require', 'process', 'getApp', 'getCurrentPages',
  // Vue 编译器宏（无需 import）
  'defineProps', 'defineEmits', 'defineExpose', 'defineModel', 'defineOptions', 'defineSlots', 'withDefaults',
  // 本项目约定：t 是 i18n 翻译器（多数页面 import，但兜底放这里）
  't'
])

const KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'new', 'await', 'async',
  'void', 'delete', 'in', 'of', 'do', 'else', 'instanceof', 'yield', 'throw', 'try', 'finally'
])

const VUE_HOOKS = [
  'onMounted', 'onBeforeMount', 'onUpdated', 'onBeforeUpdate', 'onUnmounted', 'onBeforeUnmount',
  'onActivated', 'onDeactivated', 'onServerPrefetch', 'onErrorCaptured'
]

// 收集 <script setup> 里"已定义/已导入"的标识符
function collectDefined(script) {
  const defined = new Set(GLOBALS)
  for (const m of script.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1])
  for (const m of script.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) defined.add(m[1])
  // 解构声明 const { a, b as c, d: e } = ... / const [x] = ...（支持 as 与冒号两种重命名）
  for (const m of script.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=/g))
    for (const p of m[1].split(',')) { const mm = p.trim().match(/([A-Za-z_$][\w$]*)\s*(?::\s*([A-Za-z_$][\w$]*)|\s+as\s+([A-Za-z_$][\w$]*))?/); if (mm) defined.add(mm[2] || mm[3] || mm[1]) }
  for (const m of script.matchAll(/\b(?:const|let|var)\s*\[([^\]]*)\]\s*=/g))
    for (const p of m[1].split(',')) { const mm = p.trim().match(/([A-Za-z_$][\w$]*)/); if (mm) defined.add(mm[1]) }
  // 具名导入 { a, b as c }
  for (const m of script.matchAll(/import\s*\{([^}]*)\}\s*from/g))
    for (const p of m[1].split(',')) { const mm = p.trim().match(/([A-Za-z_$][\w$]*)\s*(?:as\s+([A-Za-z_$][\w$]*))?/); if (mm) defined.add(mm[2] || mm[1]) }
  // 默认 / 命名空间导入
  for (const m of script.matchAll(/import\s+([A-Za-z_$][\w$]*)\s*,?\s*(?:\{[^}]*\}\s*)?from/g)) defined.add(m[1])
  for (const m of script.matchAll(/import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s*from/g)) defined.add(m[1])
  // 对象方法简写 NAME(args) { ... }
  for (const m of script.matchAll(/\b([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g)) defined.add(m[1])
  return defined
}

describe('vue 接线守卫', () => {
  expect(VUE_FILES.length, '应扫描到 .vue 文件').toBeGreaterThan(0)

  for (const file of VUE_FILES) {
    const rel = path.relative(process.cwd(), file).replace(/\\/g, '/')
    const fileSrc = fs.readFileSync(file, 'utf8')
    const rawScript = extractScript(fileSrc)        // 保留引号/字符串，用于 import 检测
    const script = stripLiterals(rawScript)          // 去字符串/注释，用于调用扫描

    describe(rel, () => {
      // A) 生命周期钩子：import 了就必须调用（在未去引号的脚本上检测 import，避免引号被剥掉后漏配）
      const vueImp = rawScript.match(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"]/)
      if (vueImp) {
        const names = vueImp[1].split(',').map(s => s.trim()).filter(Boolean)
        for (const hook of VUE_HOOKS) {
          if (names.includes(hook)) {
            it(`生命周期 ${hook} 已 import 必须被调用`, () => {
              expect(script, `${rel}: ${hook} 已从 vue 导入但从未调用（数据不会在进页时加载）`)
                .toMatch(new RegExp('\\b' + hook + '\\s*\\('))
            })
          }
        }
      }

      // B) animated 淡入开关：声明即必须有效（初始 true 或被赋 true）
      const animDecl = rawScript.match(/const\s+animated\s*=\s*ref\s*\(\s*(true|false)\s*\)/)
      if (animDecl) {
        it('列表淡入开关 animated 有效（ref(true) 或运行时置真）', () => {
          const initTrue = animDecl[1] === 'true'
          const setTrue = /animated\.value\s*=\s*true/.test(script)
          expect(initTrue || setTrue,
            `${rel}: const animated = ref(false) 且从未 animated.value = true → 列表容器 opacity:0 永远不可见`)
            .toBe(true)
        })
      }

      // C) 不允许调用未定义的裸函数
      it('所有裸函数调用都有定义/导入/全局来源', () => {
        const defined = collectDefined(script)
        const missing = new Set()
        for (const m of script.matchAll(/(^|[^\w.$])([A-Za-z_$][\w$]*)\s*\(/g)) {
          const name = m[2]
          if (/^\d/.test(name)) continue
          if (KEYWORDS.has(name)) continue
          if (!defined.has(name)) missing.add(name)
        }
        expect([...missing].sort(), `${rel}: 调用了未定义的函数 → ${[...missing].sort().join(', ')}`).toEqual([])
      })
    })
  }
})
