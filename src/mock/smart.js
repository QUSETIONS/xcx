/**
 * 智能引擎 - 浏览历史、个性化推荐、价格建议、需求质量评分
 */

import { demandService, productService } from './service'

const HISTORY_KEY = 'browse_history'
const PREFERENCE_KEY = 'user_preference'

// ========== 浏览历史 ==========

export function trackBrowse(type, id, item) {
  try {
    const history = JSON.parse(uni.getStorageSync(HISTORY_KEY) || '[]')
    // 去重
    const filtered = history.filter(h => !(h.type === type && h.id === id))
    // 添加到头部
    filtered.unshift({
      type, id,
      category_id: item?.category_id || '',
      category_name: item?.category_name || '',
      title: item?.title || '',
      service_type: item?.service_type || '',
      region: item?.region || '',
      time: Date.now()
    })
    // 保留最近50条
    const trimmed = filtered.slice(0, 50)
    uni.setStorageSync(HISTORY_KEY, JSON.stringify(trimmed))
    updatePreference(trimmed)
  } catch (e) { console.error('trackBrowse error:', e) }
}

function getHistory() {
  try { return JSON.parse(uni.getStorageSync(HISTORY_KEY) || '[]') } catch { return [] }
}

// ========== 用户偏好分析 ==========

function updatePreference(history) {
  const pref = {
    categories: {},
    regions: {},
    service_types: {},
    updated: Date.now()
  }

  // 分析最近20条浏览记录
  const recent = history.slice(0, 20)
  recent.forEach(h => {
    if (h.category_id) pref.categories[h.category_id] = (pref.categories[h.category_id] || 0) + 1
    if (h.region && h.region !== '全国') pref.regions[h.region] = (pref.regions[h.region] || 0) + 1
    if (h.service_type) pref.service_types[h.service_type] = (pref.service_types[h.service_type] || 0) + 1
  })

  uni.setStorageSync(PREFERENCE_KEY, JSON.stringify(pref))
}

function getPreference() {
  try { return JSON.parse(uni.getStorageSync(PREFERENCE_KEY) || '{}') } catch { return {} }
}

// ========== 个性化推荐（带缓存）==========

// 推荐结果缓存：浏览历史变化前复用，避免重复打分计算
let _recoCache = { hash: null, limit: 0, result: [] }

function historyHash() {
  const h = getHistory()
  // 用最近 10 条的 id 拼接作为指纹
  return h.slice(0, 10).map(x => x.id).join(',') + ':' + h.length
}

export function getRecommendedDemands(limit = 6) {
  // 命中缓存：历史指纹 + limit 均未变，直接返回缓存数组（同一引用）
  const hash = historyHash()
  if (_recoCache.hash === hash && _recoCache.limit === limit) {
    return _recoCache.result
  }

  const pref = getPreference()
  const allDemands = demandService.list({ pageSize: 100, sort: 'hot' }).list
  const history = getHistory()
  const browsedIds = new Set(history.map(h => h.id))

  // 计算每个需求的推荐分
  const scored = allDemands.map(d => {
    let score = 0

    // 基础热度分（40%）
    score += Math.min(40, d.view_count / 100)
    score += d.lead_count * 2

    // 偏好匹配分（40%）
    if (pref.categories && pref.categories[d.category_id]) {
      score += pref.categories[d.category_id] * 8
    }
    if (pref.regions && pref.regions[d.region]) {
      score += pref.regions[d.region] * 5
    }

    // 新鲜度分（20%）
    const ageDays = (Date.now() - new Date(d.publish_time).getTime()) / 86400000
    score += Math.max(0, 20 - ageDays)

    // 已浏览降权
    if (browsedIds.has(d._id)) score *= 0.3

    return { ...d, _score: Math.round(score) }
  })

  scored.sort((a, b) => b._score - a._score)
  const result = scored.slice(0, limit)

  // 写入缓存
  _recoCache = { hash, limit, result }
  return result
}

export function getRecommendedProducts(limit = 4) {
  const pref = getPreference()
  const allProducts = productService.list({ pageSize: 100 }).list

  const scored = allProducts.map(p => {
    let score = p.sale_count

    // 偏好匹配
    if (pref.service_types && pref.service_types[p.service_type]) {
      score += pref.service_types[p.service_type] * 20
    }

    // 精选加权
    if (p.is_featured) score += 30

    return { ...p, _score: score }
  })

  scored.sort((a, b) => b._score - a._score)
  return scored.slice(0, limit)
}

// ========== 价格建议 ==========

export function getPriceSuggestion(category_id, quote_type) {
  if (quote_type !== 'self') return null

  const allDemands = demandService.list({ pageSize: 100 }).list
  const sameCategory = allDemands.filter(d => d.category_id === category_id && d.budget_min && d.budget_max)

  if (sameCategory.length === 0) {
    // 默认建议
    return {
      min: 5000,
      max: 50000,
      avg: 20000,
      level: '参考',
      tip: '该分类暂无足够数据，以上为平台默认参考价'
    }
  }

  const mins = sameCategory.map(d => d.budget_min / 100)
  const maxs = sameCategory.map(d => d.budget_max / 100)

  const avgMin = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
  const avgMax = Math.round(maxs.reduce((a, b) => a + b, 0) / maxs.length)
  const avg = Math.round((avgMin + avgMax) / 2)
  const overallAvg = Math.round(sameCategory.reduce((s, d) => s + (d.budget_min + d.budget_max) / 2, 0) / sameCategory.length / 100)

  let level = '合理'
  let tip = `该分类平均预算 ¥${avgMin}-¥${avgMax}，建议在此区间内报价`

  return { min: avgMin, max: avgMax, avg: overallAvg, level, tip }
}

// ========== 需求质量评分 ==========

export function scoreDemandQuality(form) {
  const scores = {
    title: 0,       // 标题质量（20分）
    description: 0, // 描述详细度（30分）
    budget: 0,      // 预算明确度（15分）
    contact: 0,     // 联系方式完整度（15分）
    category: 0,    // 分类选择（10分）
    region: 0,      // 地区选择（10分）
  }
  const tips = []

  // 标题质量
  if (!form.title) {
    scores.title = 0
    tips.push('请填写需求标题')
  } else if (form.title.length < 8) {
    scores.title = 8
    tips.push('标题太短，建议8字以上描述清楚需求')
  } else if (form.title.length < 20) {
    scores.title = 15
    tips.push('标题不错，可以更具体一些')
  } else {
    scores.title = 20
  }

  // 描述详细度
  if (!form.description) {
    scores.description = 0
    tips.push('请填写需求详情')
  } else if (form.description.length < 50) {
    scores.description = 10
    tips.push('描述较简单，详细描述能获得更多对接')
  } else if (form.description.length < 200) {
    scores.description = 22
    tips.push('描述较好，加入时间节点和交付物会更吸引人')
  } else {
    scores.description = 30
  }

  // 预算明确度
  if (form.quote_type === 'self') {
    if (form.budget_min && form.budget_max) {
      scores.budget = 15
    } else if (form.budget_min) {
      scores.budget = 10
      tips.push('建议填写预算上限，让服务方更好评估')
    } else {
      scores.budget = 5
      tips.push('选择自报价时建议填写预算区间')
    }
  } else if (form.quote_type === 'negotiate') {
    scores.budget = 8
  } else if (form.quote_type === 'by_daren') {
    scores.budget = 6
  } else {
    // 未选择报价方式
    scores.budget = 0
    tips.push('请选择报价方式')
  }

  // 联系方式
  if (form.contact_name && form.contact_phone) {
    scores.contact = 15
    if (form.contact_wechat) scores.contact = 15
  } else if (form.contact_name || form.contact_phone) {
    scores.contact = 7
    tips.push('请完善联系方式')
  } else {
    scores.contact = 0
    tips.push('请填写联系方式')
  }

  // 分类选择
  scores.category = form.category_id ? 10 : 0
  if (!form.category_id) tips.push('请选择需求分类')

  // 地区选择
  scores.region = form.region ? 10 : 0
  if (!form.region) tips.push('请选择需求地区')

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  let level = '待完善'
  if (total >= 80) level = '优秀'
  else if (total >= 60) level = '良好'
  else if (total >= 40) level = '一般'

  return { scores, total, level, tips }
}

// ========== 浏览历史列表 ==========

export function getBrowseHistory(limit = 10) {
  return getHistory().slice(0, limit)
}

export function clearBrowseHistory() {
  uni.removeStorageSync(HISTORY_KEY)
  uni.removeStorageSync(PREFERENCE_KEY)
}
