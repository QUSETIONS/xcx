<template>
  <view class="home">
    <!-- 顶部区域 -->
    <view class="header">
      <view class="header-top">
        <view class="greeting">
          <text class="greeting-hi">Hi</text>
          <text class="greeting-name">{{ userName }}</text>
        </view>
        <view class="header-right">
          <view class="notify-btn" @tap="goNotify">
            <image class="notify-icon" src="/static/icons/bell.svg" mode="aspectFit"/>
            <view class="notify-dot" v-if="hasNotify"/>
          </view>
        </view>
      </view>
      <view class="search-box" @tap="goSearch">
        <image class="search-icon" src="/static/icons/search.svg" mode="aspectFit"/>
        <text class="search-hint">搜索需求、资源、服务商...</text>
      </view>
    </view>

    <!-- Banner轮播 -->
    <swiper class="banner-swiper" autoplay circular indicator-dots indicator-color="rgba(0,0,0,0.2)" indicator-active-color="#FF6B35">
      <swiper-item>
        <view class="banner banner-orange" @tap="goDemandPublish">
          <view class="banner-content">
            <text class="banner-eyebrow">热门推荐</text>
            <text class="banner-title">需求精准匹配</text>
            <text class="banner-desc">发布需求 · 30分钟内响应</text>
            <view class="banner-action"><text>立即发布</text></view>
          </view>
          <image class="banner-img" src="/static/images/banner1.png" mode="aspectFill"/>
        </view>
      </swiper-item>
      <swiper-item>
        <view class="banner banner-purple" @tap="goMallList">
          <view class="banner-content">
            <text class="banner-eyebrow">会员专区</text>
            <text class="banner-title">解锁全部功能</text>
            <text class="banner-desc">优先对接 · 精准匹配 · 专属服务</text>
            <view class="banner-action"><text>了解详情</text></view>
          </view>
          <image class="banner-img" src="/static/images/banner2.png" mode="aspectFill"/>
        </view>
      </swiper-item>
    </swiper>

    <!-- 数据统计 - 动态获取 -->
    <view class="stats-row" :class="{ 'animate-in': animated }">
      <view class="stat-box stat-orange">
        <text class="stat-num" :class="{ 'count-up': animated }">{{ todayDemands }}</text>
        <text class="stat-label">今日需求</text>
        <view class="stat-trend"><text>↑12%</text></view>
      </view>
      <view class="stat-box stat-blue">
        <text class="stat-num" :class="{ 'count-up': animated }">{{ activeLeads }}</text>
        <text class="stat-label">活跃对接</text>
      </view>
      <view class="stat-box stat-green">
        <text class="stat-num" :class="{ 'count-up': animated }">{{ totalUsers }}</text>
        <text class="stat-label">平台用户</text>
      </view>
    </view>

    <!-- 分类 -->
    <view class="section" :class="{ 'animate-in': animated }">
      <text class="section-title">资源分类</text>
      <view class="cat-grid">
        <view class="cat-item" v-for="(cat, idx) in categories" :key="cat.id" @tap="goDemandByCategory(cat)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.05) + 's' }">
          <view class="cat-icon-box" :class="'cat-color-' + (idx % 8)">
            <image class="cat-icon" :src="'/static/icons/cat/cat_' + cat.id.slice(-2) + '.svg'" mode="aspectFit"/>
          </view>
          <text class="cat-name">{{ cat.name }}</text>
          <text class="cat-count">{{ cat.count || 0 }}</text>
        </view>
      </view>
    </view>

    <!-- 专区 -->
    <view class="zone-row" :class="{ 'animate-in': animated }">
      <view class="zone-box zone-orange" @tap="goZone('jiafang')">
        <image class="zone-icon" src="/static/icons/target.svg" mode="aspectFit"/>
        <text class="zone-label">甲方专区</text>
        <text class="zone-desc">发布需求</text>
      </view>
      <view class="zone-box zone-blue" @tap="goZone('yifang')">
        <image class="zone-icon" src="/static/icons/briefcase.svg" mode="aspectFit"/>
        <text class="zone-label">乙方专区</text>
        <text class="zone-desc">高效对接</text>
      </view>
      <view class="zone-box zone-green" @tap="goCommunity">
        <image class="zone-icon" src="/static/icons/chat.svg" mode="aspectFit"/>
        <text class="zone-label">社区讨论</text>
        <text class="zone-desc">交流经验</text>
      </view>
    </view>

    <!-- 推荐需求 -->
    <view class="section" :class="{ 'animate-in': animated }">
      <view class="section-header">
        <text class="section-title">智能推荐</text>
        <text class="section-more" @tap="goDemandList">查看全部</text>
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
        <view class="demand-item" v-for="(item, idx) in hotDemands" :key="item._id" @tap="goDemandDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="demand-top">
            <view class="demand-cat-tag">{{ item.category_name }}</view>
            <view class="demand-quote-tag">{{ formatQuote(item.quote_type) }}</view>
            <view class="demand-hot-tag" v-if="item.view_count > 1000">热门</view>
          </view>
          <text class="demand-title">{{ item.title }}</text>
          <view class="demand-meta">
            <text class="demand-company">{{ item.company_name }}</text>
            <text class="demand-region">{{ item.region }}</text>
          </view>
          <view class="demand-bottom">
            <view class="demand-stats">
              <view class="stat-item">
                <image class="stat-icon" src="/static/icons/eye.svg" mode="aspectFit"/>
                <text>{{ formatCount(item.view_count) }}</text>
              </view>
              <view class="stat-item">
                <image class="stat-icon" src="/static/icons/handshake.svg" mode="aspectFit"/>
                <text>{{ item.lead_count }}</text>
              </view>
            </view>
            <!-- 热度进度条 -->
            <view class="heat-bar">
              <view class="heat-fill" :class="getHeatClass(item)" :style="{ width: getHeat(item) + '%' }"/>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 精选服务 -->
    <view class="section" :class="{ 'animate-in': animated }">
      <view class="section-header">
        <text class="section-title">精选服务</text>
        <text class="section-more" @tap="goMallList">更多</text>
      </view>
      <view class="service-grid">
        <view class="service-item" v-for="(item, idx) in featuredProducts" :key="item._id" @tap="goProductDetail(item._id)"
          :class="{ 'fade-in': animated, 'scale-in': animated }" :style="{ animationDelay: (idx * 0.1) + 's' }">
          <view class="service-icon-box" :class="'service-color-' + (idx % 5)">
            <image class="service-icon" :src="'/static/icons/service/' + item.service_type + '.svg'" mode="aspectFit"/>
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
const animated = ref(false)

// 动态统计数据
const todayDemands = ref(0)
const activeLeads = ref(0)
const totalUsers = ref(1024)

const categories = ref([])
const hotDemands = ref([])
const featuredProducts = ref([])

onMounted(() => {
  loadData()
  // 触发入场动画
  setTimeout(() => { animated.value = true }, 100)
})

function loadData() {
  loading.value = true
  try {
    const allDemands = demandService.list({ pageSize: 100 })
    todayDemands.value = allDemands.total
    activeLeads.value = Math.floor(allDemands.total * 0.4)
    categories.value = DEMAND_CATEGORIES.slice(0, 8).map(cat => ({
      ...cat,
      count: allDemands.list.filter(d => d.category_id === cat.id).length
    }))
    const demands = allDemands.list.map(d => ({
      ...d,
      score: d.view_count * 0.5 + d.lead_count * 3 + (Date.now() - new Date(d.publish_time).getTime()) / 86400000 * -10
    }))
    demands.sort((a, b) => b.score - a.score)
    hotDemands.value = demands.slice(0, 6)
    const products = productService.list({ pageSize: 20 })
    featuredProducts.value = products.list.filter(p => p.is_featured || p.sale_count > 50).slice(0, 4)
  } catch (e) {
    console.error('loadData error:', e)
  } finally {
    loading.value = false
  }
}

function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }
function formatCount(n) { if (n >= 10000) return (n/10000).toFixed(1) + 'w'; if (n >= 1000) return (n/1000).toFixed(1) + 'k'; return n }
function getHeat(item) { return Math.min(100, Math.round((item.view_count / 3000) * 100)) }
function getHeatClass(item) { const h = getHeat(item); if (h > 70) return 'heat-hot'; if (h > 40) return 'heat-medium'; return 'heat-normal' }

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
.home { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }

.header { padding: 24rpx 24rpx 16rpx; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.greeting-hi { font-size: 28rpx; color: rgba(0,0,0,0.5); }
.greeting-name { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.notify-btn { width: 64rpx; height: 64rpx; background: #FFFFFF; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.notify-icon { width: 32rpx; height: 32rpx; }
.notify-dot { position: absolute; top: 12rpx; right: 12rpx; width: 12rpx; height: 12rpx; background: #FF6B35; border-radius: 50%; }

.search-box { display: flex; align-items: center; background: #FFFFFF; border-radius: 24rpx; padding: 20rpx 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.search-icon { width: 28rpx; height: 28rpx; }
.search-hint { font-size: 28rpx; color: rgba(0,0,0,0.35); margin-left: 12rpx; }

.banner-swiper { height: 260rpx; margin: 16rpx 24rpx; border-radius: 24rpx; overflow: hidden; }
.banner { position: relative; height: 100%; border-radius: 24rpx; overflow: hidden; }
.banner-orange { background: linear-gradient(135deg, #FF6B35, #FF9A5C); }
.banner-purple { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
.banner-content { position: relative; padding: 32rpx; display: flex; flex-direction: column; height: 100%; justify-content: center; z-index: 2; }
.banner-eyebrow { font-size: 24rpx; color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.2); padding: 4rpx 12rpx; border-radius: 8rpx; display: inline-block; }
.banner-title { font-size: 44rpx; font-weight: bold; color: #fff; margin: 12rpx 0; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.banner-action { display: inline-flex; background: rgba(255,255,255,0.95); border-radius: 32rpx; padding: 12rpx 32rpx; margin-top: 16rpx; }
.banner-action text { font-size: 26rpx; color: #FF6B35; font-weight: bold; }

.stats-row { display: flex; gap: 12rpx; margin: 16rpx 24rpx; opacity: 0; transform: translateY(20rpx); }
.animate-in { opacity: 1; transform: translateY(0); transition: all 0.5s ease-out; }
.stat-box { flex: 1; background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; text-align: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.stat-num { font-size: 40rpx; font-weight: bold; display: block; }
.stat-orange .stat-num { color: #FF6B35; }
.stat-blue .stat-num { color: #6366F1; }
.stat-green .stat-num { color: #10B981; }
.stat-label { font-size: 22rpx; color: rgba(0,0,0,0.5); display: block; margin-top: 4rpx; }
.stat-trend { font-size: 18rpx; color: #10B981; margin-top: 4rpx; }
.count-up { animation: countUp 0.6s ease-out; }

.section { margin: 24rpx 24rpx 16rpx; }
.animate-in .section { opacity: 1; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.section-more { font-size: 24rpx; color: #FF6B35; }

.cat-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.cat-item { width: calc(25% - 9rpx); display: flex; flex-direction: column; align-items: center; padding: 16rpx 0; background: #FFFFFF; border-radius: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }
.cat-icon-box { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.cat-color-0 { background: linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.05)); }
.cat-color-1 { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05)); }
.cat-color-2 { background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05)); }
.cat-color-3 { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05)); }
.cat-color-4 { background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05)); }
.cat-color-5 { background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05)); }
.cat-color-6 { background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05)); }
.cat-color-7 { background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05)); }
.cat-icon { width: 32rpx; height: 32rpx; }
.cat-name { font-size: 24rpx; color: rgba(0,0,0,0.7); }
.cat-count { font-size: 18rpx; color: rgba(0,0,0,0.4); margin-top: 4rpx; }

.zone-row { display: flex; gap: 12rpx; margin: 0 24rpx 16rpx; opacity: 0; }
.animate-in .zone-row { opacity: 1; transition: opacity 0.5s ease-out 0.2s; }
.zone-box { flex: 1; padding: 20rpx; border-radius: 16rpx; text-align: center; background: #FFFFFF; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.zone-orange { border-left: 4rpx solid #FF6B35; }
.zone-blue { border-left: 4rpx solid #6366F1; }
.zone-green { border-left: 4rpx solid #10B981; }
.zone-icon { width: 32rpx; height: 32rpx; margin-bottom: 8rpx; }
.zone-label { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.zone-desc { font-size: 22rpx; color: rgba(0,0,0,0.5); }

/* 骨架屏 */
.skeleton-list { display: flex; flex-direction: column; gap: 12rpx; }
.skeleton-item { background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; }
.skeleton-tags { width: 120rpx; height: 24rpx; background: #F0F1F5; border-radius: 8rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-title { width: 80%; height: 30rpx; background: #F0F1F5; border-radius: 8rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-meta { width: 60%; height: 24rpx; background: #F0F1F5; border-radius: 8rpx; animation: pulse 1.5s infinite; }

.demand-list { display: flex; flex-direction: column; gap: 12rpx; }
.demand-item { background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.demand-top { display: flex; gap: 8rpx; align-items: center; margin-bottom: 12rpx; }
.demand-cat-tag { font-size: 20rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-quote-tag { font-size: 20rpx; color: #6366F1; background: rgba(99,102,241,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-hot-tag { font-size: 18rpx; color: #EF4444; background: rgba(239,68,68,0.1); padding: 4rpx 8rpx; border-radius: 8rpx; }
.demand-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; line-height: 1.4; }
.demand-meta { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.demand-company { font-size: 24rpx; color: rgba(0,0,0,0.6); }
.demand-region { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.demand-bottom { display: flex; justify-content: space-between; align-items: center; }
.demand-stats { display: flex; gap: 16rpx; }
.stat-item { display: flex; align-items: center; gap: 4rpx; }
.stat-icon { width: 20rpx; height: 20rpx; }
.stat-item text { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.heat-bar { width: 100rpx; height: 6rpx; background: #F0F1F5; border-radius: 3rpx; overflow: hidden; }
.heat-fill { height: 100%; border-radius: 3rpx; transition: width 0.5s ease-out; }
.heat-hot { background: linear-gradient(90deg, #EF4444, #F87171); }
.heat-medium { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
.heat-normal { background: linear-gradient(90deg, #10B981, #34D399); }

.service-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.service-item { width: calc(50% - 6rpx); background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; text-align: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.scale-in { animation: scaleIn 0.4s ease-out both; }
.service-icon-box { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin: 0 auto 12rpx; }
.service-color-0 { background: rgba(255,107,53,0.1); }
.service-color-1 { background: rgba(99,102,241,0.1); }
.service-color-2 { background: rgba(16,185,129,0.1); }
.service-color-3 { background: rgba(245,158,11,0.1); }
.service-color-4 { background: rgba(236,72,153,0.1); }
.service-icon { width: 36rpx; height: 36rpx; }
.service-name { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 8rpx; }
.service-price-row { display: flex; justify-content: center; gap: 8rpx; align-items: baseline; margin-bottom: 8rpx; }
.service-price { font-size: 30rpx; font-weight: bold; color: #FF6B35; }
.service-market { font-size: 20rpx; color: rgba(0,0,0,0.4); text-decoration: line-through; }
.service-sales { font-size: 20rpx; color: #10B981; background: rgba(16,185,129,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; display: inline-flex; }

.footer-space { height: 32rpx; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes countUp { from { opacity: 0; transform: translateY(10rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>