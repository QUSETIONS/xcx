<template>
  <view class="page">
    <view class="header">
      <view class="user-info">
        <view class="avatar-box">
          <image class="avatar" :src="userInfo.avatar || '/static/images/default-avatar.png'" mode="aspectFill"/>
        </view>
        <view class="user-text">
          <text class="nickname">{{ userInfo.nickname || '创业者' }}</text>
          <text class="company">{{ userInfo.company || '完善资料获更多曝光' }}</text>
        </view>
      </view>
      <view class="settings-btn" @tap="goSettings">
        <image class="settings-icon" src="/static/icons/settings.svg" mode="aspectFit"/>
      </view>
    </view>

    <!-- 数据面板 -->
    <view class="stats-panel" :class="{ 'animate-in': animated }">
      <view class="stat-item" @tap="goPage('/pages/user/my-demands')">
        <text class="stat-num">{{ myDemandsCount }}</text>
        <text class="stat-label">我的需求</text>
      </view>
      <view class="stat-divider"/>
      <view class="stat-item" @tap="goPage('/pages/user/my-leads')">
        <text class="stat-num">{{ myLeadsCount }}</text>
        <text class="stat-label">我的对接</text>
      </view>
      <view class="stat-divider"/>
      <view class="stat-item" @tap="goPage('/pages/user/my-favorites')">
        <text class="stat-num">{{ myFavoritesCount }}</text>
        <text class="stat-label">我的收藏</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="menu-section">
      <text class="section-title">常用功能</text>
      <view class="menu-grid">
        <view class="menu-item" v-for="(item, idx) in menuItems" :key="item.path" @tap="goPage(item.path)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="menu-icon-box" :class="'menu-color-' + (idx % 6)">
            <image class="menu-icon" :src="item.icon" mode="aspectFit"/>
          </view>
          <text class="menu-label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <!-- 管理员入口 -->
    <view class="admin-card" v-if="isAdmin" @tap="goAdmin">
      <view class="admin-icon-box">
        <image class="admin-icon" src="/static/icons/shield.svg" mode="aspectFit"/>
      </view>
      <view class="admin-info">
        <text class="admin-title">后台管理</text>
        <text class="admin-desc">管理需求、对接、订单</text>
      </view>
      <text class="admin-arrow">›</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { demandService, leadService, favoriteService } from '@/mock/service'

const userInfo = ref({ nickname: '创业者', company: '创新科技有限公司', avatar: '' })
const myDemandsCount = ref(0)
const myLeadsCount = ref(0)
const myFavoritesCount = ref(0)
const isAdmin = ref(true)
const animated = ref(false)

const menuItems = [
  { label: '我的需求', path: '/pages/user/my-demands', icon: '/static/icons/list.svg' },
  { label: '我的对接', path: '/pages/user/my-leads', icon: '/static/icons/handshake.svg' },
  { label: '我的订单', path: '/pages/user/my-orders', icon: '/static/icons/mall.svg' },
  { label: '我的收藏', path: '/pages/user/my-favorites', icon: '/static/icons/heart.svg' },
  { label: '资料下载', path: '/pages/resource/list', icon: '/static/icons/download.svg' },
  { label: '帮助反馈', path: '', icon: '/static/icons/help.svg' }
]

onMounted(() => {
  myDemandsCount.value = demandService.myDemands().total
  myLeadsCount.value = leadService.myLeads().total
  myFavoritesCount.value = favoriteService.list().total
})

function goPage(path) {
  if (!path) { uni.showToast({ title: '功能开发中', icon: 'none' }); return }
  uni.navigateTo({ url: path })
}
function goAdmin() { uni.navigateTo({ url: '/pages/admin/index' }) }
function goSettings() { uni.showToast({ title: '设置功能开发中', icon: 'none' }) }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; }

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.user-info { display: flex; align-items: center; }
.avatar-box { width: 96rpx; height: 96rpx; border-radius: 50%; background: linear-gradient(135deg, #FF6B35, #FF9A5C); padding: 4rpx; }
.avatar { width: 100%; height: 100%; border-radius: 50%; }
.nickname { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.company { font-size: 24rpx; color: rgba(0,0,0,0.5); }
.settings-btn { width: 64rpx; height: 64rpx; background: #FFFFFF; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.settings-icon { width: 28rpx; height: 28rpx; }

.stats-panel { display: flex; align-items: center; background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 40rpx; font-weight: bold; color: #FF6B35; }
.stat-label { font-size: 22rpx; color: rgba(0,0,0,0.5); margin-top: 4rpx; }
.stat-divider { width: 1rpx; height: 48rpx; background: #F0F1F5; }

.menu-section { margin-bottom: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.menu-grid { display: flex; flex-wrap: wrap; }
.menu-item { width: calc(33.33% - 8rpx); display: flex; flex-direction: column; align-items: center; padding: 20rpx 0; background: #FFFFFF; border-radius: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }
.menu-icon-box { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.menu-color-0 { background: rgba(255,107,53,0.1); }
.menu-color-1 { background: rgba(99,102,241,0.1); }
.menu-color-2 { background: rgba(16,185,129,0.1); }
.menu-color-3 { background: rgba(245,158,11,0.1); }
.menu-color-4 { background: rgba(59,130,246,0.1); }
.menu-color-5 { background: rgba(236,72,153,0.1); }
.menu-icon { width: 28rpx; height: 28rpx; }
.menu-label { font-size: 24rpx; color: rgba(0,0,0,0.7); }

.admin-card { display: flex; align-items: center; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1)); border: 2rpx solid rgba(99,102,241,0.2); border-radius: 20rpx; padding: 20rpx; }
.admin-icon-box { width: 56rpx; height: 56rpx; background: linear-gradient(135deg, #6366F1, #8B5CF6); border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.admin-icon { width: 28rpx; height: 28rpx; }
.admin-info { flex: 1; }
.admin-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.admin-desc { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.admin-arrow { font-size: 32rpx; color: rgba(0,0,0,0.3); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>