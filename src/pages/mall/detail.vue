<template>
  <view class="detail-page" v-if="product">
    <view class="cover-box">
      <text class="cover-icon">{{ getServiceIcon(product.service_type) }}</text>
      <text class="cover-label">{{ serviceTypes[product.service_type] }}</text>
    </view>

    <view class="price-card">
      <text class="price-current">¥{{ (product.price / 100).toFixed(2) }}</text>
      <text class="price-market">¥{{ (product.market_price / 100).toFixed(2) }}</text>
      <text class="price-unit">/{{ product.unit }}</text>
      <text class="price-sales">{{ product.sale_count }}人已购</text>
    </view>

    <view class="title-card">
      <text class="title-text">{{ product.title }}</text>
    </view>

    <view class="benefits-card">
      <text class="card-label">服务权益</text>
      <view class="benefit-item" v-for="(b, i) in getBenefits(product.service_type)" :key="i">
        <text class="benefit-check">✓</text>
        <text class="benefit-text">{{ b }}</text>
      </view>
    </view>

    <view class="notice-card">
      <text class="card-label">购买须知</text>
      <text class="notice-item">• 本服务为虚拟商品，购买后即时生效</text>
      <text class="notice-item">• Demo阶段为模拟购买，不产生真实交易</text>
      <text class="notice-item">• 服务有效期内可享受对应权益</text>
    </view>

    <view class="desc-card">
      <text class="card-label">商品详情</text>
      <rich-text class="desc-content" :nodes="product.description_rich" />
    </view>

    <view class="action-bar">
      <view class="action-item" @tap="toggleFavorite">
        <text class="action-icon">{{ isFavorited ? '❤️' : '🤍' }}</text>
        <text class="action-text">收藏</text>
      </view>
      <view class="action-item" @tap="shareProduct">
        <text class="action-icon">🔗</text>
        <text class="action-text">分享</text>
      </view>
      <view class="buy-btn" @tap="buyNow"><text>立即购买</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { SERVICE_TYPES } from '@/config/constants'
import { productService, favoriteService } from '@/mock/service'

const productId = ref('')
const product = ref(null)
const serviceTypes = SERVICE_TYPES
const isFavorited = ref(false)

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function getBenefits(type) {
  const map = {
    member: ['全部功能畅享', '专属客服', '优先对接', '行业报告', '会员标识'],
    linker: ['精准匹配', '专属链接官', '每周推荐3次', '进度追踪', '不满意可更换'],
    survey: ['方案设计', '数据采集', '报告输出', '对标分析', '7天交付'],
    resource_pack: ['精选方案', '持续更新', '下载即用', '定制指导', '售后答疑'],
    certification: ['官方认证', '优先展示', '信任背书', '运营支持', '年度审核']
  }
  return map[type] || ['标准服务', '客服支持']
}

function loadDetail() {
  product.value = productService.detail(productId.value)
  isFavorited.value = favoriteService.check({ userId: 'demo_user_001', targetType: 'product', targetId: productId.value })
}

function toggleFavorite() {
  const r = favoriteService.toggle({ userId: 'demo_user_001', targetType: 'product', targetId: productId.value })
  isFavorited.value = r.isFavorited
  uni.showToast({ title: r.isFavorited ? '已收藏' : '已取消', icon: 'none' })
}

function shareProduct() { uni.showModal({ title: '分享商品', content: '点击右上角「...」分享', showCancel: false }) }

function buyNow() { uni.navigateTo({ url: `/pages/mall/order-confirm?id=${productId.value}` }) }

onLoad((q) => { productId.value = q.id; loadDetail() })
</script>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 140rpx; }
.cover-box { height: 300rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #FF6B3540, #FF6B3520); }
.cover-icon { font-size: 100rpx; }
.cover-label { font-size: 28rpx; color: #FF6B35; font-weight: 600; margin-top: 12rpx; }
.price-card { display: flex; align-items: center; background: #fff; border-radius: 20rpx; padding: 24rpx; margin: 16rpx 24rpx; }
.price-current { font-size: 40rpx; font-weight: 700; color: #FF6B35; }
.price-market { font-size: 24rpx; color: #ccc; text-decoration: line-through; margin-left: 8rpx; }
.price-unit { font-size: 24rpx; color: #999; }
.price-sales { margin-left: auto; font-size: 24rpx; color: #999; }
.title-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin: 16rpx 24rpx; }
.title-text { font-size: 32rpx; font-weight: 700; color: #333; }
.benefits-card, .notice-card, .desc-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin: 16rpx 24rpx; }
.card-label { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 16rpx; }
.benefit-item { display: flex; align-items: flex-start; margin-bottom: 10rpx; }
.benefit-check { color: #FF6B35; font-weight: 700; margin-right: 12rpx; font-size: 28rpx; }
.benefit-text { font-size: 26rpx; color: #666; }
.notice-item { font-size: 24rpx; color: #999; display: block; margin-bottom: 8rpx; }
.desc-content { font-size: 28rpx; color: #666; line-height: 1.7; }
.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; padding: 16rpx 24rpx; background: #fff; gap: 16rpx; }
.action-item { display: flex; flex-direction: column; align-items: center; padding: 8rpx 16rpx; }
.action-icon { font-size: 36rpx; }
.action-text { font-size: 22rpx; color: #666; }
.buy-btn { flex: 1; background: #FF6B35; color: #fff; border-radius: 48rpx; padding: 24rpx; text-align: center; font-size: 32rpx; font-weight: 600; }
</style>