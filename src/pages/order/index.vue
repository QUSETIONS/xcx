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
    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !orderList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view class="order-list" v-if="orderList.length">
        <view class="order-card" v-for="order in orderList" :key="order._id">
          <!-- 订单头部 -->
          <view class="order-header">
            <text class="order-no">{{ t('orderPage.orderNo') }}{{ order._id.slice(-8).toUpperCase() }}</text>
            <text class="order-status" :class="'s-' + order.status">{{ getStatusText(order.status) }}</text>
          </view>

          <!-- 商品信息 -->
          <view class="order-goods" v-for="item in (order.items || [])" :key="item._id">
            <view class="goods-icon" :class="'type-' + (item.service_type || 'resource_pack')">
              <image class="gi-icon" :src="getIcon(item.service_type)" mode="aspectFit" />
            </view>
            <view class="goods-info">
              <text class="goods-title">{{ item.title }}</text>
              <text class="goods-price">¥{{ (item.price / 100).toFixed(0) }} × {{ item.quantity }}</text>
            </view>
          </view>

          <!-- 优惠信息 -->
          <view class="order-discount" v-if="order.coupon_id || order.points_used">
            <text class="discount-item" v-if="order.coupon_id">{{ t('orderPage.couponDiscounted') }}</text>
            <text class="discount-item" v-if="order.points_used">{{ t('orderPage.pointsDiscountPrefix') }}{{ order.points_used }}{{ t('orderPage.pointsDiscountSuffix') }}</text>
          </view>

          <!-- 订单金额 -->
          <view class="order-amount">
            <text class="amount-label">{{ t('orderPage.paid') }}</text>
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

      <view v-if="loading && orderList.length" class="loading"><text>{{ t('common.loading') }}</text></view>

      <!-- 空状态 -->
      <view v-if="!orderList.length && !loading" class="empty">
        <image class="empty-icon" src="/static/icons/package.svg" mode="aspectFit" />
        <text class="empty-text">{{ t('orderPage.empty') }}</text>
        <view class="empty-btn" @tap="goMall"><text>{{ t('orderPage.goOrder') }}</text></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderStatusMap } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { formatDateTime as formatTime } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.myOrders')

const tab = ref('all')
const userStore = useUserStore()
const { list: orderList, loading, refreshing, load: loadList, refresh } = useList(
  (params) => bridge.order.myOrders({ ...params, page: 1, pageSize: 100, status: tab.value }),
  100
)

onShow(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能查看订单'))) return
  await loadList(true)
})

function onRefresh() { refresh() }
function switchTab(nextTab) { tab.value = nextTab; loadList(true) }

function getStatusText(s) { return orderStatusMap.value[s] || s }
function getIcon(type) {
  const map = { member: '/static/icons/service/member.svg', linker: '/static/icons/service/linker.svg', survey: '/static/icons/service/survey.svg', resource_pack: '/static/icons/service/resource_pack.svg', certification: '/static/icons/service/certification.svg' }
  return map[type] || '/static/icons/package.svg'
}

// 状态流转
async function payOrder(id) {
  try {
    const result = await bridge.order.pay(id)
    if (result?.mode === 'wechat') {
      if (typeof uni.requestPayment !== 'function') throw new Error('当前运行环境不支持微信支付，请在微信小程序中完成支付')
      uni.requestPayment({
        ...result.payment,
        success: () => {
          uni.showToast({ title: '支付已提交，到账后会自动更新', icon: 'none' })
          loadList(true)
        },
        fail: (error) => {
          uni.showToast({ title: error?.errMsg || '微信支付未完成', icon: 'none' })
        }
      })
      return
    } else {
      uni.showToast({ title: t('orderPage.paidSuccess'), icon: 'success' })
    }
    loadList(true)
  } catch (error) {
    uni.showToast({ title: error?.message || '支付未完成', icon: 'none' })
  }
}
async function confirmOrder(id) {
  await bridge.order.updateStatus(id, 'confirmed')
  uni.showToast({ title: t('orderPage.confirmed'), icon: 'success' })
  loadList(true)
}
async function startServe(id) {
  await bridge.order.updateStatus(id, 'serving')
  uni.showToast({ title: t('orderPage.serviceStarted'), icon: 'success' })
  loadList(true)
}
function completeOrder(id) {
  uni.showModal({
    title: t('orderPage.completeTitle'), content: t('orderPage.completeContent'),
    success: async (r) => {
      if (r.confirm) {
        await bridge.order.updateStatus(id, 'completed')
        uni.showToast({ title: t('orderPage.completed'), icon: 'success' })
        loadList(true)
      }
    }
  })
}
function cancelOrder(id) {
  uni.showModal({
    title: t('orderPage.cancelTitle'), content: t('orderPage.cancelContent'),
    success: async (r) => {
      if (r.confirm) {
        await bridge.order.updateStatus(id, 'cancelled')
        uni.showToast({ title: t('orderPage.cancelled'), icon: 'none' })
        loadList(true)
      }
    }
  })
}
function contactService() { uni.navigateTo({ url: '/pages/chat/index' }) }
function review() { uni.navigateTo({ url: '/pages/deals/index' }) }
function buyAgain() { uni.navigateTo({ url: '/pages/member/index' }) }
function goMall() { uni.navigateTo({ url: '/pages/member/index' }) }
</script>

<style scoped>
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; background: #F5F6FA; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */

.tab-bar { display: flex; background: #FFFFFF; padding: 0 16rpx; position: sticky; top: 0; z-index: 10; }
.tab-item { font-size: 28rpx; color: rgba(0,0,0,0.4); padding: 24rpx 24rpx; position: relative; }
.tab-item.active { color: #FF6B35; font-weight: bold; }
.tab-item.active::after { content: ''; position: absolute; bottom: 0; left: 24rpx; right: 24rpx; height: 4rpx; background: #FF6B35; border-radius: 2rpx; }

.list-scroll { flex: 1; min-height: 0; height: auto; padding: 16rpx 24rpx; }
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
.gi-icon { display: block; width: 32rpx; height: 32rpx; }
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
.empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 76rpx; height: 76rpx; margin-bottom: 24rpx; font-size: 44rpx; line-height: 1; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); margin-bottom: 32rpx; }
.empty-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 20rpx 56rpx; }
.empty-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
.loading { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

/* 订单列表固定保留筛选栏，卡片内标题和状态列按可用宽度收缩。 */
.tab-bar,
.order-card,
.order-header,
.order-goods,
.goods-info,
.order-amount { min-width: 0; }
.tab-bar { flex: 0 0 auto; overflow-x: auto; }
.tab-item { flex: 0 0 auto; white-space: nowrap; }
.goods-info { overflow: hidden; }
.goods-title,
.goods-price,
.order-no { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-status,
.amount-value { flex: 0 0 auto; white-space: nowrap; }

@media (max-width: 360px) {
  .tab-item { padding-right: 16rpx; padding-left: 16rpx; }
  .list-scroll { padding-right: 18rpx; padding-left: 18rpx; }
  .order-card { padding-right: 16rpx; padding-left: 16rpx; }
}
</style>
