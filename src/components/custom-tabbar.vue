<template>
  <view class="tabbar">
    <view class="tabbar-item" :class="{ active: current === item.key }" v-for="item in tabs" :key="item.key" @tap="switchTab(item)">
      <view v-if="item.key === 'publish'" class="publish-btn">
        <image class="publish-icon" src="/static/icons/edit.svg" mode="aspectFit"/>
      </view>
      <template v-else>
        <image class="tabbar-icon" :src="current === item.key ? item.activeIcon : item.icon" mode="aspectFit"/>
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
  { key: 'home', label: '首页', icon: '/static/icons/tab/home.svg', activeIcon: '/static/icons/tab/home-active.svg', path: '/pages/index/index', isTab: true },
  { key: 'demand', label: '需求', icon: '/static/icons/tab/list.svg', activeIcon: '/static/icons/tab/list-active.svg', path: '/pages/demand/list', isTab: true },
  { key: 'community', label: '社区', icon: '/static/icons/tab/community.svg', activeIcon: '/static/icons/tab/community-active.svg', path: '/pages/community/index', isTab: true },
  { key: 'publish', label: '发布', icon: '', path: '/pages/demand/publish', isTab: false },
  { key: 'mall', label: '商城', icon: '/static/icons/tab/mall.svg', activeIcon: '/static/icons/tab/mall-active.svg', path: '/pages/mall/list', isTab: true },
  { key: 'user', label: '我的', icon: '/static/icons/tab/user.svg', activeIcon: '/static/icons/tab/user-active.svg', path: '/pages/user/index', isTab: true }
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
  background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06);
  display: flex; z-index: 300;
}
.tabbar-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.tabbar-item.active .tabbar-text { color: #FF6B35; }
.tabbar-icon { width: 44rpx; height: 44rpx; }
.tabbar-text { font-size: 22rpx; color: rgba(0,0,0,0.5); margin-top: 6rpx; }
.publish-btn {
  width: 88rpx; height: 88rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C);
  border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: -24rpx;
  box-shadow: 0 6rpx 20rpx rgba(255,107,53,0.35);
}
.publish-icon { width: 36rpx; height: 36rpx; }
</style>