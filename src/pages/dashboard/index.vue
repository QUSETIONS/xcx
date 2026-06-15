<template>
  <view class="page">
    <!-- 概览卡片 -->
    <view class="overview-card">
      <text class="overview-title">数据概览</text>
      <view class="overview-grid">
        <view class="ov-item">
          <text class="ov-num">{{ overview.total_views }}</text>
          <text class="ov-label">总浏览</text>
          <text class="ov-trend" :class="trend.views.startsWith('+') ? 'up' : 'down'">{{ trend.views }}</text>
        </view>
        <view class="ov-item">
          <text class="ov-num">{{ overview.total_leads }}</text>
          <text class="ov-label">总对接</text>
          <text class="ov-trend up">{{ trend.leads }}</text>
        </view>
        <view class="ov-item">
          <text class="ov-num">{{ overview.total_deals }}</text>
          <text class="ov-label">总成交</text>
          <text class="ov-trend up">{{ trend.deals }}</text>
        </view>
        <view class="ov-item">
          <text class="ov-num">{{ overview.conversion_rate }}%</text>
          <text class="ov-label">转化率</text>
        </view>
      </view>
    </view>

    <!-- 趋势图 -->
    <view class="chart-card">
      <view class="chart-header">
        <text class="chart-title">浏览趋势</text>
        <view class="chart-tabs">
          <text class="chart-tab" :class="{ active: period === 7 }" @tap="period = 7; loadTrend()">7天</text>
          <text class="chart-tab" :class="{ active: period === 30 }" @tap="period = 30; loadTrend()">30天</text>
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
        <view class="legend-item"><view class="legend-dot dot-views"></view><text>浏览量</text></view>
        <view class="legend-item"><view class="legend-dot dot-leads"></view><text>对接数</text></view>
      </view>
    </view>

    <!-- 分类分布 -->
    <view class="chart-card">
      <text class="chart-title">需求分类分布</text>
      <view class="category-bars">
        <view class="cat-bar" v-for="(item, idx) in categoryStats" :key="idx">
          <view class="cat-bar-header">
            <text class="cat-bar-name">{{ item.name }}</text>
            <text class="cat-bar-count">{{ item.count }}个</text>
          </view>
          <view class="cat-bar-track">
            <view class="cat-bar-fill" :style="{ width: getCatWidth(item.count) + '%', background: item.color }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 核心指标 -->
    <view class="metrics-card">
      <text class="chart-title">核心指标</text>
      <view class="metric-item">
        <text class="metric-label">平均响应时间</text>
        <text class="metric-value">{{ overview.avg_response_time }}</text>
      </view>
      <view class="metric-item">
        <text class="metric-label">累计成交金额</text>
        <text class="metric-value">¥{{ (overview.total_revenue / 100).toFixed(0) }}</text>
      </view>
      <view class="metric-item">
        <text class="metric-label">信用评分</text>
        <text class="metric-value credit">{{ credit.score }}分</text>
      </view>
    </view>

    <!-- 待办提醒 -->
    <view class="metrics-card">
      <text class="chart-title">待办事项</text>
      <view class="todo-item" @tap="goOrder">
        <text class="todo-icon">📦</text>
        <text class="todo-text">待处理订单</text>
        <text class="todo-badge">3</text>
        <text class="todo-arrow">›</text>
      </view>
      <view class="todo-item" @tap="goDeals">
        <text class="todo-icon">🤝</text>
        <text class="todo-text">新对接待回复</text>
        <text class="todo-badge">5</text>
        <text class="todo-arrow">›</text>
      </view>
      <view class="todo-item" @tap="goMessage">
        <text class="todo-icon">💬</text>
        <text class="todo-text">未读消息</text>
        <text class="todo-badge">2</text>
        <text class="todo-arrow">›</text>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dashboardService, reviewService } from '@/mock/service'

const overview = ref({})
const trendData = ref([])
const categoryStats = ref([])
const trend = ref({})
const credit = ref({})
const period = ref(7)
const maxViews = ref(1)

onMounted(() => {
  overview.value = dashboardService.overview()
  categoryStats.value = dashboardService.categoryStats()
  credit.value = reviewService.userCreditScore()
  loadTrend()
})

function loadTrend() {
  trendData.value = dashboardService.trend(period.value)
  maxViews.value = Math.max(...trendData.value.map(d => d.views))
  trend.value = dashboardService.trendChange(period.value)
}

function getBarHeight(views) {
  return Math.max(8, Math.round(views / maxViews.value * 200))
}

function getCatWidth(count) {
  const max = Math.max(...categoryStats.value.map(c => c.count))
  return Math.round(count / max * 100)
}

function goOrder() { uni.navigateTo({ url: '/pages/order/index' }) }
function goDeals() { uni.navigateTo({ url: '/pages/deals/index' }) }
function goMessage() { uni.navigateTo({ url: '/pages/message/index' }) }
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }

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
.todo-icon { font-size: 36rpx; margin-right: 16rpx; }
.todo-text { flex: 1; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.todo-badge { font-size: 24rpx; color: #FFFFFF; background: #FF6B35; border-radius: 20rpx; padding: 2rpx 16rpx; min-width: 36rpx; text-align: center; }
.todo-arrow { font-size: 32rpx; color: rgba(0,0,0,0.2); margin-left: 12rpx; }
</style>