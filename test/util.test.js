import { describe, it, expect, vi } from 'vitest'
import { debounce, throttle, formatYuan, deepClone, formatDate, formatDateTime, formatDateFull, formatRelativeTime } from '@/utils/util'

describe('debounce - 防抖', () => {
  it('应在延迟后执行', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('连续调用只执行最后一次', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d(1); d(2); d(3)
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3)
    vi.useRealTimers()
  })

  it('cancel 应取消待执行', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d()
    d.cancel()
    vi.advanceTimersByTime(500)
    expect(fn).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('throttle - 节流', () => {
  it('间隔内只执行一次', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const t = throttle(fn, 300)
    t(); t(); t()
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(300)
    t()
    expect(fn).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})

describe('formatYuan - 金额格式化', () => {
  it('分转元', () => {
    expect(formatYuan(9900)).toBe('99')
    expect(formatYuan(100)).toBe('1')
  })
  it('整元去小数', () => {
    expect(formatYuan(5000)).toBe('50')
  })
  it('保留两位小数', () => {
    expect(formatYuan(150)).toBe('1.50')
  })
  it('null/undefined 安全', () => {
    expect(formatYuan(null)).toBe('0')
    expect(formatYuan(undefined)).toBe('0')
  })
})

describe('deepClone - 深拷贝', () => {
  it('应拷贝嵌套对象', () => {
    const obj = { a: 1, b: { c: 2 } }
    const copy = deepClone(obj)
    expect(copy).toEqual(obj)
    expect(copy.b).not.toBe(obj.b)
  })
  it('修改拷贝不影响原对象', () => {
    const obj = { list: [1, 2, 3] }
    const copy = deepClone(obj)
    copy.list.push(4)
    expect(obj.list.length).toBe(3)
  })
  it('null 安全', () => {
    expect(deepClone(null)).toBeNull()
  })
})

describe('date 格式化', () => {
  it('formatDate 返回 M/D', () => {
    expect(formatDate('2026-06-16T10:30:00')).toBe('6/16')
  })
  it('formatDate 空值安全', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
  })
  it('formatDateTime 返回 Y-M-D HH:mm', () => {
    const r = formatDateTime('2026-06-16T09:05:00')
    expect(r).toBe('2026-06-16 09:05')
  })
  it('formatDateFull 返回 Y-M-D 并补零', () => {
    expect(formatDateFull('2026-06-16')).toBe('2026-06-16')
  })
  it('formatRelativeTime 刚刚/小时前/天前', () => {
    const now = Date.now()
    expect(formatRelativeTime(new Date(now).toISOString())).toBe('刚刚')
    expect(formatRelativeTime(new Date(now - 3 * 3600000).toISOString())).toBe('3小时前')
    expect(formatRelativeTime(new Date(now - 2 * 86400000).toISOString())).toBe('2天前')
  })
  it('formatRelativeTime 超过7天回退 M/D', () => {
    const old = new Date(Date.now() - 10 * 86400000)
    const r = formatRelativeTime(old.toISOString())
    expect(r).toBe(`${old.getMonth() + 1}/${old.getDate()}`)
  })
})

