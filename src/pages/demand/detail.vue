<template>
  <view class="detail-page" v-if="demand">
    <!-- 需求信息 -->
    <view class="info-card">
      <view class="info-header">
        <text class="info-company">{{ demand.company_name }}</text>
        <text class="info-region">{{ demand.region }}</text>
      </view>
      <text class="info-title">{{ demand.title }}</text>
      <view class="info-tags">
        <text class="tag">{{ demand.category_name }}</text>
        <text class="tag tag-quote">{{ formatQuote(demand.quote_type) }}</text>
      </view>
    </view>

    <!-- 预算信息 -->
    <view class="budget-card">
      <text class="card-label">预算/报价</text>
      <text class="budget-value">
        <template v-if="demand.quote_type === 'self'">
          ¥{{ (demand.budget_min / 100).toFixed(0) }} - ¥{{ (demand.budget_max / 100).toFixed(0) }}
        </template>
        <template v-else>{{ formatQuote(demand.quote_type) }}</template>
      </text>
    </view>

    <!-- 需求详情 -->
    <view class="desc-card">
      <text class="card-label">需求详情</text>
      <text class="desc-text">{{ demand.description || '暂无详细描述' }}</text>
    </view>

    <!-- 统计信息 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ demand.view_count }}</text>
        <text class="stat-label">浏览</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ demand.lead_count }}</text>
        <text class="stat-label">对接</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ demand.favorite_count }}</text>
        <text class="stat-label">收藏</text>
      </view>
    </view>

    <!-- 时间信息 -->
    <view class="time-card">
      <text class="time-text">发布：{{ formatDate(demand.publish_time) }}</text>
      <text class="time-text">有效期：{{ formatDate(demand.expire_time) }}</text>
    </view>

    <!-- 底部操作 -->
    <view class="action-bar">
      <view class="action-item" @tap="toggleFavorite">
        <text class="action-icon">{{ isFavorited ? '❤️' : '🤍' }}</text>
        <text class="action-text">收藏</text>
      </view>
      <view class="action-item" @tap="shareDemand">
        <text class="action-icon">🔗</text>
        <text class="action-text">分享</text>
      </view>
      <view class="action-btn" @tap="showLeadModal = true">
        <text>立即对接</text>
      </view>
    </view>

    <!-- 对接弹窗 -->
    <view v-if="showLeadModal" class="modal-mask" @tap="showLeadModal = false">
      <view class="modal-panel" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">立即对接</text>
          <text class="modal-close" @tap="showLeadModal = false">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">姓名 *</text>
            <input class="form-input" v-model="leadForm.contact_name" placeholder="请输入姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">电话 *</text>
            <input class="form-input" type="number" v-model="leadForm.phone" placeholder="请输入电话" />
          </view>
          <view class="form-item">
            <text class="form-label">微信号</text>
            <input class="form-input" v-model="leadForm.wechat" placeholder="请输入微信号" />
          </view>
          <view class="form-item">
            <text class="form-label">对接说明</text>
            <textarea class="form-area" v-model="leadForm.message" placeholder="简要介绍您的服务能力和优势" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="submit-btn" @tap="submitLead" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交对接' }}
          </button>
        </view>
      </view>
    </view>
  </view>

  <view v-else class="empty-page">
    <text class="empty-icon">📭</text>
    <text class="empty-text">需求不存在或已下架</text>
  </view>
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
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}` }

function loadDetail() {
  demand.value = demandService.detail(demandId.value)
  isFavorited.value = favoriteService.check({ userId: 'demo_user_001', targetType: 'demand', targetId: demandId.value })
}

function toggleFavorite() {
  const r = favoriteService.toggle({ userId: 'demo_user_001', targetType: 'demand', targetId: demandId.value })
  isFavorited.value = r.isFavorited
  uni.showToast({ title: r.isFavorited ? '已收藏' : '已取消', icon: 'none' })
}

function shareDemand() {
  uni.showModal({ title: '分享需求', content: '点击右上角「...」即可分享给好友', showCancel: false })
}

async function submitLead() {
  if (!leadForm.value.contact_name.trim() || !leadForm.value.phone.trim()) {
    uni.showToast({ title: '请填写联系信息', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    leadService.create({
      demand_id: demandId.value,
      ...leadForm.value,
      user_id: 'demo_user_001'
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    showLeadModal.value = false
    demand.value.lead_count++
  } finally { submitting.value = false }
}

onLoad((query) => {
  demandId.value = query.id
  loadDetail()
})
</script>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #f5f5f5; padding: 24rpx; padding-bottom: 140rpx; }

.info-card { background: #fff; border-radius: 24rpx; padding: 24rpx; margin-bottom: 16rpx; }
.info-header { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.info-company { font-size: 26rpx; color: #666; }
.info-region { font-size: 22rpx; color: #999; background: #f5f5f5; padding: 4rpx 12rpx; border-radius: 8rpx; }
.info-title { font-size: 34rpx; font-weight: 700; color: #333; display: block; margin-bottom: 12rpx; }
.info-tags { display: flex; gap: 8rpx; }
.tag { font-size: 22rpx; color: #666; background: #f5f5f5; padding: 6rpx 16rpx; border-radius: 8rpx; }
.tag-quote { color: #FF6B35; background: #FF6B3510; }

.budget-card, .desc-card, .stats-card, .time-card { background: #fff; border-radius: 24rpx; padding: 24rpx; margin-bottom: 16rpx; }
.card-label { font-size: 26rpx; font-weight: 600; color: #333; display: block; margin-bottom: 12rpx; }
.budget-value { font-size: 32rpx; font-weight: 700; color: #FF6B35; }
.desc-text { font-size: 28rpx; color: #666; line-height: 1.7; }

.stats-card { display: flex; justify-content: space-around; }
.stat-item { text-align: center; }
.stat-num { font-size: 36rpx; font-weight: 700; color: #333; display: block; }
.stat-label { font-size: 24rpx; color: #999; }

.time-card { display: flex; gap: 24rpx; }
.time-text { font-size: 24rpx; color: #999; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; padding: 16rpx 24rpx; background: #fff; gap: 16rpx; }
.action-item { display: flex; flex-direction: column; align-items: center; padding: 8rpx 16rpx; }
.action-icon { font-size: 36rpx; }
.action-text { font-size: 22rpx; color: #666; }
.action-btn { flex: 1; background: #FF6B35; color: #fff; border-radius: 48rpx; padding: 24rpx; text-align: center; font-size: 30rpx; font-weight: 600; }

.empty-page { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }

/* 弹窗 */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.modal-panel { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; }
.modal-header { display: flex; justify-content: space-between; padding: 24rpx 32rpx; border-bottom: 1rpx solid #f0f0f0; }
.modal-title { font-size: 32rpx; font-weight: 600; }
.modal-close { color: #999; padding: 4rpx; }
.modal-body { padding: 24rpx 32rpx; }
.form-item { margin-bottom: 16rpx; }
.form-label { font-size: 26rpx; color: #666; display: block; margin-bottom: 8rpx; }
.form-input { width: 100%; height: 80rpx; border: 2rpx solid #eee; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 28rpx; }
.form-area { width: 100%; height: 160rpx; border: 2rpx solid #eee; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 28rpx; }
.modal-footer { padding: 24rpx 32rpx; }
.submit-btn { width: 100%; background: #FF6B35; color: #fff; border-radius: 48rpx; padding: 24rpx; font-size: 30rpx; }
</style>