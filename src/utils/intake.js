/**
 * 内测资料前端契约。
 * 服务端仍会再次校验，这里只负责统一表单选项、默认值和即时提示。
 */

export const INTAKE_OPTIONS = Object.freeze({
  institutionTypes: [
    { value: 'bank', label: '银行' },
    { value: 'fund', label: '基金' },
    { value: 'securities', label: '券商' },
    { value: 'fa', label: 'FA / 财务顾问' },
    { value: 'industrial_capital', label: '产业资本' },
    { value: 'other', label: '其他机构' }
  ],
  industries: [
    { value: 'ai', label: '人工智能' },
    { value: 'semiconductor', label: '半导体与芯片' },
    { value: 'advanced_manufacturing', label: '先进制造' },
    { value: 'healthcare', label: '医疗健康' },
    { value: 'consumer', label: '消费与品牌' },
    { value: 'enterprise_service', label: '企业服务' },
    { value: 'energy', label: '新能源与低碳' },
    { value: 'automotive', label: '汽车与出行' },
    { value: 'culture_sports', label: '文体与生活方式' },
    { value: 'other', label: '其他行业' }
  ],
  revenueRanges: [
    { value: 'undisclosed', label: '暂不披露' },
    { value: 'none', label: '尚未产生收入' },
    { value: 'lt_1m', label: '100 万以下' },
    { value: '1m_10m', label: '100 万—1000 万' },
    { value: '10m_50m', label: '1000 万—5000 万' },
    { value: '50m_100m', label: '5000 万—1 亿' },
    { value: 'gte_100m', label: '1 亿以上' }
  ],
  projectStages: [
    { value: 'idea', label: '想法 / 筹备' },
    { value: 'validating', label: '验证中' },
    { value: 'growth', label: '增长期' },
    { value: 'expansion', label: '扩张期' },
    { value: 'mature', label: '成熟运营' }
  ],
  financingAmountRanges: [
    { value: 'lt_1m', label: '100 万以下' },
    { value: '1m_5m', label: '100 万—500 万' },
    { value: '5m_20m', label: '500 万—2000 万' },
    { value: '20m_100m', label: '2000 万—1 亿' },
    { value: 'gte_100m', label: '1 亿以上' },
    { value: 'negotiable', label: '面议 / 待评估' }
  ],
  investmentStages: [
    { value: 'angel', label: '天使轮' },
    { value: 'early', label: '早期' },
    { value: 'growth', label: '成长期' },
    { value: 'pre_ipo', label: 'Pre-IPO' },
    { value: 'secondary', label: '二级市场' },
    { value: 'ma', label: '并购整合' }
  ],
  capitalRanges: [
    { value: 'lt_10m', label: '1000 万以下' },
    { value: '10m_50m', label: '1000 万—5000 万' },
    { value: '50m_200m', label: '5000 万—2 亿' },
    { value: '200m_1b', label: '2 亿—10 亿' },
    { value: 'gte_1b', label: '10 亿以上' }
  ],
  ticketRanges: [
    { value: 'lt_1m', label: '100 万以下' },
    { value: '1m_10m', label: '100 万—1000 万' },
    { value: '10m_50m', label: '1000 万—5000 万' },
    { value: 'gte_50m', label: '5000 万以上' }
  ],
  investmentPlanPeriods: [
    { value: 'quarter', label: '本季度' },
    { value: 'year', label: '今年' }
  ],
  investmentPlanRanges: [
    { value: 'undisclosed', label: '暂不披露' },
    { value: 'lt_10m', label: '1000 万以下' },
    { value: '10m_50m', label: '1000 万—5000 万' },
    { value: '50m_200m', label: '5000 万—2 亿' },
    { value: '200m_1b', label: '2 亿—10 亿' },
    { value: 'gte_1b', label: '10 亿以上' }
  ],
  investmentDirections: [
    { value: 'industry_incubation', label: '产业孵化' },
    { value: 'primary_market', label: '一级市场' },
    { value: 'secondary_market', label: '二级市场' },
    { value: 'ma', label: '并购整合' },
    { value: 'fund_of_funds', label: '母基金 / 基金合作' }
  ],
  circles: [
    { value: 'finance_club', label: '金融俱乐部' },
    { value: 'listed_club', label: '上市俱乐部' },
    { value: 'golf_club', label: '高尔夫俱乐部' },
    { value: 'yacht_club', label: '游艇俱乐部' },
    { value: 'business_association', label: '商会 / 协会' },
    { value: 'community', label: '行业社群' },
    { value: 'park', label: '园区合作' },
    { value: 'offline_venue', label: '线下场地' }
  ],
  displayScopes: [
    { value: 'operations', label: '仅平台运营筛选', desc: '不对外展示联系方式和详细资料' },
    { value: 'members', label: '对审核通过的成员展示', desc: '仅展示经过授权的摘要信息' },
    { value: 'public', label: '允许公开展示', desc: '仅展示你明确授权的字段' }
  ]
})

export const ROLE_OPTIONS = Object.freeze([
  { value: 'capital', label: '甲方 / 资金方', desc: '银行、基金、券商、FA 或产业资本，寻找投资与合作机会。' },
  { value: 'project', label: '乙方 / 项目企业', desc: '企业或创业项目，寻找融资、渠道、资源或业务合作。' }
])

// 注册邀请码奖励只负责展示选择；最终可发放的类型和数值仍由服务端校验。
export const REFERRAL_REWARD_OPTIONS = Object.freeze([
  { value: 'trial_uses', label: '内测体验次数', reward_value: 3, display: '内测体验 3 次', desc: '可用于平台内测功能' },
  { value: 'coupon', label: '无门槛代金券', reward_value: 2000, display: '无门槛代金券 ¥20', desc: '可用于平台服务' },
  { value: 'vip_days', label: 'VIP 体验天数', reward_value: 7, display: 'VIP 7 天', desc: '开通专业版体验权益' }
])

export const REFERRAL_RULES = Object.freeze({
  code_generated_after: 'intake_submitted',
  link_target: 'account_register',
  reward_trigger: 'registration_success',
  same_reward_for_both: false,
  inviter_reward_selection: 'invite_owner',
  invitee_reward_selection: 'during_registration',
  max_bindings_per_invitee: 1,
  self_referral_allowed: false,
  reward_options_are_server_authoritative: true,
  registration_relation_survives_intake_draft: true
})

export const STATUS_LABELS = Object.freeze({
  draft: '草稿',
  submitted: '待审核',
  reviewing: '审核中',
  needs_more: '待补充',
  approved: '已通过',
  rejected: '需重新整理'
})

export const ROLE_LABELS = Object.freeze({ project: '乙方 / 项目企业', capital: '甲方 / 资金方' })

export function emptyIntakeForm(role = '') {
  return {
    role,
    contact_name: '',
    contact_title: '',
    contact_phone: '',
    contact_wechat: '',
    company_name: '',
    city: '',
    registered_location: '',
    credential_no: '',
    institution_type: '',
    target_cities: [],
    primary_industry: '',
    industry_tags: [],
    business_scope: '',
    business_intro: '',
    annual_revenue_range: '',
    project_stage: '',
    financing_amount_range: '',
    financing_purpose: '',
    acceptable_terms: '',
    expected_funding_time: '',
    financial_materials: '',
    business_plan_materials: '',
    capital_size_range: '',
    investment_ticket_range: '',
    investment_plan_period: '',
    investment_plan_range: '',
    investment_directions: [],
    investment_stages: [],
    cost_preference: '',
    qualification_materials: '',
    case_materials: '',
    circle_ids: [],
    circle_details: {},
    cooperation_intent: '',
    target_companies: [],
    background_consent: false,
    matching_opt_in: false,
    display_consent: false,
    display_scope: 'operations'
  }
}

export function cloneIntake(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

/** 清除身份切换后不再可见的另一身份字段，避免草稿携带过期资料。 */
export function pruneRoleSpecificFields(input = {}) {
  const result = cloneIntake(input) || {}
  if (result.role === 'project') {
    result.institution_type = ''
    result.capital_size_range = ''
    result.investment_ticket_range = ''
    result.investment_plan_period = ''
    result.investment_plan_range = ''
    result.investment_directions = []
    result.investment_stages = []
    result.cost_preference = ''
    result.qualification_materials = ''
    result.case_materials = ''
  } else if (result.role === 'capital') {
    result.annual_revenue_range = ''
    result.project_stage = ''
    result.financing_amount_range = ''
    result.financing_purpose = ''
    result.acceptable_terms = ''
    result.expected_funding_time = ''
    result.financial_materials = ''
    result.business_plan_materials = ''
    result.target_companies = []
  }
  return result
}

/**
 * 保存请求进行期间出现了新编辑时，只为仍处于草稿阶段的资料安排下一轮保存。
 * sentFingerprint 用来区分“同一次失败”与“请求期间产生的新版本”，避免失败后无限重试。
 */
export function shouldQueueDraftSave({ sentFingerprint = '', currentFingerprint = '', lastSavedFingerprint = '', status = '' } = {}) {
  return Boolean(
    currentFingerprint && currentFingerprint !== sentFingerprint && currentFingerprint !== lastSavedFingerprint &&
    (!status || status === 'draft')
  )
}

export function optionLabel(group, value) {
  return INTAKE_OPTIONS[group]?.find((item) => item.value === value)?.label || value || ''
}

export function frontValidate(form) {
  if (!form.role) return '请选择你的身份'
  if (!String(form.contact_name || '').trim()) return '请填写联系人姓名'
  if (!String(form.contact_title || '').trim()) return '请填写联系人职位'
  if (!String(form.company_name || '').trim()) return '请填写对接企业或机构'
  if (!form.background_consent) return '请先确认同意基础背调'
  if (form.circle_ids?.length) {
    const selectedDetails = form.circle_ids.map((id) => form.circle_details?.[id])
    if (!selectedDetails.some((item) => item && [item.city, item.count, item.note].some((value) => String(value || '').trim()))) return '请选择社群后补充至少一项圈层信息'
  }
  return ''
}

/**
 * 邀请链接代表新的填写关系；同一设备已有其他公开会话时，必须先丢弃旧会话。
 * 草稿没有邀请码，也不能被带到新的邀请链接里。
 */
export function shouldResetPublicIntakeSession(referralCode, profile, invite) {
  const requestedCode = String(referralCode || '').trim().toUpperCase()
  if (!requestedCode || !profile) return false
  const currentCode = String(
    invite?.code || invite?.invite_code || profile?.invite?.code || profile?.invite?.invite_code || ''
  ).trim().toUpperCase()
  return currentCode !== requestedCode
}

export function derivePoolTags(form) {
  const tags = [
    form.role,
    form.primary_industry && `industry:${form.primary_industry}`,
    form.city && `city:${form.city}`,
    ...(form.target_cities || []).map((city) => `target_city:${city}`),
    form.role === 'project' && form.annual_revenue_range && `revenue:${form.annual_revenue_range}`,
    form.role === 'project' && form.project_stage && `stage:${form.project_stage}`,
    form.role === 'project' && form.financing_amount_range && `financing:${form.financing_amount_range}`,
    form.role === 'capital' && form.institution_type && `institution:${form.institution_type}`,
    form.role === 'capital' && form.capital_size_range && `capital_size:${form.capital_size_range}`,
    form.role === 'capital' && form.investment_ticket_range && `ticket:${form.investment_ticket_range}`,
    form.role === 'capital' && form.investment_plan_period && `plan_period:${form.investment_plan_period}`,
    form.role === 'capital' && form.investment_plan_range && `plan:${form.investment_plan_range}`,
    form.matching_opt_in && 'match:yes',
    ...(form.circle_ids || []).map((item) => `circle:${item}`),
    ...(form.investment_directions || []).map((item) => `direction:${item}`),
    ...(form.investment_stages || []).map((item) => `investment_stage:${item}`)
  ]
  return [...new Set(tags.filter(Boolean))]
}

export function poolLabel(value) {
  const [prefix, raw] = String(value || '').split(':')
  const labels = {
    project: '乙方项目池',
    capital: '甲方资金池',
    industry: '行业',
    city: '城市',
    target_city: '期待交流城市',
    revenue: '年流水',
    stage: '阶段',
    financing: '融资金额',
    institution: '机构类型',
    capital_size: '资金规模',
    ticket: '单笔投资',
    plan_period: '统计口径',
    plan: '计划投入',
    match: '匹配意愿',
    circle: '圈层',
    direction: '方向',
    investment_stage: '投资阶段'
  }
  if (!raw) return labels[prefix] || prefix
  const group = prefix === 'industry' ? 'industries'
    : prefix === 'revenue' ? 'revenueRanges'
      : prefix === 'stage' ? 'projectStages'
          : prefix === 'financing' ? 'financingAmountRanges'
            : prefix === 'institution' ? 'institutionTypes'
              : prefix === 'capital_size' ? 'capitalRanges'
          : prefix === 'ticket' ? 'ticketRanges'
            : prefix === 'plan_period' ? 'investmentPlanPeriods'
              : prefix === 'plan' ? 'investmentPlanRanges'
                : prefix === 'direction' ? 'investmentDirections'
              : prefix === 'investment_stage' ? 'investmentStages'
              : prefix === 'circle' ? 'circles'
                : ''
  return `${labels[prefix] || prefix} · ${optionLabel(group, raw) || raw}`
}
