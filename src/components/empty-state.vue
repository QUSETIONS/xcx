<template>
  <view class="empty-wrap">
    <text class="empty-icon">{{ icon }}</text>
    <text class="empty-text">{{ text }}</text>
    <view class="empty-action" v-if="actionText" @tap="$emit('action')">
      <text>{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  text: { type: String, default: '暂无数据' },
  actionText: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<style scoped>
.empty-wrap { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; opacity: 0.6; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); margin-bottom: 32rpx; }
.empty-action { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 18rpx 56rpx; }
.empty-action text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
</style>