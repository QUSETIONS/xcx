<template>
  <view class="page">
    <view class="header"><text class="header-title">对接进展</text></view>

    <view class="lead-tabs">
      <view class="lead-tab" :class="{ active: activeMode === 'inbox' }" @tap="setMode('inbox')">
        <text>收到的对接</text><text v-if="inboxPending" class="tab-count">{{ inboxPending }}</text>
      </view>
      <view class="lead-tab" :class="{ active: activeMode === 'outgoing' }" @tap="setMode('outgoing')"><text>我发起的</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !list.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view class="lead-list" :class="{ 'animate-in': animated }">
        <view class="lead-item card-press" v-for="(item, idx) in list" :key="item._id" @tap="goDemand(item.demand_id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="lead-top">
            <view class="lead-heading"><text class="lead-contact">{{ item.contact_name || '未填写联系人' }}</text><text class="lead-demand">{{ item.demand_title }}</text></view>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <text class="lead-phone">{{ item.phone }}</text>
          <text class="lead-msg" v-if="item.message">{{ item.message }}</text>
          <view class="lead-bottom"><text class="lead-time">{{ formatDate(item.created_at) }}</text><text v-if="activeMode === 'inbox' && item.status === 'new'" class="lead-action" @tap.stop="markContacted(item)">开始跟进</text></view>
        </view>
      </view>
      <view v-if="loading && list.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="!list.length && !loading" class="empty">
        <image class="empty-icon" src="/static/icons/handshake.svg" mode="aspectFit" />
        <text class="empty-text">{{ t('user.emptyLead') }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { leadStatusMap as statusMap } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { formatDate } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.myLeads')

const animated = ref(true)
const userStore = useUserStore()
const activeMode = ref('inbox')
const inboxPending = ref(0)
const { list, loading, refreshing, load: loadList, refresh } = useList(
  (params) => activeMode.value === 'inbox'
    ? bridge.lead.inbox({ ...params, page: 1, pageSize: 100 })
    : bridge.lead.myLeads({ ...params, page: 1, pageSize: 100 }),
  100
)
function goDemand(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
async function syncInboxPending(result) {
  if (result && typeof result.pending === 'number') {
    inboxPending.value = result.pending
    return
  }
  try {
    const inbox = await bridge.lead.inbox()
    inboxPending.value = Number(inbox?.pending || 0)
  } catch {
    inboxPending.value = 0
  }
}
async function setMode(mode) {
  if (activeMode.value === mode) return
  activeMode.value = mode
  const result = await loadList(true)
  if (mode === 'inbox') await syncInboxPending(result)
}
async function onRefresh() {
  await refresh()
  await syncInboxPending()
}
async function markContacted(item) {
  if (item._updating) return
  item._updating = true
  try {
    const updated = await bridge.lead.updateStatus(item._id, 'contacted')
    item.status = updated?.status || 'contacted'
    inboxPending.value = Math.max(0, inboxPending.value - 1)
    uni.showToast({ title: '已标记为跟进中', icon: 'success' })
  } catch {
    uni.showToast({ title: '更新失败，请稍后再试', icon: 'none' })
  } finally {
    item._updating = false
  }
}
onMounted(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能查看我的项目'))) return
  const result = await loadList(true)
  await syncInboxPending(result)
})
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; background: #F5F6FA; padding-bottom: 120rpx; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.lead-tabs { display: flex; gap: 12rpx; padding: 0 24rpx 18rpx; }
.lead-tab { display: flex; align-items: center; gap: 7rpx; padding: 10rpx 16rpx; border: 1rpx solid #E5E9F1; border-radius: 14rpx; color: #8995A7; background: #FFF; font-size: 23rpx; }
.lead-tab.active { border-color: #D8DDF9; color: #5D6BD2; background: #EEF0FF; font-weight: 700; }
.tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 25rpx; height: 25rpx; padding: 0 6rpx; border-radius: 13rpx; color: #FFF; background: #EE7669; font-size: 16rpx; }

.list-scroll { flex: 1; min-height: 0; height: auto; padding: 0 24rpx; }
.lead-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.lead-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.lead-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.lead-heading { min-width: 0; flex: 1; padding-right: 12rpx; }
.lead-contact { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.lead-demand { display: block; overflow: hidden; margin-top: 5rpx; color: #7E8A9D; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-new { background: rgba(59,130,246,0.1); color: #3B82F6; }
.status-contacted { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-deal { background: rgba(16,185,129,0.1); color: #10B981; }
.status-invalid { background: #F5F6FA; color: rgba(0,0,0,0.45); }

.lead-phone { font-size: 24rpx; color: rgba(0,0,0,0.6); display: block; margin-bottom: 8rpx; }
.lead-msg { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 8rpx; line-height: 1.4; }
.lead-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.lead-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.lead-action { padding: 7rpx 11rpx; border-radius: 9rpx; color: #5D6BD2; background: #EEF0FF; font-size: 19rpx; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { width: 64rpx; height: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); }
.loading { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }

/* 对接进展的联系人、需求标题和操作按钮共享一行时，文字列必须可收缩。 */
.header,
.lead-tabs,
.lead-top,
.lead-heading,
.lead-bottom,
.lead-item { min-width: 0; }
.header,
.lead-tabs { flex: 0 0 auto; }
.lead-heading { overflow: hidden; }
.lead-contact,
.lead-demand,
.lead-phone,
.lead-msg,
.lead-time { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.lead-contact { display: block; white-space: nowrap; }
.lead-msg { overflow-wrap: anywhere; word-break: break-word; }
.status-tag,
.lead-time,
.lead-action { flex: 0 0 auto; white-space: nowrap; }
.lead-bottom { overflow: hidden; }

@media (max-width: 360px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .list-scroll { padding-right: 18rpx; padding-left: 18rpx; }
  .lead-item { padding-right: 16rpx; padding-left: 16rpx; }
}
</style>
