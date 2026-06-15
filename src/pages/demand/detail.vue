<template>
  <view class="page" v-if="demand">
    <!-- 顶部信息 -->
    <view class="hero-card">
      <view class="hero-tags">
        <text class="tag-cat">{{ demand.category_name }}</text>
        <text class="tag-quote">{{ formatQuote(demand.quote_type) }}</text>
        <text class="tag-hot" v-if="demand.view_count > 1000">🔥 热门</text>
      </view>
      <text class="hero-title">{{ demand.title }}</text>
      <view class="hero-company">
        <text class="hero-name">{{ demand.company_name }}</text>
        <text class="hero-region">{{ demand.region }}</text>
      </view>
    </view>

    <!-- 预算 -->
    <view class="card">
      <text class="card-label">💰 预算范围</text>
      <text class="budget-value">
        <template v-if="demand.quote_type === 'self'">¥{{ (demand.budget_min/100).toFixed(0) }} - {{ (demand.budget_max/100).toFixed(0) }}</template>
        <template v-else>{{ formatQuote(demand.quote_type) }}</template>
      </text>
    </view>

    <!-- 数据统计 -->
    <view class="card">
      <view class="stat-row">
        <view class="stat-box"><text class="stat-num">{{ demand.view_count }}</text><text class="stat-label">浏览</text></view>
        <view class="stat-box"><text class="stat-num">{{ demand.lead_count }}</text><text class="stat-label">对接</text></view>
        <view class="stat-box"><text class="stat-num">{{ demand.favorite_count }}</text><text class="stat-label">收藏</text></view>
      </view>
      <view class="heat-row">
        <text class="heat-label">热度指数</text>
        <view class="heat-track"><view class="heat-fill" :style="{ width: getHeat() + '%' }"/></view>
        <text class="heat-value">{{ getHeat() }}%</text>
      </view>
    </view>

    <!-- 需求详情 -->
    <view class="card">
      <text class="card-label">📝 需求详情</text>
      <text class="desc-text">{{ demand.description || '暂无详细描述' }}</text>
    </view>

    <!-- 时间信息 -->
    <view class="card">
      <text class="card-label">📅 时间信息</text>
      <view class="time-row"><text class="time-label">发布时间</text><text class="time-value">{{ formatDate(demand.publish_time) }}</text></view>
      <view class="time-row"><text class="time-label">有效期至</text><text class="time-value">{{ formatDate(demand.expire_time) }}</text></view>
    </view>

    <!-- 相似需求 -->
    <view class="card" v-if="similarDemands.length">
      <text class="card-label">🔗 相似需求</text>
      <view class="similar-list">
        <view class="similar-item" v-for="item in similarDemands" :key="item._id" @tap="goDetail(item._id)">
          <text class="similar-title">{{ item.title }}</text>
          <text class="similar-company">{{ item.company_name }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="action-bar">
      <view class="action-left">
        <view class="action-btn" @tap="toggleFavorite"><text class="action-icon">{{ isFavorited ? '❤️' : '🤍' }}</text><text class="action-text">收藏</text></view>
        <view class="action-btn" @tap="share"><text class="action-icon">🔗</text><text class="action-text">分享</text></view>
      </view>
      <button class="primary-btn" @tap="showLeadModal = true"><text>立即对接</text></button>
    </view>

    <!-- 对接弹窗 -->
    <view v-if="showLeadModal" class="modal-mask" @tap="showLeadModal = false">
      <view class="modal-panel" @tap.stop>
        <text class="modal-title">立即对接</text>
        <view class="modal-body">
          <view class="form-row"><text class="form-label">姓名 *</text><input class="form-input" v-model="leadForm.contact_name" placeholder="请输入" /></view>
          <view class="form-row"><text class="form-label">电话 *</text><input class="form-input" type="number" v-model="leadForm.phone" placeholder="请输入" /></view>
          <view class="form-row"><text class="form-label">微信号</text><input class="form-input" v-model="leadForm.wechat" placeholder="可选" /></view>
          <view class="form-row"><text class="form-label">对接说明</text><textarea class="form-area" v-model="leadForm.message" placeholder="简要介绍您的服务能力" /></view>
        </view>
        <button class="primary-btn" @tap="submitLead" :disabled="submitting"><text>{{ submitting ? '提交中...' : '提交对接' }}</text></button>
      </view>
    </view>
  </view>

  <view v-else class="empty"><text class="empty-icon">📭</text><text>需求不存在</text></view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { QUOTE_TYPES } from '@/config/constants'
import { demandService, leadService, favoriteService } from '@/mock/service'

const demandId = ref('')
const demand = ref(null)
const similarDemands = ref([])
const isFavorited = ref(false)
const showLeadModal = ref(false)
const submitting = ref(false)
const leadForm = ref({ contact_name: '', phone: '', wechat: '', message: '' })

function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}` }
function getHeat() { return demand.value ? Math.min(100, Math.round((demand.value.view_count / 3000) * 100)) : 0 }

function loadDetail() {
  demand.value = demandService.detail(demandId.value)
  if (!demand.value) return
  isFavorited.value = favoriteService.check({ userId: 'demo_user_001', targetType: 'demand', targetId: demandId.value })
  // 智能推荐相似需求：同分类+不同ID
  const all = demandService.list({ pageSize: 100 })
  similarDemands.value = all.list
    .filter(d => d._id !== demandId.value && d.category_id === demand.value.category_id)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 3)
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

function goDetail(id) { uni.redirectTo({ url: `/pages/demand/detail?id=${id}` }) }

onLoad((q) => { demandId.value = q.id; loadDetail() })
</script>

<style lang="scss">
.page { min-height: 100vh; background: #0A0A0F; padding: 24rpx; padding-bottom: 180rpx; }

.hero-card { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; }
.hero-tags { display: flex; gap: 8rpx; margin-bottom: 12rpx; }
.tag-cat { font-size: 20rpx; color: #FF9A5C; background: rgba(255,107,53,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.tag-quote { font-size: 20rpx; color: #F472B6; background: rgba(236,72,153,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.tag-hot { font-size: 18rpx; color: #EF4444; }
.hero-title { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 12rpx; line-height: 1.4; }
.hero-company { display: flex; justify-content: space-between; }
.hero-name { font-size: 26rpx; color: rgba(255,255,255,0.65); }
.hero-region { font-size: 24rpx; color: rgba(255,255,255,0.5); }

.card { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 20rpx; margin-bottom: 12rpx; }
.card-label { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 12rpx; }
.budget-value { font-size: 40rpx; font-weight: bold; color: #FF6B35; }

.stat-row { display: flex; justify-content: space-around; padding-bottom: 16rpx; border-bottom: 1rpx solid rgba(255,255,255,0.08); margin-bottom: 16rpx; }
.stat-box { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.stat-label { font-size: 20rpx; color: rgba(255,255,255,0.5); }
.heat-row { display: flex; align-items: center; gap: 12rpx; }
.heat-label { font-size: 24rpx; color: rgba(255,255,255,0.65); }
.heat-track { flex: 1; height: 8rpx; background: rgba(255,255,255,0.08); border-radius: 4rpx; }
.heat-fill { height: 100%; background: linear-gradient(90deg, #FF6B35, #FF9A5C); border-radius: 4rpx; transition: width 0.6s ease-out; }
.heat-value { font-size: 24rpx; color: #FF6B35; font-weight: bold; }

.desc-text { font-size: 28rpx; color: rgba(255,255,255,0.75); line-height: 1.7; }
.time-row { display: flex; justify-content: space-between; padding: 8rpx 0; }
.time-label { font-size: 24rpx; color: rgba(255,255,255,0.5); }
.time-value { font-size: 24rpx; color: rgba(255,255,255,0.75); }

.similar-list { display: flex; flex-direction: column; gap: 12rpx; }
.similar-item { background: rgba(255,255,255,0.04); border: 1rpx solid rgba(255,255,255,0.08); border-radius: 12rpx; padding: 16rpx; }
.similar-title { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.85); display: block; margin-bottom: 4rpx; }
.similar-company { font-size: 22rpx; color: rgba(255,255,255,0.5); }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #12121A; border-top: 1rpx solid rgba(255,255,255,0.08); }
.action-left { display: flex; gap: 24rpx; }
.action-btn { display: flex; flex-direction: column; align-items: center; }
.action-icon { font-size: 36rpx; }
.action-text { font-size: 20rpx; color: rgba(255,255,255,0.5); }
.primary-btn { flex: 1; background: linear-gradient(135deg, #FF6B35, #FF9A5C); color: #fff; border-radius: 32rpx; padding: 20rpx; font-size: 28rpx; font-weight: bold; border: none; }

.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 400; display: flex; align-items: flex-end; }
.modal-panel { width: 100%; padding: 32rpx; background: #1A1A26; border-radius: 32rpx 32rpx 0 0; }
.modal-title { font-size: 32rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 24rpx; }
.modal-body { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 24rpx; }
.form-row { display: flex; flex-direction: column; }
.form-label { font-size: 24rpx; color: rgba(255,255,255,0.65); margin-bottom: 8rpx; }
.form-input { height: 72rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 16rpx; font-size: 28rpx; color: rgba(255,255,255,0.95); }
.form-area { height: 120rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 16rpx; font-size: 28rpx; color: rgba(255,255,255,0.95); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
</style>