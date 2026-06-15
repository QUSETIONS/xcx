<template>
  <view class="skeleton-wrap" :class="type">
    <!-- 列表骨架 -->
    <block v-if="type === 'list'">
      <view class="sk-item" v-for="i in rows" :key="i">
        <view class="sk-avatar sk-shimmer"></view>
        <view class="sk-lines">
          <view class="sk-line sk-line-md sk-shimmer"></view>
          <view class="sk-line sk-line-sm sk-shimmer"></view>
        </view>
      </view>
    </block>

    <!-- 卡片骨架 -->
    <block v-else-if="type === 'card'">
      <view class="sk-card" v-for="i in rows" :key="i">
        <view class="sk-line sk-line-lg sk-shimmer"></view>
        <view class="sk-line sk-line-full sk-shimmer"></view>
        <view class="sk-line sk-line-sm sk-shimmer"></view>
      </view>
    </block>

    <!-- 详情骨架 -->
    <block v-else-if="type === 'detail'">
      <view class="sk-detail">
        <view class="sk-block sk-shimmer"></view>
        <view class="sk-line sk-line-lg sk-shimmer"></view>
        <view class="sk-line sk-line-full sk-shimmer"></view>
        <view class="sk-line sk-line-full sk-shimmer"></view>
        <view class="sk-line sk-line-md sk-shimmer"></view>
      </view>
    </block>
  </view>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'list' }, // list / card / detail
  rows: { type: Number, default: 5 }
})
</script>

<style scoped>
.skeleton-wrap { padding: 24rpx; }

.sk-shimmer {
  background: linear-gradient(90deg, #EEF0F4 25%, #F6F7F9 37%, #EEF0F4 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

.sk-item { display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.sk-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; margin-right: 20rpx; flex-shrink: 0; }
.sk-lines { flex: 1; }
.sk-line { height: 24rpx; border-radius: 8rpx; margin-bottom: 16rpx; }
.sk-line:last-child { margin-bottom: 0; }
.sk-line-sm { width: 40%; }
.sk-line-md { width: 60%; }
.sk-line-lg { width: 80%; height: 32rpx; }
.sk-line-full { width: 100%; }

.sk-card { background: #FFFFFF; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }

.sk-detail { background: #FFFFFF; border-radius: 16rpx; padding: 24rpx; }
.sk-block { width: 100%; height: 240rpx; border-radius: 16rpx; margin-bottom: 24rpx; }
</style>