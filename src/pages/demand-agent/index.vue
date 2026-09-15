<template>
  <view class="page" :style="a11yStyle">
    <view v-if="loading" class="state"><view class="loading-dot" /><text>正在打开需求 Agent…</text></view>
    <template v-else>
      <view class="topbar">
        <view><text class="eyebrow">DEMAND AGENT</text><text class="page-title">{{ demand.title || '需求对话' }}</text></view>
        <text class="topbar-status">在线</text>
      </view>

      <view class="context-card">
        <view class="context-card-head"><text>公开需求上下文</text><text>{{ context.region || '地区待沟通' }}</text></view>
        <text class="context-category">{{ context.category_name || context.category || '合作需求' }}</text>
        <text class="context-description">{{ context.description || '甲方正在整理这条需求，欢迎先问合作范围、推进城市和交付边界。' }}</text>
        <view class="context-meta"><text>{{ demand.company_name || '需求方' }}</text><text v-if="context.quote_type">{{ quoteLabel(context.quote_type) }}</text></view>
      </view>

      <scroll-view class="message-scroll" scroll-y :scroll-into-view="scrollIntoView">
        <view class="message-list">
          <view v-for="message in messages" :id="`message_${message.id}`" :key="message.id" class="message-row" :class="message.role">
            <view v-if="message.role === 'assistant'" class="message-avatar">A</view>
            <view class="message-content"><text class="message-author">{{ message.role === 'assistant' ? '需求 Agent' : '我' }}</text><view class="bubble">{{ message.content }}</view></view>
            <view v-if="message.role === 'user'" class="message-avatar user-avatar">我</view>
          </view>
          <view v-if="sending" class="message-row assistant"><view class="message-avatar">A</view><view class="message-content"><text class="message-author">需求 Agent</text><view class="bubble pending">{{ streamingReply || '正在结合需求上下文思考…' }}</view></view></view>
        </view>
      </scroll-view>

      <view class="quick-prompts">
        <text v-for="prompt in quickPrompts" :key="prompt" @tap="usePrompt(prompt)">{{ prompt }}</text>
      </view>
      <view class="composer">
        <textarea v-model="draft" auto-height maxlength="500" class="composer-input" confirm-type="send" placeholder="问问这条需求的合作边界…" placeholder-class="composer-placeholder" @confirm="send" />
        <view class="send-button" :class="{ disabled: sending || !draft.trim() }" @tap="send">发送 <text>↗</text></view>
      </view>
      <view class="footer-note">这是基于公开信息的前置交流；联系方式和未公开资料需在建立联系后进一步确认。</view>
    </template>
  </view>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
import { quoteLabel } from '@/utils/i18n-maps'

useNavTitle('titles.demandAgent')
const userStore = useUserStore()
const demandId = ref('')
const loading = ref(true)
const sending = ref(false)
const streamingReply = ref('')
const draft = ref('')
const demand = ref({})
const context = ref({})
const messages = ref([])
const agentSessionId = ref('')
const scrollIntoView = ref('')
const quickPrompts = ['这个项目最看重什么？', '预计在哪些城市推进？', '适合什么类型的合作方？']

function storageKey() {
  const owner = String(userStore.userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'guest'
  return `mediamatch:demand-agent:${owner}:${demandId.value}`
}
function initialMessage() {
  return `你好，我是这条需求的 Agent。你可以先问项目背景、合作城市、预算方式和交付边界；我只会基于甲方公开的信息回答。`
}
function restoreMessages() {
  try {
    const saved = uni.getStorageSync(storageKey())
    if (Array.isArray(saved) && saved.length) return saved
  } catch {
    // 存储不可用时从欢迎语开始，不影响对话。
  }
  return [{ id: `welcome_${demandId.value}`, role: 'assistant', content: initialMessage() }]
}
function persistMessages() {
  try { uni.setStorageSync(storageKey(), messages.value.slice(-40)) } catch { /* ignore local storage failures */ }
}
function scrollToLatest() {
  nextTick(() => { scrollIntoView.value = `message_${messages.value.at(-1)?.id || ''}` })
}
function usePrompt(prompt) { draft.value = prompt; void send() }

async function load() {
  if (!(await requirePageLogin(userStore, '登录后才能与需求 Agent 对话'))) {
    loading.value = false
    return
  }
  try {
    const result = await bridge.demandAgent.detail(demandId.value)
    demand.value = result?.demand || result || {}
    context.value = result?.context || result?.agent?.context || demand.value || {}
    messages.value = restoreMessages()
    try {
      const history = await bridge.demandAgent.history(demandId.value)
      if (history?.conversation?.id) agentSessionId.value = history.conversation.id
      if (Array.isArray(history?.messages) && history.messages.length) {
        messages.value = history.messages.slice(-40).map((item) => ({
          id: item.id || `history_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          role: item.role === 'user' ? 'user' : 'assistant',
          content: String(item.content || '')
        }))
        persistMessages()
      }
    } catch (error) {
      console.warn('[demand-agent] remote history unavailable, using local cache:', error)
    }
  } catch (error) {
    uni.showToast({ title: error?.message || '需求 Agent 暂时不可用', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
  } finally {
    loading.value = false
  }
}

async function send() {
  const text = draft.value.trim()
  if (!text || sending.value || !demandId.value) return
  const userMessage = { id: `user_${Date.now()}`, role: 'user', content: text }
  messages.value = [...messages.value, userMessage]
  draft.value = ''
  sending.value = true
  streamingReply.value = ''
  scrollToLatest()
  try {
    const clientMessageId = `demand_agent_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const result = await bridge.demandAgent.chatStream(demandId.value, {
      text,
      session_id: agentSessionId.value,
      client_message_id: clientMessageId,
      // 本轮 text 已单独提交，历史中排除刚插入的用户消息，避免模型收到两遍。
      history: messages.value.slice(0, -1).slice(-12).map(({ role, content }) => ({ role, content }))
    }, {
      onRetry: () => { streamingReply.value = '' },
      onDelta: (delta) => { streamingReply.value += String(delta || ''); scrollToLatest() }
    })
    if (result?.session_id) agentSessionId.value = String(result.session_id)
    const reply = String(result?.reply || result?.message || '我会继续围绕这条公开需求回答。')
    messages.value = [...messages.value, { id: `assistant_${Date.now()}`, role: 'assistant', content: reply }]
    persistMessages()
  } catch (error) {
    messages.value = messages.value.filter((item) => item.id !== userMessage.id)
    draft.value = text
    uni.showToast({ title: error?.message || '发送失败，请再试一次', icon: 'none' })
  } finally {
    sending.value = false
    streamingReply.value = ''
    scrollToLatest()
  }
}

onLoad((query) => {
  demandId.value = String(query?.id || query?._id || '').trim()
  if (!demandId.value) {
    loading.value = false
    uni.showToast({ title: '需求不存在', icon: 'none' })
    return
  }
  void load()
})
</script>

<style scoped lang="scss">
.page { display: flex; box-sizing: border-box; height: 100vh; min-height: 0; flex-direction: column; padding: 26rpx 30rpx calc(18rpx + env(safe-area-inset-bottom)); overflow: hidden; color: #302b26; background: #f7f6f2; }
.topbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 18rpx; padding-bottom: 22rpx; border-bottom: 1rpx solid rgba(30,27,22,.1); }
.eyebrow { display: block; color: #8a847b; font: 500 14rpx/1.2 ui-monospace, monospace; letter-spacing: .12em; }
.page-title { display: block; max-width: 560rpx; margin-top: 10rpx; overflow: hidden; color: #191816; font: 400 30rpx/1.35 'Songti SC', serif; text-overflow: ellipsis; white-space: nowrap; }
.topbar-status { flex: 0 0 auto; padding: 5rpx 9rpx; color: #56624c; background: #e8eee5; font-size: 16rpx; }
.context-card { flex: 0 0 auto; margin-top: 22rpx; padding: 18rpx; border: 1rpx solid rgba(42,37,31,.11); background: #fcfbf8; }
.context-card-head, .context-meta { display: flex; justify-content: space-between; gap: 12rpx; color: #8a847b; font-size: 16rpx; }
.context-card-head text:last-child { color: #5c2828; }
.context-category { display: block; margin-top: 12rpx; color: #39332c; font-size: 20rpx; font-weight: 600; }
.context-description { display: block; margin-top: 8rpx; overflow: hidden; color: #716960; font-size: 18rpx; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.context-meta { margin-top: 13rpx; padding-top: 12rpx; border-top: 1rpx solid rgba(42,37,31,.08); }
.message-scroll { min-height: 0; flex: 1; margin: 22rpx -4rpx 0; }
.message-list { padding: 0 4rpx 24rpx; }
.message-row { display: flex; align-items: flex-start; gap: 10rpx; margin: 16rpx 0; }
.message-row.user { justify-content: flex-end; }
.message-avatar { display: flex; width: 44rpx; height: 44rpx; flex: 0 0 44rpx; align-items: center; justify-content: center; border-radius: 50%; color: #fcfbf8; background: #5c2828; font: 500 18rpx/1 Georgia, serif; }
.user-avatar { color: #fcfbf8; background: #8a847b; }
.message-content { max-width: 78%; min-width: 0; }
.message-row.user .message-content { align-items: flex-end; }
.message-author { display: block; margin: 0 4rpx 5rpx; color: #aaa49a; font-size: 15rpx; }
.message-row.user .message-author { text-align: right; }
.bubble { padding: 13rpx 15rpx; border: 1rpx solid rgba(42,37,31,.09); color: #4d463e; background: #fcfbf8; font-size: 19rpx; line-height: 1.6; word-break: break-word; }
.message-row.user .bubble { color: #fcfbf8; border-color: #5c2828; background: #5c2828; }
.bubble.pending { color: #8a847b; background: #f0eee8; }
.quick-prompts { display: flex; gap: 10rpx; padding: 12rpx 0; overflow-x: auto; white-space: nowrap; }
.quick-prompts text { padding: 8rpx 12rpx; border: 1rpx solid #d9d1c6; color: #69574a; background: #fcfbf8; font-size: 16rpx; }
.composer { display: flex; align-items: flex-end; gap: 12rpx; padding-top: 12rpx; border-top: 1rpx solid rgba(30,27,22,.1); }
.composer-input { min-height: 66rpx; max-height: 160rpx; flex: 1; padding: 12rpx 0; color: #302b26; font-size: 20rpx; line-height: 1.55; }
.composer-placeholder { color: #aaa49a; }
.send-button { flex: 0 0 auto; padding: 13rpx 15rpx; color: #fcfbf8; background: #342f29; font-size: 18rpx; }
.send-button text { margin-left: 6rpx; color: #d5b47d; }
.send-button.disabled { opacity: .45; }
.footer-note { flex: 0 0 auto; margin-top: 12rpx; color: #aaa49a; font-size: 14rpx; line-height: 1.45; }
.state { display: flex; min-height: 100vh; flex-direction: column; align-items: center; justify-content: center; gap: 14rpx; color: #8a847b; font-size: 18rpx; }
.loading-dot { width: 18rpx; height: 18rpx; border-radius: 50%; background: #b49460; animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .35; transform: scale(.75); } }
@media (prefers-reduced-motion: reduce) { .loading-dot { animation: none; } }
@media (max-width: 420px) { .page { padding-right: 22rpx; padding-left: 22rpx; }.message-content { max-width: 82%; } }
</style>
