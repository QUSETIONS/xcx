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
    <view class="header"><text class="header-title">{{ t('coupon.title') }}</text></view>

    <view class="coupon-list">
      <view class="coupon-item card-press" v-for="item in coupons" :key="item._id" @tap="useCoupon(item)">
        <view class="coupon-left">
          <text class="coupon-amount">{{ item.amount / 100 }}</text>
          <text class="coupon-unit">{{ t('orderConfirm.yuan') }}</text>
        </view>
        <view class="coupon-divider"></view>
        <view class="coupon-right">
          <text class="coupon-name">{{ item.name }}</text>
          <text class="coupon-desc">{{ item.desc }}</text>
          <text class="coupon-expire">{{ t('orderConfirm.validUntil') }}{{ item.expire }}</text>
        </view>
        <view class="coupon-use"><text>{{ t('coupon.use') }}</text></view>
      </view>
    </view>

    <view v-if="!coupons.length" class="empty">
      <image class="empty-icon" src="/static/icons/ticket.svg" mode="aspectFit" />
      <text class="empty-text">{{ t('coupon.empty') }}</text>
      <text class="empty-btn" @tap="goMall">{{ t('cartPage.goShop') }}</text>
    </view>

    <view class="tips-card">
      <text class="tips-title">{{ t('coupon.tipsTitle') }}</text>
      <text class="tips-item">• {{ t('coupon.tip1') }}</text>
      <text class="tips-item">• {{ t('coupon.tip2') }}</text>
      <text class="tips-item">• {{ t('coupon.tip3') }}</text>
      <text class="tips-item">• {{ t('coupon.tip4') }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.coupon')

const coupons = ref([])
const userStore = useUserStore()

const { state: loadState, run: loadRequest } = useRequest(() => bridge.coupon.list())

async function reload() {
  if (!(await requirePageLogin(userStore, '登录后才能查看优惠券'))) return
  try {
    coupons.value = (await loadRequest()) || []
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

function useCoupon(item) {
  uni.showModal({
    title: t('coupon.useTitle'),
    content: t('coupon.useConfirm').replace('{name}', item.name),
    success: (res) => { if (res.confirm) uni.navigateTo({ url: '/pages/member/index' }) }
  })
}
function goMall() { uni.navigateTo({ url: '/pages/member/index' }) }
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }
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
.empty-icon { width: 64rpx; height: 64rpx; display: block; margin: 0 auto 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-btn { font-size: 24rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 12rpx 32rpx; border-radius: 24rpx; display: inline-flex; }

.tips-card { background: rgba(245,158,11,0.06); border: 1rpx solid rgba(245,158,11,0.15); border-radius: 16rpx; padding: 20rpx; }
.tips-title { font-size: 26rpx; font-weight: bold; color: #F59E0B; display: block; margin-bottom: 12rpx; }
.tips-item { font-size: 24rpx; color: rgba(0,0,0,0.5); line-height: 2; display: block; }

/* 优惠券内容列可收缩，金额和操作按钮保持完整，避免长名称撑破券面。 */
.page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.header, .coupon-item, .coupon-left, .coupon-right, .coupon-use, .tips-card { min-width: 0; }
.coupon-left { flex: 0 0 120rpx; }
.coupon-right { flex: 1; overflow: hidden; }
.coupon-name, .coupon-desc, .coupon-expire, .tips-item { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.coupon-name, .coupon-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.coupon-use { flex: 0 0 auto; white-space: nowrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .coupon-left { flex-basis: 100rpx; min-width: 100rpx; margin-right: 10rpx; }
  .coupon-divider { margin-right: 10rpx; }
  .coupon-use { margin-left: 6rpx; padding-right: 16rpx; padding-left: 16rpx; }
  .coupon-amount { font-size: 42rpx; }
}
</style>
