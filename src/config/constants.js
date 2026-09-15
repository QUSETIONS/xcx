// 分页配置
export const PAGE_SIZE = 10
export const PAGE_SIZES = [10, 20, 50]

// 报价方式
export const QUOTE_TYPES = [
  { value: 'self', label: '自报价' },
  { value: 'negotiate', label: '面议' },
  { value: 'by_daren', label: '看达人' }
]

// 需求状态
export const DEMAND_STATUS = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  offline: '已下架'
}

// 订单状态
export const ORDER_STATUS = {
  created: '待确认',
  paid: '已支付',
  confirmed: '已确认',
  serving: '服务中',
  completed: '已完成',
  cancelled: '已取消'
}

// 对接状态
export const LEAD_STATUS = {
  new: '新对接',
  contacted: '已联系',
  deal: '已成交',
  invalid: '无效'
}

// 需求分类
export const DEMAND_CATEGORIES = [
  { id: 'cat_01', name: '品牌公关', icon: '/static/icons/cat/cat_01.svg' },
  { id: 'cat_02', name: '直播与电商', icon: '/static/icons/cat/cat_02.svg' },
  { id: 'cat_03', name: '企业服务', icon: '/static/icons/cat/cat_03.svg' },
  { id: 'cat_04', name: '数字渠道', icon: '/static/icons/cat/cat_04.svg' },
  { id: 'cat_05', name: '线下渠道', icon: '/static/icons/cat/cat_05.svg' },
  { id: 'cat_06', name: '运营服务', icon: '/static/icons/cat/cat_06.svg' },
  { id: 'cat_07', name: '创作者合作', icon: '/static/icons/cat/cat_07.svg' },
  { id: 'cat_08', name: '视频制作', icon: '/static/icons/cat/cat_08.svg' },
  { id: 'cat_09', name: '活动会展', icon: '/static/icons/cat/cat_09.svg' },
  { id: 'cat_10', name: '渠道资源', icon: '/static/icons/cat/cat_10.svg' },
  { id: 'cat_11', name: '投融资与资本', icon: '/static/icons/cat/cat_11.svg' },
  { id: 'cat_12', name: '半导体与芯片', icon: '/static/icons/cat/cat_12.svg' },
  { id: 'cat_13', name: '通信与连接', icon: '/static/icons/cat/cat_13.svg' },
  { id: 'cat_14', name: '医药与健康', icon: '/static/icons/cat/cat_14.svg' },
  { id: 'cat_15', name: '先进制造', icon: '/static/icons/cat/cat_15.svg' },
  { id: 'cat_16', name: '量子科技', icon: '/static/icons/cat/cat_16.svg' },
  { id: 'cat_17', name: '商业航天', icon: '/static/icons/cat/cat_17.svg' }
]

// 服务类型
export const SERVICE_TYPES = {
  member: '会员服务',
  linker: '链接官',
  survey: '调研卡',
  resource_pack: '资源包',
  certification: '认证服务'
}

// 地区列表
export const REGIONS = ['全国', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安', '苏州', '天津', '长沙', '郑州']

// ========== 统一本地存储 Key ==========
// 所有 uni.setStorageSync / getStorageSync 的 key 集中管理，避免散落字符串
export const STORAGE_KEYS = {
  // 账户与认证
  TOKEN: 'qiye_ku_token',
  USER: 'qiye_ku_user',
  NICKNAME: 'qiye_ku_nickname',
  VERIFY: 'qiye_ku_verify',
  MEMBER: 'qiye_ku_member',
  // 业务
  CART: 'qiye_ku_cart',
  FAVORITES: 'qiye_ku_favorites',
  NOTIFY: 'qiye_ku_notify',
  CHAT: 'qiye_ku_chat',
  // 智能与搜索
  BROWSE_HISTORY: 'browse_history',
  USER_PREFERENCE: 'user_preference',
  SEARCH_HISTORY: 'search_history',
  SAVED_SEARCHES: 'saved_searches',
  // 偏好设置
  LOCALE: 'qiye_ku_locale',
  FONT_SCALE: 'qiye_ku_font_scale',
  CONTRAST: 'qiye_ku_contrast',
  // 草稿与缓存
  DEMAND_DRAFT: 'demand_draft',
  AGENT_DRAFT: 'agent_draft',
  AGENT_CONVERSATION: 'agent_conversation',
  AGENT_SESSION: 'agent_session',
  LAST_DEMAND_CONTACT: 'last_demand_contact',
  LAST_ORDER_CONTACT: 'last_order_contact'
}

// ========== 主题色板 ==========
export const THEME = {
  primary: '#FF6B35',
  primaryLight: '#FF9A5C',
  // 分类/图表配色
  palette: ['#FF6B35', '#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
  // 语义色
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  // 头像渐变
  avatarGradients: [
    'linear-gradient(135deg, #FF6B35, #FF9A5C)',
    'linear-gradient(135deg, #6366F1, #8B5CF6)',
    'linear-gradient(135deg, #10B981, #34D399)',
    'linear-gradient(135deg, #EC4899, #F472B6)',
    'linear-gradient(135deg, #3B82F6, #60A5FA)'
  ]
}
