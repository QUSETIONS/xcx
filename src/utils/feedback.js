/**
 * 用户反馈工具
 * 触觉反馈 + 统一 Toast + 防重复点击
 */

// ============ 触觉反馈 ============

/**
 * 轻震动反馈（短震动 15ms）
 * 用于关注、收藏、点赞等轻量交互
 */
export function hapticLight() {
  try { uni.vibrateShort && uni.vibrateShort({ type: 'light' }) } catch {}
}

/**
 * 中等震动反馈
 * 用于成功提交、下单等中等交互
 */
export function hapticMedium() {
  try { uni.vibrateShort && uni.vibrateShort({ type: 'medium' }) } catch {}
}

/**
 * 重震动反馈
 * 用于重要操作确认、成交等
 */
export function hapticSuccess() {
  try { uni.vibrateShort && uni.vibrateShort({ type: 'heavy' }) } catch {}
}

// ============ 统一 Toast ============

export function toastSuccess(title) {
  hapticMedium()
  uni.showToast({ title, icon: 'success', duration: 1500 })
}

export function toastError(title) {
  uni.showToast({ title, icon: 'none', duration: 2000 })
}

export function toast(title) {
  uni.showToast({ title, icon: 'none', duration: 1500 })
}

// ============ 防重复点击 ============

/**
 * 防重复点击守卫
 * 返回一个函数，在 interval 毫秒内只执行一次
 * 用于提交按钮、下单等防双击
 *
 * @param {Function} fn 目标函数（可异步）
 * @param {number} interval 间隔毫秒，默认 1000
 * @returns {Function} 守卫后的函数（带 .isRunning 状态）
 */
export function guardClick(fn, interval = 1000) {
  let running = false
  let lastTime = 0
  const guarded = async function (...args) {
    const now = Date.now()
    if (running || now - lastTime < interval) {
      return null
    }
    running = true
    lastTime = now
    try {
      return await fn.apply(this, args)
    } finally {
      running = false
    }
  }
  guarded.isRunning = () => running
  return guarded
}

/**
 * 确认弹窗（Promise 化）
 */
export function confirm(options = {}) {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title || '提示',
      content: options.content || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (r) => resolve(r.confirm),
      fail: () => resolve(false)
    })
  })
}
