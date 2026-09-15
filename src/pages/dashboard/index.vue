<template>
  <view class="page">
    <skeleton type="card" :rows="4" v-if="loadState === 'loading'" />
    <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
      <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
      <text>{{ t('common.loadFailed') }}</text>
      <text class="page-state-action">{{ t('common.retry') }}</text>
    </view>
    <block v-else>
    <!-- 概览卡片 -->
    <view class="overview-card">
      <text class="overview-title">{{ t('dashboard.overviewTitle') }}</text>
      <view class="overview-grid">
        <view class="ov-item">
          <text class="ov-num">{{ overview.total_views }}</text>
          <text class="ov-label">{{ t('dashboard.totalViews') }}</text>
          <text class="ov-trend" :class="trend.views.startsWith('+') ? 'up' : 'down'">{{ trend.views }}</text>
        </view>
        <view class="ov-item">
          <text class="ov-num">{{ overview.total_leads }}</text>
          <text class="ov-label">{{ t('dashboard.totalLeads') }}</text>
          <text class="ov-trend up">{{ trend.leads }}</text>
        </view>
        <view class="ov-item">
          <text class="ov-num">{{ overview.total_deals }}</text>
          <text class="ov-label">{{ t('dashboard.totalDeals') }}</text>
          <text class="ov-trend up">{{ trend.deals }}</text>
        </view>
        <view class="ov-item">
          <text class="ov-num">{{ overview.conversion_rate }}%</text>
          <text class="ov-label">{{ t('dashboard.conversionRate') }}</text>
        </view>
      </view>
    </view>

    <!-- 趋势图 -->
    <view class="chart-card">
      <view class="chart-header">
        <text class="chart-title">{{ t('dashboard.trendTitle') }}</text>
        <view class="chart-tabs">
          <text class="chart-tab" :class="{ active: period === 7 }" @tap="changePeriod(7)">{{ t('dashboard.days7') }}</text>
          <text class="chart-tab" :class="{ active: period === 30 }" @tap="changePeriod(30)">{{ t('dashboard.days30') }}</text>
        </view>
      </view>
      <!-- CSS柱状图 -->
      <view class="bar-chart">
        <view class="bar-col" v-for="(item, idx) in trendData" :key="idx">
          <view class="bar-wrap">
            <view class="bar bar-views" :style="{ height: getBarHeight(item.views) + 'rpx' }"></view>
          </view>
          <text class="bar-label" v-if="period === 7">{{ item.date }}</text>
          <text class="bar-label" v-else v-show="idx % 5 === 0">{{ item.date }}</text>
        </view>
      </view>
      <view class="chart-legend">
        <view class="legend-item"><view class="legend-dot dot-views"></view><text>{{ t('dashboard.viewsCount') }}</text></view>
        <view class="legend-item"><view class="legend-dot dot-leads"></view><text>{{ t('dashboard.leadsCount') }}</text></view>
      </view>
    </view>

    <!-- 分类分布 -->
    <view class="chart-card">
      <text class="chart-title">{{ t('dashboard.categoryTitle') }}</text>
      <view class="category-bars">
        <view class="cat-bar" v-for="(item, idx) in categoryStats" :key="idx">
          <view class="cat-bar-header">
            <text class="cat-bar-name">{{ item.name }}</text>
            <text class="cat-bar-count">{{ item.count }}{{ t('dashboard.countUnit') }}</text>
          </view>
          <view class="cat-bar-track">
            <view class="cat-bar-fill" :style="{ width: getCatWidth(item.count) + '%', background: item.color }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 核心指标 -->
    <view class="metrics-card">
      <text class="chart-title">{{ t('dashboard.metricsTitle') }}</text>
      <view class="metric-item">
        <text class="metric-label">{{ t('dashboard.avgResponse') }}</text>
        <text class="metric-value">{{ overview.avg_response_time }}</text>
      </view>
      <view class="metric-item">
        <text class="metric-label">{{ t('dashboard.totalRevenue') }}</text>
        <text class="metric-value">¥{{ (overview.total_revenue / 100).toFixed(0) }}</text>
      </view>
      <view class="metric-item">
        <text class="metric-label">{{ t('dashboard.creditScore') }}</text>
        <text class="metric-value credit">{{ credit.score }}{{ t('dashboard.scoreUnit') }}</text>
      </view>
    </view>

    <!-- 待办提醒 -->
    <view class="metrics-card">
      <text class="chart-title">{{ t('dashboard.todoTitle') }}</text>
      <view class="todo-item" @tap="goOrder">
        <view class="todo-icon todo-icon-order"><image src="/static/icons/package.svg" mode="aspectFit" /></view>
        <text class="todo-text">{{ t('dashboard.todoOrder') }}</text>
        <text class="todo-badge" v-if="overview.todo_orders">{{ overview.todo_orders }}</text>
        <text class="todo-arrow">›</text>
      </view>
      <view class="todo-item" @tap="goDeals">
        <view class="todo-icon todo-icon-lead"><image src="/static/icons/handshake.svg" mode="aspectFit" /></view>
        <text class="todo-text">{{ t('dashboard.todoLead') }}</text>
        <text class="todo-badge" v-if="overview.todo_leads">{{ overview.todo_leads }}</text>
        <text class="todo-arrow">›</text>
      </view>
      <view class="todo-item" @tap="goMessage">
        <view class="todo-icon todo-icon-message"><image src="/static/icons/chat.svg" mode="aspectFit" /></view>
        <text class="todo-text">{{ t('dashboard.todoMessage') }}</text>
        <text class="todo-badge" v-if="overview.todo_messages">{{ overview.todo_messages }}</text>
        <text class="todo-arrow">›</text>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
    </block>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.dashboard')

const userStore = useUserStore()

const overview = ref({ total_views: 0, total_leads: 0, total_deals: 0, conversion_rate: 0, avg_response_time: '-', total_revenue: 0, todo_orders: 0, todo_leads: 0, todo_messages: 0 })
const trendData = ref([])
const categoryStats = ref([])
const trend = ref({ views: '0%', leads: '0%', deals: '0%' })
const credit = ref({ score: 0 })
const period = ref(7)
const maxViews = ref(1)

const { state: loadState, run: loadRequest } = useRequest(async (days) => {
  if (!(await requirePageLogin(userStore, '登录后才能查看数据看板'))) return null
  const [nextOverview, nextCategoryStats, nextCredit, nextTrendData, nextTrend] = await Promise.all([
    bridge.dashboard.overview(),
    bridge.dashboard.categoryStats(),
    bridge.review.userCreditScore(),
    bridge.dashboard.trend(days),
    bridge.dashboard.trendChange(days)
  ])
  return {
    overview: nextOverview,
    categoryStats: nextCategoryStats,
    credit: nextCredit,
    trendData: nextTrendData,
    trend: nextTrend
  }
})

async function reload() {
  try {
    const data = await loadRequest(period.value)
    if (!data) return
    overview.value = data.overview || overview.value
    categoryStats.value = data.categoryStats || []
    credit.value = data.credit || { score: 0 }
    trendData.value = data.trendData || []
    trend.value = data.trend || { views: '0%', leads: '0%', deals: '0%' }
    maxViews.value = Math.max(1, ...trendData.value.map(d => d.views || 0))
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

async function changePeriod(days) {
  if (period.value === days || loadState.value === 'loading') return
  period.value = days
  await reload()
}

function getBarHeight(views) {
  return Math.max(8, Math.round(views / maxViews.value * 200))
}

function getCatWidth(count) {
  const max = Math.max(1, ...categoryStats.value.map(c => c.count || 0))
  return Math.round((count || 0) / max * 100)
}

function goOrder() { uni.navigateTo({ url: '/pages/order/index' }) }
function goDeals() { uni.navigateTo({ url: '/pages/deals/index' }) }
function goMessage() { uni.navigateTo({ url: '/pages/message/index' }) }
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }
.page-state { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }

.overview-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.overview-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 20rpx; }
.overview-grid { display: flex; flex-wrap: wrap; }
.ov-item { width: 50%; padding: 12rpx 0; box-sizing: border-box; }
.ov-num { font-size: 40rpx; font-weight: bold; color: #FF6B35; display: block; }
.ov-label { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-top: 4rpx; }
.ov-trend { font-size: 20rpx; margin-top: 4rpx; display: block; }
.ov-trend.up { color: #10B981; }
.ov-trend.down { color: #EF4444; }

.chart-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.chart-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.chart-tabs { display: flex; background: #F5F6FA; border-radius: 12rpx; padding: 4rpx; }
.chart-tab { font-size: 24rpx; color: rgba(0,0,0,0.5); padding: 8rpx 20rpx; border-radius: 8rpx; }
.chart-tab.active { background: #FFFFFF; color: #FF6B35; font-weight: bold; }

.bar-chart { display: flex; align-items: flex-end; height: 240rpx; margin-bottom: 16rpx; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; }
.bar-wrap { flex: 1; display: flex; align-items: flex-end; margin-bottom: 8rpx; width: 100%; justify-content: center; }
.bar { width: 60%; border-radius: 6rpx 6rpx 0 0; transition: height 0.3s; }
.bar-views { background: linear-gradient(180deg, #FF6B35, #FF9A5C); }
.bar-label { font-size: 18rpx; color: rgba(0,0,0,0.4); }

.chart-legend { display: flex; padding-top: 12rpx; border-top: 1rpx solid #F5F6FA; }
.legend-item { display: flex; align-items: center; margin-right: 24rpx; }
.legend-dot { width: 16rpx; height: 16rpx; border-radius: 4rpx; margin-right: 8rpx; }
.dot-views { background: #FF6B35; }
.dot-leads { background: #6366F1; }
.legend-item text { font-size: 22rpx; color: rgba(0,0,0,0.5); }

.category-bars { margin-top: 16rpx; }
.cat-bar { margin-bottom: 16rpx; }
.cat-bar-header { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.cat-bar-name { font-size: 24rpx; color: rgba(0,0,0,0.7); }
.cat-bar-count { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.cat-bar-track { height: 12rpx; background: #F5F6FA; border-radius: 6rpx; overflow: hidden; }
.cat-bar-fill { height: 100%; border-radius: 6rpx; transition: width 0.5s; }

.metrics-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; }
.metric-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #F5F6FA; }
.metric-item:last-child { border-bottom: none; }
.metric-label { font-size: 28rpx; color: rgba(0,0,0,0.6); }
.metric-value { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.metric-value.credit { color: #FF6B35; }

.todo-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #F5F6FA; }
.todo-item:last-child { border-bottom: none; }
.todo-icon { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; flex: 0 0 48rpx; margin-right: 16rpx; border-radius: 14rpx; font-size: 26rpx; line-height: 1; }
.todo-icon image { display: block; width: 28rpx; height: 28rpx; }
.todo-icon-order { background: #FFF5DF; }
.todo-icon-lead { background: #EEF0FF; }
.todo-icon-message { background: #E7F8F0; }
.todo-text { flex: 1; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.todo-badge { font-size: 24rpx; color: #FFFFFF; background: #FF6B35; border-radius: 20rpx; padding: 2rpx 16rpx; min-width: 36rpx; text-align: center; }
.todo-arrow { font-size: 32rpx; color: rgba(0,0,0,0.2); margin-left: 12rpx; }

/* 看板的指标、筛选和待办行在窄屏保持可收缩，图表只在卡片内部压缩。 */
.page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.overview-card, .chart-card, .metrics-card, .chart-header, .chart-tabs, .metric-item, .todo-item, .todo-text { min-width: 0; }
.chart-header { gap: 12rpx; }
.chart-title, .metric-label, .todo-text { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.chart-title, .metric-label, .todo-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chart-title { min-width: 0; }
.chart-tabs, .chart-tab, .todo-icon, .todo-badge, .todo-arrow { flex: 0 0 auto; }
.metric-label, .todo-text { min-width: 0; }
.metric-value { flex: 0 0 auto; white-space: nowrap; }
.bar-chart, .bar-col, .bar-wrap { min-width: 0; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .overview-card, .chart-card, .metrics-card { padding: 18rpx; }
  .chart-header { align-items: flex-start; flex-wrap: wrap; }
  .chart-tabs { margin-left: auto; }
  .chart-tab { padding-right: 14rpx; padding-left: 14rpx; font-size: 22rpx; }
  .ov-num { font-size: 34rpx; }
  .todo-item { gap: 8rpx; }
  .todo-icon { margin-right: 4rpx; }
  .todo-arrow { margin-left: 4rpx; }
}
</style>
