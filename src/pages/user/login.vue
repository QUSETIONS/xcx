<template>
  <view class="login-page">
    <view class="login-hero">
      <text class="login-logo">🚀</text>
      <text class="login-title">企动库</text>
      <text class="login-subtitle">企业资源对接平台</text>
    </view>
    <view class="login-actions">
      <button class="btn-glow" @tap="doLogin">一键登录</button>
      <button class="btn-glow" style="background: $gradient-secondary; box-shadow: $shadow-glow-secondary;" @tap="doAdminLogin">管理员登录</button>
      <text class="login-tip">Demo模式，点击即可体验</text>
    </view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
async function doLogin() {
  await userStore.demoLogin('user')
  uni.switchTab({ url: '/pages/index/index' })
}
async function doAdminLogin() {
  await userStore.demoLogin('admin')
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.login-page { min-height: 100vh; background: $bg-primary; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: $space-8; }
.login-hero { text-align: center; margin-bottom: $space-10; }
.login-logo { font-size: 120rpx; display: block; margin-bottom: $space-4; }
.login-title { font-size: $font-3xl; font-weight: $weight-black; color: $text-primary; display: block; margin-bottom: $space-2; }
.login-subtitle { font-size: $font-md; color: $text-tertiary; }
.login-actions { width: 100%; display: flex; flex-direction: column; gap: $space-3; }
.login-actions .btn-glow { width: 100%; }
.login-tip { text-align: center; font-size: $font-sm; color: $text-tertiary; margin-top: $space-4; }
</style>