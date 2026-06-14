/**
 * Mock 数据服务
 * 在没有真实后端时提供完整的数据模拟
 * 所有接口返回格式与真实 API 一致
 */
import { DEMAND_CATEGORIES, REGIONS, QUOTE_TYPES, SERVICE_TYPES, ORDER_STATUS, DEMAND_STATUS, LEAD_STATUS } from '@/config/constants'

// ========== 工具函数 ==========
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))
const uid = () => 'id_' + Math.random().toString(36).slice(2, 10)
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[randInt(0, arr.length - 1)]

// ========== 需求 Mock ==========
const demandData = Array.from({ length: 30 }, (_, i) => ({
  _id: `demand_${i + 1}`,
  title: [
    '寻找短视频代运营团队', '品牌全案策划需求', '企业宣传片拍摄',
    '抖音达人合作推广', '新媒体矩阵搭建', '线下活动策划执行',
    '小红书种草方案', '品牌VI设计升级', '私域流量运营方案',
    '电商直播带货合作', 'B站内容营销策划', '企业官网改版需求',
    '公众号代运营服务', '社群运营方案定制', '抖音蓝V认证代办',
    '信息流广告投放', '品牌IP形象设计', '年度营销策略咨询',
    'KOC种草资源对接', '展会活动策划执行', '企业短视频培训',
    '品牌故事片拍摄', '微信生态运营方案', '跨境营销推广需求',
    '企业内训方案定制', '行业白皮书编写', '品牌口碑管理方案',
    '社群裂变增长策划', '产品包装设计方案', '整合营销全案需求'
  ][i],
  company_name: ['字节跳动', '腾讯科技', '阿里巴巴', '美团点评', '京东集团', '小米科技', '华为技术', '网易', '百度', '拼多多', '快手科技', '滴滴出行', '携程旅行', '小红书', 'B站'][i % 15],
  category_id: DEMAND_CATEGORIES[i % 10].id,
  category_name: DEMAND_CATEGORIES[i % 10].name,
  region: pick(REGIONS),
  quote_type: pick(QUOTE_TYPES).value,
  budget_min: pick([5000, 10000, 20000, 50000, 100000]),
  budget_max: pick([20000, 50000, 100000, 200000, 500000]),
  description: '这是对需求的详细描述，包含具体要求、时间节点和交付物标准等信息。企业希望找到专业的服务方来完成该项目。',
  contact_name: '张经理',
  contact_phone: '138****8888',
  view_count: randInt(100, 5000),
  lead_count: randInt(1, 30),
  favorite_count: randInt(0, 50),
  is_top: i < 3,
  status: i < 3 ? 'published' : pick(['published', 'published', 'published', 'pending']),
  created_by: 'demo_user_001',
  publish_time: new Date(Date.now() - randInt(1, 30) * 86400000).toISOString(),
  expire_time: new Date(Date.now() + randInt(10, 60) * 86400000).toISOString()
}))

// ========== 商品 Mock ==========
const productData = Array.from({ length: 12 }, (_, i) => {
  const types = ['member', 'linker', 'survey', 'resource_pack', 'certification']
  const type = types[i % 5]
  const names = {
    member: ['年度会员·畅享版', '年度会员·尊享版', '月度体验会员'],
    linker: ['链接官·季度服务', '链接官·年度服务', '链接官·项目制'],
    survey: ['行业调研·基础版', '行业调研·深度版', '定制调研方案'],
    resource_pack: ['品牌方案资源包', '新媒体运营资源包', '活动策划资源包'],
    certification: ['企业认证·标准版', '企业认证·高级版', '服务商认证']
  }
  const prices = { member: [9900, 29900, 2900], linker: [19900, 49900, 9900], survey: [14900, 39900, 69900], resource_pack: [4900, 9900, 6900], certification: [9900, 19900, 4900] }
  return {
    _id: `product_${i + 1}`,
    title: names[type][i % 3],
    service_type: type,
    category_id: DEMAND_CATEGORIES[i % 10].id,
    price: prices[type][i % 3],
    market_price: prices[type][i % 3] * 1.5,
    unit: ['年', '季', '次', '套', '年'][i % 5],
    sale_count: randInt(20, 800),
    is_featured: i < 6,
    status: 'on_sale',
    description_rich: '<p>服务详细介绍...</p><p>包含以下权益：</p><p>1. 基础服务内容</p><p>2. 专属客服支持</p>',
    cover_url: ''
  }
})

// ========== 订单 Mock ==========
const orderData = Array.from({ length: 8 }, (_, i) => ({
  _id: `order_${i + 1}`,
  user_id: 'demo_user_001',
  items: [{
    _id: productData[i]._id,
    title: productData[i].title,
    service_type: productData[i].service_type,
    price: productData[i].price,
    quantity: 1
  }],
  total_amount: productData[i].price,
  status: pick(['created', 'paid', 'confirmed', 'serving', 'completed']),
  contact_name: '张经理',
  phone: '13800008888',
  remark: '',
  created_at: new Date(Date.now() - randInt(1, 30) * 86400000).toISOString()
}))

// ========== 对接 Mock ==========
const leadData = Array.from({ length: 10 }, (_, i) => ({
  _id: `lead_${i + 1}`,
  demand_id: demandData[i]._id,
  demand_title: demandData[i].title,
  user_id: 'demo_user_001',
  contact_name: '李总',
  phone: '139****9999',
  wechat: 'lead_wx_' + (i + 1),
  message: '我们团队有丰富经验，可以为您提供专业服务。',
  status: pick(LeadStatusValues),
  created_at: new Date(Date.now() - randInt(1, 15) * 86400000).toISOString()
}))
const LeadStatusValues = ['new', 'contacted', 'deal', 'invalid']

// ========== 资料 Mock ==========
const resourceData = Array.from({ length: 15 }, (_, i) => ({
  _id: `resource_${i + 1}`,
  title: ['2024年品牌营销趋势报告', '新媒体运营SOP手册', '私域流量增长方法论', '直播带货选品策略', '短视频爆款脚本模板',
    'KOC种草投放指南', '企业抖音运营白皮书', '品牌危机公关预案', '社群活跃度提升方案', '小红书笔记写作技巧',
    'B站UP主合作策略', '信息流广告素材库', '展会活动预算模板', '品牌IP联名方案合集', '电商大促策划SOP'][i],
  category_id: DEMAND_CATEGORIES[i % 10].id,
  category_name: DEMAND_CATEGORIES[i % 10].name,
  summary: '本资料详细介绍了行业最新趋势和实践方法论，包含大量实战案例和可复用的模板框架。',
  file_type: pick(['pdf', 'docx', 'pptx', 'xlsx']),
  file_size: randInt(2, 50) + 'MB',
  view_count: randInt(200, 8000),
  download_count: randInt(50, 2000),
  favorite_count: randInt(10, 300),
  is_free: i < 5,
  price: i < 5 ? 0 : pick([990, 1990, 2990, 4990]),
  created_at: new Date(Date.now() - randInt(1, 60) * 86400000).toISOString()
}))

// ========== Banner Mock ==========
const bannerData = [
  { _id: 'b1', title: '百万营销方案精选', subtitle: '行业大咖方案一键获取', type: 'demand', target_id: '' },
  { _id: 'b2', title: '需求对接·精准匹配', subtitle: '发布需求快速找到服务方', type: 'zone', target_id: '' },
  { _id: 'b3', title: '链接官服务上线', subtitle: '专属链接官为您精准匹配', type: 'product', target_id: 'product_2' }
]

// ========== 用户 Mock ==========
const userData = {
  user: {
    id: 'demo_user_001',
    openid: 'oDemo_openid_001',
    nickname: '张经理',
    avatar_url: '',
    phone: '13800008888',
    company: '示例科技有限公司',
    role: 'user'
  },
  token: 'demo_token_' + Date.now()
}

const adminData = {
  user: {
    id: 'demo_admin_001',
    openid: 'oDemo_adminid_001',
    nickname: '管理员',
    avatar_url: '',
    phone: '13900009999',
    company: '企动库运营团队',
    role: 'admin'
  },
  token: 'admin_token_' + Date.now()
}

// ========== 服务层 ==========
export const userService = {
  async login(code) { await delay(); return userData },
  async demoLogin(role) { await delay(); return role === 'admin' ? adminData : userData },
  async getInfo() { await delay(); return userData.user },
  async updateProfile(data) { await delay(); return { ...userData.user, ...data } }
}

export const demandService = {
  list(params = {}) {
    const { page = 1, pageSize = 10, sort = 'latest', keyword, category_id, region, quote_type } = params
    let list = [...demandData].filter(d => d.status === 'published')

    if (keyword) list = list.filter(d => d.title.includes(keyword) || d.company_name.includes(keyword))
    if (category_id) list = list.filter(d => d.category_id === category_id)
    if (region && region !== '全国') list = list.filter(d => d.region === region)
    if (quote_type) list = list.filter(d => d.quote_type === quote_type)

    if (sort === 'hot') list.sort((a, b) => b.view_count - a.view_count)
    else if (sort === 'latest') list.sort((a, b) => new Date(b.publish_time) - new Date(a.publish_time))

    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length }
  },
  detail(id) { return demandData.find(d => d._id === id) || null },
  create(data) {
    const item = { _id: uid(), ...data, status: 'pending', view_count: 0, lead_count: 0, favorite_count: 0, publish_time: new Date().toISOString() }
    demandData.unshift(item)
    return item
  },
  myDemands(params = {}) {
    return { list: demandData.filter(d => d.created_by === 'demo_user_001').slice(0, 5), total: 5 }
  }
}

export const leadService = {
  create(data) {
    const item = { _id: uid(), ...data, status: 'new', created_at: new Date().toISOString() }
    leadData.unshift(item)
    return item
  },
  myLeads() {
    return { list: leadData.slice(0, 5), total: leadData.length }
  }
}

export const productService = {
  list(params = {}) {
    const { page = 1, pageSize = 10, service_type, keyword } = params
    let list = [...productData]
    if (service_type) list = list.filter(p => p.service_type === service_type)
    if (keyword) list = list.filter(p => p.title.includes(keyword))
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length }
  },
  detail(id) { return productData.find(p => p._id === id) || null }
}

export const orderService = {
  create(data) {
    const item = { _id: uid(), ...data, status: 'created', created_at: new Date().toISOString() }
    orderData.unshift(item)
    return item
  },
  myOrders() {
    return { list: orderData, total: orderData.length }
  },
  detail(id) { return orderData.find(o => o._id === id) || null }
}

export const resourceService = {
  list(params = {}) {
    const { page = 1, pageSize = 10, category_id, keyword } = params
    let list = [...resourceData]
    if (category_id) list = list.filter(r => r.category_id === category_id)
    if (keyword) list = list.filter(r => r.title.includes(keyword))
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length }
  },
  detail(id) { return resourceData.find(r => r._id === id) || null }
}

export const bannerService = {
  list() { return bannerData }
}

export const favoriteService = {
  _key: 'qiye_ku_favorites',
  _getList() {
    try { return JSON.parse(uni.getStorageSync(this._key) || '[]') } catch { return [] }
  },
  check(params) { return this._getList().some(f => f.targetType === params.targetType && f.targetId === params.targetId) },
  toggle(params) {
    const list = this._getList()
    const idx = list.findIndex(f => f.targetType === params.targetType && f.targetId === params.targetId)
    if (idx > -1) { list.splice(idx, 1); return { isFavorited: false } }
    else { list.push(params); uni.setStorageSync(this._key, JSON.stringify(list)); return { isFavorited: true } }
  },
  list(params = {}) {
    const list = this._getList().filter(f => !params.type || f.targetType === params.type)
    return { list, total: list.length }
  }
}

// 统一导出
export const mockService = {
  user: userService,
  demand: demandService,
  lead: leadService,
  product: productService,
  order: orderService,
  resource: resourceService,
  banner: bannerService,
  favorite: favoriteService
}

export default mockService