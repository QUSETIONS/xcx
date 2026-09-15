const STOP_WORDS = new Set([
  '需求', '服务', '方案', '团队', '企业', '寻找', '合作', '需要', '专业', '项目',
  '资源', '相关', '提供', '一个', '一支', '希望', '进行', '可以', '内容'
])

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function asList(value) {
  if (Array.isArray(value)) return value.flatMap(asList).map(item => String(item || '').trim()).filter(Boolean)
  if (typeof value !== 'string') return []
  const text = value.trim()
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return asList(parsed)
    } catch { /* fall through to delimiter parsing */ }
  }
  return text.split(/[,，、;；|\n]/).map(item => item.trim()).filter(Boolean)
}

function collectTokens(values) {
  const text = asList(values).join(' ').toLowerCase()
  const segments = text.match(/[a-z0-9]+|[\u4e00-\u9fff]+/g) || []
  const tokens = new Set()

  segments.forEach(segment => {
    if (/^[a-z0-9]+$/.test(segment)) {
      if (segment.length > 1) tokens.add(segment)
      return
    }

    if (segment.length >= 2 && !STOP_WORDS.has(segment)) tokens.add(segment)
    for (let length = 2; length <= Math.min(4, segment.length); length += 1) {
      for (let index = 0; index + length <= segment.length; index += 1) {
        const token = segment.slice(index, index + length)
        if (!STOP_WORDS.has(token)) tokens.add(token)
      }
    }
  })

  return tokens
}

function keywordMatch(leftValues, rightValues, maxPoints) {
  const left = collectTokens(leftValues)
  const right = collectTokens(rightValues)
  if (!left.size || !right.size) return { points: 0, overlap: [] }

  const overlap = [...left].filter(token => right.has(token))
  const denominator = Math.max(1, Math.min(6, left.size))
  return {
    points: Math.min(maxPoints, Math.round((overlap.length / denominator) * maxPoints)),
    overlap
  }
}

function parseBudgetText(value) {
  const text = String(value || '').trim()
  if (!text || /未指定|未知|面议|不确定/.test(text)) return null
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(万(?:元)?|w|元)/gi)]
  if (!matches.length) return null

  const values = matches.map(match => {
    const amount = Number(match[1])
    return /万|w/i.test(match[2]) ? amount * 10000 : amount
  }).filter(Number.isFinite)
  if (!values.length) return null
  return { min: Math.min(...values), max: Math.max(...values) }
}

function normalizeStoredAmount(value) {
  const amount = toNumber(value)
  if (amount === null || amount <= 0) return null
  // 真实后端以分保存预算，mock 数据以元保存；大额分值可安全识别并换算。
  return amount >= 100000 ? amount / 100 : amount
}

function readBudgetRange(source = {}) {
  const min = normalizeStoredAmount(source.budget_min)
  const max = normalizeStoredAmount(source.budget_max)
  if (min !== null || max !== null) {
    const low = min ?? max
    const high = max ?? min
    return { min: Math.min(low, high), max: Math.max(low, high) }
  }
  return parseBudgetText(source.budget)
}

function rangesOverlap(left, right) {
  return Boolean(left && right && left.min <= right.max && right.min <= left.max)
}

function clampScore(value) {
  return Math.max(0, Math.min(99, Math.round(value)))
}

/**
 * 给 Agent 首页的相近需求打分，所有加分项都有对应业务字段。
 */
export function scoreDemandMatch(demand = {}, agentResult = {}) {
  const reasons = []
  let score = 0

  const categoryMatched = agentResult.category_id && demand.category_id === agentResult.category_id
    || agentResult.category && demand.category_name && String(demand.category_name).includes(String(agentResult.category))
  if (categoryMatched) {
    score += 35
    reasons.push('分类匹配')
  }

  const requestedRegion = String(agentResult.region || '').trim()
  if (requestedRegion && requestedRegion !== '未指定' && requestedRegion !== '全国' && demand.region === requestedRegion) {
    score += 20
    reasons.push('地区匹配')
  }

  const keywords = keywordMatch(
    [...asList(agentResult.tags), ...asList(agentResult.keywords)],
    [demand.title, demand.description, demand.category_name, ...asList(demand.tags)]
      .filter(Boolean),
    25
  )
  if (keywords.points > 0) {
    score += keywords.points
    reasons.push(`${Math.min(3, keywords.overlap.length)} 个关键词匹配`)
  }

  const requestedBudget = readBudgetRange(agentResult)
  const demandBudget = readBudgetRange(demand)
  if (rangesOverlap(requestedBudget, demandBudget)) {
    score += 15
    reasons.push('预算区间相符')
  }

  const activity = Math.min(5, (toNumber(demand.lead_count) || 0) / 6 + (toNumber(demand.view_count) || 0) / 1000)
  score += activity

  return {
    score: clampScore(score),
    reasons,
    breakdown: {
      category: categoryMatched ? 35 : 0,
      region: requestedRegion && requestedRegion !== '未指定' && requestedRegion !== '全国' && demand.region === requestedRegion ? 20 : 0,
      keywords: keywords.points,
      budget: rangesOverlap(requestedBudget, demandBudget) ? 15 : 0,
      activity: Math.round(activity)
    }
  }
}

/**
 * 给详情页服务商匹配打分，输出分数拆解和匹配理由，便于前端解释结果。
 */
export function scoreProviderMatch(provider = {}, demand = {}) {
  const reasons = []
  const breakdown = { category: 0, region: 0, keywords: 0, budget: 0, quality: 0 }

  if (provider.category_id && provider.category_id === demand.category_id) {
    breakdown.category = 35
    reasons.push('分类匹配')
  }

  const demandRegion = String(demand.region || '').trim()
  if (demandRegion && demandRegion !== '全国' && provider.region && provider.region === demandRegion) {
    breakdown.region = 15
    reasons.push('地区匹配')
  }

  const keywords = keywordMatch(
    [demand.title, demand.description, ...asList(demand.tags)],
    [provider.name, provider.category_name, provider.intro, ...asList(provider.tags)],
    20
  )
  breakdown.keywords = keywords.points
  if (keywords.points > 0) reasons.push(`${Math.min(3, keywords.overlap.length)} 个关键词匹配`)

  const demandBudget = readBudgetRange(demand)
  const providerPrice = toNumber(provider.avg_price)
  if (demandBudget && providerPrice !== null && providerPrice > 0 && providerPrice >= demandBudget.min && providerPrice <= demandBudget.max) {
    breakdown.budget = 15
    reasons.push('预算区间相符')
  }

  const rating = Math.max(0, Math.min(5, toNumber(provider.rating) || 0))
  const responseRate = Math.max(0, Math.min(100, toNumber(provider.response_rate) || 0))
  const dealCount = Math.max(0, toNumber(provider.deal_count) || 0)
  breakdown.quality = Math.min(15, (rating / 5) * 7 + (responseRate / 100) * 4 + Math.min(3, dealCount / 100) + (provider.verified ? 1 : 0))
  if (rating >= 4.5) reasons.push('高评分')
  if (responseRate >= 90) reasons.push('响应快')
  if (provider.verified) reasons.push('已认证')

  return {
    score: clampScore(Object.values(breakdown).reduce((sum, value) => sum + value, 0)),
    reasons,
    breakdown
  }
}

