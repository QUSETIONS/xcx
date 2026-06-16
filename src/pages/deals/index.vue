<template>
  <view class="page">
    <view class="header">
      <text class="header-title">成交管理</text>
      <view class="filter-row">
        <text class="filter-tab" :class="{ active: tab === 'all' }" @tap="tab = 'all'">全部</text>
        <text class="filter-tab" :class="{ active: tab === 'in_progress' }" @tap="tab = 'in_progress'">进行中</text>
        <text class="filter-tab" :class="{ active: tab === 'completed' }" @tap="tab = 'completed'">已完成</text>
      </view>
    </view>

    <view class="deal-list">
      <view class="deal-item" v-for="item in filteredList" :key="item._id">
        <view class="deal-top">
          <text class="deal-title">{{ item.demand_title }}</text>
          <view class="deal-status" :class="'s-' + item.status">
            <text>{{ statusMap[item.status] }}</text>
          </view>
        </view>
        <view class="deal-info">
          <view class="info-row">
            <text class="info-label">服务方</text>
            <text class="info-value">{{ item.provider_name }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">联系方式</text>
            <text class="info-value">{{ item.provider_phone }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">成交时间</text>
            <text class="info-value">{{ formatDate(item.created_at) }}</text>
          </view>
        </view>
        <view class="deal-actions">
          <view class="action-btn" v-if="item.status === 'in_progress'" @tap="completeDeal(item)">
            <text>确认完成</text>
          </view>
          <view class="action-btn review-btn" v-if="item.can_review && !item.has_review" @tap="openReview(item)">
            <text>评价</text>
          </view>
          <view class="action-btn done-btn" v-if="item.has_review">
            <text>已评价 ✓</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!filteredList.length" class="empty">
      <text class="empty-icon">🤝</text>
      <text class="empty-text">暂无成交记录</text>
    </view>

    <!-- 评价弹窗 -->
    <view v-if="showReviewModal" class="modal-mask" @tap="showReviewModal = false">
      <view class="modal-panel" @tap.stop>
        <text class="modal-title">评价本次合作</text>
        <view class="star-row">
          <text class="star" v-for="i in 5" :key="i" @tap="reviewForm.rating = i">{{ i <= reviewForm.rating ? '⭐' : '☆' }}</text>
        </view>
        <textarea class="review-input" v-model="reviewForm.content" placeholder="请评价本次合作体验..." maxlength="200" />
        <view class="tag-row">
          <text class="review-tag-opt" :class="{ active: reviewForm.tags.includes(t) }" v-for="t in tagOptions" :key="t" @tap="toggleTag(t)">{{ t }}</text>
        </view>
        <view class="modal-actions">
          <view class="modal-cancel" @tap="showReviewModal = false"><text>取消</text></view>
          <view class="modal-submit" @tap="submitReview"><text>提交评价</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { dealService } from '@/mock/service'
import { formatDate } from "@/utils/util"

const tab = ref('all')
const showReviewModal = ref(false)
const currentDeal = ref(null)
const reviewForm = ref({ rating: 5, content: '', tags: [] })
const tagOptions = ['专业', '及时', '靠谱', '性价比高', '沟通顺畅', '创意好']

const statusMap = { in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const deals = ref(dealService.myDeals().list)

const filteredList = computed(() => {
  if (tab.value === 'all') return deals.value
  return deals.value.filter(d => d.status === tab.value)
})


function completeDeal(item) {
  uni.showModal({
    title: '确认完成',
    content: '确认本次合作已完成？完成后可以进行评价',
    success: (res) => {
      if (res.confirm) {
        dealService.updateStatus(item._id, 'completed')
        item.status = 'completed'
        item.can_review = true
        uni.showToast({ title: '已确认完成', icon: 'success' })
      }
    }
  })
}

function openReview(item) {
  currentDeal.value = item
  reviewForm.value = { rating: 5, content: '', tags: [] }
  showReviewModal.value = true
}

function toggleTag(tag) {
  const idx = reviewForm.value.tags.indexOf(tag)
  if (idx > -1) reviewForm.value.tags.splice(idx, 1)
  else reviewForm.value.tags.push(tag)
}

function submitReview() {
  if (!reviewForm.value.content.trim()) {
    uni.showToast({ title: '请填写评价内容', icon: 'none' })
    return
  }
  if (currentDeal.value) {
    dealService.addReview(currentDeal.value._id, { ...reviewForm.value })
    currentDeal.value.has_review = true
    currentDeal.value.can_review = false
  }
  showReviewModal.value = false
  uni.showToast({ title: '评价成功', icon: 'success' })
}
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }
.header { margin-bottom: 16rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.filter-row { display: flex; }
.filter-tab { font-size: 26rpx; color: rgba(0,0,0,0.5); padding: 10rpx 24rpx; background: #FFFFFF; border-radius: 20rpx; margin-right: 12rpx; }
.filter-tab.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

.deal-list { display: flex; flex-direction: column; }
.deal-item { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.deal-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.deal-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); flex: 1; }
.deal-status { padding: 4rpx 16rpx; border-radius: 8rpx; }
.s-in_progress { background: rgba(245,158,11,0.1); }
.s-in_progress text { font-size: 22rpx; color: #F59E0B; }
.s-completed { background: rgba(16,185,129,0.1); }
.s-completed text { font-size: 22rpx; color: #10B981; }

.deal-info { background: #F8F9FC; border-radius: 12rpx; padding: 16rpx; margin-bottom: 16rpx; }
.info-row { display: flex; justify-content: space-between; padding: 6rpx 0; }
.info-label { font-size: 24rpx; color: rgba(0,0,0,0.4); }
.info-value { font-size: 24rpx; color: rgba(0,0,0,0.7); }

.deal-actions { display: flex; }
.action-btn { padding: 12rpx 28rpx; background: #F5F6FA; border-radius: 12rpx; margin-right: 12rpx; }
.action-btn text { font-size: 24rpx; color: rgba(0,0,0,0.6); }
.review-btn { background: rgba(255,107,53,0.1); }
.review-btn text { color: #FF6B35; font-weight: bold; }
.done-btn { background: rgba(16,185,129,0.1); }
.done-btn text { color: #10B981; }

.empty { text-align: center; padding: 80rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); }

/* 评价弹窗 */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 400; display: flex; align-items: flex-end; }
.modal-panel { width: 100%; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; padding: 32rpx; }
.modal-title { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 24rpx; text-align: center; }
.star-row { display: flex; justify-content: center; margin-bottom: 20rpx; }
.star { font-size: 48rpx; margin: 0 8rpx; }
.review-input { width: 100%; height: 160rpx; background: #F5F6FA; border-radius: 16rpx; padding: 16rpx; font-size: 28rpx; color: rgba(0,0,0,0.85); margin-bottom: 20rpx; box-sizing: border-box; }
.tag-row { display: flex; flex-wrap: wrap; margin-bottom: 24rpx; }
.review-tag-opt { font-size: 24rpx; color: rgba(0,0,0,0.5); background: #F5F6FA; padding: 10rpx 20rpx; border-radius: 16rpx; margin-right: 12rpx; margin-bottom: 8rpx; }
.review-tag-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }
.modal-actions { display: flex; }
.modal-cancel { flex: 1; text-align: center; padding: 20rpx; background: #F5F6FA; border-radius: 24rpx; margin-right: 12rpx; }
.modal-cancel text { font-size: 28rpx; color: rgba(0,0,0,0.5); }
.modal-submit { flex: 1; text-align: center; padding: 20rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; }
.modal-submit text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
</style>