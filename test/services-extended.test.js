import { describe, it, expect, beforeEach } from 'vitest'
import {
  favoriteService,
  verifyService,
  memberService,
  chatService,
  couponService,
  pointsService,
  followService
} from '@/mock/service'

beforeEach(() => {
  globalThis.__resetStore()
})

// ============ 收藏 ============
describe('favoriteService - 收藏', () => {
  it('初始状态未收藏', () => {
    expect(favoriteService.check({ targetType: 'demand', targetId: 'demand_1' })).toBe(false)
  })

  it('toggle 添加收藏后应返回已收藏', () => {
    const r = favoriteService.toggle({ userId: 'u1', targetType: 'demand', targetId: 'demand_1' })
    expect(r.isFavorited).toBe(true)
    expect(favoriteService.check({ targetType: 'demand', targetId: 'demand_1' })).toBe(true)
  })

  it('再次 toggle 应取消收藏', () => {
    favoriteService.toggle({ userId: 'u1', targetType: 'demand', targetId: 'demand_1' })
    const r = favoriteService.toggle({ userId: 'u1', targetType: 'demand', targetId: 'demand_1' })
    expect(r.isFavorited).toBe(false)
    expect(favoriteService.check({ targetType: 'demand', targetId: 'demand_1' })).toBe(false)
  })

  it('list 支持按类型筛选', () => {
    favoriteService.toggle({ userId: 'u1', targetType: 'demand', targetId: 'd1' })
    favoriteService.toggle({ userId: 'u1', targetType: 'product', targetId: 'p1' })
    expect(favoriteService.list({ type: 'demand' }).total).toBe(1)
    expect(favoriteService.list({ type: 'product' }).total).toBe(1)
    expect(favoriteService.list().total).toBe(2)
  })
})

// ============ 企业认证 ============
describe('verifyService - 企业认证', () => {
  it('初始状态为 none', () => {
    expect(verifyService.status()).toBe('none')
    expect(verifyService.getInfo()).toBeNull()
  })

  it('提交后状态变为 pending', () => {
    const data = { company_name: '测试公司', credit_code: '123456789012345678', legal_person: '张三', phone: '13800138000' }
    verifyService.submit(data)
    expect(verifyService.status()).toBe('pending')
    const info = verifyService.getInfo()
    expect(info.company_name).toBe('测试公司')
    expect(info.status).toBe('pending')
  })

  it('approve 后状态变为 verified', () => {
    verifyService.submit({ company_name: 'A公司', credit_code: '123456789012345678' })
    verifyService.approve()
    expect(verifyService.status()).toBe('verified')
    expect(verifyService.getInfo().verified_at).toBeTruthy()
  })
})

// ============ 会员 ============
describe('memberService - 会员', () => {
  it('默认为普通会员', () => {
    expect(memberService.current().tier).toBe('free')
  })

  it('tiers 返回三档套餐', () => {
    const tiers = memberService.tiers()
    expect(tiers.length).toBe(3)
    expect(tiers.map(t => t.id)).toEqual(['free', 'pro', 'enterprise'])
  })

  it('subscribe 后当前会员更新', () => {
    const info = memberService.subscribe('pro')
    expect(info.tier).toBe('pro')
    expect(memberService.current().tier).toBe('pro')
  })

  it('pro 套餐价格应为 299 元', () => {
    const pro = memberService.tiers().find(t => t.id === 'pro')
    expect(pro.price).toBe(29900)
  })
})

// ============ 客服IM ============
describe('chatService - 客服会话', () => {
  it('list 返回初始消息（非空）', () => {
    const list = chatService.list()
    expect(list.length).toBeGreaterThan(0)
  })

  it('send 后消息数增加', () => {
    const before = chatService.list().length
    chatService.send('你好')
    const after = chatService.list().length
    expect(after).toBe(before + 1)
    // 新消息应是用户发送
    const last = chatService.list()[after - 1]
    expect(last.from).toBe('user')
    expect(last.content).toBe('你好')
  })

  it('reply 后增加一条 service 消息', () => {
    const before = chatService.list().length
    chatService.reply()
    const last = chatService.list()[chatService.list().length - 1]
    expect(last.from).toBe('service')
    expect(chatService.list().length).toBe(before + 1)
  })
})

// ============ 优惠券 ============
describe('couponService - 优惠券', () => {
  it('list 只返回 available 状态', () => {
    const list = couponService.list()
    list.forEach(c => expect(c.status).toBe('available'))
  })

  it('claim 成功后券状态变为 claimed', () => {
    const r = couponService.claim('c1')
    expect(r.success).toBe(true)
    // c1 已被领取，再次查询 list 不应包含
    const list = couponService.list()
    expect(list.find(c => c._id === 'c1')).toBeUndefined()
  })

  it('claim 不存在的券应失败', () => {
    const r = couponService.claim('not_exist')
    expect(r.success).toBe(false)
  })

  it('available 返回可用券数量', () => {
    expect(couponService.available()).toBeGreaterThanOrEqual(0)
    expect(typeof couponService.available()).toBe('number')
  })
})

// ============ 积分 ============
describe('pointsService - 积分签到', () => {
  it('getInfo 返回积分数据', () => {
    const info = pointsService.getInfo()
    expect(info).toHaveProperty('balance')
    expect(info).toHaveProperty('history')
    expect(info).toHaveProperty('checkinStreak')
  })

  it('签到应增加积分并返回成功', () => {
    const before = pointsService.getInfo().balance
    const r = pointsService.checkin()
    expect(r.success).toBe(true)
    expect(r.points).toBeGreaterThan(0)
    expect(pointsService.getInfo().balance).toBeGreaterThan(before)
  })

  it('重复签到应返回失败', () => {
    pointsService.checkin()
    const r = pointsService.checkin()
    expect(r.success).toBe(false)
  })

  it('rules 返回签到规则', () => {
    const rules = pointsService.rules()
    expect(Array.isArray(rules)).toBe(true)
    expect(rules.length).toBeGreaterThan(0)
  })
})

// ============ 关注 ============
describe('followService - 关注', () => {
  it('初始有关注数据', () => {
    expect(followService.count()).toBeGreaterThan(0)
  })

  it('check 已关注的用户返回 true', () => {
    const firstId = followService.list()[0].user.id
    expect(followService.check(firstId)).toBe(true)
  })

  it('toggle 取消已关注的用户', () => {
    const before = followService.count()
    const firstId = followService.list()[0].user.id
    const r = followService.toggle(firstId)
    expect(r.followed).toBe(false)
    expect(followService.count()).toBe(before - 1)
  })

  it('toggle 重新关注已取消的用户', () => {
    const firstId = followService.list()[0].user.id
    followService.toggle(firstId) // 取消
    const r = followService.toggle(firstId) // 重新关注
    expect(r.followed).toBe(true)
  })
})
