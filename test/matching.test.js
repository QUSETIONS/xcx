import { describe, it, expect } from 'vitest'
import { scoreDemandMatch, scoreProviderMatch } from '@/utils/matching'

describe('Agent 匹配评分', () => {
  it('相同分类、地区、关键词和预算的需求得分更高', () => {
    const agentResult = {
      category_id: 'cat_06',
      region: '上海',
      budget: '5万元',
      tags: ['社区运营'],
      keywords: ['内容团队']
    }
    const matched = scoreDemandMatch({
      category_id: 'cat_06',
      category_name: '代运营',
      region: '上海',
      title: '社区运营内容团队',
      description: '寻找有社区运营经验的服务团队',
      budget_min: 5000000,
      budget_max: 6000000,
      lead_count: 10,
      view_count: 1000
    }, agentResult)
    const unrelated = scoreDemandMatch({
      category_id: 'cat_09',
      category_name: '活动策划',
      region: '北京',
      title: '展会活动执行',
      description: '线下活动策划与执行',
      budget_min: 1000000,
      budget_max: 2000000
    }, agentResult)

    expect(matched.score).toBeGreaterThan(unrelated.score)
    expect(matched.breakdown).toMatchObject({ category: 35, region: 20, budget: 15 })
    expect(matched.score).toBeLessThanOrEqual(99)
  })

  it('服务商评分包含匹配理由并优先考虑业务相关性', () => {
    const demand = {
      category_id: 'cat_06',
      region: '上海',
      title: '社区运营内容团队',
      description: '需要社区运营和内容增长服务',
      tags: ['社区运营'],
      budget_min: 5000000,
      budget_max: 6000000
    }
    const matched = scoreProviderMatch({
      category_id: 'cat_06',
      category_name: '代运营',
      region: '上海',
      avg_price: 55000,
      rating: 4.8,
      response_rate: 95,
      deal_count: 120,
      verified: true,
      tags: ['社区运营', '内容增长'],
      intro: '专注社区运营和内容增长'
    }, demand)
    const unrelated = scoreProviderMatch({
      category_id: 'cat_09',
      category_name: '活动策划',
      region: '北京',
      avg_price: 10000,
      rating: 5,
      response_rate: 99,
      deal_count: 200,
      verified: true,
      tags: ['展会执行'],
      intro: '专注线下活动执行'
    }, demand)

    expect(matched.score).toBeGreaterThan(unrelated.score)
    expect(matched.reasons).toEqual(expect.arrayContaining(['分类匹配', '地区匹配', '预算区间相符', '已认证']))
    expect(matched.breakdown.keywords).toBeGreaterThan(0)
  })
})

