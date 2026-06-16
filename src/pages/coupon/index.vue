<template>
  <view class="page">
    <view class="header"><text class="header-title">我的优惠券</text></view>

    <view class="coupon-list">
      <view class="coupon-item card-press" v-for="item in coupons" :key="item._id" @tap="useCoupon(item)">
        <view class="coupon-left">
          <text class="coupon-amount">{{ item.amount / 100 }}</text>
          <text class="coupon-unit">元</text>
        </view>
        <view class="coupon-divider"></view>
        <view class="coupon-right">
          <text class="coupon-name">{{ item.name }}</text>
          <text class="coupon-desc">{{ item.desc }}</text>
          <text class="coupon-expire">有效期至 {{ item.expire }}</text>
        </view>
        <view class="coupon-use"><text>使用</text></view>
      </view>
    </view>

    <view v-if="!coupons.length" class="empty">
      <text class="empty-icon">🎫</text>
      <text class="empty-text">暂无可用优惠券</text>
      <text class="empty-btn" @tap="goMall">去逛逛</text>
    </view>

    <view class="tips-card">
      <text class="tips-title">💡 优惠券说明</text>
      <text class="tips-item">• 优惠券可在下单时自动抵扣</text>
      <text class="tips-item">• 每笔订单仅可使用一张优惠券</text>
      <text class="tips-item">• 优惠券过期后自动失效，请及时使用</text>
      <text class="tips-item">• 通过签到、邀请好友等方式获取更多优惠券</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { couponService } from '@/mock/service'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.coupon')

const coupons = ref(couponService.list())

function useCoupon(item) {
  uni.showModal({
    title: '使用优惠券',
    content: `是否前往商城使用「${item.name}」？`,
    success: (res) => { if (res.confirm) uni.switchTab({ url: '/pages/mall/list' }) }
  })
}
function goMall() { uni.switchTab({ url: '/pages/mall/list' }) }
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }
.header { margin-bottom: 16rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.coupon-list { margin-bottom: 16rpx; }
.coupon-item { display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; overflow: hidden; }
.coupon-left { display: flex; flex-direction: column; align-items: center; min-width: 120rpx; margin-right: 16rpx; }
.coupon-amount { font-size: 48rpx; font-weight: bold; color: #FF6B35; }
.coupon-unit { font-size: 22rpx; color: #FF6B35; }
.coupon-divider { width: 2rpx; height: 80rpx; background: #F0F1F5; margin-right: 16rpx; border-style: dashed; }
.coupon-right { flex: 1; }
.coupon-name { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.coupon-desc { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 4rpx; }
.coupon-expire { font-size: 20rpx; color: rgba(0,0,0,0.35); }
.coupon-use { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; padding: 12rpx 24rpx; margin-left: 12rpx; }
.coupon-use text { font-size: 24rpx; color: #FFFFFF; font-weight: bold; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-btn { font-size: 24rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 12rpx 32rpx; border-radius: 24rpx; display: inline-flex; }

.tips-card { background: rgba(245,158,11,0.06); border: 1rpx solid rgba(245,158,11,0.15); border-radius: 16rpx; padding: 20rpx; }
.tips-title { font-size: 26rpx; font-weight: bold; color: #F59E0B; display: block; margin-bottom: 12rpx; }
.tips-item { font-size: 24rpx; color: rgba(0,0,0,0.5); line-height: 2; display: block; }
</style>