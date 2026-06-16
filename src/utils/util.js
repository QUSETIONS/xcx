/**
 * 通用工具函数
 */

/**
 * 防抖：延迟执行，期间再次调用则重新计时
 * @param {Function} fn 目标函数
 * @param {number} delay 延迟毫秒
 * @returns {Function} 防抖后的函数（带 .cancel 方法）
 */
export function debounce(fn, delay = 300) {
  let timer = null
  const debounced = function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { fn.apply(this, args); timer = null }, delay)
  }
  debounced.cancel = function () { if (timer) { clearTimeout(timer); timer = null } }
  return debounced
}

/**
 * 节流：固定时间间隔内最多执行一次
 */
export function throttle(fn, interval = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= interval) { last = now; fn.apply(this, args) }
  }
}

/**
 * 金额格式化：分 → 元
 */
export function formatYuan(fen) {
  if (fen == null) return '0'
  return (fen / 100).toFixed(2).replace(/\.00$/, '')
}

/**
 * 简单深拷贝（JSON 安全对象）
 */
export function deepClone(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj))
}

// ============ 日期格式化（统一实现，消除页面重复）============

/**
 * 短日期：M/D （如 6/16）
 */
export function formatDate(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/**
 * 完整日期时间：Y-M-D HH:mm （如 2026-06-16 10:30）
 */
export function formatDateTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * 完整日期：Y-M-D （如 2026-06-16）
 */
export function formatDateFull(t) {
  if (!t) return ''
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * 相对时间：刚刚 / X小时前 / X天前 / M/D
 */
export function formatRelativeTime(t) {
  if (!t) return ''
  const diff = (Date.now() - new Date(t).getTime()) / 3600000
  if (diff < 1) return '刚刚'
  if (diff < 24) return Math.floor(diff) + '小时前'
  if (diff < 168) return Math.floor(diff / 24) + '天前'
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

