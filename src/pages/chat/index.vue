<template>
  <view class="chat-page">
    <view v-if="directMode" class="direct-header"><view class="direct-identity"><view class="direct-avatar"><image v-if="directAvatar" class="avatar-image" :src="directAvatar" mode="aspectFill" /><text v-else>{{ avatarLabel({ from: 'service', sender: directPeer }) }}</text></view><view class="direct-copy"><text class="direct-kicker">{{ directKicker }} / CONVERSATION</text><text class="direct-title">与 {{ directUserName || directPeer?.nickname || '好友' }} 的对话</text><text class="direct-subtitle">消息与附件会保留在这条合作线上</text></view></view><text class="direct-status">{{ directStatus }}</text></view>
    <view v-else class="direct-header support-header"><view><text class="direct-kicker">MEDIAMATCH / SUPPORT</text><text class="direct-title">在线支持</text><text class="direct-subtitle">把遇到的问题直接说清楚，我们会给出下一步操作。</text></view><text class="direct-status">在线</text></view>
    <!-- 消息列表 -->
    <view v-if="loadState === 'loading' || directLoading" class="chat-state">
      <text>{{ t('common.loading') }}</text>
    </view>
    <view v-else-if="loadState === 'error' || directError" class="chat-state error-state" @tap="reload">
      <image class="chat-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
      <text>{{ directMode && directErrorText ? directErrorText : t('common.loadFailed') }}</text>
      <text v-if="directNeedsConnection" class="chat-state-hint">先发起项目对接，或在通讯录中成为好友后再聊天</text>
      <text v-if="directNeedsConnection" class="chat-state-action" @tap.stop="leaveChat">返回上一页</text>
      <text v-else class="chat-state-action">{{ t('common.retry') }}</text>
    </view>
    <scroll-view v-else class="msg-scroll" scroll-y :scroll-top="scrollTop" :scroll-with-animation="false">
      <view class="msg-list">
        <view class="time-divider"><text>{{ t('chat.today') }}</text></view>
        <view class="msg-item" v-for="msg in messages" :key="msg.id" :class="msg.from">
          <view class="avatar" v-if="msg.from === 'service'"><image v-if="messageAvatar(msg)" class="avatar-image" :src="messageAvatar(msg)" mode="aspectFill" /><text v-else>{{ avatarLabel(msg) }}</text></view>
          <view class="bubble" :class="msg.from">
            <view v-if="msg.attachments?.length" class="message-attachments">
              <view v-for="attachment in msg.attachments" :key="attachment.id || attachment.name" class="message-attachment" @tap="openAttachment(attachment)">
                <image v-if="attachment.kind === 'image' && attachment.preview" class="message-attachment-image" :src="attachment.preview" mode="aspectFill" />
                <view v-else class="message-attachment-icon"><text>{{ attachment.kind === 'image' ? '图' : '件' }}</text></view>
                <view class="message-attachment-copy"><text class="message-attachment-name">{{ attachment.name || attachment.original_name || '附件' }}</text><text class="message-attachment-meta">{{ attachment.kind === 'image' ? '图片' : '文件' }}</text></view>
              </view>
            </view>
            <text v-if="msg.content">{{ msg.content }}</text>
            <text v-if="msg.from === 'user' && msg.pending" class="message-delivery">发送中…</text>
            <text v-else-if="msg.from === 'user' && msg.failed" class="message-delivery failed" @tap.stop="retryMessage(msg)">发送失败，点击重试</text>
          </view>
          <view class="avatar user-avatar" v-if="msg.from === 'user'"><image v-if="messageAvatar(msg)" class="avatar-image" :src="messageAvatar(msg)" mode="aspectFill" /><text v-else>{{ avatarLabel(msg) }}</text></view>
        </view>
        <view class="typing" v-if="serviceTyping && !streamingReply">
          <view class="avatar"><text>{{ t('chat.serviceLabel') }}</text></view>
          <view class="bubble service typing-bubble">
            <text class="dot"></text><text class="dot"></text><text class="dot"></text>
          </view>
        </view>
        <view v-if="!directMode && !serviceTyping && serviceActions.length" class="service-action-panel">
          <text class="service-action-title">你可以直接去</text>
          <view class="service-action-list">
            <view v-for="action in serviceActions" :key="action.label" class="service-action" @tap="handleServiceAction(action)">
              <text>{{ action.label }}</text><text class="service-action-arrow">→</text>
            </view>
          </view>
        </view>
      </view>
      <view style="height: 20rpx;"></view>
    </scroll-view>

    <!-- 快捷问题 -->
    <scroll-view class="quick-bar" scroll-x v-if="!inputText && !directMode && !attachments.length">
      <view class="quick-item" v-for="(q, i) in quickQuestions" :key="i" @tap="sendQuick(q)"><text>{{ q }}</text></view>
    </scroll-view>

    <!-- 输入栏 -->
    <view class="input-bar">
      <view v-if="attachments.length" class="composer-attachments">
        <view v-for="attachment in attachments" :key="attachment.id || attachment.name" class="composer-attachment">
          <image v-if="attachment.kind === 'image' && attachment.preview" class="composer-attachment-preview" :src="attachment.preview" mode="aspectFill" />
          <view v-else class="message-attachment-icon"><text>{{ attachment.kind === 'image' ? '图' : '件' }}</text></view>
          <text class="composer-attachment-name">{{ attachment.name || attachment.original_name || '附件' }}</text>
          <text class="composer-attachment-remove" @tap="removeAttachment(attachment)">×</text>
        </view>
      </view>
      <view class="composer-tools">
        <view class="attach-trigger" :class="{ disabled: attachmentBusy || sending }" @tap="chooseAttachment('image')"><text>＋ 图片</text></view>
        <view class="attach-trigger" :class="{ disabled: attachmentBusy || sending }" @tap="chooseAttachment('file')"><text>＋ 文件</text></view>
        <text class="attachment-hint">{{ attachmentBusy ? '正在上传…' : '最多 3 个' }}</text>
      </view>
      <view class="input-row">
        <input class="msg-input" v-model="inputText" :placeholder="t('chat.placeholder')" confirm-type="send" @confirm="sendFromInput" />
        <view class="send-btn" :class="{ active: (inputText.trim() || attachments.length) && !sending, disabled: sending }" @tap="send"><text>{{ sending ? t('common.loading') : t('community.send') }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
import { baseURL } from '@/config/env'
import { getStoredSession } from '@/utils/session'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
import { createStreamBuffer } from '@/utils/stream-buffer'
useNavTitle('titles.chat')

const messages = ref([])
const inputText = ref('')
const attachments = ref([])
const attachmentBusy = ref(false)
const scrollTop = ref(0)
const serviceTyping = ref(false)
const serviceActions = ref([])
const directUserId = ref('')
const directUserName = ref('')
const directPeer = ref(null)
const directLoading = ref(false)
const directError = ref(false)
const directErrorText = ref('')
const directNeedsConnection = ref(false)
const directSending = ref(false)
const directConnectionStatus = ref('')
const streamingReply = ref(null)
const quickQuestions = ref(t('chat.quick'))
const userStore = useUserStore()
let scrollTimer = null
let streamDeltaBuffer = null

const { state: loadState, run: loadRequest } = useRequest(() => bridge.chat.list())
const { state: sendState, run: sendRequest } = useRequest((content, history, outgoingAttachments) => bridge.chat.send(content, history, outgoingAttachments))
const directMode = computed(() => !!directUserId.value)
const directKicker = computed(() => directConnectionStatus.value === 'ai_test_team' ? 'AI 测试团队' : directConnectionStatus.value === 'project' ? '项目对接' : '好友私聊')
const directStatus = computed(() => directConnectionStatus.value === 'ai_test_team' ? '自动回执已开启' : directConnectionStatus.value === 'project' ? '已建立项目连接' : '已建立联系')
const directAvatar = computed(() => String(directPeer.value?.avatar || directPeer.value?.avatar_url || '').trim())
const sending = computed(() => sendState.value === 'loading' || directSending.value || serviceTyping.value)

function createOptimisticMessage(text, outgoingAttachments, clientMessageId = '') {
  const now = new Date()
  const messageKey = clientMessageId || `message_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    client_message_id: messageKey,
    from: 'user',
    is_mine: true,
    content: text,
    attachments: outgoingAttachments.map((item) => ({ ...item })),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    pending: true
  }
}

function avatarLabel(message = {}) {
  if (message?.from === 'user') {
    const ownName = String(userStore.nickname || t('chat.meLabel')).replace(/\s+/g, '').trim()
    return Array.from(ownName).slice(0, 2).join('') || t('chat.meLabel')
  }
  if (!directMode.value) return t('chat.serviceLabel')
  const name = String(message?.sender?.nickname || directPeer.value?.nickname || directUserName.value || '对方')
    .replace(/\s+/g, '')
    .trim()
  return Array.from(name).slice(0, 2).join('') || '对方'
}

function messageAvatar(message = {}) {
  if (message?.from === 'user') return String(userStore.avatar || userStore.userInfo?.avatar || userStore.userInfo?.avatar_url || '').trim()
  return String(message?.sender?.avatar || message?.sender?.avatar_url || directPeer.value?.avatar || '').trim()
}

function markMessageFailed(messageId) {
  messages.value = messages.value.map((item) => item.id === messageId
    ? { ...item, pending: false, failed: true }
    : item)
}

function retryMessage(message) {
  if (!message?.failed || sending.value) return
  const retryAttachments = (message.attachments || []).map((item) => ({ ...item }))
  messages.value = messages.value.filter((item) => item.id !== message.id)
  inputText.value = message.content || ''
  attachments.value = retryAttachments
  nextTick(() => send(message.client_message_id || ''))
}

function applyServiceResponse(result) {
  const data = Array.isArray(result) ? { messages: result } : (result || {})
  flushStreamingReply()
  streamingReply.value = null
  messages.value = Array.isArray(data.messages) ? data.messages : (Array.isArray(data.list) ? data.list : [])
  hydrateAttachmentPreviews(messages.value)
  serviceActions.value = Array.isArray(data.actions) ? data.actions : []
  if (Array.isArray(data.suggestions) && data.suggestions.length) quickQuestions.value = data.suggestions
  if (data.service_unavailable) {
    toastError('消息已送达，客服暂时没能回复，请稍后再试')
  }
}

async function loadDirectContext() {
  try {
    const person = await bridge.network.person(directUserId.value)
    directPeer.value = person || directPeer.value
    directConnectionStatus.value = person?.connection_status || (person?.friend_status === 'friends' ? 'friends' : '')
  } catch {
    // 消息接口仍是最终权限判断；关系摘要加载失败时保留兼容文案。
  }
}

async function reload() {
  if (directMode.value) {
    directLoading.value = true
    directError.value = false
    directErrorText.value = ''
    directNeedsConnection.value = false
    try {
      const result = await bridge.network.directMessages(directUserId.value)
      directPeer.value = result?.peer || directPeer.value
      messages.value = result?.list || []
      hydrateAttachmentPreviews(messages.value)
      scrollToBottom()
    } catch (error) {
      directError.value = true
      directNeedsConnection.value = Number(error?.code || error?.data?.code) === 403
      directErrorText.value = directNeedsConnection.value
        ? '还没有建立联系'
        : (error?.message || t('common.loadFailed'))
      toastError(directErrorText.value)
    } finally {
      directLoading.value = false
    }
    return
  }
  try {
    applyServiceResponse(await loadRequest())
    scrollToBottom()
  } catch {
    toastError(t('common.loadFailed'))
  }
}

function leaveChat() {
  uni.navigateBack({ delta: 1, fail: () => uni.navigateTo({ url: '/pages/network/index' }) })
}

function decodeQueryValue(value) {
  let decoded = String(value || '')
  for (let i = 0; i < 2 && /%[0-9a-f]{2}/i.test(decoded); i += 1) {
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      break
    }
  }
  return decoded
}

onLoad(async (query) => {
  if (!(await requirePageLogin(userStore, '登录后才能开始对话'))) return
  directUserId.value = decodeQueryValue(query?.userId)
  directUserName.value = decodeQueryValue(query?.name)
  if (directMode.value) {
    try { uni.setNavigationBarTitle({ title: directUserName.value ? `与${directUserName.value}聊天` : '好友私聊' }) } catch {}
    loadDirectContext()
    reload()
  } else {
    reload()
  }
})

function scrollToBottom() {
  if (scrollTimer) return
  // SSE 可能每几十毫秒推一次片段；把滚动合并到一个短帧内，避免每个字符都触发页面重排。
  scrollTimer = setTimeout(() => {
    scrollTimer = null
    nextTick(() => { scrollTop.value = scrollTop.value === 999 ? 998 : 999 })
  }, 16)
}

function appendStreamingReply(delta) {
  if (!streamDeltaBuffer) {
    streamDeltaBuffer = createStreamBuffer({ delay: 32, onFlush: applyStreamingDelta })
  }
  streamDeltaBuffer.push(delta)
}

function applyStreamingDelta(delta) {
  const text = String(delta || '')
  if (!text) return
  if (!streamingReply.value) {
    streamingReply.value = {
      id: `stream_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      from: 'service',
      is_mine: false,
      content: '',
      attachments: [],
      streaming: true
    }
  }
  streamingReply.value = { ...streamingReply.value, content: `${streamingReply.value.content || ''}${text}`, streaming: true }
  const current = streamingReply.value
  messages.value = [...messages.value.filter((item) => item.id !== current.id), current]
  scrollToBottom()
}

function flushStreamingReply() {
  streamDeltaBuffer?.flush()
}

function removeStreamingReply() {
  streamDeltaBuffer?.clear()
  const id = streamingReply.value?.id
  if (id) messages.value = messages.value.filter((item) => item.id !== id)
  streamingReply.value = null
}

onUnmounted(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
  streamDeltaBuffer?.stop()
  scrollTimer = null
})

async function send(clientMessageId = '') {
  const text = inputText.value.trim()
  if ((!text && !attachments.value.length) || sending.value || attachmentBusy.value) return
  const outgoingAttachments = attachments.value.slice()
  if (directMode.value) {
    const optimisticMessage = createOptimisticMessage(text, outgoingAttachments, clientMessageId)
    directSending.value = true
    messages.value = [...messages.value, optimisticMessage]
    inputText.value = ''
    attachments.value = []
    scrollToBottom()
    try {
      const message = await bridge.network.sendDirectMessageStream(directUserId.value, text, outgoingAttachments, {
        onDelta: appendStreamingReply
      }, optimisticMessage.client_message_id)
      flushStreamingReply()
      const streamingId = streamingReply.value?.id
      messages.value = messages.value.filter((item) => item.id !== optimisticMessage.id && item.id !== streamingId)
      streamingReply.value = null
      if (message) {
        const next = [message]
        if (message.ai_reply) next.push(message.ai_reply)
        messages.value = [...messages.value, ...next]
        hydrateAttachmentPreviews(next)
        if (message.ai_reply_error) toastError(message.ai_reply_error)
      }
      scrollToBottom()
    } catch (error) {
      removeStreamingReply()
      markMessageFailed(optimisticMessage.id)
      toastError(error?.message || '消息发送失败，请稍后重试')
    } finally {
      directSending.value = false
    }
    return
  }
  const optimisticMessage = createOptimisticMessage(text, outgoingAttachments, clientMessageId)
  const history = messages.value.slice(-8).map((item) => ({ from: item.from, content: item.content, attachments: item.attachments || [] }))
  messages.value = [...messages.value, optimisticMessage]
  inputText.value = ''
  attachments.value = []
  scrollToBottom()
  try {
    serviceActions.value = []
    serviceTyping.value = true
    applyServiceResponse(await bridge.chat.sendStream(text, history, outgoingAttachments, {
      onDelta: appendStreamingReply
    }, optimisticMessage.client_message_id))
    serviceTyping.value = false
  } catch {
    removeStreamingReply()
    serviceTyping.value = false
    markMessageFailed(optimisticMessage.id)
    toastError(t('common.loadFailed'))
    return
  }
  scrollToBottom()
}

function sendFromInput() {
  send()
}

function removeAttachment(attachment) {
  attachments.value = attachments.value.filter((item) => item !== attachment && item.id !== attachment?.id)
}

function fileNameFromPath(path) {
  return String(path || '').split(/[\\/]/).pop() || '附件'
}

async function chooseAttachment(kind = 'file') {
  if (attachmentBusy.value || sending.value) return
  const remaining = Math.max(0, 3 - attachments.value.length)
  if (!remaining) {
    uni.showToast({ title: '一条消息最多 3 个附件', icon: 'none' })
    return
  }
  const handleFiles = async (files = [], paths = []) => {
    const list = Array.isArray(files) && files.length
      ? files.slice(0, remaining).map((file, index) => ({ path: file.path || file.tempFilePath || paths[index], name: file.name, size: file.size, type: file.type || file.mimeType }))
      : paths.slice(0, remaining).map((path) => ({ path, name: fileNameFromPath(path) }))
    const valid = list.filter((file) => file.path)
    if (!valid.length) return
    attachmentBusy.value = true
    try {
      for (const file of valid) {
        const uploaded = await bridge.attachments.upload(file.path, {
          kind,
          name: file.name || fileNameFromPath(file.path),
          mime_type: file.type || (kind === 'image' ? 'image/*' : 'application/octet-stream'),
          size: file.size || 0
        })
        attachments.value.push({ ...uploaded, name: uploaded.name || file.name || fileNameFromPath(file.path), kind, preview: kind === 'image' ? file.path : '' })
      }
      uni.showToast({ title: `已添加 ${valid.length} 个附件`, icon: 'none' })
    } catch (error) {
      toastError(error?.message || '附件上传失败')
    } finally {
      attachmentBusy.value = false
    }
  }
  const success = (result = {}) => handleFiles(result.tempFiles || [], result.tempFilePaths || [])
  try {
    if (kind === 'image' && typeof uni.chooseImage === 'function') {
      uni.chooseImage({ count: remaining, sizeType: ['original', 'compressed'], sourceType: ['album', 'camera'], success })
      return
    }
    if (typeof uni.chooseFile === 'function') {
      uni.chooseFile({ count: remaining, type: 'all', success })
      return
    }
    if (typeof uni.chooseMessageFile === 'function') {
      uni.chooseMessageFile({ count: remaining, type: 'all', success })
      return
    }
    uni.showToast({ title: '当前端暂不支持文件选择', icon: 'none' })
  } catch {
    toastError('打开文件选择器失败')
  }
}

function attachmentUrl(attachment) {
  if (attachment?.url && /^https?:\/\//i.test(attachment.url)) return attachment.url
  const id = encodeURIComponent(attachment?.id || '')
  return `${String(baseURL || '').replace(/\/+$/, '')}/attachments/${id}`
}

function authHeader() {
  const token = getStoredSession()?.token || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function hydrateAttachmentPreview(attachment) {
  if (!attachment || attachment.kind !== 'image' || attachment.preview || !attachment.id) return
  const url = attachmentUrl(attachment)
  try {
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      const response = await window.fetch(url, { headers: authHeader() })
      if (!response.ok) return
      const blob = await response.blob()
      attachment.preview = URL.createObjectURL(blob)
      return
    }
    if (typeof uni.downloadFile !== 'function') return
    uni.downloadFile({ url, header: authHeader(), success: (result) => { if (result?.statusCode === 200) attachment.preview = result.tempFilePath } })
  } catch {
    // 缩略图失败不影响消息正文和文件卡片展示。
  }
}

function hydrateAttachmentPreviews(list = []) {
  list.flatMap((message) => message?.attachments || []).forEach((attachment) => { hydrateAttachmentPreview(attachment) })
}

async function openAttachment(attachment) {
  if (!attachment?.id) return
  if (attachment.kind === 'image') {
    await hydrateAttachmentPreview(attachment)
    if (attachment.preview && typeof uni.previewImage === 'function') {
      uni.previewImage({ urls: [attachment.preview], current: attachment.preview })
      return
    }
  }
  const url = attachmentUrl(attachment)
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    try {
      const response = await window.fetch(url, { headers: authHeader() })
      if (!response.ok) throw new Error('附件读取失败')
      const blobUrl = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = attachment.name || '附件'
      link.click()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      return
    } catch {
      toastError('附件读取失败，请稍后重试')
      return
    }
  }
  if (typeof uni.downloadFile === 'function') {
    uni.downloadFile({ url, header: authHeader(), success: (result) => {
      if (result?.statusCode !== 200) return uni.showToast({ title: '附件读取失败', icon: 'none' })
      if (typeof uni.openDocument === 'function') uni.openDocument({ filePath: result.tempFilePath, showMenu: true })
    }, fail: () => uni.showToast({ title: '附件读取失败', icon: 'none' }) })
  }
}

function sendQuick(q) {
  inputText.value = q
  send()
}

function handleServiceAction(action) {
  if (!action) return
  if (action.type === 'navigate' && action.url) {
    uni.navigateTo({ url: action.url, fail: () => toastError('页面暂时打不开，请稍后重试') })
    return
  }
  if (action.label) sendQuick(action.label)
}
</script>

<style scoped>
.chat-page { display: flex; min-height: 0; flex-direction: column; height: 100vh; overflow: hidden; background: #EDEFF4; box-sizing: border-box; }
/* #ifdef H5 */
.chat-page { height: calc(100vh - 44px); }
/* #endif */
.direct-header { display: flex; min-width: 0; align-items: center; justify-content: space-between; padding: 20rpx 24rpx 16rpx; border-bottom: 1rpx solid rgba(0,0,0,.05); background: #FFFFFF; }.direct-kicker { display: block; color: #9aa5b6; font-size: 18rpx; }.direct-title { display: block; margin-top: 5rpx; color: #3d4964; font-size: 27rpx; font-weight: 700; }.direct-status { padding: 7rpx 10rpx; border-radius: 9rpx; color: #2f9b82; background: #e8f7f2; font-size: 17rpx; }
.chat-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.chat-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.chat-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }

.msg-scroll { min-height: 0; flex: 1; }
.msg-list { padding: 24rpx; }
.time-divider { text-align: center; margin-bottom: 24rpx; }
.time-divider text { font-size: 22rpx; color: rgba(0,0,0,0.35); background: rgba(0,0,0,0.05); padding: 6rpx 20rpx; border-radius: 12rpx; }

.msg-item { display: flex; min-width: 0; margin-bottom: 24rpx; }
.msg-item.service { justify-content: flex-start; }
.msg-item.user { justify-content: flex-end; }
.avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #FF6B35; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.avatar text { font-size: 26rpx; color: #FFFFFF; }
.user-avatar { background: #6366F1; }
.bubble { max-width: 480rpx; padding: 18rpx 24rpx; border-radius: 20rpx; font-size: 28rpx; line-height: 1.5; }
.bubble.service { background: #FFFFFF; color: rgba(0,0,0,0.85); margin-left: 16rpx; border-top-left-radius: 4rpx; }
.bubble.user { background: #FF6B35; color: #FFFFFF; margin-right: 16rpx; border-top-right-radius: 4rpx; }
.msg-item.user .bubble { order: 0; }

.typing { display: flex; margin-bottom: 24rpx; }
.typing-bubble { display: flex; align-items: center; margin-left: 16rpx; }
.dot { width: 12rpx; height: 12rpx; background: rgba(0,0,0,0.3); border-radius: 50%; margin: 0 3rpx; }

.quick-bar { white-space: nowrap; padding: 16rpx 24rpx; background: #FFFFFF; border-top: 1rpx solid #F0F1F5; }
.quick-item { display: inline-block; background: #F5F6FA; border-radius: 24rpx; padding: 12rpx 24rpx; margin-right: 12rpx; }
.quick-item text { font-size: 24rpx; color: rgba(0,0,0,0.7); }

.input-bar { display: flex; flex-shrink: 0; align-items: center; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); }
.msg-input { flex: 1; height: 72rpx; background: #F5F6FA; border-radius: 36rpx; padding: 0 28rpx; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.send-btn { background: #E5E7EB; border-radius: 36rpx; padding: 18rpx 32rpx; margin-left: 16rpx; }
.send-btn.active { background: linear-gradient(135deg, #FF6B35, #FF9A5C); }
.send-btn.disabled { opacity: 0.65; }
.send-btn text { font-size: 28rpx; color: rgba(0,0,0,0.5); }
.send-btn.active text { color: #FFFFFF; font-weight: bold; }

.service-action-panel { margin: 4rpx 0 22rpx 80rpx; padding: 16rpx; border: 1rpx solid #E6E0D6; border-radius: 14rpx; background: #FFFCF7; }
.service-action-title { display: block; color: #806A4D; font-size: 21rpx; font-weight: 700; }
.service-action-list { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 10rpx; }
.service-action { display: flex; align-items: center; gap: 10rpx; padding: 10rpx 13rpx; border: 1rpx solid #E8D6B7; border-radius: 9rpx; color: #7C5D32; background: #FFF7E8; font-size: 19rpx; }
.service-action-arrow { font-size: 22rpx; }

/* Enterprise pass: 对话界面使用明确的发送、已发送和异常状态，不使用高饱和渐变。 */
.chat-page { background: #F5F6F8; }
.direct-header, .quick-bar, .input-bar { border-color: #E5E6EB; }
.direct-status { border-radius: 6rpx; color: #2F8067; background: #E8F5EF; }
.avatar { border-radius: 10rpx; background: #C66D4C; }
.user-avatar { background: #646A73; }
.bubble { border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(31,35,41,.03); }
.bubble.user { background: #4A6B65; }
.quick-item { border: 1rpx solid #E5E6EB; border-radius: 8rpx; background: #FFF; }
.msg-input { border: 1rpx solid #D9DDE3; border-radius: 8rpx; background: #FFF; }
.send-btn { border-radius: 8rpx; }
.send-btn.active { background: #4A6B65; }
.input-bar { flex-direction: column; align-items: stretch; gap: 10rpx; }
.input-row { display: flex; width: 100%; align-items: center; }
.input-row .msg-input { min-width: 0; }
.composer-attachments { display: flex; flex-wrap: wrap; gap: 8rpx; width: 100%; }
.composer-attachment { display: flex; align-items: center; gap: 6rpx; max-width: 330rpx; padding: 6rpx 8rpx; border: 1rpx solid #E1E5EA; border-radius: 9rpx; background: #FFF; }
.composer-attachment-preview { width: 48rpx; height: 48rpx; border-radius: 7rpx; background: #EEF1F5; }
.composer-attachment-name { max-width: 230rpx; overflow: hidden; color: #55616D; font-size: 18rpx; text-overflow: ellipsis; white-space: nowrap; }
.composer-attachment-remove { padding: 0 4rpx; color: #929AA5; font-size: 26rpx; line-height: 1; }
.composer-tools { display: flex; align-items: center; gap: 10rpx; width: 100%; }
.attach-trigger { padding: 8rpx 12rpx; border: 1rpx solid #D9DEE5; border-radius: 8rpx; color: #4A6B65; background: #FFF; font-size: 19rpx; }
.attach-trigger.disabled { opacity: .5; }
.attachment-hint { color: #9AA3AE; font-size: 17rpx; }
.message-attachments { display: flex; flex-wrap: wrap; gap: 8rpx; margin-bottom: 8rpx; }
.message-attachment { display: flex; align-items: center; gap: 7rpx; max-width: 320rpx; padding: 7rpx 9rpx; border: 1rpx solid #E2E6EC; border-radius: 9rpx; background: #FFF; }
.bubble.user .message-attachment { border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.14); }
.message-attachment-image { width: 58rpx; height: 58rpx; border-radius: 7rpx; background: #EEF1F5; }
.message-attachment-icon { display: flex; align-items: center; justify-content: center; width: 44rpx; height: 44rpx; flex: 0 0 auto; border-radius: 8rpx; color: #4A6B65; background: #EAF2F0; font-size: 17rpx; font-weight: 700; }
.message-attachment-copy { display: flex; min-width: 0; flex-direction: column; }
.message-attachment-name { max-width: 220rpx; overflow: hidden; color: #55616D; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }
.message-attachment-meta { margin-top: 3rpx; color: #9AA3AE; font-size: 14rpx; }
.bubble.user .message-attachment-name, .bubble.user .message-attachment-meta { color: rgba(255,255,255,.92); }
.message-delivery { display: block; margin-top: 7rpx; color: rgba(255,255,255,.72); font-size: 16rpx; }
.message-delivery.failed { color: #FFE0D5; text-decoration: underline; }

/* Quiet Intelligence v2：聊天更像一条合作记录，而不是即时通讯皮肤。 */
.chat-page { color: #191816; background: #f7f6f2; }
.direct-header { padding: 26rpx 36rpx 28rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .11); background: #f7f6f2; }
.direct-identity { display: flex; align-items: center; min-width: 0; gap: 14rpx; }
.direct-identity { flex: 1; overflow: hidden; }
.direct-copy { min-width: 0; overflow: hidden; }
.direct-avatar { display: flex; width: 48rpx; height: 48rpx; align-items: center; justify-content: center; flex: 0 0 48rpx; overflow: hidden; border: 1rpx solid rgba(30, 27, 22, .12); border-radius: 4rpx; color: #69574a; background: #f0eee8; }
.direct-avatar text { color: #69574a; font-family: Georgia, serif; font-size: 18rpx; }
.direct-kicker { color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .12em; }
.direct-title { margin-top: 10rpx; color: #191816; font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-size: 34rpx; font-weight: 400; letter-spacing: -.035em; }
.direct-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.direct-status { flex: 0 0 auto; margin-left: 12rpx; white-space: nowrap; }
.direct-subtitle { display: block; margin-top: 9rpx; color: #8a847b; font-size: 17rpx; }
.direct-status { border-radius: 3rpx; color: #56624c; background: rgba(86, 98, 76, .1); font-family: ui-monospace, monospace; font-size: 14rpx; letter-spacing: .06em; }
.msg-scroll { background: #f7f6f2; }
.msg-list { width: 100%; max-width: none; margin: 0; padding: 34rpx 36rpx; box-sizing: border-box; }
.time-divider { margin-bottom: 42rpx; text-align: left; }
.time-divider text { padding: 0; border-radius: 0; color: #979189; background: transparent; font-family: ui-monospace, monospace; font-size: 14rpx; letter-spacing: .1em; }
.msg-item { align-items: flex-start; margin-bottom: 38rpx; }
.avatar { width: 42rpx; height: 42rpx; border: 1rpx solid rgba(30, 27, 22, .12); border-radius: 3rpx; color: #69574a; background: #f0eee8; }
.avatar { overflow: hidden; }
.avatar-image { display: block; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.avatar text { color: #69574a; font-family: Georgia, serif; font-size: 17rpx; }
.user-avatar { border-color: rgba(92, 40, 40, .18); color: #5c2828; background: #f0e5df; }
.user-avatar text { color: #5c2828; }
.msg-item { width: 100%; min-width: 0; box-sizing: border-box; }
.bubble { min-width: 0; max-width: min(510rpx, calc(100% - 58rpx)); padding: 0; overflow-wrap: anywhere; word-break: break-word; border-radius: 0; font-size: 25rpx; line-height: 1.72; box-shadow: none; }
.bubble.service { margin-left: 16rpx; color: #25231f; background: transparent; }
.bubble.user { margin-right: 12rpx; padding: 14rpx 18rpx; border: 1rpx solid rgba(105, 87, 74, .14); border-radius: 5rpx; color: #25231f; background: #f0eee8; }
.typing-bubble { min-width: 64rpx; height: 42rpx; }
.dot { width: 8rpx; height: 8rpx; background: #8a847b; }
.quick-bar { padding: 12rpx 36rpx; border-top: 1rpx solid rgba(30, 27, 22, .09); background: #f7f6f2; }
.quick-item { padding: 9rpx 14rpx; border-color: rgba(30, 27, 22, .11); border-radius: 4rpx; background: transparent; }
.quick-item text { color: #69574a; font-size: 18rpx; }
.input-bar { gap: 12rpx; padding: 16rpx 36rpx calc(16rpx + env(safe-area-inset-bottom)); border-top: 1rpx solid rgba(30, 27, 22, .12); background: #fcfbf8; }
.composer-tools { gap: 14rpx; }
.attach-trigger { padding: 7rpx 0; border: 0; border-bottom: 1rpx solid rgba(105, 87, 74, .28); border-radius: 0; color: #69574a; background: transparent; }
.attachment-hint { color: #979189; }
.msg-input { height: 76rpx; padding: 0 16rpx; border-color: rgba(30, 27, 22, .13); border-radius: 4rpx; color: #191816; background: #fcfbf8; }
.send-btn { margin-left: 12rpx; padding: 17rpx 26rpx; border-radius: 4rpx; background: #e3dfd6; }
.send-btn.active { border-radius: 4rpx; background: #5c2828; }
.send-btn text { font-size: 21rpx; }
.send-btn.active text { font-weight: 500; }
.service-action-panel { margin: 6rpx 0 32rpx 58rpx; padding: 18rpx 0; border: 0; border-top: 1rpx solid rgba(181, 160, 122, .35); border-bottom: 1rpx solid rgba(181, 160, 122, .35); border-radius: 0; background: transparent; }
.service-action-title { color: #69574a; font-weight: 500; }
.service-action { border-color: rgba(181, 160, 122, .4); border-radius: 3rpx; color: #69574a; background: transparent; }
.message-attachment,
.composer-attachment { border-color: rgba(30, 27, 22, .11); border-radius: 4rpx; background: #fcfbf8; }
.bubble.user .message-attachment { border-color: rgba(30, 27, 22, .12); background: rgba(252, 251, 248, .58); }
.message-attachment-icon { border-radius: 3rpx; color: #69574a; background: #f0eee8; }
.message-attachments,
.message-attachment { min-width: 0; max-width: 100%; box-sizing: border-box; overflow: hidden; }
.message-attachment-copy { min-width: 0; max-width: calc(100% - 60rpx); overflow: hidden; }
.message-attachment-name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.composer-attachment { min-width: 0; max-width: min(330rpx, 100%); box-sizing: border-box; overflow: hidden; }
.composer-attachment-name { min-width: 0; max-width: calc(100% - 78rpx); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.input-row,
.msg-input { min-width: 0; box-sizing: border-box; }
.send-btn { flex: 0 0 auto; white-space: nowrap; box-sizing: border-box; }
.page image { max-width: 100%; box-sizing: border-box; }
.bubble.user .message-attachment-name,
.bubble.user .message-attachment-meta { color: #6f6b63; }
.message-delivery { color: #8a847b; }
.message-delivery.failed { color: #8a4c46; }

@media (max-width: 420px) {
  .direct-header,
  .msg-list,
  .quick-bar,
  .input-bar { padding-right: 28rpx; padding-left: 28rpx; }
  .direct-title { font-size: 31rpx; }
}
</style>
