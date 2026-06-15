import { describe, it, expect, vi, beforeEach } from 'vitest'
import { guardClick, confirm, hapticLight, toastSuccess, toastError } from '@/utils/feedback'
import { useRequest } from '@/hooks/useRequest'

beforeEach(() => {
  globalThis.__resetStore()
  // 重置 uni mock 调用记录
  uni.showToast.mockClear?.()
  uni.showModal.mockClear?.()
})

// ============ guardClick 防重复点击 ============
describe('guardClick - 防重复点击', () => {
  it('正常情况应执行一次', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const g = guardClick(fn, 100)
    const r = await g()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(r).toBe('ok')
  })

  it('间隔内连续调用只执行第一次', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const g = guardClick(fn, 500)
    await g()
    const r2 = await g() // 间隔内，应被拦截
    expect(fn).toHaveBeenCalledTimes(1)
    expect(r2).toBeNull()
  })

  it('间隔过后可再次执行', async () => {
    vi.useFakeTimers()
    const fn = vi.fn().mockResolvedValue('ok')
    const g = guardClick(fn, 100)
    await g()
    vi.advanceTimersByTime(200)
    await g()
    expect(fn).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('执行中（未完成）的二次调用应被拦截', async () => {
    let resolveFn
    const fn = vi.fn(() => new Promise(res => { resolveFn = res }))
    const g = guardClick(fn, 50)
    const p1 = g()
    const r2 = await g() // 第一次未完成，应被拦截
    expect(r2).toBeNull()
    expect(fn).toHaveBeenCalledTimes(1)
    resolveFn('done')
    await p1
  })

  it('isRunning 反映执行状态', () => {
    const fn = vi.fn(() => new Promise(() => {})) // 永不resolve
    const g = guardClick(fn, 100)
    expect(g.isRunning()).toBe(false)
    g()
    expect(g.isRunning()).toBe(true)
  })

  it('函数抛错后守卫应释放，可再次调用', async () => {
    let count = 0
    const fn = vi.fn(() => { count++; return count === 1 ? Promise.reject(new Error('fail')) : Promise.resolve('ok') })
    const g = guardClick(fn, 50)
    await expect(g()).rejects.toThrow('fail')
    vi.useFakeTimers()
    vi.advanceTimersByTime(100)
    const r = await g()
    expect(r).toBe('ok')
    vi.useRealTimers()
  })
})

// ============ confirm 弹窗 ============
describe('confirm - 确认弹窗', () => {
  it('确认时 resolve(true)', async () => {
    uni.showModal = vi.fn(({ success }) => success({ confirm: true }))
    const r = await confirm({ content: '测试' })
    expect(r).toBe(true)
  })

  it('取消时 resolve(false)', async () => {
    uni.showModal = vi.fn(({ success }) => success({ confirm: false }))
    const r = await confirm({ content: '测试' })
    expect(r).toBe(false)
  })
})

// ============ 触觉/Toast（不报错即可）============
describe('haptic / toast - 反馈', () => {
  it('hapticLight 不抛错', () => {
    expect(() => hapticLight()).not.toThrow()
  })
  it('toastSuccess 调用 uni.showToast', () => {
    const spy = vi.fn()
    uni.showToast = spy
    toastSuccess('成功')
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ title: '成功', icon: 'success' }))
  })
  it('toastError 调用 uni.showToast icon none', () => {
    const spy = vi.fn()
    uni.showToast = spy
    toastError('失败')
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ title: '失败', icon: 'none' }))
  })
})

// ============ useRequest ============
describe('useRequest - 异步加载', () => {
  it('初始状态为 idle', () => {
    const { state } = useRequest(async () => 1)
    expect(state.value).toBe('idle')
  })

  it('run 成功后状态变 success 且 data 填充', async () => {
    const { state, data, run } = useRequest(async () => ({ a: 1 }))
    await run()
    expect(state.value).toBe('success')
    expect(data.value).toEqual({ a: 1 })
  })

  it('run 失败后状态变 error 且 error 填充', async () => {
    const { state, error, run } = useRequest(async () => { throw new Error('网络错误') })
    await expect(run()).rejects.toThrow('网络错误')
    expect(state.value).toBe('error')
    expect(error.value.message).toBe('网络错误')
  })

  it('重试：error 后再次 run 成功', async () => {
    let attempt = 0
    const { state, run } = useRequest(async () => {
      attempt++
      if (attempt === 1) throw new Error('首次失败')
      return 'ok'
    })
    await expect(run()).rejects.toThrow()
    expect(state.value).toBe('error')
    const r = await run()
    expect(state.value).toBe('success')
    expect(r).toBe('ok')
  })

  it('immediate 立即执行', async () => {
    const fn = vi.fn(async () => 42)
    const { state } = useRequest(fn, { immediate: true })
    // 等待微任务
    await new Promise(r => setTimeout(r, 0))
    expect(fn).toHaveBeenCalled()
  })

  it('reset 回到 idle', async () => {
    const { state, run, reset } = useRequest(async () => 1)
    await run()
    expect(state.value).toBe('success')
    reset()
    expect(state.value).toBe('idle')
  })

  it('支持传参', async () => {
    const fetcher = async (id) => `result-${id}`
    const { data, run } = useRequest(fetcher)
    await run('abc')
    expect(data.value).toBe('result-abc')
  })
})
