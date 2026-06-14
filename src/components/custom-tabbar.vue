<template>
  <view class="tabbar">
    <view 
      class="tabbar-item" 
      :class="{ active: current === item.key }"
      v-for="item in tabs" 
      :key="item.key"
      @tap="switchTab(item)"
    >
      <text class="tabbar-icon">{{ item.icon }}</text>
      <text class="tabbar-text">{{ item.label }}</text>
      <view v-if="item.key === 'publish'" class="publish-btn">
        <text>+</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  current: { type: String, default: 'home' }
})

const emit = defineEmits(['change'])

const tabs = [
  { key: 'home', label: '首页', icon: '🏠', path: '/pages/index/index' },
  { key: 'demand', label: '需求', icon: '📋', path: '/pages/demand/list' },
  { key: 'publish', label: '发布', icon: '', path: '/pages/demand/publish' },
  { key: 'mall', label: '商城', icon: '🛒', path: '/pages/mall/list' },
  { key: 'user', label: '我的', icon: '👤', path: '/pages/user/index' }
]

function switchTab(item) {
  emit('change', item.key)
  uni.switchTab({ url: item.path })
}
</script>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  border-top: 1rpx solid $--color-border;
  display: flex;
  z-index: $--z-index-tabbar;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 8rpx;

  &.active {
    .tabbar-icon, .tabbar-text { color: $--color-primary; }
  }
}

.tabbar-icon { font-size: 44rpx; }
.tabbar-text { font-size: $--font-size-sm; color: $--color-text-secondary; margin-top: 4rpx; }

.publish-btn {
  width: 88rpx;
  height: 88rpx;
  background: $--color-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -44rpx;

  text { color: #fff; font-size: 48rpx; font-weight: bold; }
}
</style>
