<template>
  <view class="confirm-page">
    <!-- 服务信息 -->
    <view class="goods-card">
      <text class="card-label">服务信息</text>
      <view class="goods-item">
        <view class="goods-icon-box" :class="'type-' + (product?.service_type || 'resource_pack')">
          <text class="goods-icon">{{ getServiceIcon(product?.service_type) }}</text>
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
      <text class="coupon-label">🎫 优惠券</text>
      <view class="coupon-right">
        <text v-if="selectedCoupon" class="coupon-selected">-¥{{ (selectedCoupon.amount / 100).toFixed(0) }}</text>
        <text v-else-if="availableCoupons.length" class="coupon-available">{{ availableCoupons.length }}张可用</text>
        <text v-else class="coupon-none">暂无可用</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 积分抵扣 -->
    <view class="points-card">
      <view class="points-left">
        <text class="points-icon">🎁</text>
        <view class="points-info">
          <text class="points-title">积分抵扣</text>
          <text class="points-desc">{{ pointsBalance }}积分可用，{{ pointsUsed ? '抵扣¥' + (pointsUsed / 100).toFixed(0) : '100积分=¥1' }}</text>
        </view>
      </view>
      <switch :checked="usePoints" @change="togglePoints" color="#FF6B35"/>
    </view>

    <!-- 联系信息 -->
    <view class="contact-card">
      <text class="card-label">联系信息</text>
      <view class="contact-row"><text class="contact-label">姓名 *</text><input class="contact-input" v-model="form.contact_name" placeholder="请输入姓名" /></view>
      <view class="contact-row"><text class="contact-label">电话 *</text><input class="contact-input" type="number" v-model="form.phone" placeholder="请输入电话" /></view>
      <view class="contact-row"><text class="contact-label">备注</text><textarea class="contact-area" v-model="form.remark" placeholder="订单备注（可选）" /></view>
    </view>

    <!-- 金额汇总 -->
    <view class="summary-card">
      <view class="summary-row"><text class="summary-label">服务金额</text><text class="summary-value">¥{{ originalPrice }}</text></view>
      <view class="summary-row" v-if="couponDiscount > 0"><text class="summary-label">优惠券</text><text class="summary-discount">-¥{{ (couponDiscount / 100).toFixed(0) }}</text></view>
      <view class="summary-row" v-if="pointsDiscount > 0"><text class="summary-label">积分抵扣</text><text class="summary-discount">-¥{{ (pointsDiscount / 100).toFixed(0) }}</text></view>
      <view class="summary-row total"><text class="summary-label">应付金额</text><text class="summary-total">¥{{ finalPrice }}</text></view>
      <text class="summary-tip">Demo阶段为模拟支付，不产生真实交易</text>
    </view>

    <view style="height: 160rpx;"></view>

    <!-- 提交 -->
    <view class="submit-bar">
      <view class="submit-left">
        <text class="submit-amount-label">实付</text>
        <text class="submit-amount">¥{{ finalPrice }}</text>
      </view>
      <view class="submit-btn" @tap="submitOrder"><text>{{ submitting ? '提交中...' : '确认下单' }}</text></view>
    </view>

    <!-- 优惠券选择弹窗 -->
    <view v-if="showCouponPicker" class="modal-mask" @tap="showCouponPicker = false">
      <view class="modal-panel" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择优惠券</text>
          <text class="modal-close" @tap="showCouponPicker = false">✕</text>
        </view>
        <view class="coupon-option" v-for="c in availableCoupons" :key="c._id" :class="{ active: selectedCoupon?._id === c._id }" @tap="selectCoupon(c)">
          <view class="co-left">
            <text class="co-amount">{{ c.amount / 100 }}</text>
            <text class="co-unit">元</text>
          </view>
          <view class="co-right">
            <text class="co-name">{{ c.name }}</text>
            <text class="co-desc">{{ c.desc }}</text>
            <text class="co-expire">有效期至 {{ c.expire }}</text>
          </view>
          <view class="co-check" v-if="selectedCoupon?._id === c._id">✓</view>
        </view>
        <view class="coupon-option" :class="{ active: !selectedCoupon }" @tap="selectCoupon(null)">
          <text class="co-none-text">不使用优惠券</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { SERVICE_TYPES } from '@/config/constants'
import { productService, orderService, couponService, pointsService } from '@/mock/service'

const productId = ref('')
const product = ref(null)
const serviceTypes = SERVICE_TYPES
const form = ref({ contact_name: '', phone: '', remark: '' })
const submitting = ref(false)

const showCouponPicker = ref(false)
const selectedCoupon = ref(null)
const availableCoupons = ref([])
const usePoints = ref(false)
const pointsBalance = ref(0)
const pointsUsed = ref(0)

const originalPrice = computed(() => product.value ? (product.value.price / 100).toFixed(2) : '0.00')
const couponDiscount = computed(() => selectedCoupon.value ? Math.min(selectedCoupon.value.amount, product.value?.price || 0) : 0)
const pointsDiscount = computed(() => {
  if (!usePoints.value || !product.value) return 0
  const maxPoints = Math.min(pointsBalance.value, 10000)
  pointsUsed.value = maxPoints
  return maxPoints
})
const finalPrice = computed(() => {
  if (!product.value) return '0.00'
  const remaining = product.value.price - couponDiscount.value - pointsDiscount.value
  return (Math.max(0, remaining) / 100).toFixed(2)
})

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function togglePoints(e) {
  usePoints.value = e.detail.value
}

function selectCoupon(c) {
  selectedCoupon.value = c
  showCouponPicker.value = false
}

onLoad((q) => {
  productId.value = q.id
  product.value = productService.detail(q.id)
  availableCoupons.value = couponService.list().filter(c => !c.minSpend || (product.value?.price || 0) >= c.minSpend)
  pointsBalance.value = pointsService.getInfo().balance
  try { const last = uni.getStorageSync('last_order_contact'); if (last) { form.value.contact_name = last.name || ''; form.value.phone = last.phone || '' } } catch {}
})

async function submitOrder() {
  if (!product.value) { uni.showToast({ title: '商品信息错误', icon: 'none' }); return }
  if (!form.value.contact_name.trim() || !form.value.phone.trim()) { uni.showToast({ title: '请填写联系信息', icon: 'none' }); return }
  submitting.value = true
  try {
    orderService.create({
      user_id: 'demo_user_001',
      items: [{ _id: productId.value, title: product.value.title, price: product.value.price, quantity: 1 }],
      total_amount: Math.max(0, product.value.price - couponDiscount.value - pointsDiscount.value),
      coupon_id: selectedCoupon.value?._id || '',
      points_used: pointsUsed.value,
      ...form.value
    })
    if (selectedCoupon.value) couponService.claim(selectedCoupon.value._id)
    if (pointsUsed.value) {
      const info = pointsService.getInfo()
      info.balance -= pointsUsed.value
      info.history.unshift({ _id: 'p' + Date.now(), type: 'redeem', points: -pointsUsed.value, desc: '订单积分抵扣', date: '刚刚' })
    }
    uni.setStorageSync('last_order_contact', { name: form.value.contact_name, phone: form.value.phone })
    uni.showToast({ title: '下单成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/user/index' }), 1500)
  } finally { submitting.value = false }
}
</script>

<style scoped>
.confirm-page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 40rpx; }

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
.coupon-label { font-size: 28rpx; color: rgba(0,0,0,0.7); }
.coupon-right { display: flex; align-items: center; }
.coupon-selected { font-size: 28rpx; color: #FF6B35; font-weight: bold; }
.coupon-available { font-size: 24rpx; color: #FF6B35; }
.coupon-none { font-size: 24rpx; color: rgba(0,0,0,0.3); }
.arrow { font-size: 32rpx; color: rgba(0,0,0,0.2); margin-left: 8rpx; }

/* 积分卡片 */
.points-card { display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx 24rpx; margin-bottom: 12rpx; }
.points-left { display: flex; align-items: center; }
.points-icon { font-size: 36rpx; margin-right: 12rpx; }
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
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 400; display: flex; align-items: flex-end; }
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
</style>