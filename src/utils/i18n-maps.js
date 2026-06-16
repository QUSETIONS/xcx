/**
 * 响应式枚举映射（随语言切换实时更新）
 *
 * 状态/报价/服务类型等枚举原本硬编码在 constants.js（中文标签），
 * 这里把它们接到 i18n，供页面展示状态徽章、筛选器、报价标签等。
 * 页面用法：import { demandStatusMap as statusMap } from '@/utils/i18n-maps'
 *   模板里 statusMap[item.status] 自动解包；脚本里用 statusMap.value[...]
 */
import { computed } from 'vue'
import { t, locale } from '@/i18n'

// 需求状态：draft/pending/published/offline
export const demandStatusMap = computed(() => ({
  draft: t('status.demand.draft'),
  pending: t('status.demand.pending'),
  published: t('status.demand.published'),
  offline: t('status.demand.offline')
}))

// 订单状态：created/paid/confirmed/serving/completed/cancelled
export const orderStatusMap = computed(() => ({
  created: t('status.order.created'),
  paid: t('status.order.paid'),
  confirmed: t('status.order.confirmed'),
  serving: t('status.order.serving'),
  completed: t('status.order.completed'),
  cancelled: t('status.order.cancelled')
}))

// 对接状态：new/contacted/deal/invalid
export const leadStatusMap = computed(() => ({
  new: t('status.lead.new'),
  contacted: t('status.lead.contacted'),
  deal: t('status.lead.deal'),
  invalid: t('status.lead.invalid')
}))

// 报价方式（数组，供选择器遍历）
export const quoteTypes = computed(() => [
  { value: 'self', label: t('status.quote.self') },
  { value: 'negotiate', label: t('status.quote.negotiate') },
  { value: 'by_daren', label: t('status.quote.byDaren') }
])

// 服务类型：member/linker/survey/resource_pack/certification
export const serviceTypes = computed(() => ({
  member: t('status.service.member'),
  linker: t('status.service.linker'),
  survey: t('status.service.survey'),
  resource_pack: t('status.service.resourcePack'),
  certification: t('status.service.certification')
}))

/** 报价方式 label（找不到回退"面议"） */
export function quoteLabel(type) {
  return quoteTypes.value.find(q => q.value === type)?.label || t('demandDetail.negotiate')
}

/**
 * 分类名：按 category_id 解析（locale.category.cat_XX），找不到回退传入的 name。
 * 数据里分类同时有 category_id 与 category_name，优先用 id 做语言无关解析。
 */
export function categoryName(id, fallback) {
  if (id) {
    const key = 'category.' + id
    const v = t(key)
    if (v && v !== key) return v
  }
  return fallback || ''
}

// 地区名：数据里 region 存的是中文字符串（无 id），英文模式下查表翻译，其余原样返回。
const REGION_EN = {
  '全国': 'Nationwide', '北京': 'Beijing', '上海': 'Shanghai', '广州': 'Guangzhou',
  '深圳': 'Shenzhen', '杭州': 'Hangzhou', '成都': 'Chengdu', '武汉': 'Wuhan',
  '南京': 'Nanjing', '重庆': 'Chongqing', '西安': "Xi'an", '苏州': 'Suzhou',
  '天津': 'Tianjin', '长沙': 'Changsha', '郑州': 'Zhengzhou'
}
export function regionName(name) {
  if (!name) return ''
  return locale.value === 'en-US' ? (REGION_EN[name] || name) : name
}
