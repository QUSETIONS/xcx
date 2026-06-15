<template>
  <view class="home">
    <!-- 搜索 -->
    <view class="search-box" @tap="goSearch">
      <text class="search-icon">🔍</text>
      <text class="search-hint">搜索需求、资源、服务商...</text>
    </view>

    <!-- Banner -->
    <swiper class="banner-swiper" autoplay circular indicator-dots indicator-color="rgba(0,0,0,0.2)" indicator-active-color="#FF6B35">
      <swiper-item>
        <view class="banner banner-orange" @tap="goDemandPublish">
          <text class="banner-eyebrow">🔥 热门推荐</text>
          <text class="banner-title">需求精准匹配</text>
          <text class="banner-desc">发布需求 · 30分钟内响应</text>
          <view class="banner-action"><text>立即发布</text></view>
        </view>
      </swiper-item>
      <swiper-item>
        <view class="banner banner-purple" @tap="goMember">
          <text class="banner-eyebrow">👑 会员专区</text>
          <text class="banner-title">解锁全部功能</text>
          <text class="banner-desc">优先对接 · 精准匹配 · 专属服务</text>
          <view class="banner-action"><text>了解详情</text></view>
        </view>
      </swiper-item>
      <swiper-item>
        <view class="banner banner-green" @tap="goCampaign">
          <text class="banner-eyebrow">🎉 活动中心</text>
          <text class="banner-title">做任务赢积分</text>
          <text class="banner-desc">限时秒杀 · 新人礼包 · 邀请有奖</text>
          <view class="banner-action"><text>立即参与</text></view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 数据统计 -->
    <view class="stats-row">
      <view class="stat-box card-press stat-orange">
        <text class="stat-num">{{ todayDemands }}</text>
        <text class="stat-label">今日需求</text>
      </view>
      <view class="stat-box card-press stat-blue">
        <text class="stat-num">{{ activeLeads }}</text>
        <text class="stat-label">活跃对接</text>
      </view>
      <view class="stat-box card-press stat-green">
        <text class="stat-num">{{ totalUsers }}</text>
        <text class="stat-label">平台用户</text>
      </view>
    </view>

    <!-- 分类 -->
    <view class="section">
      <text class="section-title">资源分类</text>
      <view class="cat-grid">
        <view class="cat-item card-press" v-for="(cat, idx) in categories" :key="cat.id" @tap="goDemandByCategory(cat)">
          <view class="cat-icon-box" :class="'cat-color-' + (idx % 8)">
            <text class="cat-icon">{{ cat.icon }}</text>
          </view>
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <!-- 专区 -->
    <view class="zone-row">
      <view class="zone-box card-press zone-orange" @tap="goDemandList">
        <text class="zone-icon">🎯</text>
        <text class="zone-label">甲方专区</text>
      </view>
      <view class="zone-box card-press zone-blue" @tap="goDemandList">
        <text class="zone-icon">💼</text>
        <text class="zone-label">乙方专区</text>
      </view>
      <view class="zone-box card-press zone-green" @tap="goCommunity">
        <text class="zone-icon">💬</text>
        <text class="zone-label">社区讨论</text>
      </view>
    </view>

    <!-- 推荐需求 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">为你推荐</text>
        <text class="section-more" @tap="goDemandList">查看全部</text>
      </view>
      <view class="demand-list" v-if="hotDemands.length">
        <view class="demand-item card-press" v-for="item in hotDemands" :key="item._id" @tap="goDemandDetail(item._id)">
          <view class="demand-top">
            <text class="demand-cat-tag">{{ item.category_name }}</text>
            <text class="demand-quote-tag">{{ formatQuote(item.quote_type) }}</text>
          </view>
          <text class="demand-title">{{ item.title }}</text>
          <view class="demand-meta">
            <text class="demand-company">{{ item.company_name }}</text>
            <text class="demand-region">{{ item.region }}</text>
          </view>
          <view class="demand-bottom">
            <text class="demand-stats">👁 {{ item.view_count }}  🤝 {{ item.lead_count }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 精选服务 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">精选服务</text>
        <text class="section-more" @tap="goMallList">更多</text>
      </view>
      <view class="service-grid">
        <view class="service-item card-press" v-for="item in featuredProducts" :key="item._id" @tap="goProductDetail(item._id)">
          <view class="service-icon-box" :class="'service-color-' + (item.service_type)">
            <text class="service-icon">{{ getServiceIcon(item.service_type) }}</text>
          </view>
          <text class="service-name">{{ item.title }}</text>
          <text class="service-price">¥{{ (item.price / 100).toFixed(0) }}</text>
        </view>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { DEMAND_CATEGORIES, QUOTE_TYPES } from '@/config/constants'
import { demandService, productService } from '@/mock/service'
import { getRecommendedDemands, getRecommendedProducts } from '@/mock/smart'

const todayDemands = ref(128)
const activeLeads = ref(56)
const totalUsers = ref(1024)

const categories = ref(DEMAND_CATEGORIES.slice(0, 8))
const hotDemands = ref([])
const featuredProducts = ref([])

// 智能推荐（基于浏览历史+热度+偏好）
hotDemands.value = getRecommendedDemands(6)
featuredProducts.value = getRecommendedProducts(4)

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}
function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }

function goSearch() { uni.navigateTo({ url: '/pages/search/index' }) }
function goMember() { uni.navigateTo({ url: '/pages/member/index' }) }
function goCampaign() { uni.navigateTo({ url: '/pages/campaign/index' }) }
function goDemandList() { uni.switchTab({ url: '/pages/demand/list' }) }
function goMallList() { uni.switchTab({ url: '/pages/mall/list' }) }
function goCommunity() { uni.switchTab({ url: '/pages/community/index' }) }
function goDemandPublish() { uni.navigateTo({ url: '/pages/demand/publish' }) }
function goDemandByCategory() { uni.switchTab({ url: '/pages/demand/list' }) }
function goDemandDetail(id) { uni.navigateTo({ url: '/pages/demand/detail?id=' + id }) }
function goProductDetail(id) { uni.navigateTo({ url: '/pages/mall/detail?id=' + id }) }
</script>

<style scoped>
.home { background: #F5F6FA; padding: 16rpx 24rpx 120rpx; }

/* 搜索 */
.search-box { display: flex; align-items: center; background: #FFFFFF; border-radius: 24rpx; padding: 20rpx 24rpx; margin-bottom: 16rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-hint { font-size: 28rpx; color: rgba(0,0,0,0.35); }

/* Banner */
.banner-swiper { height: 240rpx; border-radius: 20rpx; overflow: hidden; margin-bottom: 16rpx; }
.banner { height: 100%; padding: 32rpx; display: flex; flex-direction: column; justify-content: center; }
.banner-orange { background: linear-gradient(135deg, #FF6B35, #FF9A5C); }
.banner-purple { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
.banner-green { background: linear-gradient(135deg, #10B981, #34D399); }
.banner-eyebrow { font-size: 24rpx; color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.2); padding: 4rpx 16rpx; border-radius: 8rpx; align-self: flex-start; }
.banner-title { font-size: 40rpx; font-weight: bold; color: #fff; margin: 12rpx 0; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.banner-action { background: rgba(255,255,255,0.95); border-radius: 32rpx; padding: 12rpx 32rpx; align-self: flex-start; margin-top: 16rpx; }
.banner-action text { font-size: 26rpx; color: #FF6B35; font-weight: bold; }

/* 统计 */
.stats-row { display: flex; margin-bottom: 16rpx; }
.stat-box { flex: 1; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx 0; text-align: center; margin-right: 12rpx; }
.stat-box:last-child { margin-right: 0; }
.stat-num { font-size: 40rpx; font-weight: bold; display: block; }
.stat-label { font-size: 22rpx; color: rgba(0,0,0,0.5); display: block; margin-top: 4rpx; }
.stat-orange .stat-num { color: #FF6B35; }
.stat-blue .stat-num { color: #6366F1; }
.stat-green .stat-num { color: #10B981; }

/* 分类 - 用margin替代gap */
.section { margin-bottom: 24rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-more { font-size: 24rpx; color: #FF6B35; }

.cat-grid { display: flex; flex-wrap: wrap; }
.cat-item { width: 25%; display: flex; flex-direction: column; align-items: center; padding: 12rpx 0; box-sizing: border-box; }
.cat-icon-box { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.cat-color-0 { background: rgba(255,107,53,0.12); }
.cat-color-1 { background: rgba(99,102,241,0.12); }
.cat-color-2 { background: rgba(16,185,129,0.12); }
.cat-color-3 { background: rgba(245,158,11,0.12); }
.cat-color-4 { background: rgba(59,130,246,0.12); }
.cat-color-5 { background: rgba(236,72,153,0.12); }
.cat-color-6 { background: rgba(139,92,246,0.12); }
.cat-color-7 { background: rgba(6,182,212,0.12); }
.cat-icon { font-size: 36rpx; }
.cat-name { font-size: 22rpx; color: rgba(0,0,0,0.65); }

/* 专区 */
.zone-row { display: flex; margin-bottom: 16rpx; }
.zone-box { flex: 1; padding: 20rpx; border-radius: 16rpx; text-align: center; margin-right: 12rpx; background: #FFFFFF; }
.zone-box:last-child { margin-right: 0; }
.zone-orange { border-left: 4rpx solid #FF6B35; }
.zone-blue { border-left: 4rpx solid #6366F1; }
.zone-green { border-left: 4rpx solid #10B981; }
.zone-icon { font-size: 32rpx; display: block; margin-bottom: 8rpx; }
.zone-label { font-size: 24rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

/* 需求卡片 */
.demand-list { display: flex; flex-direction: column; }
.demand-item { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.demand-top { display: flex; margin-bottom: 12rpx; }
.demand-cat-tag { font-size: 20rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 8rpx; }
.demand-quote-tag { font-size: 20rpx; color: #6366F1; background: rgba(99,102,241,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; }
.demand-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.demand-meta { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.demand-company { font-size: 24rpx; color: rgba(0,0,0,0.6); }
.demand-region { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.demand-bottom { display: flex; }
.demand-stats { font-size: 22rpx; color: rgba(0,0,0,0.5); }

/* 服务卡片 */
.service-grid { display: flex; flex-wrap: wrap; }
.service-item { width: 50%; box-sizing: border-box; padding-right: 6rpx; padding-bottom: 12rpx; }
.service-item:nth-child(2n) { padding-right: 0; padding-left: 6rpx; }
.service-icon-box { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.service-color-member { background: rgba(255,107,53,0.1); }
.service-color-linker { background: rgba(99,102,241,0.1); }
.service-color-survey { background: rgba(16,185,129,0.1); }
.service-color-resource_pack { background: rgba(245,158,11,0.1); }
.service-color-certification { background: rgba(236,72,153,0.1); }
.service-icon { font-size: 36rpx; }
.service-name { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.service-price { font-size: 30rpx; font-weight: bold; color: #FF6B35; }
</style>