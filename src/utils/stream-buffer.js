/**
 * 合并高频流式片段，避免每个 token 都触发一次响应式列表和滚动重排。
 * 默认以约 30fps 刷新，既保留打字感，也不会拖慢低端设备。
 */
export function createStreamBuffer({ onFlush, delay = 32 } = {}) {
  let pending = ''
  let timer = null
  let stopped = false

  const clearTimer = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  const flush = () => {
    clearTimer()
    if (!pending || stopped) {
      pending = ''
      return
    }
    const value = pending
    pending = ''
    onFlush?.(value)
  }

  const schedule = () => {
    if (timer || stopped) return
    timer = setTimeout(() => {
      timer = null
      flush()
    }, Math.max(16, Number(delay) || 32))
  }

  return {
    push(value) {
      if (stopped) return
      const text = String(value ?? '')
      if (!text) return
      pending += text
      schedule()
    },
    flush,
    clear() {
      pending = ''
      clearTimer()
    },
    stop() {
      pending = ''
      clearTimer()
      stopped = true
    }
  }
}
