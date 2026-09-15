import { describe, it, expect } from 'vitest'
import { buildAgentDraft, getAgentCategoryId, isAgentCategoryId, parseAgentBudget } from '@/utils/agent'

describe('Agent 结果映射', () => {
  it('自然语言分类映射到平台分类 ID', () => {
    expect(getAgentCategoryId('内容运营')).toBe('cat_06')
    expect(getAgentCategoryId('活动策划')).toBe('cat_09')
    expect(getAgentCategoryId('影视制作/企业宣传片')).toBe('cat_08')
    expect(getAgentCategoryId('美妆/社交媒体营销 小红书达人')).toBe('cat_07')
    expect(getAgentCategoryId('会展活动执行')).toBe('cat_09')
    expect(getAgentCategoryId('未识别')).toBe('')
    expect(getAgentCategoryId('')).toBe('')
    expect(isAgentCategoryId('cat_08')).toBe(true)
    expect(isAgentCategoryId('cat_99')).toBe(false)
  })

  it('预算文本转换为发布页元输入值', () => {
    expect(parseAgentBudget('5万元')).toEqual({ min: 50000, max: 50000 })
    expect(parseAgentBudget('5万-10万')).toEqual({ min: 50000, max: 100000 })
    expect(parseAgentBudget('5-10万元')).toEqual({ min: 50000, max: 100000 })
    expect(parseAgentBudget('未指定')).toBeNull()
  })

  it('生成可消费的发布草稿', () => {
    const draft = buildAgentDraft('找一支上海社区运营团队', {
      summary: '寻找内容运营合作伙伴',
      category: '内容运营',
      region: '上海',
      budget: '5万元',
      tags: ['社区运营'],
      keywords: ['内容团队']
    }, 'agent_test_session_001')

    expect(draft).toMatchObject({
      title: '寻找内容运营合作伙伴',
      region: '上海',
      category_id: 'cat_06',
      quote_type: 'self',
      budgetMin: '50000',
      budgetMax: '50000',
      description: '找一支上海社区运营团队',
      agent_context: {
        source: 'agent',
        session_id: 'agent_test_session_001',
        missing: [],
        questions: []
      }
    })
    expect(draft.tags).toEqual(['社区运营', '内容团队'])
  })

  it('优先使用后端返回的稳定分类 ID', () => {
    const draft = buildAgentDraft('找一支上海团队', {
      summary: '寻找服务团队',
      category: '未识别',
      category_id: 'cat_08'
    })

    expect(draft.category_id).toBe('cat_08')
    expect(draft.category_name).toBe('视频制作')
  })
})
