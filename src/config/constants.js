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
  { id: 'cat_01', name: '品牌公关', icon: '📢' },
  { id: 'cat_02', name: '直播带货', icon: '📺' },
  { id: 'cat_03', name: '企业服务', icon: '🏢' },
  { id: 'cat_04', name: '线上媒体', icon: '📱' },
  { id: 'cat_05', name: '线下媒体', icon: '📰' },
  { id: 'cat_06', name: '代运营', icon: '🔧' },
  { id: 'cat_07', name: '达人种草', icon: '🌟' },
  { id: 'cat_08', name: '视频制作', icon: '🎬' },
  { id: 'cat_09', name: '活动策划', icon: '🎉' },
  { id: 'cat_10', name: '渠道资源', icon: '🤝' }
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
