import { describe, it, expect } from 'vitest'
import { normalizeAgentResult, normalizeProviderMatches, scoreAgentQuality } from '@/api/contracts'

describe('Agent 前后端契约归一化', () => {
  it('保留完整适配分析，不能在160或240字截断结尾风险说明', () => {
    const reply = '适配性分析。'.repeat(60) + '预算与联系人尚未公开。'
    expect(normalizeAgentResult({ reply }).reply).toBe(reply)
  })
  it('把不完整的 Agent 返回收敛到 schema_version=1', () => {
    const result = normalizeAgentResult({
      summary: '测试需求',
      confidence: 88,
      tags: ['内容', '', 3],
      keywords: '社区运营, 上海'
    })

    expect(result).toMatchObject({
      schema_version: 1,
      source: 'unknown',
      summary: '测试需求',
      category: '未识别',
      category_id: 'cat_06',
      confidence: 0.88,
      tags: ['内容', '3'],
      keywords: ['社区运营', '上海']
    })
    expect(Array.isArray(result.questions)).toBe(true)
    expect(Array.isArray(result.missing)).toBe(true)
    expect(result.quality).toMatchObject({ level: 'needs_more' })
    expect(result.quality.gaps).toContain('服务地区')
  })

  it('保留对话意图与推荐准入字段', () => {
    const result = normalizeAgentResult({
      interaction_intent: 'recommendation_request',
      intent_confidence: 0.92,
      conversation_stage: 'recommending',
      recommendation_ready: true,
      recommendation_reason: '按活动策划，结合上海和预算排序推荐。',
      next_action: '查看推荐团队'
    })
    expect(result.interaction_intent).toBe('recommendation_request')
    expect(result.intent_confidence).toBe(0.92)
    expect(result.conversation_stage).toBe('recommending')
    expect(result.recommendation_ready).toBe(true)
    expect(result.next_action).toBe('查看推荐团队')
  })

  it('把需求质量与模型 confidence 分开计算', () => {
    const quality = scoreAgentQuality({
      summary: '上海活动执行团队，负责现场统筹、媒体沟通和复盘交付',
      category: '活动策划',
      category_id: 'cat_09',
      region: '上海',
      budget: '5万元',
      start_time: '2026年9月',
      tags: ['发布会', '现场执行'],
      keywords: ['媒体沟通']
    })

    expect(quality.score).toBeGreaterThanOrEqual(80)
    expect(quality.level).toBe('ready')
    expect(quality.gaps).toEqual([])
  })

  it('乙方按能力、城市和项目偏好评分，不强制填写采购预算', () => {
    const quality = scoreAgentQuality({
      summary: '擅长上海品牌活动和城市路演执行，寻找长期项目',
      category: '活动策划',
      category_id: 'cat_09',
      region: '上海',
      budget: '未指定',
      start_time: '未指定',
      tags: ['品牌活动', '现场执行'],
      keywords: ['城市路演', '发布会']
    }, { mode: 'service_provider_search' })

    expect(quality.level).toBe('ready')
    expect(quality.gaps).not.toContain('预算范围')
    expect(quality.gaps).not.toContain('启动时间')
    expect(quality.next_step).toContain('查看匹配项目')
  })

  it('把带补充说明的地区归一化为可筛选主值', () => {
    expect(normalizeAgentResult({
      region: '长沙（要求服务可覆盖北京以外地区）'
    }).region).toBe('长沙')
    expect(normalizeAgentResult({ region: '北京以外地区' }).region).toBe('未指定')
    expect(normalizeAgentResult({ region: '湖南长沙' }).region).toBe('长沙')
  })

  it('保留基础整理标记，服务异常时前端仍可继续发布', () => {
    expect(normalizeAgentResult({
      source: 'local-fallback',
      fallback: true,
      summary: '上海找品牌设计'
    })).toMatchObject({
      source: 'local-fallback',
      fallback: true,
      summary: '上海找品牌设计'
    })
  })

  it('保留 Agent 同步返回的团队和相关项目匹配结果', () => {
    const result = normalizeAgentResult({
      summary: '上海品牌发布需求',
      matches: {
        meta: { strategy: 'weighted-signal-v2' },
        teams: [{ id: 'provider_1', name: '青岚品牌策略', rating: 4.9, match_score: 91, match_reasons: ['分类匹配'], contact_user_id: 'user_team_01', contact_ready: true }],
        demands: [{ id: 'demand_1', title: '品牌全案策划需求', match_score: 83, match_reasons: ['地区匹配'] }]
      }
    })

    expect(result.matches.teams[0]).toMatchObject({
      _id: 'provider_1',
      match_percent: '91%',
      contact_user_id: 'user_team_01',
      contact_ready: true
    })
    expect(result.matches.demands[0]).toMatchObject({ _id: 'demand_1', match_percent: '83%' })
    expect(result.matches.meta.strategy).toBe('weighted-signal-v2')
  })

  it('保留服务端按等级返回的候选，安全上限为20个', () => {
    const result = normalizeAgentResult({
      matches: {
        teams: Array.from({ length: 8 }, (_, index) => ({
          id: `provider_${index + 1}`,
          name: `团队${index + 1}`,
          match_score: 90 - index
        })),
        demands: Array.from({ length: 8 }, (_, index) => ({
          id: `demand_${index + 1}`,
          title: `项目${index + 1}`,
          match_score: 88 - index
        }))
      }
    })

    expect(result.matches.teams).toHaveLength(8)
    expect(result.matches.demands).toHaveLength(8)
    expect(result.matches.teams.at(-1)).toMatchObject({ _id: 'provider_8' })
    expect(result.matches.demands.at(-1)).toMatchObject({ _id: 'demand_8' })
    const large = normalizeAgentResult({ matches: { teams: Array.from({ length: 25 }, (_, i) => ({ _id: `team_${i}` })), demands: Array.from({ length: 25 }, (_, i) => ({ _id: `demand_${i}` })) } })
    expect(large.matches.teams).toHaveLength(20)
    expect(large.matches.demands).toHaveLength(20)
  })

  it('把 Mock/真实服务商结果收敛为同一分数契约', () => {
    const list = normalizeProviderMatches([{
      name: '测试服务商',
      match_score: 120,
      match_percent: '120%',
      match_reasons: ['分类匹配', '', 3]
    }])

    expect(list[0]).toMatchObject({
      name: '测试服务商',
      match_score: 99,
      match_percent: '99%',
      match_reasons: ['分类匹配', '3'],
      match_breakdown: {}
    })
  })
})
