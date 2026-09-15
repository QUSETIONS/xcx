import { describe, expect, it, vi } from 'vitest'

describe('统一请求封装的写入安全边界', () => {
  it('同源 GET 网络重试保持原 URL，不重复追加 /api', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    const previousRequest = globalThis.uni.request
    const urls = []
    globalThis.uni.request = (options) => {
      urls.push(options.url)
      if (urls.length === 1) options.fail({ errMsg: '连接中断' })
      else options.success({ statusCode: 200, data: { code: 0, data: { ok: true } } })
    }
    try {
      const { default: http } = await import('@/utils/request')
      const pending = http.get('/notify/list', {}, { baseURL: '/api' })
      await vi.runAllTimersAsync()
      await expect(pending).resolves.toEqual({ ok: true })
      expect(urls).toEqual(['/api/notify/list', '/api/notify/list'])
    } finally {
      globalThis.uni.request = previousRequest
      vi.useRealTimers()
    }
  })
  it('默认不自动重发非幂等写请求，避免弱网造成重复业务操作', async () => {
    vi.resetModules()
    const previousRequest = globalThis.uni.request
    const request = vi.fn((options) => {
      queueMicrotask(() => options.fail({ errMsg: '连接中断' }))
      return {}
    })
    globalThis.uni.request = request

    try {
      const { default: http } = await import('@/utils/request')
      await expect(http.post('/network/groups/group_1/messages', { content: '只发一次' })).rejects.toMatchObject({ isNetworkError: true })
      expect(request).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.uni.request = previousRequest
    }
  })

  it('兼容 headers 别名并合并到 uni.request 的 header', async () => {
    vi.resetModules()
    const previousRequest = globalThis.uni.request
    const request = vi.fn((options) => {
      queueMicrotask(() => options.success({ statusCode: 200, data: { code: 0, data: { ok: true } } }))
      return {}
    })
    globalThis.uni.request = request

    try {
      const { default: http } = await import('@/utils/request')
      await expect(http.post('/resource/resource_1/download', undefined, {
        headers: { 'Idempotency-Key': 'download_once' }
      })).resolves.toEqual({ ok: true })
      expect(request.mock.calls[0][0].header['Idempotency-Key']).toBe('download_once')
    } finally {
      globalThis.uni.request = previousRequest
    }
  })
})
