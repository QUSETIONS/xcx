<template>
  <view class="page">
    <view class="header"><text class="header-title">后台管理</text></view>

    <view class="menu-grid">
      <view class="menu-item" @tap="goPage('/pages/admin/demand-manage')">
        <view class="menu-icon-box" style="background: rgba(255,107,53,0.15);"><text class="menu-icon">📋</text></view>
        <text class="menu-label">需求管理</text>
        <text class="menu-count">{{ demandCount }}</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/admin/lead-manage')">
        <view class="menu-icon-box" style="background: rgba(99,102,241,0.15);"><text class="menu-icon">🤝</text></view>
        <text class="menu-label">对接管理</text>
        <text class="menu-count">{{ leadCount }}</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/admin/order-manage')">
        <view class="menu-icon-box" style="background: rgba(16,185,129,0.15);"><text class="menu-icon">📦</text></view>
        <text class="menu-label">订单管理</text>
        <text class="menu-count">{{ orderCount }}</text>
      </view>
      <view class="menu-item" @tap="goPage('/pages/admin/product-manage')">
        <view class="menu-icon-box" style="background: rgba(236,72,153,0.15);"><text class="menu-icon">🛒</text></view>
        <text class="menu-label">商品管理</text>
        <text class="menu-count">{{ productCount }}</text>
      </view>
    </view>

    <view class="stats-card">
      <text class="stats-title">今日数据</text>
      <view class="stats-row">
        <view class="stats-item"><text class="stats-num">{{ todayDemands }}</text><text class="stats-label">新增需求</text></view>
        <view class="stats-item"><text class="stats-num">{{ todayLeads }}</text><text class="stats-label">新增对接</text></view>
        <view class="stats-item"><text class="stats-num">{{ todayOrders }}</text><text class="stats-label">新增订单</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { demandService, leadService, orderService, productService } from '@/mock/service'

const demandCount = ref(0)
const leadCount = ref(0)
const orderCount = ref(0)
const productCount = ref(0)
const todayDemands = ref(0)
const todayLeads = ref(0)
const todayOrders = ref(0)

onMounted(() => {
  demandCount.value = demandService.list({ pageSize: 100 }).total
  leadCount.value = leadService.myLeads().total
  orderCount.value = orderService.myOrders().total
  productCount.value = productService.list({ pageSize: 100 }).total
  todayDemands.value = demandCount.value
  todayLeads.value = leadCount.value
  todayOrders.value = orderCount.value
})

function goPage(url) { uni.navigateTo({ url }) }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0A0F; padding: 24rpx; padding-bottom: 140rpx; }
.header { margin-bottom: 24rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(255,255,255,0.95); }

.menu-grid { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 24rpx; }
.menu-item { width: calc(50% - 8rpx); background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 24rpx; display: flex; flex-direction: column; align-items: center; }
.menu-icon-box { width: 64rpx; height: 64rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; }
.menu-icon { font-size: 32rpx; }
.menu-label { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); margin-bottom: 8rpx; }
.menu-count { font-size: 24rpx; color: #FF6B35; }

.stats-card { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 24rpx; }
.stats-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 16rpx; }
.stats-row { display: flex; justify-content: space-around; }
.stats-item { display: flex; flex-direction: column; align-items: center; }
.stats-num { font-size: 36rpx; font-weight: bold; color: #FF6B35; }
.stats-label { font-size: 22rpx; color: rgba(255,255,255,0.5); margin-top: 4rpx; }
</style>