<template>
  <view class="state-view">
    <!-- 加载中：骨架屏 -->
    <skeleton v-if="status === 'loading'" :type="skeletonType" :rows="skeletonRows" />

    <!-- 错误：可重试 -->
    <view v-else-if="status === 'error'" class="error-box">
      <text class="error-icon">😕</text>
      <text class="error-text">{{ errorText || t('common.loadFailed') }}</text>
      <view class="retry-btn" @tap="$emit('retry')"><text>{{ t('common.retry') }}</text></view>
    </view>

    <!-- 空：可引导 -->
    <view v-else-if="status === 'empty'" class="empty-box">
      <text class="empty-icon">{{ emptyIcon }}</text>
      <text class="empty-text">{{ emptyText || t('common.empty') }}</text>
      <view class="empty-btn" v-if="actionText" @tap="$emit('action')"><text>{{ actionText }}</text></view>
    </view>
  </view>
</template>

<script setup>
import skeleton from '@/components/skeleton.vue'
import { t } from '@/i18n'

const props = defineProps({
  status: { type: String, default: '' }, // loading / error / empty / success
  skeletonType: { type: String, default: 'list' },
  skeletonRows: { type: Number, default: 5 },
  errorText: { type: String, default: '' },
  emptyText: { type: String, default: '' },
  emptyIcon: { type: String, default: '📭' },
  emptyText: { type: String, default: '暂无数据' },
  actionText: { type: String, default: '' }
})

defineEmits(['retry', 'action'])
</script>

<style scoped>
.state-view { width: 100%; }

.error-box, .empty-box { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.error-icon, .empty-icon { font-size: 96rpx; margin-bottom: 24rpx; opacity: 0.6; }
.error-text, .empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); margin-bottom: 32rpx; }

.retry-btn { border: 1rpx solid #FF6B35; border-radius: 32rpx; padding: 16rpx 48rpx; }
.retry-btn text { font-size: 26rpx; color: #FF6B35; font-weight: bold; }

.empty-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 18rpx 56rpx; }
.empty-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
</style>