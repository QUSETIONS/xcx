<template>
  <view class="detail-page" v-if="demand">
    <!-- 顶部信息卡片 -->
    <view class="hero-card glass-card">
      <view class="hero-tags">
        <view class="ui-tag ui-tag--primary"><text>{{ demand.category_name }}</text></view>
        <view class="ui-tag ui-tag--accent"><text>{{ formatQuote(demand.quote_type) }}</text></view>
      </view>
      <text class="hero-title">{{ demand.title }}</text>
      <view class="hero-company">
        <text class="hero-name">{{ demand.company_name }}</text>
        <text class="hero-region">{{ demand.region }}</text>
      </view>
    </view>

    <!-- 预算卡片 -->
    <view class="budget-card glass-card">
      <text class="card-label">预算范围</text>
      <view class="budget-display">
        <text class="budget-value gradient-text">
          <template v-if="demand.quote_type === 'self'">¥{{ (demand.budget_min/100).toFixed(0) }} - {{ (demand.budget_max/100).toFixed(0) }}</template>
          <template v-else>{{ formatQuote(demand.quote_type) }}</template>
        </text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-card glass-card">
      <view class="stat-row">
        <view class="stat-box"><text class="stat-num">{{ demand.view_count }}</text><text class="stat-label">浏览</text></view>
        <view class="stat-box"><text class="stat-num">{{ demand.lead_count }}</text><text class="stat-label">对接</text></view>
        <view class="stat-box"><text class="stat-num">{{ demand.favorite_count }}</text><text class="stat-label">收藏</text></view>
      </view>
      <view class="stat-bar">
        <text class="stat-bar-label">热度指数</text>
        <view class="stat-bar-track"><view class="stat-bar-fill" :style="{ width: getHeat() + '%' }" /></view>
        <text class="stat-bar-value">{{ getHeat() }}%</text>
      </view>
    </view>

    <!-- 需求详情 -->
    <view class="desc-card glass-card">
      <text class="card-label">需求详情</text>
      <text class="desc-text">{{ demand.description || '暂无详细描述' }}</text>
    </view>

    <!-- 时间信息 -->
    <view class="time-card glass-card">
      <view class="time-row"><text class="time-label">发布时间</text><text class="time-value">{{ formatDate(demand.publish_time) }}</text></view>
      <view class="time-row"><text class="time-label">有效期至</text><text class="time-value">{{ formatDate(demand.expire_time) }}</text></view>
    </view>

    <!-- 底部操作 -->
    <view class="action-bar glass-card-strong">
      <view class="action-left">
        <view class="action-btn" @tap="toggleFavorite"><text class="action-icon">{{ isFavorited ? '❤️' : '🤍' }}</text><text class="action-text">收藏</text></view>
        <view class="action-btn" @tap="share"><text class="action-icon">🔗</text><text class="action-text">分享</text></view>
      </view>
      <button class="btn-glow" @tap="showLeadModal = true"><text>立即对接</text></button>
    </view>

    <!-- 对接弹窗 -->
    <view v-if="showLeadModal" class="modal-mask" @tap="showLeadModal = false">
      <view class="modal-panel glass-card-strong" @tap.stop>
        <text class="modal-title">立即对接</text>
        <view class="modal-body">
          <view class="form-row"><text class="form-label">姓名 *</text><input class="form-input" v-model="leadForm.contact_name" placeholder="请输入" /></view>
          <view class="form-row"><text class="form-label">电话 *</text><input class="form-input" type="number" v-model="leadForm.phone" placeholder="请输入" /></view>
          <view class="form-row"><text class="form-label">微信号</text><input class="form-input" v-model="leadForm.wechat" placeholder="可选" /></view>
          <view class="form-row"><text class="form-label">对接说明</text><textarea class="form-area" v-model="leadForm.message" placeholder="简要介绍您的服务能力" /></view>
        </view>
        <button class="btn-glow" @tap="submitLead" :disabled="submitting"><text>{{ submitting ? '提交中...' : '提交对接' }}</text></button>
      </view>
    </view>
  </view>

  <view v-else class="empty-page"><text class="empty-icon">📭</text><text class="empty-text">需求不存在</text></view>
</template>

<script setup>
import { ref } from 'vue'
import { QUOTE_TYPES } from '@/config/constants'
import { demandService, leadService, favoriteService } from '@/mock/service'

const demandId = ref('')
const demand = ref(null)
const isFavorited = ref(false)
const showLeadModal = ref(false)
const submitting = ref(false)
const leadForm = ref({ contact_name: '', phone: '', wechat: '', message: '' })

function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}` }
function getHeat() { return demand.value ? Math.min(100, Math.round((demand.value.view_count / 5000) * 100)) : 0 }

function loadDetail() {
  demand.value = demandService.detail(demandId.value)
  isFavorited.value = favoriteService.check({ userId: 'demo_user_001', targetType: 'demand', targetId: demandId.value })
}

function toggleFavorite() {
  const r = favoriteService.toggle({ userId: 'demo_user_001', targetType: 'demand', targetId: demandId.value })
  isFavorited.value = r.isFavorited
  uni.showToast({ title: r.isFavorited ? '已收藏' : '已取消', icon: 'none' })
}

function share() { uni.showModal({ title: '分享需求', content: '点击右上角「...」分享', showCancel: false }) }

async function submitLead() {
  if (!leadForm.value.contact_name.trim() || !leadForm.value.phone.trim()) { uni.showToast({ title: '请填写联系信息', icon: 'none' }); return }
  submitting.value = true
  try {
    leadService.create({ demand_id: demandId.value, ...leadForm.value, user_id: 'demo_user_001' })
    uni.showToast({ title: '提交成功', icon: 'success' })
    showLeadModal.value = false
    demand.value.lead_count++
  } finally { submitting.value = false }
}

onLoad((q) => { demandId.value = q.id; loadDetail() })
</script>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: $bg-primary; padding: $space-4; padding-bottom: 180rpx; }

.hero-card { padding: $space-5; margin-bottom: $space-3; }
.hero-tags { display: flex; gap: $space-2; margin-bottom: $space-3; }
.hero-title { font-size: $font-xl; font-weight: $weight-black; color: $text-primary; display: block; margin-bottom: $space-3; line-height: 1.4; }
.hero-company { display: flex; justify-content: space-between; }
.hero-name { font-size: $font-base; color: $text-secondary; }
.hero-region { font-size: $font-sm; color: $text-tertiary; }

.budget-card, .stats-card, .desc-card, .time-card { padding: $space-4; margin-bottom: $space-3; }
.card-label { font-size: $font-base; font-weight: $weight-semibold; color: $text-secondary; display: block; margin-bottom: $space-2; }
.budget-display { display: flex; align-items: center; }
.budget-value { font-size: $font-2xl; font-weight: $weight-black; }

.stats-card .stat-row { display: flex; justify-content: space-around; padding-bottom: $space-3; border-bottom: 1rpx solid $border-color; margin-bottom: $space-3; }
.stat-box { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: $font-xl; font-weight: $weight-bold; color: $text-primary; }
.stat-label { font-size: $font-xs; color: $text-tertiary; }
.stat-bar { display: flex; align-items: center; gap: $space-2; }
.stat-bar-label { font-size: $font-sm; color: $text-secondary; }
.stat-bar-track { flex: 1; height: 8rpx; background: rgba(255,255,255,0.06); border-radius: 4rpx; }
.stat-bar-fill { height: 100%; background: $gradient-primary; border-radius: 4rpx; }
.stat-bar-value { font-size: $font-sm; color: $color-primary; font-weight: $weight-bold; }

.desc-text { font-size: $font-base; color: $text-secondary; line-height: 1.7; }

.time-row { display: flex; justify-content: space-between; padding: $space-2 0; }
.time-label { font-size: $font-sm; color: $text-tertiary; }
.time-value { font-size: $font-sm; color: $text-secondary; }

.action-bar { position: fixed; bottom: $space-4; left: $space-4; right: $space-4; display: flex; justify-content: space-between; align-items: center; padding: $space-3 $space-4; }
.action-left { display: flex; gap: $space-4; }
.action-btn { display: flex; flex-direction: column; align-items: center; }
.action-icon { font-size: 36rpx; }
.action-text { font-size: $font-xs; color: $text-tertiary; }
.btn-glow { flex: 1; }

.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: $z-modal; display: flex; align-items: flex-end; }
.modal-panel { width: 100%; padding: $space-5; border-radius: $radius-xl $radius-xl 0 0; }
.modal-title { font-size: $font-lg; font-weight: $weight-bold; color: $text-primary; display: block; margin-bottom: $space-4; }
.modal-body { display: flex; flex-direction: column; gap: $space-3; margin-bottom: $space-4; }
.form-row { display: flex; flex-direction: column; }
.form-label { font-size: $font-sm; color: $text-secondary; margin-bottom: $space-1; }
.form-input { height: 72rpx; background: $glass-bg; border: 1rpx solid $glass-border; border-radius: $radius-md; padding: $space-3; font-size: $font-base; color: $text-primary; }
.form-area { height: 120rpx; background: $glass-bg; border: 1rpx solid $glass-border; border-radius: $radius-md; padding: $space-3; font-size: $font-base; color: $text-primary; }

.empty-page { text-align: center; padding: $space-10; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: $space-3; }
.empty-text { font-size: $font-md; color: $text-tertiary; }
</style>