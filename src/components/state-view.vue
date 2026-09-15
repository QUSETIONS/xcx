<template>
  <view class="state-view">
    <!-- 加载中：骨架屏 -->
    <skeleton v-if="status === 'loading'" :type="skeletonType" :rows="skeletonRows" />

    <!-- 错误：可重试 -->
    <view v-else-if="status === 'error'" class="error-box">
      <view class="state-illustration state-illustration-error"><text>!</text></view>
      <text class="error-text">{{ errorText || t('common.loadFailed') }}</text>
      <view class="retry-btn" @tap="$emit('retry')"><text>{{ t('common.retry') }}</text></view>
    </view>

    <!-- 空：可引导 -->
    <view v-else-if="status === 'empty'" class="empty-box">
      <view class="state-illustration"><image :src="emptyIcon" mode="aspectFit" /></view>
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
  emptyIcon: { type: String, default: '/static/icons/file.svg' },
  actionText: { type: String, default: '' }
})

defineEmits(['retry', 'action'])
</script>

<style scoped>
.state-view { width: 100%; }

.error-box, .empty-box { display: flex; flex-direction: column; align-items: center; padding: 96rpx 32rpx; }
.state-illustration { display: flex; align-items: center; justify-content: center; width: 88rpx; height: 88rpx; margin-bottom: 24rpx; border: 1rpx solid #DDE3F1; border-radius: 28rpx; color: #6876D8; background: #F1F3FF; font-size: 38rpx; font-weight: 700; line-height: 1; }
.state-illustration image { width: 42rpx; height: 42rpx; }
.state-illustration-error { color: #D87E68; border-color: #F1DED7; background: #FFF3EF; }
.error-text, .empty-text { font-size: 27rpx; color: #7D899D; text-align: center; margin-bottom: 28rpx; }

.retry-btn { border: 1rpx solid #CBD3EC; border-radius: 14rpx; padding: 14rpx 38rpx; background: #F4F6FF; }
.retry-btn text { font-size: 25rpx; color: #5E6DD3; font-weight: 650; }

.empty-btn { background: #6573DC; border-radius: 14rpx; padding: 16rpx 42rpx; box-shadow: 0 8rpx 16rpx rgba(101,115,220,.18); }
.empty-btn text { font-size: 26rpx; color: #FFFFFF; font-weight: 650; }
</style>
