<template>
  <view class="page message-page">
    <view v-if="loadState === 'loading'" class="page-state">
      <text>{{ t('common.loading') }}</text>
    </view>
    <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
      <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
      <text>{{ t('common.loadFailed') }}</text>
      <text class="page-state-action">{{ t('common.retry') }}</text>
    </view>
    <view v-else class="message-content">
    <view class="header">
      <view><text class="header-kicker">ACTION INBOX</text><text class="header-title">{{ t('user.message') }}</text><text class="header-copy">先处理会影响项目推进的事，其余记录留在时间线里。</text></view>
      <view class="header-actions">
        <text class="subscribe-btn" @tap="enableSubscribe" v-if="subscribeTemplateIds.length">开启重要提醒</text>
        <text class="read-all-btn" @tap="readAll" v-if="unreadCount > 0">{{ t('message.readAll') }}</text>
      </view>
    </view>

    <view v-if="actionItems.length" class="action-desk">
      <view class="action-desk-head"><view><text class="reminder-kicker">ACTION REQUIRED</text><text class="reminder-title">{{ actionTitle }}</text></view><text class="reminder-count">{{ actionItems.length }} 项待处理</text></view>
      <view v-for="(item, index) in actionItems.slice(0, 3)" :key="item.key" class="action-row" :class="`action-${item.tone}`" @tap="handleActionItem(item)">
        <view class="action-index-cell"><image class="action-icon" :src="actionIcon(item)" mode="aspectFit" /><text class="action-index">0{{ index + 1 }}</text></view><view class="action-copy"><text>{{ item.title }}</text><text>{{ item.context }}<text v-if="item.meta"> · {{ item.meta }}</text></text></view><text class="action-label">{{ item.action }}</text>
      </view>
    </view>

    <view class="tab-bar">
      <text class="tab-item" :class="{ active: tab === 'all' }" @tap="tab = 'all'">{{ t('common.all') }}<text v-if="unreadCount" class="tab-count">{{ unreadCount }}</text></text>
      <text class="tab-item" :class="{ active: tab === 'system' }" @tap="tab = 'system'">{{ t('message.tabSystem') }}<text v-if="unreadFor('system')" class="tab-count">{{ unreadFor('system') }}</text></text>
      <text class="tab-item" :class="{ active: tab === 'lead' }" @tap="tab = 'lead'">{{ t('message.tabLead') }}<text v-if="unreadFor('lead')" class="tab-count">{{ unreadFor('lead') }}</text></text>
      <text class="tab-item" :class="{ active: tab === 'deal' }" @tap="tab = 'deal'">{{ t('message.tabDeal') }}<text v-if="unreadFor('deal')" class="tab-count">{{ unreadFor('deal') }}</text></text>
      <text class="tab-item" :class="{ active: tab === 'proposal' }" @tap="tab = 'proposal'">项目提案<text v-if="unreadFor('proposal')" class="tab-count">{{ unreadFor('proposal') }}</text></text>
      <text class="tab-item" :class="{ active: tab === 'interact' }" @tap="tab = 'interact'">{{ t('message.tabInteract') }}<text v-if="unreadFor('interact')" class="tab-count">{{ unreadFor('interact') }}</text></text>
    </view>

    <scroll-view class="list-scroll" :class="{ 'with-actions': actionItems.length }" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="timeline-head"><text>ALL RECORDS</text><text>{{ timelineList.length }} 条记录</text></view>
      <view class="msg-list">
        <view class="msg-item card-press" v-for="item in timelineList" :key="item._id"
          :class="{ unread: !item.read }" @tap="readMsg(item)">
          <view class="msg-icon-box" :class="'type-' + item.type">
            <image class="msg-icon" :src="getIcon(item.type)" mode="aspectFit" />
          </view>
          <view class="msg-content">
            <view class="msg-top">
              <text class="msg-title">{{ item.title }}</text>
              <text class="msg-time">{{ item.time }}</text>
            </view>
            <text class="msg-desc">{{ item.desc }}</text>
          </view>
          <view class="msg-dot" v-if="!item.read"></view>
        </view>
      </view>
      <view v-if="!timelineList.length" class="empty">
        <image class="empty-icon" src="/static/icons/chat.svg" mode="aspectFit" />
        <text class="empty-text">{{ actionItems.length ? '待处理事项已置顶，其余记录会在这里沉淀。' : t('message.empty') }}</text>
      </view>
    </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { isAuthError, toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.message')

const tab = ref('all')
const refreshing = ref(false)
const subscribeTemplateIds = ref([])
const userStore = useUserStore()

const messages = ref([])
const unreadCount = ref(0)
const agendaItems = ref([])
const agendaMeetings = ref([])
const agendaSummary = ref({ total: 0, overdue: 0, today: 0, tomorrow: 0, upcoming: 0, unscheduled: 0 })
let realtimeActive = false
let realtimeRequestActive = false
let realtimeTimer = null
let realtimeGeneration = 0
let notifyCursor = ''
let reloadInFlight = false
let lastReloadAt = 0
const unreadByType = computed(() => messages.value.reduce((result, item) => {
  if (!item.read) result[item.type] = (result[item.type] || 0) + 1
  return result
}, {}))

async function fetchMessages() {
  const [messageResult, agendaResult] = await Promise.all([
    bridge.notify.list(),
    bridge.deal.agenda().catch(() => ({ list: [], meetings: [], summary: {} }))
  ])
  return {
    messages: messageResult?.list || [],
    unreadCount: Number(messageResult?.unread) || 0,
    agenda: agendaResult || { list: [], meetings: [], summary: {} },
    cursor: messageResult?.cursor || ''
  }
}

const { state: loadState, run: loadRequest } = useRequest(fetchMessages)
const { run: refreshRequest } = useRequest(fetchMessages)
const { run: readRequest } = useRequest(async (id) => {
  await bridge.notify.read(id)
  return bridge.notify.unreadCount()
})
const { run: readAllRequest } = useRequest(async () => {
  await bridge.notify.readAll()
  return 0
})

async function applyMessages(data) {
  messages.value = data.messages || []
  unreadCount.value = data.unreadCount || 0
  agendaItems.value = data.agenda?.list || []
  agendaMeetings.value = data.agenda?.meetings || []
  agendaSummary.value = { ...agendaSummary.value, ...(data.agenda?.summary || {}) }
  notifyCursor = data.cursor || messages.value[0]?.cursor || messages.value[0]?.created_at || ''
}

async function reload() {
  if (reloadInFlight) return
  reloadInFlight = true
  try {
    if (!(await requirePageLogin(userStore, '登录后才能查看消息'))) return
    await loadSubscribeTemplates()
    await applyMessages(await loadRequest())
    startRealtime()
  } catch (error) {
    if (!isAuthError(error)) toastError(t('common.loadFailed'))
  } finally {
    reloadInFlight = false
    lastReloadAt = Date.now()
  }
}

async function loadSubscribeTemplates() {
  try {
    const config = await bridge.config.public()
    subscribeTemplateIds.value = Object.entries(config?.wechat_subscribe_templates || {})
      .map(([purpose, templateId]) => ({ purpose, template_id: String(templateId || '').trim() }))
      .filter((item) => item.template_id)
  } catch {
    subscribeTemplateIds.value = []
  }
}

function enableSubscribe() {
  if (typeof uni.requestSubscribeMessage !== 'function') {
    uni.showToast({ title: '请在微信小程序中开启提醒', icon: 'none' })
    return
  }
  const templateIds = subscribeTemplateIds.value.map((item) => item.template_id)
  uni.requestSubscribeMessage({
    tmplIds: templateIds,
    success: async (result = {}) => {
      const subscriptions = subscribeTemplateIds.value.map((item) => ({
        ...item,
        status: result[item.template_id] || 'reject'
      }))
      try {
        const saved = await bridge.notify.subscriptions(subscriptions)
        uni.showToast({ title: saved?.saved ? '提醒已开启' : '没有新增提醒', icon: 'none' })
      } catch (error) {
        uni.showToast({ title: error?.message || '提醒设置失败', icon: 'none' })
      }
    },
    fail: () => uni.showToast({ title: '未完成提醒授权', icon: 'none' })
  })
}

onShow(() => {
  if (Date.now() - lastReloadAt < 5000) return
  void reload()
})
onHide(stopRealtime)
onUnload(stopRealtime)

function stopRealtime() {
  realtimeActive = false
  realtimeRequestActive = false
  realtimeGeneration += 1
  if (realtimeTimer) clearTimeout(realtimeTimer)
  realtimeTimer = null
}

function startRealtime() {
  stopRealtime()
  realtimeActive = true
  const generation = realtimeGeneration
  pollRealtime(generation)
}

async function pollRealtime(generation = realtimeGeneration) {
  if (!realtimeActive || generation !== realtimeGeneration || realtimeRequestActive) return
  realtimeRequestActive = true
  let nextDelay = 600
  try {
    const result = await bridge.notify.poll(notifyCursor, 20)
    if (!realtimeActive || generation !== realtimeGeneration) return
    const incoming = Array.isArray(result?.list) ? result.list : []
    if (incoming.length) {
      const known = new Set(messages.value.map((item) => item._id || item.id))
      messages.value = [...incoming.filter((item) => !known.has(item._id || item.id)), ...messages.value]
        .sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')))
      notifyCursor = result.cursor || incoming[incoming.length - 1]?.cursor || incoming[incoming.length - 1]?.created_at || notifyCursor
      nextDelay = 100
    } else if (result?.cursor) {
      notifyCursor = result.cursor
    }
    if (result?.unread !== undefined) unreadCount.value = Number(result.unread) || 0
  } catch {
    // 页面主列表仍可用；实时通道短暂失败时稍后自动重连。
    nextDelay = 3000
  } finally {
    if (generation !== realtimeGeneration) return
    realtimeRequestActive = false
    if (realtimeActive) realtimeTimer = setTimeout(() => pollRealtime(generation), nextDelay)
  }
}

const filteredList = computed(() => {
  if (tab.value === 'all') return messages.value
  return messages.value.filter(m => m.type === tab.value)
})

const reminderItems = computed(() => {
  const tasks = agendaItems.value
    .filter((item) => ['overdue', 'today', 'tomorrow'].includes(item.reminder))
    .map((item) => ({
      key: `task-${item._id}`,
      kind: 'task',
      dealId: item.deal_id,
      title: item.title || '项目待办',
      project: item.demand_title || '合作项目',
      tone: item.reminder === 'overdue' ? 'urgent' : item.reminder === 'today' ? 'today' : 'soon',
      meta: item.reminder === 'overdue' ? '已逾期' : item.reminder === 'today' ? '今天截止' : '明天截止'
    }))
  const now = Date.now()
  const meetings = agendaMeetings.value
    .filter((item) => item.status === 'scheduled')
    .map((item) => {
      const startsAt = new Date(item.starts_at).getTime()
      const minutes = Number.isFinite(startsAt) ? Math.round((startsAt - now) / 60000) : Number.POSITIVE_INFINITY
      return {
        key: `meeting-${item._id}`,
        kind: 'meeting',
        dealId: item.deal_id,
        title: item.title || '项目会议',
        project: item.demand_title || '合作项目',
        tone: minutes <= 60 ? 'urgent' : 'today',
        meta: minutes <= 60 ? '一小时内开始' : (item.starts_at || '').replace('T', ' ').slice(5, 16) || '待确认时间',
        timestamp: startsAt
      }
    })
    .filter((item) => Number.isFinite(item.timestamp) && item.timestamp >= now && item.timestamp <= now + 24 * 60 * 60 * 1000)
  return [...tasks, ...meetings].sort((left, right) => {
    const rank = { urgent: 0, today: 1, soon: 2 }
    return (rank[left.tone] || 3) - (rank[right.tone] || 3)
  })
})

const reminderTitle = computed(() => {
  if (agendaSummary.value.overdue) return `有 ${agendaSummary.value.overdue} 项需要尽快处理`
  if (agendaSummary.value.today) return `今天有 ${agendaSummary.value.today} 项待推进`
  return '接下来 24 小时的协作安排'
})

function notificationLinkType(item) {
  return String(item?.link_type || item?.linkType || '').trim()
}

function isActionableMessage(item) {
  const linkType = notificationLinkType(item)
  return ['lead', 'deal', 'deal_task', 'deal_meeting', 'proposal', 'referral', 'friends', 'demand', 'order'].includes(linkType)
    || ['lead', 'deal', 'proposal'].includes(item?.type)
}

function messageActionTone(item) {
  const linkType = notificationLinkType(item)
  if (['proposal', 'lead', 'referral', 'friends'].includes(linkType) || item?.type === 'proposal') return 'urgent'
  if (['deal', 'deal_task', 'deal_meeting'].includes(linkType) || item?.type === 'deal') return 'today'
  return 'soon'
}

function messageActionLabel(item) {
  const linkType = notificationLinkType(item)
  if (linkType === 'proposal' || item?.type === 'proposal') return '处理提案'
  if (linkType === 'referral' || linkType === 'friends') return '查看申请'
  if (linkType === 'lead' || item?.type === 'lead') return '查看对接'
  if (linkType === 'deal_task') return '处理待办'
  if (linkType === 'deal_meeting') return '查看日程'
  if (linkType === 'deal' || item?.type === 'deal') return '进入项目'
  if (linkType === 'demand') return '查看需求'
  if (linkType === 'order') return '查看订单'
  return '查看详情'
}

function notificationContext(linkType) {
  const context = {
    proposal: '有新的方案或报价等待确认',
    referral: '有人请求通过你建立引荐关系',
    friends: '有新的合作关系申请',
    lead: '有新的项目对接进展',
    deal_task: '项目中有待完成的协作事项',
    deal_meeting: '项目会议需要查看或确认',
    deal: '项目协作室有新的动态',
    demand: '需求状态发生了变化',
    order: '订单状态发生了变化'
  }
  return context[linkType] || '有新的合作动态等待查看'
}

function actionRank(item) {
  const toneRank = { urgent: 0, today: 1, soon: 2 }
  const sourceRank = item.source === 'agenda' ? 0 : 1
  return (toneRank[item.tone] ?? 3) * 10 + sourceRank
}

const actionableMessages = computed(() => messages.value
  .filter((item) => !item.read && isActionableMessage(item))
  .filter((item) => !['deal_task', 'deal_meeting'].includes(notificationLinkType(item)))
  .map((item) => {
    const linkType = notificationLinkType(item)
    return {
      key: `message-${item._id || item.id}`,
      source: 'message',
      message: item,
      tone: messageActionTone(item),
      title: item.title || '一条待处理通知',
      context: item.desc || notificationContext(linkType),
      meta: item.time || '',
      action: messageActionLabel(item)
    }
  }))

const actionItems = computed(() => [
  ...reminderItems.value.map((item) => ({
    ...item,
    source: 'agenda',
    context: item.project || '合作项目',
    action: item.kind === 'meeting' ? '查看日程' : '去处理'
  })),
  ...actionableMessages.value
].sort((left, right) => actionRank(left) - actionRank(right)))

const actionTitle = computed(() => {
  if (actionItems.value.some((item) => item.tone === 'urgent')) return '先处理这些紧急事项'
  if (actionItems.value.some((item) => item.source === 'message')) return '有新的协作申请与项目回应'
  return reminderTitle.value
})

const actionMessageIds = computed(() => new Set(actionableMessages.value
  .map((item) => String(item.message?._id || item.message?.id || ''))))

const timelineList = computed(() => filteredList.value
  .filter((item) => !actionMessageIds.value.has(String(item._id || item.id || ''))))

function getIcon(type) {
  const map = { system: '/static/icons/bell.svg', lead: '/static/icons/handshake.svg', deal: '/static/icons/shield.svg', interact: '/static/icons/chat.svg', proposal: '/static/icons/file.svg' }
  return map[type] || '/static/icons/chat.svg'
}

function actionIcon(item) {
  if (item?.kind === 'meeting') return '/static/icons/ticket.svg'
  if (item?.kind === 'task') return '/static/icons/tab/list.svg'
  return getIcon(item?.message?.type)
}

async function readMsg(item) {
  if (!item.read) {
    try {
      unreadCount.value = await readRequest(item._id)
      item.read = true
    } catch (error) {
      if (!isAuthError(error)) toastError(t('common.loadFailed'))
      return
    }
  }

  openMessageTarget(item)
}

function unreadFor(type) { return unreadByType.value[type] || 0 }

function openAgendaItem(item) {
  if (!item?.dealId) return
  const tab = item.kind === 'meeting' ? 'schedule' : 'tasks'
  uni.navigateTo({ url: `/pages/deals/workspace?id=${encodeURIComponent(item.dealId)}&tab=${tab}` })
}

function handleActionItem(item) {
  if (item?.source === 'agenda') return openAgendaItem(item)
  if (item?.message) return readMsg(item.message)
}

function openWorkspaceTarget(value, tab = 'overview') {
  const dealId = String(value || '').split('::')[0]
  if (!dealId) return uni.navigateTo({ url: '/pages/deals/index' })
  return uni.navigateTo({ url: `/pages/deals/workspace?id=${encodeURIComponent(dealId)}&tab=${tab}` })
}

function openMessageTarget(item) {
  const linkType = item.link_type || item.linkType || ''
  const linkId = item.link_id || item.linkId || ''
  if (linkType === 'friends') return uni.navigateTo({ url: '/pages/network/friends' })
  if (linkType === 'referral') return uni.navigateTo({ url: '/pages/network/friends' })
  if (linkType === 'proposal') return uni.navigateTo({ url: '/pages/proposal/inbox' })
  if (linkType === 'appeal') {
    const [targetType, targetId] = String(linkId).split('::')
    const query = targetType && targetId
      ? `?target_type=${encodeURIComponent(targetType)}&target_id=${encodeURIComponent(targetId)}`
      : ''
    return uni.navigateTo({ url: `/pages/governance/index${query}` })
  }
  if (linkType === 'chat' && linkId) return uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(linkId)}` })
  if (linkType === 'deal_task' && linkId) return openWorkspaceTarget(linkId, 'tasks')
  if (linkType === 'deal_meeting' && linkId) return openWorkspaceTarget(linkId, 'schedule')
  if (linkType === 'deal' && linkId) return openWorkspaceTarget(linkId)
  if (linkType === 'group' && linkId) return uni.navigateTo({ url: `/pages/network/detail?id=${encodeURIComponent(linkId)}` })
  if ((linkType === 'post' || linkType === 'network_post') && linkId) return uni.navigateTo({ url: `/pages/community/detail?id=${encodeURIComponent(linkId)}` })
  if (linkType === 'demand' && linkId) return uni.navigateTo({ url: `/pages/demand/detail?id=${encodeURIComponent(linkId)}` })
  if (linkType === 'resource' && linkId) return uni.navigateTo({ url: `/pages/resource/detail?id=${encodeURIComponent(linkId)}` })
  if (linkType === 'product' && linkId) return uni.navigateTo({ url: `/pages/mall/detail?id=${encodeURIComponent(linkId)}` })
  if (linkType === 'order' && linkId) return uni.navigateTo({ url: `/pages/order/index?id=${encodeURIComponent(linkId)}` })
  if (linkType === 'lead' && linkId) return uni.navigateTo({ url: '/pages/deals/index' })

  // 兼容旧通知：旧数据没有 link_type，保留原来的可用跳转。
  if (item.type === 'lead' && linkId) return uni.navigateTo({ url: '/pages/deals/index' })
  if (item.type === 'deal' && linkId) return openWorkspaceTarget(linkId)
  if (item.type === 'interact' && linkId) return uni.navigateTo({ url: `/pages/network/detail?id=${encodeURIComponent(linkId)}` })
}

async function readAll() {
  try {
    await readAllRequest()
    messages.value.forEach(m => { m.read = true })
    unreadCount.value = 0
    uni.showToast({ title: t('message.allRead'), icon: 'success' })
  } catch (error) {
    if (!isAuthError(error)) toastError(t('common.loadFailed'))
  }
}

async function onRefresh() {
  refreshing.value = true
  try {
    await applyMessages(await refreshRequest())
  } catch (error) {
    if (!isAuthError(error)) toastError(t('common.loadFailed'))
  } finally {
    refreshing.value = false
  }
}
</script>

<style scoped>
.page { display: flex; width: 100%; height: 100vh; min-height: 0; flex-direction: column; overflow-x: hidden; padding-bottom: 40rpx; color: #332F29; background: #F4F1EA; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.message-content { display: flex; min-height: 0; flex: 1; flex-direction: column; }
.page-state { min-height: 0; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: #817A70; }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #8E4C42; }
.page-state-action { font-size: 24rpx; color: #817A70; }
.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20rpx; padding: 30rpx 26rpx 23rpx; }
.header-kicker,.reminder-kicker { display: block; color: #8A8177; font: 600 16rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }
.header-title { display: block; margin-top: 8rpx; color: #302B26; font-family: Georgia, 'Times New Roman', serif; font-size: 43rpx; font-weight: 500; }
.header-copy { display: block; margin-top: 8rpx; color: #817A70; font-size: 20rpx; line-height: 1.55; }
.header-actions { display: flex; align-items: center; gap: 18rpx; }
.subscribe-btn { padding: 7rpx 10rpx; border: 1rpx solid #D9D0C5; color: #69574A; font-size: 19rpx; white-space: nowrap; }
.read-all-btn { padding-top: 7rpx; color: #5C2828; font-size: 20rpx; white-space: nowrap; }

.action-desk { margin: 0 24rpx 21rpx; border-top: 1rpx solid #B8A989; border-bottom: 1rpx solid #DAD2C6; }
.action-desk-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; padding: 18rpx 0 10rpx; }.reminder-title { display: block; margin-top: 7rpx; color: #3C342C; font-size: 25rpx; font-weight: 600; }.reminder-count { padding-top: 8rpx; color: #715B45; font: 500 21rpx/1 Georgia, 'Times New Roman', serif; white-space: nowrap; }
.action-row { display: grid; grid-template-columns: 34rpx minmax(0, 1fr) auto; align-items: center; column-gap: 12rpx; padding: 15rpx 0; border-top: 1rpx solid rgba(45,39,31,.09); }.action-index { color: #A89A89; font: 500 17rpx/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .05em; }.action-copy { display: flex; min-width: 0; flex-direction: column; gap: 4rpx; }.action-copy text:first-child { overflow: hidden; color: #443B32; font-size: 22rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.action-copy text:last-child { overflow: hidden; color: #817A70; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }.action-label { padding-left: 10rpx; color: #69574A; font-size: 18rpx; white-space: nowrap; }.action-urgent .action-label { color: #8E4C42; }.action-today .action-index { color: #69574A; }

.tab-bar { display: flex; overflow-x: auto; padding: 0 24rpx 16rpx; white-space: nowrap; }.tab-item { display: inline-flex; align-items: center; flex: 0 0 auto; padding: 10rpx 15rpx; border-bottom: 1rpx solid transparent; color: #827A70; font-size: 22rpx; }.tab-item.active { border-bottom-color: #5C2828; color: #5C2828; font-weight: 600; }.tab-count { display: inline-block; min-width: 22rpx; margin-left: 5rpx; padding: 1rpx 5rpx; border-radius: 9rpx; color: #FCFBF8; background: #69574A; font-size: 15rpx; line-height: 1.25; text-align: center; vertical-align: middle; }

.list-scroll { flex: 1; min-height: 0; height: auto; padding: 0 24rpx; }.list-scroll.with-actions { min-height: 0; height: auto; }
.timeline-head { display: flex; align-items: center; justify-content: space-between; padding: 6rpx 0 13rpx; border-bottom: 1rpx solid rgba(42,37,31,.12); color: #8A8177; font: 600 16rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }.timeline-head text:last-child { color: #9B9286; font-size: 17rpx; font-weight: 500; letter-spacing: 0; }
.msg-list { display: flex; flex-direction: column; }
.msg-item { display: flex; align-items: flex-start; margin-bottom: 10rpx; padding: 20rpx 14rpx; border-top: 1rpx solid rgba(42,37,31,.11); background: #FCFBF8; }.msg-item.unread { padding-left: 18rpx; border-top-color: #B8A989; background: #F9F5ED; }

.msg-icon-box { display: flex; width: 54rpx; height: 54rpx; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 15rpx; background: #EEE8DE; }.type-system { background: #EEE9E2; }.type-lead { background: #F1E8DD; }.type-deal { background: #E7EBE2; }.type-interact { background: #ECE8E0; }
.msg-icon { display: inline-flex; align-items: center; justify-content: center; width: 32rpx; height: 32rpx; font-size: 25rpx; line-height: 1; text-align: center; }

.msg-content { flex: 1; }
.msg-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.msg-title { color: #3E372F; font-size: 25rpx; font-weight: 600; }.msg-time { flex: 0 0 auto; margin-left: 12rpx; color: #958C80; font-size: 18rpx; }.msg-desc { color: #71695F; font-size: 20rpx; line-height: 1.55; }.msg-dot { width: 8rpx; height: 8rpx; flex-shrink: 0; margin-top: 8rpx; margin-left: 8rpx; border-radius: 50%; background: #8E4C42; }

.empty { text-align: center; padding: 80rpx; }
.empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; margin-bottom: 16rpx; font-size: 40rpx; line-height: 1; }
.empty-text { color: #948B80; font-size: 24rpx; }

/* 统一消息页的收缩规则，避免窄屏时文字和图标挤出容器。 */
.header > view:first-child,
.header-actions,
.action-copy,
.msg-content,
.msg-top { min-width: 0; }
.header > view:first-child { flex: 1; overflow: hidden; }
.header-actions { flex: 0 0 auto; }
.action-desk-head > view { min-width: 0; }
.msg-content { overflow: hidden; }
.msg-title,
.msg-desc { overflow: hidden; text-overflow: ellipsis; }
.msg-title { min-width: 0; flex: 1; white-space: nowrap; }
.msg-desc { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.msg-icon-box { overflow: hidden; box-sizing: border-box; }
.msg-icon { display: block; max-width: 100%; max-height: 100%; object-fit: contain; }
.page image { max-width: 100%; box-sizing: border-box; }
.list-scroll { flex: 1; min-height: 0; height: auto; }
.list-scroll.with-actions { min-height: 0; height: auto; }
</style>
