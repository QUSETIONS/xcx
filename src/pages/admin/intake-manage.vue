<template>
  <view class="page">
    <view class="header">
      <view><text class="eyebrow">OPERATIONS / INTAKE</text><text class="title">甲乙方资料审核</text><text class="subtitle">按融资身份、行业、城市和基础门槛整理资金方与项目企业</text></view>
      <text class="refresh" @tap="load">刷新</text>
    </view>

    <view class="stats-strip">
      <view class="stat"><text class="stat-num">{{ stats.total || 0 }}</text><text class="stat-label">已收资料</text></view>
      <view class="stat"><text class="stat-num accent">{{ stats.pending || 0 }}</text><text class="stat-label">待处理</text></view>
      <view class="stat"><text class="stat-num">{{ stats.by_role?.project || 0 }}</text><text class="stat-label">乙方项目</text></view>
      <view class="stat"><text class="stat-num">{{ stats.by_role?.capital || 0 }}</text><text class="stat-label">甲方资金</text></view>
    </view>
    <view class="referral-summary">邀请注册 {{ stats.referrals?.total || 0 }} 人 · 已发放权益 {{ stats.referrals?.rewards_granted || 0 }} 份</view>

    <view class="filters">
      <view class="filter-line"><text v-for="item in roleFilters" :key="item.value" class="filter-chip" :class="{ active: roleFilter === item.value }" @tap="changeRole(item.value)">{{ item.label }}</text></view>
      <view class="filter-line"><text v-for="item in statusFilters" :key="item.value" class="filter-chip" :class="{ active: statusFilter === item.value }" @tap="changeStatus(item.value)">{{ item.label }}</text></view>
      <view class="search-row"><input v-model="keyword" class="search-input" maxlength="80" placeholder="搜索企业、机构、负责人或业务" confirm-type="search" @confirm="load" /><text v-if="keyword" class="clear" @tap="keyword = ''; load()">×</text><text class="search-button" @tap="load">查找</text></view>
      <view class="advanced-toggle" @tap="advancedOpen = !advancedOpen"><text>{{ advancedOpen ? '收起更多筛选' : '更多筛选' }}</text><text v-if="activeFilterCount()" class="advanced-count">{{ activeFilterCount() }} 项</text><text>{{ advancedOpen ? '↑' : '↓' }}</text></view>
      <view v-if="advancedOpen" class="advanced-panel">
        <view class="advanced-input-row"><text class="advanced-label">所在城市</text><input v-model="cityFilter" class="advanced-input" maxlength="40" placeholder="输入城市后查找" confirm-type="search" @confirm="load" /><text v-if="cityFilter" class="advanced-clear" @tap="cityFilter = ''; load()">清除</text></view>
        <text class="advanced-label">行业</text>
        <view class="filter-line"><text v-for="item in industryFilters" :key="`industry-${item.value}`" class="filter-chip" :class="{ active: industryFilter === item.value }" @tap="changeAdvancedFilter('industry', item.value)">{{ item.label }}</text></view>
        <text class="advanced-label">项目方年流水</text>
        <view class="filter-line"><text v-for="item in revenueFilters" :key="`revenue-${item.value}`" class="filter-chip" :class="{ active: revenueFilter === item.value }" @tap="changeAdvancedFilter('revenue', item.value)">{{ item.label }}</text></view>
        <text class="advanced-label">乙方融资金额</text>
        <view class="filter-line"><text v-for="item in financingFilters" :key="`financing-${item.value}`" class="filter-chip" :class="{ active: financingFilter === item.value }" @tap="changeAdvancedFilter('financing', item.value)">{{ item.label }}</text></view>
        <text class="advanced-label">资金方规模</text>
        <view class="filter-line"><text v-for="item in capitalFilters" :key="`capital-${item.value}`" class="filter-chip" :class="{ active: capitalFilter === item.value }" @tap="changeAdvancedFilter('capital', item.value)">{{ item.label }}</text></view>
        <text class="advanced-label">甲方机构类型</text>
        <view class="filter-line"><text v-for="item in institutionFilters" :key="`institution-${item.value}`" class="filter-chip" :class="{ active: institutionFilter === item.value }" @tap="changeAdvancedFilter('institution', item.value)">{{ item.label }}</text></view>
        <text class="advanced-label">偏好投资阶段</text>
        <view class="filter-line"><text v-for="item in investmentStageFilters" :key="`investment-stage-${item.value}`" class="filter-chip" :class="{ active: investmentStageFilter === item.value }" @tap="changeAdvancedFilter('investmentStage', item.value)">{{ item.label }}</text></view>
        <text class="advanced-label">投资方向</text>
        <view class="filter-line"><text v-for="item in directionFilters" :key="`direction-${item.value}`" class="filter-chip" :class="{ active: directionFilter === item.value }" @tap="changeAdvancedFilter('direction', item.value)">{{ item.label }}</text></view>
        <text class="advanced-label">圈层</text>
        <view class="filter-line"><text v-for="item in circleFilters" :key="`circle-${item.value}`" class="filter-chip" :class="{ active: circleFilter === item.value }" @tap="changeAdvancedFilter('circle', item.value)">{{ item.label }}</text></view>
      </view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading" class="state">正在读取资料队列…</view>
      <view v-else-if="errorMessage" class="state error" @tap="load">{{ errorMessage }}，点此重试</view>
      <template v-else>
        <view v-for="item in list" :key="item._id || item.id" class="intake-card" @tap="openDetail(item)">
          <view class="card-head"><view><text class="company-name">{{ item.company_name || '未填写名称' }}</text><text class="contact-line">{{ item.contact_name || '未填写负责人' }} · {{ item.contact_title || '未填写职位' }}</text></view><text class="status" :class="`status-${item.status}`">{{ statusLabel(item.status) }}</text></view>
          <view class="meta-row"><text>{{ roleLabel(item.role) }}</text><text>{{ item.city || '未填写城市' }}</text><text>{{ industryLabel(item.primary_industry) || '未选行业' }}</text></view>
          <view class="tag-row"><text v-for="tag in (item.pool_tags || []).slice(0, 4)" :key="tag" class="pool-tag">{{ poolLabel(tag) }}</text></view>
          <text class="intro">{{ item.business_intro || item.business_scope || '暂未填写业务介绍' }}</text>
          <view class="card-foot"><text>{{ item.target_count || 0 }} 家目标企业 · {{ item.referral_count || 0 }} 位邀请填写</text><text>{{ formatDate(item.updated_at || item.created_at) }}</text></view>
          <view class="card-actions" @tap.stop><text v-if="item.status === 'submitted'" class="action neutral" @tap="review(item, 'reviewing')">开始审核</text><text v-if="['submitted', 'reviewing', 'needs_more', 'rejected'].includes(item.status)" class="action approve" @tap="review(item, 'approved')">通过</text><text v-if="['submitted', 'reviewing'].includes(item.status)" class="action warn" @tap="openNeedsMore(item)">需补充</text><text class="action detail-action" @tap="openDetail(item)">查看详情</text></view>
        </view>
        <view v-if="!list.length" class="empty">当前筛选下没有资料</view>
      </template>
    </scroll-view>

    <view v-if="detail" class="modal-mask" @tap="closeDetail"><view class="detail-sheet" @tap.stop><view class="sheet-head"><view><text class="sheet-kicker">INTAKE DETAIL</text><text class="sheet-title">{{ detail.company_name }}</text></view><text class="sheet-close" @tap="closeDetail">关闭</text></view><view class="detail-status"><text>{{ roleLabel(detail.role) }}</text><text class="status" :class="`status-${detail.status}`">{{ statusLabel(detail.status) }}</text><text>{{ detail.city || '未填写所在城市' }}</text></view>
      <view v-if="detail.target_cities?.length" class="detail-section"><text class="detail-label">期待交流城市</text><text class="detail-value">{{ detail.target_cities.join('、') }}</text></view>
      <view class="detail-section"><text class="detail-label">负责人</text><text class="detail-value">{{ detail.contact_name }} · {{ detail.contact_title }}<text v-if="detail.contact_phone"> · {{ detail.contact_phone }}</text><text v-if="detail.contact_wechat"> · 微信 {{ detail.contact_wechat }}</text><text v-if="!detail.contact_phone && detail.user?.phone"> · {{ detail.user.phone }}</text></text></view>
      <view class="detail-section"><text class="detail-label">主体核验</text><text class="detail-value">{{ detail.registered_location || '未填写注册地 / 经营地' }}</text><text class="detail-copy">{{ detail.credential_no ? `核验信息：${detail.credential_no}` : '未填写统一社会信用代码或核验信息' }}</text></view>
      <view class="detail-section"><text class="detail-label">行业与业务</text><text class="detail-value">{{ industryLabel(detail.primary_industry) || '未选行业' }} · {{ detail.business_scope || '未填写业务范围' }}</text><text class="detail-copy">{{ detail.business_intro || '未填写介绍' }}</text></view>
      <view v-if="detail.role === 'project'" class="detail-section"><text class="detail-label">乙方融资资料</text><text class="detail-value">{{ stageLabel(detail.project_stage) || '未填写阶段' }} · 年流水 {{ revenueLabel(detail.annual_revenue_range) || '未披露' }} · 融资 {{ financingLabel(detail.financing_amount_range) || '未填写' }}</text><text class="detail-copy">用途：{{ detail.financing_purpose || '未填写' }}</text><text class="detail-copy">条件：{{ detail.acceptable_terms || '未填写' }} · 到款时间：{{ detail.expected_funding_time || '未填写' }}</text><text class="detail-copy">财务材料：{{ detail.financial_materials || '未提供' }}</text><text class="detail-copy">商业计划书：{{ detail.business_plan_materials || '未提供' }}</text></view>
      <view v-else class="detail-section"><text class="detail-label">甲方资金资料</text><text class="detail-value">{{ institutionTypeLabel(detail.institution_type) || '未选机构类型' }} · 规模 {{ capitalLabel(detail.capital_size_range) || '未披露' }} · 单笔 {{ ticketLabel(detail.investment_ticket_range) || '未披露' }}</text><text class="detail-copy">投资阶段：{{ (detail.investment_stages || []).map(investmentStageLabel).join('、') || '未填写' }}</text><text class="detail-copy">投资方向：{{ (detail.investment_directions || []).map(directionLabel).join('、') || '未填写' }}</text><text class="detail-copy">计划投入：{{ planPeriodLabel(detail.investment_plan_period) || '未选择口径' }} · {{ planRangeLabel(detail.investment_plan_range) || '未披露' }}</text><text class="detail-copy">成本偏好：{{ detail.cost_preference || '未填写' }}</text><text class="detail-copy">资质材料：{{ detail.qualification_materials || '未提供' }}</text><text class="detail-copy">历史案例：{{ detail.case_materials || '未提供' }}</text></view>
      <view v-if="detail.target_companies?.length" class="detail-section"><text class="detail-label">想交流的企业</text><view v-for="target in detail.target_companies" :key="target._id || target.id" class="target-line"><text class="target-name">{{ target.company_name }}</text><text class="target-note">{{ target.industry ? `${target.industry} · ` : '' }}{{ target.intent || '交流合作' }}{{ target.note ? ` · ${target.note}` : '' }}</text></view></view>
      <view v-if="detail.cooperation_intent" class="detail-section"><text class="detail-label">合作意向</text><text class="detail-copy">{{ detail.cooperation_intent }}</text></view>
      <view v-if="detail.circle_ids?.length" class="detail-section"><text class="detail-label">圈层与资源</text><view v-for="circleId in detail.circle_ids" :key="circleId" class="target-line"><text class="target-name">{{ circleLabel(circleId) }}</text><text class="target-note">{{ detail.circle_details?.[circleId]?.city || '未填写城市' }} · {{ detail.circle_details?.[circleId]?.count || '未填写数量' }}<text v-if="detail.circle_details?.[circleId]?.note"> · {{ detail.circle_details[circleId].note }}</text></text></view></view>
      <view class="detail-section"><text class="detail-label">授权记录</text><text class="detail-copy">基础背调：{{ detail.background_consent ? '已同意' : '未同意' }}；平台匹配：{{ detail.matching_opt_in ? '已申请' : '未申请' }}；资料展示：{{ detail.display_consent ? scopeLabel(detail.display_scope) : '仅内部运营筛选' }}</text></view>
      <view v-if="detail.pool_tags?.length" class="detail-section"><text class="detail-label">筛选池</text><view class="tag-row"><text v-for="tag in detail.pool_tags" :key="tag" class="pool-tag">{{ poolLabel(tag) }}</text></view></view><view class="sheet-actions" @tap.stop><text v-if="['submitted', 'reviewing'].includes(detail.status)" class="action warn" @tap="openNeedsMore(detail)">要求补充</text><text v-if="['submitted', 'reviewing', 'needs_more', 'rejected'].includes(detail.status)" class="action approve" @tap="review(detail, 'approved')">通过审核</text></view></view></view>
    <view v-if="reviewing" class="modal-mask review-mask" @tap="closeReview"><view class="review-dialog" @tap.stop><text class="sheet-kicker">REVIEW NOTE</text><text class="sheet-title">要求补充资料</text><text class="review-desc">请写清楚需要补充的字段，用户会在内测资料页看到。</text><textarea v-model="reviewNote" class="review-input" maxlength="500" placeholder="例如：请补充企业公开信息、项目阶段和目标企业备注。" /><view class="dialog-actions"><text class="cancel" @tap="closeReview">取消</text><text class="confirm" @tap="submitReview">{{ saving ? '提交中…' : '发送补充说明' }}</text></view></view></view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { formatDate } from '@/utils/util'
import { INTAKE_OPTIONS, STATUS_LABELS, poolLabel } from '@/utils/intake'

useNavTitle('titles.intakeManage', '甲乙方资料审核')

const roleFilters = [{ value: '', label: '全部身份' }, { value: 'capital', label: '甲方 / 资金方' }, { value: 'project', label: '乙方 / 项目企业' }]
const statusFilters = [{ value: '', label: '全部状态' }, { value: 'submitted', label: '待审核' }, { value: 'reviewing', label: '审核中' }, { value: 'needs_more', label: '待补充' }, { value: 'approved', label: '已通过' }, { value: 'rejected', label: '需重填' }]
const roleFilter = ref('')
const statusFilter = ref('')
const keyword = ref('')
const advancedOpen = ref(false)
const cityFilter = ref('')
const industryFilter = ref('')
const revenueFilter = ref('')
const financingFilter = ref('')
const capitalFilter = ref('')
const institutionFilter = ref('')
const investmentStageFilter = ref('')
const directionFilter = ref('')
const circleFilter = ref('')
const list = ref([])
const stats = ref({})
const detail = ref(null)
const reviewing = ref(null)
const reviewNote = ref('')
const reviewStatus = ref('needs_more')
const loading = ref(false)
const refreshing = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const statusLabel = (value) => STATUS_LABELS[value] || value || ''
const roleLabel = (value) => ({ project: '乙方 / 项目企业', capital: '甲方 / 资金方' }[value] || value || '')
const option = (group, value) => INTAKE_OPTIONS[group]?.find((item) => item.value === value)?.label || value || ''
const industryLabel = (value) => option('industries', value)
const revenueLabel = (value) => option('revenueRanges', value)
const stageLabel = (value) => option('projectStages', value)
const financingLabel = (value) => option('financingAmountRanges', value)
const institutionTypeLabel = (value) => option('institutionTypes', value)
const investmentStageLabel = (value) => option('investmentStages', value)
const capitalLabel = (value) => option('capitalRanges', value)
const ticketLabel = (value) => option('ticketRanges', value)
const planPeriodLabel = (value) => option('investmentPlanPeriods', value)
const planRangeLabel = (value) => option('investmentPlanRanges', value)
const directionLabel = (value) => option('investmentDirections', value)
const circleLabel = (value) => option('circles', value)
const scopeLabel = (value) => option('displayScopes', value)
const industryFilters = [{ value: '', label: '全部行业' }, ...INTAKE_OPTIONS.industries]
const revenueFilters = [{ value: '', label: '全部年流水' }, ...INTAKE_OPTIONS.revenueRanges]
const financingFilters = [{ value: '', label: '全部融资金额' }, ...INTAKE_OPTIONS.financingAmountRanges]
const capitalFilters = [{ value: '', label: '全部资金规模' }, ...INTAKE_OPTIONS.capitalRanges]
const institutionFilters = [{ value: '', label: '全部机构类型' }, ...INTAKE_OPTIONS.institutionTypes]
const investmentStageFilters = [{ value: '', label: '全部投资阶段' }, ...INTAKE_OPTIONS.investmentStages]
const directionFilters = [{ value: '', label: '全部方向' }, ...INTAKE_OPTIONS.investmentDirections]
const circleFilters = [{ value: '', label: '全部圈层' }, ...INTAKE_OPTIONS.circles]

function activeFilterCount() { return [cityFilter.value, industryFilter.value, revenueFilter.value, financingFilter.value, capitalFilter.value, institutionFilter.value, investmentStageFilter.value, directionFilter.value, circleFilter.value].filter(Boolean).length }

async function load() {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const [result, summary] = await Promise.all([
      bridge.admin.intakes.list({
        role: roleFilter.value || undefined,
        status: statusFilter.value || undefined,
        keyword: keyword.value.trim() || undefined,
        city: cityFilter.value.trim() || undefined,
        primary_industry: industryFilter.value || undefined,
        annual_revenue_range: revenueFilter.value || undefined,
        financing_amount_range: financingFilter.value || undefined,
        capital_size_range: capitalFilter.value || undefined,
        institution_type: institutionFilter.value || undefined,
        investment_stage: investmentStageFilter.value || undefined,
        investment_direction: directionFilter.value || undefined,
        pool: circleFilter.value ? `circle:${circleFilter.value}` : undefined,
        page: 1,
        pageSize: 100
      }),
      bridge.admin.intakes.stats()
    ])
    list.value = result?.list || []
    stats.value = summary || {}
  } catch (error) {
    errorMessage.value = error?.message || '资料队列加载失败'
  } finally { loading.value = false }
}

async function onRefresh() { refreshing.value = true; await load(); refreshing.value = false }
async function changeRole(value) { roleFilter.value = value; await load() }
async function changeStatus(value) { statusFilter.value = value; await load() }
async function changeAdvancedFilter(field, value) {
  if (field === 'industry') industryFilter.value = value
  if (field === 'revenue') revenueFilter.value = value
  if (field === 'financing') financingFilter.value = value
  if (field === 'capital') capitalFilter.value = value
  if (field === 'institution') institutionFilter.value = value
  if (field === 'investmentStage') investmentStageFilter.value = value
  if (field === 'direction') directionFilter.value = value
  if (field === 'circle') circleFilter.value = value
  await load()
}

async function openDetail(item) {
  try { detail.value = await bridge.admin.intakes.detail(item._id || item.id) } catch (error) { uni.showToast({ title: error?.message || '详情加载失败', icon: 'none' }) }
}
function closeDetail() { detail.value = null }

function openNeedsMore(item) {
  reviewing.value = item
  reviewStatus.value = 'needs_more'
  reviewNote.value = ''
}

function closeReview() { if (saving.value) return; reviewing.value = null; reviewNote.value = '' }

function review(item, status) {
  if (status === 'needs_more') return openNeedsMore(item)
  uni.showModal({ title: status === 'approved' ? '通过内测资料' : '开始审核', content: status === 'approved' ? `确认通过「${item.company_name || '该资料'}」吗？` : '将资料标记为审核中，确认吗？', success: ({ confirm }) => { if (confirm) submitDirectReview(item, status) } })
}

async function submitDirectReview(item, status) {
  if (saving.value) return
  saving.value = true
  try { await bridge.admin.intakes.review(item._id || item.id, status, status === 'reviewing' ? '运营已开始核对资料。' : '资料完整，已通过基础审核。'); closeDetail(); uni.showToast({ title: status === 'approved' ? '已通过审核' : '已进入审核', icon: 'success' }); await load() } catch (error) { uni.showToast({ title: error?.message || '状态更新失败', icon: 'none' }) } finally { saving.value = false }
}

async function submitReview() {
  if (!reviewing.value || saving.value) return
  if (!reviewNote.value.trim()) { uni.showToast({ title: '请填写补充说明', icon: 'none' }); return }
  saving.value = true
  try { await bridge.admin.intakes.review(reviewing.value._id || reviewing.value.id, reviewStatus.value, reviewNote.value.trim()); closeReview(); closeDetail(); uni.showToast({ title: '已发送补充说明', icon: 'success' }); await load() } catch (error) { uni.showToast({ title: error?.message || '状态更新失败', icon: 'none' }) } finally { saving.value = false }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; padding: 26rpx 30rpx 80rpx; box-sizing: border-box; overflow: hidden; color: #29251f; background: #f7f6f2; }
/* #ifdef H5 */.page { height: calc(100vh - 44px); }/* #endif */
.header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 22rpx; border-bottom: 1rpx solid rgba(30,27,22,.12); }.eyebrow, .sheet-kicker { display: block; color: #a1978b; font-family: ui-monospace, Menlo, monospace; font-size: 14rpx; letter-spacing: .13em; }.title { display: block; margin-top: 15rpx; color: #25211c; font-family: 'Songti SC', STSong, serif; font-size: 37rpx; font-weight: 400; }.subtitle { display: block; margin-top: 7rpx; color: #91897e; font-size: 18rpx; }.refresh { padding: 7rpx 0; border-bottom: 1rpx solid #5c2828; color: #5c2828; font-size: 18rpx; }
.stats-strip { display: flex; margin: 20rpx 0 8rpx; border-top: 1rpx solid rgba(30,27,22,.09); border-bottom: 1rpx solid rgba(30,27,22,.09); }.stat { flex: 1; min-width: 0; padding: 15rpx 5rpx; text-align: center; }.stat + .stat { border-left: 1rpx solid rgba(30,27,22,.09); }.stat-num, .stat-label { display: block; }.stat-num { color: #29251f; font-family: Georgia, serif; font-size: 28rpx; }.stat-num.accent { color: #5c2828; }.stat-label { margin-top: 5rpx; color: #a1988c; font-size: 17rpx; }.referral-summary { margin-bottom: 13rpx; color: #a1988c; font-size: 16rpx; }
.filters { padding-bottom: 15rpx; }.filter-line { display: flex; gap: 9rpx; margin-bottom: 9rpx; overflow-x: auto; white-space: nowrap; }.filter-chip { padding: 9rpx 12rpx; border: 1rpx solid #ddd5ca; color: #8b8175; background: #fcfaf5; font-size: 17rpx; }.filter-chip.active { border-color: #5c2828; color: #5c2828; background: #f0e5df; }.search-row { display: flex; align-items: center; padding: 4rpx 6rpx 4rpx 14rpx; border: 1rpx solid #ddd5ca; background: #fcfaf5; }.search-input { flex: 1; min-width: 0; height: 54rpx; color: #3f3931; font-size: 19rpx; }.clear { margin: 0 8rpx; color: #a69d91; font-size: 25rpx; }.search-button { padding: 10rpx 13rpx; color: #fff; background: #5c2828; font-size: 18rpx; }.advanced-toggle { display: flex; align-items: center; gap: 8rpx; margin-top: 12rpx; color: #5c2828; font-size: 17rpx; }.advanced-toggle > text:last-child { margin-left: auto; }.advanced-count { padding: 3rpx 7rpx; color: #8e5e30; background: #f6ead8; font-size: 15rpx; }.advanced-panel { margin-top: 11rpx; padding: 12rpx 13rpx 3rpx; border: 1rpx solid #e2d9cd; background: #f2eee7; }.advanced-label { display: block; margin: 3rpx 0 6rpx; color: #897e70; font-size: 16rpx; }.advanced-input-row { display: flex; align-items: center; gap: 8rpx; margin-bottom: 9rpx; }.advanced-input-row .advanced-label { flex: 0 0 auto; margin: 0; }.advanced-input { min-width: 0; flex: 1; height: 46rpx; padding: 0 10rpx; border: 1rpx solid #ddd5ca; color: #3f3931; background: #fcfaf5; font-size: 17rpx; }.advanced-clear { flex: 0 0 auto; color: #8d5f32; font-size: 16rpx; }
.list-scroll { flex: 1; min-height: 0; height: auto; }.intake-card { margin-bottom: 14rpx; padding: 18rpx; border: 1rpx solid #e4ddd2; background: #fcfaf5; }.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; }.company-name { display: block; color: #302b25; font-size: 25rpx; font-weight: 600; }.contact-line { display: block; margin-top: 6rpx; color: #948b80; font-size: 18rpx; }.status { display: inline-block; flex: 0 0 auto; padding: 6rpx 9rpx; font-size: 16rpx; }.status-submitted { color: #8e5e30; background: #f6ead8; }.status-reviewing { color: #5c2828; background: #f0e5df; }.status-needs_more, .status-rejected { color: #a56a32; background: #f6ead8; }.status-approved { color: #526153; background: #e9eee8; }.meta-row { display: flex; gap: 12rpx; margin-top: 15rpx; color: #71685d; font-size: 17rpx; }.meta-row text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.tag-row { display: flex; flex-wrap: wrap; gap: 7rpx; margin-top: 11rpx; }.pool-tag { padding: 5rpx 8rpx; color: #746654; background: #eee9e1; font-size: 16rpx; }.intro { display: block; margin-top: 12rpx; overflow: hidden; color: #82786d; font-size: 18rpx; line-height: 1.5; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }.card-foot { display: flex; justify-content: space-between; gap: 8rpx; margin-top: 14rpx; padding-top: 11rpx; border-top: 1rpx solid rgba(30,27,22,.08); color: #aaa095; font-size: 16rpx; }.card-actions, .sheet-actions { display: flex; justify-content: flex-end; gap: 8rpx; margin-top: 13rpx; }.action { padding: 8rpx 11rpx; font-size: 17rpx; }.action.neutral, .detail-action { color: #6f665b; background: #eeeae3; }.action.approve { color: #fff; background: #5c2828; }.action.warn { color: #8d5f32; background: #f4e8d8; }.state, .empty { padding: 80rpx 20rpx; color: #a1988c; font-size: 20rpx; text-align: center; }.error { color: #9a554d; }
.modal-mask { position: fixed; z-index: 30; inset: 0; display: flex; align-items: flex-end; justify-content: center; padding: 20rpx; background: rgba(37,32,26,.36); }.detail-sheet, .review-dialog { width: 100%; max-height: 88vh; padding: 24rpx 20rpx 28rpx; box-sizing: border-box; overflow-y: auto; background: #fcfaf5; }.detail-sheet { border-top: 4rpx solid #5c2828; }.sheet-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; }.sheet-title { display: block; margin-top: 10rpx; color: #302820; font-family: 'Songti SC', STSong, serif; font-size: 29rpx; }.sheet-close { color: #5c2828; font-size: 18rpx; }.detail-status { display: flex; gap: 10rpx; align-items: center; margin-top: 16rpx; color: #857b70; font-size: 17rpx; }.detail-section { margin-top: 19rpx; padding-top: 14rpx; border-top: 1rpx solid rgba(30,27,22,.1); }.detail-label { display: block; color: #9b9084; font-size: 17rpx; }.detail-value, .detail-copy { display: block; margin-top: 7rpx; color: #4b433a; font-size: 19rpx; line-height: 1.5; }.detail-copy { color: #81776b; }.target-line { margin-top: 10rpx; padding: 10rpx 12rpx; background: #f3eee7; }.target-name, .target-note { display: block; }.target-name { color: #5c2828; font-size: 19rpx; }.target-note { margin-top: 4rpx; color: #85796e; font-size: 17rpx; line-height: 1.45; }.review-dialog { padding-bottom: 24rpx; }.review-desc { display: block; margin-top: 14rpx; color: #81776b; font-size: 18rpx; line-height: 1.5; }.review-input { width: 100%; min-height: 170rpx; margin-top: 18rpx; padding: 13rpx; border: 1rpx solid #d9d0c4; box-sizing: border-box; color: #423a31; background: #f8f4ed; font-size: 20rpx; line-height: 1.5; }.dialog-actions { display: flex; justify-content: flex-end; gap: 10rpx; margin-top: 18rpx; }.cancel, .confirm { padding: 11rpx 16rpx; font-size: 19rpx; }.cancel { color: #8e8579; background: #eeeae3; }.confirm { color: #fff; background: #5c2828; }
@media (max-width: 420px) { .page { padding-right: 22rpx; padding-left: 22rpx; }.title { font-size: 33rpx; }.company-name { font-size: 23rpx; }.meta-row { gap: 7rpx; }.meta-row text { font-size: 16rpx; }.card-foot { font-size: 15rpx; } }
</style>
