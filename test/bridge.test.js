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

  it('补缺方法可用（demand.update / lead 收发件箱 / favorite.check / user.demoLogin / order.detail）', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const created = await bridge.demand.create({ title: 'x', created_by: 'demo_user_001' })
    expect((await bridge.demand.update(created._id, { title: 'y' })).title).toBe('y')
    expect((await bridge.lead.myLeads()).total).toBeGreaterThanOrEqual(0)
    expect((await bridge.lead.inbox()).total).toBeGreaterThanOrEqual(0)
    expect(await bridge.favorite.check({ targetType: 'demand', targetId: 'demand_1' })).toBe(false)
    expect(await bridge.user.demoLogin('admin')).toBeTruthy()
    expect(await bridge.order.detail('order_1')).toBeTruthy()
  })

  it('消息幂等键在 mock 与真实桥接层保持一致', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const firstDirect = await bridge.network.sendDirectMessage('user_team_11', '重复发送测试', [], 'direct_retry_mock_1')
    const replayedDirect = await bridge.network.sendDirectMessage('user_team_11', '重复发送测试', [], 'direct_retry_mock_1')
    expect(replayedDirect.id).toBe(firstDirect.id)
    expect(replayedDirect.idempotent).toBe(true)

    const firstGroup = await bridge.network.sendGroupMessage('network_community_growth', '重复群消息测试', 'group_retry_mock_1')
    const replayedGroup = await bridge.network.sendGroupMessage('network_community_growth', '重复群消息测试', 'group_retry_mock_1')
    expect(replayedGroup.id).toBe(firstGroup.id)
    expect(replayedGroup.idempotent).toBe(true)
  })

  it('发布需求后返回的 ID 可直接承接详情页', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const created = await bridge.demand.create({ title: '发布后详情测试', created_by: 'demo_user_001' })
    const detail = await bridge.demand.detail(created._id)
    expect(created._id).toBeTruthy()
    expect(detail._id).toBe(created._id)
  })

  it('Agent 需求整理返回结构化结果', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const result = await bridge.agent.organize({ text: '找一支有社区运营经验的内容团队' })
    expect(result.summary).toContain('内容运营')
    expect(result.tags.length).toBeGreaterThan(0)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.schema_version).toBe(1)
    expect(result.source).toBe('mock')
  })

  it('Agent 草稿带入事件在 mock 模式也保持统一契约', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const result = await bridge.agent.telemetry({ event_type: 'draft_applied', session_id: 'bridge_test_session' })
    expect(result.saved).toBe(true)
    expect(result.event.event_type).toBe('draft_applied')
  })

  it('智能推荐与价格建议统一走 bridge.smart', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const demands = await bridge.smart.recommendedDemands(3)
    expect(demands.length).toBeLessThanOrEqual(3)
    expect(demands[0]).toHaveProperty('_score')
    expect(await bridge.smart.priceSuggestion('cat_01', 'negotiate')).toBeNull()
    expect(await bridge.smart.priceSuggestion('cat_01', 'self')).toHaveProperty('min')
  })

  it('服务商匹配返回统一的可解释字段', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const list = await bridge.match.providers({ category_id: 'cat_06', region: '上海', title: '社区运营' })
    expect(list.length).toBeGreaterThan(0)
    expect(list[0]).toHaveProperty('match_score')
    expect(list[0]).toHaveProperty('match_percent')
    expect(Array.isArray(list[0].match_reasons)).toBe(true)
    expect(list[0]).toHaveProperty('match_breakdown')
  })

  it('提案比较池支持 Agent 自动邀约和服务方收件箱', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const pool = await bridge.proposal.list('demand_1')
    expect(pool.list.length).toBeGreaterThanOrEqual(2)
    expect(pool.list[0]).toHaveProperty('proposal_score')
    const invited = await bridge.proposal.inviteMatches('demand_1', { limit: 6 })
    expect(invited.source).toBe('agent-match')
    expect(invited.total_invited).toBeGreaterThanOrEqual(pool.total)
    const inbox = await bridge.proposal.inbox()
    expect(inbox.list.length).toBeGreaterThan(0)
  })

  it('选定报价方案会直接建立协作室，并保留报价与里程碑', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const pool = await bridge.proposal.list('demand_1')
    const quoted = pool.list.find((item) => item.status === 'quoted')
    expect(quoted).toBeTruthy()
    const result = await bridge.proposal.decide(quoted._id, 'accepted')
    expect(result.deal_id).toBeTruthy()
    expect(result.entered_workspace).toBe(true)
    const workspace = await bridge.deal.workspace(result.deal_id)
    expect(workspace.demand_id).toBe(quoted.demand_id)
    expect(workspace.amount).toBe(quoted.quote_amount)
    expect(workspace.milestones.map((item) => item.title)).toEqual(quoted.milestones.map((item) => item.title))
  })

  it('保存筛选与新需求检查在 mock 分支可用', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const saved = await bridge.search.save({ name: '短视频机会', keyword: '短视频' })
    expect(saved._id).toBeTruthy()
    expect((await bridge.search.saved()).length).toBe(1)
    const checked = await bridge.search.checkSaved(saved._id)
    expect(checked.total).toBeGreaterThan(0)
    expect((await bridge.search.removeSaved(saved._id)).deleted).toBe(true)
  })

  it('服务方审核队列在 mock 分支可查询并保持审核状态', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const pending = await bridge.admin.providers.list({ status: 'pending' })
    expect(pending.total).toBeGreaterThan(0)
    const item = pending.list[0]
    const reviewed = await bridge.admin.providers.review(item._id, 'rejected', '请补充交付案例。')
    expect(reviewed.verification).toBe('rejected')
    expect((await bridge.admin.providers.list({ status: 'rejected' })).list.some((entry) => entry._id === item._id)).toBe(true)
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

  it('lead.inbox → GET /lead/inbox', async () => {
    await withRealHttp(async ({ bridge, get }) => {
      await bridge.lead.inbox({ page: 1, pageSize: 20 })
      expect(get).toHaveBeenCalledWith('/lead/inbox', { page: 1, pageSize: 20 })
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

  it('resource.download → 带幂等请求头且关闭写请求重试', async () => {
    await withRealHttp(async ({ bridge, post }) => {
      await bridge.resource.download('resource_1', { requestKey: 'download_retry_1' })
      expect(post).toHaveBeenCalledWith('/resource/resource_1/download', undefined, {
        header: { 'Idempotency-Key': 'download_retry_1' },
        retry: 0
      })
    })
  })

  it('network.sendGroupMessage → 带客户端幂等键且关闭写请求重试', async () => {
    await withRealHttp(async ({ bridge, post }) => {
      await bridge.network.sendGroupMessage('group_1', '测试群消息', 'group_retry_1')
      expect(post).toHaveBeenCalledWith('/network/groups/group_1/messages', {
        content: '测试群消息',
        client_message_id: 'group_retry_1'
      }, { retry: 0 })
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

  it('agent.organize → POST /agent/organize', async () => {
    await withRealHttp(async ({ bridge, post }) => {
      const result = await bridge.agent.organize({ text: '找内容团队' })
      expect(post).toHaveBeenCalledWith('/agent/organize', { text: '找内容团队' }, { timeout: 70000, retry: 0 })
      expect(result.schema_version).toBe(1)
      expect(result.source).toBe('unknown')
    })
  })

  it('agent.telemetry → POST /agent/events', async () => {
    await withRealHttp(async ({ bridge, post }) => {
      await bridge.agent.telemetry({ event_type: 'draft_applied', session_id: 'real_agent_session' })
      expect(post).toHaveBeenCalledWith('/agent/events', { event_type: 'draft_applied', session_id: 'real_agent_session' })
    })
  })

  it('proposal endpoints → /proposal/*', async () => {
    await withRealHttp(async ({ bridge, get, post, put }) => {
      await bridge.proposal.list('demand_1')
      expect(get).toHaveBeenCalledWith('/proposal/demand/demand_1')
      await bridge.proposal.inviteMatches('demand_1', { limit: 6, message: '请提交方案' })
      expect(post).toHaveBeenCalledWith('/proposal/demand/demand_1/invite-matches', { limit: 6, message: '请提交方案' })
      await bridge.proposal.view('proposal_1')
      expect(post).toHaveBeenCalledWith('/proposal/proposal_1/view')
      await bridge.proposal.respond('proposal_1', { status: 'quoted', quote_amount: 68000 })
      expect(put).toHaveBeenCalledWith('/proposal/proposal_1/respond', { status: 'quoted', quote_amount: 68000 })
      await bridge.proposal.decide('proposal_1', 'accepted')
      expect(put).toHaveBeenCalledWith('/proposal/proposal_1/decision', { decision: 'accepted' })
    })
  })

  it('deal workspace endpoints → /deal/*', async () => {
    await withRealHttp(async ({ bridge, get, post, put, del }) => {
      await bridge.deal.agenda()
      expect(get).toHaveBeenCalledWith('/deal/agenda')
      await bridge.deal.detail('deal_1')
      expect(get).toHaveBeenCalledWith('/deal/deal_1')
      await bridge.deal.workspace('deal_1')
      expect(get).toHaveBeenCalledWith('/deal/deal_1/workspace')
      await bridge.deal.sendMessage('deal_1', { content: '项目讨论', client_message_id: 'workspace_retry_1' })
      expect(post).toHaveBeenCalledWith('/deal/deal_1/messages', { content: '项目讨论', client_message_id: 'workspace_retry_1' })
      await bridge.deal.addMember('deal_1', { user_id: 'user_2', role: 'advisor' })
      expect(post).toHaveBeenCalledWith('/deal/deal_1/members', { user_id: 'user_2', role: 'advisor' })
      await bridge.deal.removeMember('deal_1', 'member_2')
      expect(del).toHaveBeenCalledWith('/deal/deal_1/members/member_2')
      await bridge.deal.addTask('deal_1', { title: '确认验收方式' })
      expect(post).toHaveBeenCalledWith('/deal/deal_1/tasks', { title: '确认验收方式' })
      await bridge.deal.updateTask('deal_1', 'task_1', { status: 'done' })
      expect(put).toHaveBeenCalledWith('/deal/deal_1/tasks/task_1', { status: 'done' })
      await bridge.deal.addFile('deal_1', { attachment_id: 'attachment_1' })
      expect(post).toHaveBeenCalledWith('/deal/deal_1/files', { attachment_id: 'attachment_1' })
      await bridge.deal.addActivity('deal_1', { content: '已同步项目安排' })
      expect(post).toHaveBeenCalledWith('/deal/deal_1/activities', { content: '已同步项目安排' })
      await bridge.deal.addMilestone('deal_1', { title: '完成首轮交付', amount: 20000 })
      expect(post).toHaveBeenCalledWith('/deal/deal_1/milestones', { title: '完成首轮交付', amount: 20000 })
      await bridge.deal.updateMilestone('deal_1', 'milestone_1', 'completed')
      expect(put).toHaveBeenCalledWith('/deal/deal_1/milestones/milestone_1', { status: 'completed' })
    })
  })

  it('saved search endpoints → /search/saved/*', async () => {
    await withRealHttp(async ({ bridge, get, post, del }) => {
      await bridge.search.saved()
      expect(get).toHaveBeenCalledWith('/search/saved')
      await bridge.search.save({ name: '品牌机会', keyword: '品牌' })
      expect(post).toHaveBeenCalledWith('/search/saved', { name: '品牌机会', keyword: '品牌' })
      await bridge.search.checkSaved('saved_1')
      expect(post).toHaveBeenCalledWith('/search/saved/saved_1/check')
      await bridge.search.removeSaved('saved_1')
      expect(del).toHaveBeenCalledWith('/search/saved/saved_1')
    })
  })

  it('smart endpoints → GET /smart/*', async () => {
    await withRealHttp(async ({ bridge, get }) => {
      await bridge.smart.recommendedDemands(3)
      expect(get).toHaveBeenCalledWith('/smart/recommended-demands', { limit: 3 })
      await bridge.smart.recommendedProducts(2)
      expect(get).toHaveBeenCalledWith('/smart/recommended-products', { limit: 2 })
      await bridge.smart.priceSuggestion('cat_01', 'self')
      expect(get).toHaveBeenCalledWith('/smart/price-suggestion', { category_id: 'cat_01', quote_type: 'self' })
    })
  })

  it('provider review endpoints → /admin/providers/*', async () => {
    await withRealHttp(async ({ bridge, get, put }) => {
      await bridge.admin.providers.list({ status: 'pending', page: 1 })
      expect(get).toHaveBeenCalledWith('/admin/providers', { status: 'pending', page: 1 })
      await bridge.admin.providers.review('provider_1', 'verified', '资料完整')
      expect(put).toHaveBeenCalledWith('/admin/providers/provider_1/verification', { status: 'verified', note: '资料完整' })
    })
  })

  it('phone/email verification and password reset endpoints map to the real API', async () => {
    await withRealHttp(async ({ bridge, post }) => {
      await bridge.user.requestRegisterCode({ phone: '13700137000' })
      expect(post).toHaveBeenCalledWith('/auth/register/request-code', { phone: '13700137000' })
      await bridge.user.requestPasswordResetCode({ channel: 'phone', phone: '13800138000' })
      expect(post).toHaveBeenCalledWith('/auth/password-reset/request-code', { channel: 'phone', phone: '13800138000' })
      await bridge.user.resetPassword({ channel: 'phone', phone: '13800138000', code: '123456', password: 'Reset5678' })
      expect(post).toHaveBeenCalledWith('/auth/password-reset/confirm', { channel: 'phone', phone: '13800138000', code: '123456', password: 'Reset5678' })
      await bridge.user.requestEmailVerificationCode({ email: 'person@example.com' })
      expect(post).toHaveBeenCalledWith('/user/email-verification/request-code', { email: 'person@example.com' })
      await bridge.user.confirmEmailVerificationCode({ email: 'person@example.com', code: '123456' })
      expect(post).toHaveBeenCalledWith('/user/email-verification/confirm', { email: 'person@example.com', code: '123456' })
      await bridge.user.requestPasswordResetCode({ channel: 'email', email: 'person@example.com' })
      expect(post).toHaveBeenCalledWith('/auth/password-reset/request-code', { channel: 'email', email: 'person@example.com' })
      await bridge.user.resetPassword({ channel: 'email', email: 'person@example.com', code: '123456', password: 'Reset5678' })
      expect(post).toHaveBeenCalledWith('/auth/password-reset/confirm', { channel: 'email', email: 'person@example.com', code: '123456', password: 'Reset5678' })
    })
  })
})

describe('bridge 流式写请求的失败与分块语义', () => {
  it('流式连接中断时不自动重发普通写请求', async () => {
    vi.resetModules()
    const post = vi.fn().mockResolvedValue({ reply: '不应被调用' })
    vi.doMock('@/utils/request', () => ({
      default: { get: vi.fn(), post, put: vi.fn(), delete: vi.fn() }
    }))
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = false
    const { bridge } = await import('@/api/bridge')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('连接中断')))

    try {
      await expect(bridge.chat.sendStream('测试消息', [], [])).rejects.toMatchObject({ streamInterrupted: true })
      expect(post).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
      vi.doUnmock('@/utils/request')
      ENV.USE_MOCK = true
    }
  })

  it('小程序端不会把 onChunkReceived 与 success.data 重复消费', async () => {
    vi.resetModules()
    const { streamEventsByUniRequest } = await import('@/api/bridge')
    const previousRequest = globalThis.uni.request
    const fullResponse = [
      'event: status\ndata: {"status":"retrying"}\n\n',
      'event: delta\ndata: {"text":"先看"}\n\n',
      'event: result\ndata: {"reply":"先看当前页面"}\n\n'
    ].join('')
    let deltaCount = 0
    let resultCount = 0
    let retryCount = 0
    globalThis.uni.request = vi.fn((options) => ({
      onChunkReceived(handler) {
        queueMicrotask(() => {
          handler({ data: fullResponse })
          options.success({ statusCode: 200, data: fullResponse })
        })
      },
      abort: vi.fn()
    }))

    try {
      const result = await streamEventsByUniRequest('/chat/send/stream', {}, {
        onRetry: () => { retryCount += 1 },
        onDelta: () => { deltaCount += 1 },
        onResult: () => { resultCount += 1 }
      })
      expect(result.reply).toBe('先看当前页面')
      expect(retryCount).toBe(1)
      expect(deltaCount).toBe(1)
      expect(resultCount).toBe(1)
    } finally {
      globalThis.uni.request = previousRequest
    }
  })
})
