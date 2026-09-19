/**
 * 构建产物体积预算检查。
 *
 *   npm run build:h5 && node scripts/check-budgets.mjs
 *
 * 预算（与正式运营验收口径一致）：
 *   - 单个 JS/CSS 入口文件 ≤ 600KB（当前主包约 500KB）
 *   - 单张图片资源 ≤ 300KB（首屏主图口径）
 *   - 整个 H5 产物 ≤ 5MB
 * 超限即非零退出，避免无感膨胀。
 */
import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(fileURLToPath(import.meta.url), '..', '..')
const distDir = resolve(appRoot, process.env.BUDGET_DIST || 'dist/build/h5')

const BUDGETS = {
  scriptBytes: Number(process.env.BUDGET_SCRIPT_KB || 600) * 1024,
  imageBytes: Number(process.env.BUDGET_IMAGE_KB || 300) * 1024,
  totalBytes: Number(process.env.BUDGET_TOTAL_MB || 5) * 1024 * 1024
}
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])
const SCRIPT_EXT = new Set(['.js', '.css'])

if (!existsSync(distDir)) {
  console.error(`[budgets] 找不到构建产物：${distDir}；请先 npm run build:h5`)
  process.exit(1)
}

const failures = []
let total = 0

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { walk(full); continue }
    const size = statSync(full).size
    total += size
    const ext = extname(entry.name).toLowerCase()
    if (SCRIPT_EXT.has(ext) && size > BUDGETS.scriptBytes) {
      failures.push(`${full} ${(size / 1024).toFixed(0)}KB 超过单文件预算 ${BUDGETS.scriptBytes / 1024}KB`)
    }
    if (IMAGE_EXT.has(ext) && size > BUDGETS.imageBytes) {
      failures.push(`${full} ${(size / 1024).toFixed(0)}KB 超过图片预算 ${BUDGETS.imageBytes / 1024}KB`)
    }
  }
}
walk(distDir)

if (total > BUDGETS.totalBytes) {
  failures.push(`${distDir} 总体积 ${(total / 1024 / 1024).toFixed(2)}MB 超过预算 ${BUDGETS.totalBytes / 1024 / 1024}MB`)
}

if (failures.length) {
  console.error(`[budgets] ${failures.length} 项超限：`)
  for (const item of failures) console.error(`  - ${item}`)
  process.exit(1)
}
console.log(`[budgets] OK — total=${(total / 1024 / 1024).toFixed(2)}MB, js/css<=${BUDGETS.scriptBytes / 1024}KB, image<=${BUDGETS.imageBytes / 1024}KB`)
