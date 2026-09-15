<template>
  <view class="page" :style="{ paddingTop: noNav ? '0' : `${navHeight}px` }">
    <!-- 自定义导航栏 -->
    <view v-if="!noNav" class="nav" :style="{ paddingTop: `${statusBarHeight}px` }">
      <view class="nav-bar">
        <view class="nav-left" @tap="goBack">
          <text v-if="canBack" class="nav-back" aria-label="返回">‹</text>
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
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
  background: $bg-primary;
}

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: $z-sticky;
  border-bottom: 1rpx solid var(--line-soft);
  background: rgba(252, 251, 248, .985);
}

.nav-bar {
  height: 84rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.nav-left { display: flex; align-items: center; width: 72rpx; min-height: 64rpx; }
.nav-back { color: $text-primary; font-family: 'Songti SC', 'Noto Serif CJK SC', serif; font-size: 54rpx; font-weight: 400; line-height: .8; }
.nav-title { flex: 1; overflow: hidden; color: $text-primary; font-family: 'Songti SC', 'Noto Serif CJK SC', serif; font-size: 29rpx; font-weight: 400; letter-spacing: -.02em; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.nav-right { display: flex; align-items: center; justify-content: flex-end; width: 72rpx; min-height: 64rpx; text-align: right; }

.safe-bottom { height: env(safe-area-inset-bottom); }
</style>
