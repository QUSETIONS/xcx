<template>
  <view class="detail-page" v-if="resource">
    <view class="info-card">
      <text class="info-title">{{ resource.title }}</text>
      <view class="info-tags">
        <text class="tag">{{ resource.category_name }}</text>
        <text class="tag">{{ resource.file_type }}</text>
        <text class="tag">{{ resource.file_size }}</text>
      </view>
    </view>
    <view class="stats-card">
      <text>{{ resource.view_count }}浏览 · {{ resource.download_count }}下载 · {{ resource.favorite_count }}收藏</text>
    </view>
    <view class="desc-card">
      <text class="card-label">资料简介</text>
      <text class="desc-text">{{ resource.summary }}</text>
    </view>
    <view class="action-bar">
      <view class="action-btn" :class="{ free: resource.is_free }" @tap="download">
        <text>{{ resource.is_free ? '免费下载' : `¥${(resource.price/100).toFixed(0)} 获取` }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { resourceService } from '@/mock/service'

const resource = ref(null)
onLoad((q) => { resource.value = resourceService.detail(q.id) })
function download() { uni.showToast({ title: 'Demo：下载功能暂未实现', icon: 'none' }) }
</script>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #f5f5f5; padding: 24rpx; padding-bottom: 140rpx; }
.info-card, .stats-card, .desc-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; }
.info-title { font-size: 34rpx; font-weight: 700; color: #333; display: block; margin-bottom: 12rpx; }
.info-tags { display: flex; gap: 8rpx; }
.tag { font-size: 22rpx; color: #666; background: #f5f5f5; padding: 6rpx 16rpx; border-radius: 8rpx; }
.stats-card text { font-size: 24rpx; color: #999; }
.card-label { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 12rpx; }
.desc-text { font-size: 28rpx; color: #666; line-height: 1.7; }
.action-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 24rpx; background: #fff; }
.action-btn { background: #FF6B35; color: #fff; border-radius: 48rpx; padding: 24rpx; text-align: center; font-size: 32rpx; font-weight: 600; }
.action-btn.free { background: #52C41A; }
</style>