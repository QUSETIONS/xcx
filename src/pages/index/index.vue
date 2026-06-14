<template>
  <view class="home">
    <!-- Banner -->
    <swiper class="banner" autoplay circular interval="4000"
      indicator-dots indicator-color="rgba(255,255,255,0.3)" indicator-active-color="#fff">
      <swiper-item v-for="item in banners" :key="item._id" @tap="onBannerTap(item)">
        <view class="banner-item" :style="{ background: item.bg }">
          <view class="banner-content">
            <text class="banner-title">{{ item.title }}</text>
            <text class="banner-sub">{{ item.subtitle }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 搜索入口 -->
    <view class="search-entry" @tap="goSearch">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索需求、资源、服务商...</text>
    </view>

    <!-- 分类网格 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">资源分类</text>
        <text class="section-more" @tap="goDemandList">全部 →</text>
      </view>
      <view class="category-grid">
        <view class="category-item" v-for="cat in categories" :key="cat.id" @tap="goDemandByCategory(cat)">
          <view class="category-icon-wrap">
            <text class="category-icon">{{ cat.icon }}</text>
          </view>
          <text class="category-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <!-- 专区入口 -->
    <view class="zone-cards">
      <view class="zone-card" @tap="goZone('jiafang')">
        <view class="zone-inner" style="background: linear-gradient(135deg, #FF6B3520, #FF6B3508)">
          <text class="zone-label">甲方专区</text>
          <text class="zone-desc">发布需求，精准匹配</text>
        </view>
      </view>
      <view class="zone-card" @tap="goZone('project')">
        <view class="zone-inner" style="background: linear-gradient(135deg, #1890FF20, #1890FF08)">
          <text class="zone-label">项目专区</text>
          <text class="zone-desc">优质项目，高效对接</text>
        </view>
      </view>
    </view>

    <!-- 推荐需求 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">推荐需求</text>
        <text class="section-more" @tap="goDemandList">更多 →</text>
      </view>
      <view class="demand-list" v-if="hotDemands.length">
        <view class="demand-card" v-for="item in hotDemands" :key="item._id" @tap="goDemandDetail(item._id)">
          <view class="demand-card-top">
            <text class="demand-company">{{ item.company_name }}</text>
            <text class="demand-region">{{ item.region }}</text>
          </view>
          <text class="demand-title">{{ item.title }}</text>
          <view class="demand-meta">
            <text class="demand-quote">{{ formatQuote(item.quote_type) }}</text>
            <text class="demand-views">{{ item.view_count }}浏览</text>
            <text class="demand-leads">{{ item.lead_count }}人对接</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 推荐服务 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">精选服务</text>
        <text class="section-more" @tap="goMallList">更多 →</text>
      </view>
      <scroll-view scroll-x class="product-scroll">
        <view class="product-list-h">
          <view class="product-card-h" v-for="item in featuredProducts" :key="item._id" @tap="goProductDetail(item._id)">
            <view class="product-icon-wrap">
              <text class="product-icon">{{ getServiceIcon(item.service_type) }}</text>
            </view>
            <text class="product-title">{{ item.title }}</text>
            <text class="product-price">¥{{ (item.price / 100).toFixed(0) }}<text class="product-unit">/{{ item.unit }}</text></text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { DEMAND_CATEGORIES, QUOTE_TYPES } from '@/config/constants'
import { demandService, productService } from '@/mock/service'

const banners = ref([
  { _id: 'b1', title: '百万营销方案精选', subtitle: '行业大咖方案一键获取 →', bg: 'linear-gradient(135deg, #FF6B35, #FF8F65)' },
  { _id: 'b2', title: '需求对接·精准匹配', subtitle: '发布需求，快速找到服务方 →', bg: 'linear-gradient(135deg, #1890FF, #36A3FF)' },
  { _id: 'b3', title: '链接官服务上线', subtitle: '专属链接官为您精准匹配 →', bg: 'linear-gradient(135deg, #722ED1, #9254DE)' }
])

const categories = ref(DEMAND_CATEGORIES.slice(0, 8))
const hotDemands = ref([])
const featuredProducts = ref([])

// 加载数据
const demandRes = demandService.list({ sort: 'hot', page: 1 })
hotDemands.value = demandRes.list.slice(0, 4)

const productRes = productService.list({ sort: 'default', page: 1 })
featuredProducts.value = productRes.list.filter(p => p.is_featured).slice(0, 6)

function formatQuote(type) {
  return QUOTE_TYPES.find(q => q.value === type)?.label || '面议'
}

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function onBannerTap() { uni.switchTab({ url: '/pages/demand/list' }) }
function goSearch() { uni.switchTab({ url: '/pages/demand/list' }) }
function goDemandList() { uni.switchTab({ url: '/pages/demand/list' }) }
function goMallList() { uni.switchTab({ url: '/pages/mall/list' }) }
function goDemandByCategory() { uni.switchTab({ url: '/pages/demand/list' }) }
function goZone() { uni.switchTab({ url: '/pages/demand/list' }) }
function goDemandDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function goProductDetail(id) { uni.navigateTo({ url: `/pages/mall/detail?id=${id}` }) }
</script>

<style lang="scss" scoped>
.home { padding-bottom: 120rpx; background: $--color-bg; min-height: 100vh; }

.banner { height: 320rpx; margin: 20rpx 24rpx; border-radius: $--radius-lg; overflow: hidden; }
.banner-item { height: 100%; display: flex; align-items: center; padding: 40rpx; }
.banner-content { color: #fff; }
.banner-title { font-size: 40rpx; font-weight: 700; display: block; margin-bottom: 12rpx; }
.banner-sub { font-size: 26rpx; opacity: 0.9; }

.search-entry { display: flex; align-items: center; gap: 16rpx; margin: 20rpx 24rpx; padding: 20rpx 24rpx; background: #fff; border-radius: $--radius-lg; box-shadow: $--shadow-sm; }
.search-icon { font-size: 32rpx; }
.search-placeholder { font-size: 28rpx; color: #999; }

.section { margin: 24rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: 700; color: #333; }
.section-more { font-size: 24rpx; color: #999; }

.category-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.category-item { width: calc(25% - 12rpx); display: flex; flex-direction: column; align-items: center; padding: 16rpx 0; }
.category-icon-wrap { width: 88rpx; height: 88rpx; border-radius: 24rpx; background: #FF6B3510; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.category-icon { font-size: 40rpx; }
.category-name { font-size: 24rpx; color: #666; }

.zone-cards { display: flex; gap: 16rpx; margin: 0 24rpx; }
.zone-card { flex: 1; }
.zone-inner { border-radius: 24rpx; padding: 28rpx; }
.zone-label { font-size: 32rpx; font-weight: 700; color: #333; display: block; margin-bottom: 4rpx; }
.zone-desc { font-size: 22rpx; color: #999; }

.demand-list { display: flex; flex-direction: column; gap: 16rpx; }
.demand-card { background: #fff; border-radius: 24rpx; padding: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.demand-card-top { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.demand-company { font-size: 24rpx; color: #666; }
.demand-region { font-size: 22rpx; color: #999; background: #f5f5f5; padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 12rpx; }
.demand-meta { display: flex; gap: 16rpx; }
.demand-quote { font-size: 22rpx; color: #FF6B35; background: #FF6B3510; padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-views, .demand-leads { font-size: 22rpx; color: #999; }

.product-scroll { white-space: nowrap; }
.product-list-h { display: inline-flex; gap: 16rpx; padding: 4rpx 0; }
.product-card-h { width: 220rpx; background: #fff; border-radius: 24rpx; padding: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); display: flex; flex-direction: column; align-items: center; }
.product-icon-wrap { width: 72rpx; height: 72rpx; border-radius: 16rpx; background: #FF6B3510; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; }
.product-icon { font-size: 36rpx; }
.product-title { font-size: 24rpx; font-weight: 600; color: #333; text-align: center; margin-bottom: 8rpx; white-space: normal; }
.product-price { font-size: 32rpx; font-weight: 700; color: #FF6B35; }
.product-unit { font-size: 22rpx; color: #999; font-weight: 400; }
</style>