<template>
  <view class="user-page">
    <!-- 用户头像区 -->
    <view class="user-header">
      <view class="avatar-box">
        <text class="avatar-text">{{ userInfo.nickname?.[0] || 'U' }}</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo.nickname || '点击登录' }}</text>
        <text class="user-company">{{ userInfo.company || '未设置公司' }}</text>
      </view>
      <view class="admin-tag" v-if="isAdmin" @tap="toggleAdmin">
        <text>管理员</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="menu-grid">
      <view class="menu-item" @tap="goPage('/pages/user/my-demands')">
        <text class="menu-icon">📋</text>
        <text class="menu-label">我的需求</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/user/my-leads')">
        <text class="menu-icon">🤝</text>
        <text class="menu-label">我的对接</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/user/my-orders')">
        <text class="menu-icon">📦</text>
        <text class="menu-label">我的订单</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/user/my-favorites')">
        <text class="menu-icon">❤️</text>
        <text class="menu-label">我的收藏</text>
      </view>
    </view>

    <!-- 管理员入口 -->
    <view v-if="isAdmin" class="admin-card" @tap="goPage('/pages/admin/index')">
      <text class="admin-icon">⚙️</text>
      <text class="admin-label">后台管理</text>
      <text class="admin-arrow">→</text>
    </view>

    <!-- 角色切换 -->
    <view class="switch-card" @tap="toggleAdmin">
      <text class="switch-icon">🔄</text>
      <text class="switch-label">{{ isAdmin ? '切换为普通用户' : '切换为管理员' }}</text>
    </view>

    <!-- 其他设置 -->
    <view class="settings-section">
      <view class="setting-item" @tap="demoLogin">
        <text>重新登录</text>
        <text class="setting-arrow">▸</text>
      </view>
      <view class="setting-item">
        <text>关于企动库</text>
        <text class="setting-arrow">▸</text>
      </view>
      <view class="setting-item">
        <text>版本号 v1.0.0</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const userInfo = ref(userStore.userInfo || { nickname: '演示用户', company: '示例科技', role: 'user' })
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

// 自动登录
if (!userStore.isLoggedIn) { demoLogin() }
</script>

<style lang="scss" scoped>
.user-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 120rpx; }

.user-header {
  display: flex; align-items: center; gap: 20rpx;
  padding: 48rpx 32rpx; background: linear-gradient(135deg, #FF6B35, #FF8F65);
  border-radius: 0 0 40rpx 40rpx;
}
.avatar-box { width: 96rpx; height: 96rpx; border-radius: 50%; background: rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 40rpx; color: #fff; font-weight: 700; }
.user-info { flex: 1; }
.user-name { font-size: 32rpx; font-weight: 700; color: #fff; display: block; }
.user-company { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.admin-tag { padding: 6rpx 16rpx; background: rgba(255,255,255,0.3); border-radius: 16rpx; }
.admin-tag text { font-size: 22rpx; color: #fff; }

.menu-grid { display: flex; background: #fff; border-radius: 24rpx; margin: 24rpx; padding: 32rpx 16rpx; }
.menu-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.menu-icon { font-size: 44rpx; }
.menu-label { font-size: 24rpx; color: #666; }

.admin-card { display: flex; align-items: center; gap: 16rpx; background: #fff; border-radius: 20rpx; margin: 0 24rpx 16rpx; padding: 24rpx; }
.admin-icon { font-size: 36rpx; }
.admin-label { flex: 1; font-size: 28rpx; color: #333; font-weight: 600; }
.admin-arrow { color: #ccc; }

.switch-card { display: flex; align-items: center; gap: 16rpx; background: #fff; border-radius: 20rpx; margin: 0 24rpx 16rpx; padding: 24rpx; }
.switch-icon { font-size: 36rpx; }
.switch-label { flex: 1; font-size: 28rpx; color: #666; }

.settings-section { background: #fff; border-radius: 20rpx; margin: 0 24rpx; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 24rpx; border-bottom: 1rpx solid #f5f5f5; font-size: 28rpx; color: #333; }
.setting-item:last-child { border-bottom: none; color: #999; }
.setting-arrow { color: #ccc; }
</style>