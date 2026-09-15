<template>
  <view class="page">
    <view class="header">
      <view>
        <text class="title">服务方审核</text>
        <text class="subtitle">只有审核通过的服务方会进入公开匹配</text>
      </view>
      <text class="refresh" @tap="load">刷新</text>
    </view>

    <view class="filter-tabs">
      <text v-for="item in filters" :key="item.value" class="filter-tab" :class="{ active: status === item.value }" @tap="changeStatus(item.value)">{{ item.label }}</text>
    </view>
    <view class="search-row">
      <input v-model="keyword" class="search-input" maxlength="40" placeholder="搜索服务方、类别或地区" confirm-type="search" @confirm="load" />
      <text class="search-button" @tap="load">查找</text>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading" class="state">正在读取审核队列…</view>
    <view v-else-if="errorMessage" class="state error-state" @tap="load"><text>{{ errorMessage }}，点此重试</text></view>
      <template v-else>
        <view v-for="item in list" :key="item._id" class="provider-card">
          <view class="card-head">
            <view class="avatar">{{ initial(item.name || item.user?.nickname) }}</view>
            <view class="provider-copy">
              <view class="name-line"><text class="provider-name">{{ item.name || '未命名服务方' }}</text><text class="status" :class="item.verification">{{ statusLabel(item.verification) }}</text></view>
              <text class="provider-meta">{{ item.user?.company || '未填写公司' }} · {{ item.user?.title || '未填写职位' }} · {{ item.user?.city || item.region || '未填写地区' }}</text>
            </view>
          </view>
          <view class="facts"><text>{{ item.category_name || '未分类' }}</text><text>{{ item.region || '未填写服务地区' }}</text><text>起步 ¥{{ formatPrice(item.avg_price) }}</text></view>
          <text class="intro">{{ item.intro || '暂未填写服务介绍' }}</text>
          <view v-if="item.tags?.length" class="tags"><text v-for="tag in item.tags.slice(0, 5)" :key="tag">{{ tag }}</text></view>
          <view v-if="item.verification_info?.review_note" class="previous-note">上次说明：{{ item.verification_info.review_note }}</view>
          <view class="card-footer">
            <text class="created">提交于 {{ formatDate(item.created_at) }}</text>
            <view class="actions">
              <text v-if="item.verification === 'pending'" class="action approve" @tap="approve(item)">通过</text>
              <text v-if="item.verification === 'pending'" class="action reject" @tap="openReview(item, 'rejected')">退回</text>
              <text v-if="item.verification === 'verified'" class="action reject" @tap="openReview(item, 'pending')">撤回认证</text>
              <text v-if="item.verification === 'rejected'" class="action approve" @tap="openReview(item, 'pending')">重新进入审核</text>
            </view>
          </view>
        </view>
        <view v-if="!list.length" class="empty">当前筛选下没有服务方</view>
      </template>
    </scroll-view>

    <view v-if="reviewing" class="modal-mask" @tap="closeReview">
      <view class="review-dialog" @tap.stop>
        <text class="dialog-title">{{ reviewStatus === 'rejected' ? '退回服务方资料' : '调整审核状态' }}</text>
        <text class="dialog-desc">{{ reviewing.name || '该服务方' }} · {{ reviewStatus === 'rejected' ? '请写清楚需要补充的内容' : '状态调整后会通知服务方' }}</text>
        <textarea v-model="reviewNote" class="review-input" maxlength="300" placeholder="审核说明（可选）" />
        <view class="dialog-actions"><text class="dialog-cancel" @tap="closeReview">取消</text><text class="dialog-confirm" @tap="submitReview">{{ saving ? '提交中…' : '确认' }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { formatDate } from '@/utils/util'

useNavTitle('titles.providerManage', '服务方审核')

const filters = [
  { value: 'pending', label: '待审核' },
  { value: '', label: '全部' },
  { value: 'verified', label: '已通过' },
  { value: 'rejected', label: '已退回' }
]
const status = ref('pending')
const keyword = ref('')
const list = ref([])
const loading = ref(false)
const refreshing = ref(false)
const errorMessage = ref('')
const reviewing = ref(null)
const reviewStatus = ref('')
const reviewNote = ref('')
const saving = ref(false)

function statusLabel(value) { return ({ pending: '待审核', verified: '已通过', rejected: '已退回', none: '未审核' }[value] || '未审核') }
function initial(value) { return String(value || '服').trim().slice(0, 1) || '服' }
function formatPrice(value) { return (Math.max(0, Number(value) || 0) / 100).toFixed(0) }

async function load() {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await bridge.admin.providers.list({ status: status.value || undefined, keyword: keyword.value.trim() || undefined, page: 1, pageSize: 100 })
    list.value = result?.list || []
  } catch (error) {
    errorMessage.value = error?.message || '审核队列加载失败'
  } finally {
    loading.value = false
  }
}

async function onRefresh() {
  refreshing.value = true
  await load()
  refreshing.value = false
}

async function changeStatus(value) {
  if (status.value === value) return
  status.value = value
  await load()
}

async function approve(item) {
  try {
    await bridge.admin.providers.review(item._id, 'verified', '资料完整，已通过服务方审核。')
    uni.showToast({ title: '已通过审核', icon: 'success' })
    await load()
  } catch (error) {
    uni.showToast({ title: error?.message || '审核失败，请重试', icon: 'none' })
  }
}

function openReview(item, nextStatus) {
  reviewing.value = item
  reviewStatus.value = nextStatus
  reviewNote.value = nextStatus === 'rejected' ? '请补充服务案例、交付范围和合作信息后重新提交。' : ''
}

function closeReview() {
  if (saving.value) return
  reviewing.value = null
  reviewStatus.value = ''
  reviewNote.value = ''
}

async function submitReview() {
  if (!reviewing.value || saving.value) return
  saving.value = true
  try {
    await bridge.admin.providers.review(reviewing.value._id, reviewStatus.value, reviewNote.value.trim())
    closeReview()
    uni.showToast({ title: '审核状态已更新', icon: 'success' })
    await load()
  } catch (error) {
    uni.showToast({ title: error?.message || '审核失败，请稍后重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; padding: 24rpx 24rpx 80rpx; box-sizing: border-box; background: #F5F7FB; color: #34415F; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20rpx; }.title { display: block; color: #2E3A57; font-size: 38rpx; font-weight: 850; }.subtitle { display: block; margin-top: 7rpx; color: #929DB1; font-size: 20rpx; }.refresh { padding: 10rpx 14rpx; border-radius: 12rpx; color: #6573DC; background: #EEF0FF; font-size: 20rpx; }
.filter-tabs { display: flex; padding: 6rpx; border-radius: 15rpx; background: #EDEFF7; }.filter-tab { flex: 1; padding: 12rpx 3rpx; border-radius: 11rpx; color: #8D99AC; font-size: 20rpx; text-align: center; }.filter-tab.active { color: #5968D8; background: #FFF; box-shadow: 0 4rpx 12rpx rgba(70,87,123,.08); font-weight: 800; }
.search-row { display: flex; align-items: center; margin: 14rpx 0; padding: 5rpx 6rpx 5rpx 16rpx; border: 1rpx solid #E5E9F1; border-radius: 15rpx; background: #FFF; }.search-input { flex: 1; min-width: 0; height: 60rpx; color: #34415F; font-size: 21rpx; }.search-button { padding: 11rpx 16rpx; border-radius: 11rpx; color: #FFF; background: #6573DC; font-size: 20rpx; }
.list-scroll { flex: 1; min-height: 0; height: auto; }.provider-card { margin-bottom: 14rpx; padding: 20rpx; border: 1rpx solid #E6EAF2; border-radius: 19rpx; background: #FFF; box-shadow: 0 7rpx 18rpx rgba(70,87,123,.035); }.card-head { display: flex; align-items: center; }.avatar { display: flex; align-items: center; justify-content: center; flex: 0 0 66rpx; width: 66rpx; height: 66rpx; border-radius: 19rpx; color: #6573DC; background: #EEF0FF; font-size: 27rpx; font-weight: 800; }.provider-copy { flex: 1; min-width: 0; margin-left: 14rpx; }.name-line { display: flex; align-items: center; }.provider-name { max-width: 380rpx; overflow: hidden; color: #34415F; font-size: 26rpx; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }.status { margin-left: 10rpx; padding: 5rpx 9rpx; border-radius: 8rpx; color: #A8702C; background: #FFF4E6; font-size: 17rpx; white-space: nowrap; }.status.verified { color: #2C9577; background: #EAF8F3; }.status.rejected { color: #C26262; background: #FFF0F0; }.provider-meta { display: block; margin-top: 7rpx; overflow: hidden; color: #929DB1; font-size: 19rpx; text-overflow: ellipsis; white-space: nowrap; }
.facts { display: flex; margin-top: 16rpx; padding: 11rpx 12rpx; border-radius: 11rpx; background: #F7F8FC; }.facts text { flex: 1; overflow: hidden; color: #68758A; font-size: 18rpx; text-overflow: ellipsis; white-space: nowrap; }.facts text + text { margin-left: 10rpx; text-align: center; }.facts text:last-child { text-align: right; }.intro { display: block; margin-top: 13rpx; color: #68758A; font-size: 20rpx; line-height: 1.55; }.tags { display: flex; flex-wrap: wrap; gap: 7rpx; margin-top: 11rpx; }.tags text { padding: 5rpx 9rpx; border-radius: 8rpx; color: #6873C9; background: #F0F1FF; font-size: 17rpx; }.previous-note { margin-top: 12rpx; padding: 10rpx 12rpx; border-radius: 10rpx; color: #9A6E38; background: #FFF8EE; font-size: 18rpx; line-height: 1.5; }.card-footer { display: flex; align-items: center; margin-top: 16rpx; padding-top: 13rpx; border-top: 1rpx solid #F0F1F5; }.created { color: #A1ABBC; font-size: 17rpx; }.actions { display: flex; gap: 9rpx; margin-left: auto; }.action { padding: 8rpx 12rpx; border-radius: 9rpx; color: #6573DC; background: #EEF0FF; font-size: 19rpx; }.action.approve { color: #2C9577; background: #EAF8F3; }.action.reject { color: #C26262; background: #FFF0F0; }
.state, .empty { padding: 90rpx 24rpx; color: #929DB1; font-size: 22rpx; text-align: center; }.error-state { color: #C26262; }
.modal-mask { position: fixed; z-index: 20; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; justify-content: center; padding: 24rpx; background: rgba(35,44,68,.38); }.review-dialog { width: 100%; padding: 24rpx; box-sizing: border-box; border-radius: 23rpx; background: #FFF; box-shadow: 0 -12rpx 35rpx rgba(35,44,68,.16); }.dialog-title { display: block; color: #34415F; font-size: 28rpx; font-weight: 800; }.dialog-desc { display: block; margin-top: 7rpx; color: #929DB1; font-size: 19rpx; }.review-input { width: 100%; min-height: 150rpx; margin-top: 18rpx; padding: 15rpx; box-sizing: border-box; border: 1rpx solid #E5E9F1; border-radius: 14rpx; color: #34415F; background: #FAFBFD; font-size: 22rpx; line-height: 1.55; }.dialog-actions { display: flex; justify-content: flex-end; gap: 12rpx; margin-top: 18rpx; }.dialog-cancel, .dialog-confirm { padding: 12rpx 20rpx; border-radius: 11rpx; font-size: 21rpx; }.dialog-cancel { color: #929DB1; background: #F2F4F8; }.dialog-confirm { color: #FFF; background: #6573DC; }

/* 后台列表的操作列固定、内容列可变，窄屏时优先保证卡片不横向溢出。 */
.header > view:first-child,
.filter-tabs,
.filter-tab,
.search-row,
.provider-card,
.card-head,
.provider-copy,
.name-line,
.card-footer,
.facts,
.actions {
  min-width: 0;
}
.header > view:first-child,
.provider-copy {
  flex: 1;
  overflow: hidden;
}
.title,
.subtitle,
.provider-name,
.provider-meta,
.intro,
.previous-note,
.dialog-desc {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.title,
.subtitle,
.provider-name,
.provider-meta {
  overflow: hidden;
  text-overflow: ellipsis;
}
.title,
.provider-name,
.provider-meta {
  white-space: nowrap;
}
.refresh,
.status,
.action,
.search-button,
.dialog-cancel,
.dialog-confirm {
  flex: 0 0 auto;
  white-space: nowrap;
}
.name-line {
  flex-wrap: wrap;
  gap: 6rpx;
}
.provider-name {
  flex: 1 1 160rpx;
  min-width: 0;
}
.status { margin-left: 0; }
.facts { width: 100%; max-width: 100%; }
.facts text { min-width: 0; }
.intro,
.previous-note { overflow: hidden; }
.card-footer {
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10rpx;
}
.created {
  min-width: 0;
  flex: 1 1 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.actions {
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-left: auto;
}
.modal-mask,
.review-dialog {
  max-width: 100%;
  box-sizing: border-box;
}
.review-dialog {
  max-height: 84vh;
  overflow-y: auto;
}

@media (max-width: 360px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .filter-tab { font-size: 18rpx; }
  .provider-card { padding-right: 16rpx; padding-left: 16rpx; }
  .facts { padding-right: 8rpx; padding-left: 8rpx; }
  .facts text + text { margin-left: 5rpx; }
  .action { padding-right: 9rpx; padding-left: 9rpx; }
}
</style>
