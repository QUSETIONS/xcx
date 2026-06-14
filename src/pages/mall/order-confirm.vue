<template>
  <view class="confirm-page">
    <view class="goods-card">
      <text class="card-label">服务信息</text>
      <view class="goods-item">
        <text class="goods-icon">{{ getServiceIcon(product?.service_type) }}</text>
        <view class="goods-info">
          <text class="goods-title">{{ product?.title }}</text>
          <view class="goods-price-row">
            <text class="goods-price">¥{{ (product?.price / 100).toFixed(0) }}</text>
            <text class="goods-qty">×1</text>
          </view>
        </view>
      </view>
    </view>

    <view class="contact-card">
      <text class="card-label">联系信息</text>
      <view class="contact-item">
        <text class="contact-label">姓名 *</text>
        <input class="contact-input" v-model="form.contact_name" placeholder="请输入姓名" />
      </view>
      <view class="contact-item">
        <text class="contact-label">电话 *</text>
        <input class="contact-input" type="number" v-model="form.phone" placeholder="请输入电话" />
      </view>
      <view class="contact-item">
        <text class="contact-label">备注</text>
        <textarea class="contact-area" v-model="form.remark" placeholder="订单备注（可选）" />
      </view>
    </view>

    <view class="summary-card">
      <view class="summary-row"><text>服务金额</text><text>¥{{ total }}</text></view>
      <view class="summary-row total"><text>应付金额</text><text class="total-price">¥{{ total }}</text></view>
      <text class="summary-tip">Demo阶段为模拟支付，不产生真实交易</text>
    </view>

    <view class="submit-wrap">
      <button class="submit-btn" @tap="submitOrder" :disabled="submitting">{{ submitting ? '提交中...' : '确认下单' }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { productService, orderService } from '@/mock/service'

const productId = ref('')
const product = ref(null)
const form = ref({ contact_name: '', phone: '', remark: '' })
const submitting = ref(false)

const total = computed(() => product.value ? (product.value.price / 100).toFixed(2) : '0.00')

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

onLoad((q) => {
  productId.value = q.id
  product.value = productService.detail(q.id)
  // 恢复上次联系人
  try {
    const last = uni.getStorageSync('last_order_contact')
    if (last) { form.value.contact_name = last.name || ''; form.value.phone = last.phone || '' }
  } catch {}
})

async function submitOrder() {
  if (!form.value.contact_name.trim() || !form.value.phone.trim()) {
    uni.showToast({ title: '请填写联系信息', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    orderService.create({
      user_id: 'demo_user_001',
      items: [{ _id: productId.value, title: product.value.title, price: product.value.price, quantity: 1 }],
      ...form.value
    })
    uni.setStorageSync('last_order_contact', { name: form.value.contact_name, phone: form.value.phone })
    uni.showToast({ title: '下单成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/user/index' }), 1500)
  } finally { submitting.value = false }
}
</script>

<style lang="scss" scoped>
.confirm-page { min-height: 100vh; background: #f5f5f5; padding: 24rpx; padding-bottom: 160rpx; }
.goods-card, .contact-card, .summary-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.card-label { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 16rpx; }
.goods-item { display: flex; align-items: center; gap: 16rpx; }
.goods-icon { font-size: 48rpx; }
.goods-info { flex: 1; }
.goods-title { font-size: 28rpx; color: #333; display: block; }
.goods-price-row { display: flex; justify-content: space-between; margin-top: 8rpx; }
.goods-price { font-size: 28rpx; font-weight: 600; color: #FF6B35; }
.goods-qty { font-size: 24rpx; color: #999; }
.contact-item { margin-bottom: 16rpx; }
.contact-label { font-size: 26rpx; color: #666; display: block; margin-bottom: 8rpx; }
.contact-input { width: 100%; height: 76rpx; border: 2rpx solid #eee; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 28rpx; }
.contact-area { width: 100%; height: 100rpx; border: 2rpx solid #eee; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 28rpx; }
.summary-row { display: flex; justify-content: space-between; font-size: 28rpx; color: #666; padding: 8rpx 0; }
.summary-row.total { font-weight: 600; }
.total-price { font-size: 32rpx; color: #FF6B35; }
.summary-tip { font-size: 22rpx; color: #999; text-align: center; display: block; margin-top: 8rpx; }
.submit-wrap { position: fixed; bottom: 0; left: 0; right: 0; padding: 24rpx; background: #fff; }
.submit-btn { width: 100%; background: #FF6B35; color: #fff; border-radius: 48rpx; padding: 24rpx; font-size: 32rpx; border: none; }
</style>