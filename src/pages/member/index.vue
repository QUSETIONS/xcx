<template>
  <view class="page">
    <!-- 当前会员状态 -->
    <view class="status-banner" :style="{ background: currentTier.color }">
      <view class="status-left">
        <text class="status-icon">{{ currentTier.icon }}</text>
        <view>
          <text class="status-name">{{ current.name || currentTier.name }}</text>
          <text class="status-expire" v-if="current.tier !== 'free'">{{ current.expire }} 到期</text>
          <text class="status-expire" v-else>升级解锁更多权益</text>
        </view>
      </view>
      <view class="status-right" v-if="current.tier !== 'free'">
        <text class="vip-badge">VIP</text>
      </view>
    </view>

    <!-- 会员套餐 -->
    <view class="plans-section">
      <text class="section-title">选择会员套餐</text>
      <view class="plan-list">
        <view class="plan-card" v-for="tier in tiers" :key="tier.id"
          :class="{ active: selectedTier === tier.id, current: current.tier === tier.id }"
          @tap="selectedTier = tier.id">
          <view class="plan-hot" v-if="tier.hot"><text>热门</text></view>
          <view class="plan-header">
            <text class="plan-icon">{{ tier.icon }}</text>
            <text class="plan-name">{{ tier.name }}</text>
          </view>
          <view class="plan-price">
            <text class="price-symbol" v-if="tier.price > 0">¥</text>
            <text class="price-num">{{ tier.price > 0 ? (tier.price / 100).toFixed(0) : '免费' }}</text>
            <text class="price-period" v-if="tier.price > 0">/{{ tier.period }}</text>
          </view>
          <text class="price-original" v-if="tier.original">¥{{ (tier.original / 100).toFixed(0) }}</text>
          <view class="plan-privileges">
            <view class="pp-item" v-for="(p, i) in tier.privileges" :key="i">
              <text class="pp-check">✓</text>
              <text class="pp-text">{{ p }}</text>
            </view>
          </view>
          <view class="plan-current-tag" v-if="current.tier === tier.id"><text>当前套餐</text></view>
        </view>
      </view>
    </view>

    <!-- 权益对比 -->
    <view class="compare-section">
      <text class="section-title">权益对比</text>
      <view class="compare-table">
        <view class="compare-row compare-head">
          <text class="compare-col cw-name">权益</text>
          <text class="compare-col">普通</text>
          <text class="compare-col cw-pro">专业</text>
          <text class="compare-col">企业</text>
        </view>
        <view class="compare-row" v-for="(item, i) in compareData" :key="i">
          <text class="compare-col cw-name">{{ item.name }}</text>
          <text class="compare-col">{{ item.free }}</text>
          <text class="compare-col cw-pro">{{ item.pro }}</text>
          <text class="compare-col">{{ item.enterprise }}</text>
        </view>
      </view>
    </view>

    <view style="height: 160rpx;"></view>

    <!-- 底部开通 -->
    <view class="bottom-bar">
      <view class="bottom-left">
        <text class="bottom-price-label">应付</text>
        <text class="bottom-price">¥{{ (selectedPlan.price / 100).toFixed(0) }}</text>
        <text class="bottom-original" v-if="selectedPlan.original">¥{{ (selectedPlan.original / 100).toFixed(0) }}</text>
      </view>
      <view class="bottom-btn" :class="{ disabled: current.tier === selectedTier || selectedTier === 'free' }" @tap="subscribe">
        <text>{{ current.tier === selectedTier ? '当前套餐' : (selectedTier === 'free' ? '基础套餐' : '立即开通') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { memberService } from '@/mock/service'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.member')

const tiers = ref([])
const current = ref({ tier: 'free' })
const selectedTier = ref('pro')

const compareData = [
  { name: '需求发布', free: '3条/天', pro: '无限', enterprise: '无限' },
  { name: '优先推荐', free: '—', pro: '✓', enterprise: '✓' },
  { name: '数据看板', free: '—', pro: '✓', enterprise: '✓' },
  { name: '专属客服', free: '—', pro: '✓', enterprise: '经理1对1' },
  { name: 'API接入', free: '—', pro: '—', enterprise: '✓' },
  { name: '团队协作', free: '—', pro: '—', enterprise: '✓' }
]

const currentTier = computed(() => tiers.value.find(t => t.id === current.value.tier) || tiers.value[0])
const selectedPlan = computed(() => tiers.value.find(t => t.id === selectedTier.value) || tiers.value[0])

onMounted(() => {
  tiers.value = memberService.tiers()
  current.value = memberService.current()
  selectedTier.value = current.value.tier === 'free' ? 'pro' : current.value.tier
})

function subscribe() {
  if (current.value.tier === selectedTier.value || selectedTier.value === 'free') return
  uni.showModal({
    title: '确认开通',
    content: `确认以 ¥${(selectedPlan.value.price / 100).toFixed(0)} 开通${selectedPlan.value.name}？`,
    success: (r) => {
      if (r.confirm) {
        memberService.subscribe(selectedTier.value)
        current.value = memberService.current()
        uni.showToast({ title: '开通成功', icon: 'success' })
      }
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }

.status-banner { display: flex; justify-content: space-between; align-items: center; padding: 40rpx 32rpx; }
.status-left { display: flex; align-items: center; }
.status-icon { font-size: 56rpx; margin-right: 20rpx; }
.status-name { font-size: 36rpx; font-weight: bold; color: #FFFFFF; display: block; }
.status-expire { font-size: 24rpx; color: rgba(255,255,255,0.85); }
.status-right { background: rgba(255,255,255,0.25); padding: 8rpx 24rpx; border-radius: 20rpx; }
.vip-badge { font-size: 26rpx; color: #FFFFFF; font-weight: bold; letter-spacing: 2rpx; }

.plans-section { padding: 24rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 20rpx; }
.plan-list { display: flex; flex-direction: column; }
.plan-card { background: #FFFFFF; border-radius: 20rpx; padding: 32rpx; margin-bottom: 16rpx; position: relative; border: 3rpx solid transparent; }
.plan-card.active { border-color: #FF6B35; box-shadow: 0 4rpx 24rpx rgba(255,107,53,0.15); }
.plan-card.current { opacity: 0.7; }
.plan-hot { position: absolute; top: -2rpx; right: 24rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); padding: 6rpx 20rpx; border-radius: 0 0 12rpx 12rpx; }
.plan-hot text { font-size: 20rpx; color: #FFFFFF; }
.plan-header { display: flex; align-items: center; margin-bottom: 16rpx; }
.plan-icon { font-size: 40rpx; margin-right: 12rpx; }
.plan-name { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.plan-price { display: flex; align-items: baseline; }
.price-symbol { font-size: 26rpx; color: #FF6B35; font-weight: bold; }
.price-num { font-size: 48rpx; font-weight: bold; color: #FF6B35; }
.price-period { font-size: 24rpx; color: rgba(0,0,0,0.4); margin-left: 4rpx; }
.price-original { font-size: 24rpx; color: rgba(0,0,0,0.3); text-decoration: line-through; margin-top: 4rpx; }
.plan-privileges { margin-top: 20rpx; }
.pp-item { display: flex; align-items: center; padding: 6rpx 0; }
.pp-check { font-size: 24rpx; color: #10B981; margin-right: 12rpx; }
.pp-text { font-size: 26rpx; color: rgba(0,0,0,0.7); }
.plan-current-tag { position: absolute; top: 24rpx; right: 24rpx; background: #F5F6FA; padding: 4rpx 16rpx; border-radius: 12rpx; }
.plan-current-tag text { font-size: 20rpx; color: rgba(0,0,0,0.5); }

.compare-section { padding: 0 24rpx; }
.compare-table { background: #FFFFFF; border-radius: 16rpx; overflow: hidden; }
.compare-row { display: flex; border-bottom: 1rpx solid #F5F6FA; }
.compare-row:last-child { border-bottom: none; }
.compare-head { background: #FAFBFC; }
.compare-col { flex: 1; text-align: center; font-size: 24rpx; color: rgba(0,0,0,0.6); padding: 20rpx 8rpx; }
.cw-name { flex: 1.4; text-align: left; padding-left: 24rpx; }
.cw-pro { color: #FF6B35; font-weight: bold; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); }
.bottom-left { flex: 1; display: flex; align-items: baseline; }
.bottom-price-label { font-size: 24rpx; color: rgba(0,0,0,0.5); }
.bottom-price { font-size: 40rpx; font-weight: bold; color: #FF6B35; margin: 0 8rpx; }
.bottom-original { font-size: 24rpx; color: rgba(0,0,0,0.3); text-decoration: line-through; }
.bottom-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 22rpx 56rpx; }
.bottom-btn.disabled { background: #E5E7EB; }
.bottom-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
</style>