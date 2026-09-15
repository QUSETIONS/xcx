// 前端 API 边界只保留页面适配需要的扩展；运行时通过 Web Main 的 Boot
// 进入共享契约，避免 legacy 页面直接穿透到 Package。
import {
  AGENT_SCHEMA_VERSION,
  normalizeAgentDemands,
  normalizeAgentMatches,
  normalizeAgentRegion,
  normalizeAgentResult,
  normalizeAgentTeams,
  parseAgentBudget,
  scoreAgentQuality
} from '../../../Main/MediaMatchWeb/Src/Boot/main.js'

export {
  AGENT_SCHEMA_VERSION,
  normalizeAgentDemands,
  normalizeAgentMatches,
  normalizeAgentRegion,
  normalizeAgentResult,
  normalizeAgentTeams,
  parseAgentBudget,
  scoreAgentQuality
}

export function normalizeProviderMatches(value) {
  if (!Array.isArray(value)) return []

  return value.map((item = {}) => {
    const score = Math.max(0, Math.min(99, Math.round(Number(item.match_score) || 0)))
    return {
      ...item,
      match_score: score,
      match_percent: `${score}%`,
      match_reasons: list(item.match_reasons, 5),
      match_breakdown: item.match_breakdown && typeof item.match_breakdown === 'object'
        ? item.match_breakdown
        : {}
    }
  })
}

export function normalizeProposal(value = {}) {
  if (!value || typeof value !== 'object') return null
  const score = Math.max(0, Math.min(100, Math.round(Number(value.proposal_score) || 0)))
  const matchScore = Math.max(0, Math.min(100, Math.round(Number(value.match_score) || 0)))
  const provider = value.provider && typeof value.provider === 'object' ? value.provider : {}
  return {
    ...value,
    _id: value._id || value.id || '',
    id: value.id || value._id || '',
    status: String(value.status || 'invited'),
    match_score: matchScore,
    match_percent: value.match_percent || `${matchScore}%`,
    match_reasons: list(value.match_reasons, 6),
    proposal_score: score,
    proposal_score_reasons: list(value.proposal_score_reasons, 5),
    proposal_score_breakdown: value.proposal_score_breakdown && typeof value.proposal_score_breakdown === 'object' ? value.proposal_score_breakdown : {},
    quote_amount: Number(value.quote_amount) || 0,
    estimated_days: Number(value.estimated_days) || 0,
    milestones: Array.isArray(value.milestones) ? value.milestones : [],
    provider: {
      ...provider,
      user_id: provider.user_id || value.provider_user_id || '',
      name: provider.name || value.provider_name || '服务团队',
      rating: Number(provider.rating) || 0,
      response_rate: Number(provider.response_rate) || 0,
      deal_count: Number(provider.deal_count) || 0
    }
  }
}

export function normalizeProposalPool(value = {}) {
  const source = Array.isArray(value) ? { list: value } : (value || {})
  const listValue = Array.isArray(source.list) ? source.list : []
  const list = listValue.map(normalizeProposal).filter(Boolean)
  return {
    ...source,
    list,
    total: Number(source.total) || list.length,
    summary: source.summary && typeof source.summary === 'object'
      ? source.summary
      : { total: list.length, pending: list.filter((item) => ['invited', 'viewed', 'quoted'].includes(item.status)).length }
  }
}

export function normalizeProposalAction(value = {}) {
  const source = value || {}
  return {
    ...source,
    list: Array.isArray(source.list) ? source.list.map(normalizeProposal).filter(Boolean) : [],
    matches: Array.isArray(source.matches) ? source.matches : [],
    proposal: source.proposal ? normalizeProposal(source.proposal) : undefined,
    created: Number(source.created) || 0,
    reopened: Number(source.reopened) || 0,
    total_invited: Number(source.total_invited) || 0
  }
}

function list(value, max) {
  const values = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split(/[,，、;；|\n]/) : [])
  return values.map((item) => String(item || '').trim()).filter(Boolean).slice(0, max)
}
