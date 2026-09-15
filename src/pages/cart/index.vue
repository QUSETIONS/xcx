<template>
  <view v-if="loadState === 'loading'" class="page-state">
    <text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
    <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>{{ t('common.loadFailed') }}</text>
    <text class="page-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="page">
    <view v-if="cartItems.length" class="cart-list">
      <view class="cart-item" v-for="item in cartItems" :key="item._id">
        <view class="item-icon" :class="'type-' + (item.service_type || 'resource_pack')">
          <image class="icon-text" :src="getIcon(item.service_type)" mode="aspectFit" />
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
      <image class="empty-icon" src="/static/icons/tab/mall.svg" mode="aspectFit" />
      <text class="empty-text">{{ t('cartPage.empty') }}</text>
      <view class="empty-btn" @tap="goMall"><text>{{ t('cartPage.goShop') }}</text></view>
    </view>

    <!-- 结算栏 -->
    <view class="settle-bar" v-if="cartItems.length">
      <view class="settle-left">
        <text class="settle-check" @tap="toggleAll"><text>{{ allSelected ? '☑' : '☐' }}</text></text>
        <text class="settle-all-text">{{ t('cartPage.selectAll') }}</text>
      </view>
      <view class="settle-right">
        <view class="settle-total">
          <text class="total-label">{{ t('cartPage.total') }}</text>
          <text class="total-amount">¥{{ (totalPrice / 100).toFixed(0) }}</text>
        </view>
        <view class="settle-btn" :class="{ disabled: !selectedItems.length || mutating }" @tap="checkout"><text>{{ mutating ? t('common.loading') : `${t('cartPage.checkout')} (${selectedItems.length})` }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useRequest } from '@/hooks/useRequest'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.cart')

const cartItems = ref([])
const selectedIds = ref([])
const userStore = useUserStore()

const allSelected = computed(() => cartItems.value.length > 0 && selectedIds.value.length === cartItems.value.length)
const selectedItems = computed(() => cartItems.value.filter(i => selectedIds.value.includes(i._id)))
const totalPrice = computed(() => selectedItems.value.reduce((s, i) => s + i.price * i.quantity, 0))
const { state: loadState, run: loadRequest } = useRequest(() => bridge.cart.list())
const { state: quantityState, run: quantityRequest } = useRequest(async (id, quantity) => {
  await bridge.cart.updateQty(id, quantity)
  return bridge.cart.list()
})
const { state: removeState, run: removeRequest } = useRequest(async (id) => {
  await bridge.cart.remove(id)
  return bridge.cart.list()
})
const { state: checkoutState, run: checkoutRequest } = useRequest(async () => {
  await bridge.cart.clear()
  return true
})
const mutating = computed(() => quantityState.value === 'loading' || removeState.value === 'loading' || checkoutState.value === 'loading')

onShow(reload)

async function reload() {
  if (!(await requirePageLogin(userStore, '登录后才能查看购物车'))) return
  try {
    applyCartItems(await loadRequest())
  } catch {
    toastError(t('common.loadFailed'))
  }
}

function applyCartItems(items) {
  cartItems.value = items || []
  // 默认全选
  selectedIds.value = cartItems.value.map(i => i._id)
}

function getIcon(type) {
  const map = { member: 'member', linker: 'linker', survey: 'survey', resource_pack: 'resource_pack', certification: 'certification' }
  return `/static/icons/service/${map[type] || 'resource_pack'}.svg`
}

async function changeQty(item, delta) {
  if (mutating.value) return
  const newQty = item.quantity + delta
  try {
    applyCartItems(await quantityRequest(item._id, newQty))
  } catch {
    toastError(t('common.loadFailed'))
  }
}

async function removeItem(id) {
  uni.showModal({
    title: t('cartPage.deleteTitle'), content: t('cartPage.deleteContent'),
    success: async (r) => {
      if (r.confirm && !mutating.value) {
        try {
          applyCartItems(await removeRequest(id))
        } catch {
          toastError(t('common.loadFailed'))
        }
      }
    }
  })
}

function toggleAll() {
  if (allSelected.value) selectedIds.value = []
  else selectedIds.value = cartItems.value.map(i => i._id)
}

async function checkout() {
  if (!selectedItems.value.length || mutating.value) return
  // 购物车结算：简化为取第一个商品下单（Demo）
  const first = selectedItems.value[0]
  try {
    await checkoutRequest()
    uni.navigateTo({ url: `/pages/mall/order-confirm?id=${first._id}` })
  } catch {
    toastError(t('common.loadFailed'))
  }
}

function goMall() { uni.navigateTo({ url: '/pages/member/index' }) }
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 140rpx; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }

.cart-list { display: flex; flex-direction: column; }
.cart-item { display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.item-icon { width: 72rpx; height: 72rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.type-member { background: rgba(255,107,53,0.1); }
.type-linker { background: rgba(99,102,241,0.1); }
.type-survey { background: rgba(16,185,129,0.1); }
.type-resource_pack { background: rgba(245,158,11,0.1); }
.type-certification { background: rgba(236,72,153,0.1); }
.icon-text { display: block; width: 38rpx; height: 38rpx; }
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
.empty-icon { display: block; width: 72rpx; height: 72rpx; margin-bottom: 24rpx; }
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

/* 购物车行和底部结算栏使用可收缩的内容列，数量/删除/结算动作不会被长标题挤出画布。 */
.page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.cart-item, .item-info, .qty-control, .settle-bar, .settle-left, .settle-right, .settle-total { min-width: 0; }
.item-info { flex: 1; overflow: hidden; }
.item-title { max-width: 100%; overflow: hidden; overflow-wrap: anywhere; word-break: break-word; text-overflow: ellipsis; white-space: nowrap; }
.item-price, .qty-control, .item-remove, .settle-check, .settle-btn { flex: 0 0 auto; }
.settle-bar { box-sizing: border-box; gap: 12rpx; }
.settle-left { flex: 0 0 auto; }
.settle-right { flex: 1; justify-content: flex-end; overflow: hidden; }
.settle-total { overflow: hidden; }
.total-label, .total-amount { white-space: nowrap; }
.settle-btn { max-width: 100%; white-space: nowrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .cart-item { padding: 16rpx; }
  .item-icon { width: 64rpx; height: 64rpx; margin-right: 12rpx; }
  .qty-control { margin-right: 8rpx; }
  .qty-num { min-width: 42rpx; }
  .settle-bar { padding-right: 16rpx; padding-left: 16rpx; }
  .settle-all-text { font-size: 23rpx; }
  .settle-total { margin-right: 8rpx; }
  .settle-btn { padding-right: 24rpx; padding-left: 24rpx; }
  .settle-btn text { font-size: 25rpx; }
}
</style>
