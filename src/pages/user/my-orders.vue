<template>
  <view class="page">
    <view class="header"><text class="header-title">我的订单</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="order-list" :class="{ 'animate-in': animated }">
        <view class="order-item card-press" v-for="(item, idx) in list" :key="item._id"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="order-top">
            <text class="order-product">{{ item.items?.[0]?.title || '商品' }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <view class="order-bottom">
            <text class="order-amount">¥{{ (item.total_amount / 100).toFixed(2) }}</text>
            <text class="order-time">{{ formatDate(item.created_at) }}</text>
          </view>
        </view>
      </view>
      <view v-if="!list.length" class="empty">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无订单</text>
        <text class="empty-btn" @tap="goMall">去商城</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ORDER_STATUS } from '@/config/constants'
import { orderService } from '@/mock/service'

const statusMap = ORDER_STATUS
const list = ref([])
const refreshing = ref(false)
const animated = ref(false)

function loadList() { list.value = orderService.myOrders().list }
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function goMall() { uni.switchTab({ url: '/pages/mall/list' }) }
function onRefresh() { refreshing.value = true; loadList(); refreshing.value = false }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.list-scroll { height: calc(100vh - 80rpx); padding: 0 24rpx; }
.order-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.order-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.order-product { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); flex: 1; }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-created { background: rgba(59,130,246,0.1); color: #3B82F6; }
.status-paid { background: rgba(99,102,241,0.1); color: #6366F1; }
.status-confirmed { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-serving { background: rgba(16,185,129,0.1); color: #10B981; }
.status-completed { background: rgba(16,185,129,0.15); color: #10B981; }
.status-cancelled { background: #F5F6FA; color: rgba(0,0,0,0.45); }

.order-bottom { display: flex; justify-content: space-between; align-items: center; }
.order-amount { font-size: 30rpx; font-weight: bold; color: #FF6B35; }
.order-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-btn { font-size: 24rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 12rpx 32rpx; border-radius: 24rpx; display: inline-flex; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>