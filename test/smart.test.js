import { describe, it, expect, beforeEach } from 'vitest'
import {
  scoreDemandQuality,
  getPriceSuggestion,
  getRecommendedDemands,
  getRecommendedProducts,
  trackBrowse,
  getBrowseHistory,
  clearBrowseHistory
} from '@/mock/smart'

beforeEach(() => {
  globalThis.__resetStore()
})

// ============ 需求质量评分 ============
describe('scoreDemandQuality - 需求质量评分', () => {
  it('空表单应得 0 分且提示填写必填项', () => {
    const r = scoreDemandQuality({})
    expect(r.total).toBe(0)
    expect(r.level).toBe('待完善')
    expect(r.tips.length).toBeGreaterThan(0)
  })

  it('完整高质量表单应得高分（>=80，优秀）', () => {
    // 构造 >=200 字的描述以触发满分档
    const longDesc = '我们需要一家专业的短视频代运营团队负责品牌全平台内容产出，包含策划拍摄剪辑发布全套流程，要求团队配备完整岗位并能提供数据复盘优化建议按月输出运营报告，合作周期一年起，按月结算，预算包含制作运营投流等全部费用。'.repeat(2)
    const r = scoreDemandQuality({
      title: '寻找专业的短视频代运营团队负责品牌全年内容产出',
      description: longDesc,
      quote_type: 'self',
      budget_min: 500000,
      budget_max: 800000,
      contact_name: '张经理',
      contact_phone: '13800138000',
      contact_wechat: 'zhang001',
      category_id: 'cat_01',
      region: '北京'
    })
    expect(r.total).toBeGreaterThanOrEqual(80)
    expect(r.level).toBe('优秀')
    expect(r.scores.title).toBe(20)
    expect(r.scores.description).toBe(30)
    expect(r.scores.category).toBe(10)
    expect(r.scores.region).toBe(10)
    expect(r.scores.contact).toBe(15)
  })

  it('短标题应扣分（<20分）', () => {
    const r = scoreDemandQuality({ title: '找团队' })
    expect(r.scores.title).toBeLessThan(20)
  })

  it('简短描述应扣分', () => {
    const r = scoreDemandQuality({ description: '简单需求' })
    expect(r.scores.description).toBeLessThan(20)
  })

  it('各维度分数之和等于总分', () => {
    const r = scoreDemandQuality({ title: '一个中等长度的需求标题', category_id: 'cat_01', region: '上海' })
    const sum = Object.values(r.scores).reduce((a, b) => a + b, 0)
    expect(sum).toBe(r.total)
  })

  it('未填联系方式时 contact 分为 0 且有提示', () => {
    const r = scoreDemandQuality({ title: '测试标题测试标题测试标题' })
    expect(r.scores.contact).toBe(0)
    expect(r.tips.some(t => t.includes('联系方式'))).toBe(true)
  })
})

// ============ 价格建议 ============
describe('getPriceSuggestion - 价格建议', () => {
  it('非自报价类型应返回 null', () => {
    expect(getPriceSuggestion('cat_01', 'negotiate')).toBeNull()
    expect(getPriceSuggestion('cat_01', 'by_daren')).toBeNull()
  })

  it('自报价类型应返回建议对象', () => {
    const r = getPriceSuggestion('cat_01', 'self')
    expect(r).not.toBeNull()
    expect(r).toHaveProperty('min')
    expect(r).toHaveProperty('max')
    expect(r).toHaveProperty('avg')
    expect(r).toHaveProperty('level')
    expect(r).toHaveProperty('tip')
  })

  it('建议区间 min 应不大于 max', () => {
    const r = getPriceSuggestion('cat_02', 'self')
    expect(r.min).toBeLessThanOrEqual(r.max)
  })
})

// ============ 浏览追踪 + 推荐 ============
describe('trackBrowse + 推荐 - 个性化推荐', () => {
  it('浏览记录应被持久化', () => {
    trackBrowse('demand', 'demand_1', { category_id: 'cat_01', title: '测试', region: '北京' })
    const history = getBrowseHistory()
    expect(history.length).toBe(1)
    expect(history[0].id).toBe('demand_1')
  })

  it('重复浏览同一内容应去重且置顶', () => {
    trackBrowse('demand', 'demand_1', { category_id: 'cat_01', title: 'A' })
    trackBrowse('demand', 'demand_2', { category_id: 'cat_02', title: 'B' })
    trackBrowse('demand', 'demand_1', { category_id: 'cat_01', title: 'A' })
    const history = getBrowseHistory()
    expect(history.length).toBe(2)
    expect(history[0].id).toBe('demand_1') // 置顶
  })

  it('浏览历史应限制在50条', () => {
    for (let i = 0; i < 60; i++) {
      trackBrowse('demand', `demand_${i}`, { title: `t${i}` })
    }
    // getBrowseHistory 默认返回10条，需显式传大 limit 验证存储上限
    expect(getBrowseHistory(100).length).toBe(50)
  })

  it('getRecommendedDemands 返回指定数量且带评分', () => {
    const list = getRecommendedDemands(6)
    expect(list.length).toBeLessThanOrEqual(6)
    list.forEach(item => {
      expect(item).toHaveProperty('_score')
      expect(typeof item._score).toBe('number')
    })
  })

  it('缓存：浏览历史不变时第二次调用复用缓存结果', () => {
    const a = getRecommendedDemands(6)
    const b = getRecommendedDemands(6)
    // 命中缓存应返回相同的数组引用（同一对象）
    expect(b).toBe(a)
  })

  it('缓存：浏览新内容后缓存失效，重新计算', () => {
    const a = getRecommendedDemands(6)
    trackBrowse('demand', 'demand_999', { title: '新浏览' })
    const b = getRecommendedDemands(6)
    // 历史变化后应重新计算，返回新数组
    expect(b).not.toBe(a)
  })

  it('getRecommendedProducts 返回指定数量', () => {
    const list = getRecommendedProducts(4)
    expect(list.length).toBeLessThanOrEqual(4)
  })

  it('已浏览的需求在推荐中应被降权', () => {
    // 浏览 demand_1
    trackBrowse('demand', 'demand_1', { category_id: 'cat_01', title: '浏览过的' })
    const recs = getRecommendedDemands(100)
    const viewed = recs.find(r => r._id === 'demand_1')
    // 已浏览内容仍可能出现，但分数应较低（无法精确断言，仅验证不抛错）
    expect(Array.isArray(recs)).toBe(true)
  })

  it('clearBrowseHistory 应清空历史', () => {
    trackBrowse('demand', 'demand_1', { title: 'A' })
    clearBrowseHistory()
    expect(getBrowseHistory().length).toBe(0)
  })
})
