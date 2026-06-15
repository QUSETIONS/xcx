<template>
  <view class="page">
    <!-- 用户头部 -->
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

    <!-- 数据面板 -->
    <view class="stats-panel">
      <view class="stats-item">
        <text class="stats-num">{{ myDemandsCount }}</text>
        <text class="stats-label">需求</text>
      </view>
      <view class="stats-divider"/>
      <view class="stats-item">
        <text class="stats-num">{{ myLeadsCount }}</text>
        <text class="stats-label">对接</text>
      </view>
      <view class="stats-divider"/>
      <view class="stats-item">
        <text class="stats-num">{{ myFavoritesCount }}</text>
        <text class="stats-label">收藏</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="menu-grid">
      <view class="menu-item" @tap="goPage('/pages/user/my-demands')">
        <view class="menu-icon-box" style="background: rgba(255,107,53,0.15);"><text class="menu-icon">📋</text></view>
        <text class="menu-label">我的需求</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/user/my-leads')">
        <view class="menu-icon-box" style="background: rgba(99,102,241,0.15);"><text class="menu-icon">🤝</text></view>
        <text class="menu-label">我的对接</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/user/my-orders')">
        <view class="menu-icon-box" style="background: rgba(16,185,129,0.15);"><text class="menu-icon">📦</text></view>
        <text class="menu-label">我的订单</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/user/my-favorites')">
        <view class="menu-icon-box" style="background: rgba(236,72,153,0.15);"><text class="menu-icon">❤️</text></view>
        <text class="menu-label">我的收藏</text>
      </view>
    </view>

    <!-- 管理员入口 -->
    <view v-if="isAdmin" class="admin-entry" @tap="goPage('/pages/admin/index')">
      <text class="admin-icon">⚙️</text>
      <text class="admin-label">后台管理</text>
      <text class="admin-arrow">→</text>
    </view>

    <!-- 设置 -->
    <view class="settings-card">
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
        <text class="setting-text">关于企动库 v2.0</text>
        <text class="setting-arrow">▸</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { demandService, leadService, favoriteService } from '@/mock/service'

const userStore = useUserStore()
const userInfo = ref(userStore.userInfo || { nickname: '演示用户', company: '示例科技' })
const isAdmin = ref(userStore.isAdmin)
const myDemandsCount = ref(0)
const myLeadsCount = ref(0)
const myFavoritesCount = ref(0)

onMounted(() => {
  myDemandsCount.value = demandService.myDemands().total
  myLeadsCount.value = leadService.myLeads().total
  myFavoritesCount.value = favoriteService.list().total
})

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

<style lang="scss">
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 140rpx; }

.user-hero { display: flex; align-items: center; gap: 16rpx; padding: 32rpx 24rpx 16rpx; }
.user-avatar { width: 96rpx; height: 96rpx; border-radius: 50%; background: linear-gradient(135deg, #FF6B35, #FF9A5C); display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 40rpx; color: #fff; font-weight: bold; }
.user-info { flex: 1; }
.user-name { font-size: 32rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; }
.user-company { font-size: 24rpx; color: rgba(255,255,255,0.5); }
.admin-badge { background: rgba(99,102,241,0.15); border: 1rpx solid rgba(99,102,241,0.25); border-radius: 24rpx; padding: 8rpx 20rpx; }
.admin-badge text { font-size: 22rpx; color: #8B5CF6; font-weight: bold; }

.stats-panel { display: flex; align-items: center; justify-content: space-around; margin: 0 24rpx 16rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 24rpx; }
.stats-item { display: flex; flex-direction: column; align-items: center; }
.stats-num { font-size: 36rpx; font-weight: bold; color: #FF6B35; }
.stats-label { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.stats-divider { width: 1rpx; height: 48rpx; background: rgba(255,255,255,0.1); }

.menu-grid { display: flex; gap: 12rpx; margin: 0 24rpx 16rpx; }
.menu-item { flex: 1; display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 20rpx 8rpx; }
.menu-icon-box { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.menu-icon { font-size: 28rpx; }
.menu-label { font-size: 22rpx; color: rgba(255,255,255,0.65); }

.admin-entry { display: flex; align-items: center; gap: 12rpx; margin: 0 24rpx 16rpx; padding: 20rpx; background: rgba(99,102,241,0.08); border: 1rpx solid rgba(99,102,241,0.15); border-radius: 20rpx; }
.admin-icon { font-size: 28rpx; }
.admin-label { flex: 1; font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.admin-arrow { color: rgba(255,255,255,0.5); }

.settings-card { margin: 0 24rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; }
.setting-item { display: flex; align-items: center; gap: 12rpx; padding: 20rpx; border-bottom: 1rpx solid rgba(255,255,255,0.08); }
.setting-item:last-child { border-bottom: none; }
.setting-icon { font-size: 28rpx; }
.setting-text { flex: 1; font-size: 28rpx; color: rgba(255,255,255,0.75); }
.setting-arrow { color: rgba(255,255,255,0.4); }
</style>