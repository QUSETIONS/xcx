<template>
  <view v-if="loadState === 'loading'" class="screen-state">
    <text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="loadState === 'error'" class="screen-state error-state" @tap="reload">
    <image class="screen-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>{{ t('common.loadFailed') }}</text>
    <text class="screen-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="screen">
    <!-- 顶部标题栏 -->
    <view class="screen-header">
      <view class="header-left">
        <text class="header-time">{{ currentTime }}</text>
        <text class="header-date">{{ currentDate }}</text>
      </view>
      <text class="header-title">{{ t('admin.screenTitle') }}</text>
      <view class="header-right">
        <view class="period-switch">
          <text class="period-option" :class="{ active: period === 7 }" @tap="changePeriod(7)">7天</text>
          <text class="period-option" :class="{ active: period === 30 }" @tap="changePeriod(30)">30天</text>
        </view>
        <view class="live-dot"></view>
        <text class="live-text">{{ t('admin.live') }}</text>
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

    <!-- 项目闭环：所有阶段都由需求、提案、对接与协作室的业务表聚合而来。 -->
    <view class="funnel-block">
      <view class="funnel-heading">
        <view><text class="block-title">项目协作漏斗</text><text class="funnel-caption">从发布到交付，查看项目在哪一步停住</text></view>
        <text class="funnel-period">近 {{ period }} 天</text>
      </view>
      <view class="funnel-steps">
        <view v-for="(step, index) in funnel.steps" :key="step.key" class="funnel-step">
          <text class="funnel-index">0{{ index + 1 }}</text>
          <text class="funnel-value">{{ step.value }}</text>
          <text class="funnel-label">{{ step.label }}</text>
        </view>
      </view>
      <view class="funnel-rate-row">
        <view v-for="item in funnelRates" :key="item.label" class="funnel-rate"><text>{{ item.label }}</text><text>{{ item.value }}%</text></view>
      </view>
      <view class="funnel-watchlist">
        <text>待处理</text>
        <text>{{ funnel.watchlist?.idle_teams || 0 }} 个团队超过 72 小时未回复</text>
        <text>{{ funnel.watchlist?.stale_demands || 0 }} 条需求超过 7 天未获得匹配</text>
      </view>
    </view>

    <!-- Agent 真实使用链路 -->
    <view class="agent-ops-block">
      <view class="agent-ops-heading">
        <view><text class="block-title">Agent 使用链路</text><text class="agent-ops-caption">请求、补充、带入发布均来自真实事件</text></view>
        <text class="agent-ops-period">近 {{ period }} 天</text>
      </view>
      <view class="agent-ops-grid">
        <view class="agent-ops-item" v-for="card in agentCards" :key="card.key">
          <text class="agent-ops-label">{{ card.label }}</text>
          <text class="agent-ops-value">{{ card.value }}</text>
        </view>
      </view>
      <view class="agent-ops-detail-row">
        <view class="agent-ops-detail">
          <text class="agent-detail-title">兜底原因</text>
          <text v-if="!agentMetrics.fallback_reasons?.length" class="agent-detail-empty">暂无兜底记录</text>
          <view v-for="item in (agentMetrics.fallback_reasons || []).slice(0, 3)" :key="item.reason" class="agent-detail-line"><text>{{ item.reason }}</text><text>{{ item.count }} 次</text></view>
        </view>
        <view class="agent-ops-detail">
          <text class="agent-detail-title">用户改了哪些字段</text>
          <text v-if="!agentMetrics.edited_fields?.length" class="agent-detail-empty">暂无字段修改记录</text>
          <view v-for="item in (agentMetrics.edited_fields || []).slice(0, 3)" :key="item.field" class="agent-detail-line"><text>{{ agentFieldName(item.field) }}</text><text>{{ item.count }} 次</text></view>
        </view>
      </view>
    </view>

    <!-- 双图表区 -->
    <view class="chart-row">
      <!-- 交易趋势 -->
      <view class="chart-block">
        <text class="block-title">{{ t('admin.trendTitle') }}</text>
        <view class="line-chart">
          <view class="line-area" v-for="(d, i) in trendData" :key="i">
            <view class="bar-group">
              <view class="bar bar-deals" :style="{ height: barHeight(d.orders, 'orders') + '%' }"></view>
              <view class="bar bar-leads" :style="{ height: barHeight(d.leads, 'leads') + '%' }"></view>
            </view>
            <text class="bar-x">{{ d.date }}</text>
          </view>
        </view>
        <view class="legend">
          <view class="lg"><view class="lg-dot deals"></view><text>{{ t('admin.legendDeal') }}</text></view>
          <view class="lg"><view class="lg-dot leads"></view><text>{{ t('admin.legendLead') }}</text></view>
        </view>
      </view>

      <!-- 分类占比 -->
      <view class="chart-block">
        <text class="block-title">{{ t('admin.categoryTitle') }}</text>
        <view class="donut-list">
          <view class="donut-item" v-for="(c, i) in categories" :key="i">
            <view class="donut-bar"><view class="donut-fill" :style="{ width: c.pct + '%', background: c.color }"></view></view>
            <text class="donut-name">{{ categoryName(c.id, c.name) }}</text>
            <text class="donut-pct">{{ c.pct }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 实时动态流 -->
    <view class="feed-block">
      <text class="block-title">{{ t('admin.feedTitle') }}</text>
      <view class="feed-list">
        <view class="feed-item" v-for="(f, i) in feeds" :key="f.id">
          <image class="feed-icon" :src="f.icon" mode="aspectFit" />
          <text class="feed-text">{{ f.text }}</text>
          <text class="feed-time">{{ f.time }}</text>
        </view>
        <view v-if="!feeds.length" class="feed-empty">当前周期还没有新的运营记录</view>
      </view>
    </view>

    <!-- 区域热力 -->
    <view class="region-block">
      <text class="block-title">{{ t('admin.regionTitle') }}</text>
      <view class="region-list">
        <view class="region-item" v-for="(r, i) in regions" :key="i">
          <text class="region-rank">{{ i + 1 }}</text>
          <text class="region-name">{{ regionName(r.name) }}</text>
          <view class="region-bar"><view class="region-fill" :style="{ width: r.pct + '%' }"></view></view>
          <text class="region-val">{{ r.count }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { categoryName, regionName } from '@/utils/i18n-maps'
import { t } from '@/i18n'
import { useRequest } from '@/hooks/useRequest'
import { toastError } from '@/utils/feedback'
useNavTitle('titles.screen')

const currentTime = ref('00:00:00')
const currentDate = ref('')
const period = ref(7)
const kpis = ref([])
const trendData = ref([])
const categories = ref([])
const regions = ref([])
const feeds = ref([])
const agentMetrics = ref({})
const funnel = ref({ steps: [], rates: {}, watchlist: {} })
let timer = null
const maxOrder = ref(1)
const maxLead = ref(1)

function pad(n) { return String(n).padStart(2, '0') }
function updateTime() {
  const d = new Date()
  currentTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  currentDate.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function loadData() {
  const data = await bridge.admin.metrics(period.value)
  const ov = data?.summary || {}
  const changes = data?.changes || {}
  const changeFor = (key, lowerIsBetter = false) => {
    const change = changes[key]
    if (!change) return { label: '—', up: true }
    return { label: change.label || '0%', up: lowerIsBetter ? !change.up : Boolean(change.up) }
  }
  const number = (value) => Number(value || 0).toLocaleString('zh-CN')
  const reportHours = ov.avg_report_hours == null ? '暂无' : `${Number(ov.avg_report_hours).toFixed(1)}小时`
  kpis.value = [
    { label: '活跃用户', display: number(ov.active_users), ...changeFor('active_users') },
    { label: '新增入群', display: number(ov.group_joins), ...changeFor('group_joins') },
    { label: '群聊消息', display: number(ov.group_messages), ...changeFor('group_messages') },
    { label: '发布需求', display: number(ov.published_demands), ...changeFor('published_demands') },
    { label: '对接申请', display: number(ov.leads), ...changeFor('leads') },
    { label: '举报处理时效', display: reportHours, ...changeFor('avg_report_hours', true) }
  ]

  trendData.value = Array.isArray(data?.trend) ? data.trend : []
  maxOrder.value = Math.max(...trendData.value.map(d => d.orders || 0), 1)
  maxLead.value = Math.max(...trendData.value.map(d => d.leads || 0), 1)

  const palette = ['#38BDF8', '#818CF8', '#34D399', '#F59E0B', '#FB7185', '#A78BFA']
  const cats = Array.isArray(data?.categories) ? data.categories : []
  const total = cats.reduce((sum, item) => sum + Number(item.count || 0), 0) || 1
  categories.value = cats.map((item, index) => ({
    id: item.id,
    name: item.name,
    count: Number(item.count || 0),
    pct: Math.round(Number(item.count || 0) / total * 100),
    color: palette[index % palette.length]
  }))

  const rawRegions = Array.isArray(data?.regions) ? data.regions : []
  const maxRegion = Math.max(...rawRegions.map((item) => Number(item.count || 0)), 1)
  regions.value = rawRegions.map((item) => ({
    name: item.name,
    count: Number(item.count || 0),
    pct: Math.round(Number(item.count || 0) / maxRegion * 100)
  }))
  feeds.value = Array.isArray(data?.feeds) ? data.feeds : []
  agentMetrics.value = data?.agent && typeof data.agent === 'object' ? data.agent : {}
  funnel.value = data?.funnel && typeof data.funnel === 'object'
    ? { steps: Array.isArray(data.funnel.steps) ? data.funnel.steps : [], rates: data.funnel.rates || {}, watchlist: data.funnel.watchlist || {} }
    : { steps: [], rates: {}, watchlist: {} }
}

const funnelRates = computed(() => {
  const rates = funnel.value?.rates || {}
  return [
    { label: '有效匹配率', value: Number(rates.match_rate || 0).toFixed(1) },
    { label: '对接接受率', value: Number(rates.connect_accept_rate || 0).toFixed(1) },
    { label: '报价率', value: Number(rates.quote_rate || 0).toFixed(1) },
    { label: '交付完成率', value: Number(rates.delivery_rate || 0).toFixed(1) }
  ]
})

const agentCards = computed(() => {
  const metrics = agentMetrics.value || {}
  const number = (value) => Number(value || 0).toLocaleString('zh-CN')
  const percent = (value) => `${Number(value || 0).toFixed(1)}%`
  return [
    { key: 'requests', label: 'Agent 请求', value: number(metrics.requests) },
    { key: 'fallback_rate', label: '兜底率', value: percent(metrics.fallback_rate) },
    { key: 'second_turn_rate', label: '二轮补充率', value: percent(metrics.second_turn_rate) },
    { key: 'completion_rate', label: '整理完成率', value: percent(metrics.completion_rate) },
    { key: 'publish_rate', label: '最终发布率', value: percent(metrics.publish_rate) },
    { key: 'avg_quality', label: '平均质量', value: `${Number(metrics.avg_quality || 0).toFixed(1)} 分` }
  ]
})

function agentFieldName(field) {
  return { region: '地区', budget: '预算', start_time: '启动时间', detail: '交付要求' }[field] || field
}

function barHeight(v, type) {
  const max = type === 'orders' ? maxOrder.value : maxLead.value
  return Math.max(8, Math.round(v / max * 100))
}

const { state: loadState, run: loadRequest } = useRequest(loadData)

function startLiveTimers() {
  clearInterval(timer)
  timer = setInterval(updateTime, 1000)
}

function changePeriod(value) {
  const next = Number(value) === 30 ? 30 : 7
  if (period.value === next) return
  period.value = next
  void reload()
}

async function reload() {
  try {
    await loadRequest()
    startLiveTimers()
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(() => {
  updateTime()
  reload()
})
onUnmounted(() => { clearInterval(timer) })
</script>

<style scoped>
.screen { min-height: 100vh; background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%); padding: 24rpx; }
.screen-state { min-height: 100vh; background: #0F172A; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(226,232,240,0.85); }
.screen-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FB923C; }
.screen-state-action { font-size: 24rpx; color: rgba(148,163,184,0.85); }

.screen-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.header-left { display: flex; flex-direction: column; }
.header-time { font-size: 32rpx; font-weight: bold; color: #38BDF8; font-family: monospace; }
.header-date { font-size: 20rpx; color: rgba(148,163,184,0.8); }
.header-title { font-size: 34rpx; font-weight: bold; color: #F1F5F9; letter-spacing: 2rpx; }
.header-right { display: flex; align-items: center; gap: 12rpx; }
.period-switch { display: flex; padding: 3rpx; border: 1rpx solid rgba(148,163,184,0.25); border-radius: 10rpx; }
.period-option { padding: 4rpx 10rpx; border-radius: 7rpx; color: rgba(148,163,184,0.85); font-size: 18rpx; }
.period-option.active { color: #0F172A; background: #38BDF8; }
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

.funnel-block { margin-bottom: 24rpx; padding: 20rpx; border: 1rpx solid rgba(212,188,137,.24); border-radius: 12rpx; background: rgba(35,41,55,.68); }
.funnel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }.funnel-heading .block-title { margin-bottom: 4rpx; }.funnel-caption { display: block; color: rgba(194,201,210,.72); font-size: 18rpx; }.funnel-period { padding: 5rpx 9rpx; border: 1rpx solid rgba(212,188,137,.22); border-radius: 4rpx; color: #D8C5A2; font-size: 18rpx; white-space: nowrap; }
.funnel-steps { display: flex; overflow: hidden; margin-top: 17rpx; border-top: 1rpx solid rgba(226,232,240,.1); border-bottom: 1rpx solid rgba(226,232,240,.1); }.funnel-step { position: relative; display: flex; min-width: 0; flex: 1; flex-direction: column; padding: 16rpx 10rpx; border-left: 1rpx solid rgba(226,232,240,.1); }.funnel-step:first-child { border-left: 0; }.funnel-index { color: rgba(216,197,162,.75); font: 700 15rpx/1.2 monospace; letter-spacing: .08em; }.funnel-value { margin-top: 7rpx; color: #FAF7F1; font: 600 31rpx/1.1 monospace; }.funnel-label { margin-top: 6rpx; overflow: hidden; color: rgba(203,213,225,.76); font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }
.funnel-rate-row { display: flex; flex-wrap: wrap; margin-top: 14rpx; }.funnel-rate { display: flex; width: 50%; justify-content: space-between; box-sizing: border-box; padding: 7rpx 14rpx 7rpx 0; color: rgba(203,213,225,.78); font-size: 18rpx; }.funnel-rate text:last-child { color: #E4CCA1; font-family: monospace; font-weight: 700; }.funnel-watchlist { display: flex; flex-wrap: wrap; gap: 8rpx 15rpx; margin-top: 9rpx; padding-top: 13rpx; border-top: 1rpx solid rgba(226,232,240,.1); color: rgba(203,213,225,.74); font-size: 17rpx; }.funnel-watchlist text:first-child { color: #D97757; font-weight: 700; }

.agent-ops-block { background: rgba(15,23,42,0.72); border: 1rpx solid rgba(56,189,248,0.2); border-radius: 16rpx; padding: 20rpx; margin-bottom: 24rpx; }
.agent-ops-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
.agent-ops-heading .block-title { margin-bottom: 4rpx; }
.agent-ops-caption { display: block; color: rgba(148,163,184,0.78); font-size: 18rpx; }
.agent-ops-period { padding: 6rpx 10rpx; border-radius: 8rpx; color: #7DD3FC; background: rgba(56,189,248,0.1); font-size: 18rpx; white-space: nowrap; }
.agent-ops-grid { display: flex; flex-wrap: wrap; margin: 14rpx -6rpx 0; }
.agent-ops-item { width: 16.666%; box-sizing: border-box; padding: 10rpx 8rpx; border-right: 1rpx solid rgba(148,163,184,0.1); }
.agent-ops-item:nth-child(6n) { border-right: none; }
.agent-ops-label { display: block; color: rgba(148,163,184,0.8); font-size: 18rpx; }
.agent-ops-value { display: block; margin-top: 7rpx; color: #F8FAFC; font-size: 28rpx; font-weight: 700; font-family: monospace; }
.agent-ops-detail-row { display: flex; gap: 14rpx; margin-top: 12rpx; }
.agent-ops-detail { flex: 1; padding: 12rpx; border-radius: 10rpx; background: rgba(30,41,59,0.68); }
.agent-detail-title { display: block; margin-bottom: 7rpx; color: #CBD5E1; font-size: 19rpx; font-weight: 700; }
.agent-detail-line { display: flex; justify-content: space-between; gap: 12rpx; padding: 5rpx 0; color: rgba(203,213,225,0.82); font-size: 18rpx; }
.agent-detail-line text:last-child { color: #7DD3FC; }
.agent-detail-empty { color: rgba(148,163,184,0.65); font-size: 18rpx; }

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
.feed-icon { width: 28rpx; height: 28rpx; margin-right: 12rpx; }
.feed-text { flex: 1; font-size: 24rpx; color: rgba(203,213,225,0.95); }
.feed-time { font-size: 20rpx; color: rgba(148,163,184,0.7); }
.feed-empty { padding: 20rpx 0; color: rgba(148,163,184,0.75); font-size: 22rpx; text-align: center; }

.region-block { background: rgba(30,41,59,0.6); border: 1rpx solid rgba(148,163,184,0.15); border-radius: 16rpx; padding: 20rpx; }
.region-list { display: flex; flex-direction: column; }
.region-item { display: flex; align-items: center; padding: 10rpx 0; }
.region-rank { width: 40rpx; height: 40rpx; line-height: 40rpx; text-align: center; background: rgba(255,107,53,0.2); color: #FF6B35; border-radius: 8rpx; font-size: 22rpx; font-weight: bold; margin-right: 16rpx; }
.region-name { font-size: 24rpx; color: rgba(203,213,225,0.9); width: 80rpx; }
.region-bar { flex: 1; height: 14rpx; background: rgba(148,163,184,0.15); border-radius: 7rpx; overflow: hidden; margin: 0 16rpx; }
.region-fill { height: 100%; background: linear-gradient(90deg, #38BDF8, #818CF8); border-radius: 7rpx; }
.region-val { font-size: 22rpx; color: #38BDF8; font-weight: bold; width: 80rpx; text-align: right; }

/* 数据大屏在手机上改为单列阅读，避免标题、指标和图表互相挤出画布。 */
.screen { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.screen-header, .header-left, .header-right, .funnel-heading, .agent-ops-heading,
.agent-ops-detail-row, .chart-row, .chart-block, .feed-item, .region-item,
.agent-ops-item, .funnel-step, .funnel-rate, .donut-item { min-width: 0; }
.header-left { flex: 1; overflow: hidden; }
.header-title { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.feed-text, .agent-detail-line text, .funnel-caption, .agent-ops-caption { overflow-wrap: anywhere; word-break: break-word; }
.feed-text { overflow: hidden; }
.chart-block { box-sizing: border-box; }

@media (max-width: 420px) {
  .screen { padding: 18rpx 16rpx; }
  .screen-header { flex-wrap: wrap; align-items: flex-start; gap: 12rpx; }
  .header-left { flex: 1 1 calc(100% - 150rpx); }
  .header-right { flex: 0 0 auto; margin-left: auto; }
  .header-title { white-space: normal; }
  .kpi-card { width: 50%; }
  .kpi-value { font-size: 34rpx; }
  .agent-ops-item { width: 50%; }
  .agent-ops-item:nth-child(6n) { border-right: 1rpx solid rgba(148,163,184,0.1); }
  .agent-ops-item:nth-child(2n) { border-right: none; }
  .agent-ops-detail-row, .chart-row { flex-direction: column; }
  .agent-ops-detail, .chart-block { width: 100%; margin: 0 0 12rpx; }
  .agent-ops-detail:last-child, .chart-block:last-child { margin-bottom: 0; }
  .funnel-step { padding-right: 6rpx; padding-left: 6rpx; }
  .funnel-value { font-size: 26rpx; }
  .funnel-label { white-space: normal; overflow-wrap: anywhere; }
  .funnel-rate { width: 100%; padding-right: 0; }
  .donut-name { width: 70rpx; }
  .donut-pct { width: 58rpx; }
  .region-name { width: 70rpx; }
  .region-val { width: 58rpx; }
  .region-bar { margin-right: 10rpx; margin-left: 10rpx; }
  .feed-item { align-items: flex-start; }
  .feed-time { flex: 0 0 auto; }
}
</style>
