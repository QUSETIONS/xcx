<template>
  <view class="page">
    <view class="header">
      <text class="header-title">订单管理</text>
      <view class="filter-btn" :class="{ active: statusFilter }" @tap="showStatusPicker = true"><text>{{ statusFilter ? statusMap[statusFilter] : '全部状态' }}</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="order-list" :class="{ 'animate-in': animated }">
        <view class="order-item card-press" v-for="(item, idx) in filteredList" :key="item._id"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="order-top">
            <text class="order-id">订单 {{ item._id }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <text class="order-product">{{ item.items?.[0]?.title || '商品' }}</text>
          <view class="order-bottom">
            <text class="order-amount">¥{{ (item.total_amount / 100).toFixed(2) }}</text>
            <text class="order-time">{{ formatDate(item.created_at) }}</text>
          </view>
        </view>
      </view>
      <view v-if="!filteredList.length" class="empty"><text>暂无订单</text></view>
    </scroll-view>

    <view v-if="showStatusPicker" class="picker-mask" @tap="showStatusPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>选择状态</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !statusFilter }" @tap="statusFilter = ''; showStatusPicker = false"><text>全部</text></view>
          <view class="picker-opt" :class="{ active: statusFilter === k }" v-for="(v, k) in statusMap" :key="k" @tap="statusFilter = k; showStatusPicker = false"><text>{{ v }}</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ORDER_STATUS } from '@/config/constants'
import { orderService } from '@/mock/service'

const statusMap = ORDER_STATUS
const statusFilter = ref('')
const refreshing = ref(false)
const showStatusPicker = ref(false)
const animated = ref(false)

const allOrders = ref(orderService.myOrders().list)
const filteredList = computed(() => {
  let list = allOrders.value
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  return list
})

function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function onRefresh() { refreshing.value = true; allOrders.value = orderService.myOrders().list; refreshing.value = false }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.filter-btn { padding: 10rpx 20rpx; background: #FFFFFF; border-radius: 20rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-btn.active { background: rgba(255,107,53,0.1); color: #FF6B35; }

.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; }
.order-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.order-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.order-id { font-size: 24rpx; color: rgba(0,0,0,0.5); }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-created { background: rgba(59,130,246,0.1); color: #3B82F6; }
.status-paid { background: rgba(99,102,241,0.1); color: #6366F1; }
.status-confirmed { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-serving { background: rgba(16,185,129,0.1); color: #10B981; }
.status-completed { background: rgba(16,185,129,0.15); color: #10B981; }
.status-cancelled { background: #F5F6FA; color: rgba(0,0,0,0.45); }
.order-product { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.order-bottom { display: flex; justify-content: space-between; align-items: center; }
.order-amount { font-size: 30rpx; font-weight: bold; color: #FF6B35; }
.order-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(0,0,0,0.5); }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 400; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 24rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>