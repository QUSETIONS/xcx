<template>
  <view class="user-page">
    <!-- 用户信息头部 -->
    <view class="user-hero">
      <view class="user-avatar">
        <text class="avatar-text">{{ userInfo.nickname?.[0] || 'U' }}</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo.nickname || '未登录' }}</text>
        <text class="user-company">{{ userInfo.company || '' }}</text>
      </view>
      <view v-if="isAdmin" class="admin-badge" @tap="toggleAdmin"><text>管理员</text></view>
    </view>

    <!-- 功能入口 Bento -->
    <view class="menu-bento">
      <view class="menu-item glass-card" @tap="goPage('/pages/user/my-demands')">
        <text class="menu-icon">📋</text>
        <text class="menu-label">我的需求</text>
      </view>
      <view class="menu-item glass-card" @tap="goPage('/pages/user/my-leads')">
        <text class="menu-icon">🤝</text>
        <text class="menu-label">我的对接</text>
      </view>
      <view class="menu-item glass-card" @tap="goPage('/pages/user/my-orders')">
        <text class="menu-icon">📦</text>
        <text class="menu-label">我的订单</text>
      </view>
      <view class="menu-item glass-card" @tap="goPage('/pages/user/my-favorites')">
        <text class="menu-icon">❤️</text>
        <text class="menu-label">我的收藏</text>
      </view>
    </view>

    <!-- 管理员入口 -->
    <view v-if="isAdmin" class="admin-entry glass-card" @tap="goPage('/pages/admin/index')">
      <text class="admin-icon">⚙️</text>
      <text class="admin-label">后台管理</text>
      <text class="admin-arrow">→</text>
    </view>

    <!-- 设置列表 -->
    <view class="settings-section glass-card">
      <view class="setting-item" @tap="toggleAdmin">
        <text class="setting-icon">🔄</text>
        <text class="setting-text">{{ isAdmin ? '切换为用户' : '切换为管理员' }}</text>
        <text class="setting-arrow">▸</text>
      </view>
      <view class="setting-item" @tap="demoLogin">
        <text class="setting-icon">🔑</text>
        <text class="setting-text">重新登录</text>
        <text class="setting-arrow">▸</text>
      </view>
      <view class="setting-item">
        <text class="setting-icon">📱</text>
        <text class="setting-text">关于企动库 v1.0</text>
        <text class="setting-arrow">▸</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const userInfo = ref(userStore.userInfo || { nickname: '演示用户', company: '示例科技' })
const isAdmin = ref(userStore.isAdmin)

async function demoLogin() {
  await userStore.demoLogin(isAdmin.value ? 'admin' : 'user')
  userInfo.value = userStore.userInfo
  uni.showToast({ title: '登录成功', icon: 'success' })
}

function toggleAdmin() {
  isAdmin.value = !isAdmin.value
  userStore.toggleAdmin()
  uni.showToast({ title: isAdmin.value ? '已切换管理员' : '已切换用户', icon: 'none' })
}

function goPage(url) { uni.navigateTo({ url }) }

if (!userStore.isLoggedIn) { demoLogin() }
</script>

<style lang="scss" scoped>
.user-page { min-height: 100vh; background: $bg-primary; padding-bottom: 140rpx; }

.user-hero { display: flex; align-items: center; gap: $space-3; padding: $space-6 $space-4 $space-4; }
.user-avatar { width: 96rpx; height: 96rpx; border-radius: $radius-full; background: $gradient-primary; display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 40rpx; color: #fff; font-weight: $weight-bold; }
.user-info { flex: 1; }
.user-name { font-size: $font-lg; font-weight: $weight-bold; color: $text-primary; display: block; }
.user-company { font-size: $font-sm; color: $text-tertiary; }
.admin-badge { background: rgba(99,102,241,0.15); border: 1rpx solid rgba(99,102,241,0.25); border-radius: $radius-full; padding: 8rpx 20rpx; }
.admin-badge text { font-size: $font-xs; color: $color-secondary-light; font-weight: $weight-medium; }

.menu-bento { display: grid; grid-template-columns: repeat(4, 1fr); gap: $space-2; padding: 0 $space-4; margin-bottom: $space-4; }
.menu-item { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: $space-4 $space-2; }
.menu-icon { font-size: 44rpx; margin-bottom: $space-1; }
.menu-label { font-size: $font-xs; color: $text-secondary; }

.admin-entry { display: flex; align-items: center; gap: $space-3; margin: 0 $space-4 $space-4; padding: $space-4; }
.admin-icon { font-size: 36rpx; }
.admin-label { flex: 1; font-size: $font-base; font-weight: $weight-semibold; color: $text-primary; }
.admin-arrow { color: $text-tertiary; }

.settings-section { margin: 0 $space-4; }
.setting-item { display: flex; align-items: center; gap: $space-3; padding: $space-4; border-bottom: 1rpx solid $border-color; }
.setting-item:last-child { border-bottom: none; }
.setting-icon { font-size: 28rpx; }
.setting-text { flex: 1; font-size: $font-base; color: $text-secondary; }
.setting-arrow { color: $text-tertiary; }
</style>