<template>
  <view class="page">
    <!-- Tab筛选 -->
    <view class="tab-bar">
      <text class="tab-item" :class="{ active: tab === 'all' }" @tap="switchTab('all')">{{ t('orderPage.all') }}</text>
      <text class="tab-item" :class="{ active: tab === 'pending' }" @tap="switchTab('pending')">{{ t('orderPage.pending') }}</text>
      <text class="tab-item" :class="{ active: tab === 'serving' }" @tap="switchTab('serving')">{{ t('orderPage.serving') }}</text>
      <text class="tab-item" :class="{ active: tab === 'completed' }" @tap="switchTab('completed')">{{ t('orderPage.completed') }}</text>
    </view>

    <!-- 订单列表 -->
    <scroll-view class="list-scroll" scroll-y>
      <view class="order-list" v-if="orderList.length">
        <view class="order-card" v-for="order in orderList" :key="order._id">
          <!-- 订单头部 -->
          <view class="order-header">
            <text class="order-no">订单号：{{ order._id.slice(-8).toUpperCase() }}</text>
            <text class="order-status" :class="'s-' + order.status">{{ getStatusText(order.status) }}</text>
          </view>

          <!-- 商品信息 -->
          <view class="order-goods" v-for="item in (order.items || [])" :key="item._id">
            <view class="goods-icon" :class="'type-' + (item.service_type || 'resource_pack')">
              <text class="gi-text">{{ getIcon(item.service_type) }}</text>
            </view>
            <view class="goods-info">
              <text class="goods-title">{{ item.title }}</text>
              <text class="goods-price">¥{{ (item.price / 100).toFixed(0) }} × {{ item.quantity }}</text>
            </view>
          </view>

          <!-- 优惠信息 -->
          <view class="order-discount" v-if="order.coupon_id || order.points_used">
            <text class="discount-item" v-if="order.coupon_id">🎫 优惠券已抵扣</text>
            <text class="discount-item" v-if="order.points_used">🎁 积分抵扣{{ order.points_used }}分</text>
          </view>

          <!-- 订单金额 -->
          <view class="order-amount">
            <text class="amount-label">实付</text>
            <text class="amount-value">¥{{ ((order.total_amount || order.items?.[0]?.price || 0) / 100).toFixed(0) }}</text>
          </view>

          <!-- 时间 -->
          <view class="order-time">
            <text class="time-text">{{ formatTime(order.created_at) }}</text>
          </view>

          <!-- 操作按钮 -->
          <view class="order-actions">
            <view class="action-btn-outline" v-if="order.status === 'created'" @tap="cancelOrder(order._id)"><text>{{ t('orderPage.cancel') }}</text></view>
            <view class="action-btn-outline" v-if="order.status === 'created'" @tap="payOrder(order._id)"><text>{{ t('orderPage.pay') }}</text></view>
            <view class="action-btn-fill" v-if="order.status === 'paid'" @tap="confirmOrder(order._id)"><text>{{ t('orderPage.confirmService') }}</text></view>
            <view class="action-btn-fill" v-if="order.status === 'confirmed'" @tap="startServe(order._id)"><text>{{ t('orderPage.startService') }}</text></view>
            <view class="action-btn-outline" v-if="order.status === 'serving'" @tap="contactService"><text>{{ t('orderPage.contactService') }}</text></view>
            <view class="action-btn-fill" v-if="order.status === 'serving'" @tap="completeOrder(order._id)"><text>{{ t('orderPage.complete') }}</text></view>
            <view class="action-btn-outline" v-if="order.status === 'completed'" @tap="review"><text>{{ t('orderPage.review') }}</text></view>
            <view class="action-btn-outline" v-if="order.status === 'completed'" @tap="buyAgain"><text>{{ t('orderPage.buyAgain') }}</text></view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty">
        <text class="empty-icon">📋</text>
        <text class="empty-text">{{ t('orderPage.empty') }}</text>
        <view class="empty-btn" @tap="goMall"><text>{{ t('orderPage.goOrder') }}</text></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { ORDER_STATUS } from '@/config/constants'
import { orderService } from '@/mock/service'
import { formatDateTime as formatTime } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
useNavTitle('titles.myOrders')

const tab = ref('all')
const orderList = ref([])

onShow(() => { loadOrders() })

function loadOrders() {
  const res = orderService.myOrders({ status: tab.value })
  // 按时间倒序
  orderList.value = res.list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

function switchTab(t) { tab.value = t; loadOrders() }

function getStatusText(s) { return ORDER_STATUS[s] || s }
function getIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

// 状态流转
function payOrder(id) {
  orderService.updateStatus(id, 'paid')
  uni.showToast({ title: '支付成功', icon: 'success' })
  loadOrders()
}
function confirmOrder(id) {
  orderService.updateStatus(id, 'confirmed')
  uni.showToast({ title: '已确认', icon: 'success' })
  loadOrders()
}
function startServe(id) {
  orderService.updateStatus(id, 'serving')
  uni.showToast({ title: '服务已开始', icon: 'success' })
  loadOrders()
}
function completeOrder(id) {
  uni.showModal({
    title: '确认完成', content: '确认该订单服务已完成？',
    success: (r) => {
      if (r.confirm) {
        orderService.updateStatus(id, 'completed')
        uni.showToast({ title: '已完成', icon: 'success' })
        loadOrders()
      }
    }
  })
}
function cancelOrder(id) {
  uni.showModal({
    title: '取消订单', content: '确定取消该订单？',
    success: (r) => {
      if (r.confirm) {
        orderService.updateStatus(id, 'cancelled')
        uni.showToast({ title: '已取消', icon: 'none' })
        loadOrders()
      }
    }
  })
}
function contactService() { uni.navigateTo({ url: '/pages/chat/index' }) }
function review() { uni.navigateTo({ url: '/pages/deals/index' }) }
function buyAgain() { uni.switchTab({ url: '/pages/mall/list' }) }
function goMall() { uni.switchTab({ url: '/pages/mall/list' }) }
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; }

.tab-bar { display: flex; background: #FFFFFF; padding: 0 16rpx; position: sticky; top: 0; z-index: 10; }
.tab-item { font-size: 28rpx; color: rgba(0,0,0,0.4); padding: 24rpx 24rpx; position: relative; }
.tab-item.active { color: #FF6B35; font-weight: bold; }
.tab-item.active::after { content: ''; position: absolute; bottom: 0; left: 24rpx; right: 24rpx; height: 4rpx; background: #FF6B35; border-radius: 2rpx; }

.list-scroll { padding: 16rpx 24rpx; height: calc(100vh - 90rpx); }
.order-list { display: flex; flex-direction: column; }
.order-card { background: #FFFFFF; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }

.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; padding-bottom: 16rpx; border-bottom: 1rpx solid #F5F6FA; }
.order-no { font-size: 24rpx; color: rgba(0,0,0,0.4); }
.order-status { font-size: 26rpx; font-weight: bold; }
.s-created { color: #F59E0B; }
.s-paid { color: #3B82F6; }
.s-confirmed { color: #6366F1; }
.s-serving { color: #FF6B35; }
.s-completed { color: #10B981; }
.s-cancelled { color: rgba(0,0,0,0.3); }

.order-goods { display: flex; align-items: center; margin-bottom: 12rpx; }
.goods-icon { width: 56rpx; height: 56rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.type-member { background: rgba(255,107,53,0.1); }
.type-linker { background: rgba(99,102,241,0.1); }
.type-survey { background: rgba(16,185,129,0.1); }
.type-resource_pack { background: rgba(245,158,11,0.1); }
.type-certification { background: rgba(236,72,153,0.1); }
.gi-text { font-size: 28rpx; }
.goods-info { flex: 1; }
.goods-title { font-size: 28rpx; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.goods-price { font-size: 24rpx; color: rgba(0,0,0,0.5); }

.order-discount { display: flex; margin-bottom: 12rpx; }
.discount-item { font-size: 22rpx; color: #FF6B35; background: rgba(255,107,53,0.08); padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 8rpx; }

.order-amount { display: flex; justify-content: flex-end; align-items: center; padding-top: 8rpx; }
.amount-label { font-size: 24rpx; color: rgba(0,0,0,0.5); margin-right: 8rpx; }
.amount-value { font-size: 36rpx; font-weight: bold; color: #FF6B35; }

.order-time { margin-top: 8rpx; }
.time-text { font-size: 22rpx; color: rgba(0,0,0,0.3); }

.order-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #F5F6FA; }
.action-btn-outline { border: 1rpx solid rgba(0,0,0,0.15); border-radius: 28rpx; padding: 12rpx 24rpx; margin-left: 12rpx; }
.action-btn-outline text { font-size: 24rpx; color: rgba(0,0,0,0.6); }
.action-btn-fill { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 28rpx; padding: 12rpx 24rpx; margin-left: 12rpx; }
.action-btn-fill text { font-size: 24rpx; color: #FFFFFF; font-weight: bold; }

.empty { display: flex; flex-direction: column; align-items: center; padding-top: 160rpx; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); margin-bottom: 32rpx; }
.empty-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 20rpx 56rpx; }
.empty-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
</style>