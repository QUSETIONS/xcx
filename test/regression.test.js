import { describe, it, expect, beforeEach, vi } from 'vitest'
import { leadService, chatService } from '@/mock/service'
import { getPriceSuggestion } from '@/mock/smart'

beforeEach(() => {
  globalThis.__resetStore()
})

// 回归：leadService.create 必须设置 from_user_id，否则 myLeads 永远为空
describe('回归：lead from_user_id', () => {
  it('create 的对接能被 myLeads 查到', () => {
    const lead = leadService.create({
      demand_id: 'demand_1',
      contact_name: '回归测试',
      phone: '13800138000'
    })
    expect(lead.from_user_id).toBeTruthy()
    const mine = leadService.myLeads()
    expect(mine.list.some(l => l._id === lead._id)).toBe(true)
  })
})

// 回归：bridge.user.info 调用的是真实存在的 getInfo（不是不存在的 info）
describe('回归：bridge.user.info', () => {
  it('USE_MOCK=true 时 bridge.user.info 不抛错', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    // 之前 info() 不存在会 throw TypeError
    const info = await bridge.user.info()
    expect(info).toBeTruthy()
  })
})

// 回归：getPriceSuggestion 的 avg 必须落在 [min, max] 区间内
describe('回归：价格建议 avg 一致性', () => {
  it('avg 在 min 与 max 之间', () => {
    const r = getPriceSuggestion('cat_01', 'self')
    expect(r).not.toBeNull()
    expect(r.avg).toBeGreaterThanOrEqual(r.min)
    expect(r.avg).toBeLessThanOrEqual(r.max)
  })

  it('默认参考价 avg 也在区间内', () => {
    // 用一个不存在的分类触发默认值分支
    const r = getPriceSuggestion('cat_not_exist', 'self')
    expect(r.avg).toBeGreaterThanOrEqual(r.min)
    expect(r.avg).toBeLessThanOrEqual(r.max)
  })
})

// 回归：chatService 消息 id 必须唯一（不再用 list.length）
describe('回归：聊天消息 id 唯一', () => {
  it('多次 send/reply 的 id 互不相同', () => {
    chatService.send('a')
    chatService.reply()
    chatService.send('b')
    chatService.reply()
    const list = chatService.list()
    const ids = list.map(m => m.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length) // 无重复
  })
})
