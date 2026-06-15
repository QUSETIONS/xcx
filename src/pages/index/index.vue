<template>
  <view class="home">
    <!-- 顶部区域 -->
    <view class="header">
      <view class="header-top">
        <view class="greeting">
          <text class="greeting-hi">Hi 👋</text>
          <text class="greeting-name">{{ userName }}</text>
        </view>
        <view class="header-right">
          <view class="notify-btn" @tap="goNotify">
            <text class="notify-icon">🔔</text>
            <view class="notify-dot" v-if="hasNotify"/>
          </view>
        </view>
      </view>
      <view class="search-box" @tap="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-hint">搜索需求、资源、服务商...</text>
      </view>
    </view>

    <!-- Banner轮播 -->
    <swiper class="banner-swiper" autoplay circular indicator-dots indicator-color="rgba(255,255,255,0.3)" indicator-active-color="#fff">
      <swiper-item>
        <view class="banner" @tap="goDemandPublish">
          <view class="banner-bg banner-bg-1"/>
          <view class="banner-content">
            <text class="banner-eyebrow">🔥 热门推荐</text>
            <text class="banner-title">需求精准匹配</text>
            <text class="banner-desc">发布需求 · 30分钟内响应</text>
            <view class="banner-action"><text>立即发布 →</text></view>
          </view>
        </view>
      </swiper-item>
      <swiper-item>
        <view class="banner" @tap="goMallList">
          <view class="banner-bg banner-bg-2"/>
          <view class="banner-content">
            <text class="banner-eyebrow">👑 会员专区</text>
            <text class="banner-title">解锁全部功能</text>
            <text class="banner-desc">优先对接 · 精准匹配 · 专属服务</text>
            <view class="banner-action"><text>了解详情 →</text></view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 数据统计 - 动态获取 -->
    <view class="stats-row">
      <view class="stat-box">
        <text class="stat-num">{{ todayDemands }}</text>
        <text class="stat-label">今日需求</text>
        <view class="stat-trend up"><text>↑{{ trendDemands }}%</text></view>
      </view>
      <view class="stat-box">
        <text class="stat-num">{{ activeLeads }}</text>
        <text class="stat-label">活跃对接</text>
      </view>
      <view class="stat-box">
        <text class="stat-num">{{ totalUsers }}</text>
        <text class="stat-label">平台用户</text>
      </view>
    </view>

    <!-- 分类 -->
    <view class="section">
      <text class="section-title">资源分类</text>
      <view class="cat-grid">
        <view class="cat-item" v-for="(cat, idx) in categories" :key="cat.id" @tap="goDemandByCategory(cat)" :style="{ animationDelay: idx * 0.05 + 's' }">
          <view class="cat-icon-box" :style="{ background: catColors[idx] }">
            <text class="cat-icon">{{ cat.icon }}</text>
          </view>
          <text class="cat-name">{{ cat.name }}</text>
          <text class="cat-count">{{ cat.count || 0 }}</text>
        </view>
      </view>
    </view>

    <!-- 专区 -->
    <view class="zone-row">
      <view class="zone-box zone-jiafang" @tap="goZone('jiafang')">
        <text class="zone-emoji">🎯</text>
        <text class="zone-label">甲方专区</text>
        <text class="zone-desc">发布需求</text>
      </view>
      <view class="zone-box zone-yifang" @tap="goZone('yifang')">
        <text class="zone-emoji">💼</text>
        <text class="zone-label">乙方专区</text>
        <text class="zone-desc">高效对接</text>
      </view>
      <view class="zone-box zone-community" @tap="goCommunity">
        <text class="zone-emoji">💬</text>
        <text class="zone-label">社区讨论</text>
        <text class="zone-desc">交流经验</text>
      </view>
    </view>

    <!-- 推荐需求 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">智能推荐</text>
        <text class="section-more" @tap="goDemandList">查看全部 →</text>
      </view>

      <!-- 骨架屏 -->
      <view class="skeleton-list" v-if="loading">
        <view class="skeleton-item" v-for="i in 3" :key="i">
          <view class="skeleton-tags"/>
          <view class="skeleton-title"/>
          <view class="skeleton-meta"/>
        </view>
      </view>

      <!-- 需求列表 -->
      <view class="demand-list" v-else>
        <view class="demand-item" v-for="(item, idx) in hotDemands" :key="item._id" @tap="goDemandDetail(item._id)" :style="{ animationDelay: idx * 0.1 + 's' }">
          <view class="demand-top">
            <text class="demand-cat">{{ item.category_name }}</text>
            <text class="demand-quote">{{ formatQuote(item.quote_type) }}</text>
            <text class="demand-hot" v-if="item.view_count > 1000">🔥 热门</text>
          </view>
          <text class="demand-title">{{ item.title }}</text>
          <view class="demand-meta">
            <text class="demand-company">{{ item.company_name }}</text>
            <text class="demand-region">{{ item.region }}</text>
          </view>
          <view class="demand-bottom">
            <view class="demand-stats">
              <text class="stat-item">👁 {{ formatCount(item.view_count) }}</text>
              <text class="stat-item">🤝 {{ item.lead_count }}</text>
            </view>
            <!-- 热度进度条 -->
            <view class="heat-bar">
              <view class="heat-fill" :style="{ width: getHeat(item) + '%', background: getHeatColor(item) }"/>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 精选服务 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">精选服务</text>
        <text class="section-more" @tap="goMallList">更多 →</text>
      </view>
      <view class="service-grid">
        <view class="service-item" v-for="(item, idx) in featuredProducts" :key="item._id" @tap="goProductDetail(item._id)">
          <view class="service-icon-box" :style="{ background: serviceColors[idx % 5] }">
            <text class="service-icon">{{ getServiceIcon(item.service_type) }}</text>
          </view>
          <text class="service-name">{{ item.title }}</text>
          <view class="service-price-row">
            <text class="service-price">¥{{ (item.price / 100).toFixed(0) }}</text>
            <text class="service-market">¥{{ (item.market_price / 100).toFixed(0) }}</text>
          </view>
          <view class="service-sales"><text>{{ item.sale_count }}人已购</text></view>
        </view>
      </view>
    </view>

    <view class="footer-space"/>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DEMAND_CATEGORIES, QUOTE_TYPES } from '@/config/constants'
import { demandService, productService } from '@/mock/service'

const userName = ref('创业者')
const hasNotify = ref(false)
const loading = ref(true)

// 动态统计数据
const todayDemands = ref(0)
const trendDemands = ref(12)
const activeLeads = ref(0)
const totalUsers = ref(1024)

const categories = ref([])
const hotDemands = ref([])
const featuredProducts = ref([])

const catColors = [
  'linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,107,53,0.08))',
  'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))',
  'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.08))',
  'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))',
  'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.08))',
  'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(236,72,153,0.08))',
  'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.08))',
  'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(6,182,212,0.08))'
]

const serviceColors = [
  'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.05))',
  'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))',
  'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
  'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
  'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))'
]

onMounted(async () => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    // 动态统计
    const allDemands = demandService.list({ pageSize: 100 })
    todayDemands.value = allDemands.total
    activeLeads.value = Math.floor(allDemands.total * 0.4)

    // 分类计数
    const cats = DEMAND_CATEGORIES.slice(0, 8).map(cat => ({
      ...cat,
      count: allDemands.list.filter(d => d.category_id === cat.id).length
    }))
    categories.value = cats

    // 推荐需求 - 智能算法：热度+时间权重
    const demands = allDemands.list.map(d => ({
      ...d,
      score: d.view_count * 0.5 + d.lead_count * 3 + (Date.now() - new Date(d.publish_time).getTime()) / 86400000 * -10
    }))
    demands.sort((a, b) => b.score - a.score)
    hotDemands.value = demands.slice(0, 6)

    // 精选服务
    const products = productService.list({ pageSize: 20 })
    featuredProducts.value = products.list.filter(p => p.is_featured || p.sale_count > 50).slice(0, 4)
  } finally {
    loading.value = false
  }
}

function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }
function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function formatCount(n) { if (n >= 10000) return (n/10000).toFixed(1) + 'w'; if (n >= 1000) return (n/1000).toFixed(1) + 'k'; return n }
function getHeat(item) { return Math.min(100, Math.round((item.view_count / 3000) * 100)) }
function getHeatColor(item) { const h = getHeat(item); if (h > 70) return 'linear-gradient(90deg, #EF4444, #F87171)'; if (h > 40) return 'linear-gradient(90deg, #F59E0B, #FBBF24)'; return 'linear-gradient(90deg, #10B981, #34D399)' }

function goSearch() { uni.switchTab({ url: '/pages/demand/list' }) }
function goDemandList() { uni.switchTab({ url: '/pages/demand/list' }) }
function goMallList() { uni.switchTab({ url: '/pages/mall/list' }) }
function goCommunity() { uni.switchTab({ url: '/pages/community/index' }) }
function goDemandPublish() { uni.switchTab({ url: '/pages/demand/publish' }) }
function goNotify() { uni.showToast({ title: '消息中心开发中', icon: 'none' }) }
function goDemandByCategory(cat) { uni.switchTab({ url: '/pages/demand/list?category=' + cat.id }) }
function goZone(type) { uni.switchTab({ url: `/pages/demand/list?zone=${type}` }) }
function goDemandDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function goProductDetail(id) { uni.navigateTo({ url: `/pages/mall/detail?id=${id}` }) }
</script>

<style lang="scss">
.home { min-height: 100vh; background: #0A0A0F; padding-bottom: 120rpx; }

.header { padding: 24rpx 24rpx 16rpx; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.greeting-hi { font-size: 28rpx; color: rgba(255,255,255,0.65); }
.greeting-name { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; }
.header-right { display: flex; gap: 12rpx; }
.notify-btn { width: 64rpx; height: 64rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; display: flex; align-items: center; justify-content: center; position: relative; }
.notify-icon { font-size: 28rpx; }
.notify-dot { position: absolute; top: 12rpx; right: 12rpx; width: 12rpx; height: 12rpx; background: #EF4444; border-radius: 50%; }

.search-box { display: flex; align-items: center; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 24rpx; padding: 20rpx 24rpx; }
.search-icon { font-size: 28rpx; }
.search-hint { font-size: 28rpx; color: rgba(255,255,255,0.35); margin-left: 12rpx; }

.banner-swiper { height: 260rpx; margin: 16rpx 24rpx; border-radius: 24rpx; overflow: hidden; }
.banner { position: relative; height: 100%; }
.banner-bg { position: absolute; inset: 0; }
.banner-bg-1 { background: linear-gradient(135deg, #FF6B35, #EC4899); }
.banner-bg-2 { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
.banner-content { position: relative; padding: 32rpx; display: flex; flex-direction: column; height: 100%; justify-content: center; }
.banner-eyebrow { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.banner-title { font-size: 44rpx; font-weight: bold; color: #fff; margin: 8rpx 0; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.7); }
.banner-action { display: inline-flex; background: rgba(255,255,255,0.2); border-radius: 32rpx; padding: 10rpx 28rpx; margin-top: 16rpx; }
.banner-action text { font-size: 24rpx; color: #fff; }

.stats-row { display: flex; gap: 12rpx; margin: 16rpx 24rpx; }
.stat-box { flex: 1; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 20rpx; text-align: center; }
.stat-num { font-size: 40rpx; font-weight: bold; color: #FF6B35; display: block; }
.stat-label { font-size: 20rpx; color: rgba(255,255,255,0.5); display: block; margin-top: 4rpx; }
.stat-trend { font-size: 18rpx; margin-top: 4rpx; }
.stat-trend.up { color: #10B981; }

.section { margin: 24rpx 24rpx 16rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.section-more { font-size: 24rpx; color: #FF6B35; }

.cat-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.cat-item { width: calc(25% - 9rpx); display: flex; flex-direction: column; align-items: center; padding: 16rpx 0; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; animation: fadeInUp 0.4s ease-out both; }
.cat-icon-box { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.cat-icon { font-size: 28rpx; }
.cat-name { font-size: 22rpx; color: rgba(255,255,255,0.65); }
.cat-count { font-size: 18rpx; color: rgba(255,255,255,0.35); margin-top: 4rpx; }

.zone-row { display: flex; gap: 12rpx; margin: 0 24rpx 16rpx; }
.zone-box { flex: 1; padding: 20rpx; border-radius: 16rpx; text-align: center; }
.zone-jiafang { background: rgba(255,107,53,0.12); border: 1rpx solid rgba(255,107,53,0.2); }
.zone-yifang { background: rgba(59,130,246,0.12); border: 1rpx solid rgba(59,130,246,0.2); }
.zone-community { background: rgba(16,185,129,0.12); border: 1rpx solid rgba(16,185,129,0.2); }
.zone-emoji { font-size: 32rpx; display: block; margin-bottom: 6rpx; }
.zone-label { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; }
.zone-desc { font-size: 20rpx; color: rgba(255,255,255,0.5); }

/* 骨架屏 */
.skeleton-list { display: flex; flex-direction: column; gap: 12rpx; }
.skeleton-item { background: rgba(255,255,255,0.06); border-radius: 20rpx; padding: 20rpx; }
.skeleton-tags { width: 120rpx; height: 24rpx; background: rgba(255,255,255,0.1); border-radius: 8rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-title { width: 80%; height: 30rpx; background: rgba(255,255,255,0.1); border-radius: 8rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-meta { width: 60%; height: 24rpx; background: rgba(255,255,255,0.1); border-radius: 8rpx; animation: pulse 1.5s infinite; }

.demand-list { display: flex; flex-direction: column; gap: 12rpx; }
.demand-item { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 20rpx; animation: fadeInUp 0.4s ease-out both; }
.demand-top { display: flex; gap: 8rpx; align-items: center; margin-bottom: 12rpx; }
.demand-cat { font-size: 20rpx; color: #FF9A5C; background: rgba(255,107,53,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-quote { font-size: 20rpx; color: #F472B6; background: rgba(236,72,153,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-hot { font-size: 18rpx; color: #EF4444; }
.demand-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 12rpx; line-height: 1.4; }
.demand-meta { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.demand-company { font-size: 24rpx; color: rgba(255,255,255,0.65); }
.demand-region { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.demand-bottom { display: flex; justify-content: space-between; align-items: center; }
.demand-stats { display: flex; gap: 16rpx; }
.stat-item { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.heat-bar { width: 100rpx; height: 6rpx; background: rgba(255,255,255,0.1); border-radius: 3rpx; overflow: hidden; }
.heat-fill { height: 100%; border-radius: 3rpx; transition: width 0.5s ease-out; }

.service-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.service-item { width: calc(50% - 6rpx); background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 20rpx; text-align: center; }
.service-icon-box { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin: 0 auto 12rpx; }
.service-icon { font-size: 36rpx; }
.service-name { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 8rpx; }
.service-price-row { display: flex; justify-content: center; gap: 8rpx; align-items: baseline; margin-bottom: 8rpx; }
.service-price { font-size: 30rpx; font-weight: bold; color: #FF6B35; }
.service-market { font-size: 20rpx; color: rgba(255,255,255,0.4); text-decoration: line-through; }
.service-sales { font-size: 20rpx; color: #10B981; background: rgba(16,185,129,0.12); padding: 4rpx 12rpx; border-radius: 8rpx; display: inline-flex; }

.footer-space { height: 32rpx; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
</style>