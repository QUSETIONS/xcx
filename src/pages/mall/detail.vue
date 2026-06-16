<template>
  <view class="detail-page" v-if="product">
    <!-- 服务卡片 -->
    <view class="hero-card glass-card">
      <view class="hero-icon-box" :style="{ background: getIconBg(product.service_type) }">
        <text class="hero-icon">{{ getServiceIcon(product.service_type) }}</text>
      </view>
      <text class="hero-type">{{ serviceTypes[product.service_type] }}</text>
      <text class="hero-title">{{ product.title }}</text>
      <view class="hero-sales"><text>{{ product.sale_count }}人已购买</text></view>
    </view>

    <!-- 价格卡片 -->
    <view class="price-card glass-card">
      <view class="price-main">
        <text class="price-current gradient-text">¥{{ (product.price / 100).toFixed(2) }}</text>
        <text class="price-unit">/{{ product.unit }}</text>
      </view>
      <view class="price-row"><text class="price-label">原价</text><text class="price-market">¥{{ (product.market_price / 100).toFixed(2) }}</text></view>
      <view class="price-row"><text class="price-label">节省</text><text class="price-save">¥{{ ((product.market_price - product.price) / 100).toFixed(0) }}</text></view>
    </view>

    <!-- 服务权益 -->
    <view class="benefits-card glass-card">
      <text class="card-label">服务权益</text>
      <view class="benefit-list">
        <view class="benefit-item" v-for="(b, i) in getBenefits(product.service_type)" :key="i">
          <view class="benefit-check"><text>✓</text></view>
          <text class="benefit-text">{{ b }}</text>
        </view>
      </view>
    </view>

    <!-- 购买须知 -->
    <view class="notice-card glass-card">
      <text class="card-label">购买须知</text>
      <text class="notice-item">• 本服务为虚拟商品，购买后即时生效</text>
      <text class="notice-item">• Demo阶段为模拟购买，不产生真实交易</text>
      <text class="notice-item">• 服务有效期内可享受对应权益</text>
    </view>

    <!-- 商品详情 -->
    <view class="desc-card glass-card">
      <text class="card-label">商品详情</text>
      <rich-text class="desc-content" :nodes="product.description_rich" />
    </view>

    <!-- 底部操作 -->
    <view class="action-bar glass-card-strong">
      <view class="action-btn" @tap="toggleFavorite"><text class="action-icon">{{ isFavorited ? '❤️' : '🤍' }}</text><text class="action-text">收藏</text></view>
      <view class="action-btn" @tap="share"><text class="action-icon">🔗</text><text class="action-text">分享</text></view>
      <view class="action-btn cart-entry" @tap="goCart"><text class="action-icon">🛒</text><text class="action-text">购物车</text></view>
      <view class="add-cart-btn" @tap="addToCart"><text>加入购物车</text></view>
      <button class="btn-glow" @tap="buyNow"><text>立即购买</text></button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { SERVICE_TYPES } from '@/config/constants'
import { productService, favoriteService, cartService } from '@/mock/service'
import { trackBrowse } from '@/mock/smart'
import { hapticLight, toastSuccess } from '@/utils/feedback'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.mallDetail')

const productId = ref('')
const product = ref(null)
const serviceTypes = SERVICE_TYPES
const isFavorited = ref(false)

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function getIconBg(type) {
  const map = {
    member: 'linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,107,53,0.08))',
    linker: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))',
    survey: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.08))',
    resource_pack: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))',
    certification: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(236,72,153,0.08))'
  }
  return map[type] || map.resource_pack
}

function getBenefits(type) {
  const map = {
    member: ['全部功能畅享', '专属客服支持', '优先对接服务', '行业报告下载', '会员身份标识'],
    linker: ['精准需求匹配', '专属链接官服务', '每周推荐3次', '进度实时追踪', '不满意可更换'],
    survey: ['调研方案设计', '数据采集分析', '完整报告输出', '对标分析服务', '7天内交付'],
    resource_pack: ['精选方案资源', '持续更新推送', '下载即用', '定制指导服务', '售后答疑'],
    certification: ['官方认证标识', '优先展示推荐', '信任背书支持', '运营指导服务', '年度审核续期']
  }
  return map[type] || ['标准服务内容', '客服支持']
}

function loadDetail() {
  product.value = productService.detail(productId.value)
  if (product.value) trackBrowse('product', productId.value, product.value)
  isFavorited.value = favoriteService.check({ userId: 'demo_user_001', targetType: 'product', targetId: productId.value })
}

function toggleFavorite() {
  const r = favoriteService.toggle({ userId: 'demo_user_001', targetType: 'product', targetId: productId.value })
  isFavorited.value = r.isFavorited
  if (r.isFavorited) hapticLight()
  uni.showToast({ title: r.isFavorited ? '已收藏' : '已取消', icon: 'none' })
}

function share() { uni.showModal({ title: '分享商品', content: '点击右上角「...」分享', showCancel: false }) }
function buyNow() { uni.navigateTo({ url: `/pages/mall/order-confirm?id=${productId.value}` }) }
function addToCart() {
  cartService.add(product.value)
  hapticLight()
  toastSuccess('已加入购物车')
}
function goCart() { uni.navigateTo({ url: '/pages/cart/index' }) }

onLoad((q) => { productId.value = q.id; loadDetail() })
</script>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: $bg-primary; padding: $space-4; padding-bottom: 180rpx; }

.hero-card { padding: $space-6; margin-bottom: $space-3; display: flex; flex-direction: column; align-items: center; }
.hero-icon-box { width: 120rpx; height: 120rpx; border-radius: $radius-xl; display: flex; align-items: center; justify-content: center; margin-bottom: $space-3; }
.hero-icon { font-size: 56rpx; }
.hero-type { font-size: $font-sm; color: $text-tertiary; margin-bottom: $space-2; }
.hero-title { font-size: $font-xl; font-weight: $weight-black; color: $text-primary; text-align: center; margin-bottom: $space-3; }
.hero-sales { background: rgba(16,185,129,0.12); border-radius: $radius-full; padding: 8rpx 24rpx; }
.hero-sales text { font-size: $font-xs; color: $color-success; }

.price-card, .benefits-card, .notice-card, .desc-card { padding: $space-4; margin-bottom: $space-3; }
.card-label { font-size: $font-base; font-weight: $weight-semibold; color: $text-secondary; display: block; margin-bottom: $space-3; }

.price-main { display: flex; align-items: baseline; margin-bottom: $space-3; }
.price-current { font-size: $font-2xl; font-weight: $weight-black; }
.price-unit { font-size: $font-sm; color: $text-tertiary; }

.price-row { display: flex; justify-content: space-between; padding: $space-1 0; }
.price-label { font-size: $font-sm; color: $text-tertiary; }
.price-market { font-size: $font-sm; color: $text-tertiary; text-decoration: line-through; }
.price-save { font-size: $font-sm; color: $color-success; font-weight: $weight-semibold; }

.benefit-list { display: flex; flex-direction: column; }
.benefit-item { display: flex; align-items: center; }
.benefit-check { width: 32rpx; height: 32rpx; background: rgba(16,185,129,0.15); border-radius: $radius-sm; display: flex; align-items: center; justify-content: center; }
.benefit-check text { font-size: 20rpx; color: $color-success; }
.benefit-text { font-size: $font-sm; color: $text-secondary; }

.notice-item { font-size: $font-sm; color: $text-tertiary; display: block; margin-bottom: $space-2; line-height: 1.5; }

.desc-content { font-size: $font-base; color: $text-secondary; line-height: 1.7; }

.action-bar { position: fixed; bottom: $space-4; left: $space-4; right: $space-4; display: flex; justify-content: space-between; align-items: center; padding: $space-3 $space-4; }
.action-btn { display: flex; flex-direction: column; align-items: center; }
.action-icon { font-size: 36rpx; }
.action-text { font-size: $font-xs; color: $text-tertiary; }
.add-cart-btn { background: rgba(255,154,92,0.95); border-radius: $radius-full; padding: 18rpx 20rpx; }
.add-cart-btn text { font-size: $font-sm; color: #FFFFFF; font-weight: $weight-semibold; }
.btn-glow { flex: 1; margin-left: $space-2; }
</style>