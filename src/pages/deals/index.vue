<template>
  <view class="page">
    <view v-if="loadState === 'loading'" class="page-state">
      <text>{{ t('common.loading') }}</text>
    </view>
    <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
      <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
      <text>{{ t('common.loadFailed') }}</text>
      <text class="page-state-action">{{ t('common.retry') }}</text>
    </view>
    <view v-else class="deals-content">
    <view class="header">
      <text class="ledger-kicker">PROJECT LEDGER</text>
      <text class="header-title">{{ t('user.dealsManage') }}</text>
      <text class="header-subtitle">把正在合作的项目排成一条工作队列，下一步一目了然。</text>
      <view v-if="agendaItems.length" class="agenda-strip">
        <view class="agenda-strip-head"><view><text class="agenda-kicker">MY NEXT STEPS</text><text class="agenda-title">{{ agendaTitle }}</text></view><text class="agenda-count">{{ agendaSummary.total }} 项</text></view>
        <view v-for="task in agendaItems.slice(0, 2)" :key="task._id" class="agenda-item" @tap="openWorkspace({ _id: task.deal_id })"><view class="agenda-dot" :class="`reminder-${task.reminder}`" /><view class="agenda-copy"><text>{{ task.title }}</text><text>{{ task.demand_title || '合作项目' }}<text v-if="task.due_at"> · {{ reminderLabel(task.reminder, task.due_at) }}</text></text></view><text class="agenda-arrow">→</text></view>
      </view>
      <view class="filter-row">
        <text class="filter-tab" :class="{ active: tab === 'all' }" @tap="tab = 'all'">{{ t('common.all') }}</text>
        <text class="filter-tab" :class="{ active: tab === 'in_progress' }" @tap="tab = 'in_progress'">{{ t('deals.inProgress') }}</text>
        <text class="filter-tab" :class="{ active: tab === 'completed' }" @tap="tab = 'completed'">{{ t('orderPage.completed') }}</text>
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
        <view class="project-progress">
          <view class="progress-copy"><text>{{ item.milestone_summary?.completed || 0 }}/{{ item.milestone_summary?.total || 0 }} 个里程碑</text><text>{{ item.milestone_summary?.progress || 0 }}%</text></view>
          <view class="progress-track"><view class="progress-fill" :style="{ width: `${item.milestone_summary?.progress || 0}%` }" /></view>
        </view>
        <view class="deal-ledger-meta">
          <text>{{ item.provider_name || '合作团队' }}</text><text v-if="item.amount">¥{{ formatAmount(item.amount) }}</text><text>{{ formatDate(item.created_at) }}</text>
        </view>
        <view class="deal-next" @tap="openWorkspace(item)"><view><text class="next-label">NEXT STEP</text><text class="next-title">{{ dealNextStep(item) }}</text><text class="next-meta">{{ dealNextMeta(item) }}</text></view><text class="next-arrow">→</text></view>
        <view class="deal-actions">
          <view class="action-btn primary-workspace" @tap="openWorkspace(item)">
            <text>进入协作室</text>
          </view>
          <view class="action-btn" v-if="item.status === 'in_progress'" :class="{ disabled: !canComplete(item) }" @tap="completeDeal(item)">
            <text>{{ t('orderPage.complete') }}</text>
          </view>
          <view class="action-btn" v-if="item.counterparty_user_id" @tap="contactPartner(item)"><text>联系对方</text></view>
          <view class="action-btn review-btn" v-if="item.can_review && !item.has_review" @tap="openReview(item)">
            <text>{{ t('deals.review') }}</text>
          </view>
          <view class="action-btn done-btn" v-if="item.has_review">
            <text>{{ t('deals.reviewed') }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!filteredList.length" class="empty">
      <image class="empty-icon" src="/static/icons/handshake.svg" mode="aspectFit" />
      <text class="empty-text">{{ t('deals.empty') }}</text>
    </view>

    <!-- 评价弹窗 -->
    <view v-if="showReviewModal" class="modal-mask" @tap="showReviewModal = false">
      <view class="modal-panel" @tap.stop>
        <text class="modal-title">{{ t('deals.reviewTitle') }}</text>
        <view class="star-row">
          <text class="star" v-for="i in 5" :key="i" @tap="reviewForm.rating = i">{{ i <= reviewForm.rating ? '★' : '☆' }}</text>
        </view>
        <textarea class="review-input" v-model="reviewForm.content" :placeholder="t('deals.reviewPlaceholder')" maxlength="200" />
        <view class="tag-row">
          <text class="review-tag-opt" :class="{ active: reviewForm.tags.includes(tg) }" v-for="tg in tagOptions" :key="tg" @tap="toggleTag(tg)">{{ tg }}</text>
        </view>
        <view class="modal-actions">
          <view class="modal-cancel" @tap="showReviewModal = false"><text>{{ t('common.cancel') }}</text></view>
          <view class="modal-submit" :class="{ disabled: reviewing }" @tap="submitReview"><text>{{ reviewing ? t('common.loading') : t('deals.submitReview') }}</text></view>
        </view>
      </view>
    </view>

    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { formatDate } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
useNavTitle('titles.deals')

const tab = ref('all')
const showReviewModal = ref(false)
const currentDeal = ref(null)
const reviewForm = ref({ rating: 5, content: '', tags: [] })
const agendaItems = ref([])
const agendaSummary = ref({ total: 0, overdue: 0, today: 0, tomorrow: 0, upcoming: 0, unscheduled: 0 })
const tagOptions = computed(() => t('deals.tags'))

const statusMap = computed(() => ({
  in_progress: t('deals.statusInProgress'),
  completed: t('deals.statusCompleted'),
  cancelled: t('deals.statusCancelled')
}))
const deals = ref([])
const agendaTitle = computed(() => agendaSummary.value.overdue ? `有 ${agendaSummary.value.overdue} 项需要尽快处理` : agendaSummary.value.today ? `今天有 ${agendaSummary.value.today} 项待推进` : '下一步，先从最重要的一件开始')

const { state: loadState, run: loadRequest } = useRequest(async () => {
  const [dealResult, agendaResult] = await Promise.all([
    bridge.deal.myDeals(),
    bridge.deal.agenda().catch(() => ({ list: [], summary: {} }))
  ])
  return { deals: dealResult?.list || [], agenda: agendaResult || { list: [], summary: {} } }
})
const { state: completeState, run: completeRequest } = useRequest((id) => bridge.deal.updateStatus(id, 'completed'))
const { state: reviewState, run: reviewRequest } = useRequest((id, data) => bridge.deal.addReview(id, data))
const reviewing = computed(() => reviewState.value === 'loading')

async function reload() {
  try {
    const data = await loadRequest()
    deals.value = data?.deals || []
    agendaItems.value = data?.agenda?.list || []
    agendaSummary.value = { ...agendaSummary.value, ...(data?.agenda?.summary || {}) }
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

const filteredList = computed(() => {
  if (tab.value === 'all') return deals.value
  return deals.value.filter(d => d.status === tab.value)
})


function completeDeal(item) {
  if (completeState.value === 'loading') return
  if (!canComplete(item)) {
    uni.showToast({ title: '请先完成全部里程碑', icon: 'none' })
    setTimeout(() => openWorkspace(item), 220)
    return
  }
  uni.showModal({
    title: t('deals.confirmTitle'),
    content: t('deals.confirmContent'),
    success: async (res) => {
      if (res.confirm) {
        try {
          await completeRequest(item._id)
          item.status = 'completed'
          item.can_review = true
          uni.showToast({ title: t('deals.confirmed'), icon: 'success' })
        } catch (error) {
          toastError(error?.message || t('common.loadFailed'))
        }
      }
    }
  })
}

function openWorkspace(item) {
  if (!item?._id) return
  uni.navigateTo({ url: `/pages/deals/workspace?id=${encodeURIComponent(item._id)}` })
}

function reminderLabel(reminder, dueAt) {
  if (reminder === 'overdue') return '已逾期'
  if (reminder === 'today') return '今天截止'
  if (reminder === 'tomorrow') return '明天截止'
  if (reminder === 'upcoming') return `截止 ${formatDate(dueAt)}`
  return '尚未排期'
}

function canComplete(item) {
  const total = Number(item?.milestone_summary?.total || 0)
  const completed = Number(item?.milestone_summary?.completed || 0)
  return total > 0 && completed === total
}

function dealAgenda(item) {
  return agendaItems.value.find((task) => String(task?.deal_id || '') === String(item?._id || '')) || null
}

function dealNextStep(item) {
  const task = dealAgenda(item)
  if (task?.title) return task.title
  if (item?.status === 'completed') return item.has_review ? '项目已经完成并留下合作记录' : '项目已完成，等待留下合作评价'
  const total = Number(item?.milestone_summary?.total || 0)
  const completed = Number(item?.milestone_summary?.completed || 0)
  if (!total) return '先补齐项目范围、成员与交付节点'
  if (completed < total) return `推进第 ${completed + 1} 个交付节点`
  return '交付节点已完成，可确认项目收尾'
}

function dealNextMeta(item) {
  const task = dealAgenda(item)
  if (task) return `${item.provider_name || '合作团队'} · ${reminderLabel(task.reminder, task.due_at)}`
  if (item?.status === 'completed') return `${formatDate(item.created_at)} 建立合作`
  const progress = Number(item?.milestone_summary?.progress || 0)
  return progress ? `当前交付进度 ${progress}%` : '进入协作室安排第一次项目对齐'
}

function contactPartner(item) {
  if (!item.counterparty_user_id) return
  uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(item.counterparty_user_id)}&name=${encodeURIComponent(item.provider_name || '合作伙伴')}` })
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('zh-CN')
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

async function submitReview() {
  if (reviewing.value) return
  if (!reviewForm.value.content.trim()) {
    uni.showToast({ title: t('deals.enterReview'), icon: 'none' })
    return
  }
  if (currentDeal.value) {
    try {
      await reviewRequest(currentDeal.value._id, { ...reviewForm.value })
      currentDeal.value.has_review = true
      currentDeal.value.can_review = false
    } catch {
      toastError(t('common.loadFailed'))
      return
    }
  }
  showReviewModal.value = false
  uni.showToast({ title: t('deals.reviewSuccess'), icon: 'success' })
}
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }
.page-state { min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }
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
.empty-icon { width: 64rpx; height: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); }

/* 评价弹窗 */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1200; display: flex; align-items: flex-end; }
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
.modal-submit.disabled { opacity: 0.65; }
.modal-submit text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }

/* Project workspace: warm, precise and document-led. */
.page { color: #26231F; background: #F4F1EA; }
.header { padding: 12rpx 4rpx 24rpx; }
.header-title { margin-bottom: 5rpx; color: #26231F; font-family: Georgia, 'Times New Roman', serif; font-size: 40rpx; font-weight: 500; }
.header-subtitle { display: block; margin-bottom: 20rpx; color: #817A70; font-size: 21rpx; line-height: 1.55; }
.agenda-strip { margin: 0 0 18rpx; padding: 15rpx 16rpx 8rpx; border-top: 1rpx solid rgba(42,37,31,.14); border-bottom: 1rpx solid rgba(42,37,31,.1); background: #FAF8F3; }
.agenda-strip-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16rpx; padding-bottom: 10rpx; }.agenda-kicker,.agenda-title { display: block; }.agenda-kicker { color: #8A8177; font: 700 15rpx/1.2 monospace; letter-spacing: .1em; }.agenda-title { margin-top: 5rpx; color: #39342E; font-size: 23rpx; font-weight: 600; }.agenda-count { color: #8A8177; font-size: 18rpx; }
.agenda-item { display: flex; align-items: center; gap: 10rpx; padding: 11rpx 0; border-top: 1rpx solid rgba(42,37,31,.07); }.agenda-dot { width: 10rpx; height: 10rpx; flex: 0 0 10rpx; border-radius: 50%; background: #A69E93; }.agenda-dot.reminder-overdue { background: #8D403D; }.agenda-dot.reminder-today { background: #B58238; }.agenda-dot.reminder-tomorrow { background: #596050; }.agenda-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; }.agenda-copy text:first-child { overflow: hidden; color: #423B34; font-size: 20rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.agenda-copy text:last-child { overflow: hidden; margin-top: 3rpx; color: #928A80; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }.agenda-arrow { color: #69574A; font-size: 20rpx; }
.filter-row { gap: 8rpx; }
.filter-tab { margin: 0; padding: 9rpx 18rpx; border: 1rpx solid rgba(42,37,31,.1); border-radius: 6rpx; color: #746D64; background: #FAF8F3; font-size: 22rpx; }
.filter-tab.active { color: #5C2828; border-color: rgba(92,40,40,.25); background: #F1E9E3; font-weight: 600; }
.deal-item { margin-bottom: 14rpx; padding: 24rpx; border: 1rpx solid rgba(42,37,31,.1); border-radius: 8rpx; background: #FCFBF8; }
.deal-title { color: #26231F; font-family: Georgia, 'Times New Roman', serif; font-size: 30rpx; font-weight: 500; }
.deal-status { border-radius: 4rpx; }
.s-in_progress { color: #745E3B; background: #F2EBDD; }.s-in_progress text { color: inherit; }
.s-completed { color: #41463C; background: #E9ECE4; }.s-completed text { color: inherit; }
.project-progress { margin: 18rpx 0; }
.progress-copy { display: flex; justify-content: space-between; margin-bottom: 8rpx; color: #837B71; font-size: 19rpx; }
.progress-track { height: 4rpx; overflow: hidden; background: #E8E3DA; }
.progress-fill { height: 100%; background: #5C2828; transition: width .24s ease; }
.deal-info { padding: 14rpx 0; border-top: 1rpx solid rgba(42,37,31,.08); border-bottom: 1rpx solid rgba(42,37,31,.08); border-radius: 0; background: transparent; }
.info-label { color: #90887E; font-size: 21rpx; }.info-value { color: #4B4640; font-size: 21rpx; }.amount-value { color: #5C2828; font-variant-numeric: tabular-nums; }
.deal-actions { flex-wrap: wrap; gap: 8rpx; }
.action-btn { margin: 0; padding: 10rpx 16rpx; border: 1rpx solid rgba(42,37,31,.1); border-radius: 5rpx; background: transparent; }
.action-btn text { color: #625B53; font-size: 20rpx; }.action-btn.disabled { opacity: .42; }
.primary-workspace { border-color: #2E2A25; background: #2E2A25; }.primary-workspace text { color: #F8F5EE; }
.review-btn { border-color: rgba(92,40,40,.2); background: #F4ECE7; }.review-btn text { color: #5C2828; }
.workspace-panel { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid rgba(42,37,31,.1); }
.workspace-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
.workspace-title,.workspace-copy { display: block; }.workspace-title { color: #302C27; font-size: 24rpx; font-weight: 650; }.workspace-copy { margin-top: 4rpx; color: #8B8379; font-size: 18rpx; }
.workspace-add { flex: 0 0 auto; color: #5C2828; font-size: 20rpx; }
.workspace-state { padding: 28rpx 0 8rpx; color: #8B8379; font-size: 21rpx; text-align: center; }
.milestone-list { margin-top: 14rpx; }
.milestone-item { display: flex; align-items: center; gap: 12rpx; padding: 13rpx 0; border-top: 1rpx solid rgba(42,37,31,.07); }
.milestone-state { display: flex; align-items: center; justify-content: center; width: 34rpx; height: 34rpx; flex: 0 0 34rpx; border: 1rpx solid #C8C0B5; color: #8A8177; font-size: 18rpx; }
.milestone-in_progress .milestone-state { border-color: #B5A07A; color: #745E3B; background: #F2EBDD; }
.milestone-completed .milestone-state { border-color: #596050; color: #F7F5EF; background: #596050; }
.milestone-copy { display: flex; flex: 1; flex-direction: column; min-width: 0; }.milestone-title { overflow: hidden; color: #39342E; font-size: 22rpx; text-overflow: ellipsis; white-space: nowrap; }.milestone-status { margin-top: 4rpx; color: #8A8177; font-size: 18rpx; }
.milestone-completed .milestone-title { color: #777067; text-decoration: line-through; }.milestone-next { flex: 0 0 auto; color: #5C2828; font-size: 19rpx; }
.modal-mask { background: rgba(32,28,24,.44); }.modal-panel { padding: 30rpx 28rpx calc(30rpx + env(safe-area-inset-bottom)); border-radius: 12rpx 12rpx 0 0; background: #FCFBF8; box-sizing: border-box; }.modal-title { color: #2E2924; font-family: Georgia, 'Times New Roman', serif; font-weight: 500; }
.milestone-input { width: 100%; margin-top: 12rpx; padding: 17rpx; border: 1rpx solid #DED8CE; border-radius: 5rpx; color: #2E2924; background: #FAF8F3; font-size: 23rpx; box-sizing: border-box; }
.modal-cancel,.modal-submit { border-radius: 5rpx; }.modal-submit { background: #342F29; }

/* 项目协作改为项目账本：状态、进度和下一步比卡片装饰更重要。 */
.deal-list {
  border-top: 1rpx solid rgba(42,37,31,.11);
}
.deal-item {
  margin: 0;
  padding: 30rpx 4rpx 28rpx;
  border: 0;
  border-bottom: 1rpx solid rgba(42,37,31,.10);
  border-radius: 0;
  background: transparent;
}
.deal-top { margin-bottom: 18rpx; }
.deal-title { max-width: 500rpx; font-size: 32rpx; }
.deal-status { padding: 5rpx 9rpx; border: 1rpx solid currentColor; border-radius: 3rpx; background: transparent; }
.s-in_progress { color: #745e3b; background: transparent; }.s-completed { color: #56624c; background: transparent; }
.project-progress { margin: 20rpx 0; }
.deal-info { margin-bottom: 18rpx; }
.deal-actions { padding-top: 2rpx; }
.action-btn { min-height: 62rpx; padding: 0 15rpx; border-radius: 4rpx; line-height: 60rpx; }
.action-btn:active { color: #5c2828; border-color: rgba(92,40,40,.35); background: #f0eee8; }
.primary-workspace { background: #302d29; }.primary-workspace:active { color: #fcfbf8; background: #5c2828; }
.agenda-strip { margin-top: 24rpx; }

/* Project queue: reduce every project to its current state, next move and workspace entry. */
.ledger-kicker { display: block; margin-bottom: 8rpx; color: #8A8177; font: 600 15rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .13em; }
.deal-ledger-meta { display: flex; flex-wrap: wrap; gap: 0 12rpx; padding: 0 0 15rpx; color: #91897E; font-size: 18rpx; }.deal-ledger-meta text:nth-child(2) { color: #69574A; font-variant-numeric: tabular-nums; }
.deal-next { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 17rpx; padding: 16rpx 14rpx; border: 1rpx solid rgba(42,37,31,.09); background: #F8F5EF; }.deal-next > view { display: flex; min-width: 0; flex: 1; flex-direction: column; }.next-label { color: #9A8170; font: 600 14rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; }.next-title { display: block; overflow: hidden; margin-top: 7rpx; color: #403931; font-family: Georgia, 'Times New Roman', serif; font-size: 24rpx; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }.next-meta { display: block; overflow: hidden; margin-top: 5rpx; color: #928A80; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }.next-arrow { flex: 0 0 auto; color: #5C2828; font-size: 23rpx; }
.deal-actions { align-items: center; }.deal-actions .action-btn:not(.primary-workspace) { padding-right: 4rpx; padding-left: 4rpx; border-color: transparent; color: #69574A; background: transparent; }.deal-actions .action-btn:not(.primary-workspace):active { border-color: transparent; background: transparent; }.deal-actions .action-btn:not(.primary-workspace) text { color: inherit; }.deal-actions .review-btn { color: #5C2828; border-color: transparent; background: transparent; }.deal-actions .done-btn { color: #8E867C; }.deal-actions .primary-workspace { min-width: 148rpx; text-align: center; }

/* Overflow guard: project data can be user supplied and action rows grow on narrow phones. */
.page,
.deals-content,
.header,
.agenda-strip,
.agenda-strip-head,
.agenda-strip-head > view,
.agenda-copy,
.deal-list,
.deal-item,
.deal-top,
.deal-ledger-meta,
.deal-next,
.deal-next > view,
.project-progress,
.deal-actions,
.modal-panel { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.header-title,
.header-subtitle,
.agenda-title,
.deal-title,
.next-title,
.next-meta,
.workspace-title,
.workspace-copy { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.deal-title,
.next-title,
.next-meta,
.deal-ledger-meta text,
.agenda-copy text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.deal-title,
.agenda-copy,
.deal-next > view,
.agenda-strip-head > view { flex: 1 1 auto; }
.deal-status,
.filter-tab,
.action-btn,
.next-arrow,
.agenda-arrow,
.workspace-add { flex: 0 0 auto; white-space: nowrap; }
.deal-top,
.deal-next,
.agenda-strip-head { gap: 12rpx; }
.deal-actions { flex-wrap: wrap; gap: 8rpx; }
.deal-actions .action-btn { margin-right: 0; }
.modal-panel { overflow-x: hidden; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .deal-item { padding-right: 0; padding-left: 0; }
  .deal-title { font-size: 28rpx; }
  .filter-tab { padding-right: 13rpx; padding-left: 13rpx; }
  .action-btn { padding-right: 12rpx; padding-left: 12rpx; }
  .deal-actions .primary-workspace { min-width: 132rpx; }
}
</style>
