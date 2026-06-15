<template>
  <view class="tabbar">
    <view class="tabbar-item" :class="{ active: current === item.key }" v-for="item in tabs" :key="item.key" @tap="switchTab(item)">
      <view v-if="item.key === 'publish'" class="publish-btn">
        <text class="publish-icon">✏️</text>
      </view>
      <template v-else>
        <text class="tabbar-icon">{{ item.icon }}</text>
        <text class="tabbar-text">{{ item.label }}</text>
      </template>
    </view>
  </view>
</template>

<script setup>
defineProps({
  current: { type: String, default: 'home' }
})

const tabs = [
  { key: 'home', label: '首页', icon: '🏠', path: '/pages/index/index', isTab: true },
  { key: 'demand', label: '需求', icon: '📋', path: '/pages/demand/list', isTab: true },
  { key: 'community', label: '社区', icon: '💬', path: '/pages/community/index', isTab: true },
  { key: 'publish', label: '发布', icon: '', path: '/pages/demand/publish', isTab: false },
  { key: 'mall', label: '商城', icon: '🛒', path: '/pages/mall/list', isTab: true },
  { key: 'user', label: '我的', icon: '👤', path: '/pages/user/index', isTab: true }
]

function switchTab(item) {
  if (item.isTab) {
    uni.switchTab({ url: item.path })
  } else {
    uni.navigateTo({ url: item.path })
  }
}
</script>

<style lang="scss" scoped>
.tabbar {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 110rpx; padding-bottom: env(safe-area-inset-bottom);
  background: #12121A; border-top: 1rpx solid rgba(255,255,255,0.08);
  display: flex; z-index: 300;
}
.tabbar-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.tabbar-item.active .tabbar-text { color: #FF6B35; }
.tabbar-icon { font-size: 40rpx; }
.tabbar-text { font-size: 20rpx; color: rgba(255,255,255,0.45); margin-top: 4rpx; }
.publish-btn {
  width: 80rpx; height: 80rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C);
  border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: -20rpx;
  box-shadow: 0 4rpx 16rpx rgba(255,107,53,0.4);
}
.publish-icon { font-size: 32rpx; }
</style>