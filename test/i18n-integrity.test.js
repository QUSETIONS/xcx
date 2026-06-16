/**
 * i18n 完整性回归测试（CI 护栏）
 *
 * 防止后续改动引入：
 * 1. 中英文键不对等（一边加了 key 另一边漏了）
 * 2. 页面引用了不存在的 i18n key（渲染时回退成 key 字符串）
 * 3. 对象型 key（benefitMap / compareData）在两语言下结构可用
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import zh from '@/i18n/locales/zh'
import en from '@/i18n/locales/en'

// 把嵌套对象压平成 'a.b.c' 的叶子键集合（数组视为叶子）
function flatten(obj, prefix = '', out = {}) {
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    const key = prefix ? prefix + '.' + k : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = true
  }
  return out
}

// 沿点分路径取值；对象型 key 也能取到（返回对象/数组）
function resolve(obj, dotted) {
  let cur = obj
  for (const p of dotted.split('.')) {
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

const zhLeaves = flatten(zh)
const enLeaves = flatten(en)

// 收集 src 下所有 t('...') 引用
function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, files)
    else if (e.name.endsWith('.vue') || e.name.endsWith('.js')) files.push(p)
  }
  return files
}
const refs = new Set()
const re = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g
const srcRoot = path.resolve(__dirname, '..', 'src')
for (const f of walk(srcRoot)) {
  const txt = fs.readFileSync(f, 'utf8')
  let m
  while ((m = re.exec(txt))) refs.add(m[1])
}

describe('i18n 完整性：中英文键对等', () => {
  it('zh 与 en 叶子键集合完全一致', () => {
    const onlyZh = Object.keys(zhLeaves).filter(k => !enLeaves[k])
    const onlyEn = Object.keys(enLeaves).filter(k => !zhLeaves[k])
    expect(onlyZh).toEqual([])
    expect(onlyEn).toEqual([])
  })

  it('关键 namespace 在两语言下均存在', () => {
    const must = ['titles', 'common', 'tab', 'app', 'settings',
      'demandDetail', 'mallDetail', 'listPage', 'orderConfirm',
      'demandPublish', 'admin', 'member', 'orderPage', 'cartPage']
    for (const ns of must) {
      expect(zh[ns], `zh 缺少 ${ns}`).toBeDefined()
      expect(en[ns], `en 缺少 ${ns}`).toBeDefined()
    }
  })
})

describe('i18n 完整性：引用的 key 都能解析', () => {
  it(`src 中 ${refs.size} 个 t() 引用均能在 zh 解析`, () => {
    const missing = [...refs].filter(k => resolve(zh, k) === undefined)
    expect(missing, `zh 缺失: ${missing.join(', ')}`).toEqual([])
  })

  it(`src 中 ${refs.size} 个 t() 引用均能在 en 解析`, () => {
    const missing = [...refs].filter(k => resolve(en, k) === undefined)
    expect(missing, `en 缺失: ${missing.join(', ')}`).toEqual([])
  })
})

describe('i18n 完整性：对象型 key 两语言结构可用', () => {
  it('mallDetail.benefitMap 各类型返回非空数组', () => {
    const types = ['member', 'linker', 'survey', 'resource_pack', 'certification', 'default']
    for (const tp of types) {
      expect(Array.isArray(zh.mallDetail.benefitMap[tp])).toBe(true)
      expect(zh.mallDetail.benefitMap[tp].length).toBeGreaterThan(0)
      expect(Array.isArray(en.mallDetail.benefitMap[tp])).toBe(true)
      expect(en.mallDetail.benefitMap[tp].length).toBe(zh.mallDetail.benefitMap[tp].length)
    }
  })

  it('member.compareData 两语言行数一致且含 name/free/pro/enterprise', () => {
    expect(zh.member.compareData.length).toBe(en.member.compareData.length)
    expect(zh.member.compareData.length).toBeGreaterThan(0)
    for (const row of zh.member.compareData) {
      expect(row).toHaveProperty('name')
      expect(row).toHaveProperty('free')
      expect(row).toHaveProperty('pro')
      expect(row).toHaveProperty('enterprise')
    }
  })

  it('points.days / chat.quick / campaign.tasks 为数组且两语言等长', () => {
    expect(zh.points.days.length).toBe(en.points.days.length)
    expect(zh.chat.quick.length).toBe(en.chat.quick.length)
    expect(zh.campaign.tasks.length).toBe(en.campaign.tasks.length)
  })
})
