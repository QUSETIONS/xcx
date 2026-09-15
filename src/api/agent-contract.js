/**
 * Agent 跨前端边界共享契约。
 *
 * 这个文件只依赖 JavaScript 标准库，前端仓库可以独立安装、测试和构建。
 * 服务端使用同一份契约的镜像实现；这里不能反向 import 仓库外的服务端文件。
 */

export const AGENT_SCHEMA_VERSION = 1

export const AGENT_REGIONS = Object.freeze([
  '全国', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉',
  '南京', '重庆', '西安', '苏州', '天津', '长沙', '郑州'
])

export const AGENT_CATEGORY_RULES = Object.freeze([
  { id: 'cat_17', name: '商业航天', pattern: /商业航天|卫星|火箭|星座|遥感|航天器|空天信息/i },
  { id: 'cat_16', name: '量子科技', pattern: /量子科技|量子计算|量子通信|量子测量|量子传感/i },
  { id: 'cat_12', name: '半导体与芯片', pattern: /半导体|芯片|GPU|EDA|IP核|集成电路|封测|晶圆|光刻/i },
  { id: 'cat_13', name: '5G/6G与通信', pattern: /5G|6G|通信|基站|网络设备|算网|卫星通信/i },
  { id: 'cat_14', name: '医药大健康', pattern: /医药|医疗|大健康|生物科技|生物医药|器械|药品|精准医疗|健康管理/i },
  { id: 'cat_15', name: '先进制造', pattern: /先进制造|工业机器人|智能制造|工厂|自动化|工业软件|高端装备|新能源汽车/i },
  { id: 'cat_11', name: '投融资与资本', pattern: /投资人|融资|资本|资本路演|融资路演|基金|财务顾问|并购|股权/i },
  { id: 'cat_07', name: '达人种草', pattern: /达人|种草|KOC|KOL|小红书|美妆|社交媒体营销/i },
  { id: 'cat_02', name: '直播带货', pattern: /直播|带货|主播|直播间/ },
  { id: 'cat_08', name: '视频制作', pattern: /视频|拍摄|影视|宣传片|摄影/ },
  { id: 'cat_09', name: '活动策划', pattern: /活动|展会|发布会|会展|路演/ },
  { id: 'cat_05', name: '线下媒体', pattern: /线下媒体|户外媒体/ },
  { id: 'cat_04', name: '线上媒体', pattern: /线上媒体|信息流|广告投放|公众号|媒体投放/ },
  { id: 'cat_01', name: '品牌公关', pattern: /品牌|公关|设计|视觉|VI|logo|包装|舆情/i },
  { id: 'cat_03', name: '企业服务', pattern: /技术|开发|小程序|软件|系统|培训|内训|研究报告|白皮书|咨询/ },
  { id: 'cat_06', name: '代运营', pattern: /内容|运营|短视频|社区|代运营|社群|新媒体/ },
  { id: 'cat_10', name: '渠道资源', pattern: /供应链|采购|渠道|经销商|业务下游|产业链|供应商/ }
])

const CATEGORY_IDS = new Set(AGENT_CATEGORY_RULES.map((item) => item.id))

export function getAgentCategoryId(value = '') {
  const text = String(value || '').trim()
  if (!text || text === '未识别') return ''
  const direct = AGENT_CATEGORY_RULES.find((item) => text.includes(item.name) || item.name.includes(text))
  return direct?.id || AGENT_CATEGORY_RULES.find((item) => item.pattern.test(text))?.id || ''
}

export function classifyAgentText(value = '') {
  const text = String(value || '').trim()
  return AGENT_CATEGORY_RULES.find((item) => item.pattern.test(text)) || null
}

export function isAgentCategoryId(value = '') {
  return CATEGORY_IDS.has(String(value || '').trim())
}

export function normalizeAgentRegion(value = '') {
  const text = String(value || '').trim()
  if (!text || text === '未指定') return '未指定'
  const primary = text.split(/[（(,，、;；/]/)[0].trim()
  if (/以外|不含|不包括|除.+外/.test(primary)) return '未指定'
  return AGENT_REGIONS
    .filter((item) => primary === item || primary === item + '市' || primary.includes(item))
    .sort((left, right) => right.length - left.length)[0] || text.slice(0, 40)
}

export function parseAgentBudget(value = '') {
  const text = String(value || '').trim()
  if (!text || /未指定|未知|面议|不确定|不限/.test(text)) return null
  const sharedUnit = text.match(/(\d+(?:\.\d+)?)\s*[-~至到]\s*(\d+(?:\.\d+)?)\s*(万(?:元)?|w|元)/i)
  if (sharedUnit) {
    const scale = /万|w/i.test(sharedUnit[3]) ? 10000 : 1
    return normalizeBudgetValues([Number(sharedUnit[1]) * scale, Number(sharedUnit[2]) * scale])
  }
  return normalizeBudgetValues([...text.matchAll(/(\d+(?:\.\d+)?)\s*(万(?:元)?|w|元)/gi)]
    .map((match) => Number(match[1]) * (/万|w/i.test(match[2]) ? 10000 : 1)))
}

export function scoreAgentQuality(result = {}, options = {}) {
  const source = result && typeof result === 'object' ? result : {}
  const mode = typeof options === 'string' ? options : String(options?.mode || '')
  if (mode === 'service_provider_search') return scoreServiceProviderQuality(source)
  const summary = text(source.summary, '')
  const category = text(source.category, '')
  const categoryId = String(source.category_id || '').trim()
  const region = text(source.region, '')
  const budget = text(source.budget, '')
  const startTime = text(source.start_time, '')
  const tags = list(source.tags, 5)
  const keywords = list(source.keywords, 8)
  const scores = {
    category: hasValue(categoryId || category, ['未识别', '未知']) ? 20 : 0,
    region: hasValue(region, ['未指定', '未知']) ? 15 : 0,
    budget: hasValue(budget, ['未指定', '未知', '面议', '不限', '不确定']) ? 15 : 0,
    start_time: hasValue(startTime, ['未指定', '未知', '不确定']) ? 15 : 0,
    scope: scoreScope(summary, tags, keywords)
  }
  const gaps = []
  if (!scores.category) gaps.push('服务类型')
  if (!scores.region) gaps.push('服务地区')
  if (!scores.budget) gaps.push('预算范围')
  if (!scores.start_time) gaps.push('启动时间')
  if (!scores.scope) gaps.push('交付内容或目标')
  const score = Object.values(scores).reduce((total, value) => total + value, 0)
  const level = score >= 80 ? 'ready' : score >= 60 ? 'almost_ready' : 'needs_more'
  const label = level === 'ready' ? '信息完整，可以发布' : level === 'almost_ready' ? '信息基本清楚' : '还需要补充'
  const nextStep = gaps.length
    ? '再补充' + gaps.slice(0, 2).join('、') + '，团队会更容易给出准确方案。'
    : '关键信息已经齐了，可以直接发布或联系匹配团队。'
  return { score, level, label, scores, gaps: gaps.slice(0, 4), next_step: nextStep }
}

function scoreServiceProviderQuality(source = {}) {
  const summary = text(source.summary, '')
  const category = text(source.category, '')
  const categoryId = String(source.category_id || '').trim()
  const region = text(source.region, '')
  const tags = list(source.tags, 5)
  const keywords = list(source.keywords, 8)
  const signalCount = new Set([...tags, ...keywords].map((item) => String(item).trim()).filter(Boolean)).size
  const scores = {
    capability: hasValue(categoryId || category, ['未识别', '未知']) ? 30 : 0,
    region: hasValue(region, ['未指定', '未知']) ? 20 : 0,
    preference: Math.min(30, scoreScope(summary, tags, keywords)),
    evidence: signalCount >= 3 ? 20 : signalCount >= 1 ? 10 : 0
  }
  const gaps = []
  if (!scores.capability) gaps.push('服务能力或擅长行业')
  if (!scores.region) gaps.push('目标城市')
  if (!scores.preference) gaps.push('希望承接的项目类型')
  if (scores.evidence < 20) gaps.push('案例、资源或可承接范围')
  const score = Object.values(scores).reduce((total, value) => total + value, 0)
  const level = score >= 80 ? 'ready' : score >= 60 ? 'almost_ready' : 'needs_more'
  const label = level === 'ready' ? '能力清楚，可以找项目' : level === 'almost_ready' ? '找单条件基本清楚' : '还需要补充'
  const nextStep = gaps.length
    ? '再补充' + gaps.slice(0, 2).join('、') + '，AI 会更容易筛出合适项目。'
    : '找单条件已经齐了，可以查看匹配项目。'
  return { score, level, label, scores, gaps: gaps.slice(0, 4), next_step: nextStep }
}

export function normalizeAgentResult(value = {}, options = {}) {
  const source = value && typeof value === 'object' ? value : {}
  const confidence = Number(source.confidence)
  const tags = list(source.tags, 5)
  const keywords = list(source.keywords, 8)
  const categorySignal = [source.category, ...tags, ...keywords].join(' ')
  const normalized = {
    schema_version: Number(source.schema_version) || AGENT_SCHEMA_VERSION,
    source: text(source.source, options.source || 'unknown', 24),
    fallback: source.fallback == null ? Boolean(options.fallback) : Boolean(source.fallback),
    fallback_reason: text(source.fallback_reason, '', 32),
    reply: text(source.reply, '', 240),
    interaction_intent: text(source.interaction_intent, 'other', 32),
    intent_confidence: normalizeConfidence(source.intent_confidence),
    conversation_stage: text(source.conversation_stage, 'clarifying', 32),
    recommendation_ready: source.recommendation_ready === true,
    recommendation_reason: text(source.recommendation_reason, '', 160),
    project_phase: text(source.project_phase, '待判断', 40),
    phase_reason: text(source.phase_reason, '', 160),
    recommendation_explanations: list(source.recommendation_explanations, 5),
    outreach_brief: normalizeOutreachBrief(source.outreach_brief),
    actions: normalizeAgentActions(source.actions),
    next_action: text(source.next_action, '继续补充需求', 80),
    summary: text(source.summary, options.summaryFallback || '请补充你的合作需求', 160),
    intent: text(source.intent, '资源对接', 80),
    category: text(source.category, '未识别', 80),
    category_id: isAgentCategoryId(source.category_id) ? String(source.category_id) : getAgentCategoryId(categorySignal),
    region: normalizeAgentRegion(text(source.region, '未指定', 80)),
    budget: text(source.budget, '未指定', 80),
    start_time: text(source.start_time, options.startTimeFallback || '未指定', 80),
    tags,
    missing: list(source.missing, 4),
    questions: list(source.questions, 3),
    keywords,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence > 1 ? confidence / 100 : confidence)) : 0,
    matches: normalizeAgentMatches(source.matches),
    usage_credit: normalizeUsageCredit(source.usage_credit)
  }
  normalized.quality = scoreAgentQuality(normalized, options)
  return normalized
}

function normalizeOutreachBrief(value) {
  const source = value && typeof value === 'object' ? value : {}
  return { opening: text(source.opening, '', 180), context: text(source.context, '', 220), questions: list(source.questions, 4) }
}

function normalizeAgentActions(value) {
  const source = value && typeof value === 'object' ? value : {}
  return { can_publish: source.can_publish === true, can_connect: source.can_connect === true, primary: text(source.primary, '', 40), primary_label: text(source.primary_label, '', 60) }
}

function normalizeUsageCredit(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return { action: text(value.action, '', 64), consumed: value.consumed === true, idempotent: value.idempotent === true, balance: Math.max(0, Math.round(Number(value.balance) || 0)), reason: text(value.reason, '', 40) }
}

export function normalizeAgentMatches(value) {
  const source = value && typeof value === 'object' ? value : {}
  const normalized = { teams: normalizeAgentTeams(source.teams), demands: normalizeAgentDemands(source.demands) }
  if (source.meta && typeof source.meta === 'object') normalized.meta = { ...source.meta, strategy: text(source.meta.strategy, '', 80) }
  return normalized
}

export function normalizeAgentTeams(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 6).map((item = {}) => {
    const score = normalizeScore(item.match_score)
    return {
      _id: text(item._id || item.id, '', 80), id: text(item.id || item._id, '', 80),
      name: text(item.name, '服务团队', 80), avatar: text(item.avatar, '', 500),
      category_id: text(item.category_id, '', 40), category_name: text(item.category_name, '企业服务', 80),
      region: text(item.region, '全国', 40), rating: Math.max(0, Math.min(5, Number(item.rating) || 0)),
      deal_count: Math.max(0, Math.round(Number(item.deal_count) || 0)),
      response_rate: Math.max(0, Math.min(100, Math.round(Number(item.response_rate) || 0))),
      avg_price: Math.max(0, Number(item.avg_price) || 0), tags: list(item.tags, 5),
      intro: text(item.intro, '', 160), verified: Boolean(item.verified), match_score: score, match_percent: String(score) + '%',
      match_reasons: list(item.match_reasons, 4),
      match_breakdown: item.match_breakdown && typeof item.match_breakdown === 'object' ? item.match_breakdown : {},
      contact_user_id: text(item.contact_user_id, '', 80), contact_user_name: text(item.contact_user_name, '', 80),
      contact_ready: Boolean(item.contact_ready)
    }
  }).filter((item) => item._id)
}

export function normalizeAgentDemands(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 6).map((item = {}) => {
    const score = normalizeScore(item.match_score)
    return {
      _id: text(item._id || item.id, '', 80), id: text(item.id || item._id, '', 80),
      title: text(item.title, '相关项目', 120), company_name: text(item.company_name, '', 100),
      region: text(item.region, '全国', 40), category_id: text(item.category_id, '', 40),
      category_name: text(item.category_name, '企业服务', 80),
      budget_min: Math.max(0, Math.round(Number(item.budget_min) || 0)),
      budget_max: Math.max(0, Math.round(Number(item.budget_max) || 0)),
      tags: list(item.tags, 5), match_score: score, match_percent: String(score) + '%',
      match_reasons: list(item.match_reasons, 4),
      match_breakdown: item.match_breakdown && typeof item.match_breakdown === 'object' ? item.match_breakdown : {}
    }
  }).filter((item) => item._id)
}

function normalizeScore(value) {
  return Math.max(0, Math.min(99, Math.round(Number(value) || 0)))
}

function normalizeConfidence(value) {
  const confidence = Number(value)
  if (!Number.isFinite(confidence)) return 0
  return Math.max(0, Math.min(1, confidence > 1 ? confidence / 100 : confidence))
}

function normalizeBudgetValues(values) {
  const usable = values.filter((item) => Number.isFinite(item) && item > 0)
  if (!usable.length) return null
  return { min: Math.round(Math.min(...usable)), max: Math.round(Math.max(...usable)) }
}

function hasValue(value, unknownValues = []) {
  const textValue = String(value || '').trim()
  return Boolean(textValue) && !unknownValues.includes(textValue)
}

function scoreScope(summary, tags, keywords) {
  const summaryLength = String(summary || '').replace(/\s/g, '').length
  const signalCount = new Set([...tags, ...keywords].map((item) => String(item).trim()).filter(Boolean)).size
  if (summaryLength >= 80 && signalCount >= 2) return 25
  if (summaryLength >= 40 || signalCount >= 2) return 18
  if (summaryLength >= 15 || signalCount >= 1) return 10
  if (summaryLength >= 6) return 6
  return 0
}

function text(value, fallback, max = 160) {
  const result = String(value || '').trim()
  return result ? result.slice(0, max) : fallback
}

function list(value, max) {
  const values = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(/[,，、;；|\n]/) : [])
  return values.map((item) => String(item || '').trim()).filter(Boolean).slice(0, max)
}
