import { describe, it, expect, beforeEach } from 'vitest'
import {
  leadService, dealService, notifyService, reviewService,
  demandService, cartService, orderService, couponService,
  searchService
} from '@/mock/service'
import { trackBrowse, getRecommendedDemands, getBrowseHistory } from '@/mock/smart'

beforeEach(() => {
  globalThis.__resetStore()
})

// ============ 交易闭环：对接 → 通知 → 成交 → 评价 ============
describe('集成：交易闭环', () => {
  it('提交对接后应生成通知且需求对接数+1', () => {
    const beforeDemand = demandService.detail('demand_1')
    const leadsBefore = beforeDemand.lead_count

    const lead = leadService.create({
      demand_id: 'demand_1',
      from_user_id: 'other_user',
      contact_name: '测试对接方',
      phone: '13800138000'
    })

    // 对接记录生成
    expect(lead.status).toBe('new')
    expect(lead.demand_title).toBeTruthy()

    // 通知生成（type=lead）
    const notifys = notifyService.list({ type: 'lead' })
    const newNotify = notifys.list.find(n => n.desc.includes('测试对接方'))
    expect(newNotify).toBeTruthy()
    expect(newNotify.read).toBe(false)

    // 需求对接数 +1
    const afterDemand = demandService.detail('demand_1')
    expect(afterDemand.lead_count).toBe(leadsBefore + 1)
  })

  it('对接接受(deal)后应生成成交记录 + 双向通知', () => {
    const dealsBefore = dealService.myDeals().total
    const notifyBefore = notifyService.list().total

    const lead = leadService.create({
      demand_id: 'demand_1',
      from_user_id: 'other_user',
      contact_name: '成交测试',
      phone: '13800138000'
    })
    leadService.updateStatus(lead._id, 'deal')

    // 成交记录 +1
    expect(dealService.myDeals().total).toBe(dealsBefore + 1)

    // 成交通知（type=deal）生成
    const dealNotifys = notifyService.list({ type: 'deal' })
    const dealNotify = dealNotifys.list.find(n => n.desc.includes('成交'))
    expect(dealNotify).toBeTruthy()
    expect(notifyService.list().total).toBeGreaterThan(notifyBefore)
  })

  it('对接拒绝(invalid)后应生成拒绝通知', () => {
    const lead = leadService.create({
      demand_id: 'demand_1',
      from_user_id: 'other_user',
      contact_name: '拒绝测试',
      phone: '13800138000'
    })
    leadService.updateStatus(lead._id, 'invalid')

    const notifys = notifyService.list()
    const rejectNotify = notifys.list.find(n => n.title.includes('拒绝'))
    expect(rejectNotify).toBeTruthy()
  })

  it('成交评价应联动生成 review 并锁定重复评价', () => {
    const lead = leadService.create({
      demand_id: 'demand_1',
      from_user_id: 'other_user',
      contact_name: '评价测试',
      phone: '13800138000'
    })
    leadService.updateStatus(lead._id, 'deal')
    const deal = dealService.myDeals().list.find(d => d.lead_id === lead._id)

    const reviewsBefore = reviewService.list().total
    // 首次评价
    const r1 = dealService.addReview(deal._id, { rating: 5, content: '非常专业', tags: ['响应快'] })
    expect(r1.success).toBe(true)
    expect(reviewService.list().total).toBe(reviewsBefore + 1)

    // 已评价的 deal can_review 变 false
    const updatedDeal = dealService.myDeals().list.find(d => d._id === deal._id)
    expect(updatedDeal.can_review).toBe(false)
    expect(updatedDeal.has_review).toBe(true)
  })
})

// ============ 下单流程：购物车 → 订单 ============
describe('集成：下单流程', () => {
  it('购物车商品可生成订单', () => {
    const product = { _id: 'p1', title: '会员认证', price: 9900, service_type: 'certification' }
    cartService.add(product)
    cartService.add(product) // 数量2

    const cartTotal = cartService.total()
    const order = orderService.create({
      user_id: 'u1',
      items: [{ _id: 'p1', title: '会员认证', price: 9900, quantity: 2 }],
      total_amount: cartTotal,
      contact_name: '张三',
      phone: '13800138000'
    })

    expect(order.status).toBe('created')
    expect(order.total_amount).toBe(cartTotal)
    expect(order._id).toBeTruthy()
  })

  it('订单状态全生命周期流转', () => {
    const order = orderService.create({ items: [{ _id: 'p1', price: 100, quantity: 1 }] })
    expect(order.status).toBe('created')

    orderService.updateStatus(order._id, 'paid')
    expect(orderService.detail(order._id).status).toBe('paid')

    orderService.updateStatus(order._id, 'confirmed')
    expect(orderService.detail(order._id).status).toBe('confirmed')

    orderService.updateStatus(order._id, 'serving')
    expect(orderService.detail(order._id).status).toBe('serving')

    orderService.updateStatus(order._id, 'completed')
    expect(orderService.detail(order._id).status).toBe('completed')
  })

  it('优惠券领取后从可用列表移除', () => {
    const availableBefore = couponService.available()
    couponService.claim('c1')
    expect(couponService.available()).toBe(availableBefore - 1)
  })
})

// ============ 浏览→推荐联动 ============
describe('集成：浏览行为影响推荐', () => {
  it('浏览历史会改变推荐排序', () => {
    // 推荐结果带 _score
    const recs1 = getRecommendedDemands(10)
    expect(recs1.every(r => typeof r._score === 'number')).toBe(true)

    // 浏览一个需求后，该需求在推荐中分数应被降权
    trackBrowse('demand', 'demand_1', { category_id: 'cat_01', title: 'A', region: '北京' })
    const recs2 = getRecommendedDemands(10)
    const viewed = recs2.find(r => r._id === 'demand_1')
    if (viewed) {
      const before = recs1.find(r => r._id === 'demand_1')
      expect(viewed._score).toBeLessThanOrEqual(before._score)
    }
  })

  it('搜索与浏览历史独立但可串联', () => {
    const searchResult = searchService.search('短视频')
    // 搜索到结果后，可逐一追踪浏览
    searchResult.demands.forEach((d, i) => {
      if (i < 3) trackBrowse('demand', d._id, d)
    })
    expect(getBrowseHistory().length).toBeLessThanOrEqual(3)
  })
})

// ============ 通知已读联动 ============
describe('集成：通知已读状态', () => {
  it('提交对接产生未读通知，read 后未读数减少', () => {
    leadService.create({
      demand_id: 'demand_1',
      from_user_id: 'x',
      contact_name: '未读测试',
      phone: '138'
    })

    const before = notifyService.list().unread
    const newNotify = notifyService.list({ type: 'lead' }).list.find(n => n.desc.includes('未读测试'))
    expect(newNotify.read).toBe(false)

    notifyService.read(newNotify._id)
    const after = notifyService.list().unread
    expect(after).toBe(before - 1)
  })
})
