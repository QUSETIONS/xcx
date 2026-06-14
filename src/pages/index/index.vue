<template>
  <view class="home">
    <!-- 顶部区域 -->
    <view class="header">
      <view class="header-top">
        <view class="greeting">
          <text class="greeting-hi">Hi 👋</text>
          <text class="greeting-name">{{ userName }}</text>
        </view>
      </view>
      <view class="search-box" @tap="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-hint">搜索需求、资源、服务商...</text>
      </view>
    </view>

    <!-- Banner -->
    <view class="banner" @tap="goDemandList">
      <view class="banner-bg"/>
      <view class="banner-content">
        <text class="banner-eyebrow">🔥 热门推荐</text>
        <text class="banner-title">需求精准匹配</text>
        <text class="banner-desc">发布需求 · 30分钟内响应</text>
        <view class="banner-action"><text>立即发布 →</text></view>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-row">
      <view class="stat-box">
        <text class="stat-num">128</text>
        <text class="stat-label">今日需求</text>
      </view>
      <view class="stat-box">
        <text class="stat-num">56</text>
        <text class="stat-label">活跃对接</text>
      </view>
    </view>

    <!-- 分类 -->
    <view class="section">
      <text class="section-title">资源分类</text>
      <view class="cat-grid">
        <view class="cat-item" v-for="cat in categories" :key="cat.id" @tap="goDemandByCategory(cat)">
          <text class="cat-icon">{{ cat.icon }}</text>
          <text class="cat-name">{{ cat.name }}</text>
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
      <view class="zone-box zone-yifang" @tap="goZone('project')">
        <text class="zone-emoji">💼</text>
        <text class="zone-label">项目专区</text>
        <text class="zone-desc">高效对接</text>
      </view>
    </view>

    <!-- 推荐需求 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">推荐需求</text>
        <text class="section-more" @tap="goDemandList">查看全部 →</text>
      </view>
      <view class="demand-list">
        <view class="demand-item" v-for="item in hotDemands" :key="item._id" @tap="goDemandDetail(item._id)">
          <view class="demand-top">
            <text class="demand-cat">{{ item.category_name }}</text>
            <text class="demand-quote">{{ formatQuote(item.quote_type) }}</text>
          </view>
          <text class="demand-title">{{ item.title }}</text>
          <view class="demand-meta">
            <text class="demand-company">{{ item.company_name }}</text>
            <text class="demand-region">{{ item.region }}</text>
          </view>
          <view class="demand-stats">
            <text>👁 {{ item.view_count }}</text>
            <text>🤝 {{ item.lead_count }}</text>
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
        <view class="service-item" v-for="item in featuredProducts" :key="item._id" @tap="goProductDetail(item._id)">
          <text class="service-icon">{{ getServiceIcon(item.service_type) }}</text>
          <text class="service-name">{{ item.title }}</text>
          <text class="service-price">¥{{ (item.price / 100).toFixed(0) }}</text>
        </view>
      </view>
    </view>

    <view class="footer-space"/>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { DEMAND_CATEGORIES, QUOTE_TYPES } from '@/config/constants'
import { demandService, productService } from '@/mock/service'

const userName = ref('创业者')
const categories = ref(DEMAND_CATEGORIES.slice(0, 8))

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

function goSearch() { uni.switchTab({ url: '/pages/demand/list' }) }
function goDemandList() { uni.switchTab({ url: '/pages/demand/list' }) }
function goMallList() { uni.switchTab({ url: '/pages/mall/list' }) }
function goDemandByCategory() { uni.switchTab({ url: '/pages/demand/list' }) }
function goZone() { uni.switchTab({ url: '/pages/demand/list' }) }
function goDemandDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function goProductDetail(id) { uni.navigateTo({ url: `/pages/mall/detail?id=${id}` }) }
</script>

<style lang="scss">
.home {
  min-height: 100vh;
  background: #0A0A0F;
  padding-bottom: 120rpx;
}

.header { padding: 24rpx 24rpx 16rpx; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.greeting-hi { font-size: 28rpx; color: rgba(255,255,255,0.65); }
.greeting-name { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; }
.search-box { display: flex; align-items: center; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 24rpx; padding: 20rpx 24rpx; }
.search-icon { font-size: 28rpx; }
.search-hint { font-size: 28rpx; color: rgba(255,255,255,0.35); margin-left: 12rpx; }

.banner { position: relative; height: 260rpx; margin: 16rpx 24rpx; border-radius: 24rpx; overflow: hidden; }
.banner-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #FF6B35, #EC4899); }
.banner-content { position: relative; padding: 32rpx; display: flex; flex-direction: column; height: 100%; justify-content: center; }
.banner-eyebrow { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.banner-title { font-size: 44rpx; font-weight: bold; color: #fff; margin: 8rpx 0; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.7); }
.banner-action { display: inline-flex; background: rgba(255,255,255,0.2); border-radius: 32rpx; padding: 10rpx 28rpx; margin-top: 16rpx; }
.banner-action text { font-size: 24rpx; color: #fff; }

.stats-row { display: flex; gap: 16rpx; margin: 16rpx 24rpx; }
.stat-box { flex: 1; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 24rpx; text-align: center; }
.stat-num { font-size: 44rpx; font-weight: bold; color: #FF6B35; }
.stat-label { font-size: 22rpx; color: rgba(255,255,255,0.5); display: block; margin-top: 4rpx; }

.section { margin: 24rpx 24rpx 16rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.section-more { font-size: 24rpx; color: #FF6B35; }

.cat-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.cat-item { width: calc(25% - 9rpx); display: flex; flex-direction: column; align-items: center; padding: 16rpx 0; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; }
.cat-icon { font-size: 36rpx; margin-bottom: 8rpx; }
.cat-name { font-size: 22rpx; color: rgba(255,255,255,0.65); }

.zone-row { display: flex; gap: 16rpx; margin: 0 24rpx 16rpx; }
.zone-box { flex: 1; padding: 24rpx; border-radius: 20rpx; text-align: center; }
.zone-jiafang { background: rgba(255,107,53,0.12); border: 1rpx solid rgba(255,107,53,0.2); }
.zone-yifang { background: rgba(59,130,246,0.12); border: 1rpx solid rgba(59,130,246,0.2); }
.zone-emoji { font-size: 40rpx; display: block; margin-bottom: 8rpx; }
.zone-label { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; }
.zone-desc { font-size: 22rpx; color: rgba(255,255,255,0.5); }

.demand-list { display: flex; flex-direction: column; gap: 12rpx; }
.demand-item { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 20rpx; }
.demand-top { display: flex; gap: 8rpx; margin-bottom: 12rpx; }
.demand-cat { font-size: 20rpx; color: #FF9A5C; background: rgba(255,107,53,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-quote { font-size: 20rpx; color: #F472B6; background: rgba(236,72,153,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 12rpx; line-height: 1.4; }
.demand-meta { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.demand-company { font-size: 24rpx; color: rgba(255,255,255,0.65); }
.demand-region { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.demand-stats { display: flex; gap: 16rpx; }
.demand-stats text { font-size: 22rpx; color: rgba(255,255,255,0.5); }

.service-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.service-item { width: calc(50% - 6rpx); background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 20rpx; text-align: center; }
.service-icon { font-size: 36rpx; display: block; margin-bottom: 8rpx; }
.service-name { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 8rpx; }
.service-price { font-size: 30rpx; font-weight: bold; color: #FF6B35; }

.footer-space { height: 32rpx; }
</style>