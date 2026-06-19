/**
 * bridge 契约测试 —— 验证 mock/real 切换层
 *
 * - USE_MOCK=true：bridge.* 返回 mock 数据（含本次补全的新服务与方法缺口）
 * - USE_MOCK=false：mock @/utils/request，断言 bridge 调对真实端点（= 后端 REST 契约）
 *
 * 复用 regression.test.js 的 ENV 切换 + vi.doMock('@/utils/request') 套路。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

beforeEach(() => { globalThis.__resetStore() })

describe('bridge mock 分支 (USE_MOCK=true)', () => {
  it('demand.list 返回 mock 需求列表', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const res = await bridge.demand.list({ page: 1, pageSize: 5 })
    expect(res.list.length).toBeGreaterThan(0)
    expect(res.total).toBeGreaterThan(0)
  })

  it('补全的新服务可用（community/review/dashboard/coupon/follow…）', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    expect((await bridge.community.posts({ pageSize: 5 })).list.length).toBeGreaterThan(0)
    expect((await bridge.community.topics()).length).toBeGreaterThan(0)
    expect(await bridge.dashboard.overview()).toBeTruthy()
    expect(await bridge.coupon.list()).toBeTruthy()
    expect(await bridge.follow.list()).toBeTruthy()
  })

  it('补缺方法可用（demand.update / lead.myLeads / favorite.check / user.demoLogin / order.detail）', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const created = await bridge.demand.create({ title: 'x', created_by: 'demo_user_001' })
    expect((await bridge.demand.update(created._id, { title: 'y' })).title).toBe('y')
    expect((await bridge.lead.myLeads()).total).toBeGreaterThanOrEqual(0)
    expect(await bridge.favorite.check({ targetType: 'demand', targetId: 'demand_1' })).toBe(false)
    expect(await bridge.user.demoLogin('admin')).toBeTruthy()
    expect(await bridge.order.detail('order_1')).toBeTruthy()
  })
})

describe('bridge real 分支 (USE_MOCK=false) 调对端点', () => {
  async function withRealHttp(fn) {
    vi.resetModules()
    const get = vi.fn().mockResolvedValue({ list: [], total: 0 })
    const post = vi.fn().mockResolvedValue({ success: true })
    const put = vi.fn().mockResolvedValue({})
    const del = vi.fn().mockResolvedValue({})
    vi.doMock('@/utils/request', () => ({ default: { get, post, put, delete: del } }))
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = false
    const { bridge } = await import('@/api/bridge')
    try {
      await fn({ bridge, get, post, put, del })
    } finally {
      vi.doUnmock('@/utils/request')
      ENV.USE_MOCK = true
    }
  }

  it('demand.list → GET /demand/list（带 query）', async () => {
    await withRealHttp(async ({ bridge, get }) => {
      await bridge.demand.list({ page: 2 })
      expect(get).toHaveBeenCalledWith('/demand/list', { page: 2 })
    })
  })

  it('demand.update → PUT /demand/:id', async () => {
    await withRealHttp(async ({ bridge, put }) => {
      await bridge.demand.update('demand_1', { title: 't' })
      expect(put).toHaveBeenCalledWith('/demand/demand_1', { title: 't' })
    })
  })

  it('community.createComment → POST /community/posts/:id/comments', async () => {
    await withRealHttp(async ({ bridge, post }) => {
      await bridge.community.createComment('post_1', 'hi')
      expect(post).toHaveBeenCalledWith('/community/posts/post_1/comments', { content: 'hi' })
    })
  })

  it('cart.remove → DELETE /cart/:id', async () => {
    await withRealHttp(async ({ bridge, del }) => {
      await bridge.cart.remove('c1')
      expect(del).toHaveBeenCalledWith('/cart/c1')
    })
  })

  it('review.avgRating → GET /review/avg（query）', async () => {
    await withRealHttp(async ({ bridge, get }) => {
      await bridge.review.avgRating('demand_1')
      expect(get).toHaveBeenCalledWith('/review/avg', { target_id: 'demand_1' })
    })
  })

  it('member.subscribe → POST /member/subscribe', async () => {
    await withRealHttp(async ({ bridge, post }) => {
      await bridge.member.subscribe('pro')
      expect(post).toHaveBeenCalledWith('/member/subscribe', { tierId: 'pro' })
    })
  })
})
