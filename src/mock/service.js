/**
 * Mock 数据服务
 * 在没有真实后端时提供完整的数据模拟
 * 所有接口返回格式与真实 API 一致
 */
import { DEMAND_CATEGORIES, REGIONS, QUOTE_TYPES } from '@/config/constants'

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
const LeadStatusValues = ['new', 'contacted', 'deal', 'invalid']

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

// ========== 社区 Mock ==========
const usersData = [
  { id: 'u1', nickname: '营销老司机', avatar: '', company: '字节跳动', bio: '10年营销经验，专注品牌增长', followers: 1280, posts: 45 },
  { id: 'u2', nickname: '运营小能手', avatar: '', company: '腾讯科技', bio: '私域运营专家', followers: 856, posts: 32 },
  { id: 'u3', nickname: '品牌策划师', avatar: '', company: '阿里巴巴', bio: '从0到1打造品牌', followers: 2100, posts: 68 },
  { id: 'u4', nickname: '短视频达人', avatar: '', company: '快手科技', bio: '短视频运营实战派', followers: 3200, posts: 120 },
  { id: 'u5', nickname: '私域增长官', avatar: '', company: '美团点评', bio: '社群裂变方法论', followers: 980, posts: 28 }
]

const topicsData = [
  { id: 't1', name: '品牌营销', icon: '📢', posts: 156, hot: true },
  { id: 't2', name: '短视频运营', icon: '📺', posts: 89, hot: true },
  { id: 't3', name: '私域流量', icon: '💬', posts: 67, hot: true },
  { id: 't4', name: '小红书种草', icon: '📝', posts: 45 },
  { id: 't5', name: '直播带货', icon: '🎬', posts: 38 },
  { id: 't6', name: '达人合作', icon: '🌟', posts: 52 },
  { id: 't7', name: '活动策划', icon: '🎉', posts: 31 },
  { id: 't8', name: '企业服务', icon: '🏢', posts: 28 }
]

const postsData = Array.from({ length: 20 }, (_, i) => ({
  _id: `post_${i + 1}`,
  author: usersData[i % 5],
  content: [
    '分享一个品牌增长的底层逻辑：用户心智占位是关键。最近帮一个新品牌做策划，3个月做到品类TOP3，核心就是找准了差异化定位。',
    '短视频运营的黄金法则：前3秒定生死！测试了100+条视频，发现开场钩子决定80%的完播率。分享我的实战经验...',
    '私域运营不要只盯着GMV！真正的价值是用户LTV。我们团队用这套方法，把复购率从15%提升到了45%',
    '小红书种草的真相：不是发笔记就能爆。研究了50个爆款案例，发现都有这几个共性...',
    '直播带货的冷启动攻略：新号首播怎么做？分享我们团队的7天破冷启动SOP',
    '达人合作避坑指南：签约达人前一定要看清这几点！踩过的坑分享给大家',
    '活动策划的成本控制：如何在有限预算内做出影响力？分享几个实战案例',
    '企业服务选型心得：试用了10+个SaaS工具，总结出这套选型方法论',
    '品牌联名怎么玩才能双赢？分享5个成功案例的底层逻辑',
    '社群运营的4个阶段：从拉新到裂变，每个阶段的关键动作是什么？',
    '内容营销的ROI怎么算？分享我们团队的测算模型和实操案例',
    '新品上市的完整SOP：从0到1如何引爆？分享6个月实战经验',
    'KOC投放策略：如何用小预算撬动大流量？测试后的最优解',
    '品牌危机公关处理：遇到负面舆情怎么办？这套流程能帮到你',
    '私域工具选型：企微vs个人微信？深度对比分析',
    '短视频团队搭建：从剪辑到运营，需要什么样的人？',
    '小红书投放预算分配：信息流vs达人合作哪个更值得？',
    '直播话术设计：如何让观众下单？拆解10个爆款直播间',
    '品牌视觉升级指南：从Logo到VI，如何保持一致性？',
    '用户增长模型：AARRR之外还有什么？分享新的增长框架'
  ][i],
  images: [],
  topic: topicsData[i % 8],
  like_count: randInt(50, 500),
  comment_count: randInt(5, 50),
  share_count: randInt(10, 100),
  view_count: randInt(500, 5000),
  is_hot: i < 5,
  created_at: new Date(Date.now() - randInt(1, 72) * 3600000).toISOString()
}))

const commentsData = Array.from({ length: 50 }, (_, i) => ({
  _id: `comment_${i + 1}`,
  post_id: `post_${(i % 20) + 1}`,
  author: usersData[(i + 2) % 5],
  content: [
    '干货满满！收藏了', '这个方法论很实用', '学习了，感谢分享',
    '我们也在做类似的项目，可以交流一下', '有具体的数据案例吗？', '这个思路很新颖',
    '执行层面有什么建议？', '工具推荐哪个？', '预算大概多少？',
    '效果怎么样？', '多久能看到结果？', '团队需要多少人？',
    '外包还是自己做比较好？', '有什么风险要注意？', 'ROI能达到多少？'
  ][i % 15],
  like_count: randInt(1, 30),
  created_at: new Date(Date.now() - randInt(1, 48) * 3600000).toISOString()
}))

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
  update(id, data) {
    const idx = demandData.findIndex(d => d._id === id)
    if (idx > -1) {
      demandData[idx] = { ...demandData[idx], ...data, status: 'pending', updated_at: new Date().toISOString() }
      return demandData[idx]
    }
    return null
  },
  myDemands(params = {}) {
    return { list: demandData.filter(d => d.created_by === 'demo_user_001').slice(0, 5), total: 5 }
  }
}

export const leadService = {
  create(data) {
    const demand = demandData.find(d => d._id === data.demand_id)
    const item = {
      _id: uid(),
      ...data,
      from_user_id: data.from_user_id || data.user_id || 'demo_user_001',
      demand_title: demand ? demand.title : '',
      demand_owner: demand ? demand.created_by : '',
      status: 'new',
      created_at: new Date().toISOString()
    }
    leadData.unshift(item)
    if (demand) demand.lead_count = (demand.lead_count || 0) + 1

    // 生成通知给需求方
    notifyData.unshift({
      _id: uid(),
      type: 'lead',
      title: '收到新的对接申请',
      desc: `${data.contact_name} 对接了「${item.demand_title}」`,
      time: '刚刚',
      read: false,
      link_id: item._id,
      created_at: new Date().toISOString()
    })

    return item
  },
  myLeads() {
    return { list: leadData.filter(l => l.from_user_id === 'demo_user_001'), total: leadData.filter(l => l.from_user_id === 'demo_user_001').length }
  },
  // 需求方收到的对接（别人对接了我的需求）
  receivedLeads() {
    return { list: leadData.filter(l => l.demand_owner === 'demo_user_001' || true).slice(0, 10), total: leadData.length }
  },
  updateStatus(id, status) {
    const lead = leadData.find(l => l._id === id)
    if (!lead) return null
    lead.status = status
    lead.updated_at = new Date().toISOString()

    // 如果成交，生成deal记录
    if (status === 'deal') {
      dealData.unshift({
        _id: uid(),
        lead_id: id,
        demand_id: lead.demand_id,
        demand_title: lead.demand_title,
        provider_name: lead.contact_name,
        provider_phone: lead.phone,
        owner_id: lead.demand_owner || 'demo_user_001',
        status: 'in_progress',
        amount: 0,
        can_review: true,
        created_at: new Date().toISOString()
      })

      // 通知服务方
      notifyData.unshift({
        _id: uid(),
        type: 'deal',
        title: '需求方已接受您的对接',
        desc: `「${lead.demand_title}」已成交，请及时联系需求方`,
        time: '刚刚',
        read: false,
        link_id: lead.demand_id,
        created_at: new Date().toISOString()
      })
    }

    if (status === 'invalid') {
      notifyData.unshift({
        _id: uid(),
        type: 'lead',
        title: '对接已被拒绝',
        desc: `「${lead.demand_title}」的需求方拒绝了您的对接`,
        time: '刚刚',
        read: false,
        link_id: lead.demand_id,
        created_at: new Date().toISOString()
      })
    }

    return lead
  }
}

// ========== 成交记录 Mock ==========
const dealData = [
  { _id: 'deal_1', lead_id: 'lead_1', demand_id: 'demand_1', demand_title: '寻找活动供应商', provider_name: '李经理', provider_phone: '139****9999', owner_id: 'demo_user_001', status: 'completed', amount: 50000, can_review: false, has_review: true, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { _id: 'deal_2', lead_id: 'lead_2', demand_id: 'demand_3', demand_title: '品牌发布会全案策划', provider_name: '王总监', provider_phone: '138****8888', owner_id: 'demo_user_001', status: 'in_progress', amount: 80000, can_review: true, has_review: false, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
]

// ========== 通知 Mock ==========
const notifyData = [
  { _id: 'n1', type: 'system', title: '系统维护通知', desc: '系统将于今晚22:00进行维护升级', time: '刚刚', read: false, link_id: '' },
  { _id: 'n2', type: 'lead', title: '收到新的对接申请', desc: '张经理对接了「短视频运营合作」需求', time: '10分钟前', read: false, link_id: 'lead_1' },
  { _id: 'n3', type: 'deal', title: '需求方已接受您的对接', desc: '「品牌发布会」已成交', time: '1小时前', read: false, link_id: 'demand_3' },
  { _id: 'n4', type: 'system', title: '需求审核通过', desc: '您发布的「品牌营销策划」已通过审核', time: '2小时前', read: true, link_id: '' },
  { _id: 'n5', type: 'interact', title: '新的评论', desc: '李总评论了您的帖子', time: '昨天', read: true, link_id: '' },
]

// ========== 成交服务 ==========
export const dealService = {
  myDeals() {
    return { list: dealData.filter(d => d.owner_id === 'demo_user_001' || true), total: dealData.length }
  },
  updateStatus(id, status) {
    const deal = dealData.find(d => d._id === id)
    if (deal) { deal.status = status; return deal }
    return null
  },
  addReview(id, reviewData) {
    const deal = dealData.find(d => d._id === id)
    if (deal) {
      deal.has_review = true
      deal.can_review = false
      reviewService.create({ ...reviewData, target_id: deal.demand_id })
      return { success: true }
    }
    return { success: false }
  }
}

// ========== 通知服务 ==========
export const notifyService = {
  list(params = {}) {
    const { type } = params
    let list = [...notifyData]
    if (type && type !== 'all') list = list.filter(n => n.type === type)
    return { list, total: list.length, unread: notifyData.filter(n => !n.read).length }
  },
  read(id) {
    const n = notifyData.find(n => n._id === id)
    if (n) n.read = true
  },
  readAll() { notifyData.forEach(n => n.read = true) },
  unreadCount() { return notifyData.filter(n => !n.read).length }
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
  myOrders(params = {}) {
    const { status } = params
    let list = [...orderData]
    if (status && status !== 'all') {
      // 分组：待处理（created/paid/confirmed）服务中（serving）已完成（completed）
      if (status === 'pending') list = list.filter(o => ['created', 'paid', 'confirmed'].includes(o.status))
      else list = list.filter(o => o.status === status)
    }
    return { list, total: list.length }
  },
  detail(id) { return orderData.find(o => o._id === id) || null },
  updateStatus(id, status) {
    const o = orderData.find(o => o._id === id)
    if (o) o.status = status
    return o
  }
}

// ========== 购物车 ==========
export const cartService = {
  _key: 'qiye_ku_cart',
  _getList() {
    try { return JSON.parse(uni.getStorageSync(this._key) || '[]') } catch { return [] }
  },
  _save(list) { uni.setStorageSync(this._key, JSON.stringify(list)) },
  add(product) {
    const list = this._getList()
    const idx = list.findIndex(i => i._id === product._id)
    if (idx > -1) {
      list[idx].quantity += 1
    } else {
      list.unshift({ _id: product._id, title: product.title, price: product.price, service_type: product.service_type, quantity: 1 })
    }
    this._save(list)
    return list
  },
  updateQty(id, quantity) {
    const list = this._getList()
    const idx = list.findIndex(i => i._id === id)
    if (idx > -1) {
      if (quantity <= 0) { list.splice(idx, 1) }
      else { list[idx].quantity = quantity }
    }
    this._save(list)
    return list
  },
  remove(id) {
    const list = this._getList().filter(i => i._id !== id)
    this._save(list)
    return list
  },
  clear() { this._save([]) },
  list() { return this._getList() },
  count() {
    return this._getList().reduce((s, i) => s + i.quantity, 0)
  },
  total() {
    return this._getList().reduce((s, i) => s + i.price * i.quantity, 0)
  }
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
    if (idx > -1) { list.splice(idx, 1); uni.setStorageSync(this._key, JSON.stringify(list)); return { isFavorited: false } }
    else { list.push(params); uni.setStorageSync(this._key, JSON.stringify(list)); return { isFavorited: true } }
  },
  list(params = {}) {
    const list = this._getList().filter(f => !params.type || f.targetType === params.type)
    return { list, total: list.length }
  }
}

// ========== 评价 Mock ==========
const reviewsData = Array.from({ length: 30 }, (_, i) => ({
  _id: `review_${i + 1}`,
  target_id: `demand_${(i % 20) + 1}`,
  reviewer: usersData[i % 5],
  rating: pick([5, 5, 5, 4, 4, 4, 3, 5]),
  content: [
    '服务非常专业，交付及时，沟通顺畅，强烈推荐！',
    '整体满意，响应速度快，方案有创意，下次还合作。',
    '基本满足需求，细节可以再完善，总体OK。',
    '非常满意！超出预期，团队执行力强。',
    '专业靠谱，按时交付，效果很好。',
    '合作愉快，质量过硬，推荐给大家。',
    '不错的服务商，价格合理，效果好。',
  ][i % 7],
  tags: pick([['专业', '及时', '靠谱'], ['创意', '高效'], ['性价比高', '沟通顺畅'], ['经验丰富']]),
  created_at: new Date(Date.now() - randInt(1, 60) * 86400000).toISOString()
}))

// ========== 服务商 Mock ==========
const providersData = Array.from({ length: 20 }, (_, i) => ({
  _id: `provider_${i + 1}`,
  name: ['创想营销', '新媒动力', '品牌工场', '增长黑客', '内容星球', '流量引擎', '视觉前线', '活动大师', '传播矩阵', '社交流', '数字脉搏', '创艺空间', '营销智库', '品牌导航', '增长实验室', '内容工厂', '视觉风暴', '活动策划邦', '传播工坊', '社群研究院'][i],
  avatar: '',
  category_id: DEMAND_CATEGORIES[i % 10].id,
  category_name: DEMAND_CATEGORIES[i % 10].name,
  region: pick(REGIONS),
  rating: (4 + Math.random()).toFixed(1),
  deal_count: randInt(10, 200),
  response_rate: randInt(80, 99),
  avg_price: pick([5000, 10000, 20000, 50000]),
  tags: pick([['专业团队', '快速响应'], ['性价比高', '经验丰富'], ['创意驱动', '数据导向'], ['全案服务', '一对一定制']]),
  intro: '专注企业服务10年，累计服务500+客户，交付率99%，好评率98%。',
  verified: i < 10,
  is_featured: i < 5
}))

// ========== 数据统计 Mock ==========
const dashboardData = {
  overview: {
    total_views: randInt(1000, 5000),
    total_leads: randInt(50, 200),
    total_deals: randInt(10, 50),
    total_revenue: randInt(100000, 500000),
    conversion_rate: (Math.random() * 20 + 5).toFixed(1),
    avg_response_time: randInt(1, 6) + '小时'
  },
  trend_7days: Array.from({ length: 7 }, (_, i) => ({
    date: `${i + 1}日`,
    views: randInt(50, 300),
    leads: randInt(2, 15),
    deals: randInt(0, 5)
  })),
  trend_30days: Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}日`,
    views: randInt(30, 250),
    leads: randInt(1, 12),
    deals: randInt(0, 4)
  })),
  category_stats: DEMAND_CATEGORIES.slice(0, 6).map(cat => ({
    name: cat.name,
    count: randInt(5, 50),
    color: pick(['#FF6B35', '#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'])
  }))
}

export const communityService = {
  // 话题列表
  topics() { return topicsData },

  // 帖子列表
  posts(params = {}) {
    const { page = 1, pageSize = 10, topic_id, sort = 'latest', hot } = params
    let list = [...postsData]

    if (topic_id) list = list.filter(p => p.topic?.id === topic_id)
    if (hot) list = list.filter(p => p.is_hot)

    if (sort === 'hot') list.sort((a, b) => b.like_count + b.comment_count - a.like_count - a.comment_count)
    else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length }
  },

  // 帖子详情
  postDetail(id) { return postsData.find(p => p._id === id) || null },

  // 发布帖子
  createPost(data) {
    const item = {
      _id: uid(),
      author: { ...usersData[0], id: 'demo_user_001', nickname: '演示用户', company: '示例科技' },
      content: data.content,
      images: data.images || [],
      topic: topicsData.find(t => t.id === data.topic_id),
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      view_count: 0,
      is_hot: false,
      created_at: new Date().toISOString()
    }
    postsData.unshift(item)
    return item
  },

  // 评论列表
  comments(postId) {
    return commentsData.filter(c => c.post_id === postId)
  },

  // 发布评论
  createComment(postId, content) {
    const item = {
      _id: uid(),
      post_id: postId,
      author: { ...usersData[0], id: 'demo_user_001', nickname: '演示用户' },
      content,
      like_count: 0,
      created_at: new Date().toISOString()
    }
    commentsData.unshift(item)
    const post = postsData.find(p => p._id === postId)
    if (post) post.comment_count++
    return item
  },

  // 点赞
  like(postId) {
    const post = postsData.find(p => p._id === postId)
    if (post) { post.like_count++; return { liked: true, count: post.like_count } }
    return { liked: false, count: 0 }
  },

  // 用户信息
  userInfo(userId) { return usersData.find(u => u.id === userId) || null }
}

// ========== 评价服务 ==========
export const reviewService = {
  list(params = {}) {
    const { target_id, page = 1, pageSize = 10 } = params
    let list = [...reviewsData]
    if (target_id) list = list.filter(r => r.target_id === target_id)
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length }
  },
  create(data) {
    const item = {
      _id: uid(),
      reviewer: { ...usersData[0], id: 'demo_user_001', nickname: '演示用户' },
      ...data,
      created_at: new Date().toISOString()
    }
    reviewsData.unshift(item)
    return item
  },
  avgRating(target_id) {
    const list = reviewsData.filter(r => r.target_id === target_id)
    if (!list.length) return { avg: 0, count: 0 }
    const avg = (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1)
    return { avg: parseFloat(avg), count: list.length }
  },
  userCreditScore(userId = 'demo_user_001') {
    return { score: randInt(75, 98), level: '优秀', deals: randInt(10, 50), reviews: randInt(5, 30) }
  }
}

// ========== 服务商匹配服务 ==========
export const matchService = {
  // AI智能匹配：根据需求推荐服务商
  matchProviders(demand) {
    if (!demand) return []
    let list = [...providersData]

    // 匹配算法：分类匹配(权重40%) + 地区匹配(权重20%) + 评分(权重20%) + 成交量(权重20%)
    list = list.map(p => {
      let score = 0
      if (p.category_id === demand.category_id) score += 40
      if (p.region === demand.region) score += 20
      score += parseFloat(p.rating) * 4
      score += Math.min(20, p.deal_count / 10)
      return { ...p, match_score: Math.round(score), match_percent: Math.min(99, Math.round(score)) + '%' }
    })

    list.sort((a, b) => b.match_score - a.match_score)
    return list.slice(0, 5)
  },
  // 推荐服务商列表
  listProviders(params = {}) {
    const { page = 1, pageSize = 10, category_id, keyword } = params
    let list = [...providersData]
    if (category_id) list = list.filter(p => p.category_id === category_id)
    if (keyword) list = list.filter(p => p.name.includes(keyword) || p.category_name.includes(keyword))
    list.sort((a, b) => b.deal_count - a.deal_count)
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length }
  },
  providerDetail(id) { return providersData.find(p => p._id === id) || null }
}

// ========== 数据看板服务 ==========
export const dashboardService = {
  overview() { return dashboardData.overview },
  trend(days = 7) { return days === 7 ? dashboardData.trend_7days : dashboardData.trend_30days },
  categoryStats() { return dashboardData.category_stats },
  // 计算趋势变化
  trendChange(days = 7) {
    const data = days === 7 ? dashboardData.trend_7days : dashboardData.trend_30days
    const half = Math.floor(data.length / 2)
    const first = data.slice(0, half)
    const second = data.slice(half)
    const sumViews1 = first.reduce((s, d) => s + d.views, 0)
    const sumViews2 = second.reduce((s, d) => s + d.views, 0)
    const viewsChange = sumViews1 > 0 ? Math.round((sumViews2 - sumViews1) / sumViews1 * 100) : 0
    return { views: viewsChange + '%', leads: '+' + randInt(5, 20) + '%', deals: '+' + randInt(2, 15) + '%' }
  }
}

// ========== 搜索 Mock ==========
const hotKeywords = ['短视频代运营', '品牌全案', '抖音达人', '私域流量', '宣传片拍摄', '小红书种草', '直播带货', 'VI设计']
export const searchService = {
  hotKeywords() { return hotKeywords },
  history() {
    try { return JSON.parse(uni.getStorageSync('search_history') || '[]') } catch { return [] }
  },
  addHistory(keyword) {
    if (!keyword || !keyword.trim()) return
    const list = this.history().filter(k => k !== keyword)
    list.unshift(keyword)
    uni.setStorageSync('search_history', JSON.stringify(list.slice(0, 10)))
  },
  clearHistory() { uni.removeStorageSync('search_history') },
  search(keyword) {
    const kw = (keyword || '').trim().toLowerCase()
    if (!kw) return { demands: [], products: [], posts: [], total: 0 }
    const demands = demandData.filter(d => d.title.toLowerCase().includes(kw) || d.category_name.toLowerCase().includes(kw)).slice(0, 5)
    const products = productData.filter(p => p.title.toLowerCase().includes(kw) || (p.tags || []).some(t => t.toLowerCase().includes(kw))).slice(0, 4)
    const posts = postsData.filter(p => p.content.toLowerCase().includes(kw)).slice(0, 4)
    return { demands, products, posts, total: demands.length + products.length + posts.length }
  }
}

// ========== 企业认证 Mock ==========
export const verifyService = {
  _key: 'qiye_ku_verify',
  getInfo() {
    try { return JSON.parse(uni.getStorageSync(this._key) || 'null') } catch { return null }
    // 默认状态：未认证
  },
  status() {
    const info = this.getInfo()
    if (!info) return 'none'
    return info.status // none / pending / verified / rejected
  },
  submit(data) {
    const info = { ...data, status: 'pending', submitted_at: new Date().toISOString() }
    uni.setStorageSync(this._key, JSON.stringify(info))
    return info
  },
  // 模拟审核通过
  approve() {
    const info = this.getInfo()
    if (info) { info.status = 'verified'; info.verified_at = new Date().toISOString(); uni.setStorageSync(this._key, JSON.stringify(info)) }
    return info
  }
}

// ========== 会员体系 Mock ==========
const memberTiers = [
  {
    id: 'free', name: '普通会员', price: 0, period: '永久',
    color: '#94A3B8', icon: '👤',
    privileges: ['每日发布3条需求', '基础搜索', '社区发帖']
  },
  {
    id: 'pro', name: '专业版', price: 29900, period: '年', original: 59900,
    color: '#FF6B35', icon: '⭐', hot: true,
    privileges: ['无限发布需求', '需求优先推荐', '智能价格建议', '数据看板', '专属客服', '认证加速']
  },
  {
    id: 'enterprise', name: '企业版', price: 99900, period: '年', original: 199900,
    color: '#6366F1', icon: '👑',
    privileges: ['专业版全部权益', '专属客户经理', '定制营销方案', 'API接口接入', '团队多人协作', '白皮书定制']
  }
]
export const memberService = {
  tiers() { return memberTiers },
  current() {
    try {
      const info = JSON.parse(uni.getStorageSync('qiye_ku_member') || 'null')
      return info || { tier: 'free', expire: null }
    } catch { return { tier: 'free', expire: null } }
  },
  subscribe(tierId) {
    const tier = memberTiers.find(t => t.id === tierId)
    if (!tier) return null
    const info = { tier: tierId, name: tier.name, expire: '2027-06-16', subscribed_at: new Date().toISOString() }
    uni.setStorageSync('qiye_ku_member', JSON.stringify(info))
    return info
  }
}

// ========== 客服IM Mock ==========
const seedMessages = [
  { id: 'm1', from: 'service', content: '您好，欢迎来到企业库，我是您的专属客服，有什么可以帮您？', time: '10:00' },
  { id: 'm2', from: 'user', content: '我想了解一下专业版会员的权益', time: '10:02' },
  { id: 'm3', from: 'service', content: '专业版年费299元，包含无限发布需求、优先推荐、数据看板等6大权益，现在开通还赠送100积分哦～', time: '10:03' }
]
const autoReplies = [
  '收到您的消息，稍等为您处理～',
  '这个问题我帮您查一下，请稍候',
  '已为您记录反馈，客服将在24小时内跟进',
  '感谢您的咨询，还有其他问题可以随时问我～',
  '好的，已为您加急处理！'
]
export const chatService = {
  _key: 'qiye_ku_chat',
  _getList() {
    try { const list = JSON.parse(uni.getStorageSync(this._key) || 'null'); return list || seedMessages.map(m => ({ ...m })) } catch { return seedMessages.map(m => ({ ...m })) }
  },
  list() { return this._getList() },
  send(content) {
    const list = this._getList()
    const now = new Date()
    const msg = { id: uid(), from: 'user', content, time: now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') }
    list.push(msg)
    uni.setStorageSync(this._key, JSON.stringify(list))
    return list
  },
  // 模拟客服自动回复
  reply() {
    const list = this._getList()
    const now = new Date()
    const msg = { id: uid(), from: 'service', content: pick(autoReplies), time: now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') }
    list.push(msg)
    uni.setStorageSync(this._key, JSON.stringify(list))
    return list
  }
}

// ========== 活动营销 Mock ==========
const campaignData = [
  { id: 'c1', title: '新人专享 · 首单立减50元', desc: '注册即可领取新人礼包', cover: '🎁', tag: '限时', color: '#FF6B35', end: '3天后', type: 'coupon' },
  { id: 'c2', title: '专业版会员5折抢购', desc: '年卡直降300元，仅限本周', cover: '⭐', tag: '热卖', color: '#6366F1', end: '5天后', type: 'member' },
  { id: 'c3', title: '邀请好友得现金奖励', desc: '每邀请1位好友注册得20元', cover: '👥', tag: '长期', color: '#10B981', end: '长期有效', type: 'invite' },
  { id: 'c4', title: '需求方专属 · 发布赢积分', desc: '发布需求即送50积分，上不封顶', cover: '🚀', tag: '活动', color: '#F59E0B', end: '15天后', type: 'task' },
  { id: 'c5', title: '服务方PK赛 · 接单排行榜', desc: 'TOP10服务商瓜分万元奖金', cover: '🏆', tag: '赛事', color: '#EC4899', end: '20天后', type: 'rank' },
  { id: 'c6', title: '520营销季 · 全场服务8折', desc: '精选服务限时特惠', cover: '💝', tag: '特惠', color: '#3B82F6', end: '7天后', type: 'discount' }
]
export const campaignService = {
  list() { return campaignData },
  detail(id) { return campaignData.find(c => c.id === id) || null }
}


// ========== 签到积分 Mock ==========
const pointsData = {
  balance: 2680,
  history: [
    { _id: 'p1', type: 'checkin', points: 10, desc: '每日签到', date: '今天' },
    { _id: 'p2', type: 'publish', points: 50, desc: '发布需求奖励', date: '昨天' },
    { _id: 'p3', type: 'lead', points: 20, desc: '成功对接奖励', date: '2天前' },
    { _id: 'p4', type: 'checkin', points: 10, desc: '每日签到', date: '3天前' },
    { _id: 'p5', type: 'invite', points: 100, desc: '邀请好友奖励', date: '5天前' },
    { _id: 'p6', type: 'checkin', points: 10, desc: '每日签到+连续7天奖励', date: '7天前' },
  ],
  checkinStreak: 7,
  todayChecked: false,
  rules: [
    { action: '每日签到', points: '+10' },
    { action: '连续7天', points: '+50' },
    { action: '发布需求', points: '+50' },
    { action: '成功对接', points: '+20' },
    { action: '发表帖子', points: '+15' },
    { action: '邀请好友', points: '+100' },
  ]
}

// ========== 优惠券 Mock ==========
const couponData = [
  { _id: 'c1', name: '新人专享券', amount: 5000, minSpend: 10000, expire: '2026-12-31', status: 'available', desc: '满100减50' },
  { _id: 'c2', name: '会员折扣券', amount: 2000, minSpend: 5000, expire: '2026-07-31', status: 'available', desc: '满50减20' },
  { _id: 'c3', name: '调研卡优惠券', amount: 3000, minSpend: 0, expire: '2026-08-15', status: 'available', desc: '无门槛减30' },
  { _id: 'c4', name: '链接官体验券', amount: 1000, minSpend: 0, expire: '2026-06-30', status: 'available', desc: '无门槛减10' },
]

// ========== 关注 Mock ==========
const followData = [
  { _id: 'f1', user: usersData[0], followed_at: '2026-06-10' },
  { _id: 'f2', user: usersData[2], followed_at: '2026-06-08' },
  { _id: 'f3', user: usersData[4], followed_at: '2026-06-05' },
]

// ========== 签到积分服务 ==========
export const pointsService = {
  getInfo() { return pointsData },
  checkin() {
    if (pointsData.todayChecked) return { success: false, msg: '今天已签到' }
    pointsData.todayChecked = true
    pointsData.checkinStreak++
    const bonus = pointsData.checkinStreak % 7 === 0 ? 50 : 10
    pointsData.balance += bonus
    pointsData.history.unshift({ _id: uid(), type: 'checkin', points: bonus, desc: bonus > 10 ? '签到+连续奖励' : '每日签到', date: '刚刚' })
    return { success: true, points: bonus, streak: pointsData.checkinStreak, balance: pointsData.balance }
  },
  history() { return pointsData.history },
  rules() { return pointsData.rules }
}

// ========== 优惠券服务 ==========
export const couponService = {
  list() { return couponData.filter(c => c.status === 'available') },
  claim(id) {
    const c = couponData.find(c => c._id === id)
    if (c) { c.status = 'claimed'; return { success: true, coupon: c } }
    return { success: false }
  },
  available() { return couponData.filter(c => c.status === 'available').length }
}

// ========== 关注服务 ==========
export const followService = {
  list() { return followData },
  count() { return followData.length },
  check(userId) { return followData.some(f => f.user.id === userId) },
  toggle(userId) {
    const idx = followData.findIndex(f => f.user.id === userId)
    if (idx > -1) { followData.splice(idx, 1); return { followed: false } }
    const user = usersData.find(u => u.id === userId)
    if (user) { followData.unshift({ _id: uid(), user, followed_at: '刚刚' }); return { followed: true } }
    return { followed: false }
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
  favorite: favoriteService,
  community: communityService,
  review: reviewService,
  match: matchService,
  dashboard: dashboardService,
  points: pointsService,
  coupon: couponService,
  follow: followService,
  deal: dealService,
  notify: notifyService,
  cart: cartService,
  search: searchService,
  verify: verifyService,
  member: memberService,
  chat: chatService,
  campaign: campaignService
}

export default mockService