<template>
  <view class="home">
    <!-- 顶部区域：欢迎 + 搜索 -->
    <view class="home-header">
      <view class="header-top">
        <view class="greeting">
          <text class="greeting-hi">Hi 👋</text>
          <text class="greeting-name">{{ userName }}</text>
        </view>
        <view class="header-actions">
          <view class="icon-btn" @tap="goNotifications">
            <text>🔔</text>
            <view class="badge-dot" />
          </view>
        </view>
      </view>
      <!-- 搜索框 -->
      <view class="search-box glass-card" @tap="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-hint">搜索需求、资源、服务商...</text>
      </view>
    </view>

    <!-- Bento Grid 主区域 -->
    <view class="bento-grid">

      <!-- 大卡片：Banner -->
      <view class="bento bento-wide banner-card" @tap="goDemandList">
        <view class="banner-bg" />
        <view class="banner-content">
          <text class="banner-eyebrow">🔥 热门推荐</text>
          <text class="banner-title">需求精准匹配</text>
          <text class="banner-desc">发布需求 · 30分钟内响应</text>
          <view class="banner-action">
            <text>立即发布 →</text>
          </view>
        </view>
      </view>

      <!-- 数据卡片：今日需求 -->
      <view class="bento stat-card">
        <text class="stat-num gradient-text">128</text>
        <text class="stat-label">今日新需求</text>
      </view>

      <!-- 数据卡片：活跃对接 -->
      <view class="bento stat-card stat-card--accent">
        <text class="stat-num" style="background: $gradient-secondary; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">56</text>
        <text class="stat-label">活跃对接</text>
      </view>

      <!-- 分类网格 -->
      <view class="bento bento-wide category-bento">
        <text class="bento-title">资源分类</text>
        <view class="cat-grid">
          <view class="cat-item" v-for="cat in categories" :key="cat.id" @tap="goDemandByCategory(cat)">
            <view class="cat-icon-box" :style="{ background: cat.bg }">
              <text class="cat-icon">{{ cat.icon }}</text>
            </view>
            <text class="cat-name">{{ cat.name }}</text>
          </view>
        </view>
      </view>

      <!-- 专区入口 -->
      <view class="bento zone-card zone-card--jiafang" @tap="goZone('jiafang')">
        <text class="zone-emoji">🎯</text>
        <text class="zone-label">甲方专区</text>
        <text class="zone-desc">发布需求</text>
      </view>

      <view class="bento zone-card zone-card--yifang" @tap="goZone('project')">
        <text class="zone-emoji">💼</text>
        <text class="zone-label">项目专区</text>
        <text class="zone-desc">高效对接</text>
      </view>

      <!-- 推荐需求标题 -->
      <view class="bento bento-wide section-header-bento">
        <text class="section-title">推荐需求</text>
        <text class="section-more" @tap="goDemandList">查看全部 →</text>
      </view>

      <!-- 需求卡片 -->
      <view class="bento bento-wide demand-card" v-for="item in hotDemands" :key="item._id" @tap="goDemandDetail(item._id)">
        <view class="demand-top">
          <text class="demand-company">{{ item.company_name }}</text>
          <view class="ui-tag ui-tag--primary"><text>{{ formatQuote(item.quote_type) }}</text></view>
        </view>
        <text class="demand-title">{{ item.title }}</text>
        <view class="demand-bottom">
          <text class="demand-region">{{ item.region }}</text>
          <view class="demand-stats">
            <text class="demand-stat">👁 {{ item.view_count }}</text>
            <text class="demand-stat">🤝 {{ item.lead_count }}</text>
          </view>
        </view>
        <!-- 进度条表示热度 -->
        <view class="heat-bar">
          <view class="heat-fill" :style="{ width: getHeat(item) + '%' }" />
        </view>
      </view>

      <!-- 精选服务标题 -->
      <view class="bento bento-wide section-header-bento">
        <text class="section-title">精选服务</text>
        <text class="section-more" @tap="goMallList">更多 →</text>
      </view>

      <!-- 服务卡片 -->
      <view class="bento service-card" v-for="item in featuredProducts" :key="item._id" @tap="goProductDetail(item._id)">
        <view class="service-icon-box">
          <text class="service-icon">{{ getServiceIcon(item.service_type) }}</text>
        </view>
        <text class="service-name">{{ item.title }}</text>
        <text class="service-price">¥{{ (item.price / 100).toFixed(0) }}<text class="service-unit">/{{ item.unit }}</text></text>
      </view>

    </view>

    <!-- 底部间距 -->
    <view class="home-footer" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { DEMAND_CATEGORIES, QUOTE_TYPES } from '@/config/constants'
import { demandService, productService } from '@/mock/service'

const userName = ref('创业者')
const categories = ref(DEMAND_CATEGORIES.slice(0, 8).map((c, i) => ({
  ...c,
  bg: [
    'linear-gradient(135deg, #FF6B3530, #FF6B3510)',
    'linear-gradient(135deg, #6366F130, #6366F110)',
    'linear-gradient(135deg, #10B98130, #10B98110)',
    'linear-gradient(135deg, #F59E0B30, #F59E0B10)',
    'linear-gradient(135deg, #3B82F630, #3B82F610)',
    'linear-gradient(135deg, #EC489930, #EC489910)',
    'linear-gradient(135deg, #8B5CF630, #8B5CF610)',
    'linear-gradient(135deg, #06B6D430, #06B6D410)'
  ][i]
})))

const hotDemands = ref([])
const featuredProducts = ref([])

const demandRes = demandService.list({ sort: 'hot', page: 1 })
hotDemands.value = demandRes.list.slice(0, 4)

const productRes = productService.list({ sort: 'default', page: 1 })
featuredProducts.value = productRes.list.filter(p => p.is_featured).slice(0, 4)

function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function getHeat(item) { return Math.min(100, Math.round((item.view_count / 5000) * 100)) }

function goSearch() { uni.switchTab({ url: '/pages/demand/list' }) }
function goDemandList() { uni.switchTab({ url: '/pages/demand/list' }) }
function goMallList() { uni.switchTab({ url: '/pages/mall/list' }) }
function goNotifications() { uni.showToast({ title: '暂无新消息', icon: 'none' }) }
function goDemandByCategory() { uni.switchTab({ url: '/pages/demand/list' }) }
function goZone() { uni.switchTab({ url: '/pages/demand/list' }) }
function goDemandDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function goProductDetail(id) { uni.navigateTo({ url: `/pages/mall/detail?id=${id}` }) }
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: 140rpx;
}

/* 头部 */
.home-header { padding: $space-4 $space-4 $space-2; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: $space-3; }
.greeting-hi { font-size: $font-lg; color: $text-secondary; display: block; }
.greeting-name { font-size: $font-xl; font-weight: $weight-bold; color: $text-primary; }
.icon-btn { width: 72rpx; height: 72rpx; border-radius: $radius-lg; background: $glass-bg; border: 1rpx solid $glass-border; display: flex; align-items: center; justify-content: center; position: relative; font-size: 32rpx; }
.badge-dot { position: absolute; top: 12rpx; right: 12rpx; width: 12rpx; height: 12rpx; border-radius: 50%; background: $color-danger; }

/* 搜索 */
.search-box { display: flex; align-items: center; gap: $space-2; padding: $space-3 $space-4; }
.search-icon { font-size: 28rpx; }
.search-hint { font-size: $font-base; color: $text-placeholder; }

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $bento-gap;
  padding: 0 $space-4;
}
.bento { border-radius: $radius-lg; overflow: hidden; }
.bento-wide { grid-column: 1 / -1; }

/* Banner大卡片 */
.banner-card { position: relative; height: 280rpx; overflow: hidden; }
.banner-bg { position: absolute; inset: 0; background: $gradient-sunset; opacity: 0.8; }
.banner-content { position: relative; z-index: 1; padding: $space-5; display: flex; flex-direction: column; height: 100%; justify-content: center; }
.banner-eyebrow { font-size: $font-sm; color: rgba(255,255,255,0.8); margin-bottom: $space-1; }
.banner-title { font-size: $font-2xl; font-weight: $weight-black; color: #fff; margin-bottom: $space-1; }
.banner-desc { font-size: $font-sm; color: rgba(255,255,255,0.7); margin-bottom: $space-3; }
.banner-action { display: inline-flex; align-self: flex-start; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: $radius-full; padding: 10rpx 28rpx; }
.banner-action text { font-size: $font-sm; color: #fff; font-weight: $weight-semibold; }

/* 统计卡片 */
.stat-card {
  background: $glass-bg; backdrop-filter: blur($glass-blur); border: 1rpx solid $glass-border;
  padding: $space-4; display: flex; flex-direction: column; justify-content: center; align-items: center;
  height: 160rpx;
}
.stat-card--accent { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.15); }
.stat-num { font-size: $font-2xl; font-weight: $weight-black; margin-bottom: 4rpx; }
.stat-label { font-size: $font-xs; color: $text-tertiary; }

/* 分类 */
.category-bento { background: $glass-bg; backdrop-filter: blur($glass-blur); border: 1rpx solid $glass-border; padding: $space-4; }
.bento-title { font-size: $font-md; font-weight: $weight-bold; color: $text-primary; display: block; margin-bottom: $space-3; }
.cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: $space-2; }
.cat-item { display: flex; flex-direction: column; align-items: center; gap: $space-1; }
.cat-icon-box { width: 80rpx; height: 80rpx; border-radius: $radius-lg; display: flex; align-items: center; justify-content: center; }
.cat-icon { font-size: 36rpx; }
.cat-name { font-size: $font-xs; color: $text-secondary; }

/* 专区 */
.zone-card { background: $glass-bg; backdrop-filter: blur($glass-blur); border: 1rpx solid $glass-border; padding: $space-4; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 160rpx; }
.zone-card--jiafang { background: rgba(255,107,53,0.08); border-color: rgba(255,107,53,0.15); }
.zone-card--yifang { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.15); }
.zone-emoji { font-size: 48rpx; margin-bottom: $space-1; }
.zone-label { font-size: $font-base; font-weight: $weight-bold; color: $text-primary; }
.zone-desc { font-size: $font-xs; color: $text-tertiary; }

/* 区域标题 */
.section-header-bento { display: flex; justify-content: space-between; align-items: center; padding: $space-3 0; background: transparent; border: none; }
.section-title { font-size: $font-md; font-weight: $weight-bold; color: $text-primary; }
.section-more { font-size: $font-sm; color: $color-primary; }

/* 需求卡片 */
.demand-card { background: $glass-bg; backdrop-filter: blur($glass-blur); border: 1rpx solid $glass-border; padding: $space-4; }
.demand-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: $space-2; }
.demand-company { font-size: $font-sm; color: $text-secondary; }
.demand-title { font-size: $font-md; font-weight: $weight-semibold; color: $text-primary; display: block; margin-bottom: $space-2; line-height: 1.4; }
.demand-bottom { display: flex; justify-content: space-between; align-items: center; margin-bottom: $space-2; }
.demand-region { font-size: $font-xs; color: $text-tertiary; }
.demand-stats { display: flex; gap: $space-2; }
.demand-stat { font-size: $font-xs; color: $text-tertiary; }

.heat-bar { height: 4rpx; background: rgba(255,255,255,0.06); border-radius: 2rpx; overflow: hidden; }
.heat-fill { height: 100%; background: $gradient-primary; border-radius: 2rpx; transition: width $duration-slow $ease-out; }

/* 服务卡片 */
.service-card { background: $glass-bg; backdrop-filter: blur($glass-blur); border: 1rpx solid $glass-border; padding: $space-4; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200rpx; }
.service-icon-box { width: 72rpx; height: 72rpx; border-radius: $radius-lg; background: rgba(255,107,53,0.12); display: flex; align-items: center; justify-content: center; margin-bottom: $space-2; }
.service-icon { font-size: 36rpx; }
.service-name { font-size: $font-sm; font-weight: $weight-semibold; color: $text-primary; text-align: center; margin-bottom: $space-1; }
.service-price { font-size: $font-lg; font-weight: $weight-bold; color: $color-primary; }
.service-unit { font-size: $font-xs; color: $text-tertiary; font-weight: $weight-normal; }

.home-footer { height: $space-8; }
</style>