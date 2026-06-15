<template>
  <view class="screen">
    <!-- 顶部标题栏 -->
    <view class="screen-header">
      <view class="header-left">
        <text class="header-time">{{ currentTime }}</text>
        <text class="header-date">{{ currentDate }}</text>
      </view>
      <text class="header-title">企业库 · 运营数据中心</text>
      <view class="header-right">
        <view class="live-dot"></view>
        <text class="live-text">实时</text>
      </view>
    </view>

    <!-- 核心指标 -->
    <view class="kpi-grid">
      <view class="kpi-card" v-for="(kpi, i) in kpis" :key="i">
        <text class="kpi-label">{{ kpi.label }}</text>
        <text class="kpi-value">{{ kpi.display }}</text>
        <view class="kpi-trend" :class="kpi.up ? 'up' : 'down'">
          <text>{{ kpi.up ? '↑' : '↓' }} {{ kpi.change }}</text>
        </view>
      </view>
    </view>

    <!-- 双图表区 -->
    <view class="chart-row">
      <!-- 交易趋势 -->
      <view class="chart-block">
        <text class="block-title">交易趋势（近7天）</text>
        <view class="line-chart">
          <view class="line-area" v-for="(d, i) in trendData" :key="i">
            <view class="bar-group">
              <view class="bar bar-deals" :style="{ height: barHeight(d.deals, 'deals') + '%' }"></view>
              <view class="bar bar-leads" :style="{ height: barHeight(d.leads, 'leads') + '%' }"></view>
            </view>
            <text class="bar-x">{{ d.date }}</text>
          </view>
        </view>
        <view class="legend">
          <view class="lg"><view class="lg-dot deals"></view><text>成交</text></view>
          <view class="lg"><view class="lg-dot leads"></view><text>对接</text></view>
        </view>
      </view>

      <!-- 分类占比 -->
      <view class="chart-block">
        <text class="block-title">需求分类占比</text>
        <view class="donut-list">
          <view class="donut-item" v-for="(c, i) in categories" :key="i">
            <view class="donut-bar"><view class="donut-fill" :style="{ width: c.pct + '%', background: c.color }"></view></view>
            <text class="donut-name">{{ c.name }}</text>
            <text class="donut-pct">{{ c.pct }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 实时动态流 -->
    <view class="feed-block">
      <text class="block-title">⚡ 实时动态</text>
      <view class="feed-list">
        <view class="feed-item" v-for="(f, i) in feeds" :key="f.id">
          <text class="feed-icon">{{ f.icon }}</text>
          <text class="feed-text">{{ f.text }}</text>
          <text class="feed-time">{{ f.time }}</text>
        </view>
      </view>
    </view>

    <!-- 区域热力 -->
    <view class="region-block">
      <text class="block-title">🌏 区域活跃度 TOP6</text>
      <view class="region-list">
        <view class="region-item" v-for="(r, i) in regions" :key="i">
          <text class="region-rank">{{ i + 1 }}</text>
          <text class="region-name">{{ r.name }}</text>
          <view class="region-bar"><view class="region-fill" :style="{ width: r.pct + '%' }"></view></view>
          <text class="region-val">{{ r.count }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { dashboardService } from '@/mock/service'

const currentTime = ref('00:00:00')
const currentDate = ref('')
const kpis = ref([])
const trendData = ref([])
const categories = ref([])
const regions = ref([])
const feeds = ref([])
let timer = null
let feedTimer = null
const maxDeal = ref(1)
const maxLead = ref(1)

const feedTemplates = [
  { icon: '🤝', text: '新对接：字节跳动 → 品牌全案策划' },
  { icon: '✅', text: '成交达成：短视频代运营服务' },
  { icon: '📝', text: '新需求发布：企业宣传片拍摄' },
  { icon: '💬', text: '社区新帖：私域流量运营心得' },
  { icon: '🛍️', text: '订单支付：会员认证服务 ¥299' },
  { icon: '⭐', text: '新会员开通：专业版年卡' },
  { icon: '🏛️', text: '企业认证通过：腾讯科技' },
  { icon: '🎯', text: '活动参与：邀请有奖 +1' }
]

function pad(n) { return String(n).padStart(2, '0') }
function updateTime() {
  const d = new Date()
  currentTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  currentDate.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function loadData() {
  const ov = dashboardService.overview()
  kpis.value = [
    { label: '总营收', display: '¥' + (ov.total_revenue / 10000).toFixed(1) + '万', change: '12.5%', up: true },
    { label: '总成交', display: ov.total_deals, change: '8.3%', up: true },
    { label: '总对接', display: ov.total_leads, change: '15.6%', up: true },
    { label: '总浏览', display: ov.total_views, change: '5.2%', up: true },
    { label: '转化率', display: ov.conversion_rate + '%', change: '2.1%', up: true },
    { label: '客单价', display: '¥' + Math.round(ov.total_revenue / Math.max(1, ov.total_deals) / 100), change: '3.4%', up: false }
  ]

  trendData.value = dashboardService.trend(7)
  maxDeal.value = Math.max(...trendData.value.map(d => d.deals), 1)
  maxLead.value = Math.max(...trendData.value.map(d => d.leads), 1)

  const cats = dashboardService.categoryStats()
  const total = cats.reduce((s, c) => s + c.count, 0) || 1
  categories.value = cats.map(c => ({ name: c.name, pct: Math.round(c.count / total * 100), color: c.color }))

  const regionNames = ['北京', '上海', '深圳', '广州', '杭州', '成都']
  const regionCounts = regionNames.map(() => Math.floor(Math.random() * 500) + 100)
  const maxR = Math.max(...regionCounts)
  regions.value = regionNames.map((n, i) => ({ name: n, count: regionCounts[i], pct: Math.round(regionCounts[i] / maxR * 100) }))

  generateFeeds()
}

function generateFeeds() {
  feeds.value = feedTemplates.slice(0, 6).map((t, i) => ({
    id: 'f' + i,
    icon: t.icon,
    text: t.text,
    time: '刚刚'
  }))
}

function rotateFeed() {
  // 随机插入一条新动态到顶部
  const t = feedTemplates[Math.floor(Math.random() * feedTemplates.length)]
  feeds.value = [{ id: 'f' + Date.now(), icon: t.icon, text: t.text, time: '刚刚' }, ...feeds.value.slice(0, 5)]
}

function barHeight(v, type) {
  const max = type === 'deals' ? maxDeal.value : maxLead.value
  return Math.max(8, Math.round(v / max * 100))
}

onMounted(() => {
  updateTime()
  loadData()
  timer = setInterval(updateTime, 1000)
  feedTimer = setInterval(rotateFeed, 4000)
})
onUnmounted(() => { clearInterval(timer); clearInterval(feedTimer) })
</script>

<style scoped>
.screen { min-height: 100vh; background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%); padding: 24rpx; }

.screen-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.header-left { display: flex; flex-direction: column; }
.header-time { font-size: 32rpx; font-weight: bold; color: #38BDF8; font-family: monospace; }
.header-date { font-size: 20rpx; color: rgba(148,163,184,0.8); }
.header-title { font-size: 34rpx; font-weight: bold; color: #F1F5F9; letter-spacing: 2rpx; }
.header-right { display: flex; align-items: center; }
.live-dot { width: 16rpx; height: 16rpx; background: #10B981; border-radius: 50%; margin-right: 8rpx; animation: pulse 1.5s infinite; }
.live-text { font-size: 22rpx; color: #10B981; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

.kpi-grid { display: flex; flex-wrap: wrap; margin-bottom: 24rpx; }
.kpi-card { width: 33.33%; box-sizing: border-box; padding: 6rpx; }
.kpi-card { }
.kpi-label { font-size: 22rpx; color: rgba(148,163,184,0.9); display: block; }
.kpi-value { font-size: 40rpx; font-weight: bold; color: #F1F5F9; display: block; margin: 8rpx 0; font-family: monospace; }
.kpi-trend { display: inline-block; padding: 2rpx 12rpx; border-radius: 8rpx; }
.kpi-trend.up { background: rgba(16,185,129,0.2); }
.kpi-trend.up text { color: #34D399; font-size: 20rpx; }
.kpi-trend.down { background: rgba(239,68,68,0.2); }
.kpi-trend.down text { color: #F87171; font-size: 20rpx; }

.chart-row { display: flex; margin-bottom: 24rpx; }
.chart-block { flex: 1; background: rgba(30,41,59,0.6); border: 1rpx solid rgba(148,163,184,0.15); border-radius: 16rpx; padding: 20rpx; margin: 0 6rpx; }
.block-title { font-size: 24rpx; font-weight: bold; color: #E2E8F0; display: block; margin-bottom: 16rpx; }

.line-chart { display: flex; align-items: flex-end; height: 200rpx; }
.line-area { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
.bar-group { display: flex; align-items: flex-end; height: 100%; width: 100%; justify-content: center; }
.bar { width: 14rpx; border-radius: 4rpx 4rpx 0 0; margin: 0 3rpx; min-height: 8rpx; }
.bar-deals { background: linear-gradient(180deg, #38BDF8, #0EA5E9); }
.bar-leads { background: linear-gradient(180deg, #FF6B35, #F59E0B); }
.bar-x { font-size: 16rpx; color: rgba(148,163,184,0.7); margin-top: 8rpx; }

.legend { display: flex; justify-content: center; margin-top: 12rpx; }
.lg { display: flex; align-items: center; margin: 0 12rpx; }
.lg-dot { width: 14rpx; height: 14rpx; border-radius: 4rpx; margin-right: 6rpx; }
.lg-dot.deals { background: #38BDF8; }
.lg-dot.leads { background: #FF6B35; }
.lg text { font-size: 20rpx; color: rgba(148,163,184,0.9); }

.donut-list { display: flex; flex-direction: column; }
.donut-item { margin-bottom: 14rpx; display: flex; align-items: center; }
.donut-bar { flex: 1; height: 16rpx; background: rgba(148,163,184,0.15); border-radius: 8rpx; overflow: hidden; margin: 0 12rpx; }
.donut-fill { height: 100%; border-radius: 8rpx; }
.donut-name { font-size: 22rpx; color: rgba(203,213,225,0.9); width: 80rpx; }
.donut-pct { font-size: 22rpx; color: #38BDF8; font-weight: bold; width: 60rpx; text-align: right; }

.feed-block { background: rgba(30,41,59,0.6); border: 1rpx solid rgba(148,163,184,0.15); border-radius: 16rpx; padding: 20rpx; margin-bottom: 24rpx; }
.feed-list { display: flex; flex-direction: column; }
.feed-item { display: flex; align-items: center; padding: 12rpx 0; border-bottom: 1rpx solid rgba(148,163,184,0.1); }
.feed-item:last-child { border-bottom: none; }
.feed-icon { font-size: 28rpx; margin-right: 12rpx; }
.feed-text { flex: 1; font-size: 24rpx; color: rgba(203,213,225,0.95); }
.feed-time { font-size: 20rpx; color: rgba(148,163,184,0.7); }

.region-block { background: rgba(30,41,59,0.6); border: 1rpx solid rgba(148,163,184,0.15); border-radius: 16rpx; padding: 20rpx; }
.region-list { display: flex; flex-direction: column; }
.region-item { display: flex; align-items: center; padding: 10rpx 0; }
.region-rank { width: 40rpx; height: 40rpx; line-height: 40rpx; text-align: center; background: rgba(255,107,53,0.2); color: #FF6B35; border-radius: 8rpx; font-size: 22rpx; font-weight: bold; margin-right: 16rpx; }
.region-name { font-size: 24rpx; color: rgba(203,213,225,0.9); width: 80rpx; }
.region-bar { flex: 1; height: 14rpx; background: rgba(148,163,184,0.15); border-radius: 7rpx; overflow: hidden; margin: 0 16rpx; }
.region-fill { height: 100%; background: linear-gradient(90deg, #38BDF8, #818CF8); border-radius: 7rpx; }
.region-val { font-size: 22rpx; color: #38BDF8; font-weight: bold; width: 80rpx; text-align: right; }
</style>