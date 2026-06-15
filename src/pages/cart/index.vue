<template>
  <view class="page">
    <view v-if="cartItems.length" class="cart-list">
      <view class="cart-item" v-for="item in cartItems" :key="item._id">
        <view class="item-icon" :class="'type-' + (item.service_type || 'resource_pack')">
          <text class="icon-text">{{ getIcon(item.service_type) }}</text>
        </view>
        <view class="item-info">
          <text class="item-title">{{ item.title }}</text>
          <text class="item-price">¥{{ (item.price / 100).toFixed(0) }}</text>
        </view>
        <view class="qty-control">
          <view class="qty-btn" @tap="changeQty(item, -1)"><text>-</text></view>
          <text class="qty-num">{{ item.quantity }}</text>
          <view class="qty-btn" @tap="changeQty(item, 1)"><text>+</text></view>
        </view>
        <view class="item-remove" @tap="removeItem(item._id)"><text>✕</text></view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车空空如也</text>
      <view class="empty-btn" @tap="goMall"><text>去逛逛</text></view>
    </view>

    <!-- 结算栏 -->
    <view class="settle-bar" v-if="cartItems.length">
      <view class="settle-left">
        <text class="settle-check" @tap="toggleAll"><text>{{ allSelected ? '☑' : '☐' }}</text></text>
        <text class="settle-all-text">全选</text>
      </view>
      <view class="settle-right">
        <view class="settle-total">
          <text class="total-label">合计</text>
          <text class="total-amount">¥{{ (totalPrice / 100).toFixed(0) }}</text>
        </view>
        <view class="settle-btn" :class="{ disabled: !selectedItems.length }" @tap="checkout"><text>结算 ({{ selectedItems.length }})</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { cartService } from '@/mock/service'

const cartItems = ref([])
const selectedIds = ref([])

const allSelected = computed(() => cartItems.value.length > 0 && selectedIds.value.length === cartItems.value.length)
const selectedItems = computed(() => cartItems.value.filter(i => selectedIds.value.includes(i._id)))
const totalPrice = computed(() => selectedItems.value.reduce((s, i) => s + i.price * i.quantity, 0))

onShow(() => { reload() })

function reload() {
  cartItems.value = cartService.list()
  // 默认全选
  selectedIds.value = cartItems.value.map(i => i._id)
}

function getIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function changeQty(item, delta) {
  const newQty = item.quantity + delta
  cartService.updateQty(item._id, newQty)
  reload()
}

function removeItem(id) {
  uni.showModal({
    title: '提示', content: '确定删除该商品？',
    success: (r) => {
      if (r.confirm) { cartService.remove(id); reload() }
    }
  })
}

function toggleAll() {
  if (allSelected.value) selectedIds.value = []
  else selectedIds.value = cartItems.value.map(i => i._id)
}

function checkout() {
  if (!selectedItems.value.length) return
  // 购物车结算：简化为取第一个商品下单（Demo）
  const first = selectedItems.value[0]
  cartService.clear()
  uni.navigateTo({ url: `/pages/mall/order-confirm?id=${first._id}` })
}

function goMall() { uni.switchTab({ url: '/pages/mall/list' }) }
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 140rpx; }

.cart-list { display: flex; flex-direction: column; }
.cart-item { display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.item-icon { width: 72rpx; height: 72rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.type-member { background: rgba(255,107,53,0.1); }
.type-linker { background: rgba(99,102,241,0.1); }
.type-survey { background: rgba(16,185,129,0.1); }
.type-resource_pack { background: rgba(245,158,11,0.1); }
.type-certification { background: rgba(236,72,153,0.1); }
.icon-text { font-size: 36rpx; }
.item-info { flex: 1; }
.item-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 8rpx; }
.item-price { font-size: 32rpx; font-weight: bold; color: #FF6B35; }

.qty-control { display: flex; align-items: center; margin-right: 16rpx; }
.qty-btn { width: 48rpx; height: 48rpx; background: #F5F6FA; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; }
.qty-btn text { font-size: 32rpx; color: rgba(0,0,0,0.6); }
.qty-num { font-size: 28rpx; color: rgba(0,0,0,0.85); min-width: 56rpx; text-align: center; }

.item-remove { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.item-remove text { font-size: 24rpx; color: rgba(0,0,0,0.3); }

.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); margin-bottom: 32rpx; }
.empty-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 20rpx 56rpx; }
.empty-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }

/* 结算栏 */
.settle-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); }
.settle-left { display: flex; align-items: center; }
.settle-check text { font-size: 40rpx; color: #FF6B35; }
.settle-all-text { font-size: 26rpx; color: rgba(0,0,0,0.6); margin-left: 8rpx; }
.settle-right { display: flex; align-items: center; }
.settle-total { margin-right: 16rpx; }
.total-label { font-size: 24rpx; color: rgba(0,0,0,0.5); }
.total-amount { font-size: 36rpx; font-weight: bold; color: #FF6B35; }
.settle-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 22rpx 40rpx; }
.settle-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
.settle-btn.disabled { opacity: 0.4; }
</style>