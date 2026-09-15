<template>
  <view v-if="detailState === 'loading'" class="detail-state"><text>正在加载商品…</text></view>

  <view v-else-if="detailState === 'error'" class="detail-state error-state" @tap="reload">
    <text class="detail-state-icon">!</text>
    <text>商品加载失败，点击重试</text>
  </view>

  <view class="detail-page" v-else-if="product">
    <!-- 服务卡片 -->
    <view class="hero-card glass-card">
      <view class="hero-icon-box" :style="{ background: getIconBg(product.service_type) }">
        <image class="hero-icon" :src="getServiceIcon(product.service_type)" mode="aspectFit" />
      </view>
      <text class="hero-type">{{ serviceTypes[product.service_type] }}</text>
      <text class="hero-title">{{ product.title }}</text>
      <view class="hero-sales"><text>{{ product.sale_count }}{{ t('mallDetail.boughtSuffix') }}</text></view>
    </view>

    <!-- 价格卡片 -->
    <view class="price-card glass-card">
      <view class="price-main">
        <text class="price-current gradient-text">¥{{ (product.price / 100).toFixed(2) }}</text>
        <text class="price-unit">/{{ product.unit }}</text>
      </view>
      <view class="price-row"><text class="price-label">{{ t('mallDetail.originalPrice') }}</text><text class="price-market">¥{{ (product.market_price / 100).toFixed(2) }}</text></view>
      <view class="price-row"><text class="price-label">{{ t('mallDetail.save') }}</text><text class="price-save">¥{{ ((product.market_price - product.price) / 100).toFixed(0) }}</text></view>
    </view>

    <!-- 服务权益 -->
    <view class="benefits-card glass-card">
      <text class="card-label">{{ t('mallDetail.benefits') }}</text>
      <view class="benefit-list">
        <view class="benefit-item" v-for="(b, i) in getBenefits(product.service_type)" :key="i">
          <view class="benefit-check"><text>✓</text></view>
          <text class="benefit-text">{{ b }}</text>
        </view>
      </view>
    </view>

    <!-- 购买须知 -->
    <view class="notice-card glass-card">
      <text class="card-label">{{ t('mallDetail.notice') }}</text>
      <text class="notice-item">• {{ t('mallDetail.notice1') }}</text>
      <text class="notice-item">• {{ t('mallDetail.notice2') }}</text>
      <text class="notice-item">• {{ t('mallDetail.notice3') }}</text>
    </view>

    <!-- 商品详情 -->
    <view class="desc-card glass-card">
      <text class="card-label">{{ t('mallDetail.productDetail') }}</text>
      <rich-text class="desc-content" :nodes="product.description_rich" />
    </view>

    <!-- 底部操作 -->
    <view class="action-bar glass-card-strong">
      <view class="action-btn" @tap="toggleFavorite"><image class="action-icon" src="/static/icons/heart.svg" mode="aspectFit"/><text class="action-text">{{ t('mallDetail.favorite') }}</text></view>
      <view class="action-btn" @tap="share"><image class="action-icon" src="/static/icons/handshake.svg" mode="aspectFit"/><text class="action-text">{{ t('mallDetail.share') }}</text></view>
      <view class="action-btn cart-entry" @tap="goCart"><image class="action-icon" src="/static/icons/tab/mall.svg" mode="aspectFit"/><text class="action-text">{{ t('mallDetail.cart') }}</text></view>
      <view class="add-cart-btn" @tap="addToCart"><text>{{ t('mall.addToCart') }}</text></view>
      <button class="btn-glow" @tap="buyNow"><text>{{ t('mall.buyNow') }}</text></button>
    </view>
  </view>

  <view v-else class="empty"><text class="empty-icon">—</text><text>{{ t('listPage.emptyProduct') }}</text></view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { serviceTypes } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { hapticLight, toastSuccess } from '@/utils/feedback'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useUserStore } from '@/stores/user'
import { ENV } from '@/utils/env'
import { hasStoredAccessToken } from '@/utils/session'
import { t } from '@/i18n'
useNavTitle('titles.mallDetail')

const userStore = useUserStore()
const productId = ref('')
const isFavorited = ref(false)

function currentUserId() {
  if (userStore.userId) return String(userStore.userId)
  return ENV.USE_MOCK ? 'demo_user_001' : ''
}

function hasInteractiveSession() {
  return Boolean(currentUserId() || hasStoredAccessToken())
}

function getServiceIcon(type) {
  const safeType = ['member', 'linker', 'survey', 'resource_pack', 'certification'].includes(type) ? type : 'resource_pack'
  return `/static/icons/service/${safeType}.svg`
}

function getIconBg(type) {
  const map = {
    member: 'linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,107,53,0.08))',
    linker: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))',
    survey: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.08))',
    resource_pack: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))',
    certification: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(236,72,153,0.08))'
  }
  return map[type] || map.resource_pack
}

function getBenefits(type) {
  const map = t('mallDetail.benefitMap')
  return map[type] || map.default
}

const { data: product, state: detailState, run: loadRequest } = useRequest(loadDetail)

async function loadDetail(id) {
  const detail = await bridge.product.detail(id)
  if (!detail) return null
  bridge.smart.trackBrowse('product', id, detail)
  isFavorited.value = hasInteractiveSession()
    ? await bridge.favorite.check({ userId: currentUserId(), targetType: 'product', targetId: id }).catch(() => false)
    : false
  return detail
}

async function reload() {
  if (!productId.value) return
  await loadRequest(productId.value)
}

async function toggleFavorite() {
  if (!hasInteractiveSession()) {
    const ok = await userStore.ensureLogin()
    if (!ok || !hasInteractiveSession()) {
      uni.showToast({ title: '请先登录后再收藏', icon: 'none' })
      setTimeout(() => uni.navigateTo({ url: '/pages/user/login' }), 250)
      return
    }
  }
  const r = await bridge.favorite.toggle({ userId: currentUserId(), targetType: 'product', targetId: productId.value })
  isFavorited.value = r.isFavorited
  if (r.isFavorited) hapticLight()
  uni.showToast({ title: r.isFavorited ? t('mallDetail.favorited') : t('mallDetail.unfavorited'), icon: 'none' })
}

function share() { uni.showModal({ title: t('mallDetail.shareTitle'), content: t('mallDetail.shareContent'), showCancel: false }) }
function buyNow() { uni.navigateTo({ url: `/pages/mall/order-confirm?id=${productId.value}` }) }
async function addToCart() {
  await bridge.cart.add(product.value)
  hapticLight()
  toastSuccess(t('mallDetail.addedToCart'))
}
function goCart() { uni.navigateTo({ url: '/pages/cart/index' }) }

onLoad(async (q) => {
  productId.value = q.id || ''
  if (productId.value) await loadRequest(productId.value)
})
</script>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: $bg-primary; padding: $space-4; padding-bottom: 180rpx; }
.detail-state { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; color: $text-tertiary; font-size: $font-base; }
.detail-state-icon { font-size: 72rpx; }
.error-state { color: $color-primary; }
.empty { text-align: center; padding: 160rpx 64rpx; color: $text-tertiary; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }

.hero-card { padding: $space-6; margin-bottom: $space-3; display: flex; flex-direction: column; align-items: center; }
.hero-icon-box { width: 120rpx; height: 120rpx; border-radius: $radius-xl; display: flex; align-items: center; justify-content: center; margin-bottom: $space-3; }
.hero-icon { display: block; width: 56rpx; height: 56rpx; }
.hero-type { font-size: $font-sm; color: $text-tertiary; margin-bottom: $space-2; }
.hero-title { font-size: $font-xl; font-weight: $weight-black; color: $text-primary; text-align: center; margin-bottom: $space-3; }
.hero-sales { background: rgba(16,185,129,0.12); border-radius: $radius-full; padding: 8rpx 24rpx; }
.hero-sales text { font-size: $font-xs; color: $color-success; }

.price-card, .benefits-card, .notice-card, .desc-card { padding: $space-4; margin-bottom: $space-3; }
.card-label { font-size: $font-base; font-weight: $weight-semibold; color: $text-secondary; display: block; margin-bottom: $space-3; }

.price-main { display: flex; align-items: baseline; margin-bottom: $space-3; }
.price-current { font-size: $font-2xl; font-weight: $weight-black; }
.price-unit { font-size: $font-sm; color: $text-tertiary; }

.price-row { display: flex; justify-content: space-between; padding: $space-1 0; }
.price-label { font-size: $font-sm; color: $text-tertiary; }
.price-market { font-size: $font-sm; color: $text-tertiary; text-decoration: line-through; }
.price-save { font-size: $font-sm; color: $color-success; font-weight: $weight-semibold; }

.benefit-list { display: flex; flex-direction: column; }
.benefit-item { display: flex; align-items: center; }
.benefit-check { width: 32rpx; height: 32rpx; background: rgba(16,185,129,0.15); border-radius: $radius-sm; display: flex; align-items: center; justify-content: center; }
.benefit-check text { font-size: 20rpx; color: $color-success; }
.benefit-text { font-size: $font-sm; color: $text-secondary; }

.notice-item { font-size: $font-sm; color: $text-tertiary; display: block; margin-bottom: $space-2; line-height: 1.5; }

.desc-content { font-size: $font-base; color: $text-secondary; line-height: 1.7; }

.action-bar { position: fixed; bottom: $space-4; left: $space-4; right: $space-4; display: flex; justify-content: space-between; align-items: center; padding: $space-3 $space-4; }
.action-btn { display: flex; flex-direction: column; align-items: center; }
.action-icon { display: block; width: 32rpx; height: 32rpx; }
.action-text { font-size: $font-xs; color: $text-tertiary; }
.add-cart-btn { background: rgba(255,154,92,0.95); border-radius: $radius-full; padding: 18rpx 20rpx; }
.add-cart-btn text { font-size: $font-sm; color: #FFFFFF; font-weight: $weight-semibold; }
.btn-glow { flex: 1; margin-left: $space-2; }

/* Quiet Intelligence：商品详情按咨询型服务呈现，减少电商促销与彩色装饰。 */
.detail-page { padding: 34rpx 32rpx 190rpx; color: #25231f; background: #f7f6f2; }
.detail-state { color: #8a847b; background: #f7f6f2; }
.detail-state-icon,
.empty-icon { display: flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; border: 1rpx solid rgba(30,27,22,.12); border-radius: 4rpx; color: #5c2828; font-family: Georgia, serif; font-size: 30rpx; }
.hero-card,
.price-card,
.benefits-card,
.notice-card,
.desc-card { border: 0; border-bottom: 1rpx solid rgba(30,27,22,.1); border-radius: 0; background: transparent; box-shadow: none; }
.hero-card { align-items: flex-start; padding: 22rpx 0 34rpx; }
.hero-icon-box { width: 62rpx; height: 62rpx; margin-bottom: 26rpx; border: 1rpx solid rgba(105,87,74,.14); border-radius: 4rpx; background: #f0eee8 !important; }
.hero-icon { display: block; width: 30rpx; height: 30rpx; }
.hero-type { color: #9a7c57; font-family: ui-monospace, monospace; font-size: 15rpx; letter-spacing: .1em; }
.hero-title { color: #191816; font-family: 'Songti SC', 'STSong', serif; font-size: 42rpx; font-weight: 500; text-align: left; line-height: 1.28; }
.hero-sales { padding: 0; border-radius: 0; background: transparent; }
.hero-sales text { color: #8a847b; }
.price-card,
.benefits-card,
.notice-card,
.desc-card { padding: 28rpx 0; }
.card-label { color: #69574a; font-family: ui-monospace, monospace; font-size: 15rpx; font-weight: 500; letter-spacing: .09em; }
.price-current { color: #5c2828; font-family: Georgia, serif; font-weight: 500; }
.price-unit,
.price-label,
.price-market,
.notice-item { color: #8a847b; }
.price-save { color: #56624c; }
.benefit-item { padding: 13rpx 0; border-bottom: 1rpx solid rgba(30,27,22,.07); }
.benefit-check { width: 26rpx; height: 26rpx; border-radius: 2rpx; background: rgba(86,98,76,.1); }
.benefit-check text { color: #56624c; font-size: 17rpx; }
.benefit-text,
.desc-content { color: #4b4741; }
.action-bar { right: 0; bottom: 0; left: 0; padding: 17rpx 24rpx calc(17rpx + env(safe-area-inset-bottom)); border: 0; border-top: 1rpx solid rgba(30,27,22,.11); border-radius: 0; background: rgba(250,249,246,.97); box-shadow: none; }
.action-icon { display: block; width: 27rpx; height: 27rpx; }
.action-text { color: #8a847b; }
.add-cart-btn { border: 1rpx solid rgba(30,27,22,.14); border-radius: 5rpx; background: transparent; }
.add-cart-btn text { color: #25231f; }
.btn-glow { min-height: 72rpx; border-radius: 5rpx; color: #faf9f6; background: #25231f; box-shadow: none; }

/* Overflow guard: service names, rich descriptions and the fixed action bar must shrink together. */
.detail-page,
.hero-card,
.price-card,
.benefits-card,
.notice-card,
.desc-card,
.price-main,
.price-row,
.benefit-item,
.action-bar,
.action-btn,
.add-cart-btn,
.btn-glow { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.detail-page { overflow-x: hidden; }
.hero-title,
.hero-type,
.hero-sales,
.card-label,
.price-label,
.price-market,
.price-save,
.benefit-text,
.notice-item,
.desc-content { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.hero-title,
.benefit-text,
.notice-item { overflow: hidden; }
.price-main,
.price-row,
.benefit-item,
.action-bar { gap: 12rpx; }
.price-current,
.price-unit,
.price-label,
.price-market,
.price-save,
.benefit-check,
.action-btn,
.add-cart-btn,
.btn-glow { flex: 0 0 auto; }
.benefit-text,
.desc-content { min-width: 0; flex: 1 1 auto; }
.action-bar { overflow-x: hidden; }
.action-btn { width: auto; white-space: nowrap; }
.add-cart-btn,
.btn-glow { white-space: nowrap; }
.btn-glow { flex: 1 1 auto; }

@media (max-width: 420px) {
  .detail-page { padding-right: 16rpx; padding-left: 16rpx; }
  .action-bar { padding-right: 16rpx; padding-left: 16rpx; gap: 8rpx; }
  .action-text { font-size: 16rpx; }
  .add-cart-btn { padding-right: 12rpx; padding-left: 12rpx; }
  .btn-glow { margin-left: 0; padding-right: 12rpx; padding-left: 12rpx; }
}
</style>
