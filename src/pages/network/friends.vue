<template>
  <view class="page friends-page" :style="a11yStyle">
    <view class="topbar">
      <view>
        <text class="eyebrow">我的人脉</text>
        <text class="title">关系管理</text>
        <text class="subtitle">把认识的人，变成可以继续合作的人</text>
      </view>
      <view class="discover" @tap="goDiscover"><image src="/static/icons/search.svg" mode="aspectFit" /><text>找人</text></view>
    </view>

    <view class="summary-card">
      <view class="summary-metric" @tap="activeTab = 'friends'"><text class="summary-label">当前好友</text><text class="summary-number">{{ friends.length }}</text></view>
      <view class="summary-divider" />
      <view class="summary-metric" @tap="activeTab = 'incoming'"><text class="summary-label">待处理申请</text><text class="summary-number accent">{{ incoming.length }}</text></view>
      <view class="summary-divider" />
      <view class="summary-metric" @tap="goMessage"><text class="summary-label">未读消息</text><text class="summary-number" :class="{ accent: unreadTotal > 0 }">{{ unreadTotal }}</text></view>
    </view>

    <view class="tabs">
      <view v-for="item in tabs" :key="item.key" class="tab" :class="{ active: activeTab === item.key }" @tap="activeTab = item.key">
        <text>{{ item.label }}</text><text v-if="item.count" class="count">{{ item.count }}</text>
      </view>
    </view>

    <view v-if="activeTab === 'friends' && recentConversations.length" class="recent-card">
      <view class="recent-heading">
          <view><text class="recent-eyebrow">最近联系</text><text class="recent-title">继续聊上次的话题</text></view>
        <text class="recent-link" @tap="activeTab = 'friends'">全部好友 →</text>
      </view>
      <scroll-view class="recent-scroll" scroll-x show-scrollbar="false">
        <view class="recent-row">
            <view v-for="conversation in recentConversations" :key="conversation.id || conversation._id" class="recent-item" @tap="openConversation(conversation)">
            <view class="recent-avatar" :style="{ background: avatarColor(conversation.peer) }"><image v-if="avatarUrl(conversation.peer)" class="avatar-image" :src="avatarUrl(conversation.peer)" mode="aspectFill" /><text v-else>{{ initial(conversation.peer) }}</text><view v-if="conversationUnread(conversation)" class="unread-dot" /></view>
            <view class="recent-copy"><text class="recent-name">{{ conversation.peer?.nickname || '好友' }}</text><text class="recent-message">{{ lastMessage(conversation) }}</text></view>
            <text class="recent-time">{{ formatTime(conversation.last_message?.created_at || conversation.last_message_at) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="loading" class="state"><view class="loading-dot" /><text>正在加载联系人…</text></view>
    <view v-else-if="!currentList.length" class="empty">
      <view class="empty-icon"><image src="/static/icons/users.svg" mode="aspectFit" /></view>
      <text class="empty-title">{{ emptyTitle }}</text>
      <text class="empty-desc">{{ emptyDesc }}</text>
      <view class="empty-action" @tap="goDiscover"><text>去找人</text><text>→</text></view>
    </view>

    <view v-else-if="activeTab === 'referrals'" class="list">
        <view v-for="item in referralIncoming" :key="item.id || item._id" class="person-card referral-request-card">
        <view class="avatar referral-avatar" :style="{ background: avatarColor(item.requester) }"><image v-if="avatarUrl(item.requester)" class="avatar-image" :src="avatarUrl(item.requester)" mode="aspectFill" /><text v-else>{{ initial(item.requester) }}</text></view>
        <view class="person-copy" @tap="openProfile(item.requester)">
          <view class="name-line"><text class="name">{{ item.requester?.nickname || '平台成员' }}</text><text class="online">希望认识 {{ item.target?.nickname || '一位伙伴' }}</text></view>
          <text class="meta">{{ item.requester?.company || item.requester?.title || '媒合智联成员' }}</text>
          <text class="request-message">“{{ item.context || '想请你协助做一次资源引荐。' }}”</text>
        </view>
        <view class="request-actions">
          <view class="card-action muted" @tap="updateReferral(item, 'declined')"><text>暂不介绍</text></view>
          <view class="card-action primary" @tap="updateReferral(item, 'introduced')"><text>帮忙介绍</text></view>
        </view>
      </view>
    </view>

    <view v-else class="list">
      <view v-for="item in currentList" :key="item.id || item._id" class="person-card">
        <view class="avatar" :style="{ background: avatarColor(item.user || item) }"><image v-if="avatarUrl(item.user || item)" class="avatar-image" :src="avatarUrl(item.user || item)" mode="aspectFill" /><text v-else>{{ initial(item.user || item) }}</text></view>
        <view class="person-copy" @tap="openProfile(item.user || item)">
          <view class="name-line"><text class="name">{{ (item.user || item).nickname || '未命名用户' }}</text><text v-if="activeTab === 'friends'" class="online">已是好友</text></view>
          <text class="meta">{{ (item.user || item).company || '媒合智联成员' }}<text v-if="(item.user || item).city"> · {{ (item.user || item).city }}</text></text>
          <text v-if="activeTab !== 'friends' && item.message" class="request-message">“{{ item.message }}”</text>
        </view>
        <view v-if="activeTab === 'friends'" class="card-action primary" @tap="openChat(item)"><image src="/static/icons/chat.svg" mode="aspectFit" /><text>私聊</text></view>
        <view v-else-if="activeTab === 'incoming'" class="request-actions">
          <view class="card-action muted" @tap="updateRequest(item, 'rejected')"><text>忽略</text></view>
          <view class="card-action primary" @tap="updateRequest(item, 'accepted')"><text>通过</text></view>
        </view>
        <view v-else class="pending-label"><text>等待回应</text><text class="cancel" @tap="updateRequest(item, 'cancelled')">撤回</text></view>
      </view>
    </view>

    <view class="bottom-note"><image src="/static/icons/shield.svg" mode="aspectFit" /><text>双方确认后才能私聊，你可以随时管理申请。</text></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { isAuthError, toastError } from '@/utils/feedback'
import { formatRelativeTime as formatTime } from '@/utils/util'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'

const activeTab = ref('friends')
const loading = ref(false)
const friends = ref([])
const incoming = ref([])
const outgoing = ref([])
const referralIncoming = ref([])
const conversations = ref([])
const userStore = useUserStore()

const tabs = computed(() => [
  { key: 'friends', label: '我的好友', count: friends.value.length },
  { key: 'incoming', label: '收到申请', count: incoming.value.length },
  { key: 'outgoing', label: '发出申请', count: outgoing.value.length },
  { key: 'referrals', label: '待办引荐', count: referralIncoming.value.length }
])
const currentList = computed(() => ({ friends: friends.value, incoming: incoming.value, outgoing: outgoing.value, referrals: referralIncoming.value }[activeTab.value] || []))
const emptyTitle = computed(() => ({ friends: '还没有建立好友关系', incoming: '暂时没有新的申请', outgoing: '你还没有发出申请', referrals: '暂时没有需要处理的引荐' }[activeTab.value]))
const emptyDesc = computed(() => ({ friends: '去认识新朋友，看看有没有可以一起做事的人。', incoming: '有人向你发起申请时，会在这里出现。', outgoing: '遇到合适的人，先发一句说明来意的话。', referrals: '当有人请你介绍合作伙伴时，会在这里说明项目背景。' }[activeTab.value]))
const recentConversations = computed(() => conversations.value.filter((item) => item?.peer).slice(0, 4))
const unreadTotal = computed(() => conversations.value.reduce((total, item) => total + conversationUnread(item), 0))

async function reload() {
  if (!(await requirePageLogin(userStore, '登录后才能查看好友关系'))) return
  loading.value = true
  try {
    const [friendResult, requestResult, conversationResult, referralResult] = await Promise.all([
      bridge.network.friends(),
      bridge.network.friendRequests({ status: 'pending' }),
      bridge.network.conversations(),
      bridge.network.referrals({ direction: 'incoming', status: 'pending' })
    ])
    friends.value = friendResult?.list || []
    const requests = requestResult?.list || []
    incoming.value = requests.filter((item) => item.direction === 'incoming')
    outgoing.value = requests.filter((item) => item.direction === 'outgoing')
    conversations.value = Array.isArray(conversationResult?.list) ? conversationResult.list : []
    referralIncoming.value = Array.isArray(referralResult?.list) ? referralResult.list : []
  } catch (error) {
    console.warn('[network/friends] load failed:', error)
    if (!isAuthError(error)) toastError('关系列表加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function updateRequest(item, status) {
  try {
    await bridge.network.updateFriendRequest(item.id || item._id, status)
    uni.showToast({ title: status === 'accepted' ? '已成为好友' : status === 'rejected' ? '已忽略申请' : '已撤回申请', icon: 'none' })
    reload()
  } catch {
    toastError('操作失败，请稍后重试')
  }
}

async function updateReferral(item, status) {
  try {
    await bridge.network.updateReferral(item.id || item._id, { status, connector_note: '' })
    uni.showToast({ title: status === 'introduced' ? '已建立引荐，双方可以直接沟通' : '已告知申请人', icon: 'none' })
    reload()
  } catch (error) {
    toastError(error?.message || '引荐处理失败，请稍后重试')
  }
}

function openChat(item) {
  const person = item.peer || item.user || item
  uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(person.id)}&name=${encodeURIComponent(person.nickname || '')}` })
}
function openConversation(item) { openChat(item) }
function openProfile(item) {
  if (item?.id) uni.navigateTo({ url: `/pages/profile/index?id=${item.id}` })
}
function goDiscover() { uni.navigateTo({ url: '/pages/network/discover' }) }
function goMessage() { uni.navigateTo({ url: '/pages/message/index' }) }
function initial(item) { return String(item?.nickname || '人').slice(0, 1) }
function conversationUnread(item) { return Number(item?.unread_count || item?.unreadCount || 0) }
function lastMessage(item) { return item?.last_message?.content || '还没有消息，打个招呼吧' }
function avatarUrl(item) { return String(item?.avatar || item?.avatar_url || '').trim() }
function avatarColor(item) {
  const colors = ['#68725d', '#8b625a', '#a28b64', '#687278']
  return colors[String(item?.id || '').length % colors.length]
}

onShow(reload)
</script>

<style scoped lang="scss">
.page { min-height: 100vh; padding: 28rpx 24rpx 90rpx; color: #27334f; background: #f5f7fb; box-sizing: border-box; }
.topbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 22rpx; }
.eyebrow { display: block; color: #a0aabd; font: 700 17rpx/1.2 monospace; letter-spacing: .08em; }
.title { display: block; margin-top: 8rpx; color: #303b57; font-size: 42rpx; font-weight: 760; letter-spacing: -.05em; }
.subtitle { display: block; margin-top: 8rpx; color: #8f9bb0; font-size: 21rpx; }
.discover { display: flex; align-items: center; gap: 8rpx; padding: 13rpx 17rpx; border: 1rpx solid #e4e8f0; border-radius: 18rpx; color: #6370d6; background: #fff; font-size: 21rpx; }.discover image { width: 25rpx; height: 25rpx; }
.summary-card { position: relative; display: flex; align-items: center; overflow: hidden; padding: 24rpx 16rpx; border-radius: 24rpx; color: #fff; background: linear-gradient(135deg,#282f5a,#636fd5); box-shadow: 0 16rpx 28rpx rgba(72,84,172,.17); }.summary-card::after { position: absolute; right: -80rpx; bottom: -120rpx; width: 250rpx; height: 250rpx; border: 1rpx solid rgba(255,255,255,.16); border-radius: 50%; content: ''; box-shadow: 0 0 0 28rpx rgba(255,255,255,.05); }.summary-metric { position: relative; z-index: 1; display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: center; }.summary-label,.summary-number { display: block; }.summary-label { color: rgba(255,255,255,.62); font-size: 19rpx; }.summary-number { margin-top: 7rpx; font-size: 40rpx; font-weight: 760; }.summary-number.accent { color: #ffd59a; }.summary-divider { position: relative; z-index: 1; width: 1rpx; height: 55rpx; background: rgba(255,255,255,.22); }
.tabs { display: flex; gap: 8rpx; margin: 20rpx 0 14rpx; padding: 6rpx; overflow-x: auto; border: 1rpx solid #e7ebf3; border-radius: 19rpx; background: #fff; white-space: nowrap; }.tab { display: flex; align-items: center; justify-content: center; min-width: 128rpx; flex: 1; gap: 6rpx; padding: 14rpx 7rpx; border-radius: 14rpx; color: #919db0; font-size: 21rpx; }.tab.active { color: #5968d8; background: #eef0ff; font-weight: 700; }.count { display: inline-flex; align-items: center; justify-content: center; min-width: 28rpx; height: 28rpx; padding: 0 5rpx; border-radius: 14rpx; color: #fff; background: #f0a077; font-size: 16rpx; }
.recent-card { margin-bottom: 14rpx; padding: 19rpx; border: 1rpx solid #e8ebf2; border-radius: 21rpx; background: #fff; }.recent-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 12rpx; }.recent-eyebrow { display: block; color: #a0aabd; font: 700 16rpx/1.2 monospace; letter-spacing: .08em; }.recent-title { display: block; margin-top: 6rpx; color: #4c5872; font-size: 25rpx; font-weight: 750; }.recent-link { color: #6573dc; font-size: 18rpx; }.recent-scroll { margin: 15rpx -19rpx -4rpx; padding: 0 19rpx; white-space: nowrap; }.recent-row { display: inline-flex; gap: 10rpx; }.recent-item { position: relative; display: flex; align-items: center; width: 300rpx; min-height: 78rpx; gap: 11rpx; padding: 12rpx; border: 1rpx solid #edf0f6; border-radius: 16rpx; background: #fbfcfe; box-sizing: border-box; }.recent-avatar { position: relative; display: flex; align-items: center; justify-content: center; width: 52rpx; height: 52rpx; flex: 0 0 auto; border-radius: 16rpx; color: #fff; }.recent-avatar text { font-size: 23rpx; font-weight: 750; }.unread-dot { position: absolute; top: -3rpx; right: -3rpx; width: 12rpx; height: 12rpx; border: 2rpx solid #fff; border-radius: 50%; background: #f18d74; }.recent-copy { min-width: 0; flex: 1; }.recent-name,.recent-message { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.recent-name { color: #53607a; font-size: 21rpx; font-weight: 700; }.recent-message { margin-top: 5rpx; color: #9aa5b7; font-size: 17rpx; }.recent-time { align-self: flex-start; color: #b0b8c7; font-size: 15rpx; }
.list { display: flex; flex-direction: column; gap: 12rpx; }.person-card { display: flex; align-items: center; gap: 14rpx; padding: 19rpx; border: 1rpx solid #e8ebf2; border-radius: 21rpx; background: #fff; }.avatar { display: flex; align-items: center; justify-content: center; width: 74rpx; height: 74rpx; flex: 0 0 auto; border-radius: 22rpx; color: #fff; }.avatar text { font-size: 30rpx; font-weight: 760; }.person-copy { min-width: 0; flex: 1; }.name-line { display: flex; align-items: center; gap: 8rpx; }.name { overflow: hidden; color: #3a4662; font-size: 27rpx; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }.online { padding: 4rpx 8rpx; border-radius: 7rpx; color: #2f9b82; background: #e8f7f2; font-size: 16rpx; white-space: nowrap; }.meta { display: block; margin-top: 7rpx; overflow: hidden; color: #98a4b7; font-size: 19rpx; text-overflow: ellipsis; white-space: nowrap; }.request-message { display: block; margin-top: 9rpx; overflow: hidden; color: #7c879c; font-size: 18rpx; text-overflow: ellipsis; white-space: nowrap; }.card-action { display: flex; align-items: center; justify-content: center; min-width: 82rpx; padding: 11rpx 13rpx; border-radius: 17rpx; font-size: 19rpx; white-space: nowrap; }.card-action image { width: 22rpx; height: 22rpx; margin-right: 5rpx; }.card-action.primary { color: #fff; background: #6573dc; }.card-action.muted { color: #8590a5; background: #f2f4f8; }.request-actions { display: flex; gap: 8rpx; }.referral-request-card { align-items: flex-start; }.referral-request-card .request-actions { flex-direction: column; }.referral-request-card .card-action { min-width: 104rpx; padding: 9rpx 10rpx; font-size: 17rpx; }.pending-label { display: flex; flex-direction: column; align-items: flex-end; gap: 9rpx; color: #b0b8c7; font-size: 18rpx; white-space: nowrap; }.cancel { color: #6573dc; }
.state { display: flex; align-items: center; justify-content: center; gap: 12rpx; min-height: 300rpx; color: #9ba6b8; font-size: 21rpx; }.loading-dot { width: 22rpx; height: 22rpx; border: 3rpx solid #cfd5ff; border-top-color: #6573dc; border-radius: 50%; animation: spin 1s linear infinite; }.empty { display: flex; flex-direction: column; align-items: center; margin-top: 45rpx; padding: 55rpx 24rpx; border: 1rpx dashed #dfe4ed; border-radius: 24rpx; background: rgba(255,255,255,.65); }.empty-icon { display: flex; align-items: center; justify-content: center; width: 92rpx; height: 92rpx; border-radius: 30rpx; background: #eef0ff; }.empty-icon image { width: 47rpx; height: 47rpx; opacity: .55; }.empty-title { margin-top: 20rpx; color: #56627d; font-size: 27rpx; font-weight: 700; }.empty-desc { margin-top: 9rpx; color: #a0aabd; font-size: 19rpx; }.empty-action { display: flex; gap: 14rpx; margin-top: 25rpx; padding: 13rpx 21rpx; border-radius: 18rpx; color: #6573dc; background: #eef0ff; font-size: 20rpx; }.bottom-note { display: flex; align-items: center; gap: 8rpx; margin-top: 25rpx; color: #a4adbc; font-size: 18rpx; }.bottom-note image { width: 22rpx; height: 22rpx; opacity: .55; }
@keyframes spin { to { transform: rotate(360deg); } }
.discover image { display: block; width: 32rpx; height: 32rpx; object-fit: contain; opacity: .78; }
.card-action image { display: block; width: 24rpx; height: 24rpx; object-fit: contain; }
.empty-icon image { display: block; width: 45rpx; height: 45rpx; object-fit: contain; }
.bottom-note image { display: block; width: 24rpx; height: 24rpx; object-fit: contain; }

/* Quiet Intelligence v2：关系页以关系状态和下一步动作作为主信息。 */
.page { padding: 0 36rpx 100rpx; overflow-x: hidden; color: #191816; background: #f7f6f2; }
.topbar { align-items: flex-end; margin: 0 -36rpx; padding: 30rpx 36rpx 24rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .1); }
.topbar > view:first-child,
.recent-heading,
.person-copy { min-width: 0; }
.name-line { min-width: 0; }
.eyebrow { color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; font-weight: 400; letter-spacing: .13em; }
.title { margin-top: 10rpx; color: #191816; font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-size: 42rpx; font-weight: 400; letter-spacing: -.04em; }
.subtitle { margin-top: 9rpx; color: #8a847b; font-size: 18rpx; line-height: 1.5; }
.discover { gap: 7rpx; min-width: 96rpx; min-height: 60rpx; padding: 10rpx 14rpx; border: 1rpx solid rgba(30, 27, 22, .12); border-radius: 4rpx; color: #5c2828; background: #fcfbf8; box-sizing: border-box; font-size: 20rpx; white-space: nowrap; }
.discover image { width: 27rpx; height: 27rpx; flex: 0 0 27rpx; object-fit: contain; }
.summary-card { margin-top: 34rpx; padding: 20rpx 14rpx; border-radius: 5rpx; background: #5c2828; box-shadow: none; }
.summary-card::after { display: none; }
.summary-label { color: rgba(252, 251, 248, .68); font-size: 17rpx; }
.summary-number { margin-top: 7rpx; font-family: Georgia, serif; font-size: 36rpx; font-weight: 400; }
.summary-number.accent { color: #f0c38d; }
.tabs { gap: 0; margin: 34rpx 0 28rpx; padding: 0; overflow-x: auto; border: 0; border-top: 1rpx solid rgba(30, 27, 22, .1); border-bottom: 1rpx solid rgba(30, 27, 22, .1); border-radius: 0; background: transparent; }
.tab { min-width: 0; padding: 17rpx 10rpx 15rpx; border-radius: 0; color: #8a847b; background: transparent; font-size: 19rpx; }
.tab.active { border-bottom: 3rpx solid #5c2828; color: #5c2828; background: transparent; font-weight: 500; }
.count { min-width: 24rpx; height: 24rpx; border-radius: 3rpx; color: #5c2828; background: #f0e5df; font-size: 14rpx; }
.recent-card { margin-bottom: 26rpx; padding: 20rpx 0 18rpx; border: 0; border-top: 1rpx solid rgba(30, 27, 22, .1); border-bottom: 1rpx solid rgba(30, 27, 22, .1); border-radius: 0; background: transparent; }
.recent-eyebrow { color: #8a847b; font-size: 14rpx; font-weight: 400; letter-spacing: .13em; }
.recent-title { color: #191816; font-family: 'Songti SC', 'STSong', serif; font-size: 28rpx; font-weight: 400; }
.recent-link { color: #5c2828; }
.recent-scroll { margin: 15rpx -36rpx -4rpx; padding: 0 36rpx; }
.recent-item { width: 285rpx; border-color: rgba(30, 27, 22, .11); border-radius: 4rpx; background: #fcfbf8; }
.recent-avatar,
.avatar { overflow: hidden; border: 1rpx solid rgba(30, 27, 22, .11); border-radius: 4rpx; }
.avatar-image { display: block; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.list { gap: 0; border-top: 1rpx solid rgba(30, 27, 22, .09); }
.person-card { min-width: 0; overflow: hidden; gap: 15rpx; padding: 22rpx 0; border: 0; border-bottom: 1rpx solid rgba(30, 27, 22, .09); border-radius: 0; background: transparent; }
.person-copy { overflow: hidden; }
.name { min-width: 0; flex: 1; }
.name { color: #25231f; font-size: 25rpx; font-weight: 500; }
.meta,
.request-message { color: #8a847b; }
.online { border-radius: 3rpx; color: #56624c; background: rgba(86, 98, 76, .1); }
.card-action { flex: 0 0 auto; min-width: 86rpx; border-radius: 4rpx; font-size: 18rpx; box-sizing: border-box; }
.card-action.primary { border: 1rpx solid rgba(92, 40, 40, .22); color: #5c2828; background: #fcfbf8; }
.card-action.muted { color: #8a847b; background: #f0eee8; }
.card-action image { display: block; width: 24rpx; height: 24rpx; flex: 0 0 24rpx; object-fit: contain; }
.request-actions { flex: 0 0 auto; }
.pending-label { flex: 0 0 auto; color: #8a847b; }
.cancel { color: #5c2828; }
.bottom-note { margin-top: 26rpx; color: #8a847b; }
.bottom-note image { width: 22rpx; height: 22rpx; flex: 0 0 22rpx; }
.page image { max-width: 100%; box-sizing: border-box; }

@media (max-width: 420px) {
  .page { padding-right: 28rpx; padding-left: 28rpx; }
  .topbar { margin-right: -28rpx; margin-left: -28rpx; padding-right: 28rpx; padding-left: 28rpx; }
  .discover { min-width: 84rpx; min-height: 56rpx; gap: 5rpx; padding: 9rpx 10rpx; font-size: 18rpx; }
  .discover image { width: 24rpx; height: 24rpx; flex-basis: 24rpx; }
  .recent-scroll { margin-right: -28rpx; margin-left: -28rpx; padding-right: 28rpx; padding-left: 28rpx; }
  .card-action { min-width: 78rpx; padding-right: 9rpx; padding-left: 9rpx; }
}

/* 关系卡片的操作列是固定宽度，文字列必须显式允许收缩。 */
.summary-metric { overflow: hidden; }
.summary-label { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tabs { align-items: stretch; }
.tab { flex: 0 0 auto; min-width: 126rpx; }
.recent-scroll { max-width: calc(100% + 38rpx); }
.recent-row,
.recent-item { flex: 0 0 auto; }
.recent-time { flex: 0 0 auto; white-space: nowrap; }
.person-card,
.person-copy,
.name-line { min-width: 0; }
.person-copy { overflow: hidden; }
.name { min-width: 0; flex: 1; }
.bottom-note text { min-width: 0; flex: 1; }

@media (max-width: 360px) {
  .page { padding-right: 22rpx; padding-left: 22rpx; }
  .topbar { margin-right: -22rpx; margin-left: -22rpx; padding-right: 22rpx; padding-left: 22rpx; }
  .tabs { margin-right: -4rpx; margin-left: -4rpx; }
  .tab { min-width: 118rpx; padding-right: 6rpx; padding-left: 6rpx; font-size: 18rpx; }
  .summary-card { padding-right: 10rpx; padding-left: 10rpx; }
  .card-action { min-width: 72rpx; padding-right: 7rpx; padding-left: 7rpx; }
  .referral-request-card .card-action { min-width: 96rpx; }
}
</style>
