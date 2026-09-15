import { DEMAND_CATEGORIES, REGIONS } from '@/config/constants'
import {
  getAgentCategoryId as getSharedAgentCategoryId,
  isAgentCategoryId as isSharedAgentCategoryId,
  normalizeAgentRegion as normalizeSharedAgentRegion,
  parseAgentBudget as parseSharedAgentBudget
} from '@/api/agent-contract'

/**
 * 把 Agent 输出映射为平台现有的需求分类。
 * 模型分类允许是自然语言，平台提交仍使用 cat_XX。
 */
export function getAgentCategoryId(category = '') {
  return getSharedAgentCategoryId(category)
}

export function isAgentCategoryId(value = '') {
  return isSharedAgentCategoryId(value)
}

export function normalizeAgentRegion(region = '') {
  return normalizeSharedAgentRegion(region)
}

/**
 * 将 Agent 的预算文本解析为发布页使用的「元」输入值。
 * 例如：5万元 -> 50000/50000，5万-10万 -> 50000/100000。
 */
export function parseAgentBudget(budget = '') {
  return parseSharedAgentBudget(budget)
}

/**
 * 生成发布页可消费的临时草稿。
 */
export function buildAgentDraft(text = '', result = {}, sessionId = '') {
  const input = String(text || '').trim()
  const categorySignal = [result.category, ...(Array.isArray(result.tags) ? result.tags : []), ...(Array.isArray(result.keywords) ? result.keywords : [])].join(' ')
  const declaredCategoryId = String(result.category_id || '').trim()
  const categoryId = isAgentCategoryId(declaredCategoryId)
    ? declaredCategoryId
    : getAgentCategoryId(categorySignal)
  const category = DEMAND_CATEGORIES.find((item) => item.id === categoryId)
  const budget = parseAgentBudget(result.budget)
  const region = REGIONS.includes(result.region) ? result.region : ''
  const tags = [...(Array.isArray(result.tags) ? result.tags : []), ...(Array.isArray(result.keywords) ? result.keywords : [])]
    .map((tag) => String(tag || '').trim())
    .filter(Boolean)
    .filter((tag, index, list) => list.indexOf(tag) === index)
    .slice(0, 8)
  const agentMissing = Array.isArray(result.missing)
    ? result.missing.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4)
    : []
  const agentQuestions = Array.isArray(result.questions)
    ? result.questions.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
    : []

  return {
    source: 'agent',
    title: String(result.summary || input).trim().slice(0, 100),
    region,
    category_id: categoryId,
    category_name: category?.name || '',
    quote_type: budget ? 'self' : 'negotiate',
    budgetMin: budget ? String(budget.min) : '',
    budgetMax: budget ? String(budget.max) : '',
    description: input.slice(0, 2000),
    tags,
    agent_context: {
      source: 'agent',
      fallback: Boolean(result.fallback),
      fallback_reason: String(result.fallback_reason || '').trim().slice(0, 80),
      session_id: String(sessionId || '').trim().slice(0, 120),
      quality: result.quality && typeof result.quality === 'object' ? result.quality : undefined,
      quality_score: Number(result.quality?.score) || 0,
      quality_level: String(result.quality?.level || '').trim().slice(0, 30),
      missing: agentMissing,
      questions: agentQuestions
    }
  }
}
