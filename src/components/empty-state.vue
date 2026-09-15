<template>
  <view class="empty-wrap">
    <view class="empty-icon"><image :src="icon" mode="aspectFit" /></view>
    <text class="empty-text">{{ text || t('common.empty') }}</text>
    <view class="empty-action" v-if="actionText" @tap="$emit('action')">
      <text>{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup>
import { t } from '@/i18n'
defineProps({
  icon: { type: String, default: '/static/icons/file.svg' },
  text: { type: String, default: '' },
  actionText: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<style scoped>
.empty-wrap { display: flex; flex-direction: column; align-items: center; padding: 96rpx 32rpx; }
.empty-icon { display: flex; align-items: center; justify-content: center; width: 80rpx; height: 80rpx; margin-bottom: 20rpx; border: 1rpx solid #D9E7F7; border-radius: 12rpx; color: #1677FF; background: #E8F3FF; font-size: 34rpx; font-weight: 700; line-height: 1; }
.empty-icon image { width: 40rpx; height: 40rpx; }
.empty-text { font-size: 27rpx; color: #646A73; text-align: center; margin-bottom: 24rpx; }
.empty-action { background: #1677FF; border-radius: 8rpx; padding: 14rpx 34rpx; box-shadow: 0 4rpx 12rpx rgba(22,119,255,.18); }
.empty-action text { font-size: 26rpx; color: #FFFFFF; font-weight: 650; }
</style>
