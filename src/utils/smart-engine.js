/**
 * 前端智能能力的本地实现。
 *
 * bridge.smart 在 Mock 模式下使用这里的实现，在真实模式下切换到后端
 * 推荐/价格接口；表单质量评分和浏览记录本身不需要服务端参与。
 */

import { STORAGE_KEYS } from '@/config/constants'

const HISTORY_KEY = STORAGE_KEYS.BROWSE_HISTORY
const PREFERENCE_KEY = STORAGE_KEYS.USER_PREFERENCE

export function trackBrowse(type, id, item) {
  try {
    const history = readJson(HISTORY_KEY, [])
    const filtered = history.filter(entry => !(entry.type === type && entry.id === id))
    const next = filtered.slice(0, 49)
    next.unshift({
      type,
      id,
      category_id: item?.category_id || '',
      category_name: item?.category_name || '',
      title: item?.title || '',
      service_type: item?.service_type || '',
      region: item?.region || '',
      time: Date.now()
    })
    uni.setStorageSync(HISTORY_KEY, JSON.stringify(next))
    updatePreference(next)
  } catch (error) {
    console.error('trackBrowse error:', error)
  }
}

export function getBrowseHistory(limit = 10) {
  return readJson(HISTORY_KEY, []).slice(0, limit)
}

export function clearBrowseHistory() {
  uni.removeStorageSync(HISTORY_KEY)
  uni.removeStorageSync(PREFERENCE_KEY)
}

export async function getRecommendedDemands(limit = 6, fetcher) {
  const response = await fetcher({ page: 1, pageSize: 100, sort: 'hot' })
  const allDemands = response?.list || []
  const preference = readJson(PREFERENCE_KEY, {})
  const history = readJson(HISTORY_KEY, [])
  const browsedIds = new Set(history.map(entry => entry.id))

  const scored = allDemands.map(demand => {
    let score = 0
    score += Math.min(40, Number(demand.view_count || 0) / 100)
    score += Number(demand.lead_count || 0) * 2
    if (preference.categories?.[demand.category_id]) score += preference.categories[demand.category_id] * 8
    if (preference.regions?.[demand.region]) score += preference.regions[demand.region] * 5
    const ageDays = (Date.now() - new Date(demand.publish_time).getTime()) / 86400000
    score += Math.max(0, 20 - ageDays)
    if (browsedIds.has(demand._id)) score *= 0.3
    return { ...demand, _score: Math.round(score) }
  })

  return scored.sort((a, b) => b._score - a._score).slice(0, limit)
}

export async function getRecommendedProducts(limit = 4, fetcher) {
  const response = await fetcher({ page: 1, pageSize: 100 })
  const preference = readJson(PREFERENCE_KEY, {})
  const products = response?.list || []
  return products
    .map(product => ({
      ...product,
      _score: Number(product.sale_count || 0) +
        (preference.service_types?.[product.service_type] || 0) * 20 +
        (product.is_featured ? 30 : 0)
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
}

export async function getPriceSuggestion(categoryId, quoteType, fetcher) {
  if (quoteType !== 'self') return null

  const response = await fetcher({ page: 1, pageSize: 100 })
  const sameCategory = (response?.list || []).filter(item =>
    item.category_id === categoryId && item.budget_min && item.budget_max
  )
  if (!sameCategory.length) {
    return { min: 5000, max: 50000, avg: 20000, level: '参考', tip: '该分类暂无足够数据，以上为平台默认参考价' }
  }

  const mins = sameCategory.map(item => item.budget_min / 100)
  const maxs = sameCategory.map(item => item.budget_max / 100)
  const min = Math.round(mins.reduce((sum, value) => sum + value, 0) / mins.length)
  const max = Math.round(maxs.reduce((sum, value) => sum + value, 0) / maxs.length)
  const avg = Math.round((min + max) / 2)
  return { min, max, avg, level: '合理', tip: `该分类平均预算 ¥${min}-¥${max}，建议在此区间内报价` }
}

export function scoreDemandQuality(form = {}) {
  const scores = { title: 0, description: 0, budget: 0, contact: 0, category: 0, region: 0 }
  const tips = []

  if (!form.title) { tips.push('请填写需求标题') }
  else if (form.title.length < 8) { scores.title = 8; tips.push('标题太短，建议8字以上描述清楚需求') }
  else if (form.title.length < 20) { scores.title = 15; tips.push('标题不错，可以更具体一些') }
  else scores.title = 20

  if (!form.description) { tips.push('请填写需求详情') }
  else if (form.description.length < 50) { scores.description = 10; tips.push('把预算和交付时间写清楚，别人更容易判断') }
  else if (form.description.length < 200) { scores.description = 22; tips.push('描述较好，加入时间节点和交付物会更吸引人') }
  else scores.description = 30

  if (form.quote_type === 'self') {
    if (form.budget_min && form.budget_max) scores.budget = 15
    else if (form.budget_min) { scores.budget = 10; tips.push('建议填写预算上限，让服务方更好评估') }
    else { scores.budget = 5; tips.push('选择自报价时建议填写预算区间') }
  } else if (form.quote_type === 'negotiate') scores.budget = 8
  else if (form.quote_type === 'by_daren') scores.budget = 6
  else tips.push('请选择报价方式')

  if (form.contact_name && form.contact_phone) scores.contact = 15
  else if (form.contact_name || form.contact_phone) { scores.contact = 7; tips.push('请完善联系方式') }
  else tips.push('请填写联系方式')

  scores.category = form.category_id ? 10 : 0
  if (!form.category_id) tips.push('请选择需求分类')
  scores.region = form.region ? 10 : 0
  if (!form.region) tips.push('请选择需求地区')

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0)
  const level = total >= 80 ? '优秀' : total >= 60 ? '良好' : total >= 40 ? '一般' : '待完善'
  return { scores, total, level, tips }
}

function updatePreference(history) {
  const preference = { categories: {}, regions: {}, service_types: {}, updated: Date.now() }
  history.slice(0, 20).forEach(entry => {
    if (entry.category_id) preference.categories[entry.category_id] = (preference.categories[entry.category_id] || 0) + 1
    if (entry.region && entry.region !== '全国') preference.regions[entry.region] = (preference.regions[entry.region] || 0) + 1
    if (entry.service_type) preference.service_types[entry.service_type] = (preference.service_types[entry.service_type] || 0) + 1
  })
  uni.setStorageSync(PREFERENCE_KEY, JSON.stringify(preference))
}

function readJson(key, fallback) {
  try { return JSON.parse(uni.getStorageSync(key) || JSON.stringify(fallback)) } catch { return fallback }
}
