/**
 * Mock 数据服务
 * 在没有真实后端时提供完整的数据模拟
 * 所有接口返回格式与真实 API 一致
 */
import { DEMAND_CATEGORIES, REGIONS, QUOTE_TYPES, STORAGE_KEYS, THEME } from '@/config/constants'
import { scoreDemandMatch, scoreProviderMatch } from '@/utils/matching'
import { cooperationSnapshot } from '@/data/cooperation-catalog'
import { cloneIntake, derivePoolTags, emptyIntakeForm, INTAKE_OPTIONS, REFERRAL_REWARD_OPTIONS, REFERRAL_RULES } from '@/utils/intake'
import { MEMBER_LEVELS, getMembership } from '../../../Package/Member/levels.mjs'

// ========== 工具函数 ==========
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

// 确定性伪随机：固定种子，保证种子数据跨进程/跨测试完全可复现，
// 消除依赖聚合值的断言(Math.random 随机种子)导致的偶发失败。
// mulberry32 —— 仅用于 mock 数据生成，非安全场景。
let _seed = 0x2F6E2B1
function rng() {
  _seed |= 0
  _seed = (_seed + 0x6D2B79F5) | 0
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const uid = () => 'id_' + rng().toString(36).slice(2, 10)
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min
const pick = (arr) => arr[randInt(0, arr.length - 1)]
const mockGroupMessageCursor = (createdAt, sequence) => `${String(createdAt || '').trim()}|${sequence}`
const decorateMockGroupMessages = (list = []) => list.map((item, index) => ({
  ...item,
  cursor: mockGroupMessageCursor(item.created_at, index + 1),
  cursor_id: String(index + 1)
}))
// 预算区间成对抽取，保证 budget_min <= budget_max，避免生成非法预算数据
const BUDGET_RANGES = [[5000, 50000], [10000, 100000], [20000, 200000], [50000, 500000], [100000, 500000]]
const pickBudget = () => { const [budget_min, budget_max] = pick(BUDGET_RANGES); return { budget_min, budget_max } }

// ========== 需求 Mock ==========
const demandData = Array.from({ length: 50 }, (_, i) => ({
  _id: `demand_${i + 1}`,
  title: [
    '寻找新品上市整合服务团队', '招募华东区域渠道合作伙伴', '企业官网与客户门户升级',
    '年度品牌策略与市场调研', '线下发布会策划与执行', '短视频与直播运营合作',
    '工业品海外市场拓展', '用户研究与产品定位咨询', '经销商体系搭建',
    '企业客户线索增长项目', '寻找天使轮产业投资人', 'A轮融资材料与路演辅导',
    '新能源项目寻找联合投资方', '并购标的行业研究支持', '产业基金合作渠道对接',
    '医疗器械项目融资顾问', '寻找长期财务顾问', '项目估值与商业模型梳理',
    '智能硬件供应链整合', '寻找精密加工合作工厂', '核心零部件国产替代合作',
    '跨境物流与仓配方案', '寻找区域生产基地', '消费品包装供应商招募',
    '汽车电子联合研发伙伴', '工业设备代工与交付合作', '供应链成本优化咨询',
    'AI行业模型联合开发', '半导体测试验证资源对接', '芯片设计企业寻找流片伙伴',
    '5G专网场景联合方案', '量子通信项目技术合作', '企业数据治理平台建设',
    '网络安全合规改造', '工业机器人应用方案', '自动驾驶传感器联合测试',
    '创新药临床研究合作', '医疗机构数字化升级', '慢病管理产品渠道合作',
    '生物科技实验平台共建', '先进制造产线升级', '高端装备项目寻找客户',
    '商业航天零部件供应合作', '卫星数据应用场景合作', '低空经济项目落地伙伴',
    '企业人才与专家顾问招募', '城市产业活动联合主办', '知识产权与合规服务采购',
    '园区招商与项目落地合作', '跨行业项目联合投标'
  ][i],
  company_name: Array.from({ length: 20 }, (_, idx) => `示例企业${String(idx + 1).padStart(2, '0')}`)[i % 20],
  category_id: DEMAND_CATEGORIES[i % DEMAND_CATEGORIES.length].id,
  category_name: DEMAND_CATEGORIES[i % DEMAND_CATEGORIES.length].name,
  region: pick(REGIONS),
  quote_type: pick(QUOTE_TYPES).value,
  ...pickBudget(),
  description: '围绕当前项目寻找合适的服务方，预算和交付时间可以进一步沟通。',
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

// 联系方式只在管理端/授权详情中使用，公共列表不返回。
const publicDemand = (item) => {
  if (!item) return item
  const { contact_name, contact_phone, contact_wechat, ...safe } = item
  return safe
}

// ========== 商品 Mock ==========
const productData = Array.from({ length: 20 }, (_, i) => {
  const types = ['member', 'linker', 'survey', 'resource_pack', 'certification']
  const type = types[i % 5]
  const names = {
    member: ['年度会员·畅享版', '年度会员·尊享版', '月度体验会员'],
    linker: ['链接官·季度服务', '链接官·年度服务', '链接官·项目制'],
    survey: ['行业调研·基础版', '行业调研·深度版', '定制调研方案'],
    resource_pack: ['项目筹备资源包', '市场拓展资源包', '产业合作资源包'],
    certification: ['企业认证·标准版', '企业认证·高级版', '服务商认证']
  }
  const prices = { member: [9900, 29900, 2900], linker: [19900, 49900, 9900], survey: [14900, 39900, 69900], resource_pack: [4900, 9900, 6900], certification: [9900, 19900, 4900] }
  return {
    _id: `product_${i + 1}`,
    title: names[type][i % 3],
    service_type: type,
    category_id: `prod_cat_${String((i % 5) + 1).padStart(2, '0')}`,
    price: prices[type][i % 3],
    market_price: prices[type][i % 3] * 1.5,
    unit: ['年', '季', '次', '套', '年'][i % 5],
    sale_count: randInt(20, 800),
    is_featured: i < 6,
    status: 'on_sale',
    description_rich: '<p>服务内容说明</p><p>包含以下内容：</p><p>1. 基础服务内容</p><p>2. 专属客服支持</p>',
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
  from_user_id: 'demo_user_001',
  user_id: 'demo_user_001',
  demand_owner: demandData[i].created_by || 'demo_user_001',
  contact_name: '李总',
  phone: '139****9999',
  wechat: 'lead_wx_' + (i + 1),
  message: '我们团队有丰富经验，可以为您提供专业服务。',
  status: pick(LeadStatusValues),
  created_at: new Date(Date.now() - randInt(1, 15) * 86400000).toISOString()
}))

// ========== 资料 Mock ==========
const RESOURCE_CATEGORY_NAMES = ['项目模板', '市场与渠道', '融资与资本', '产业研究', '管理与合规']
const resourceData = Array.from({ length: 20 }, (_, i) => ({
  _id: `resource_${i + 1}`,
  title: ['项目需求说明书模板', '合作伙伴评估清单', '渠道拓展执行手册', '客户访谈与需求调研模板', '年度市场计划框架',
    '融资商业计划书模板', '投资人沟通准备清单', '项目估值基础模型', '尽职调查资料目录', '产业基金合作指南',
    '供应商准入评估表', '联合研发合作备忘录模板', '半导体产业链研究简报', '医药健康项目调研框架', '先进制造项目实施清单',
    '商业航天产业观察', '企业数据治理成熟度评估', '项目合规风险检查表', '交付里程碑验收模板', '年度项目复盘框架'][i],
  category_id: `resource_cat_${String((i % 5) + 1).padStart(2, '0')}`,
  category_name: RESOURCE_CATEGORY_NAMES[i % RESOURCE_CATEGORY_NAMES.length],
  summary: '整理了行业趋势、执行步骤和可直接参考的案例模板，适合拿来做项目准备。',
  file_type: pick(['pdf', 'docx', 'pptx', 'xlsx']),
  file_size: randInt(2, 50) + 'MB',
  view_count: randInt(200, 8000),
  download_count: randInt(50, 2000),
  favorite_count: randInt(10, 300),
  is_free: i < 5,
  price: i < 5 ? 0 : pick([990, 1990, 2990, 4990]),
  created_at: new Date(Date.now() - randInt(1, 60) * 86400000).toISOString()
}))
const resourcePurchases = new Set()
const resourceDownloads = []

// ========== Banner Mock ==========
const bannerData = [
  { _id: 'b1', title: '营销方案和模板', subtitle: '行业方案和模板，打开就能看', type: 'demand', target_id: '' },
  { _id: 'b2', title: '发布需求，等合适的人来联系', subtitle: '把预算、时间和要求写清楚，沟通更快', type: 'zone', target_id: '' },
  { _id: 'b3', title: '需要有人帮你跟进项目？', subtitle: '可以找链接官帮你盯进度、约资源', type: 'product', target_id: 'product_2' },
  { _id: 'b4', title: '资料库更新了', subtitle: '报告、模板和案例，按项目直接查', type: 'resource', target_id: '' },
  { _id: 'b5', title: '把需求写清楚，再发出去', subtitle: '补齐预算和时间，别人更容易判断', type: 'publish', target_id: '' }
]

const categoryData = [
  ...DEMAND_CATEGORIES.map((item, sort) => ({ ...item, type: 'demand', status: 'active', sort })),
  ...[
    ['prod_cat_01', '会员服务', '/static/icons/service/member.svg'], ['prod_cat_02', '链接官服务', '/static/icons/service/linker.svg'], ['prod_cat_03', '行业调研', '/static/icons/service/survey.svg'],
    ['prod_cat_04', '资源包', '/static/icons/service/resource_pack.svg'], ['prod_cat_05', '认证服务', '/static/icons/service/certification.svg']
  ].map(([id, name, icon], sort) => ({ id, name, icon, type: 'product', status: 'active', sort })),
  ...[
    ['resource_cat_01', '项目模板', '/static/icons/file.svg'], ['resource_cat_02', '市场与渠道', '/static/icons/cat/cat_05.svg'], ['resource_cat_03', '融资与资本', '/static/icons/cat/cat_11.svg'],
    ['resource_cat_04', '产业研究', '/static/icons/cat/cat_15.svg'], ['resource_cat_05', '管理与合规', '/static/icons/shield.svg']
  ].map(([id, name, icon], sort) => ({ id, name, icon, type: 'resource', status: 'active', sort }))
]

// ========== 系统配置 Mock ==========
const systemConfigData = {
  site_name: '媒合智联 MediaMatch',
  site_slogan: '找项目、找伙伴、找服务',
  contact_phone: '400-800-1234',
  service_wechat: 'qiyeku_service',
  default_region: '全国',
  default_page_size: 10,
  maintenance_mode: false,
  allow_publish: true,
  require_demand_review: true,
  allow_guest_browse: true
}

export const configService = {
  public() { return { ...systemConfigData } },
  legal() {
    return {
      version: '2026-09-14',
      documents: {
        agreement: { type: 'agreement', title: '用户协议', version: '2026-09-14', sections: [] },
        privacy: { type: 'privacy', title: '隐私政策', version: '2026-09-14', sections: [] }
      }
    }
  }
}

// ========== 用户 Mock ==========
const userData = {
  user: {
    id: 'demo_user_001',
    openid: 'oDemo_openid_001',
    nickname: '张经理',
    avatar_url: '',
    phone: '13800008888',
    email: 'demo@mediamatch.local',
    email_verified: true,
    company: '示例科技有限公司',
    title: '项目负责人',
    city: '上海',
    workflow_role: 'demand_owner',
    organization_type: 'project',
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
    company: '媒合智联运营团队',
    role: 'admin'
  },
  token: 'admin_token_' + Date.now()
}

const providerData = {
  user: {
    id: 'demo_provider_001', openid: 'oDemo_provider_001', nickname: '创想营销', avatar_url: '',
    phone: '13700000000', company: '创想营销', role: 'provider', provider_id: 'provider_seed_1'
  },
  token: 'provider_token_' + Date.now()
}

const adminUserData = [
  { ...userData.user, _id: userData.user.id, status: 'active', created_at: new Date(Date.now() - 12 * 86400000).toISOString() },
  { ...adminData.user, _id: adminData.user.id, status: 'active', created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
  { ...providerData.user, _id: providerData.user.id, status: 'active', created_at: new Date(Date.now() - 30 * 86400000).toISOString() }
]

// ========== 内测资料 Mock ==========
// 资料页默认从空白草稿开始，后台仍保留两条可用于演示筛选与审核的样例。
const mockIntakeProfiles = [
  {
    ...emptyIntakeForm('project'),
    id: 'mock_intake_project_001', _id: 'mock_intake_project_001', status: 'submitted',
    contact_name: '周明', contact_title: '创始人', company_name: '示例智造科技', city: '上海',
    primary_industry: 'advanced_manufacturing', business_scope: '工业视觉与智能产线升级',
    business_intro: '面向先进制造企业提供工业视觉和产线智能化改造，正在寻找华东区域的产业客户与联合验证伙伴。',
    annual_revenue_range: '10m_50m', project_stage: 'growth', cooperation_intent: '寻找产业客户、渠道伙伴与联合投资方',
    target_companies: [{ id: 'mock_target_001', company_name: '华东区域制造集团', industry: '先进制造', intent: '试点合作', note: '优先交流智能产线升级和联合验证。' }],
    background_consent: true, display_consent: true, display_scope: 'members',
    pool_tags: ['project', 'industry:advanced_manufacturing', 'city:上海', 'revenue:10m_50m', 'stage:growth'],
    invite: { code: 'MMDEMO01', invite_code: 'MMDEMO01', inviter_reward_type: 'trial_uses', path: '/pages/intake/index?inviteCode=MMDEMO01', invite_path: '/pages/intake/index?inviteCode=MMDEMO01' },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    ...emptyIntakeForm('capital'),
    id: 'mock_intake_capital_001', _id: 'mock_intake_capital_001', status: 'reviewing',
    contact_name: '陈远', contact_title: '投资总监', company_name: '示例产业投资机构', city: '深圳',
    primary_industry: 'ai', business_scope: '科技与产业升级方向投资',
    business_intro: '关注人工智能、先进制造和企业服务，寻求有产业协同价值的早中期项目以及并购整合机会。',
    capital_size_range: '200m_1b', investment_ticket_range: '10m_50m', investment_directions: ['industry_incubation', 'primary_market', 'ma'],
    investment_plan_period: 'year', investment_plan_range: '50m_200m',
    cooperation_intent: '寻找科技项目、产业合作与并购标的', background_consent: true, matching_opt_in: true, display_consent: false,
    display_scope: 'operations', pool_tags: ['capital', 'industry:ai', 'city:深圳', 'capital_size:200m_1b', 'ticket:10m_50m', 'plan_period:year', 'plan:50m_200m', 'match:yes', 'direction:industry_incubation'],
    invite: { code: 'MMDEMO02', invite_code: 'MMDEMO02', inviter_reward_type: 'trial_uses', path: '/pages/intake/index?inviteCode=MMDEMO02', invite_path: '/pages/intake/index?inviteCode=MMDEMO02' },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(), updated_at: new Date(Date.now() - 7200000).toISOString()
  }
]
const mockIntakeByUser = new Map()

function mockInvitePreview(code) {
  const normalized = String(code || '').trim().toUpperCase()
  const own = mockIntakeByUser.get(userData.user.id)
  const owner = [...mockIntakeProfiles, own].find((item) => item?.invite?.code === normalized)
  if (!owner) return null
  const registerPath = `/pages/user/login?invite_code=${encodeURIComponent(normalized)}`
  const inviterReward = REFERRAL_REWARD_OPTIONS.find((item) => item.value === owner.invite?.inviter_reward_type) || REFERRAL_REWARD_OPTIONS[0]
  return {
    code: normalized,
    register_path: registerPath,
    register_url: registerPath,
    share_url: registerPath,
    qr_url: '',
    intake_path: `/pages/intake/index?inviteCode=${encodeURIComponent(normalized)}`,
    reward_options: cloneIntake(REFERRAL_REWARD_OPTIONS),
    inviter_reward_type: inviterReward.value,
    inviter_reward: cloneIntake(inviterReward),
    rules: cloneIntake(REFERRAL_RULES)
  }
}

// ========== 社区 Mock ==========
const usersData = [
  { id: 'u1', nickname: '项目合伙人周明', avatar: '', company: '示例企业01', bio: '关注产业合作与项目落地', followers: 1280, posts: 45 },
  { id: 'u2', nickname: '供应链顾问林珊', avatar: '', company: '示例企业02', bio: '制造业供应链与交付管理', followers: 856, posts: 32 },
  { id: 'u3', nickname: '产业投资人陈远', avatar: '', company: '示例企业03', bio: '关注早期科技与产业升级', followers: 2100, posts: 68 },
  { id: 'u4', nickname: '市场负责人顾言', avatar: '', company: '示例企业04', bio: '企业增长与渠道建设', followers: 3200, posts: 120 },
  { id: 'u5', nickname: '技术合作人许宁', avatar: '', company: '示例企业05', bio: '联合研发与产品工程化', followers: 980, posts: 28 }
]

const topicsData = [
  { id: 't1', name: '项目合作', icon: '/static/icons/handshake.svg', posts: 156, hot: true },
  { id: 't2', name: '市场拓展', icon: '/static/icons/cat/cat_05.svg', posts: 89, hot: true },
  { id: 't3', name: '融资与资本', icon: '/static/icons/cat/cat_11.svg', posts: 67, hot: true },
  { id: 't4', name: '供应链合作', icon: '/static/icons/cat/cat_15.svg', posts: 45 },
  { id: 't5', name: '技术联合研发', icon: '/static/icons/cat/cat_12.svg', posts: 38 },
  { id: 't6', name: '人才与专家', icon: '/static/icons/users.svg', posts: 52 },
  { id: 't7', name: '活动与会展', icon: '/static/icons/cat/cat_09.svg', posts: 31 },
  { id: 't8', name: '企业服务', icon: '/static/icons/cat/cat_03.svg', posts: 28 }
]

const postsData = Array.from({ length: 20 }, (_, i) => ({
  _id: `post_${i + 1}`,
  author: usersData[i % 5],
  content: [
    '项目合作最重要的是先把目标、边界和决策人说清楚。最近复盘了三个联合项目，前两周把这三件事对齐，后面会省下很多沟通成本。',
    '寻找供应商时不要只比报价，交付能力、质量记录和关键人员稳定性更值得提前核验。整理了一份准入清单，欢迎同行交流。',
    '早期项目和投资人沟通，先回答为什么现在做、谁愿意付费、团队为什么能做成。材料可以精简，但证据不能省。',
    '工业品进入新区域市场，直接找渠道往往效率不高。先定义客户画像和样板项目，再谈分销条件，更容易找到长期伙伴。',
    '联合研发项目建议一开始就拆清知识产权、里程碑和验收方式，技术路线可以迭代，合作规则要稳定。',
    '有一家医疗器械团队在找临床场景合作，方向是慢病管理和院外随访，有相关资源的朋友可以私信交流。',
    '活动预算有限时，先保留核心来宾、有效议程和后续跟进机制，形式上的热闹不一定能带来真实合作。',
    '企业软件选型不要从功能表开始，先列出必须解决的三个业务问题，再用真实流程做一次小范围验证。',
    '半导体项目找测试资源，除了设备型号，还要确认排期、工程经验和异常分析能力，单看产能容易踩坑。',
    '商业航天项目的供应链合作周期较长，建议把资质、验证批次和量产节奏拆开沟通，双方预期会更准确。',
    '融资顾问能提供的是准备、筛选和推进，不应该承诺结果。合作前要确认服务范围、收费方式和资源来源。',
    '新品上市项目可以拆成定位验证、渠道试点和规模推广三个阶段，不必一开始就把全部预算压在曝光上。',
    '先进制造项目落地时，工艺验证和人员培训经常比设备采购更影响进度，建议提前列入交付里程碑。',
    '量子科技项目跨学科协作明显，找伙伴时最好同时写清技术问题、应用场景和可提供的实验条件。',
    '医药健康项目做渠道合作，要先区分医院、药店、保险和企业健康场景，不同渠道的决策链完全不同。',
    '城市产业活动如果希望形成长期价值，报名表之外还要设计项目筛选、会前匹配和会后跟进机制。',
    '企业出海不仅是翻译和投放，还涉及产品适配、渠道政策、合规与本地服务，适合组建联合服务团队。',
    '数据合作项目首先要明确数据来源、使用范围和退出机制，技术接口可以后定，合规边界要先确认。',
    '寻找专家顾问时，比头衔更重要的是能否投入时间、理解现场问题，并对最终交付负责。',
    '跨行业项目最容易卡在信息不对称。把预算范围、启动时间和已有资源公开到合适程度，匹配质量会明显提高。'
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
  async register(payload = {}) {
    await delay()
    if (String(payload.code || '').trim() !== '123456') throw new Error('验证码无效或已过期')
    const inviteCode = String(payload.invite_code || payload.inviteCode || '').trim().toUpperCase()
    const invitePreview = inviteCode ? mockInvitePreview(inviteCode) : null
    const inviteeReward = inviteCode ? REFERRAL_REWARD_OPTIONS.find((item) => item.value === payload.reward_type) : null
    const inviterReward = inviteCode
      ? REFERRAL_REWARD_OPTIONS.find((item) => item.value === invitePreview?.inviter_reward_type) || REFERRAL_REWARD_OPTIONS[0]
      : null
    if (inviteCode && (!invitePreview || !inviteeReward)) throw new Error('邀请码或奖励选项无效')
    userData.user = {
      ...userData.user,
      nickname: payload.nickname || userData.user.nickname,
      phone: payload.phone || userData.user.phone,
      company: payload.company || '',
      title: payload.title || '',
      city: payload.city || ''
    }
    return {
      ...userData,
      referral: inviteCode ? {
        invite_code: inviteCode,
        reward_type: inviteeReward.value,
        inviter_reward_type: inviterReward.value,
        invitee_reward_type: inviteeReward.value,
        status: 'registered'
      } : null,
      referral_rewards: inviteCode
        ? [['inviter', inviterReward], ['invitee', inviteeReward]].map(([role, reward]) => ({
            role,
            reward_type: reward.value,
            reward_value: reward.reward_value,
            label: reward.label,
            display: reward.display,
            desc: reward.desc,
            status: 'granted'
          }))
        : []
    }
  },
  async requestRegisterCode() {
    await delay()
    return {
      sent: true,
      expires_in: 300,
      retry_after: 60,
      channel: 'mock',
      debug_code: '123456',
      debug_only: true
    }
  },
  async loginPassword() { await delay(); return userData },
  async requestPasswordResetCode() {
    await delay()
    return {
      sent: true,
      expires_in: 300,
      retry_after: 60,
      channel: 'mock',
      debug_code: '123456',
      debug_only: true
    }
  },
  async resetPassword(payload = {}) {
    await delay()
    if (String(payload.code || '').trim() !== '123456') throw new Error('验证码无效或已过期')
    return { reset: true }
  },
  async requestEmailVerificationCode() {
    await delay()
    return {
      sent: true,
      expires_in: 300,
      retry_after: 60,
      channel: 'mock',
      debug_code: '123456',
      debug_only: true
    }
  },
  async confirmEmailVerificationCode(payload = {}) {
    await delay()
    if (String(payload.code || '').trim() !== '123456') throw new Error('验证码无效或已过期')
    userData.user = { ...userData.user, email: String(payload.email || '').trim().toLowerCase(), email_verified: true }
    return userData.user
  },
  async refresh() { await delay(); return userData },
  async logout() { await delay(); return { revoked: true } },
  async demoLogin(role) { await delay(); return role === 'admin' ? adminData : role === 'provider' ? providerData : userData },
  async getInfo() { await delay(); return userData.user },
  async updateProfile(payload = {}) {
    await delay()
    if (payload.phone !== undefined && String(payload.phone || '').trim() !== String(userData.user.phone || '').trim()) {
      throw new Error('手机号暂不支持直接修改，请先完成短信验证')
    }
    const { phone: _phone, ...editable } = payload
    userData.user = { ...userData.user, ...editable }
    return userData.user
  },
  async consentStatus() { await delay(); return { legal_version: '2026-09-14', agreement: true, privacy: true, complete: true } },
  async saveConsents() { await delay(); return { legal_version: '2026-09-14', agreement: true, privacy: true, complete: true } },
  async deleteAccount() { await delay(); return { deleted: true, anonymized: true } }
}

function mockUserIntakePayload() {
  const profile = mockIntakeByUser.get(userData.user.id)
  return {
    profile: cloneIntake(profile),
    invite: cloneIntake(profile?.invite || null),
    referrals: cloneIntake(profile?.referrals || { total: 0, started: 0, submitted: 0, approved: 0, rejected: 0 }),
    referral_rewards: cloneIntake(profile?.referral_rewards || []),
    incoming_referral: null
  }
}

function mockAdminIntakes() {
  const records = [...mockIntakeProfiles]
  const own = mockIntakeByUser.get(userData.user.id)
  if (own) {
    const index = records.findIndex((item) => item.id === own.id)
    if (index > -1) records[index] = own
    else records.unshift(own)
  }
  return records
}

export const intakeService = {
  options() {
    return {
      roles: [{ value: 'capital', label: '甲方 / 资金方' }, { value: 'project', label: '乙方 / 项目企业' }],
      ...INTAKE_OPTIONS,
      reviewStatuses: ['reviewing', 'needs_more', 'approved', 'rejected']
    }
  },
  invitePreview(code) {
    const preview = mockInvitePreview(code)
    if (!preview) throw new Error('邀请码无效或已失效')
    return preview
  },
  mine() { return mockUserIntakePayload() },
  status() {
    const profile = mockIntakeByUser.get(userData.user.id)
    return profile ? { id: profile.id, status: profile.status, review_note: profile.review_note || '', updated_at: profile.updated_at } : null
  },
  save(payload = {}) {
    const current = mockIntakeByUser.get(userData.user.id)
    const nextId = current?.id || uid()
    const next = {
      ...emptyIntakeForm(),
      ...(current || {}),
      ...cloneIntake(payload),
      id: nextId,
      _id: current?._id || nextId,
      status: 'draft',
      display_scope: payload.display_consent ? (payload.display_scope || 'operations') : 'operations',
      pool_tags: derivePoolTags({ ...(current || {}), ...payload }),
      updated_at: new Date().toISOString(),
      created_at: current?.created_at || new Date().toISOString()
    }
    if (!next.role) throw new Error('请选择你的身份')
    mockIntakeByUser.set(userData.user.id, next)
    return mockUserIntakePayload()
  },
  submit(payload = {}) {
    const current = mockIntakeByUser.get(userData.user.id)
    const nextId = current?.id || uid()
    const inviteCode = current?.invite?.code || `MM${uid().slice(-6).toUpperCase()}`
    const next = {
      ...emptyIntakeForm(),
      ...(current || {}),
      ...cloneIntake(payload),
      id: nextId,
      _id: current?._id || nextId,
      status: 'submitted',
      background_consent: payload.background_consent === true,
      display_scope: payload.display_consent ? (payload.display_scope || 'operations') : 'operations',
      pool_tags: derivePoolTags({ ...(current || {}), ...payload }),
      invite: current?.invite || { code: inviteCode, invite_code: inviteCode },
      updated_at: new Date().toISOString(), submitted_at: new Date().toISOString(), created_at: current?.created_at || new Date().toISOString()
    }
    next.invite.path = `/pages/intake/index?inviteCode=${encodeURIComponent(next.invite.code)}`
    next.invite.invite_path = next.invite.path
    const inviterReward = REFERRAL_REWARD_OPTIONS.find((item) => item.value === next.invite.inviter_reward_type) || REFERRAL_REWARD_OPTIONS[0]
    Object.assign(next.invite, mockInvitePreview(next.invite.code) || {
      register_path: `/pages/user/login?invite_code=${encodeURIComponent(next.invite.code)}`,
      register_url: `/pages/user/login?invite_code=${encodeURIComponent(next.invite.code)}`,
      share_url: `/pages/user/login?invite_code=${encodeURIComponent(next.invite.code)}`,
      qr_url: '',
      reward_options: cloneIntake(REFERRAL_REWARD_OPTIONS),
      inviter_reward_type: inviterReward.value,
      inviter_reward: cloneIntake(inviterReward),
      rules: cloneIntake(REFERRAL_RULES)
    })
    mockIntakeByUser.set(userData.user.id, next)
    userData.user = { ...userData.user, company: next.company_name || userData.user.company, title: next.contact_title || userData.user.title, city: next.city || userData.user.city }
    return mockUserIntakePayload()
  },
  setInviteReward(value) {
    const option = REFERRAL_REWARD_OPTIONS.find((item) => item.value === value)
    if (!option) throw new Error('请选择有效的邀请奖励')
    const current = mockIntakeByUser.get(userData.user.id)
    if (!current?.invite) throw new Error('提交内测资料后才能设置邀请权益')
    current.invite = {
      ...current.invite,
      inviter_reward_type: option.value,
      inviter_reward: cloneIntake(option)
    }
    mockIntakeByUser.set(userData.user.id, current)
    return mockUserIntakePayload()
  },
  // 公开入口在 Mock 模式下复用同一份表单状态，保持组件联调契约一致。
  publicMine() { return mockUserIntakePayload() },
  publicSave(payload = {}) { return this.save(payload) },
  publicSubmit(payload = {}) { return this.submit(payload) }
}

export const demandService = {
  list(params = {}) {
    const { page = 1, pageSize = 10, sort = 'latest', keyword, category_id, region, quote_type, includeAll = false } = params
    let list = includeAll ? [...demandData] : [...demandData].filter(d => d.status === 'published')

    if (keyword) list = list.filter(d => d.title.includes(keyword) || d.company_name.includes(keyword))
    if (category_id) list = list.filter(d => d.category_id === category_id)
    if (region && region !== '全国') list = list.filter(d => d.region === region)
    if (quote_type) list = list.filter(d => d.quote_type === quote_type)

    if (sort === 'hot') list.sort((a, b) => b.view_count - a.view_count)
    else if (sort === 'latest') list.sort((a, b) => new Date(b.publish_time) - new Date(a.publish_time))

    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize).map(publicDemand), total: list.length }
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
  delete(id) {
    const idx = demandData.findIndex(d => d._id === id)
    if (idx < 0) return false
    demandData.splice(idx, 1)
    return true
  },
  myDemands(params = {}) {
    const list = demandData.filter(d => d.created_by === 'demo_user_001')
    return { list: list.slice(0, 5).map(item => ({ ...item })), total: list.length }
  },
  agent(id) {
    const demand = demandData.find((item) => item._id === id)
    if (!demand || demand.status !== 'published') return null
    return {
      agent: { id: `demand_agent_${id}`, name: '需求 Agent', status: 'active' },
      demand: publicDemand(demand),
      context: {
        demand_id: demand._id,
        title: demand.title,
        company_name: demand.company_name,
        category: demand.category_name,
        category_name: demand.category_name,
        region: demand.region,
        quote_type: demand.quote_type,
        description: demand.description,
        tags: demand.tags || []
      }
    }
  },
  agentChat(id, payload = {}) {
    const info = this.agent(id)
    if (!info) return null
    const text = String(payload.text || '').trim()
    const context = info.context
    const question = /城市|地区|哪里|落地/.test(text)
      ? `目前公开信息显示，项目计划在${context.region || '目标地区待沟通'}推进。你也可以继续问合作范围和推进方式。`
      : /预算|费用|报价/.test(text)
        ? `这条需求的预算方式是“${context.quote_type || '待沟通'}”。具体金额和合作边界需要在双方建立联系后进一步确认。`
        : /企业|公司|背景|项目/.test(text)
          ? `甲方公开的项目是“${context.title}”，所属方向为${context.category_name || '合作项目'}。当前 Agent 只提供已公开的需求背景。`
          : `围绕“${context.title}”，我可以基于公开信息继续说明合作方向、城市和需求边界；联系方式等未公开信息需要后续确认。`
    return { reply: answerForDemandAgent(question), context }
  }
}

function answerForDemandAgent(reply) {
  return `收到。${reply}`
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
  inbox() {
    const list = leadData
      .filter(l => l.demand_owner === 'demo_user_001')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return {
      list,
      total: list.length,
      pending: list.filter(l => l.status === 'new').length,
      active: list.filter(l => ['new', 'contacted'].includes(l.status)).length
    }
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
  { _id: 'deal_1', lead_id: 'lead_1', demand_id: 'demand_1', demand_title: '寻找活动供应商', provider_name: '李经理', provider_phone: '139****9999', owner_id: 'demo_user_001', requester_id: 'demo_user_001', provider_user_id: 'demo_provider_001', counterparty_user_id: 'demo_provider_001', status: 'completed', amount: 50000, can_review: false, has_review: true, milestones: [{ _id: 'dm_1', title: '方案确认', amount: 10000, status: 'completed' }, { _id: 'dm_2', title: '活动执行', amount: 30000, status: 'completed' }, { _id: 'dm_3', title: '复盘验收', amount: 10000, status: 'completed' }], created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { _id: 'deal_2', lead_id: 'lead_2', demand_id: 'demand_3', demand_title: '品牌发布会全案策划', provider_name: '王总监', provider_phone: '138****8888', owner_id: 'demo_user_001', requester_id: 'demo_user_001', provider_user_id: 'demo_provider_001', counterparty_user_id: 'demo_provider_001', status: 'in_progress', amount: 80000, can_review: false, has_review: false, milestones: [{ _id: 'dm_4', title: '传播策略与排期', amount: 16000, status: 'completed' }, { _id: 'dm_5', title: '物料制作与媒体执行', amount: 48000, status: 'in_progress' }, { _id: 'dm_6', title: '数据复盘与验收', amount: 16000, status: 'pending' }], created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
]

function workspacePerson(userId, fallbackName = '项目成员') {
  if (userId === userData.user.id) return { id: userId, display_name: userData.user.nickname, company: userData.user.company, role: 'requester' }
  if (userId === providerData.user.id) return { id: userId, display_name: providerData.user.nickname, company: providerData.user.company, role: 'provider' }
  const person = networkPeopleData.find((item) => item.id === userId)
  return { id: userId, display_name: person?.nickname || fallbackName, company: person?.company || '', role: 'member' }
}

function ensureMockWorkspace(deal) {
  if (!deal) return null
  if (!Array.isArray(deal.members)) {
    deal.members = [
      { _id: `member_${deal._id}_requester`, ...workspacePerson(deal.requester_id, '需求方'), role: 'requester', status: 'active' },
      { _id: `member_${deal._id}_provider`, ...workspacePerson(deal.provider_user_id, deal.provider_name), role: 'provider', status: 'active' }
    ]
  }
  if (!Array.isArray(deal.tasks)) deal.tasks = deal._id === 'deal_2'
    ? [
        { _id: 'task_demo_1', title: '确认首轮传播策略与排期', description: '核对目标人群、核心内容和审批节点。', status: 'done', assignee_id: deal.requester_id, assignee_name: '张经理', due_at: '', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { _id: 'task_demo_2', title: '提交物料制作清单', description: '同步尺寸、规格、数量和交付时间。', status: 'in_progress', assignee_id: deal.provider_user_id, assignee_name: deal.provider_name, due_at: '', created_at: new Date(Date.now() - 86400000).toISOString() }
      ] : []
  if (!Array.isArray(deal.files)) deal.files = []
  if (!Array.isArray(deal.messages)) deal.messages = []
  if (!Array.isArray(deal.meetings)) deal.meetings = []
  if (!Array.isArray(deal.deliverables)) deal.deliverables = []
  if (!deal.collaboration_settings) deal.collaboration_settings = { visibility: 'invited', confidentiality: 'standard', default_file_permission: 'download' }
  if (!Array.isArray(deal.activities)) deal.activities = [
    { _id: `activity_${deal._id}_created`, type: 'deal_created', content: '项目协作室已建立', actor_name: '系统', created_at: deal.created_at }
  ]
  return deal
}

function mockWorkspaceVO(deal) {
  const current = ensureMockWorkspace(deal)
  if (!current) return null
  const taskSummary = (current.tasks || []).reduce((summary, task) => {
    summary.total += 1
    if (task.status === 'done') summary.done += 1
    if (task.status === 'in_progress') summary.in_progress += 1
    return summary
  }, { total: 0, done: 0, in_progress: 0 })
  return {
    ...current,
    members: current.members.filter((item) => item.status === 'active'),
    tasks: [...current.tasks],
    files: [...current.files],
    activities: [...current.activities].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
    messages: [...current.messages],
    meetings: [...current.meetings],
    deliverables: [...current.deliverables],
    commercial_proposal: current.commercial_proposal || { quote_amount: Number(current.amount || 0), estimated_days: 30, provider_message: '已确认合作范围，后续以项目协作室中的里程碑与交付记录为准。', milestones: current.milestones || [] },
    collaboration_settings: current.collaboration_settings,
    permissions: { can_manage: true, can_edit: true, can_invite: true },
    workspace_summary: { members: current.members.filter((item) => item.status === 'active').length, files: current.files.length, meetings: current.meetings.filter((item) => item.status === 'scheduled').length, deliverables_pending: current.deliverables.filter((item) => item.status !== 'accepted').length, tasks: taskSummary }
  }
}

function addMockActivity(deal, type, content, metadata = {}) {
  ensureMockWorkspace(deal)
  deal.activities.unshift({ _id: uid(), type, content, metadata, actor_name: userData.user.nickname, created_at: new Date().toISOString() })
}

// ========== 通知 Mock ==========
const notifyData = [
  { _id: 'n1', type: 'system', title: '系统维护通知', desc: '系统将于今晚22:00进行维护升级', time: '刚刚', read: false, link_id: '', linkType: '' },
  { _id: 'n2', type: 'lead', title: '收到新的对接申请', desc: '张经理申请对接「渠道合作伙伴招募」', time: '10分钟前', read: false, link_id: 'lead_1', linkType: 'lead' },
  { _id: 'n3', type: 'deal', title: '需求方已接受您的对接', desc: '「品牌发布会」已成交', time: '1小时前', read: false, link_id: 'demand_3', linkType: 'deal' },
  { _id: 'n4', type: 'system', title: '需求审核通过', desc: '您发布的「品牌营销策划」已通过审核', time: '2小时前', read: true, link_id: '', linkType: '' },
  { _id: 'n5', type: 'interact', title: '新的评论', desc: '李总评论了您的帖子', time: '昨天', read: true, link_id: 'post_1', linkType: 'post' },
]
const notifyPreferencesData = { system: true, lead: true, order: true, deal: true, interact: true, proposal: true, campaign: true }
const agentFeedbackData = []
const agentTelemetryData = []

// ========== 成交服务 ==========
export const dealService = {
  myDeals() {
    const list = dealData.filter(d => d.owner_id === 'demo_user_001').map((deal) => {
      const completed = (deal.milestones || []).filter((item) => item.status === 'completed').length
      return { ...deal, milestone_summary: { total: deal.milestones?.length || 0, completed, progress: deal.milestones?.length ? Math.round(completed / deal.milestones.length * 100) : 0 } }
    })
    return { list, total: list.length }
  },
  agenda() {
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const list = dealData
      .filter((deal) => deal.owner_id === 'demo_user_001' && deal.status === 'in_progress')
      .flatMap((deal) => (deal.tasks || []).filter((task) => task.status !== 'done' && (!task.assignee_id || task.assignee_id === 'demo_user_001')).map((task) => {
        const dueAt = String(task.due_at || '').slice(0, 10)
        const reminder = !dueAt ? 'unscheduled' : dueAt < today ? 'overdue' : dueAt === today ? 'today' : dueAt === tomorrow ? 'tomorrow' : 'upcoming'
        return { ...task, deal_id: deal._id, demand_title: deal.demand_title, reminder }
      }))
      .sort((a, b) => String(a.due_at || '9999-12-31').localeCompare(String(b.due_at || '9999-12-31')))
    const summary = list.reduce((all, task) => ({ ...all, total: all.total + 1, [task.reminder]: (all[task.reminder] || 0) + 1 }), { total: 0, overdue: 0, today: 0, tomorrow: 0, upcoming: 0, unscheduled: 0 })
    const meetings = dealData
      .filter((deal) => deal.status === 'in_progress' && (deal.members || []).some((member) => member.id === 'demo_user_001' && member.status === 'active'))
      .flatMap((deal) => (deal.meetings || []).filter((meeting) => meeting.status === 'scheduled').map((meeting) => ({
        ...meeting,
        deal_id: deal._id,
        demand_title: deal.demand_title
      })))
      .sort((a, b) => String(a.starts_at || '').localeCompare(String(b.starts_at || '')))
    return { list, total: list.length, summary, meetings, meeting_total: meetings.length }
  },
  detail(id) {
    const deal = dealData.find(d => d._id === id)
    return deal ? { ...this.myDeals().list.find(d => d._id === id), ...mockWorkspaceVO(deal) } : null
  },
  workspace(id) {
    return mockWorkspaceVO(dealData.find(d => d._id === id))
  },
  createFromProposal(proposal = {}) {
    const proposalId = String(proposal._id || proposal.id || '').trim()
    const leadId = String(proposal.lead_id || '').trim()
    const existing = dealData.find((item) => (proposalId && item.proposal_id === proposalId) || (leadId && item.lead_id === leadId))
    if (existing) return existing

    const now = new Date().toISOString()
    const dealId = `deal_${proposalId || uid()}`
    const deal = {
      _id: dealId,
      id: dealId,
      lead_id: leadId,
      proposal_id: proposalId,
      demand_id: proposal.demand_id || proposal.demand?.id || '',
      demand_title: proposal.demand_title || proposal.demand?.title || '新合作项目',
      provider_name: proposal.provider?.name || '合作团队',
      provider_phone: '',
      owner_id: proposal.requester_id || 'demo_user_001',
      requester_id: proposal.requester_id || 'demo_user_001',
      provider_user_id: proposal.provider_user_id || proposal.provider?.user_id || '',
      counterparty_user_id: proposal.provider_user_id || proposal.provider?.user_id || '',
      status: 'in_progress',
      amount: Number(proposal.quote_amount) || 0,
      can_review: false,
      has_review: false,
      milestones: (proposal.milestones || []).map((item, index) => ({
        _id: `milestone_${proposalId || 'new'}_${index + 1}`,
        title: item.title || `交付节点 ${index + 1}`,
        amount: Number(item.amount) || 0,
        status: 'pending'
      })),
      commercial_proposal: {
        quote_amount: Number(proposal.quote_amount) || 0,
        estimated_days: Number(proposal.estimated_days) || 0,
        provider_message: proposal.provider_message || '',
        milestones: proposal.milestones || []
      },
      activities: [{ _id: `activity_${proposalId || 'new'}_created`, type: 'workspace_created', content: '已根据选定方案建立项目协作室', actor_name: '系统', created_at: now }],
      created_at: now
    }
    dealData.unshift(deal)
    return ensureMockWorkspace(deal)
  },
  addMilestone(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    deal.milestones = [...(deal.milestones || []), { _id: uid(), title: data.title || '新里程碑', amount: Number(data.amount) || 0, status: 'pending' }]
    return this.detail(id)
  },
  updateMilestone(id, milestoneId, status) {
    const deal = dealData.find(d => d._id === id)
    const milestone = deal?.milestones?.find(item => item._id === milestoneId)
    if (milestone) {
      milestone.status = status
      addMockActivity(deal, 'milestone_updated', `更新里程碑：${milestone.title}`, { status })
    }
    return this.detail(id)
  },
  addMember(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    ensureMockWorkspace(deal)
    const userId = String(data.user_id || data.userId || '').trim()
    if (!userId) return mockWorkspaceVO(deal)
    let member = deal.members.find((item) => item.id === userId)
    if (member) member.status = 'active'
    else {
      member = { _id: uid(), ...workspacePerson(userId), role: data.role === 'advisor' ? 'advisor' : 'member', collaboration_role: data.collaboration_role || data.collaborationRole || 'participant', access_level: data.access_level || data.accessLevel || 'editor', status: 'active' }
      deal.members.push(member)
    }
    addMockActivity(deal, 'member_joined', `已添加${member.display_name}参与协作`, { user_id: userId })
    return mockWorkspaceVO(deal)
  },
  removeMember(id, memberId) {
    const deal = dealData.find(d => d._id === id)
    const member = deal?.members?.find((item) => item._id === memberId)
    if (member) { member.status = 'removed'; addMockActivity(deal, 'member_removed', `已移除${member.display_name}`, { user_id: member.id }) }
    return mockWorkspaceVO(deal)
  },
  addTask(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    ensureMockWorkspace(deal)
    const task = { _id: uid(), title: data.title || '待办事项', description: data.description || '', status: 'todo', assignee_id: data.assignee_id || data.assigneeId || '', assignee_name: deal.members.find((item) => item.id === (data.assignee_id || data.assigneeId))?.display_name || '', due_at: data.due_at || data.dueAt || '', created_at: new Date().toISOString() }
    deal.tasks.unshift(task)
    addMockActivity(deal, 'task_created', `新增待办：${task.title}`, { task_id: task._id })
    return mockWorkspaceVO(deal)
  },
  updateTask(id, taskId, data = {}) {
    const deal = dealData.find(d => d._id === id)
    const task = deal?.tasks?.find((item) => item._id === taskId)
    if (task) {
      Object.assign(task, data)
      if (data.assignee_id || data.assigneeId) task.assignee_name = deal.members.find((item) => item.id === (data.assignee_id || data.assigneeId))?.display_name || ''
      addMockActivity(deal, data.status === 'done' ? 'task_completed' : 'task_updated', `${data.status === 'done' ? '完成' : '更新'}待办：${task.title}`, { task_id: task._id })
    }
    return mockWorkspaceVO(deal)
  },
  addFile(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    ensureMockWorkspace(deal)
    const attachment = data.attachment || data
    const file = { _id: uid(), attachment_id: attachment.id || uid(), attachment: { ...attachment, id: attachment.id || uid(), name: attachment.name || '项目文件' }, description: data.description || '', uploader_name: userData.user.nickname, access_scope: data.access_scope || data.accessScope || 'workspace', granted_user_ids: data.grant_user_ids || data.grantUserIds || [], permissions: { can_view: true, can_download: data.allow_download !== false, can_share: !!data.allow_share, can_manage: true }, created_at: new Date().toISOString() }
    deal.files.unshift(file)
    addMockActivity(deal, 'file_shared', `共享文件：${file.attachment.name}`, { file_id: file._id })
    return mockWorkspaceVO(deal)
  },
  updateSettings(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    ensureMockWorkspace(deal)
    Object.assign(deal.collaboration_settings, data)
    addMockActivity(deal, 'settings_updated', '已更新项目保密与文件权限设置')
    return mockWorkspaceVO(deal)
  },
  messages(id) {
    const deal = dealData.find(d => d._id === id)
    ensureMockWorkspace(deal)
    return { list: deal?.messages || [], total: deal?.messages?.length || 0 }
  },
  sendMessage(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    ensureMockWorkspace(deal)
    const clientMessageId = String(data.client_message_id || data.clientMessageId || '').trim()
    const existing = clientMessageId
      ? deal.messages.find((item) => item.client_message_id === clientMessageId)
      : null
    if (existing) return { message: existing, idempotent: true }
    const messageId = uid()
    const message = { _id: messageId, id: messageId, sender_id: userData.user.id, sender_name: userData.user.nickname, content: data.content || '', attachments: data.attachments || [], client_message_id: clientMessageId, created_at: new Date().toISOString() }
    deal.messages.push(message)
    return { message, idempotent: false }
  },
  updateFilePermissions(id, fileId, data = {}) {
    const deal = dealData.find(d => d._id === id)
    const file = deal?.files?.find((item) => item._id === fileId)
    if (file) {
      Object.assign(file, data)
      file.granted_user_ids = data.grant_user_ids || data.grantUserIds || []
      file.permissions = { ...file.permissions, can_download: data.allow_download !== false, can_share: !!data.allow_share, can_manage: true }
    }
    return mockWorkspaceVO(deal)
  },
  addMeeting(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    ensureMockWorkspace(deal)
    const meeting = { _id: uid(), title: data.title || '项目沟通会', agenda: data.agenda || '', starts_at: data.starts_at || data.startsAt || new Date(Date.now() + 86400000).toISOString(), ends_at: data.ends_at || data.endsAt || '', location: data.location || '', meeting_type: data.meeting_type || data.meetingType || 'online', status: 'scheduled', creator_name: userData.user.nickname, created_at: new Date().toISOString() }
    deal.meetings.push(meeting)
    addMockActivity(deal, 'meeting_scheduled', `安排会议：${meeting.title}`)
    return mockWorkspaceVO(deal)
  },
  updateMeeting(id, meetingId, data = {}) {
    const deal = dealData.find(d => d._id === id)
    const meeting = deal?.meetings?.find((item) => item._id === meetingId)
    if (meeting) { Object.assign(meeting, data); addMockActivity(deal, 'meeting_updated', `更新会议：${meeting.title}`) }
    return mockWorkspaceVO(deal)
  },
  addDeliverable(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    ensureMockWorkspace(deal)
    const item = { _id: uid(), title: data.title || '项目交付物', description: data.description || '', milestone_id: data.milestone_id || data.milestoneId || '', milestone_title: deal.milestones?.find((m) => m._id === (data.milestone_id || data.milestoneId))?.title || '', status: 'submitted', submitted_by: userData.user.id, submitter_name: userData.user.nickname, attachment: data.attachment || null, created_at: new Date().toISOString() }
    deal.deliverables.unshift(item)
    addMockActivity(deal, 'deliverable_submitted', `提交交付物：${item.title}`)
    return mockWorkspaceVO(deal)
  },
  updateDeliverable(id, deliverableId, data = {}) {
    const deal = dealData.find(d => d._id === id)
    const item = deal?.deliverables?.find((value) => value._id === deliverableId)
    if (item) { Object.assign(item, data); addMockActivity(deal, 'deliverable_updated', `${data.status === 'accepted' ? '确认' : '更新'}交付物：${item.title}`) }
    return mockWorkspaceVO(deal)
  },
  addActivity(id, data = {}) {
    const deal = dealData.find(d => d._id === id)
    if (!deal) return null
    addMockActivity(deal, 'note', data.content || '补充了一条项目动态')
    return mockWorkspaceVO(deal)
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
  unreadCount() { return notifyData.filter(n => !n.read).length },
  preferences() { return { ...notifyPreferencesData } },
  updatePreferences(data = {}) {
    Object.keys(notifyPreferencesData).forEach((key) => {
      if (data[key] !== undefined) notifyPreferencesData[key] = !!data[key]
    })
    return { ...notifyPreferencesData }
  },
  poll(since = '') {
    return { list: [], unread: this.unreadCount(), cursor: since || new Date().toISOString().slice(0, 19).replace('T', ' '), timed_out: true }
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
  },
  pay(id) {
    const o = orderData.find((item) => item._id === id)
    if (o) o.status = 'paid'
    return { mode: 'mock', order: o }
  }
}

// ========== 购物车 ==========
export const cartService = {
  _key: STORAGE_KEYS.CART,
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
    const { page = 1, pageSize = 10, category_id, keyword, access, sort = 'latest', is_free } = params
    let list = [...resourceData]
    if (category_id) list = list.filter(r => r.category_id === category_id)
    if (keyword) list = list.filter(r => `${r.title}${r.summary}${r.tags?.join('')}`.includes(keyword))
    if (access === 'free' || String(is_free) === '1' || String(is_free) === 'true') list = list.filter(r => r.is_free)
    if (access === 'paid' || String(is_free) === '0' || String(is_free) === 'false') list = list.filter(r => !r.is_free)
    if (access === 'purchased') list = list.filter(r => resourcePurchases.has(r._id))
    if (access === 'downloaded') list = list.filter(r => resourceDownloads.some(d => d.resource_id === r._id))
    if (access === 'favorites') {
      const favorites = this._favoriteIds()
      list = list.filter(r => favorites.has(r._id))
    }
    if (sort === 'popular') list.sort((a, b) => b.view_count - a.view_count)
    if (sort === 'downloads') list.sort((a, b) => b.download_count - a.download_count)
    if (sort === 'featured') list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.download_count - a.download_count)
    const start = (page - 1) * pageSize
    const favorites = this._favoriteIds()
    return { list: list.slice(start, start + pageSize).map(item => ({ ...item, is_favorited: favorites.has(item._id), is_purchased: resourcePurchases.has(item._id), can_download: item.is_free || resourcePurchases.has(item._id) })), total: list.length, page: Number(page), pageSize: Number(pageSize) }
  },
  overview() {
    return {
      total: resourceData.length,
      free: resourceData.filter(item => item.is_free).length,
      featured: resourceData.filter(item => item.is_featured).length,
      downloads: resourceData.reduce((sum, item) => sum + item.download_count, 0),
      mine: resourcePurchases.size,
      categories: categoryData.filter(item => item.type === 'resource').map(item => ({ ...item, resource_count: resourceData.filter(resource => resource.category_id === item.id).length }))
    }
  },
  my(params = {}) {
    const data = this.list({ ...params, access: params.mode === 'all' ? undefined : (params.mode || 'all') })
    return { ...data, mode: params.mode || 'all' }
  },
  _favoriteIds() {
    return new Set(favoriteService.list({ type: 'resource' }).list.map(item => item.targetId))
  },
  detail(id) {
    const item = resourceData.find(r => r._id === id)
    if (!item) return null
    const purchased = resourcePurchases.has(id)
    return { ...item, is_purchased: purchased, can_download: !!item.is_free || purchased, download_url: `/resource/${id}/file` }
  },
  purchase(id) {
    const item = resourceData.find(r => r._id === id)
    if (!item) return null
    resourcePurchases.add(id)
    return { status: item.is_free ? 'free' : 'paid', order_no: item.is_free ? '' : `RMOCK${Date.now()}`, resource: this.detail(id) }
  },
  download(id) {
    const item = this.detail(id)
    if (!item || !item.can_download) throw new Error('请先购买资料')
    const source = resourceData.find(r => r._id === id)
    source.download_count += 1
    resourceDownloads.push({ resource_id: id, created_at: new Date().toISOString() })
    return { ...item, download_url: `/resource/${id}/file`, download_count: source.download_count }
  }
}

export const bannerService = {
  list() { return bannerData }
}

export const categoryService = {
  list(params = {}) {
    return categoryData.filter(item => item.status === 'active' && (!params.type || item.type === params.type))
  }
}

// ========== 后台管理服务（Mock 与真实后台保持同一契约） ==========
const mockProviderReviewState = new Map()

export const adminService = {
  access() { return { role: 'super_admin', label: '超级管理员', permissions: ['*'], roles: [{ role: 'super_admin', label: '超级管理员' }, { role: 'content_reviewer', label: '内容审核' }, { role: 'operator', label: '运营' }, { role: 'support', label: '客服' }, { role: 'analyst', label: '只读数据' }] } },
  metrics(days = 7) {
    const period = Number(days) === 30 ? 30 : 7
    const trend = period === 7 ? dashboardData.trend_7days : dashboardData.trend_30days
    const summary = {
      active_users: 42, new_users: 18, group_joins: 27, active_groups: 8,
      group_posts: 31, group_comments: 64, group_messages: 118,
      published_demands: 24, leads: 19, orders: 7, pending_reports: 2,
      avg_report_hours: 3.6, retained_joiners: 11, retention_rate: 40.7
    }
    const changes = Object.fromEntries(
      ['active_users', 'new_users', 'group_joins', 'group_messages', 'published_demands', 'leads', 'orders']
        .map((key) => [key, { value: 1, percent: 12, label: '+12%', up: true }])
    )
    return {
      period,
      generated_at: new Date().toISOString(),
      summary,
      changes,
      trend: trend.map((item) => ({ date: item.date, joins: item.leads, active: item.views, posts: item.leads, comments: item.deals, messages: item.views, leads: item.leads, orders: item.deals })),
      categories: dashboardData.category_stats.map(({ id, name, count }) => ({ id, name, count })),
      regions: [{ name: '上海', count: 26 }, { name: '北京', count: 21 }, { name: '深圳', count: 17 }, { name: '杭州', count: 14 }],
      feeds: [
        { id: 'mock_feed_1', icon: '/static/icons/handshake.svg', text: '演示用户发起了一条团队邀约', time: '刚刚' },
        { id: 'mock_feed_2', icon: '/static/icons/chat.svg', text: '上海分会有新的群聊消息', time: '10分钟前' },
        { id: 'mock_feed_3', icon: '/static/icons/ticket.svg', text: '社群活动收到新的报名', time: '1小时前' }
      ],
      agent: {
        period,
        requests: period === 7 ? 86 : 312,
        organize_requests: period === 7 ? 42 : 151,
        chat_turns: period === 7 ? 44 : 161,
        fallback_count: period === 7 ? 7 : 25,
        fallback_rate: period === 7 ? 8.1 : 8,
        sessions: period === 7 ? 51 : 182,
        completed_sessions: period === 7 ? 39 : 141,
        completion_rate: period === 7 ? 76.5 : 77.5,
        second_turn_sessions: period === 7 ? 28 : 104,
        second_turn_rate: period === 7 ? 54.9 : 57.1,
        draft_applied: period === 7 ? 33 : 126,
        draft_apply_rate: period === 7 ? 64.7 : 69.2,
        published_demands: period === 7 ? 19 : 76,
        publish_rate: period === 7 ? 37.3 : 41.8,
        draft_publish_rate: period === 7 ? 57.6 : 60.3,
        edited_sessions: period === 7 ? 23 : 88,
        avg_quality: period === 7 ? 78.6 : 79.4,
        fallback_reasons: [{ reason: '上游响应超时', count: period === 7 ? 4 : 14 }, { reason: '服务暂时不可用', count: period === 7 ? 3 : 11 }],
        edited_fields: [{ field: 'budget', count: period === 7 ? 18 : 66 }, { field: 'detail', count: period === 7 ? 15 : 58 }, { field: 'region', count: period === 7 ? 9 : 31 }],
        trend: []
      }
    }
  },
  intakes: {
    stats() {
      const list = mockAdminIntakes()
      const countBy = (field) => list.reduce((result, item) => {
        const key = item[field] || ''
        if (key) result[key] = (result[key] || 0) + 1
        return result
      }, {})
      const countList = (field) => Object.entries(countBy(field)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))
      return {
        total: list.length,
        pending: list.filter((item) => ['submitted', 'reviewing'].includes(item.status)).length,
        by_status: countBy('status'),
        by_role: countBy('role'),
        cities: countList('city'),
        industries: countList('primary_industry'),
        pools: [],
        generated_at: new Date().toISOString()
      }
    },
    list(params = {}) {
      let list = mockAdminIntakes()
      if (params.role) list = list.filter((item) => item.role === params.role)
      if (params.status) list = list.filter((item) => item.status === params.status)
      if (params.city) list = list.filter((item) => String(item.city || '').includes(params.city))
      if (params.primary_industry) list = list.filter((item) => item.primary_industry === params.primary_industry)
      if (params.annual_revenue_range) list = list.filter((item) => item.annual_revenue_range === params.annual_revenue_range)
      if (params.capital_size_range) list = list.filter((item) => item.capital_size_range === params.capital_size_range)
      if (params.investment_direction) list = list.filter((item) => (item.investment_directions || []).includes(params.investment_direction))
      if (params.pool) list = list.filter((item) => (item.pool_tags || []).includes(params.pool))
      if (params.keyword) list = list.filter((item) => `${item.company_name}${item.contact_name}${item.business_scope}${item.business_intro}`.includes(params.keyword))
      const page = Number(params.page) || 1
      const pageSize = Number(params.pageSize) || 20
      list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      return { list: list.slice((page - 1) * pageSize, page * pageSize).map((item) => ({
        ...cloneIntake(item),
        target_count: item.target_companies?.length || 0,
        referral_count: item.referrals?.total || 0,
        user: { id: item.user_id || 'mock_user', nickname: item.contact_name, company: item.company_name, title: item.contact_title, city: item.city }
      })), total: list.length, page, pageSize }
    },
    detail(id) {
      const item = mockAdminIntakes().find((row) => row.id === id || row._id === id)
      if (!item) return null
      return {
        ...cloneIntake(item),
        target_count: item.target_companies?.length || 0,
        referral_count: item.referrals?.total || 0,
        user: { id: item.user_id || 'mock_user', nickname: item.contact_name, company: item.company_name, title: item.contact_title, city: item.city }
      }
    },
    review(id, status, note = '') {
      const item = mockIntakeProfiles.find((row) => row.id === id || row._id === id)
        || (mockIntakeByUser.get(userData.user.id)?.id === id ? mockIntakeByUser.get(userData.user.id) : null)
      if (!item) return null
      item.status = status
      item.review_note = note
      item.reviewed_at = new Date().toISOString()
      item.updated_at = item.reviewed_at
      return this.detail(item.id)
    }
  },
  demands: {
    list(params = {}) {
      let list = [...demandData]
      if (params.status) list = list.filter(item => item.status === params.status)
      if (params.keyword) list = list.filter(item => item.title.includes(params.keyword) || item.company_name.includes(params.keyword))
      list.sort((a, b) => new Date(b.publish_time) - new Date(a.publish_time))
      const page = Number(params.page) || 1
      const pageSize = Number(params.pageSize) || 20
      return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize }
    },
    updateStatus(id, status) {
      const item = demandData.find(d => d._id === id)
      if (!item) return null
      item.status = status
      item.updated_at = new Date().toISOString()
      return item
    },
    updateFlags(id, flags = {}) {
      const item = demandData.find(d => d._id === id)
      if (!item) return null
      if (flags.is_top !== undefined) item.is_top = !!flags.is_top
      if (flags.is_featured !== undefined) item.is_featured = !!flags.is_featured
      item.updated_at = new Date().toISOString()
      return item
    },
    delete(id) { return demandService.delete(id) }
  },
  leads: {
    list(params = {}) {
      let list = [...leadData]
      if (params.status) list = list.filter(item => item.status === params.status)
      return { list, total: list.length }
    },
    updateStatus(id, status) { return leadService.updateStatus(id, status) },
    updateNote(id, adminNote) {
      const item = leadData.find(lead => lead._id === id)
      if (!item) return null
      item.admin_note = adminNote || ''
      item.updated_at = new Date().toISOString()
      return item
    }
  },
  orders: {
    list(params = {}) {
      let list = [...orderData]
      if (params.status) list = list.filter(item => item.status === params.status)
      return { list, total: list.length }
    },
    updateStatus(id, status) { return orderService.updateStatus(id, status) },
    updateRemark(id, remark) {
      const item = orderData.find(order => order._id === id)
      if (!item) return null
      item.remark = remark || ''
      item.updated_at = new Date().toISOString()
      return item
    }
  },
  users: {
    list(params = {}) {
      let list = [...adminUserData]
      if (params.role) list = list.filter(item => item.role === params.role)
      if (params.status) list = list.filter(item => item.status === params.status)
      if (params.keyword) list = list.filter(item => `${item.nickname}${item.company}${item.phone}`.includes(params.keyword))
      return { list, total: list.length }
    },
    updateStatus(id, status) {
      const item = adminUserData.find(user => user._id === id)
      if (!item || !['active', 'disabled'].includes(status)) return null
      item.status = status
      return item
    },
    updateRole(id, role) {
      const item = adminUserData.find(user => user._id === id)
      if (!item || !['user', 'admin'].includes(role)) return null
      item.role = role
      return item
    }
  },
  providers: {
    list(params = {}) {
      let list = providersData.slice(0, 8).map((item, index) => {
        const initialStatus = index === 0 || index >= 7 ? 'pending' : (index < 5 ? 'verified' : 'rejected')
        const review = mockProviderReviewState.get(item._id) || {
          status: initialStatus,
          note: initialStatus === 'rejected' ? '请补充服务案例、交付范围和合作信息后重新提交。' : ''
        }
        return {
          ...item,
          verified: review.status === 'verified',
          verification: review.status,
          verification_info: { review_note: review.note },
          user: { id: `mock_provider_user_${item._id}`, nickname: item.name, company: item.name, title: '服务负责人', city: item.region, status: 'active' }
        }
      })
      if (params.status) list = list.filter((item) => item.verification === params.status)
      if (params.keyword) list = list.filter((item) => `${item.name}${item.category_name}${item.region}`.includes(params.keyword))
      return { list, total: list.length, page: Number(params.page) || 1, pageSize: Number(params.pageSize) || 20 }
    },
    review(id, status, note = '') {
      const item = providersData.find((provider) => provider._id === id)
      if (!item) return null
      item.verified = status === 'verified'
      mockProviderReviewState.set(id, { status, note })
      return { ...item, verification: status, verification_info: { review_note: note }, user: { id: `mock_provider_user_${id}`, nickname: item.name, company: item.name, title: '服务负责人', city: item.region, status: 'active' } }
    }
  },
  products: {
    list(params = {}) {
      let list = [...productData]
      if (params.status) list = list.filter(item => item.status === params.status)
      return { list, total: list.length }
    },
    create(data = {}) {
      const item = {
        _id: uid(), title: data.title || '未命名服务', service_type: data.service_type || 'resource_pack',
        category_id: data.category_id || 'prod_cat_04', price: Number(data.price) || 0,
        market_price: Number(data.market_price) || Number(data.price) || 0, unit: data.unit || '次',
        sale_count: 0, is_featured: !!data.is_featured, status: data.status || 'on_sale',
        description_rich: data.description_rich || '<p>服务详细介绍</p>', cover_url: data.cover_url || ''
      }
      productData.unshift(item)
      return item
    },
    update(id, data = {}) {
      const item = productData.find(p => p._id === id)
      if (!item) return null
      Object.assign(item, data)
      return item
    },
    delete(id) {
      const idx = productData.findIndex(p => p._id === id)
      if (idx < 0) return false
      productData.splice(idx, 1)
      return true
    }
  },
  resources: {
    list(params = {}) {
      let list = [...resourceData]
      if (params.status) list = list.filter(item => item.status === params.status)
      return { list, total: list.length }
    },
    create(data = {}) {
      const item = {
        _id: uid(), title: data.title || '未命名资料', category_id: data.category_id || 'resource_cat_01',
        category_name: data.category_name || '营销方案', summary: data.summary || '', content_rich: data.content_rich || '',
        file_type: data.file_type || 'pdf', file_size: data.file_size || '', file_url: data.file_url || '',
        tags: data.tags || [], view_count: 0, download_count: 0, favorite_count: 0,
        is_free: data.is_free !== false, price: Number(data.price) || 0, is_featured: !!data.is_featured,
        status: data.status || 'published', created_at: new Date().toISOString()
      }
      resourceData.unshift(item)
      return item
    },
    update(id, data = {}) {
      const item = resourceData.find(r => r._id === id)
      if (!item) return null
      Object.assign(item, data)
      return item
    },
    delete(id) {
      const idx = resourceData.findIndex(r => r._id === id)
      if (idx < 0) return false
      resourceData.splice(idx, 1)
      return true
    }
  },
  categories: {
    list(params = {}) { return categoryData.filter(item => !params.type || item.type === params.type) },
    create(data = {}) {
      const item = { id: data.id || uid(), name: data.name || '新分类', icon: data.icon || '/static/icons/file.svg', type: data.type || 'demand', sort: categoryData.length, status: 'active' }
      categoryData.push(item)
      return item
    },
    update(id, data = {}) {
      const item = categoryData.find(c => c.id === id)
      if (!item) return null
      Object.assign(item, data)
      return item
    },
    delete(id) {
      const idx = categoryData.findIndex(c => c.id === id)
      if (idx < 0) return false
      categoryData.splice(idx, 1)
      return true
    }
  },
  banners: {
    list() { return [...bannerData] },
    create(data = {}) {
      const item = { _id: uid(), title: data.title || '新 Banner', subtitle: data.subtitle || '', type: data.type || 'none', target_id: data.target_id || '', sort: bannerData.length, status: 'active' }
      bannerData.push(item)
      return item
    },
    update(id, data = {}) {
      const item = bannerData.find(b => b._id === id)
      if (!item) return null
      Object.assign(item, data)
      return item
    },
    delete(id) {
      const idx = bannerData.findIndex(b => b._id === id)
      if (idx < 0) return false
      bannerData.splice(idx, 1)
      return true
    }
  },
  system: {
    get() { return { ...systemConfigData } },
    update(data = {}) {
      Object.assign(systemConfigData, data)
      return { ...systemConfigData }
    }
  },
  reports: {
    list() { return { list: [], total: 0 } },
    update(id, data = {}) { return { _id: id, id, ...data } }
  },
  appeals: {
    list() { return { list: cloneNetwork(mockAppeals), total: mockAppeals.length } },
    update(id, data = {}) {
      const item = mockAppeals.find((appeal) => (appeal._id || appeal.id) === id)
      if (item) Object.assign(item, data, { updated_at: new Date().toISOString() })
      return cloneNetwork(item || { _id: id, id, ...data })
    }
  },
  auditLogs: {
    list() { return { list: [], total: 0 } }
  },
  production: {
    readiness() { return { environment: 'development', ready: true, checks: [], safe_for_local: true } }
  }
}

export const favoriteService = {
  _key: STORAGE_KEYS.FAVORITES,
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
  rating: (4 + rng()).toFixed(1),
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
    conversion_rate: (rng() * 20 + 5).toFixed(1),
    avg_response_time: randInt(1, 6) + '小时',
    todo_orders: 3,
    todo_leads: 5,
    todo_messages: 2
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
    id: cat.id,
    name: cat.name,
    count: randInt(5, 50),
    color: pick(THEME.palette)
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
    if (post) {
      post._liked = !post._liked
      post.like_count = Math.max(0, Number(post.like_count || 0) + (post._liked ? 1 : -1))
      return { liked: post._liked, count: post.like_count }
    }
    return { liked: false, count: 0 }
  },

  // 用户信息
  userInfo(userId) { return usersData.find(u => u.id === userId) || null }
}

// ========== 人脉圈 / 社群 Mock ==========
const networkBranchesData = [
  { id: 'branch_shanghai', name: '上海分会', city: '上海', intro: '每月一次线下闭门交流', member_count: 0 },
  { id: 'branch_beijing', name: '北京分会', city: '北京', intro: '连接北方企业家与产业服务伙伴', member_count: 0 },
  { id: 'branch_south', name: '华南分会', city: '深圳', intro: '科技、消费和出海项目合作', member_count: 0 },
  { id: 'branch_growth', name: '增长线上分会', city: '线上', intro: '每周案例共创与增长指标复盘', member_count: 0 }
]

const networkPeopleData = usersData.map((user, index) => ({
  ...user,
  title: ['品牌增长顾问', '私域运营负责人', '品牌策略合伙人', '内容增长主理人', '社群增长顾问'][index],
  city: ['上海', '杭州', '北京', '深圳', '广州'][index],
  workflow_role: ['demand_owner', 'service_provider', 'demand_owner', 'service_provider', 'service_provider'][index],
  organization_type: ['project', 'project', 'capital', 'project', 'project'][index],
  identity_label: ['甲方·需求方', '乙方·服务方', '资金方·投资机构', '乙方·服务方', '乙方·服务方'][index],
  kind: 'person',
  followed: false
}))

const networkGroupsData = [
  {
    _id: 'network_circle_founder', id: 'network_circle_founder', name: '创始人·人脉圈', short_name: '创始人圈', type: 'circle', group_type: 'circle',
    description: '连接企业主、投资人和长期合作伙伴，让一次认识变成持续往来。', city: '全国', industry: '企业服务', cover_color: '#5968D8', member_count: 0, activity_count: 96, joined: true, joined_branch_id: 'branch_shanghai', join_intent: '项目合作',
    branches: networkBranchesData, posts: [
      { _id: 'network_post_1', post_type: 'collab', content: '本周有一个消费品牌项目在找华东渠道伙伴，欢迎在群内留下你的城市和资源方向。', author: networkPeopleData[1], like_count: 26, comment_count: 8, liked: false, comments: [{ _id: 'network_comment_1', content: '上海这边有渠道资源，方便的话我来补充具体行业。', author: networkPeopleData[0], created_at: new Date(Date.now() - 1800000).toISOString() }], created_at: new Date(Date.now() - 3600000).toISOString() },
      { _id: 'network_post_2', post_type: 'event', content: '上海分会本月闭门会开放 6 个席位，主题是“项目合作如何长期化”。', author: networkPeopleData[2], like_count: 18, comment_count: 5, liked: false, comments: [{ _id: 'network_comment_2', content: '已报名，期待现场认识更多长期合作伙伴。', author: networkPeopleData[1], created_at: new Date(Date.now() - 7200000).toISOString() }], created_at: new Date(Date.now() - 86400000).toISOString() }
    ],
    members: networkPeopleData.slice(0, 4)
  },
  {
    _id: 'network_branch_controller', id: 'network_branch_controller', name: '实控人分会', short_name: '实控人分会', type: 'branch', group_type: 'branch',
    description: '围绕实控人和董事长的深度连接，聚焦项目、资本与产业协同。', city: '上海', industry: '资本与产业', cover_color: '#D86B59', member_count: 0, activity_count: 42, joined: true, joined_branch_id: 'branch_shanghai_controller', join_intent: '产业协同',
    branches: [{ id: 'branch_shanghai_controller', name: '上海实控人分会', city: '上海', intro: '实控人定向交流与项目共创', member_count: 0 }],
    posts: [{ _id: 'network_post_3', post_type: 'event', content: '实控人分会本周五晚有一场小范围交流，重点聊产业并购和董事会连接。', author: networkPeopleData[0], like_count: 12, comment_count: 4, liked: false, comments: [], created_at: new Date(Date.now() - 2 * 86400000).toISOString() }],
    members: networkPeopleData.slice(1, 4)
  },
  {
    _id: 'network_community_growth', id: 'network_community_growth', name: '增长同业社群', short_name: '增长同业', type: 'community', group_type: 'community',
    description: '品牌、增长、内容和运营同业的经验交换与项目互助空间。', city: '全国', industry: '品牌增长', cover_color: '#2F9B82', member_count: 0, activity_count: 128, joined: false,
    branches: [{ id: 'branch_growth', name: '增长线上分会', city: '线上', intro: '每周案例共创', member_count: 0 }],
    posts: [{ _id: 'network_post_4', post_type: 'experience', content: '增长同业社群发起一次“社群活跃度提升”案例共创，欢迎带数据来交流。', author: networkPeopleData[4], like_count: 32, comment_count: 11, liked: false, comments: [{ _id: 'network_comment_3', content: '这个话题很实用，能否带一下社群留存率的口径？', author: networkPeopleData[0], created_at: new Date(Date.now() - 2 * 86400000).toISOString() }], created_at: new Date(Date.now() - 3 * 86400000).toISOString() }],
    members: networkPeopleData.slice(0, 3)
  },
  {
    _id: 'network_branch_brand', id: 'network_branch_brand', name: '品牌传播分会', short_name: '品牌传播', type: 'branch', group_type: 'branch',
    description: '品牌、公关、媒体与内容伙伴的城市分会，适合找资源、找搭档。', city: '深圳', industry: '品牌传播', cover_color: '#CC8A38', member_count: 0, activity_count: 31, joined: false,
    branches: [{ id: 'branch_shenzhen_brand', name: '深圳品牌分会', city: '深圳', intro: '品牌与媒体资源的城市连接站', member_count: 0 }],
    posts: [], members: networkPeopleData.slice(2, 5)
  },
  {
    _id: 'network_community_private', id: 'network_community_private', name: '私域运营社群', short_name: '私域运营', type: 'community', group_type: 'community',
    description: '围绕社群运营、私域增长和用户关系经营的实践交流场。', city: '杭州', industry: '私域运营', cover_color: '#7A69C7', member_count: 0, activity_count: 75, joined: true, joined_branch_id: 'branch_hangzhou_private', join_intent: '项目合作',
    branches: [{ id: 'branch_hangzhou_private', name: '杭州私域分会', city: '杭州', intro: '私域运营者的实战复盘与互助', member_count: 0 }],
    posts: [{ _id: 'network_post_5', post_type: 'question', content: '杭州私域分会正在征集下季度线下分享主题，欢迎投票。', author: networkPeopleData[1], like_count: 9, comment_count: 3, liked: false, comments: [], created_at: new Date(Date.now() - 4 * 86400000).toISOString() }],
    members: networkPeopleData.slice(0, 3)
  }
]

// Mock 也遵循真实后端的人数口径：成员数来自当前 members 列表，
// 分会人数只统计实际归属该分会的成员，避免卡片、分会和成员页出现三套数字。
function syncMockNetworkCounts(group) {
  if (!group) return group
  const branches = Array.isArray(group.branches) ? group.branches : []
  const branchIds = new Set(branches.map(branch => branch.id))
  const branchCounts = new Map(branches.map(branch => [branch.id, 0]))
  const members = Array.isArray(group.members) ? group.members : []

  // 历史 mock 成员没有 branch_id 时，按稳定顺序补齐归属；当前用户优先使用实际选择的分会。
  group.members = members.map((member, index) => {
    const existingBranchId = member.branch_id || member.branchId
    const selectedBranchId = group.joined_branch_id && member.id === mockCurrentUserId
      ? group.joined_branch_id
      : existingBranchId
    const branchId = branchIds.has(selectedBranchId)
      ? selectedBranchId
      : (branches.length ? branches[index % branches.length]?.id : '')
    if (branchId) branchCounts.set(branchId, Number(branchCounts.get(branchId) || 0) + 1)
    return branchId
      ? { ...member, branch_id: branchId, branchId }
      : { ...member }
  })

  const memberCount = group.members.length
  group.member_count = memberCount
  group.memberCount = memberCount
  group.active_member_count = memberCount
  group.activeMemberCount = memberCount
  branches.forEach((branch) => {
    branch.member_count = Number(branchCounts.get(branch.id) || 0)
    branch.memberCount = branch.member_count
  })
  return group
}

function cloneNetwork(value) {
  return JSON.parse(JSON.stringify(value))
}

const mockCurrentUserId = 'demo_user_001'
function mockCurrentMember() {
  return { id: mockCurrentUserId, nickname: '演示用户', company: '示例科技', title: '项目负责人', city: '上海', bio: '正在寻找长期合作伙伴', workflow_role: 'demand_owner', organization_type: 'project', identity_label: '甲方·需求方' }
}
networkGroupsData.forEach((group) => {
  if (group.joined && !group.members?.some((member) => member.id === mockCurrentUserId)) {
    group.members = [...(group.members || []), mockCurrentMember()]
  }
  syncMockNetworkCounts(group)
})
const mockFriendships = [
  { id: 'mock_friend_1', user_id: mockCurrentUserId, friend_id: networkPeopleData.find((item) => item.id !== mockCurrentUserId)?.id || 'user_provider_001', created_at: new Date(Date.now() - 86400000 * 8).toISOString() }
]
const mockFriendRequests = [
  { id: 'mock_friend_request_1', _id: 'mock_friend_request_1', from_user_id: networkPeopleData.find((item) => item.id !== mockCurrentUserId)?.id || 'user_provider_001', to_user_id: mockCurrentUserId, message: '最近在关注你的项目方向，方便认识一下吗？', status: 'pending', direction: 'incoming', created_at: new Date(Date.now() - 3600000).toISOString() }
]
const mockReferralRequests = [{
  id: 'mock_referral_incoming_1',
  _id: 'mock_referral_incoming_1',
  requester_id: networkPeopleData.find((item) => item.id !== mockCurrentUserId)?.id || 'user_provider_001',
  connector_id: mockCurrentUserId,
  target_user_id: networkPeopleData.find((item, index) => item.id !== mockCurrentUserId && index > 1)?.id || 'user_team_11',
  context: '我正在推进一个具体项目，想请你判断是否适合介绍我们认识。',
  status: 'pending',
  connector_note: '',
  created_at: new Date(Date.now() - 45 * 60000).toISOString()
}]
const mockDirectMessages = {}
const mockGroupMessages = {}

function mockPerson(id) {
  const person = networkPeopleData.find((item) => item.id === id)
  return person ? { ...cloneNetwork(person), can_message: true, friend_status: 'friends', friendStatus: 'friends' } : null
}

function mockRequestVO(item) {
  const incoming = item.to_user_id === mockCurrentUserId
  const otherId = incoming ? item.from_user_id : item.to_user_id
  return { ...cloneNetwork(item), _id: item.id, user_id: otherId, direction: incoming ? 'incoming' : 'outgoing', user: mockPerson(otherId) }
}

function mockReferralVO(item) {
  return {
    ...cloneNetwork(item),
    _id: item.id || item._id,
    requester: mockPerson(item.requester_id),
    connector: mockPerson(item.connector_id) || mockCurrentMember(),
    target: mockPerson(item.target_user_id),
    can_review: item.connector_id === mockCurrentUserId && item.status === 'pending',
    can_cancel: item.requester_id === mockCurrentUserId && item.status === 'pending'
  }
}

function ensureMockEvents(group) {
  if (!group) return []
  if (!Array.isArray(group.events)) {
    const start = new Date(Date.now() + 5 * 86400000).toISOString()
    const isFounder = group.id === 'network_circle_founder'
    const isPrivate = group.id === 'network_community_private'
    group.events = isFounder || isPrivate ? [{
      id: `mock_event_${group.id}`,
      _id: `mock_event_${group.id}`,
      title: isFounder ? '上海分会闭门交流：把一次认识变成长期合作' : '私域运营案例夜：把活跃做成留存',
      intro: isFounder ? '围绕项目合作、资源互换和长期伙伴关系，做一次小范围的真实交流。' : '带着一个真实案例来，现场一起拆解社群活跃与留存。',
      starts_at: start,
      location: isFounder ? '上海 · 静安' : '杭州 · 线上会议室',
      capacity: 30,
      status: 'upcoming',
      signup_count: isFounder ? 12 : 8,
      signed_up: !!group.joined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }] : []
  }
  return group.events
}

function ensureMockOpportunities(group) {
  if (!group) return []
  if (!Array.isArray(group.opportunities)) {
    group.opportunities = group.id === 'network_circle_founder' ? [{
      id: `mock_opportunity_${group.id}`,
      _id: `mock_opportunity_${group.id}`,
      author_id: networkPeopleData[1]?.id || mockCurrentUserId,
      title: '寻找华东首批合作渠道与联合落地伙伴',
      content: '项目已完成第一轮用户验证，计划先从上海和杭州各选择一个真实场景推进，欢迎说明你能提供的渠道、交付或行业资源。',
      opportunity_type: 'channel',
      visibility: 'members',
      status: 'open',
      deadline_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 3 * 3600000).toISOString()
    }] : []
  }
  return group.opportunities
}

function mockOpportunityVO(item) {
  return {
    ...cloneNetwork(item),
    _id: item.id || item._id,
    author: mockPerson(item.author_id) || cloneNetwork(networkPeopleData[0]),
    can_manage: item.author_id === mockCurrentUserId,
    is_open: item.status === 'open'
  }
}

function mockEventVO(event, group) {
  const capacity = Number(event?.capacity || 0)
  const signupCount = Number(event?.signup_count || 0)
  const signedUp = !!event?.signed_up
  const waitlisted = !!event?.waitlisted
  return {
    ...cloneNetwork(event),
    _id: event.id || event._id,
    id: event.id || event._id,
    capacity,
    signup_count: signupCount,
    checkin_count: Object.values(event?.checkins || {}).filter(Boolean).length,
    recap: event?.recap || '',
    recap_published_at: event?.recap_published_at || '',
    signed_up: signedUp,
    waitlisted,
    waitlist_count: Number(event?.waitlist_count || 0),
    waitlist_position: waitlisted ? Number(event?.waitlist_position || 1) : 0,
    can_signup: !!group?.joined && event.status === 'upcoming' && (signedUp || capacity <= 0 || signupCount < capacity),
    can_waitlist: !!group?.joined && event.status === 'upcoming' && !signedUp && !waitlisted && capacity > 0 && signupCount >= capacity
  }
}

export const networkService = {
  overview() {
    const groups = networkGroupsData.filter((group) => group.status !== 'closed').map(cloneNetwork)
    const people = networkPeopleData.map(person => ({ ...cloneNetwork(person), followed: followData.some(item => item.user.id === person.id) }))
    const joinedGroups = groups.filter(group => group.joined)
    return {
      stats: { following: followData.length, joined_groups: joinedGroups.length, branches: joinedGroups.filter((group) => group.joined_branch_id || group.joinedBranchId).length, people: people.length },
      people: people.slice(0, 6),
      groups: groups.slice(0, 6),
      joined_groups: joinedGroups.slice(0, 4),
      branches: joinedGroups
        .flatMap((group) => (group.branches || [])
          .filter((branch) => branch.id === (group.joined_branch_id || group.joinedBranchId))
          .map((branch) => ({
            ...branch,
            group_id: group.id,
            group_name: group.name,
            group_short_name: group.short_name || group.name
          })))
        .slice(0, 4)
    }
  },
  person(id) {
    const person = networkPeopleData.find((item) => item.id === id)
    if (!person) return null
    const followed = followData.some((item) => item.user.id === id)
    const friends = mockFriendships.some((item) => item.user_id === mockCurrentUserId && item.friend_id === id)
    const outgoing = mockFriendRequests.some((item) => item.status === 'pending' && item.from_user_id === mockCurrentUserId && item.to_user_id === id)
    const incoming = mockFriendRequests.some((item) => item.status === 'pending' && item.from_user_id === id && item.to_user_id === mockCurrentUserId)
    const friendStatus = friends ? 'friends' : outgoing ? 'pending_outgoing' : incoming ? 'pending_incoming' : 'none'
    return {
      ...cloneNetwork(person),
      followed,
      friend_status: friendStatus,
      friendStatus,
      can_connect: id !== mockCurrentUserId,
      can_message: friendStatus === 'friends'
    }
  },
  people(params = {}) {
    const keyword = String(params.keyword || params.q || '').trim()
    let list = networkPeopleData.filter(person => !keyword || `${person.nickname}${person.company}${person.title}${person.bio}${person.city}`.includes(keyword))
    if (params.city) list = list.filter(person => person.city === params.city)
    if (params.identity) list = list.filter(person => person.workflow_role === params.identity || person.organization_type === params.identity)
    const page = Math.max(1, Number.parseInt(params.page, 10) || 1)
    const pageSize = Math.min(60, Math.max(1, Number.parseInt(params.pageSize, 10) || 24))
    const start = (page - 1) * pageSize
    const pageList = list.slice(start, start + pageSize)
    return {
      list: pageList.map(person => ({ ...cloneNetwork(person), followed: followData.some(item => item.user.id === person.id) })),
      total: list.length,
      page,
      pageSize,
      has_more: page * pageSize < list.length,
      hasMore: page * pageSize < list.length
    }
  },
  groups(params = {}) {
    let list = networkGroupsData.filter((group) => group.status !== 'closed')
    if (params.type && params.type !== 'all') list = list.filter(group => group.group_type === params.type)
    if (['1', 'true', 'yes'].includes(String(params.joined || '').toLowerCase())) list = list.filter(group => group.joined)
    const keyword = String(params.keyword || params.q || '').trim()
    if (keyword) list = list.filter(group => `${group.name}${group.description}${group.city}${group.industry}`.includes(keyword))
    if (params.sort === 'active') list.sort((a, b) => b.activity_count - a.activity_count)
    return { list: list.map((group) => cloneNetwork(syncMockNetworkCounts(group))), total: list.length }
  },
  groupDetail(id) {
    const group = networkGroupsData.find(item => item.id === id)
    if (!group) return null
    if (group.status === 'closed') return null
    syncMockNetworkCounts(group)
    ensureMockEvents(group)
    const ownerId = group.owner_id || group.created_by || group.members?.[0]?.id || ''
    return { ...cloneNetwork(group), status: 'active', created_by: ownerId, owner_user_id: ownerId, can_manage: !!group.joined, can_transfer: !!group.joined && ownerId === mockCurrentUserId, can_dissolve: !!group.joined && ownerId === mockCurrentUserId, events: ensureMockEvents(group).map((event) => mockEventVO(event, group)), opportunities: ensureMockOpportunities(group).map(mockOpportunityVO) }
  },
  joinGroup(id, options = {}) {
    const group = networkGroupsData.find(item => item.id === id)
    if (!group) return { joined: false }
    if (!group.joined) {
      group.joined = true
      if (!group.members?.some((member) => member.id === mockCurrentUserId)) group.members = [...(group.members || []), mockCurrentMember()]
    }
    group.joined_branch_id = options.branch_id || group.joined_branch_id || group.branches?.[0]?.id || ''
    group.join_intent = options.join_intent || group.join_intent || ''
    syncMockNetworkCounts(group)
    return { joined: true, group: cloneNetwork(group) }
  },
  leaveGroup(id) {
    const group = networkGroupsData.find(item => item.id === id)
    if (group) {
      group.joined = false
      group.joined_branch_id = ''
      group.join_intent = ''
      group.members = (group.members || []).filter((member) => member.id !== mockCurrentUserId)
      syncMockNetworkCounts(group)
      return { joined: false, group: cloneNetwork(group) }
    }
    return { joined: false }
  },
  createPost(id, content, postType = 'general') {
    const group = networkGroupsData.find(item => item.id === id)
    if (!group) return null
    const post = { _id: uid(), post_type: postType, content, author: { ...networkPeopleData[0], nickname: '演示用户', id: 'demo_user_001' }, like_count: 0, comment_count: 0, liked: false, comments: [], created_at: new Date().toISOString() }
    group.posts = [post, ...(group.posts || [])]
    group.activity_count++
    return cloneNetwork(post)
  },
  likePost(groupId, postId) {
    const post = networkGroupsData.find(group => group.id === groupId)?.posts?.find(item => item._id === postId)
    if (!post) return { liked: false, count: 0 }
    post.liked = !post.liked
    post.like_count = Math.max(0, Number(post.like_count || 0) + (post.liked ? 1 : -1))
    return { liked: post.liked, count: post.like_count }
  },
  comments(groupId, postId) {
    const post = networkGroupsData.find(group => group.id === groupId)?.posts?.find(item => item._id === postId)
    return { list: cloneNetwork(post?.comments || []), total: post?.comments?.length || 0 }
  },
  createComment(groupId, postId, content) {
    const post = networkGroupsData.find(group => group.id === groupId)?.posts?.find(item => item._id === postId)
    if (!post) return null
    const comment = { _id: uid(), content, author: { ...networkPeopleData[0], nickname: '演示用户', id: 'demo_user_001' }, created_at: new Date().toISOString() }
    post.comments = [...(post.comments || []), comment]
    post.comment_count = Number(post.comment_count || 0) + 1
    return cloneNetwork(comment)
  },
  acceptAnswer(groupId, postId, commentId) {
    const post = networkGroupsData.find(group => group.id === groupId)?.posts?.find(item => item._id === postId)
    if (!post) return null
    post.accepted_comment_id = commentId || ''
    post.accepted_answer = (post.comments || []).find((item) => item._id === commentId) || null
    return cloneNetwork(post)
  },
  opportunities(groupId) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const list = ensureMockOpportunities(group).map(mockOpportunityVO)
    return { list, total: list.length }
  },
  createOpportunity(groupId, data = {}) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    if (!group) return null
    const item = {
      id: uid(), _id: '', author_id: mockCurrentUserId,
      title: String(data.title || '新的合作机会').slice(0, 100), content: String(data.content || '').slice(0, 1000),
      opportunity_type: data.opportunity_type || 'collaboration', visibility: data.visibility || 'members',
      deadline_at: data.deadline_at || '', status: 'open', created_at: new Date().toISOString()
    }
    item._id = item.id
    ensureMockOpportunities(group).unshift(item)
    group.activity_count = Number(group.activity_count || 0) + 1
    return mockOpportunityVO(item)
  },
  updateOpportunity(groupId, opportunityId, data = {}) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const item = ensureMockOpportunities(group).find((row) => (row.id || row._id) === opportunityId)
    if (!item) return null
    Object.assign(item, data)
    return mockOpportunityVO(item)
  },
  friends() {
    const list = mockFriendships
      .filter((item) => item.user_id === mockCurrentUserId)
      .map((item) => mockPerson(item.friend_id))
      .filter(Boolean)
      .map((person) => ({ ...person, friend_status: 'friends', friendStatus: 'friends', can_message: true }))
    return { list, total: list.length }
  },
  friendRequests(params = {}) {
    const list = mockFriendRequests
      .filter((item) => !params.status || item.status === params.status)
      .map(mockRequestVO)
    return { list, total: list.length }
  },
  sendFriendRequest(data = {}) {
    const targetId = data.target_user_id || data.user_id
    const existing = mockFriendRequests.find((item) => item.status === 'pending' && item.from_user_id === mockCurrentUserId && item.to_user_id === targetId)
    if (existing) return mockRequestVO(existing)
    const item = { id: uid(), _id: '', from_user_id: mockCurrentUserId, to_user_id: targetId, message: data.message || '', status: 'pending', created_at: new Date().toISOString() }
    item._id = item.id
    mockFriendRequests.unshift(item)
    return mockRequestVO(item)
  },
  updateFriendRequest(id, status) {
    const item = mockFriendRequests.find((request) => request.id === id)
    if (!item) return null
    item.status = status
    if (status === 'accepted') {
      mockFriendships.push(
        { id: uid(), user_id: item.from_user_id, friend_id: item.to_user_id, created_at: new Date().toISOString() },
        { id: uid(), user_id: item.to_user_id, friend_id: item.from_user_id, created_at: new Date().toISOString() }
      )
    }
    return mockRequestVO(item)
  },
  referralOptions(targetUserId) {
    const friends = mockFriendships
      .filter((item) => item.user_id === mockCurrentUserId)
      .map((item) => mockPerson(item.friend_id))
      .filter(Boolean)
    return { list: friends, total: friends.length, target_user_id: targetUserId }
  },
  referrals(params = {}) {
    const direction = params.direction || 'all'
    const list = mockReferralRequests.filter((item) => direction === 'incoming' ? item.connector_id === mockCurrentUserId : direction === 'outgoing' ? item.requester_id === mockCurrentUserId : [item.requester_id, item.connector_id, item.target_user_id].includes(mockCurrentUserId))
    return { list: list.map(mockReferralVO), total: list.length }
  },
  requestReferral(data = {}) {
    const existing = mockReferralRequests.find((item) => item.status === 'pending' && item.requester_id === mockCurrentUserId && item.connector_id === data.connector_id && item.target_user_id === data.target_user_id)
    if (existing) return { ...mockReferralVO(existing), idempotent: true }
    const item = { id: uid(), _id: '', requester_id: mockCurrentUserId, connector_id: data.connector_id, target_user_id: data.target_user_id, context: data.context || '', demand_id: data.demand_id || '', deal_id: data.deal_id || '', status: 'pending', connector_note: '', created_at: new Date().toISOString() }
    item._id = item.id
    mockReferralRequests.unshift(item)
    return mockReferralVO(item)
  },
  updateReferral(id, data = {}) {
    const item = mockReferralRequests.find((row) => row.id === id || row._id === id)
    if (!item) return null
    Object.assign(item, data, { processed_at: new Date().toISOString() })
    return mockReferralVO(item)
  },
  conversations() {
    const peer = mockFriendships.find((item) => item.user_id === mockCurrentUserId)?.friend_id
    if (!peer) return { list: [], total: 0 }
    const messages = mockDirectMessages[peer] || [
      { id: 'mock_direct_1', _id: 'mock_direct_1', from: 'service', content: '最近有个品牌项目，想和你交流一下。', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 'mock_direct_2', _id: 'mock_direct_2', from: 'user', content: '可以，晚点把项目情况发我。', created_at: new Date(Date.now() - 3000000).toISOString() }
    ]
    mockDirectMessages[peer] = messages
    return {
      list: [{ id: `mock_conversation_${peer}`, _id: `mock_conversation_${peer}`, peer_id: peer, peer: mockPerson(peer), unread_count: 0, unreadCount: 0, last_message: cloneNetwork(messages[messages.length - 1]) }],
      total: 1
    }
  },
  directMessages(userId) {
    const peer = mockPerson(userId)
    if (!peer) return { conversation: null, peer: null, list: [], total: 0 }
    if (!mockDirectMessages[userId]) this.conversations()
    const list = (mockDirectMessages[userId] || []).map(cloneNetwork)
    return { conversation: { id: `mock_conversation_${userId}`, _id: `mock_conversation_${userId}`, peer_id: userId, peer }, peer, list, total: list.length }
  },
  sendDirectMessage(userId, content, attachments = [], clientMessageId = '') {
    if (!mockDirectMessages[userId]) this.directMessages(userId)
    if (!Array.isArray(mockDirectMessages[userId])) mockDirectMessages[userId] = []
    const retryKey = String(clientMessageId || '').trim()
    const existing = retryKey
      ? mockDirectMessages[userId].find((message) => message.client_message_id === retryKey)
      : null
    if (existing) return { ...cloneNetwork(existing), idempotent: true, replayed: true }
    const item = { id: uid(), _id: '', from: 'user', content, client_message_id: retryKey, attachments: Array.isArray(attachments) ? attachments : [], created_at: new Date().toISOString() }
    item._id = item.id
    mockDirectMessages[userId].push(item)
    return cloneNetwork(item)
  },
  manageGroup(id) {
    const group = networkGroupsData.find((item) => item.id === id)
    if (!group) return null
    const ownerId = group.owner_id || group.created_by || group.members?.[0]?.id || ''
    const adminIds = new Set(group.admin_ids || [])
    const members = (group.members || []).map((member, index) => ({ ...cloneNetwork(member), role: member.id === ownerId ? 'owner' : adminIds.has(member.id) || (!group.owner_id && index === 1) ? 'admin' : 'member', status: 'active', member_id: `mock_member_${id}_${member.id}` }))
    const canTransfer = !!group.joined && ownerId === mockCurrentUserId
    return { group: { ...cloneNetwork(group), status: 'active', created_by: ownerId, owner_user_id: ownerId, can_manage: !!group.joined, can_transfer: canTransfer, can_dissolve: canTransfer }, members, total: members.length, can_manage: !!group.joined, can_transfer: canTransfer, can_dissolve: canTransfer }
  },
  updateMemberRole(groupId, userId, role) {
    const result = this.manageGroup(groupId)
    const member = result?.members?.find((item) => item.id === userId)
    if (member) member.role = role
    return member || null
  },
  removeMember(groupId, userId) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    if (group) {
      group.members = (group.members || []).filter((item) => item.id !== userId)
      syncMockNetworkCounts(group)
      return { removed: true, user_id: userId, group_id: groupId, group: cloneNetwork(group) }
    }
    return { removed: true, user_id: userId, group_id: groupId }
  },
  transferOwnership(groupId, userId) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const result = this.manageGroup(groupId)
    if (!group || !result?.group.can_transfer) throw new Error('只有群主可以转移社群')
    const target = result.members.find((member) => member.id === userId && member.status === 'active')
    if (!target) throw new Error('新的群主必须是当前社群成员')
    const ownerId = group.owner_id || group.created_by || mockCurrentUserId
    group.owner_id = userId
    group.created_by = userId
    group.admin_ids = [...new Set([...(group.admin_ids || []), ownerId])].filter((id) => id !== userId)
    const updated = this.manageGroup(groupId)
    return { transferred: true, previous_owner: ownerId, next_owner: userId, group: updated.group, members: updated.members }
  },
  dissolveGroup(groupId, reason = '群主主动解散') {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const result = this.manageGroup(groupId)
    if (!group || !result?.group.can_dissolve) throw new Error('只有群主可以解散社群')
    group.status = 'closed'
    group.close_reason = String(reason || '群主主动解散').slice(0, 200)
    group.closed_at = new Date().toISOString()
    group.joined = false
    group.member_count = 0
    return { dissolved: true, reason: group.close_reason, group: cloneNetwork({ ...group, status: 'closed', can_manage: false, can_transfer: false, can_dissolve: false }) }
  },
  groupMessages(id) {
    const group = networkGroupsData.find((item) => item.id === id)
    if (!group || !group.joined) return { group: group ? cloneNetwork(group) : null, list: [], total: 0 }
    if (!mockGroupMessages[id]) mockGroupMessages[id] = [{ id: `mock_group_message_${id}`, _id: `mock_group_message_${id}`, content: '欢迎来到社群，先介绍一下你的方向吧。', sender: networkPeopleData[1], is_mine: false, created_at: new Date(Date.now() - 3600000).toISOString() }]
    return { group: cloneNetwork(group), list: cloneNetwork(decorateMockGroupMessages(mockGroupMessages[id])), total: mockGroupMessages[id].length }
  },
  groupMessagesPoll(id, after = '', afterId = '') {
    const result = this.groupMessages(id)
    const separator = String(after || '').lastIndexOf('|')
    const afterTime = separator > 0 ? String(after).slice(0, separator) : String(after || '')
    const compositeId = separator > 0 ? Number.parseInt(String(after).slice(separator + 1), 10) : Number.parseInt(String(afterId), 10)
    const hasNumericCursor = Number.isSafeInteger(compositeId) && compositeId >= 0
    const list = (result.list || []).filter((item) => {
      if (!after) return false
      return hasNumericCursor
        ? item.created_at > afterTime || (item.created_at === afterTime && Number(item.cursor_id) > compositeId)
        : item.created_at > afterTime || (item.created_at === afterTime && String(item.id) > String(afterId || ''))
    })
    const last = list[list.length - 1]
    return {
      list: cloneNetwork(list),
      cursor: last?.cursor || after,
      cursor_id: last?.cursor_id || (hasNumericCursor ? String(compositeId) : afterId),
      timed_out: !list.length
    }
  },
  sendGroupMessage(id, content, clientMessageId = '') {
    if (!mockGroupMessages[id]) this.groupMessages(id)
    if (!Array.isArray(mockGroupMessages[id])) mockGroupMessages[id] = []
    const retryKey = String(clientMessageId || '').trim()
    const existing = retryKey
      ? mockGroupMessages[id].find((message) => message.client_message_id === retryKey)
      : null
    if (existing) {
      const replay = decorateMockGroupMessages(mockGroupMessages[id]).find((message) => message.id === existing.id)
      return { ...cloneNetwork(replay || existing), idempotent: true }
    }
    const item = { id: uid(), _id: '', content, client_message_id: retryKey, sender: { ...networkPeopleData[0], nickname: '演示用户', id: mockCurrentUserId }, is_mine: true, created_at: new Date().toISOString() }
    item._id = item.id
    mockGroupMessages[id].push(item)
    return cloneNetwork(decorateMockGroupMessages(mockGroupMessages[id]).at(-1))
  },
  createGroup(data = {}) {
    const id = uid()
    const group = { _id: id, id, name: data.name || '新社群', short_name: data.name || '新社群', type: data.group_type || 'community', group_type: data.group_type || 'community', description: data.description || '', city: data.city || '', industry: data.industry || '', cover_color: data.cover_color || '#5968D8', join_mode: data.join_mode || 'open', status: 'active', created_by: mockCurrentUserId, owner_id: mockCurrentUserId, member_count: 0, activity_count: 0, joined: true, can_manage: true, can_transfer: false, can_dissolve: true, branches: [], posts: [], events: [], members: [mockCurrentMember()] }
    syncMockNetworkCounts(group)
    networkGroupsData.unshift(group)
    return cloneNetwork(group)
  },
  updateGroup(id, data = {}) {
    const group = networkGroupsData.find((item) => item.id === id)
    if (!group) return null
    Object.assign(group, data)
    return cloneNetwork(group)
  },
  createBranch(groupId, data = {}) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    if (!group) return null
    const branch = { id: uid(), name: data.name || '新分会', city: data.city || '', intro: data.intro || '', member_count: 0 }
    group.branches = [...(group.branches || []), branch]
    return cloneNetwork(branch)
  },
  updateBranch(groupId, branchId, data = {}) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const branch = group?.branches?.find((item) => item.id === branchId)
    if (!branch) return null
    Object.assign(branch, data)
    return cloneNetwork(branch)
  },
  deleteBranch(groupId, branchId) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    if (group) group.branches = (group.branches || []).filter((item) => item.id !== branchId)
    return { deleted: true, branch_id: branchId }
  },
  events(id) {
    const group = networkGroupsData.find((item) => item.id === id)
    if (!group) return { group: null, list: [], total: 0 }
    const list = ensureMockEvents(group).map((event) => mockEventVO(event, group))
    return { group: { id: group.id, name: group.name }, list, total: list.length }
  },
  createEvent(groupId, data = {}) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    if (!group) return null
    const now = new Date().toISOString()
    const event = {
      id: uid(), _id: '', title: data.title || '新活动', intro: data.intro || '',
      starts_at: data.starts_at || new Date(Date.now() + 7 * 86400000).toISOString(),
      location: data.location || '线上', capacity: Number(data.capacity) || 0,
      status: 'upcoming', recap: '', recap_published_at: '', checkins: {}, signup_count: 0, signed_up: false, created_at: now, updated_at: now
    }
    event._id = event.id
    ensureMockEvents(group).unshift(event)
    group.activity_count = Number(group.activity_count || 0) + 1
    return mockEventVO(event, group)
  },
  updateEvent(groupId, eventId, data = {}) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const event = ensureMockEvents(group).find((item) => (item.id || item._id) === eventId)
    if (!event) return null
    Object.assign(event, data, { updated_at: new Date().toISOString() })
    if (data.capacity !== undefined) event.capacity = Number(data.capacity) || 0
    return mockEventVO(event, group)
  },
  signupEvent(groupId, eventId) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const event = ensureMockEvents(group).find((item) => (item.id || item._id) === eventId)
    if (!event || !group?.joined) return null
    const capacity = Number(event.capacity || 0)
    if (!event.signed_up && capacity > 0 && Number(event.signup_count || 0) >= capacity) {
      if (!event.waitlisted) {
        event.waitlisted = true
        event.waitlist_count = Number(event.waitlist_count || 0) + 1
        event.waitlist_position = event.waitlist_count
      }
      return mockEventVO(event, group)
    }
    if (!event.signed_up) { event.signed_up = true; event.signup_count = Number(event.signup_count || 0) + 1 }
    event.waitlisted = false
    event.waitlist_position = 0
    return mockEventVO(event, group)
  },
  cancelEventSignup(groupId, eventId) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const event = ensureMockEvents(group).find((item) => (item.id || item._id) === eventId)
    if (!event) return null
    if (event.waitlisted && !event.signed_up) {
      event.waitlisted = false
      event.waitlist_count = Math.max(0, Number(event.waitlist_count || 0) - 1)
      event.waitlist_position = 0
      return { ...mockEventVO(event, group), signed_up: false, waitlisted: false, event_id: event.id }
    }
    if (event.signed_up) { event.signed_up = false; event.signup_count = Math.max(0, Number(event.signup_count || 0) - 1) }
    return { ...mockEventVO(event, group), signed_up: false, event_id: event.id }
  },
  eventSignups(groupId, eventId) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const event = ensureMockEvents(group).find((item) => (item.id || item._id) === eventId)
    if (!event) return { event: null, list: [], total: 0 }
    const list = (group.members || []).slice(0, Math.min(Number(event.signup_count || 0), 8)).map((member, index) => ({
      id: `mock_signup_${event.id}_${member.id}`, user_id: member.id, nickname: member.nickname,
      company: member.company, checked_in: !!event.checkins?.[member.id], created_at: new Date(Date.now() - index * 3600000).toISOString(), user: cloneNetwork(member)
    }))
    return { event: { id: event.id, title: event.title, status: event.status, recap: event.recap || '' }, list, total: Number(event.signup_count || list.length), checkin_count: list.filter((item) => item.checked_in).length, waitlist: [], waitlist_count: Number(event.waitlist_count || 0) }
  },
  updateEventCheckin(groupId, eventId, userId, checkedIn = true, note = '') {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const event = ensureMockEvents(group).find((item) => (item.id || item._id) === eventId)
    if (!event) throw new Error('活动不存在')
    event.checkins ||= {}
    if (checkedIn) event.checkins[userId] = true
    else delete event.checkins[userId]
    return { event_id: event.id, user_id: userId, checked_in: !!checkedIn, note: String(note || '').slice(0, 200), checkin_count: Object.values(event.checkins).filter(Boolean).length }
  },
  updateEventRecap(groupId, eventId, recap) {
    const group = networkGroupsData.find((item) => item.id === groupId)
    const event = ensureMockEvents(group).find((item) => (item.id || item._id) === eventId)
    if (!event) throw new Error('活动不存在')
    if (event.status !== 'finished') throw new Error('活动结束后才能提交复盘')
    event.recap = String(recap || '').trim().slice(0, 1000)
    event.recap_published_at = new Date().toISOString()
    return mockEventVO(event, group)
  },
  applications(id) { return { list: [], total: 0, status: 'pending', group_id: id } },
  reviewApplication(groupId, memberId, status) { return { member_id: memberId, group_id: groupId, status } }
}

// ========== 合作生态 Mock ==========
export const cooperationService = {
  catalog(params = {}) {
    return cooperationSnapshot(params)
  }
}

const mockReports = []
const mockAppeals = []
const mockBlocks = []
export const governanceService = {
  reports() { return { list: cloneNetwork(mockReports), total: mockReports.length } },
  report(data = {}) {
    const id = uid()
    const item = { _id: id, id, ...data, status: 'pending', decision: 'pending', created_at: new Date().toISOString() }
    mockReports.unshift(item)
    return cloneNetwork(item)
  },
  appeals() { return { list: cloneNetwork(mockAppeals), total: mockAppeals.length } },
  appeal(data = {}) {
    const id = uid()
    const item = { _id: id, id, ...data, status: 'pending', decision: 'pending', created_at: new Date().toISOString() }
    mockAppeals.unshift(item)
    return cloneNetwork(item)
  },
  blocks() { return { list: mockBlocks.map((userId) => ({ _id: `mock_block_${userId}`, user_id: userId, target_user_id: userId, user: mockPerson(userId) })), total: mockBlocks.length } },
  block(userId) { if (!mockBlocks.includes(userId)) mockBlocks.push(userId); return { blocked: true, user_id: userId } },
  unblock(userId) { const index = mockBlocks.indexOf(userId); if (index >= 0) mockBlocks.splice(index, 1); return { blocked: false, user_id: userId } },
  mute(data = {}) { return { muted: true, ...data } },
  unmute(targetType, targetId) { return { muted: false, target_type: targetType, target_id: targetId } }
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
  // Agent 匹配：按分类、地区、关键词、预算和服务质量解释性打分
  matchProviders(demand) {
    if (!demand) return []
    let list = [...providersData]

    list = list.map(p => {
      const match = scoreProviderMatch(p, demand)
      return {
        ...p,
        match_score: match.score,
        match_percent: match.score + '%',
        match_reasons: match.reasons,
        match_breakdown: match.breakdown
      }
    })

    list.sort((a, b) => b.match_score - a.match_score)
    return list.slice(0, 5)
  }
}

function buildMockAgentMatches(result = {}) {
  const teams = providersData
    .map((provider, index) => {
      const match = scoreProviderMatch(provider, result)
      return {
        ...provider,
        match_score: match.score,
        match_percent: `${match.score}%`,
        match_reasons: match.reasons,
        match_breakdown: match.breakdown,
        // Mock 下第一个团队可以直接走已有的演示私聊，其余团队仍可查看主页。
        contact_user_id: index === 0 ? 'demo_provider_001' : '',
        contact_user_name: provider.name,
        contact_ready: index === 0
      }
    })
    .filter((item) => item.match_score >= (result.category_id ? 35 : 12)
      && (!result.category_id || item.category_id === result.category_id))
    .sort((left, right) => right.match_score - left.match_score)
    .slice(0, 6)

  const demands = demandData
    .filter((item) => item.status === 'published')
    .map((demand) => {
      const match = scoreDemandMatch(demand, result)
      return {
        ...publicDemand(demand),
        match_score: match.score,
        match_percent: `${match.score}%`,
        match_reasons: match.reasons,
        match_breakdown: match.breakdown
      }
    })
    .filter((item) => item.match_score >= (result.category_id ? 35 : 12)
      && (!result.category_id || item.category_id === result.category_id))
    .sort((left, right) => right.match_score - left.match_score)
    .slice(0, 6)

  return { teams, demands }
}

// ========== Agent 需求整理 Mock ==========
// Mock 模式下保持同一份前端契约，方便没有服务端或模型额度时继续演示完整交互。
export const agentService = {
  organize(payload = {}) {
    const text = String(payload.text || '').trim()
    if (!text) return null

    const category = detectCategory(text)
    const region = detectRegion(text)
    const budget = detectBudget(text)
    const startTime = detectStartTime(text)
    const tags = [category, text.includes('长期') ? '长期合作' : '项目合作', '资源对接']
    const missing = []
    if (budget === '未指定') missing.push('预算范围')
    if (startTime === '未指定') missing.push('启动时间')
    if (region === '未指定') missing.push('服务地区')

    const categoryId = getMockAgentCategoryId(category)
    const explicitRecommendation = /找|寻找|推荐|匹配|对接|联系/.test(text)
    const hasConstraint = region !== '未指定' || budget !== '未指定' || startTime !== '未指定'
    const recommendationReady = Boolean(categoryId && (explicitRecommendation || hasConstraint))
    const result = {
      summary: `寻找${category}合作伙伴${region === '未指定' ? '' : `（${region}）`}`,
      intent: '资源对接',
      category,
      category_id: categoryId,
      region,
      budget,
      start_time: startTime,
      tags: tags.slice(0, 5),
      missing: missing.slice(0, 4),
      questions: missing.slice(0, 3).map((item) => `请补充${item}？`),
      keywords: [category, ...text.split(/[，。！？、\s]+/).filter(Boolean).slice(0, 5)],
      confidence: 0.78,
      interaction_intent: explicitRecommendation ? 'recommendation_request' : 'requirement',
      intent_confidence: 0.78,
      conversation_stage: recommendationReady ? 'recommending' : 'clarifying',
      recommendation_ready: recommendationReady,
      recommendation_reason: recommendationReady ? `按${category}，结合当前条件排序推荐。` : '信息还不够，我会先追问关键条件，再给你推荐。',
      next_action: recommendationReady ? '查看推荐团队' : '补充项目地区或预算',
      schema_version: 1,
      source: 'mock'
    }
    return { ...result, matches: buildMockAgentMatches(result) }
  },
  chat(payload = {}) {
    const text = String(payload.text || '').trim()
    const history = Array.isArray(payload.history) ? payload.history : []
    const context = history.map((item) => String(item?.content || '').trim()).filter(Boolean).join(' ')
    const result = this.organize({ text: [context, text].filter(Boolean).join(' ') })
    if (!result) return null
    const missing = result.missing || []
    const turn = history.filter((item) => item?.role === 'user').length + 1
    const changed = /预算|地区|城市|时间|启动|交付|内容|要求|规模|人数/.test(text)
    return {
      ...result,
      reply: missing.length
        ? (turn > 1 && changed
          ? `收到，我已经把这轮补充合并进需求了。再补充${missing.slice(0, 2).join('、')}，匹配会更准。`
          : `我先把已知信息整理好了。再补充${missing.slice(0, 2).join('、')}，后面匹配会更准。`)
        : (turn > 1 ? '这轮补充已经合并进当前需求了。你可以继续聊交付细节，也可以先看看匹配到的团队。' : '这版信息已经比较完整，我整理好了。你可以先检查一下，再带入发布页。'),
      turn,
      conversation_complete: missing.length === 0
    }
  },
  feedback(payload = {}) {
    const item = {
      id: uid(),
      target_type: payload.target_type || payload.targetType || '',
      target_id: payload.target_id || payload.targetId || '',
      action: payload.action || '',
      context: payload.context || {},
      created_at: new Date().toISOString()
    }
    agentFeedbackData.push(item)
    return item
  },
  telemetry(payload = {}) {
    const item = {
      id: uid(),
      event_type: payload.event_type || payload.eventType || '',
      session_id: payload.session_id || payload.sessionId || '',
      created_at: new Date().toISOString()
    }
    agentTelemetryData.push(item)
    return { saved: true, event: item }
  }
}

function detectCategory(text) {
  if (/内容|运营|短视频|小红书|直播|达人/.test(text)) return '内容运营'
  if (/设计|品牌|视觉|VI|logo|标识/i.test(text)) return '品牌设计'
  if (/活动|展会|发布会|线下/.test(text)) return '活动策划'
  if (/融资|投资|基金|资本|路演/.test(text)) return '资本对接'
  if (/芯片|半导体|集成电路/.test(text)) return '半导体与芯片'
  if (/医药|医疗|健康|临床/.test(text)) return '医药与健康'
  if (/制造|工厂|产线|设备/.test(text)) return '先进制造'
  if (/量子/.test(text)) return '量子科技'
  if (/航天|卫星|低空/.test(text)) return '商业航天'
  if (/开发|小程序|软件|系统|技术|网站/.test(text)) return '技术开发'
  if (/供应链|采购|生产|工厂/.test(text)) return '供应链服务'
  return '综合服务'
}

function getMockAgentCategoryId(category) {
  if (category === '内容运营') return 'cat_06'
  if (category === '品牌设计') return 'cat_01'
  if (category === '活动策划') return 'cat_09'
  if (category === '资本对接') return 'cat_11'
  if (category === '半导体与芯片') return 'cat_12'
  if (category === '医药与健康') return 'cat_14'
  if (category === '先进制造') return 'cat_15'
  if (category === '量子科技') return 'cat_16'
  if (category === '商业航天') return 'cat_17'
  if (category === '技术开发') return 'cat_03'
  if (category === '供应链服务') return 'cat_10'
  return ''
}

function detectRegion(text) {
  const match = text.match(/全国|北京|上海|广州|深圳|杭州|成都|南京|武汉|苏州|重庆|西安|厦门/)
  return match?.[0] || '未指定'
}

function detectBudget(text) {
  const match = text.match(/(?:预算|费用|报价|投入)?\s*(\d+(?:\.\d+)?)\s*(万(?:元)?|w|元)/i)
  return match ? `${match[1]}${match[2]}` : '未指定'
}

function detectStartTime(text) {
  const match = text.match(/本月|下月|下周|近期|尽快|月底|年内|\d+月(?:份)?(?:开始)?/)
  return match?.[0] || '未指定'
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
const hotKeywords = ['寻找投资人', '渠道合作', '供应链资源', '联合研发', '产业落地', '医药健康', '先进制造', '商业航天']
export const searchService = {
  hotKeywords() { return hotKeywords },
  history() {
    try { return JSON.parse(uni.getStorageSync(STORAGE_KEYS.SEARCH_HISTORY) || '[]') } catch { return [] }
  },
  addHistory(keyword) {
    if (!keyword || !keyword.trim()) return
    const list = this.history().filter(k => k !== keyword)
    list.unshift(keyword)
    uni.setStorageSync(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(list.slice(0, 10)))
  },
  clearHistory() { uni.removeStorageSync(STORAGE_KEYS.SEARCH_HISTORY) },
  _saved() {
    try { return JSON.parse(uni.getStorageSync(STORAGE_KEYS.SAVED_SEARCHES) || '[]') } catch { return [] }
  },
  _matches(search, after = '') {
    let list = demandData.filter((item) => {
      if (item.status !== 'published') return false
      const keyword = String(search.keyword || '').trim().toLowerCase()
      if (keyword && !`${item.title} ${item.company_name} ${item.description}`.toLowerCase().includes(keyword)) return false
      if (search.category_id && item.category_id !== search.category_id) return false
      if (search.region && search.region !== '全国' && item.region !== search.region) return false
      if (search.quote_type && item.quote_type !== search.quote_type) return false
      if (after && new Date(item.publish_time || 0) <= new Date(after)) return false
      return true
    })
    if (search.sort === 'hot') list = list.sort((a, b) => Number(b.view_count || 0) - Number(a.view_count || 0))
    else if (search.sort === 'lead') list = list.sort((a, b) => Number(b.lead_count || 0) - Number(a.lead_count || 0))
    else list = list.sort((a, b) => new Date(b.publish_time || 0) - new Date(a.publish_time || 0))
    return list
  },
  saved() {
    return this._saved().map((item) => ({
      ...item,
      _id: item.id,
      alert_enabled: item.alert_enabled !== false,
      new_count: item.last_checked_at ? this._matches(item, item.last_checked_at).length : this._matches(item).length
    }))
  },
  save(data = {}) {
    const keyword = String(data.keyword || '').trim()
    const categoryId = String(data.category_id || '').trim()
    const region = String(data.region || '').trim() === '全国' ? '' : String(data.region || '').trim()
    const quoteType = String(data.quote_type || '').trim()
    if (!keyword && !categoryId && !region && !quoteType) throw new Error('至少选择一个关键词或筛选条件后再保存')
    const list = this._saved()
    const existing = list.find((item) => item.keyword === keyword && item.category_id === categoryId && item.region === region && item.quote_type === quoteType)
    const now = new Date().toISOString()
    const next = {
      id: existing?.id || uid(),
      name: String(data.name || [keyword, categoryId, region || '全国', quoteType].filter(Boolean).join(' · ') || '我的需求筛选').slice(0, 40),
      keyword,
      category_id: categoryId,
      region,
      quote_type: quoteType,
      sort: ['latest', 'hot', 'lead'].includes(data.sort) ? data.sort : 'latest',
      alert_enabled: data.alert_enabled !== false,
      last_checked_at: existing?.last_checked_at || '',
      created_at: existing?.created_at || now,
      updated_at: now
    }
    const nextList = existing ? list.map((item) => item.id === existing.id ? next : item) : [next, ...list]
    uni.setStorageSync(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(nextList.slice(0, 20)))
    return { ...next, _id: next.id, new_count: next.last_checked_at ? this._matches(next, next.last_checked_at).length : this._matches(next).length }
  },
  checkSaved(id) {
    const list = this._saved()
    const saved = list.find((item) => item.id === id)
    if (!saved) throw new Error('保存的筛选不存在')
    const matches = this._matches(saved)
    const newMatches = saved.last_checked_at ? this._matches(saved, saved.last_checked_at) : matches
    const checkedAt = new Date().toISOString()
    const updated = { ...saved, last_checked_at: checkedAt, updated_at: checkedAt }
    uni.setStorageSync(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(list.map((item) => item.id === id ? updated : item)))
    return { search: { ...updated, _id: updated.id, alert_enabled: updated.alert_enabled !== false, new_count: 0 }, list: matches.slice(0, 50), new_list: newMatches.slice(0, 50), total: matches.length, new_count: newMatches.length, checked_at: checkedAt }
  },
  removeSaved(id) {
    uni.setStorageSync(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(this._saved().filter((item) => item.id !== id)))
    return { deleted: true, id }
  },
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
  _key: STORAGE_KEYS.VERIFY,
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
const memberTiers = MEMBER_LEVELS.map(tier => ({ ...tier, price: ({ free: 0, pro: 29900, enterprise: 99900 })[tier.id], period: tier.id === 'free' ? '永久' : '年' }))
export const memberService = {
  tiers() { return memberTiers },
  current() {
    try {
      const info = JSON.parse(uni.getStorageSync(STORAGE_KEYS.MEMBER) || 'null')
      return { ...getMembership(info || {}), levels: MEMBER_LEVELS, upgrade_available: false }
    } catch { return { ...getMembership(), levels: MEMBER_LEVELS, upgrade_available: false } }
  },
  subscribe(tierId) {
    const tier = memberTiers.find(t => t.id === tierId)
    if (!tier) return null
    const info = { tier: tierId, name: tier.name, expire: '2027-06-16', subscribed_at: new Date().toISOString() }
    uni.setStorageSync(STORAGE_KEYS.MEMBER, JSON.stringify(info))
    return info
  }
}

// ========== 客服IM Mock ==========
const seedMessages = [
  { id: 'm1', from: 'service', content: '您好，欢迎来到媒合智联 MediaMatch，我是您的专属客服，有什么可以帮您？', time: '10:00' },
  { id: 'm2', from: 'user', content: '我想了解一下专业版会员的权益', time: '10:02' },
  { id: 'm3', from: 'service', content: '专业版年费299元，包含无限发布需求、优先推荐、数据看板等6大权益，现在开通还赠送100积分哦～', time: '10:03' }
]
function mockCustomerReply(content) {
  const text = String(content || '').trim()
  if (/会员|专业版|权益|套餐|订阅|开通/.test(text)) return { intent: 'member', reply: '会员主要覆盖需求发布、服务方推荐和对接记录。你更关心权益还是开通方式？', actions: [{ label: '查看会员方案', type: 'navigate', url: '/pages/member/index' }], suggestions: ['专业版和普通账号有什么区别？', '我想开通会员'] }
  if (/发布需求|找服务|找团队|项目对接|合作需求/.test(text)) return { intent: 'demand', reply: '把项目目标、预算、地区、时间和交付内容写清楚，发布后就能在“我的需求”里跟进申请和对接进度。', actions: [{ label: '去发布需求', type: 'navigate', url: '/pages/demand/publish' }], suggestions: ['预算还没定，可以先发布吗？', '发布后怎么找团队？'] }
  if (/订单|付款|支付|购买|发票|退款|售后/.test(text)) return { intent: 'order', reply: '订单问题需要结合当前状态判断。你可以先打开“我的订单”，如果是支付失败或退款，请把订单号和提示发给我。', actions: [{ label: '查看我的订单', type: 'navigate', url: '/pages/order/index' }], suggestions: ['支付失败怎么办？', '我想申请退款'] }
  if (/资料|报告|模板|下载|资源库|知识库|文件/.test(text)) return { intent: 'resource', reply: '打开资料详情后，可以看到是否免费、是否已购买和下载权限。免费资料可直接下载；付费资料需要先购买。', actions: [{ label: '打开资料库', type: 'navigate', url: '/pages/resource/list' }], suggestions: ['资料下载提示 401', '有没有活动策划模板？'] }
  if (/登录|注册|密码|验证码|手机号|邮箱|账号/.test(text)) return { intent: 'account', reply: '忘记密码可以在登录页用绑定的手机号或邮箱验证码重置；验证码收不到时，先确认联系方式和垃圾短信/邮件。', actions: [{ label: '打开登录页', type: 'navigate', url: '/pages/user/login' }], suggestions: ['收不到验证码怎么办？', '我想修改登录密码'] }
  if (/人脉|社群|分会|好友|认识新朋友|群聊|关注/.test(text)) return { intent: 'network', reply: '可以在“人脉圈”里按城市和方向找人，也可以加入社群和分会。建立联系后，再进入私聊沟通项目。', actions: [{ label: '打开人脉圈', type: 'navigate', url: '/pages/network/index' }], suggestions: ['怎么加好友？', '怎么加入社群？'] }
  if (/你好|您好|嗨|在吗|hello|hi/i.test(text)) return { intent: 'greeting', reply: '你好，我可以帮你查会员、发布需求、订单资料、账号和人脉社群。你直接说遇到什么，我会给出下一步。', actions: [], suggestions: ['怎么发布需求？', '会员有什么权益？', '资料怎么下载？'] }
  return { intent: 'clarify', reply: text ? `我先记下你说的“${text.length > 30 ? `${text.slice(0, 30)}…` : text}”。这是发布需求、对接团队、订单资料，还是账号登录时遇到的问题？` : '你可以直接说遇到的事情，我会按具体场景帮你处理。', actions: [], suggestions: ['我想发布需求', '我在找服务团队', '我遇到账号问题'] }
}
export const chatService = {
  _key: STORAGE_KEYS.CHAT,
  _getList() {
    try { const list = JSON.parse(uni.getStorageSync(this._key) || 'null'); return list || seedMessages.map(m => ({ ...m })) } catch { return seedMessages.map(m => ({ ...m })) }
  },
  list() { return this._getList() },
  send(content, _history = [], attachments = []) {
    const list = this._getList()
    const now = new Date()
    const msg = { id: uid(), from: 'user', content, attachments: Array.isArray(attachments) ? attachments : [], time: now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') }
    list.push(msg)
    const result = mockCustomerReply(content)
    list.push({ id: uid(), from: 'service', content: result.reply, time: now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') })
    uni.setStorageSync(this._key, JSON.stringify(list))
    return { ...result, messages: list }
  },
  // 兼容旧页面调用：按最近一条用户消息生成答复，而不是随机插入套话。
  reply() {
    const list = this._getList()
    const now = new Date()
    const latest = [...list].reverse().find((item) => item.from === 'user')
    const result = mockCustomerReply(latest?.content || '')
    const msg = { id: uid(), from: 'service', content: result.reply, time: now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') }
    list.push(msg)
    uni.setStorageSync(this._key, JSON.stringify(list))
    return { ...result, messages: list }
  }
}

// ========== 活动营销 Mock ==========
const campaignData = [
  { id: 'c1', title: '新用户项目服务权益', desc: '完成资料后可领取首次合作优惠', cover: '/static/icons/gift.svg', tag: '限时', color: '#B5A07A', end: '3天后', type: 'coupon' },
  { id: 'c2', title: '专业版年度权益', desc: '项目发布、匹配与跟进能力一次开通', cover: '/static/icons/star.svg', tag: '推荐', color: '#69574A', end: '5天后', type: 'member' },
  { id: 'c3', title: '邀请合作伙伴加入', desc: '把长期合作伙伴带进同一个项目网络', cover: '/static/icons/users.svg', tag: '长期', color: '#41463C', end: '长期有效', type: 'invite' },
  { id: 'c4', title: '完善并发布首条需求', desc: '把目标和关键条件补齐，开始寻找合作方', cover: '/static/icons/edit.svg', tag: '任务', color: '#D97757', end: '15天后', type: 'task' },
  { id: 'c5', title: '优质服务团队计划', desc: '按响应、交付与评价综合展示团队', cover: '/static/icons/handshake.svg', tag: '长期', color: '#5C2828', end: '持续开放', type: 'rank' },
  { id: 'c6', title: '产业合作主题周', desc: '集中发现资金、渠道、供应链与技术合作机会', cover: '/static/icons/dashboard.svg', tag: '专题', color: '#69574A', end: '7天后', type: 'discount' }
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
  intake: intakeService,
  demand: demandService,
  lead: leadService,
  product: productService,
  order: orderService,
  resource: resourceService,
  banner: bannerService,
  category: categoryService,
  admin: adminService,
  favorite: favoriteService,
  community: communityService,
  review: reviewService,
  match: matchService,
  agent: agentService,
  network: networkService,
  governance: governanceService,
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
  campaign: campaignService,
  cooperation: cooperationService
}

export default mockService
