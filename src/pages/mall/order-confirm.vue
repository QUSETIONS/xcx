<template>
  <view v-if="loadState === 'loading'" class="detail-state"><text>正在准备订单…</text></view>

  <view v-else-if="loadState === 'error'" class="detail-state error-state" @tap="reload">
    <image class="detail-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>订单信息加载失败，点击重试</text>
  </view>

  <view class="confirm-page" v-else-if="product">
    <!-- 服务信息 -->
    <view class="goods-card">
      <text class="card-label">{{ t('orderConfirm.serviceInfo') }}</text>
      <view class="goods-item">
        <view class="goods-icon-box" :class="'type-' + (product?.service_type || 'resource_pack')">
          <image class="goods-icon" :src="getServiceIcon(product?.service_type)" mode="aspectFit" />
        </view>
        <view class="goods-info">
          <text class="goods-title">{{ product?.title }}</text>
          <text class="goods-type">{{ serviceTypes[product?.service_type] }}</text>
          <text class="goods-price">¥{{ (product?.price / 100).toFixed(0) }}</text>
        </view>
      </view>
    </view>

    <!-- 优惠券选择 -->
    <view class="coupon-card" @tap="showCouponPicker = true">
      <view class="coupon-label"><image src="/static/icons/ticket.svg" mode="aspectFit" /><text>{{ t('orderConfirm.coupon') }}</text></view>
      <view class="coupon-right">
        <text v-if="selectedCoupon" class="coupon-selected">-¥{{ (selectedCoupon.amount / 100).toFixed(0) }}</text>
        <text v-else-if="availableCoupons.length" class="coupon-available">{{ availableCoupons.length }}{{ t('orderConfirm.couponCountSuffix') }}</text>
        <text v-else class="coupon-none">{{ t('orderConfirm.couponNone') }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 积分抵扣 -->
    <view class="points-card">
      <view class="points-left">
        <image class="points-icon" src="/static/icons/gift.svg" mode="aspectFit" />
        <view class="points-info">
          <text class="points-title">{{ t('orderConfirm.pointsTitle') }}</text>
          <text class="points-desc">{{ pointsDesc }}</text>
        </view>
      </view>
      <switch :checked="usePoints" @change="togglePoints" color="#FF6B35"/>
    </view>

    <!-- 联系信息 -->
    <view class="contact-card">
      <text class="card-label">{{ t('orderConfirm.contactInfo') }}</text>
      <view class="contact-row"><text class="contact-label">{{ t('orderConfirm.nameLabel') }}</text><input class="contact-input" v-model="form.contact_name" :placeholder="t('orderConfirm.namePlaceholder')" /></view>
      <view class="contact-row"><text class="contact-label">{{ t('orderConfirm.phoneLabel') }}</text><input class="contact-input" type="number" v-model="form.phone" :placeholder="t('orderConfirm.phonePlaceholder')" /></view>
      <view class="contact-row"><text class="contact-label">{{ t('orderConfirm.remarkLabel') }}</text><textarea class="contact-area" v-model="form.remark" :placeholder="t('orderConfirm.remarkPlaceholder')" /></view>
    </view>

    <!-- 金额汇总 -->
    <view class="summary-card">
      <view class="summary-row"><text class="summary-label">{{ t('orderConfirm.serviceAmount') }}</text><text class="summary-value">¥{{ originalPrice }}</text></view>
      <view class="summary-row" v-if="couponDiscount > 0"><text class="summary-label">{{ t('orderConfirm.coupon') }}</text><text class="summary-discount">-¥{{ (couponDiscount / 100).toFixed(0) }}</text></view>
      <view class="summary-row" v-if="pointsDiscount > 0"><text class="summary-label">{{ t('orderConfirm.pointsDiscount') }}</text><text class="summary-discount">-¥{{ (pointsDiscount / 100).toFixed(0) }}</text></view>
      <view class="summary-row total"><text class="summary-label">{{ t('orderConfirm.totalDue') }}</text><text class="summary-total">¥{{ finalPrice }}</text></view>
      <text class="summary-tip">{{ t('orderConfirm.demoTip') }}</text>
    </view>

    <view style="height: 160rpx;"></view>

    <!-- 提交 -->
    <view class="submit-bar">
      <view class="submit-left">
        <text class="submit-amount-label">{{ t('orderConfirm.paid') }}</text>
        <text class="submit-amount">¥{{ finalPrice }}</text>
      </view>
      <view class="submit-btn" @tap="submitOrder"><text>{{ submitting ? t('orderConfirm.submitting') : t('orderConfirm.confirmOrder') }}</text></view>
    </view>

    <!-- 优惠券选择弹窗 -->
    <view v-if="showCouponPicker" class="modal-mask" @tap="showCouponPicker = false">
      <view class="modal-panel" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ t('orderConfirm.selectCoupon') }}</text>
          <text class="modal-close" @tap="showCouponPicker = false">✕</text>
        </view>
        <view class="coupon-option" v-for="c in availableCoupons" :key="c._id" :class="{ active: selectedCoupon?._id === c._id }" @tap="selectCoupon(c)">
          <view class="co-left">
            <text class="co-amount">{{ c.amount / 100 }}</text>
            <text class="co-unit">{{ t('orderConfirm.yuan') }}</text>
          </view>
          <view class="co-right">
            <text class="co-name">{{ c.name }}</text>
            <text class="co-desc">{{ c.desc }}</text>
            <text class="co-expire">{{ t('orderConfirm.validUntil') }}{{ c.expire }}</text>
          </view>
          <view class="co-check" v-if="selectedCoupon?._id === c._id">✓</view>
        </view>
        <view class="coupon-option" :class="{ active: !selectedCoupon }" @tap="selectCoupon(null)">
          <text class="co-none-text">{{ t('orderConfirm.noCoupon') }}</text>
        </view>
      </view>
    </view>
  </view>

  <view v-else class="empty"><image class="empty-icon" src="/static/icons/package.svg" mode="aspectFit" /><text>{{ t('orderConfirm.productError') }}</text></view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { serviceTypes } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { guardClick, toastSuccess, toastError, hapticSuccess } from '@/utils/feedback'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.orderConfirm')

const productId = ref('')
const product = ref(null)
const form = ref({ contact_name: '', phone: '', remark: '' })
const userStore = useUserStore()

const showCouponPicker = ref(false)
const selectedCoupon = ref(null)
const availableCoupons = ref([])
const usePoints = ref(false)
const pointsBalance = ref(0)

const originalPrice = computed(() => product.value ? (product.value.price / 100).toFixed(2) : '0.00')
const couponDiscount = computed(() => selectedCoupon.value ? Math.min(selectedCoupon.value.amount, product.value?.price || 0) : 0)
const maxRedeemablePoints = computed(() => {
  if (!product.value) return 0
  return Math.min(pointsBalance.value, 10000, Math.max(0, (product.value.price || 0) - couponDiscount.value))
})
const pointsDiscount = computed(() => {
  if (!usePoints.value || !product.value) return 0
  return maxRedeemablePoints.value
})
const finalPrice = computed(() => {
  if (!product.value) return '0.00'
  const remaining = product.value.price - couponDiscount.value - pointsDiscount.value
  return (Math.max(0, remaining) / 100).toFixed(2)
})

// 积分抵扣说明（含余额/抵扣金额，需随语言切换）
const pointsDesc = computed(() => {
  const bal = pointsBalance.value
  const used = pointsDiscount.value
  if (used) return t('orderConfirm.pointsDescUsed').replace('{balance}', bal).replace('{amount}', (used / 100).toFixed(0))
  return t('orderConfirm.pointsDescRate').replace('{balance}', bal)
})

const { state: loadState, run: loadRequest } = useRequest(loadOrderData)
const { state: submitState, run: submitRequest } = useRequest(async (payload) => {
  // 优惠券和积分都由服务端在创建订单的同一个事务中核销；
  // 这里不再只改前端内存，刷新后仍能看到真实余额和券状态。
  return bridge.order.create(payload)
})
const submitting = computed(() => submitState.value === 'loading')

function getServiceIcon(type) {
  const map = { member: '/static/icons/service/member.svg', linker: '/static/icons/service/linker.svg', survey: '/static/icons/service/survey.svg', resource_pack: '/static/icons/service/resource_pack.svg', certification: '/static/icons/service/certification.svg' }
  return map[type] || '/static/icons/package.svg'
}

function togglePoints(e) {
  usePoints.value = e.detail.value
}

function selectCoupon(c) {
  selectedCoupon.value = c
  showCouponPicker.value = false
}

async function loadOrderData(id) {
  const [detail, coupons, pointsInfo] = await Promise.all([
    bridge.product.detail(id),
    bridge.coupon.list(),
    bridge.points.getInfo()
  ])
  product.value = detail
  availableCoupons.value = coupons.filter(c => !c.minSpend || (detail?.price || 0) >= c.minSpend)
  pointsBalance.value = pointsInfo.balance
  return detail
}

async function reload() {
  if (!productId.value) return
  try {
    await loadRequest(productId.value)
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onLoad(async (q) => {
  if (!(await requirePageLogin(userStore, '登录后才能确认订单'))) return
  productId.value = q.id || ''
  if (productId.value) {
    try {
      await loadRequest(productId.value)
    } catch {
      toastError(t('common.loadFailed'))
    }
  }
  try { const last = uni.getStorageSync('last_order_contact'); if (last) { form.value.contact_name = last.name || ''; form.value.phone = last.phone || '' } } catch {}
})

async function doSubmit() {
  if (!product.value) { toastError(t('orderConfirm.productError')); return }
  if (!form.value.contact_name.trim() || !form.value.phone.trim()) { toastError(t('orderConfirm.fillContact')); return }
  try {
    await submitRequest({
      items: [{ _id: productId.value, title: product.value.title, price: product.value.price, quantity: 1 }],
      coupon_id: selectedCoupon.value?._id || '',
      points_used: pointsDiscount.value,
      ...form.value
    })
    uni.setStorageSync('last_order_contact', { name: form.value.contact_name, phone: form.value.phone })
    hapticSuccess()
    toastSuccess(t('orderConfirm.orderSuccess'))
    setTimeout(() => uni.redirectTo({ url: '/pages/order/index' }), 1500)
  } catch {
    toastError(t('common.loadFailed'))
  }
}

// 防重复提交：1.5s 内只允许一次，避免误触重复下单
const submitOrder = guardClick(doSubmit, 1500)
</script>

<style scoped>
.confirm-page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 40rpx; }
.detail-state { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; color: rgba(0,0,0,0.5); font-size: 28rpx; }
.detail-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.empty { text-align: center; padding: 160rpx 64rpx; color: rgba(0,0,0,0.5); }
.empty-icon { width: 80rpx; height: 80rpx; display: block; margin: 0 auto 16rpx; }

.goods-card, .contact-card, .summary-card { background: #FFFFFF; border-radius: 16rpx; padding: 24rpx; margin-bottom: 12rpx; }
.card-label { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.6); display: block; margin-bottom: 16rpx; }

.goods-item { display: flex; align-items: center; }
.goods-icon-box { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.type-member { background: rgba(255,107,53,0.1); }
.type-linker { background: rgba(99,102,241,0.1); }
.type-survey { background: rgba(16,185,129,0.1); }
.type-resource_pack { background: rgba(245,158,11,0.1); }
.type-certification { background: rgba(236,72,153,0.1); }
.goods-icon { font-size: 36rpx; }
.goods-info { flex: 1; }
.goods-title { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.goods-type { font-size: 22rpx; color: rgba(0,0,0,0.4); display: block; margin-bottom: 8rpx; }
.goods-price { font-size: 36rpx; font-weight: bold; color: #FF6B35; }

/* 优惠券卡片 */
.coupon-card { display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx 24rpx; margin-bottom: 12rpx; }
.coupon-label { display: flex; align-items: center; gap: 10rpx; font-size: 28rpx; color: rgba(0,0,0,0.7); }
.coupon-label image { width: 30rpx; height: 30rpx; }
.coupon-right { display: flex; align-items: center; }
.coupon-selected { font-size: 28rpx; color: #FF6B35; font-weight: bold; }
.coupon-available { font-size: 24rpx; color: #FF6B35; }
.coupon-none { font-size: 24rpx; color: rgba(0,0,0,0.3); }
.arrow { font-size: 32rpx; color: rgba(0,0,0,0.2); margin-left: 8rpx; }

/* 积分卡片 */
.points-card { display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx 24rpx; margin-bottom: 12rpx; }
.points-left { display: flex; align-items: center; }
.points-icon { width: 36rpx; height: 36rpx; margin-right: 12rpx; }
.points-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.7); display: block; }
.points-desc { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.contact-row { display: flex; flex-direction: column; margin-bottom: 16rpx; }
.contact-label { font-size: 24rpx; color: rgba(0,0,0,0.5); margin-bottom: 8rpx; }
.contact-input { height: 72rpx; background: #F5F6FA; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.contact-area { height: 100rpx; background: #F5F6FA; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 28rpx; color: rgba(0,0,0,0.85); }

.summary-card { background: #FFFFFF; border-radius: 16rpx; padding: 24rpx; margin-bottom: 12rpx; }
.summary-row { display: flex; justify-content: space-between; padding: 8rpx 0; }
.summary-label { font-size: 26rpx; color: rgba(0,0,0,0.5); }
.summary-value { font-size: 26rpx; color: rgba(0,0,0,0.8); }
.summary-discount { font-size: 26rpx; color: #10B981; }
.summary-row.total { padding-top: 16rpx; border-top: 1rpx solid #F5F6FA; margin-top: 8rpx; }
.summary-total { font-size: 40rpx; font-weight: bold; color: #FF6B35; }
.summary-tip { font-size: 20rpx; color: rgba(0,0,0,0.3); text-align: center; display: block; margin-top: 12rpx; }

/* 底部提交栏 */
.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); }
.submit-left { flex: 1; }
.submit-amount-label { font-size: 24rpx; color: rgba(0,0,0,0.5); }
.submit-amount { font-size: 40rpx; font-weight: bold; color: #FF6B35; }
.submit-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 24rpx 56rpx; }
.submit-btn text { font-size: 30rpx; color: #FFFFFF; font-weight: bold; }

/* 优惠券弹窗 */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1200; display: flex; align-items: flex-end; }
.modal-panel { width: 100%; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; padding: 24rpx; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.modal-close { font-size: 36rpx; color: rgba(0,0,0,0.3); padding: 4rpx; }

.coupon-option { display: flex; align-items: center; background: #F8F9FC; border-radius: 12rpx; padding: 16rpx; margin-bottom: 12rpx; border: 2rpx solid transparent; }
.coupon-option.active { border-color: #FF6B35; background: rgba(255,107,53,0.04); }
.co-left { display: flex; flex-direction: column; align-items: center; min-width: 100rpx; margin-right: 16rpx; }
.co-amount { font-size: 40rpx; font-weight: bold; color: #FF6B35; }
.co-unit { font-size: 20rpx; color: #FF6B35; }
.co-right { flex: 1; }
.co-name { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.co-desc { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 4rpx; }
.co-expire { font-size: 20rpx; color: rgba(0,0,0,0.35); }
.co-check { width: 40rpx; height: 40rpx; background: #FF6B35; border-radius: 50%; color: #FFFFFF; font-size: 24rpx; display: flex; align-items: center; justify-content: center; }
.co-none-text { font-size: 28rpx; color: rgba(0,0,0,0.5); text-align: center; flex: 1; }

/* Overflow guard: checkout rows keep their labels readable and let long coupon text wrap. */
.confirm-page,
.goods-card,
.contact-card,
.summary-card,
.goods-item,
.goods-info,
.coupon-card,
.coupon-label,
.coupon-right,
.points-card,
.points-left,
.points-info,
.summary-row,
.submit-bar,
.submit-left,
.modal-panel,
.modal-header,
.coupon-option,
.co-right { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.confirm-page { overflow-x: hidden; }
.goods-info,
.points-info,
.co-right,
.submit-left { flex: 1 1 auto; overflow: hidden; }
.goods-title,
.goods-type,
.points-title,
.points-desc,
.coupon-selected,
.coupon-available,
.coupon-none,
.summary-label,
.summary-value,
.summary-discount,
.summary-tip,
.co-name,
.co-desc,
.co-expire { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.goods-title,
.goods-type,
.points-desc,
.coupon-selected,
.coupon-available,
.coupon-none,
.summary-label,
.summary-value,
.summary-discount,
.co-name,
.co-desc,
.co-expire { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.coupon-label,
.coupon-right,
.points-card,
.points-left,
.summary-row,
.submit-bar,
.modal-header,
.coupon-option { gap: 10rpx; }
.coupon-label,
.coupon-right,
.points-left,
.summary-label,
.summary-value,
.submit-left,
.submit-btn,
.co-left,
.co-check,
.modal-close { flex: 0 0 auto; }
.coupon-right,
.submit-btn { white-space: nowrap; }
.coupon-label { width: auto; flex: 0 1 auto; }
.coupon-right { width: auto; flex: 0 1 auto; justify-content: flex-end; }
.points-left { width: auto; flex: 1 1 auto; overflow: hidden; }
.contact-input,
.contact-area { width: 100%; max-width: 100%; box-sizing: border-box; }
.submit-bar { overflow-x: hidden; }
.submit-btn { padding-right: 32rpx; padding-left: 32rpx; }
.modal-panel { overflow-x: hidden; }

@media (max-width: 420px) {
  .confirm-page { padding-right: 16rpx; padding-left: 16rpx; }
  .goods-card,
  .contact-card,
  .summary-card { padding: 18rpx; }
  .submit-bar { padding-right: 16rpx; padding-left: 16rpx; }
  .submit-btn { padding-right: 20rpx; padding-left: 20rpx; }
  .submit-btn text { font-size: 26rpx; }
  .modal-panel { padding-right: 16rpx; padding-left: 16rpx; }
  .co-left { min-width: 78rpx; margin-right: 4rpx; }
}
</style>
