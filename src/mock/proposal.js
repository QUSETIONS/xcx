import { dealService, demandService, matchService } from './service.js'

const pools = new Map()

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function summaryOf(list) {
  return list.reduce((summary, item) => {
    summary.total += 1
    if (summary[item.status] !== undefined) summary[item.status] += 1
    if (['invited', 'viewed', 'quoted'].includes(item.status)) summary.pending += 1
    return summary
  }, { total: 0, pending: 0, invited: 0, viewed: 0, quoted: 0, accepted: 0, declined: 0, closed: 0, withdrawn: 0, expired: 0 })
}

function buildProposal(demand, team, index, status = 'invited') {
  const score = Number(team.match_score) || 0
  const quote = status === 'quoted' ? Math.max(28000, Math.round((Number(demand.budget_min) || 88000) / 100)) : 0
  return {
    _id: `proposal_mock_${demand._id}_${team._id}`,
    id: `proposal_mock_${demand._id}_${team._id}`,
    demand_id: demand._id,
    demand_title: demand.title,
    requester_id: demand.created_by || 'demo_user_001',
    provider_user_id: team.contact_user_id || '',
    provider_id: team._id || '',
    status,
    invite_message: 'Agent 已按需求筛选，请提交方案、报价和预计周期。',
    provider_message: status === 'quoted' ? '可以承接，先完成策略和执行排期，再进入正式协同。' : '',
    quote_amount: quote,
    estimated_days: status === 'quoted' ? 18 : 0,
    milestones: status === 'quoted' ? [{ title: '策略与执行排期', amount: Math.round(quote * 0.35) }, { title: '落地执行与复盘', amount: Math.round(quote * 0.65) }] : [],
    match_score: score,
    match_percent: `${score}%`,
    match_reasons: Array.isArray(team.match_reasons) ? team.match_reasons : [],
    match_strategy: 'weighted-signal-v2',
    proposal_score: Math.round(score * 0.7 + (status === 'quoted' ? 24 : 10)),
    proposal_score_reasons: status === 'quoted' ? ['需求匹配度高', '报价方案已提交', '团队信誉稳定'] : ['需求匹配度高', '等待团队提交方案'],
    proposal_score_breakdown: { match: score, budget: status === 'quoted' ? 100 : 35, trust: Math.round(Number(team.rating || 4.6) / 5 * 100), response: status === 'quoted' ? 100 : 35, cycle: status === 'quoted' ? 84 : 40 },
    provider: {
      user_id: team.contact_user_id || '',
      provider_id: team._id || '',
      name: team.name || '服务团队',
      avatar: team.avatar || '',
      company: team.name || '',
      title: '',
      city: team.region || '',
      category_name: team.category_name || '',
      rating: Number(team.rating) || 0,
      response_rate: Number(team.response_rate) || 0,
      deal_count: Number(team.deal_count) || 0,
      verified: Boolean(team.verified)
    },
    demand: { id: demand._id, title: demand.title, company_name: demand.company_name, region: demand.region, category_id: demand.category_id, budget_min: demand.budget_min || 0, budget_max: demand.budget_max || 0 }
  }
}

function allMatches(demandId) {
  const demand = demandService.detail(demandId)
  if (!demand) return { demand: null, teams: [] }
  const teams = matchService.matchProviders(demand).slice(0, 6).map((team, index) => ({
    ...team,
    // Mock 演示保留一支可进入聊天的服务方，其余团队先走提案比较池。
    contact_user_id: team.contact_user_id || (index === 0 ? 'demo_provider_001' : ''),
    contact_user_name: team.contact_user_name || team.name,
    contact_ready: Boolean(team.contact_ready || index === 0)
  }))
  return { demand, teams }
}

function ensureDemoPool() {
  if (pools.size) return
  const firstDemand = demandService.list({ page: 1, pageSize: 1 }).list?.[0]
  if (firstDemand?._id) getPool(firstDemand._id)
}

function getPool(demandId) {
  if (pools.has(demandId)) return pools.get(demandId)
  const { demand, teams } = allMatches(demandId)
  const list = demand ? teams.slice(0, 2).map((team, index) => buildProposal(demand, team, index, index === 0 ? 'quoted' : 'viewed')) : []
  pools.set(demandId, list)
  return list
}

export const proposalService = {
  list(demandId) {
    const { demand } = allMatches(demandId)
    const list = getPool(demandId)
    return { demand, list: clone(list), total: list.length, summary: summaryOf(list) }
  },

  inviteMatches(demandId, options = {}) {
    const { demand, teams } = allMatches(demandId)
    if (!demand) return { list: [], created: 0, reopened: 0, skipped: [], total_invited: 0, source: 'agent-match', strategy: 'weighted-signal-v2', matches: [] }
    const list = getPool(demandId)
    const existing = new Set(list.map((item) => item.provider_user_id || item.provider_id))
    const excluded = new Set(Array.isArray(options.exclude_provider_ids) ? options.exclude_provider_ids.map(String) : [])
    const added = teams.filter((team) => !excluded.has(String(team.contact_user_id || team._id)) && !existing.has(String(team.contact_user_id || team._id))).slice(0, Number(options.limit) || 6)
    const created = added.map((team, index) => buildProposal(demand, team, index, 'invited'))
    list.push(...created)
    return { list: clone(created), created: created.length, reopened: 0, skipped: [], total_invited: list.length, source: 'agent-match', strategy: 'weighted-signal-v2', matches: clone(added) }
  },

  invite(demandId, options = {}) {
    return this.inviteMatches(demandId, { ...options, limit: 10 })
  },

  inbox() {
    ensureDemoPool()
    const list = [...pools.values()].flat().filter((item) => item.provider_user_id === 'demo_provider_001')
    return { list: clone(list), total: list.length, summary: summaryOf(list) }
  },

  view(id) {
    for (const list of pools.values()) {
      const item = list.find((proposal) => proposal._id === id || proposal.id === id)
      if (item) {
        if (item.status === 'invited') item.status = 'viewed'
        return clone(item)
      }
    }
    return null
  },

  respond(id, payload = {}) {
    for (const list of pools.values()) {
      const item = list.find((proposal) => proposal._id === id || proposal.id === id)
      if (!item) continue
      item.status = payload.status === 'declined' ? 'declined' : 'quoted'
      item.provider_message = String(payload.message || payload.provider_message || '').trim()
      item.quote_amount = Number(payload.quote_amount) || 0
      item.estimated_days = Number(payload.estimated_days) || 0
      item.milestones = Array.isArray(payload.milestones) ? payload.milestones : []
      return clone(item)
    }
    return null
  },

  decide(id, decision) {
    for (const list of pools.values()) {
      const item = list.find((proposal) => proposal._id === id || proposal.id === id)
      if (!item) continue
      item.status = decision === 'accepted' ? 'accepted' : decision
      if (decision === 'accepted') list.filter((proposal) => proposal.id !== item.id && ['invited', 'viewed', 'quoted'].includes(proposal.status)).forEach((proposal) => { proposal.status = 'closed' })
      const leadId = decision === 'accepted' ? `lead_mock_${item.id}` : ''
      const deal = decision === 'accepted' ? dealService.createFromProposal({ ...item, lead_id: leadId }) : null
      if (deal) item.deal_id = deal._id
      return { proposal: clone(item), lead_id: leadId, deal_id: deal?._id || '', entered_workspace: Boolean(deal), entered_contact: decision === 'accepted' }
    }
    return { proposal: null, lead_id: '', deal_id: '', entered_workspace: false, entered_contact: false }
  }
}
