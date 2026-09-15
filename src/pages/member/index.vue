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
    <!-- 当前会员状态 -->
    <view class="status-banner" :class="`tier-${currentTier.id}`">
      <view class="status-left">
        <image class="status-icon" :src="getTierIcon(currentTier.id)" mode="aspectFit" />
        <view>
          <text class="status-name">{{ current.name || currentTier.name }}</text>
          <text class="status-expire" v-if="current.tier !== 'free'">{{ current.expire }}{{ t('member.expireSuffix') }}</text>
          <text class="status-expire" v-else>{{ t('member.upgradeHint') }}</text>
        </view>
      </view>
      <view class="status-right" v-if="current.tier !== 'free'">
        <text class="vip-badge">VIP</text>
      </view>
    </view>

    <!-- 会员套餐 -->
    <view class="plans-section">
      <text class="section-title">{{ t('member.choosePlan') }}</text>
      <view class="plan-list">
        <view class="plan-card" v-for="tier in tiers" :key="tier.id"
          :class="{ active: selectedTier === tier.id, current: current.tier === tier.id }"
          @tap="selectedTier = tier.id">
          <view class="plan-badge-row" v-if="tier.hot || current.tier === tier.id">
            <view class="plan-hot" v-if="tier.hot"><text>{{ t('member.hot') }}</text></view>
            <view class="plan-current-tag" v-if="current.tier === tier.id"><text>{{ t('member.currentTier') }}</text></view>
          </view>
          <view class="plan-header">
            <image class="plan-icon" :src="getTierIcon(tier.id)" mode="aspectFit" />
            <text class="plan-name">{{ tier.name }}</text>
          </view>
          <view class="plan-price">
            <text class="price-symbol" v-if="tier.price > 0">¥</text>
            <text class="price-num">{{ tier.price > 0 ? (tier.price / 100).toFixed(0) : t('member.freePrice') }}</text>
            <text class="price-period" v-if="tier.price > 0">/{{ tier.period }}</text>
          </view>
          <text class="price-original" v-if="tier.original">¥{{ (tier.original / 100).toFixed(0) }}</text>
          <view class="plan-privileges">
            <view class="pp-item" v-for="(p, i) in tier.privileges" :key="i">
              <text class="pp-check">✓</text>
              <text class="pp-text">{{ p }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 权益对比 -->
    <view class="compare-section">
      <text class="section-title">{{ t('member.benefitsCompare') }}</text>
      <scroll-view class="compare-scroll" scroll-x :show-scrollbar="false">
        <view class="compare-table">
        <view class="compare-row compare-head">
          <text class="compare-col cw-name">{{ t('member.compareBenefit') }}</text>
          <text class="compare-col">{{ t('member.colFree') }}</text>
          <text class="compare-col cw-pro">{{ t('member.colPro') }}</text>
          <text class="compare-col">{{ t('member.colEnterprise') }}</text>
        </view>
        <view class="compare-row" v-for="(item, i) in compareData" :key="i">
          <text class="compare-col cw-name">{{ item.name }}</text>
          <text class="compare-col">{{ item.free }}</text>
          <text class="compare-col cw-pro">{{ item.pro }}</text>
          <text class="compare-col">{{ item.enterprise }}</text>
        </view>
        </view>
      </scroll-view>
    </view>

    <view class="bottom-safe-space" aria-hidden="true"></view>

    <!-- 底部开通 -->
    <view class="bottom-bar">
      <view class="bottom-left">
        <text class="bottom-price-label">{{ t('member.payable') }}</text>
        <text class="bottom-price">¥{{ (selectedPlan.price / 100).toFixed(0) }}</text>
        <text class="bottom-original" v-if="selectedPlan.original">¥{{ (selectedPlan.original / 100).toFixed(0) }}</text>
      </view>
      <view class="bottom-btn" :class="{ disabled: current.tier === selectedTier || selectedTier === 'free' || submitting }" @tap="subscribe">
        <text>{{ submitting ? t('common.loading') : (current.tier === selectedTier ? t('member.currentTier') : (selectedTier === 'free' ? t('member.basicTier') : t('member.subscribe'))) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.member')

const userStore = useUserStore()

const tiers = ref([])
const current = ref({ tier: 'free' })
const selectedTier = ref('pro')

const fallbackTier = {
  id: 'free', name: '普通会员', price: 0, period: '永久',
  color: '#69574A', icon: 'user', privileges: []
}

function getTierIcon(id) {
  if (id === 'enterprise') return '/static/icons/shield.svg'
  if (id === 'pro') return '/static/icons/star.svg'
  return '/static/icons/user.svg'
}

const compareData = computed(() => t('member.compareData'))

const currentTier = computed(() => tiers.value.find(t => t.id === current.value.tier) || tiers.value[0] || fallbackTier)
const selectedPlan = computed(() => tiers.value.find(t => t.id === selectedTier.value) || tiers.value[0] || fallbackTier)

const { state: loadState, run: loadRequest } = useRequest(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能查看会员权益'))) return null
  const [nextTiers, nextCurrent] = await Promise.all([
    bridge.member.tiers(),
    bridge.member.current()
  ])
  return { tiers: nextTiers, current: nextCurrent }
})
const { state: subscribeState, run: subscribeRequest } = useRequest(async (tierId) => {
  await bridge.member.subscribe(tierId)
  return bridge.member.current()
})
const submitting = computed(() => subscribeState.value === 'loading')

async function reload() {
  try {
    const data = await loadRequest()
    if (!data) return
    tiers.value = data.tiers || []
    current.value = data.current || { tier: 'free' }
    selectedTier.value = current.value.tier === 'free' ? 'pro' : current.value.tier
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

function subscribe() {
  if (submitting.value || current.value.tier === selectedTier.value || selectedTier.value === 'free') return
  uni.showModal({
    title: t('member.confirmSubscribe'),
    content: t('member.subscribePrompt').replace('{price}', (selectedPlan.value.price / 100).toFixed(0)).replace('{name}', selectedPlan.value.name),
    success: async (r) => {
      if (r.confirm) {
        try {
          current.value = await subscribeRequest(selectedTier.value)
          uni.showToast({ title: t('member.subscribeSuccess'), icon: 'success' })
        } catch (error) {
          toastError(error?.message || t('common.loadFailed'))
        }
      }
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--page-bg, #F6F2EA); padding-bottom: calc(178rpx + env(safe-area-inset-bottom)); color: var(--ink, #17232D); }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }

.status-banner { display: flex; justify-content: space-between; align-items: center; padding: 34rpx 32rpx; color: #FCFAF5; }
.status-banner.tier-free { background: #69574A; }
.status-banner.tier-pro { background: #5C2828; }
.status-banner.tier-enterprise { background: #172A38; }
.status-left { display: flex; align-items: center; }
.status-icon { width: 56rpx; height: 56rpx; margin-right: 20rpx; }
.status-name { font-size: 34rpx; font-weight: 600; color: #FFFFFF; display: block; }
.status-expire { font-size: 24rpx; color: rgba(255,255,255,0.85); }
.status-right { background: rgba(255,255,255,0.25); padding: 8rpx 24rpx; border-radius: 20rpx; }
.vip-badge { font-size: 26rpx; color: #FFFFFF; font-weight: bold; letter-spacing: 2rpx; }

.plans-section { width: 100%; max-width: 880px; margin: 0 auto; padding: 28rpx 24rpx 0; }
.section-title { font-size: 30rpx; font-weight: 500; color: var(--ink, #17232D); display: block; margin-bottom: 18rpx; }
.plan-list { display: flex; flex-direction: column; }
.plan-card { background: var(--surface, #FCFAF5); border: 1rpx solid var(--line-soft, rgba(23,35,45,.075)); border-radius: 6rpx; padding: 26rpx 28rpx; margin-bottom: 14rpx; position: relative; }
.plan-card.active { border-color: var(--brand, #5A2530); box-shadow: 0 8rpx 22rpx rgba(90,37,48,.10); }
.plan-card.current { opacity: 1; background: #F2EADF; border-color: rgba(180,148,96,.62); }
.plan-card.current.active { border-color: var(--brand, #5A2530); }
.plan-badge-row { display: flex; align-items: center; justify-content: flex-end; gap: 8rpx; min-height: 28rpx; margin-bottom: 12rpx; }
.plan-hot, .plan-current-tag { position: static; flex: 0 0 auto; padding: 5rpx 12rpx; border-radius: 3rpx; }
.plan-hot { background: var(--brand, #5A2530); }
.plan-hot text, .plan-current-tag text { font-size: 19rpx; line-height: 1.2; }
.plan-hot text { color: #FCFAF5; }
.plan-current-tag { background: var(--accent-soft, #E9DEC9); }
.plan-current-tag text { color: var(--brand, #5A2530); }
.plan-header { display: flex; align-items: center; margin-bottom: 14rpx; }
.plan-icon { width: 40rpx; height: 40rpx; margin-right: 12rpx; }
.plan-name { font-size: 30rpx; font-weight: 600; color: var(--ink, #17232D); }
.plan-price { display: flex; align-items: baseline; }
.price-symbol { font-size: 26rpx; color: var(--brand, #5A2530); font-weight: 600; }
.price-num { font-size: 48rpx; font-weight: 600; color: var(--brand, #5A2530); }
.price-period { font-size: 24rpx; color: var(--ink-muted, #968F83); margin-left: 4rpx; }
.price-original { font-size: 24rpx; color: rgba(0,0,0,0.3); text-decoration: line-through; margin-top: 4rpx; }
.plan-privileges { margin-top: 20rpx; }
.pp-item { display: flex; align-items: center; padding: 6rpx 0; }
.pp-check { font-size: 24rpx; color: var(--olive, #526153); margin-right: 12rpx; }
.pp-text { font-size: 25rpx; color: var(--ink-soft, #626B6D); }

.compare-section { width: 100%; max-width: 880px; margin: 0 auto; padding: 8rpx 24rpx 0; }
.compare-scroll { width: 100%; max-width: 100%; overflow-x: auto; }
.compare-table { min-width: 100%; background: var(--surface, #FCFAF5); border: 1rpx solid var(--line-soft, rgba(23,35,45,.075)); border-radius: 6rpx; overflow: hidden; }
.compare-row { display: flex; border-bottom: 1rpx solid #F5F6FA; }
.compare-row:last-child { border-bottom: none; }
.compare-head { background: #F2EEE6; }
.compare-col { flex: 1; text-align: center; font-size: 23rpx; color: var(--ink-soft, #626B6D); padding: 18rpx 8rpx; }
.cw-name { flex: 1.4; text-align: left; padding-left: 24rpx; }
.cw-pro { color: var(--brand, #5A2530); font-weight: 600; }

.bottom-safe-space { height: 0; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; min-height: 92rpx; padding: 12rpx 24rpx; padding-bottom: calc(12rpx + env(safe-area-inset-bottom)); background: var(--surface, #FCFAF5); border-top: 1rpx solid var(--line, rgba(23,35,45,.13)); }
.bottom-left { flex: 1; display: flex; align-items: baseline; }
.bottom-price-label { font-size: 23rpx; color: var(--ink-muted, #968F83); }
.bottom-price { font-size: 38rpx; font-weight: 600; color: var(--brand, #5A2530); margin: 0 8rpx; }
.bottom-original { font-size: 23rpx; color: var(--ink-muted, #968F83); text-decoration: line-through; }
.bottom-btn { display: flex; align-items: center; justify-content: center; min-width: 184rpx; min-height: 68rpx; padding: 0 30rpx; border: 1rpx solid var(--brand, #5A2530); border-radius: 4rpx; background: var(--brand, #5A2530); }
.bottom-btn.disabled { border-color: #D9D1C6; background: #E9E4DB; }
.bottom-btn text { font-size: 27rpx; color: #FCFAF5; font-weight: 600; white-space: nowrap; }
.bottom-btn.disabled text { color: #81786D; }

/* 会员页的权益表和固定结算栏按剩余空间收缩，长权益文案不会把列宽撑出卡片。 */
.page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.status-banner, .status-left, .status-left > view, .plans-section, .plan-card, .plan-header,
.plan-badge-row, .plan-privileges, .pp-item, .compare-scroll, .compare-table, .compare-row, .bottom-bar, .bottom-left { min-width: 0; }
.status-left { flex: 1; overflow: hidden; }
.status-left > view { flex: 1; overflow: hidden; }
.status-name, .status-expire, .plan-name, .pp-text, .bottom-price-label { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.status-name, .status-expire, .plan-name, .pp-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-right, .plan-hot, .plan-current-tag, .bottom-btn { flex: 0 0 auto; white-space: nowrap; }
.plan-header { gap: 12rpx; }
.plan-name { min-width: 0; }
.pp-item { align-items: flex-start; }
.pp-text { flex: 1; }
.compare-col { min-width: 0; overflow-wrap: anywhere; word-break: break-word; white-space: normal; }
.bottom-bar { box-sizing: border-box; gap: 12rpx; }
.bottom-left { flex: 1; overflow: hidden; flex-wrap: wrap; }
.bottom-price-label, .bottom-price, .bottom-original { flex: 0 0 auto; }

@media (max-width: 420px) {
  .page { padding-bottom: calc(166rpx + env(safe-area-inset-bottom)); }
  .status-banner { padding: 28rpx 20rpx; }
  .status-right { padding-right: 16rpx; padding-left: 16rpx; }
  .plans-section { padding-right: 16rpx; padding-left: 16rpx; }
  .plan-card { padding: 24rpx; }
  .compare-section { padding-right: 16rpx; padding-left: 16rpx; }
  .compare-table { min-width: 720rpx; }
  .compare-col { padding-right: 5rpx; padding-left: 5rpx; font-size: 21rpx; }
  .cw-name { padding-left: 12rpx; }
  .bottom-bar { padding-right: 16rpx; padding-left: 16rpx; }
  .bottom-btn { min-width: 156rpx; padding-right: 20rpx; padding-left: 20rpx; }
}
</style>
