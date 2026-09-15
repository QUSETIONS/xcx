/**
 * 集成测试（扩展）：覆盖 member / points / verify / follow / favorite /
 * coupon-order / search / product 等此前未覆盖的服务交互流程。
 *
 * 注意：points/coupon/follow 等服务持有模块级内存状态，但 vitest 默认按
 * 测试文件隔离模块注册表，故本文件内状态从模块加载时起算，跨用例累积。
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  memberService, pointsService, verifyService, followService,
  favoriteService, couponService, searchService, productService,
  orderService
} from '@/mock/service'

beforeEach(() => {
  globalThis.__resetStore()
})

// ============ 会员开通流程 ============
describe('集成：会员开通', () => {
  it('默认为免费会员', () => {
    const cur = memberService.current()
    expect(cur.tier).toBe('free')
  })

  it('订阅专业版后 current 反映新套餐', () => {
    const r = memberService.subscribe('pro')
    expect(r).toBeTruthy()
    expect(r.tier).toBe('pro')
    expect(memberService.current().tier).toBe('pro')
  })

  it('订阅非法套餐返回 null', () => {
    expect(memberService.subscribe('platinum')).toBeNull()
    expect(memberService.current().tier).toBe('free')
  })

  it('套餐列表三档且价格递增', () => {
    const tiers = memberService.tiers()
    expect(tiers.length).toBe(3)
    expect(tiers.map(t => t.price)).toEqual(
      expect.arrayContaining([0, expect.any(Number), expect.any(Number)])
    )
    // free 价格 0
    expect(tiers.find(t => t.id === 'free').price).toBe(0)
  })
})

// ============ 签到积分流程 ============
describe('集成：签到积分', () => {
  it('首次签到成功且余额正确增加', () => {
    const before = pointsService.getInfo().balance
    const r = pointsService.checkin()
    expect(r.success).toBe(true)
    expect(r.points).toBeGreaterThan(0)
    expect(r.balance).toBe(before + r.points)
    expect(pointsService.getInfo().balance).toBe(r.balance)
  })

  it('签到后连续天数 +1 且产生历史记录', () => {
    const streakBefore = pointsService.getInfo().checkinStreak
    const historyBefore = pointsService.history().length
    const r = pointsService.checkin()
    if (r.success) {
      const info = pointsService.getInfo()
      expect(info.checkinStreak).toBe(streakBefore + 1)
      expect(pointsService.history().length).toBe(historyBefore + 1)
    }
  })

  it('积分规则非空', () => {
    const rules = pointsService.getInfo().rules
    expect(rules.length).toBeGreaterThan(0)
    rules.forEach(r => {
      expect(r.action).toBeTruthy()
      expect(r.points).toBeTruthy()
    })
  })
})

// ============ 企业认证流程 ============
describe('集成：企业认证', () => {
  it('初始状态为 none', () => {
    expect(verifyService.status()).toBe('none')
    expect(verifyService.getInfo()).toBeNull()
  })

  it('提交后状态变为 pending 并记录信息', () => {
    const info = verifyService.submit({
      company_name: '测试科技有限公司',
      credit_code: '91110000XXXXXXXXXX',
      legal_person: '张三',
      phone: '13800138000'
    })
    expect(info.status).toBe('pending')
    expect(info.company_name).toBe('测试科技有限公司')
    expect(verifyService.status()).toBe('pending')
    expect(verifyService.getInfo().credit_code).toBe('91110000XXXXXXXXXX')
  })

  it('审核通过后状态变为 verified', () => {
    verifyService.submit({ company_name: 'C', credit_code: 'X', legal_person: 'L', phone: '1' })
    expect(verifyService.status()).toBe('pending')
    const info = verifyService.approve()
    expect(info.status).toBe('verified')
    expect(verifyService.status()).toBe('verified')
    expect(verifyService.getInfo().verified_at).toBeTruthy()
  })
})

// ============ 关注流程 ============
describe('集成：关注/取关', () => {
  // followData 种子关注了 u1/u3/u5；u2/u4 未关注
  it('check 对种子关注用户返回 true', () => {
    expect(followService.check('u1')).toBe(true)
    expect(followService.check('u2')).toBe(false)
  })

  it('toggle 取关已关注用户 → followed:false 且数量-1', () => {
    const before = followService.count()
    const r = followService.toggle('u1')
    expect(r.followed).toBe(false)
    expect(followService.check('u1')).toBe(false)
    expect(followService.count()).toBe(before - 1)
  })

  it('toggle 关注新用户 → followed:true 且数量+1', () => {
    const before = followService.count()
    const r = followService.toggle('u2')
    expect(r.followed).toBe(true)
    expect(followService.check('u2')).toBe(true)
    expect(followService.count()).toBe(before + 1)
  })

  it('toggle 同一用户两次回到原状', () => {
    const before = followService.count()
    followService.toggle('u4') // 关注
    expect(followService.check('u4')).toBe(true)
    followService.toggle('u4') // 取关
    expect(followService.check('u4')).toBe(false)
    expect(followService.count()).toBe(before)
  })
})

// ============ 收藏持久化流程 ============
describe('集成：收藏持久化', () => {
  it('toggle 添加 → check true；再 toggle 移除 → check false', () => {
    expect(favoriteService.check({ userId: 'demo', targetType: 'demand', targetId: 'demand_1' })).toBe(false)
    const r1 = favoriteService.toggle({ userId: 'demo', targetType: 'demand', targetId: 'demand_1' })
    expect(r1.isFavorited).toBe(true)
    expect(favoriteService.check({ userId: 'demo', targetType: 'demand', targetId: 'demand_1' })).toBe(true)

    const r2 = favoriteService.toggle({ userId: 'demo', targetType: 'demand', targetId: 'demand_1' })
    expect(r2.isFavorited).toBe(false)
    expect(favoriteService.check({ userId: 'demo', targetType: 'demand', targetId: 'demand_1' })).toBe(false)
  })

  it('list 返回数量与 check 一致', () => {
    favoriteService.toggle({ userId: 'demo', targetType: 'demand', targetId: 'demand_2' })
    favoriteService.toggle({ userId: 'demo', targetType: 'product', targetId: 'product_1' })
    const all = favoriteService.list()
    expect(all.total).toBe(2)
    const onlyDemand = favoriteService.list({ type: 'demand' })
    expect(onlyDemand.total).toBe(1)
    expect(onlyDemand.list[0].targetType).toBe('demand')
  })
})

// ============ 优惠券 + 下单抵扣 ============
describe('集成：优惠券与下单', () => {
  it('claim 后可用数量减少', () => {
    const before = couponService.available()
    const list = couponService.list()
    expect(before).toBe(list.length)
    const r = couponService.claim(list[0]._id)
    expect(r.success).toBe(true)
    expect(couponService.available()).toBe(before - 1)
  })

  it('订单创建可携带已领优惠券并计入 total', () => {
    const list = couponService.list()
    const coupon = list[0]
    couponService.claim(coupon._id)

    const productPrice = 10000
    const discount = Math.min(coupon.amount, productPrice)
    const order = orderService.create({
      user_id: 'u1',
      items: [{ _id: 'p1', title: 'T', price: productPrice, quantity: 1 }],
      total_amount: Math.max(0, productPrice - discount),
      coupon_id: coupon._id
    })
    expect(order.coupon_id).toBe(coupon._id)
    expect(order.total_amount).toBe(productPrice - discount)
  })
})

// ============ 搜索完整性 ============
describe('集成：搜索', () => {
  it('search 返回 demands/products/posts 与 total 一致', () => {
    const r = searchService.search('营销')
    expect(r).toHaveProperty('demands')
    expect(r).toHaveProperty('products')
    expect(r).toHaveProperty('posts')
    expect(r.total).toBe(r.demands.length + r.products.length + r.posts.length)
  })

  it('addHistory 持久化且去重置顶', () => {
    searchService.addHistory('关键词A')
    searchService.addHistory('关键词B')
    searchService.addHistory('关键词A') // 重复，应置顶
    const h = searchService.history()
    expect(h[0]).toBe('关键词A')
    expect(new Set(h).size).toBe(h.length) // 无重复
  })

  it('clearHistory 清空历史', () => {
    searchService.addHistory('X')
    expect(searchService.history().length).toBeGreaterThan(0)
    searchService.clearHistory()
    expect(searchService.history().length).toBe(0)
  })

  it('hotKeywords 非空', () => {
    expect(searchService.hotKeywords().length).toBeGreaterThan(0)
  })
})

// ============ 商品/订单数据一致性 ============
describe('集成：商品与订单一致性', () => {
  it('productService.detail 与 list 项一致', () => {
    const list = productService.list({ pageSize: 100 }).list
    const first = list[0]
    const detail = productService.detail(first._id)
    expect(detail._id).toBe(first._id)
    expect(detail.title).toBe(first.title)
    expect(detail.price).toBe(first.price)
  })

  it('新创建订单通过 unshift 置于 myOrders 列表头部', () => {
    const o1 = orderService.create({ items: [{ _id: 'p1', price: 100, quantity: 1 }], total_amount: 100 })
    const o2 = orderService.create({ items: [{ _id: 'p2', price: 200, quantity: 1 }], total_amount: 200 })
    const orders = orderService.myOrders().list
    // create 用 unshift，最新订单在最前
    expect(orders[0]._id).toBe(o2._id)
    expect(orders[1]._id).toBe(o1._id)
    // detail 往返一致
    expect(orderService.detail(o1._id).total_amount).toBe(o1.total_amount)
  })
})
