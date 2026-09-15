import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('账户与结算真实状态', () => {
  it('账户页从当前账号读取信用、券、积分、关注和社群数据', () => {
    const source = read('src/pages/user/index.vue')
    expect(source).toContain('bridge.review.userCreditScore()')
    expect(source).toContain('bridge.points.getInfo()')
    expect(source).toContain('bridge.coupon.available()')
    expect(source).toContain('bridge.follow.count()')
    expect(source).toContain('bridge.network.overview()')
  })

  it('结算不再在前端伪造扣券或扣积分', () => {
    const source = read('src/pages/mall/order-confirm.vue')
    expect(source).not.toContain('bridge.coupon.claim(selectedCoupon.value._id)')
    expect(source).not.toContain("user_id: 'demo_user_001'")
    expect(source).toContain('points_used: pointsDiscount.value')
    expect(source).toContain('服务端在创建订单的同一个事务中核销')
  })

  it('活动任务和倒计时根据账号状态、活动数据生成', () => {
    const source = read('src/pages/campaign/index.vue')
    expect(source).toContain('bridge.points.getInfo()')
    expect(source).toContain('bridge.demand.myDemands()')
    expect(source).toContain('bridge.lead.inbox()')
    expect(source).toContain('bridge.network.overview()')
    expect(source).not.toContain("{ h: '08', m: '32', s: '45' }")
    expect(source).not.toContain('tasks.value[i].done = true')
  })
})
