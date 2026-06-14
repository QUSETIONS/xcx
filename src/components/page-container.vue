<template>
  <view class="page" :style="{ paddingTop: noNav ? '0' : `${navHeight}px` }">
    <!-- 自定义导航栏 -->
    <view v-if="!noNav" class="nav" :style="{ paddingTop: `${statusBarHeight}px` }">
      <view class="nav-bar">
        <view class="nav-left" @tap="goBack">
          <text v-if="canBack" class="nav-back">←</text>
        </view>
        <text class="nav-title">{{ title }}</text>
        <view class="nav-right">
          <slot name="nav-right" />
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="page-body">
      <slot />
    </view>

    <!-- 底部安全区 -->
    <view v-if="safeBottom" class="safe-bottom" />
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  noNav: { type: Boolean, default: false },
  safeBottom: { type: Boolean, default: false }
})

const pages = getCurrentPages()
const canBack = computed(() => pages.length > 1)

const sysInfo = uni.getSystemInfoSync()
const statusBarHeight = sysInfo.statusBarHeight || 0
const navHeight = statusBarHeight + 44

function goBack() {
  if (canBack.value) {
    uni.navigateBack()
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $--color-bg;
}

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: $--z-index-nav;
  background: #fff;
}

.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.nav-left { width: 80rpx; }
.nav-back { font-size: 40rpx; color: $--color-text-primary; }
.nav-title { flex: 1; text-align: center; font-size: $--font-size-lg; font-weight: 600; color: $--color-text-primary; }
.nav-right { width: 80rpx; text-align: right; }

.safe-bottom { height: env(safe-area-inset-bottom); }
</style>
