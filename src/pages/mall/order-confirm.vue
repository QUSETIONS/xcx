<template>
  <view class="confirm-page">
    <!-- 服务信息 -->
    <view class="goods-card glass-card">
      <text class="card-label">服务信息</text>
      <view class="goods-item">
        <view class="goods-icon-box" :style="{ background: getIconBg(product?.service_type) }">
          <text class="goods-icon">{{ getServiceIcon(product?.service_type) }}</text>
        </view>
        <view class="goods-info">
          <text class="goods-title">{{ product?.title }}</text>
          <text class="goods-type">{{ serviceTypes[product?.service_type] }}</text>
          <text class="goods-price">¥{{ (product?.price / 100).toFixed(0) }}</text>
        </view>
      </view>
    </view>

    <!-- 联系信息 -->
    <view class="contact-card glass-card">
      <text class="card-label">联系信息</text>
      <view class="contact-row"><text class="contact-label">姓名 *</text><input class="contact-input" v-model="form.contact_name" placeholder="请输入姓名" /></view>
      <view class="contact-row"><text class="contact-label">电话 *</text><input class="contact-input" type="number" v-model="form.phone" placeholder="请输入电话" /></view>
      <view class="contact-row"><text class="contact-label">备注</text><textarea class="contact-area" v-model="form.remark" placeholder="订单备注（可选）" /></view>
    </view>

    <!-- 金额汇总 -->
    <view class="summary-card glass-card">
      <view class="summary-row"><text class="summary-label">服务金额</text><text class="summary-value">¥{{ total }}</text></view>
      <view class="summary-row total"><text class="summary-label">应付金额</text><text class="summary-total gradient-text">¥{{ total }}</text></view>
      <text class="summary-tip">Demo阶段为模拟支付，不产生真实交易</text>
    </view>

    <!-- 提交 -->
    <view class="submit-bar glass-card-strong">
      <button class="btn-glow" @tap="submitOrder" :disabled="submitting"><text>{{ submitting ? '提交中...' : '确认下单' }}</text></button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { SERVICE_TYPES } from '@/config/constants'
import { productService, orderService } from '@/mock/service'

const productId = ref('')
const product = ref(null)
const serviceTypes = SERVICE_TYPES
const form = ref({ contact_name: '', phone: '', remark: '' })
const submitting = ref(false)

const total = computed(() => product.value ? (product.value.price / 100).toFixed(2) : '0.00')

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function getIconBg(type) {
  const map = {
    member: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.05))',
    linker: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))',
    survey: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
    resource_pack: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
    certification: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))'
  }
  return map[type] || map.resource_pack
}

onLoad((q) => {
  productId.value = q.id
  product.value = productService.detail(q.id)
  try { const last = uni.getStorageSync('last_order_contact'); if (last) { form.value.contact_name = last.name || ''; form.value.phone = last.phone || '' } } catch {}
})

async function submitOrder() {
  if (!form.value.contact_name.trim() || !form.value.phone.trim()) { uni.showToast({ title: '请填写联系信息', icon: 'none' }); return }
  submitting.value = true
  try {
    orderService.create({ user_id: 'demo_user_001', items: [{ _id: productId.value, title: product.value.title, price: product.value.price, quantity: 1 }], ...form.value })
    uni.setStorageSync('last_order_contact', { name: form.value.contact_name, phone: form.value.phone })
    uni.showToast({ title: '下单成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/user/index' }), 1500)
  } finally { submitting.value = false }
}
</script>

<style lang="scss" scoped>
.confirm-page { min-height: 100vh; background: $bg-primary; padding: $space-4; padding-bottom: 160rpx; }

.goods-card, .contact-card, .summary-card { padding: $space-4; margin-bottom: $space-3; }
.card-label { font-size: $font-base; font-weight: $weight-semibold; color: $text-secondary; display: block; margin-bottom: $space-3; }

.goods-item { display: flex; gap: $space-3; }
.goods-icon-box { width: 72rpx; height: 72rpx; border-radius: $radius-lg; display: flex; align-items: center; justify-content: center; }
.goods-icon { font-size: 36rpx; }
.goods-info { flex: 1; }
.goods-title { font-size: $font-md; font-weight: $weight-semibold; color: $text-primary; display: block; margin-bottom: 4rpx; }
.goods-type { font-size: $font-xs; color: $text-tertiary; display: block; margin-bottom: 8rpx; }
.goods-price { font-size: $font-lg; font-weight: $weight-bold; color: $color-primary; }

.contact-row { display: flex; flex-direction: column; margin-bottom: $space-3; }
.contact-label { font-size: $font-sm; color: $text-secondary; margin-bottom: $space-1; }
.contact-input { height: 72rpx; background: $glass-bg; border: 1rpx solid $glass-border; border-radius: $radius-md; padding: $space-3; font-size: $font-base; color: $text-primary; }
.contact-area { height: 100rpx; background: $glass-bg; border: 1rpx solid $glass-border; border-radius: $radius-md; padding: $space-3; font-size: $font-base; color: $text-primary; }

.summary-row { display: flex; justify-content: space-between; padding: $space-2 0; }
.summary-label { font-size: $font-sm; color: $text-secondary; }
.summary-value { font-size: $font-sm; color: $text-primary; }
.summary-row.total { padding-top: $space-3; border-top: 1rpx solid $border-color; margin-top: $space-2; }
.summary-total { font-size: $font-xl; font-weight: $weight-black; }
.summary-tip { font-size: $font-xs; color: $text-tertiary; text-align: center; display: block; margin-top: $space-3; }

.submit-bar { position: fixed; bottom: $space-4; left: $space-4; right: $space-4; padding: $space-3; }
.btn-glow { width: 100%; }
</style>