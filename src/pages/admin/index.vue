<template>
  <view class="page">
    <view class="header"><text class="header-title">后台管理</text></view>

    <view class="menu-grid" :class="{ 'animate-in': animated }">
      <view class="menu-item" v-for="(item, idx) in menuItems" :key="item.path" @tap="goPage(item.path)"
        :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
        <view class="menu-icon-box" :class="'menu-color-' + idx">
          <image class="menu-icon" :src="item.icon" mode="aspectFit"/>
        </view>
        <text class="menu-label">{{ item.label }}</text>
        <text class="menu-count">{{ item.count }}</text>
      </view>
    </view>

    <view class="stats-card" :class="{ 'fade-in': animated }">
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

const animated = ref(false)
const todayDemands = ref(0)
const todayLeads = ref(0)
const todayOrders = ref(0)

const menuItems = ref([
  { label: '需求管理', path: '/pages/admin/demand-manage', icon: '/static/icons/list.svg', count: 0 },
  { label: '对接管理', path: '/pages/admin/lead-manage', icon: '/static/icons/handshake.svg', count: 0 },
  { label: '订单管理', path: '/pages/admin/order-manage', icon: '/static/icons/mall.svg', count: 0 },
  { label: '商品管理', path: '/pages/admin/product-manage', icon: '/static/icons/package.svg', count: 0 }
])

onMounted(() => {
  menuItems.value[0].count = demandService.list({ pageSize: 100 }).total
  menuItems.value[1].count = leadService.myLeads().total
  menuItems.value[2].count = orderService.myOrders().total
  menuItems.value[3].count = productService.list({ pageSize: 100 }).total
  todayDemands.value = menuItems.value[0].count
  todayLeads.value = menuItems.value[1].count
  todayOrders.value = menuItems.value[2].count
  setTimeout(() => { animated.value = true }, 100)
})

function goPage(url) { uni.navigateTo({ url }) }
</script>

<style lang="scss">
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; }
.header { margin-bottom: 24rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.menu-grid { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 24rpx; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.menu-item { width: calc(50% - 8rpx); background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }
.menu-icon-box { width: 64rpx; height: 64rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; }
.menu-color-0 { background: rgba(255,107,53,0.1); }
.menu-color-1 { background: rgba(99,102,241,0.1); }
.menu-color-2 { background: rgba(16,185,129,0.1); }
.menu-color-3 { background: rgba(236,72,153,0.1); }
.menu-icon { width: 32rpx; height: 32rpx; }
.menu-label { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 8rpx; }
.menu-count { font-size: 24rpx; color: #FF6B35; }

.stats-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.stats-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.stats-row { display: flex; justify-content: space-around; }
.stats-item { display: flex; flex-direction: column; align-items: center; }
.stats-num { font-size: 36rpx; font-weight: bold; color: #FF6B35; }
.stats-label { font-size: 22rpx; color: rgba(0,0,0,0.5); margin-top: 4rpx; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>