import { describe, it, expect, beforeEach } from 'vitest'
import { cartService, orderService, searchService } from '@/mock/service'

beforeEach(() => {
  globalThis.__resetStore()
})

// ============ 购物车 ============
describe('cartService - 购物车', () => {
  const product = { _id: 'p1', title: '会员认证', price: 9900, service_type: 'certification' }

  it('新增商品后列表应有1项且数量为1', () => {
    cartService.add(product)
    const list = cartService.list()
    expect(list.length).toBe(1)
    expect(list[0].quantity).toBe(1)
  })

  it('重复添加同一商品应累加数量', () => {
    cartService.add(product)
    cartService.add(product)
    expect(cartService.list()[0].quantity).toBe(2)
    expect(cartService.count()).toBe(2)
  })

  it('updateQty 应更新数量', () => {
    cartService.add(product)
    cartService.updateQty('p1', 5)
    expect(cartService.list()[0].quantity).toBe(5)
  })

  it('updateQty 数量<=0 应移除商品', () => {
    cartService.add(product)
    cartService.updateQty('p1', 0)
    expect(cartService.list().length).toBe(0)
  })

  it('remove 应删除指定商品', () => {
    cartService.add(product)
    cartService.add({ _id: 'p2', title: 'B', price: 100, quantity: 1 })
    cartService.remove('p1')
    const list = cartService.list()
    expect(list.length).toBe(1)
    expect(list[0]._id).toBe('p2')
  })

  it('total 应正确计算总价（分）', () => {
    cartService.add(product) // 9900 x1
    cartService.add({ _id: 'p2', title: 'B', price: 200, service_type: 'member' })
    cartService.updateQty('p2', 3) // 200 x3 = 600
    expect(cartService.total()).toBe(9900 + 600)
  })

  it('clear 应清空购物车', () => {
    cartService.add(product)
    cartService.clear()
    expect(cartService.list().length).toBe(0)
    expect(cartService.count()).toBe(0)
  })

  it('空购物车 count 和 total 应为 0', () => {
    expect(cartService.count()).toBe(0)
    expect(cartService.total()).toBe(0)
  })
})

// ============ 订单 ============
describe('orderService - 订单', () => {
  it('create 应生成订单并默认 created 状态', () => {
    const o = orderService.create({ user_id: 'u1', items: [{ _id: 'p1', title: 'A', price: 100 }], contact_name: '张三', phone: '138' })
    expect(o._id).toBeTruthy()
    expect(o.status).toBe('created')
    expect(o.created_at).toBeTruthy()
  })

  it('updateStatus 应更新订单状态', () => {
    const o = orderService.create({ items: [{ price: 100 }] })
    orderService.updateStatus(o._id, 'paid')
    expect(orderService.detail(o._id).status).toBe('paid')
  })

  it('myOrders 支持状态筛选', () => {
    const a = orderService.create({ items: [{ price: 100 }] }) // created
    const b = orderService.create({ items: [{ price: 100 }] })
    orderService.updateStatus(b._id, 'completed')
    const pending = orderService.myOrders({ status: 'pending' })
    const completed = orderService.myOrders({ status: 'completed' })
    expect(pending.list.some(o => o._id === a._id)).toBe(true)
    expect(completed.list.some(o => o._id === b._id)).toBe(true)
  })

  it('myOrders all 返回全部', () => {
    orderService.create({ items: [{ price: 100 }] })
    orderService.create({ items: [{ price: 100 }] })
    expect(orderService.myOrders({ status: 'all' }).total).toBeGreaterThanOrEqual(2)
  })

  it('detail 查询不存在的 id 返回 null', () => {
    expect(orderService.detail('not_exist')).toBeNull()
  })
})

// ============ 搜索 ============
describe('searchService - 搜索', () => {
  it('hotKeywords 应返回数组', () => {
    const kw = searchService.hotKeywords()
    expect(Array.isArray(kw)).toBe(true)
    expect(kw.length).toBeGreaterThan(0)
  })

  it('addHistory 应记录并去重置顶', () => {
    searchService.addHistory('短视频')
    searchService.addHistory('品牌')
    searchService.addHistory('短视频') // 重复
    const h = searchService.history()
    expect(h[0]).toBe('短视频') // 置顶
    expect(h.filter(x => x === '短视频').length).toBe(1) // 去重
  })

  it('history 限制在10条', () => {
    for (let i = 0; i < 15; i++) searchService.addHistory(`kw_${i}`)
    expect(searchService.history().length).toBe(10)
  })

  it('clearHistory 应清空历史', () => {
    searchService.addHistory('test')
    searchService.clearHistory()
    expect(searchService.history().length).toBe(0)
  })

  it('search 空关键词应返回空结果', () => {
    const r = searchService.search('')
    expect(r.total).toBe(0)
    expect(r.demands.length).toBe(0)
  })

  it('search 应跨域返回结果（需求/服务/社区）', () => {
    const r = searchService.search('短视频')
    expect(r).toHaveProperty('demands')
    expect(r).toHaveProperty('products')
    expect(r).toHaveProperty('posts')
    expect(r).toHaveProperty('total')
    expect(r.total).toBe(r.demands.length + r.products.length + r.posts.length)
  })
})
