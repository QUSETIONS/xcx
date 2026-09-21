<template>
  <view class="tabbar">
    <view class="tabbar-item" :class="{ active: current === item.key }" v-for="item in tabs" :key="item.key" @tap="switchTab(item)">
      <view v-if="current === item.key" class="tabbar-active-marker" />
      <image class="tabbar-icon" :src="current === item.key ? item.activeIcon : item.icon" mode="aspectFit" />
      <text class="tabbar-text">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  current: { type: String, default: 'home' }
})

const tabs = [
  { key: 'demand', label: '需求', icon: '/static/icons/tab/list.svg', activeIcon: '/static/icons/tab/list-active.svg', path: '/pages/demand/list', isTab: true },
  { key: 'network', label: '人脉', icon: '/static/icons/tab/community.svg', activeIcon: '/static/icons/tab/community-active.svg', path: '/pages/network/index', isTab: true },
  { key: 'home', label: '首页', icon: '/static/icons/tab/home.svg', activeIcon: '/static/icons/tab/home-active.svg', path: '/pages/index/index', isTab: true },
  { key: 'information', label: '资讯', icon: '/static/icons/file.svg', activeIcon: '/static/icons/file.svg', path: '/pages/information/index', isTab: true },
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
  height: 98rpx; padding-top: 2rpx; padding-bottom: env(safe-area-inset-bottom);
  background: rgba(252,250,245,.985); border-top: 1rpx solid rgba(23,35,45,.13);
  display: flex; z-index: 300; box-shadow: none;
}

@media (min-width: 561px) {
  .tabbar {
    left:calc((100vw - var(--h5-shell-width, 720px)) / 2);
    right:auto;
    width:var(--h5-shell-width, 720px);
    transform:none;
  }
  .tabbar-icon { width:24px; height:24px; flex-basis:24px; }
  .tabbar-text { margin-top:4px; font-size:12px; }
}
.tabbar-item {
  position: relative; min-width: 0; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.tabbar-active-marker { position: absolute; top: -2rpx; width: 34rpx; height: 3rpx; background: #B49460; }
.tabbar-icon { display: block; width: 38rpx; height: 38rpx; flex: 0 0 38rpx; object-fit: contain; object-position: center; opacity: .78; }
.tabbar-text { font-size: 19rpx; color: #968F83; margin-top: 6rpx; letter-spacing: .08em; }
.tabbar-item.active .tabbar-icon { opacity: 1; }
.tabbar-item.active .tabbar-text { color: #5A2530; font-weight: 600; }
</style>
