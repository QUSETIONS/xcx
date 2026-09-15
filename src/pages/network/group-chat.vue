<template>
  <view class="page" :style="a11yStyle">
    <view class="chat-head"><view><text class="eyebrow">GROUP CHAT</text><text class="title">{{ groupName || '社群群聊' }}</text><text class="subtitle">把动态里的认识，接成一句真正的交流。</text></view><view class="head-dot" /></view>
    <scroll-view class="message-list" scroll-y :scroll-into-view="lastMessageId"><view v-if="loading" class="state">正在打开群聊…</view><view v-else-if="!messages.length" class="empty">还没有群消息，先打个招呼吧。</view><view v-else><view v-for="message in messages" :key="message._id || message.id" :id="`message-${message._id || message.id}`" class="message-row" :class="{ mine: message.is_mine }"><view v-if="!message.is_mine" class="avatar"><text>{{ initial(message.sender) }}</text></view><view class="bubble-wrap"><text v-if="!message.is_mine" class="sender">{{ message.sender?.nickname || '社群成员' }}</text><view class="bubble"><text>{{ message.content }}</text></view><text class="time">{{ formatTime(message.created_at) }}</text></view><view v-if="message.is_mine" class="avatar mine-avatar"><text>我</text></view></view></view></scroll-view>
    <view class="composer"><input v-model="draft" class="input" maxlength="1000" confirm-type="send" placeholder="说点项目、资源或近况…" placeholder-class="placeholder" @confirm="send" /><view class="send" :class="{ disabled: !draft.trim() || sending }" @tap="send"><text>{{ sending ? '…' : '发送' }}</text></view></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { formatRelativeTime } from '@/utils/util'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'

const userStore = useUserStore()

const groupId = ref('')
const groupName = ref('')
const messages = ref([])
const draft = ref('')
const loading = ref(true)
const sending = ref(false)
let requestActive = false
let realtimeActive = false
let realtimeRequestActive = false
let realtimeGeneration = 0
let realtimeTimer = null
let messageCursor = ''
let messageCursorId = ''
let lastLoadedAt = 0
let pendingClientMessageId = ''
let pendingClientMessageContent = ''
const lastMessageId = computed(() => {
  const item = messages.value[messages.value.length - 1]
  return item ? `message-${item._id || item.id}` : ''
})

async function load({ silent = false } = {}) {
  if (!groupId.value) return
  if (requestActive) return
  requestActive = true
  if (!silent) loading.value = true
  try {
    const result = await bridge.network.groupMessages(groupId.value)
    groupName.value = result?.group?.name || groupName.value
    messages.value = result?.list || []
    updateMessageCursor()
    lastLoadedAt = Date.now()
    return true
  } catch {
    if (!silent) toastError('群聊加载失败，请先确认已加入社群')
  } finally {
    requestActive = false
    if (!silent) loading.value = false
  }
}

function updateMessageCursor(message = messages.value[messages.value.length - 1]) {
  if (!message) return
  messageCursor = String(message.cursor || message.created_at || messageCursor)
  messageCursorId = String(message.cursor_id || message.cursor_rowid || message._id || message.id || messageCursorId)
}

function mergeMessages(incoming = []) {
  if (!incoming.length) return
  const byId = new Map(messages.value.map((item) => [item._id || item.id, item]))
  incoming.forEach((item) => {
    const id = item?._id || item?.id
    if (id) byId.set(id, item)
  })
  messages.value = [...byId.values()].sort((a, b) => {
    const time = String(a.created_at || '').localeCompare(String(b.created_at || ''))
    if (time) return time
    const aCursor = Number(a.cursor_id || a.cursor_rowid)
    const bCursor = Number(b.cursor_id || b.cursor_rowid)
    if (Number.isFinite(aCursor) && Number.isFinite(bCursor)) return aCursor - bCursor
    return String(a._id || a.id || '').localeCompare(String(b._id || b.id || ''))
  })
  updateMessageCursor()
}

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
  void pollRealtime(generation)
}

async function pollRealtime(generation = realtimeGeneration) {
  if (!realtimeActive || generation !== realtimeGeneration || realtimeRequestActive) return
  realtimeRequestActive = true
  let nextDelay = 600
  try {
    const result = await bridge.network.groupMessagesPoll(groupId.value, messageCursor, messageCursorId, 20)
    if (generation !== realtimeGeneration || !realtimeActive) return
    const incoming = Array.isArray(result?.list) ? result.list : []
    if (incoming.length) {
      mergeMessages(incoming)
      nextDelay = 100
    } else if (result?.cursor) {
      messageCursor = result.cursor
      messageCursorId = result.cursor_id || messageCursorId
    }
  } catch {
    nextDelay = 3000
  } finally {
    if (generation !== realtimeGeneration) return
    realtimeRequestActive = false
    if (realtimeActive) realtimeTimer = setTimeout(() => pollRealtime(generation), nextDelay)
  }
}
async function send() {
  const content = draft.value.trim()
  if (!content || sending.value) return
  if (!pendingClientMessageId || pendingClientMessageContent !== content) {
    pendingClientMessageId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    pendingClientMessageContent = content
  }
  sending.value = true
  try {
    const message = await bridge.network.sendGroupMessage(groupId.value, content, pendingClientMessageId)
    if (message) mergeMessages([message])
    draft.value = ''
    pendingClientMessageId = ''
    pendingClientMessageContent = ''
  } catch { toastError('消息发送失败，请稍后重试') } finally { sending.value = false }
}
function initial(user) { return String(user?.nickname || '群').slice(0, 1) }
function formatTime(value) { return formatRelativeTime(value) }
async function openChat() {
  if (!(await requirePageLogin(userStore, '登录后才能进入群聊'))) return
  const loaded = await load()
  if (loaded) startRealtime()
}
onLoad((query) => { groupId.value = query?.id || ''; groupName.value = query?.name ? decodeURIComponent(query.name) : ''; void openChat() })
onShow(() => {
  if (groupId.value && !requestActive && Date.now() - lastLoadedAt > 8000) void openChat()
})
onHide(stopRealtime)
onUnload(stopRealtime)
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; min-height: 100vh; padding: 26rpx 24rpx 24rpx; color: #27334f; background: #f5f7fb; box-sizing: border-box; }.chat-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }.eyebrow { display: block; color: #a0aabd; font: 700 16rpx/1.2 monospace; letter-spacing: .1em; }.title { display: block; margin-top: 8rpx; max-width: 590rpx; overflow: hidden; color: #303b57; font-size: 35rpx; font-weight: 760; text-overflow: ellipsis; white-space: nowrap; }.subtitle { display: block; margin-top: 7rpx; color: #8f9bb0; font-size: 19rpx; }.head-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #74c6a7; box-shadow: 0 0 0 8rpx rgba(116,198,167,.13); }.message-list { flex: 1; min-height: 0; padding: 8rpx 0 18rpx; }.state, .empty { padding: 80rpx 0; color: #a0aabd; font-size: 20rpx; text-align: center; }.message-row { display: flex; align-items: flex-start; gap: 10rpx; margin: 12rpx 0; }.message-row.mine { justify-content: flex-end; }.avatar { display: flex; align-items: center; justify-content: center; width: 54rpx; height: 54rpx; flex: 0 0 auto; border-radius: 17rpx; color: #fff; background: linear-gradient(135deg,#5968d8,#8794f5); font-size: 21rpx; font-weight: 700; }.mine-avatar { background: linear-gradient(135deg,#2f9b82,#74c6a7); }.bubble-wrap { max-width: 68%; }.sender, .time { display: block; color: #a0aabd; font-size: 16rpx; }.sender { margin: 2rpx 0 5rpx; }.time { margin-top: 5rpx; }.message-row.mine .time { text-align: right; }.bubble { padding: 13rpx 16rpx; border: 1rpx solid #e8ebf2; border-radius: 16rpx 16rpx 16rpx 5rpx; color: #55617a; background: #fff; font-size: 21rpx; line-height: 1.5; box-shadow: 0 5rpx 14rpx rgba(70,87,123,.03); }.message-row.mine .bubble { border-color: #cfd4ff; border-radius: 16rpx 16rpx 5rpx 16rpx; color: #fff; background: #6573dc; }.composer { display: flex; align-items: center; gap: 10rpx; padding: 12rpx; border: 1rpx solid #e4e8f0; border-radius: 20rpx; background: #fff; box-shadow: 0 10rpx 24rpx rgba(70,87,123,.06); }.input { min-width: 0; flex: 1; padding: 12rpx 13rpx; border-radius: 14rpx; color: #4b5872; background: #f7f8fb; font-size: 20rpx; }.placeholder { color: #b1bac7; }.send { padding: 12rpx 16rpx; border-radius: 14rpx; color: #fff; background: #6573dc; font-size: 20rpx; font-weight: 700; }.send.disabled { opacity: .45; pointer-events: none; }

/* Overflow guard: the chat shell must stay fixed while long messages wrap inside their bubble. */
.page,
.chat-head,
.chat-head > view:first-child,
.message-list,
.message-row,
.bubble-wrap,
.bubble,
.composer { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { height: 100vh; overflow-x: hidden; }
.chat-head > view:first-child,
.bubble-wrap { flex: 1 1 auto; overflow: hidden; }
.title,
.subtitle,
.sender,
.time { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.subtitle { overflow: hidden; }
.sender,
.time { text-overflow: ellipsis; white-space: nowrap; }
.bubble { overflow-wrap: anywhere; word-break: break-word; }
.head-dot,
.avatar,
.send { flex: 0 0 auto; }
.send { white-space: nowrap; }

/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .chat-head { margin-bottom: 12rpx; }
  .title { font-size: 31rpx; }
  .bubble-wrap { max-width: calc(100% - 64rpx); }
  .composer { padding: 9rpx; }
  .send { padding-right: 12rpx; padding-left: 12rpx; }
}
</style>
