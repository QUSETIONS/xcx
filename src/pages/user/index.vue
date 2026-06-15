<template>
  <view class="page">
    <view class="header">
      <view class="user-info">
        <view class="avatar-box">
          <text class="avatar-text">{{ userInfo.nickname ? userInfo.nickname[0] : 'U' }}</text>
        </view>
        <view class="user-text">
          <text class="nickname">{{ userInfo.nickname || '创业者' }}</text>
          <text class="company">{{ userInfo.company || '完善资料获更多曝光' }}</text>
        </view>
      </view>
    </view>

    <!-- 信用卡片 -->
    <view class="credit-card">
      <view class="credit-left">
        <text class="credit-score">{{ credit.score }}</text>
        <text class="credit-label">信用分</text>
      </view>
      <view class="credit-right">
        <view class="credit-item"><text class="ci-num">{{ credit.deals }}</text><text class="ci-label">成交</text></view>
        <view class="credit-item"><text class="ci-num">{{ credit.reviews }}</text><text class="ci-label">评价</text></view>
        <view class="credit-item"><text class="ci-num">{{ credit.level }}</text><text class="ci-label">等级</text></view>
      </view>
    </view>

    <!-- 积分优惠券快捷入口 -->
    <view class="quick-row">
      <view class="quick-item card-press" @tap="goPoints">
        <text class="quick-icon">🎁</text>
        <text class="quick-num">{{ pointsBalance }}</text>
        <text class="quick-label">积分</text>
      </view>
      <view class="quick-item card-press" @tap="goPage('/pages/coupon/index')">
        <text class="quick-icon">🎫</text>
        <text class="quick-num">{{ couponCount }}</text>
        <text class="quick-label">优惠券</text>
      </view>
      <view class="quick-item card-press" @tap="goPage('/pages/follow/index')">
        <text class="quick-icon">👥</text>
        <text class="quick-num">{{ followCount }}</text>
        <text class="quick-label">关注</text>
      </view>
    </view>

    <!-- 数据面板 -->
    <view class="stats-panel">
      <view class="stat-item" @tap="goPage('/pages/user/my-demands')">
        <text class="stat-num">{{ myDemandsCount }}</text>
        <text class="stat-label">我的需求</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item" @tap="goPage('/pages/user/my-leads')">
        <text class="stat-num">{{ myLeadsCount }}</text>
        <text class="stat-label">我的对接</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item" @tap="goPage('/pages/user/my-favorites')">
        <text class="stat-num">{{ myFavoritesCount }}</text>
        <text class="stat-label">我的收藏</text>
      </view>
    </view>

    <!-- 数据看板入口 -->
    <view class="dashboard-card" @tap="goDashboard">
      <view class="dc-left">
        <text class="dc-icon">📊</text>
        <view class="dc-info">
          <text class="dc-title">数据看板</text>
          <text class="dc-desc">查看浏览、对接、成交趋势</text>
        </view>
      </view>
      <text class="dc-arrow">›</text>
    </view>

    <!-- 功能入口 -->
    <view class="menu-section">
      <text class="section-title">常用功能</text>
      <view class="menu-grid">
        <view class="menu-item card-press" v-for="(item, idx) in menuItems" :key="idx" @tap="goPage(item.path)">
          <view class="menu-icon-box" :class="'menu-color-' + (idx % 6)">
            <text class="menu-icon">{{ item.icon }}</text>
          </view>
          <text class="menu-label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <!-- 管理员入口 -->
    <view class="admin-card" v-if="isAdmin" @tap="goAdmin">
      <view class="admin-icon-box"><text class="admin-icon">🛡️</text></view>
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
import { demandService, leadService, favoriteService, reviewService, pointsService, couponService, followService } from '@/mock/service'

const userInfo = ref({ nickname: '创业者', company: '创新科技有限公司' })
const myDemandsCount = ref(0)
const myLeadsCount = ref(0)
const myFavoritesCount = ref(0)
const credit = ref({ score: 0, level: '', deals: 0, reviews: 0 })
const isAdmin = ref(true)
const pointsBalance = ref(0)
const couponCount = ref(0)
const followCount = ref(0)

const menuItems = [
  { label: '我的需求', path: '/pages/user/my-demands', icon: '📋' },
  { label: '成交管理', path: '/pages/deals/index', icon: '🤝' },
  { label: '我的订单', path: '/pages/order/index', icon: '📦' },
  { label: '购物车', path: '/pages/cart/index', icon: '🛒' },
  { label: '会员中心', path: '/pages/member/index', icon: '⭐' },
  { label: '活动中心', path: '/pages/campaign/index', icon: '🎉' },
  { label: '我的收藏', path: '/pages/user/my-favorites', icon: '❤️' },
  { label: '我的关注', path: '/pages/follow/index', icon: '👥' },
  { label: '企业认证', path: '/pages/verify/index', icon: '🏛️' },
  { label: '数据看板', path: '/pages/dashboard/index', icon: '📊' },
  { label: '在线客服', path: '/pages/chat/index', icon: '💬' },
  { label: '积分签到', path: '/pages/points/index', icon: '🎁' },
  { label: '优惠券', path: '/pages/coupon/index', icon: '🎫' },
  { label: '消息中心', path: '/pages/message/index', icon: '🔔' },
  { label: '资料下载', path: '/pages/resource/list', icon: '📚' }
]

onMounted(() => {
  myDemandsCount.value = demandService.myDemands().total
  myLeadsCount.value = leadService.myLeads().total
  myFavoritesCount.value = favoriteService.list().total
  credit.value = reviewService.userCreditScore()
  pointsBalance.value = pointsService.getInfo().balance
  couponCount.value = couponService.available()
  followCount.value = followService.count()
})

function goPage(path) {
  if (!path) { uni.showToast({ title: '功能开发中', icon: 'none' }); return }
  uni.navigateTo({ url: path })
}
function goPoints() { uni.navigateTo({ url: '/pages/points/index' }) }
function goDashboard() { uni.navigateTo({ url: '/pages/dashboard/index' }) }
function goAdmin() { uni.navigateTo({ url: '/pages/admin/index' }) }
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.user-info { display: flex; align-items: center; }
.avatar-box { width: 88rpx; height: 88rpx; border-radius: 50%; background: linear-gradient(135deg, #FF6B35, #FF9A5C); display: flex; align-items: center; justify-content: center; margin-right: 16rpx; }
.avatar-text { font-size: 36rpx; color: #FFFFFF; font-weight: bold; }
.nickname { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.company { font-size: 24rpx; color: rgba(0,0,0,0.5); }

/* 信用卡片 */
.credit-card { display: flex; align-items: center; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.credit-left { display: flex; flex-direction: column; align-items: center; margin-right: 24rpx; }
.credit-score { font-size: 56rpx; font-weight: bold; color: #FFFFFF; }
.credit-label { font-size: 22rpx; color: rgba(255,255,255,0.8); }
.credit-right { display: flex; flex: 1; justify-content: space-around; }
.credit-item { display: flex; flex-direction: column; align-items: center; }
.ci-num { font-size: 32rpx; font-weight: bold; color: #FFFFFF; }
.ci-label { font-size: 20rpx; color: rgba(255,255,255,0.7); margin-top: 4rpx; }

/* 积分优惠券快捷入口 */
.quick-row { display: flex; margin-bottom: 16rpx; }
.quick-item { flex: 1; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx 0; text-align: center; margin-right: 12rpx; }
.quick-item:last-child { margin-right: 0; }
.quick-icon { font-size: 36rpx; display: block; margin-bottom: 4rpx; }
.quick-num { font-size: 36rpx; font-weight: bold; color: #FF6B35; display: block; }
.quick-label { font-size: 22rpx; color: rgba(0,0,0,0.5); display: block; margin-top: 4rpx; }

/* 数据面板 */
.stats-panel { display: flex; align-items: center; background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 40rpx; font-weight: bold; color: #FF6B35; }
.stat-label { font-size: 22rpx; color: rgba(0,0,0,0.5); margin-top: 4rpx; }
.stat-divider { width: 1rpx; height: 48rpx; background: #F0F1F5; }

/* 看板入口 */
.dashboard-card { display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border-radius: 20rpx; padding: 20rpx 24rpx; margin-bottom: 16rpx; }
.dc-left { display: flex; align-items: center; }
.dc-icon { font-size: 36rpx; margin-right: 16rpx; }
.dc-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.dc-desc { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.dc-arrow { font-size: 36rpx; color: rgba(0,0,0,0.25); }

/* 功能入口 */
.menu-section { margin-bottom: 16rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.menu-grid { display: flex; flex-wrap: wrap; }
.menu-item { width: 33.33%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; padding: 16rpx 0; }
.menu-icon-box { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.menu-color-0 { background: rgba(255,107,53,0.1); }
.menu-color-1 { background: rgba(99,102,241,0.1); }
.menu-color-2 { background: rgba(16,185,129,0.1); }
.menu-color-3 { background: rgba(245,158,11,0.1); }
.menu-color-4 { background: rgba(59,130,246,0.1); }
.menu-color-5 { background: rgba(236,72,153,0.1); }
.menu-icon { font-size: 36rpx; }
.menu-label { font-size: 24rpx; color: rgba(0,0,0,0.7); }

/* 管理员入口 */
.admin-card { display: flex; align-items: center; background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08)); border: 2rpx solid rgba(99,102,241,0.15); border-radius: 20rpx; padding: 20rpx 24rpx; }
.admin-icon-box { width: 56rpx; height: 56rpx; background: linear-gradient(135deg, #6366F1, #8B5CF6); border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; }
.admin-icon { font-size: 28rpx; }
.admin-info { flex: 1; }
.admin-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.admin-desc { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.admin-arrow { font-size: 36rpx; color: rgba(0,0,0,0.25); }
</style>