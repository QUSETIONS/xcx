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
  community: communityService
}

export default mockService