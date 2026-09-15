<template>
  <view class="agent-page brief-page">
    <view class="agent-header">
      <text class="agent-document-index">MEDIAMATCH / BRIEF 01</text>
      <view class="agent-header-copy">
        <text class="agent-eyebrow">{{ agentEyebrow }}</text>
        <text class="agent-title">{{ agentTitle }}</text>
        <text class="agent-subtitle">{{ agentSubtitle }}</text>
      </view>
      <view class="agent-header-actions"><view class="agent-session-state"><text class="agent-session-dot">•</text><text>SESSION OPEN</text></view><view class="clear-button" @tap="clearConversation">清空记录</view></view>
    </view>

    <scroll-view class="message-scroll" scroll-y :scroll-top="scrollTop" :scroll-with-animation="false">
      <view class="conversation">
        <view
          v-for="message in visibleMessages"
          :key="message.id"
          class="message-row"
          :class="message.role"
        >
          <view class="message-avatar" v-if="message.role === 'assistant'">栖</view>
          <view class="message-content">
            <text class="message-label">{{ message.role === 'assistant' ? 'RESEARCH NOTE' : 'YOU' }}</text>
            <view v-if="message.attachments?.length" class="message-attachments">
              <view v-for="attachment in message.attachments" :key="attachment.id || attachment.name" class="message-attachment">
                <image v-if="attachment.kind === 'image' && attachment.preview" class="message-attachment-image" :src="attachment.preview" mode="aspectFill" />
                <view v-else class="message-attachment-icon">{{ attachment.kind === 'image' ? '图' : '件' }}</view>
                <view class="message-attachment-copy"><text class="message-attachment-name">{{ attachment.name }}</text><text class="message-attachment-meta">{{ attachment.kind === 'image' ? '图片' : '文件' }}</text></view>
              </view>
            </view>
            <view class="message-bubble" :class="{ error: message.error }">
              <text selectable>{{ message.content || (message.streaming ? '正在整理…' : '') }}</text>
            </view>
      <view v-if="isResultReady(message)" class="result-ready-action">
        <view class="result-ready-copy"><text class="result-ready-label">NEXT STEP</text><text class="result-ready-title">{{ resultActionTitle(message.result) }}</text><text class="result-ready-desc">{{ resultActionDescription(message.result) }}</text></view>
        <view class="result-ready-actions"><text class="result-ready-detail" @tap="toggleResultDetails(message)">{{ shouldShowResultCard(message) ? '收起详情' : '查看已整理内容' }}</text><view class="result-ready-primary" @tap="handleResultPrimary(message)"><text>{{ resultPrimaryLabel(message) }}</text><text>→</text></view></view>
      </view>
      <view v-if="message.result && shouldShowResultCard(message)" class="result-card">
              <view class="result-card-head">
                <view><text class="result-label">{{ isServiceProvider ? '能力与找单条件' : '需求简报' }}</text><text v-if="message.result.fallback" class="fallback-label">按当前内容</text></view>
                <text class="result-confidence">{{ message.quality.score }}% 信息完整度</text>
              </view>
              <view class="result-meter"><view class="result-meter-fill" :style="{ width: message.quality.score + '%' }" /></view>
              <view v-if="message.result.usage_credit?.consumed" class="usage-credit-note"><text>本次内测体验 -1 次</text><text>剩余 {{ message.result.usage_credit.balance }} 次</text></view>
              <text class="result-summary">{{ message.result.summary }}</text>
              <view class="quality-summary" :class="'quality-' + message.quality.level">
                <view class="quality-head"><text class="quality-label">{{ message.quality.label }}</text><text class="quality-score">{{ message.quality.score }}/100</text></view>
                <text class="quality-next">{{ message.quality.next_step }}</text>
                <view v-if="message.quality.gaps?.length" class="quality-gaps"><text v-for="gap in message.quality.gaps" :key="gap">补充{{ gap }}</text></view>
              </view>
              <view class="conversation-state" :class="{ ready: message.result.recommendation_ready }">
                <view class="conversation-state-mark">{{ message.result.recommendation_ready ? '✓' : '·' }}</view>
                <view class="conversation-state-copy">
                  <text class="conversation-state-title">{{ conversationStateTitle(message.result) }}</text>
                  <text class="conversation-state-desc">{{ conversationStateDescription(message.result) }}</text>
                </view>
              </view>
              <view v-if="!isServiceProvider && message.result.project_phase && message.result.project_phase !== '待判断'" class="phase-note"><text class="phase-label">当前阶段</text><view><text class="phase-value">{{ message.result.project_phase }}</text><text v-if="message.result.phase_reason" class="phase-reason">{{ message.result.phase_reason }}</text></view></view>
              <view class="result-facts">
                <view><text>{{ isServiceProvider ? '擅长方向' : '找什么' }}</text><text>{{ displayValue(message.result.category) }}</text></view>
                <view><text>{{ isServiceProvider ? '目标城市' : '在哪儿' }}</text><text>{{ displayValue(message.result.region) }}</text></view>
                <view><text>{{ isServiceProvider ? '项目预算偏好' : '预算' }}</text><text>{{ displayValue(message.result.budget) }}</text></view>
                <view><text>{{ isServiceProvider ? '可承接时间' : '什么时候' }}</text><text>{{ displayValue(message.result.start_time) }}</text></view>
              </view>
              <view v-if="message.result.tags?.length" class="result-tags">
                <text v-for="tag in message.result.tags" :key="tag">{{ tag }}</text>
              </view>
                <view v-if="message.result.missing?.length" class="result-missing">
                <text class="missing-title">还缺这些</text>
                <text class="missing-copy">{{ message.result.missing.join('、') }}</text>
              </view>
              <view v-if="message.result.questions?.length" class="result-questions">
                <text class="questions-title">可以补这些</text>
                <text v-for="question in message.result.questions.slice(0, 2)" :key="question" class="question-chip" @tap="openEditor(message)">{{ question }} →</text>
              </view>
                <view v-if="editingMessageId === message.id" class="result-editor">
                  <view class="editor-heading"><view><text class="editor-title">修改这版内容</text><text class="editor-desc">保存后会重新计算匹配结果。</text></view><text class="editor-close" @tap="closeEditor">收起</text></view>
                <view class="editor-grid">
                  <view class="editor-field editor-field-full"><text>{{ isServiceProvider ? '能力简介' : '需求主题' }}</text><input v-model="editDraft.summary" maxlength="60" :placeholder="isServiceProvider ? '例如：擅长上海线下活动全案执行' : '例如：上海线下活动执行'" placeholder-class="editor-placeholder" /></view>
                  <view class="editor-field"><text>{{ isServiceProvider ? '擅长服务' : '想找什么' }}</text><input v-model="editDraft.category" maxlength="30" placeholder="例如：活动执行" placeholder-class="editor-placeholder" /></view>
                  <view class="editor-field"><text>{{ isServiceProvider ? '目标城市' : '地区' }}</text><input v-model="editDraft.region" maxlength="20" placeholder="例如：上海" placeholder-class="editor-placeholder" /></view>
                  <view class="editor-field"><text>{{ isServiceProvider ? '项目预算偏好（选填）' : '预算' }}</text><input v-model="editDraft.budget" maxlength="30" :placeholder="isServiceProvider ? '例如：不限或 5 万以上' : '例如：5 万'" placeholder-class="editor-placeholder" /></view>
                  <view class="editor-field editor-field-full"><text>{{ isServiceProvider ? '可承接时间（选填）' : '启动时间' }}</text><input v-model="editDraft.startTime" maxlength="30" :placeholder="isServiceProvider ? '例如：本月可启动' : '例如：6 月中旬'" placeholder-class="editor-placeholder" /></view>
                </view>
                <textarea v-model="editDraft.detail" class="editor-detail" auto-height maxlength="300" :placeholder="isServiceProvider ? '补充行业经验、案例资源或希望承接的项目类型…' : '补充交付内容、项目规模或特别要求…'" placeholder-class="editor-placeholder" />
                <view class="editor-actions"><text class="editor-cancel" @tap="closeEditor">暂不修改</text><view class="editor-submit" @tap="submitEdits(message)">保存并重新匹配</view></view>
              </view>
              <view v-if="!isServiceProvider && message.result.recommendation_ready && message.result.matches?.teams?.length" class="match-section">
                <view class="match-section-heading"><view><text class="match-section-kicker">符合条件的团队</text><text class="match-section-title">可以先看这几支团队</text></view><text class="match-section-count">{{ message.result.matches.teams.length }} 个结果</text></view>
                <text v-if="message.result.matches.meta?.strategy" class="match-strategy">按服务类型、地区、预算和近期响应排列</text>
                  <view v-for="team in message.result.matches.teams.slice(0, 6)" :key="team._id" class="team-match-card" @tap="viewTeam(team)">
                  <view class="team-avatar"><text>{{ initial(team.name) }}</text></view>
                  <view class="team-main"><view class="team-name-line"><view class="team-name-wrap"><text class="team-name">{{ team.name }}</text><text v-if="team.is_ai_team" class="ai-team-badge">自动回执</text></view><text class="team-score">{{ team.match_percent }}</text></view><text class="team-meta">{{ team.category_name }} · {{ team.region }} · {{ Number(team.rating || 0).toFixed(1) }} 分</text><view v-if="team.is_ai_team" class="ai-team-hint">用于验证联系流程，发送后会立即回复</view><view v-if="team.match_reasons?.length" class="match-reasons"><text v-for="reason in team.match_reasons.slice(0, 2)" :key="reason">{{ reason }}</text></view><view class="match-feedback"><text class="feedback-label">这条结果</text><text class="feedback-action" :class="{ selected: team.feedback_action === 'shortlisted' }" @tap="handleMatchFeedbackTap($event, message, 'team', team, 'shortlisted')">有用</text><text class="feedback-action" :class="{ selected: team.feedback_action === 'not_relevant' }" @tap="handleMatchFeedbackTap($event, message, 'team', team, 'not_relevant')">不合适</text></view></view>
                  <view class="team-contact" :class="{ pending: teamContactBusy(team) }" @tap.stop="handleContactTap($event, team)"><text class="team-contact-label">{{ teamContactBusy(team) ? '发送中…' : (teamContactLabel(team) || '申请联系') }}</text></view>
                </view>
              </view>
              <view v-if="!isServiceProvider && message.result.recommendation_ready && message.result.outreach_brief?.opening" class="outreach-note"><text class="outreach-label">FIRST OUTREACH</text><text class="outreach-title">首次沟通可以这样开始</text><text class="outreach-opening">{{ message.result.outreach_brief.opening }}</text><text v-if="message.result.outreach_brief.context" class="outreach-context">{{ message.result.outreach_brief.context }}</text><view v-if="message.result.outreach_brief.questions?.length" class="outreach-questions"><text v-for="question in message.result.outreach_brief.questions" :key="question">{{ question }}</text></view></view>
              <view v-if="isServiceProvider && message.result.recommendation_ready && message.result.matches?.demands?.length" class="match-section demand-match-section">
                <view class="match-section-heading"><view><text class="match-section-kicker">匹配项目</text><text class="match-section-title">这些项目正在寻找相关服务</text></view><text class="match-section-count">{{ Math.min(6, message.result.matches.demands.length) }} 条</text></view>
                <view v-for="demand in message.result.matches.demands.slice(0, 6)" :key="demand._id" class="demand-match-card" @tap="goMatchedDemand(demand)"><view class="demand-match-copy"><text class="demand-match-title">{{ demand.title }}</text><text class="demand-match-meta">{{ demand.company_name || '项目方' }} · {{ demand.region }} · {{ demand.match_percent }} 相近</text><view class="match-feedback"><text class="feedback-label">这条结果</text><text class="feedback-action" :class="{ selected: demand.feedback_action === 'shortlisted' }" @tap.stop="recordMatchFeedback(message, 'demand', demand, 'shortlisted')">有用</text><text class="feedback-action" :class="{ selected: demand.feedback_action === 'not_relevant' }" @tap.stop="recordMatchFeedback(message, 'demand', demand, 'not_relevant')">不合适</text></view></view><text class="demand-match-arrow">→</text></view>
              </view>
              <view class="result-actions">
                <view v-if="!isServiceProvider && message.result.recommendation_ready" class="apply-button" @tap="applyResult(message.result)">发布这条需求 <text>→</text></view>
                <text class="continue-button" @tap="openEditor(message)">{{ isServiceProvider ? '调整找单条件' : '补充或修改' }}</text>
              </view>
              <view v-if="linkedDemandId" class="linked-demand-action">
                <view class="linked-demand-copy">
                  <text class="linked-demand-label">这版内容对应一条已发布需求</text>
                  <text class="linked-demand-name">{{ linkedDemandLoading ? '正在读取需求…' : linkedDemandTitle }}</text>
                  <text class="linked-demand-hint">平台会按当前结果邀请几支团队，收到回复后再比较。</text>
                </view>
                <view class="invite-button" :class="{ disabled: invitingMessageId === message.id }" @tap="inviteMatchedTeams(message)">
                  <text>{{ invitingMessageId === message.id ? '邀请中…' : '邀请匹配团队' }}</text>
                </view>
              </view>
              <view v-if="message.proposalInvite" class="invite-result">
                <text>已邀请 {{ message.proposalInvite.created || 0 }} 支团队</text><text v-if="message.proposalInvite.reopened">，重新联系 {{ message.proposalInvite.reopened }} 支</text><text>，可以去需求详情查看回复。</text>
              </view>
            </view>
            <view v-if="message.error" class="retry-line" @tap="retryMessage(message)">重试这条</view>
          </view>
          <view class="message-avatar user-avatar" v-if="message.role === 'user'">我</view>
        </view>

        <view v-if="sending && !messages.some((message) => message.streaming)" class="message-row assistant">
          <view class="message-avatar">栖</view>
          <view class="message-content">
            <text class="message-label">RESEARCH NOTE</text>
            <view class="message-bubble typing-bubble"><text class="typing-dot" /><text class="typing-dot" /><text class="typing-dot" /></view>
          </view>
        </view>
      </view>
    </scroll-view>

    <scroll-view v-show="!hasUserMessage && !sending" class="quick-prompts" scroll-x>
      <view v-for="prompt in quickPrompts" :key="prompt" class="quick-prompt" @tap="sendPrompt(prompt)"><text>{{ prompt }}</text></view>
    </scroll-view>

    <view class="composer">
      <view v-if="attachments.length" class="composer-attachments">
        <view v-for="attachment in attachments" :key="attachment.id || attachment.name" class="composer-attachment">
          <image v-if="attachment.kind === 'image' && attachment.preview" class="composer-attachment-preview" :src="attachment.preview" mode="aspectFill" />
          <view v-else class="composer-attachment-icon">{{ attachment.kind === 'image' ? '图' : '件' }}</view>
          <text class="composer-attachment-name">{{ attachment.name }}</text>
          <text class="composer-attachment-remove" @tap="removeAttachment(attachment)">×</text>
        </view>
      </view>
      <view class="composer-tools">
        <view class="attach-trigger" :class="{ disabled: attachmentBusy || sending }" @tap="chooseAttachment('image')"><text class="attach-trigger-icon">＋</text><text>图片</text></view>
        <view class="attach-trigger" :class="{ disabled: attachmentBusy || sending }" @tap="chooseAttachment('file')"><text class="attach-trigger-icon">＋</text><text>文件</text></view>
        <text class="attachment-hint">{{ attachmentBusy ? '正在上传…' : '最多 3 个，单个不超过 15MB' }}</text>
      </view>
      <textarea
        ref="composerInput"
        v-model="inputText"
        class="composer-input"
        auto-height
        maxlength="500"
        :disabled="sending"
        :focus="inputFocused"
        :placeholder="composerPlaceholder"
        placeholder-class="composer-placeholder"
        @blur="inputFocused = false"
        @confirm="send"
      />
      <view class="composer-bottom">
        <text class="composer-hint">{{ inputText.length }}/500</text>
        <view class="send-button" :class="{ active: (inputText.trim() || attachments.length) && !sending, disabled: sending }" @tap="send">
        <text>{{ sending ? '处理中…' : '发送' }}</text><text class="send-arrow">↑</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { STORAGE_KEYS } from '@/config/constants'
import { buildAgentDraft } from '@/utils/agent'
import { scoreAgentQuality } from '@/api/contracts'
import { useNavTitle } from '@/hooks/useNavTitle'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { hasStoredAccessToken, scopedStorageKey } from '@/utils/session'
import { createStreamBuffer } from '@/utils/stream-buffer'
import { collapseRetriedFailures, getRetryPayload } from '@/utils/agent-conversation'

useNavTitle('titles.agent')
const userStore = useUserStore()

const messages = ref([])
const agentSessionId = ref('')
const inputText = ref('')
const attachments = ref([])
const attachmentBusy = ref(false)
const scrollTop = ref(0)
const sending = ref(false)
const lastFailedText = ref('')
const lastFailedAttachments = ref([])
const composerInput = ref(null)
const inputFocused = ref(false)
const editingMessageId = ref('')
const editDraft = ref({ summary: '', category: '', region: '', budget: '', startTime: '', detail: '' })
const linkedDemandId = ref('')
const linkedDemand = ref(null)
const linkedDemandLoading = ref(false)
const invitingMessageId = ref('')
const contactingTeamId = ref('')
let scrollTimer = null
let demandContextRequest = 0

const hasUserMessage = computed(() => messages.value.some((message) => message.role === 'user'))
const isServiceProvider = computed(() => userStore.userInfo?.workflow_role === 'service_provider')
const assistantModeKey = computed(() => isServiceProvider.value ? 'service-provider' : 'demand-owner')
const serverScopeId = computed(() => isServiceProvider.value ? 'service_provider_search' : 'demand_owner')
const agentEyebrow = computed(() => isServiceProvider.value ? 'PROJECT SCOUT' : 'CURRENT BRIEF')
const agentTitle = computed(() => isServiceProvider.value ? '说清你的能力，找到适合参与的项目' : '把合作意图，整理成可以推进的需求')
const agentSubtitle = computed(() => isServiceProvider.value ? 'AI 会按服务能力、行业和城市，从已发布需求中筛选项目。' : '先聊清目标和交付，再决定什么时候发布、联系谁。')
const introMessage = computed(() => isServiceProvider.value
  ? '把你能提供的服务、擅长行业和希望承接的项目告诉我。信息不全也没关系，我们边聊边找。'
  : '把想找的项目或服务直接写下来就行。我们先把服务类型、地区、预算和时间列清楚，缺哪项再补。')
const quickPrompts = computed(() => isServiceProvider.value
  ? ['我们擅长品牌活动执行，想找上海项目', '可做短视频和内容运营，想接长期项目', '我们有医疗行业渠道资源，找合作需求']
  : ['上海找活动执行团队', '预算 5 万，6 月开始', '想找长期合作的内容团队'])
const composerPlaceholder = computed(() => isServiceProvider.value ? '补充服务能力、行业、城市或项目偏好…' : '补充预算、地区、时间或交付内容…')
// 保留最近 20 条给 Agent 作为上下文，但页面只渲染最近 12 条，避免历史结果
// 卡片越来越多时拖慢滚动和输入响应。
const visibleMessages = computed(() => messages.value.length > 12 ? messages.value.slice(-12) : messages.value)
const userText = computed(() => messages.value.filter((message) => message.role === 'user').map((message) => message.content).join('；'))
const linkedDemandTitle = computed(() => linkedDemand.value?.title || linkedDemand.value?.name || linkedDemandId.value)

onMounted(loadConversation)
onLoad(loadDemandContext)

async function loadDemandContext(query = {}) {
  const demandId = String(query?.demandId || '').trim()
  const prefill = String(query?.prefill || '').trim().slice(0, 500)
  if (prefill) nextTick(() => focusInput(prefill))
  if (!demandId) return
  const requestId = ++demandContextRequest
  linkedDemandId.value = demandId
  linkedDemandLoading.value = true
  try {
    const detail = await bridge.demand.detail(demandId)
    if (requestId === demandContextRequest) linkedDemand.value = detail
  } catch (error) {
    console.warn('[agent] load linked demand failed:', error)
    if (requestId === demandContextRequest) linkedDemand.value = null
  } finally {
    if (requestId === demandContextRequest) linkedDemandLoading.value = false
  }
}

async function loadConversation() {
  try {
    agentSessionId.value = String(uni.getStorageSync(agentSessionStorageKey()) || '').trim()
    if (!agentSessionId.value) resetAgentSession()
    const stored = uni.getStorageSync(agentConversationStorageKey())
    if (Array.isArray(stored) && stored.length) {
      messages.value = collapseRetriedFailures(stored.slice(-20).map(hydrateMessage))
      if (messages.value.length !== stored.slice(-20).length) persistConversation()
    } else {
      resetMessages()
    }
  } catch {
    resetMessages()
  }
  if (userStore.isLoggedIn || hasStoredAccessToken()) {
    try {
      const remote = await bridge.agent.history({ scope: 'main', scope_id: serverScopeId.value })
      if (remote?.conversation?.id) {
        agentSessionId.value = remote.conversation.id
        uni.setStorageSync(agentSessionStorageKey(), agentSessionId.value)
      }
      if (Array.isArray(remote?.messages) && remote.messages.length) {
        messages.value = [
          { id: `agent_intro_remote_${Date.now()}`, role: 'assistant', content: introMessage.value, intro: true },
          ...remote.messages.slice(-20).map(hydrateMessage)
        ]
        persistConversation()
      }
    } catch (error) {
      console.warn('[agent] remote history unavailable, using local cache:', error)
    }
  }
  scrollToBottom()
}

function resetMessages() {
  resetAgentSession()
  messages.value = [{ id: `agent_intro_${Date.now()}`, role: 'assistant', content: introMessage.value, intro: true }]
}

function resetAgentSession() {
  agentSessionId.value = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  try { uni.setStorageSync(agentSessionStorageKey(), agentSessionId.value) } catch (error) { console.warn('[agent] save session failed:', error) }
}

function persistConversation() {
  try { uni.setStorageSync(agentConversationStorageKey(), messages.value.slice(-20)) } catch (error) { console.warn('[agent] save conversation failed:', error) }
}

function conversationOwnerKey() { return scopedStorageKey('agent-owner', userStore.userId).split(':').pop() }
function agentSessionStorageKey() { return `${STORAGE_KEYS.AGENT_SESSION}:${conversationOwnerKey()}:${assistantModeKey.value}` }
function agentConversationStorageKey() { return `${STORAGE_KEYS.AGENT_CONVERSATION}:${conversationOwnerKey()}:${assistantModeKey.value}` }

// 质量分数只需在结果写入时计算一次。模板每次输入、滚动或上传附件触发
// 更新时不再重复执行评分逻辑，尤其能减轻低端小程序设备的重排。
function hydrateMessage(message) {
  if (!message?.result) return message
  return { ...message, quality: message.quality || qualityFor(message.result) }
}

function scrollToBottom() {
  if (scrollTimer) clearTimeout(scrollTimer)
  // uni-app H5 的 scroll-view 内部节点要在首帧后才可滚动；过早写 scrollTop
  // 会触发 scrollHeight 为空的运行时错误，也会让页面首屏位置跳一下。
  scrollTimer = setTimeout(() => {
    nextTick(() => {
      if (!messages.value.length) return
      scrollTop.value = 999999
    })
  }, 60)
}

function focusInput(prefill = '') {
  if (prefill) inputText.value = prefill
  inputFocused.value = false
  nextTick(() => {
    inputFocused.value = true
    const target = composerInput.value?.$el || composerInput.value
    target?.focus?.()
    target?.querySelector?.('textarea')?.focus?.()
    scrollToBottom()
  })
}

function openEditor(message) {
  const result = message?.result || {}
  editingMessageId.value = message?.id || ''
  editDraft.value = {
    summary: editableValue(result.summary),
    category: editableValue(result.category),
    region: editableValue(result.region),
    budget: editableValue(result.budget),
    startTime: editableValue(result.start_time),
    detail: ''
  }
  scrollToBottom()
}

function closeEditor() {
  editingMessageId.value = ''
  editDraft.value = { summary: '', category: '', region: '', budget: '', startTime: '', detail: '' }
}

function submitEdits(message) {
  if (sending.value) return
  const result = message?.result || {}
  const updates = []
  if (editDraft.value.summary && editDraft.value.summary !== editableValue(result.summary)) updates.push(`${isServiceProvider.value ? '能力简介' : '需求主题'}：${editDraft.value.summary}`)
  if (editDraft.value.category && editDraft.value.category !== editableValue(result.category)) updates.push(`${isServiceProvider.value ? '擅长服务' : '服务类型'}：${editDraft.value.category}`)
  if (editDraft.value.region && editDraft.value.region !== editableValue(result.region)) updates.push(`${isServiceProvider.value ? '目标城市' : '地区'}：${editDraft.value.region}`)
  if (editDraft.value.budget && editDraft.value.budget !== editableValue(result.budget)) updates.push(`${isServiceProvider.value ? '项目预算偏好' : '预算'}：${editDraft.value.budget}`)
  if (editDraft.value.startTime && editDraft.value.startTime !== editableValue(result.start_time)) updates.push(`${isServiceProvider.value ? '可承接时间' : '启动时间'}：${editDraft.value.startTime}`)
  if (editDraft.value.detail.trim()) updates.push(`${isServiceProvider.value ? '补充能力' : '补充要求'}：${editDraft.value.detail.trim()}`)

  if (!updates.length) {
    uni.showToast({ title: '先填写或修改一项再更新', icon: 'none' })
    return
  }
  closeEditor()
  inputText.value = updates.join('；')
  send()
}

async function sendPrompt(prompt) {
  inputText.value = prompt
  await send()
}

async function send({ retryAssistantId = '' } = {}) {
  if (sending.value) return
  const retry = retryAssistantId
    ? getRetryPayload(messages.value, retryAssistantId, {
      text: lastFailedText.value,
      attachments: lastFailedAttachments.value
    })
    : null
  const text = retry ? retry.text : inputText.value.trim()
  const outgoingAttachments = retry ? retry.attachments : attachments.value.slice()
  if ((!text && !outgoingAttachments.length) || (retryAssistantId && !retry)) return
  if (!userStore.isLoggedIn && !hasStoredAccessToken()) {
    uni.showToast({ title: '请先登录后继续对话', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/user/login' }), 250)
    return
  }

  const history = (retry ? messages.value.slice(0, retry.userIndex) : messages.value)
    .filter((message) => !message.intro && !message.error && !message.streaming && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({ role: message.role, content: message.content, attachments: message.attachments || [] }))

  const displayText = text || `已上传 ${outgoingAttachments.length} 个附件`
  let assistantMessageId = ''
  let clientMessageId = retry?.clientMessageId || ''
  if (retry) {
    assistantMessageId = retry.assistantId
    if (!clientMessageId) {
      clientMessageId = `agent_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      patchMessage(messages.value[retry.userIndex]?.id, { client_message_id: clientMessageId, clientMessageId })
    }
    patchMessage(assistantMessageId, { content: '', result: null, quality: null, streaming: true, error: false })
  } else {
    clientMessageId = `agent_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    messages.value.push({
      id: `agent_user_${Date.now()}`,
      role: 'user',
      content: displayText,
      requestText: text,
      attachments: outgoingAttachments,
      client_message_id: clientMessageId,
      clientMessageId
    })
    assistantMessageId = `agent_assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    messages.value = [...messages.value, { id: assistantMessageId, role: 'assistant', content: '', streaming: true }]
  }
  inputText.value = ''
  attachments.value = []
  inputFocused.value = false
  closeEditor()
  lastFailedText.value = ''
  sending.value = true
  persistConversation()
  scrollToBottom()

  scrollToBottom()

  let streamed = false
  let streamedContent = ''
  let deltaBuffer = null
  try {
    deltaBuffer = createStreamBuffer({
      delay: 32,
      onFlush: (delta) => {
        streamed = true
        streamedContent += delta
        patchMessage(assistantMessageId, { content: streamedContent, streaming: true })
        scrollToBottom()
      }
    })
    const result = await bridge.agent.chatStream(
      { text, attachments: outgoingAttachments, history, result: latestResult(), session_id: agentSessionId.value, client_message_id: clientMessageId },
      {
        onStatus: (status) => {
          if (status === 'retrying') return
          if (!streamed) {
            patchMessage(assistantMessageId, {
              content: status === 'matching'
                ? (isServiceProvider.value ? '正在筛选匹配项目…' : '正在筛选合适的团队…')
                : (isServiceProvider.value ? '正在理解你的服务能力…' : '正在整理你的需求…'),
              streaming: true
            })
          }
          scrollToBottom()
        },
        onRetry: () => {
          deltaBuffer.clear()
          streamed = false
          streamedContent = ''
          patchMessage(assistantMessageId, { content: '', streaming: true })
          scrollToBottom()
        },
        onDelta: (delta) => {
          deltaBuffer.push(delta)
        }
      }
    )
    if (result?.session_id) {
      agentSessionId.value = String(result.session_id)
      try { uni.setStorageSync(agentSessionStorageKey(), agentSessionId.value) } catch {}
    }
    // result 事件到达时，最后一帧可能还在缓冲区，先刷完再落正式结果。
    deltaBuffer.flush()
    const fullReply = result.reply || fallbackReply(result)
    if (!streamed) await revealReply(assistantMessageId, fullReply)
    patchMessage(assistantMessageId, {
      content: fullReply,
      result,
      quality: qualityFor(result),
      streaming: false,
      error: false
    })
    persistConversation()
    lastFailedText.value = ''
    lastFailedAttachments.value = []
    if (isResultReady({ result })) {
      uni.showToast({ title: isServiceProvider.value ? '已整理好，可以查看匹配项目' : '信息已整理好，可以选择发布或展开查看', icon: 'none' })
    }
  } catch (error) {
    console.warn('[agent] conversation failed:', error)
    deltaBuffer?.flush()
    lastFailedText.value = text
    lastFailedAttachments.value = outgoingAttachments
    patchMessage(assistantMessageId, {
      streaming: false,
      error: true,
      content: streamedContent || (isServiceProvider.value
        ? '暂时没收到回复，刚才的内容还在。可以再试一次，也可以先去需求广场浏览项目。'
        : '暂时没收到回复，刚才的内容还在。可以再试一次，也可以去发布页手动填写。')
    })
    persistConversation()
    toastError('回复暂时没收到')
  } finally {
    deltaBuffer?.stop()
    sending.value = false
    scrollToBottom()
  }
}

function latestResult() {
  for (let index = messages.value.length - 1; index >= 0; index -= 1) {
    if (messages.value[index]?.result) return messages.value[index].result
  }
  return null
}

function fallbackReply(result) {
  const missing = Array.isArray(result?.missing) ? result.missing.slice(0, 2) : []
  if (isServiceProvider.value) return missing.length ? `已记下目前的能力方向。再补充${missing.join('、')}，找项目会更准。` : '你的能力与找单条件已经整理好，可以查看匹配项目。'
  return missing.length ? `已把目前写到的内容列好了。再补充${missing.join('、')}，找团队时会更方便。` : '这版信息已经比较完整，可以先检查一下，再带入发布页。'
}

function retryMessage(message) {
  if (sending.value || !message?.id) return
  void send({ retryAssistantId: message.id })
}

function isResultReady(message) {
  const result = message?.result
  if (!result || message?.intro) return false
  return result.recommendation_ready === true || result.conversation_complete === true
}

function shouldShowResultCard(message) {
  return isResultReady(message) && message?.show_result_card === true
}

function toggleResultDetails(message) {
  if (!message?.id) return
  patchMessage(message.id, { show_result_card: !message.show_result_card })
  nextTick(scrollToBottom)
}

function resultActionTitle(result = {}) {
  const count = resultMatchCount(result)
  if (isServiceProvider.value) return count ? `已找到 ${count} 个可继续了解的项目` : '能力方向已整理，暂未找到完全匹配的项目'
  return count ? `已找到 ${count} 个可继续了解的合作方` : '这版内容已经可以进入发布流程'
}

function resultActionDescription(result = {}) {
  const reason = String(result?.recommendation_reason || '').trim()
  if (isServiceProvider.value) return reason || '可以调整行业、城市或合作方向，继续缩小项目范围。'
  if (resultMatchCount(result)) return reason || '先看看合作方向和匹配依据，再决定是否发布这条需求。'
  return reason || '可以先发布需求；需要时再展开查看完整简报。'
}

function resultMatchCount(result = {}) {
  const values = isServiceProvider.value ? result?.matches?.demands : result?.matches?.teams
  return Array.isArray(values) ? Math.min(6, values.length) : 0
}

function resultPrimaryLabel(message) {
  const count = resultMatchCount(message?.result)
  if (count && !shouldShowResultCard(message)) return isServiceProvider.value ? `查看 ${count} 个项目` : `查看 ${count} 位合作方`
  return isServiceProvider.value ? '调整找单条件' : '发布需求'
}

function handleResultPrimary(message) {
  const count = resultMatchCount(message?.result)
  if (count && !shouldShowResultCard(message)) {
    patchMessage(message.id, { show_result_card: true })
    nextTick(scrollToBottom)
    return
  }
  if (isServiceProvider.value) return focusInput()
  applyResult(message?.result)
}

function conversationStateTitle(result = {}) {
  if (!result.recommendation_ready) return '先补一项关键信息'
  return isServiceProvider.value ? '能力已整理，可以查看项目' : '信息已整理，可以发布'
}

function conversationStateDescription(result = {}) {
  if (!result.recommendation_ready) return `还差：${result.next_action || '补充一个关键条件'}`
  return result.recommendation_reason || (isServiceProvider.value ? '已按当前条件筛选已发布项目。' : '已按当前条件排好，可以先看团队。')
}

function patchMessage(id, patch) {
  const messageId = String(id || '')
  if (!messageId) return
  messages.value = messages.value.map((message) => (
    message.id === messageId ? { ...message, ...patch } : message
  ))
}

async function revealReply(messageId, reply) {
  const text = String(reply || '')
  if (!text) return
  let content = ''
  for (let index = 0; index < text.length; index += 6) {
    content += text.slice(index, index + 6)
    patchMessage(messageId, { content, streaming: true })
    await new Promise((resolve) => setTimeout(resolve, 18))
    scrollToBottom()
  }
}

function removeAttachment(attachment) {
  attachments.value = attachments.value.filter((item) => item !== attachment && item.id !== attachment?.id)
}

async function chooseAttachment(kind = 'file') {
  if (attachmentBusy.value || sending.value) return
  const remaining = Math.max(0, 3 - attachments.value.length)
  if (!remaining) {
    uni.showToast({ title: '本轮最多上传 3 个附件', icon: 'none' })
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
      console.warn('[agent] attachment upload failed:', error)
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
  } catch (error) {
    console.warn('[agent] choose attachment failed:', error)
    toastError('打开文件选择器失败')
  }
}

function fileNameFromPath(path) {
  try {
    const value = decodeURIComponent(String(path || '').split('?')[0])
    return value.split('/').pop() || '未命名附件'
  } catch {
    return '未命名附件'
  }
}

function clearConversation() {
  uni.showModal({
    title: '清空这次对话？',
    content: '清空后不会影响已发布的需求。',
    success: (result) => {
      if (!result.confirm) return
      resetMessages()
      lastFailedText.value = ''
      lastFailedAttachments.value = []
      attachments.value = []
      closeEditor()
      try { uni.removeStorageSync(agentConversationStorageKey()) } catch {}
      scrollToBottom()
    }
  })
}

function applyResult(result) {
  const sourceText = userText.value.trim()
  try {
    // Agent 结果代表用户刚刚确认的这一版，不能被上次手动保存的旧草稿覆盖。
    uni.removeStorageSync(scopedStorageKey(STORAGE_KEYS.DEMAND_DRAFT, userStore.userId))
    uni.setStorageSync(scopedStorageKey(STORAGE_KEYS.AGENT_DRAFT, userStore.userId), buildAgentDraft(sourceText, result || {}, agentSessionId.value))
  } catch (error) { console.warn('[agent] save draft failed:', error) }
  void bridge.agent.telemetry({
    event_type: 'draft_applied',
    session_id: agentSessionId.value,
    source: result?.source || 'agent',
    fallback: Boolean(result?.fallback),
    fallback_reason: result?.fallback_reason || '',
    quality: result?.quality || {},
    metadata: { source: result?.source || 'agent' }
  }).catch((error) => console.warn('[agent] draft telemetry failed:', error))
  uni.navigateTo({ url: '/pages/demand/publish' })
}

function qualityFor(result) {
  if (isServiceProvider.value) return scoreAgentQuality(result || {}, { mode: 'service_provider_search' })
  return result?.quality || scoreAgentQuality(result || {})
}
function editableValue(value) {
  const text = String(value || '').trim()
  return !text || text === '未指定' || text === '未识别' ? '' : text
}
function displayValue(value) {
  const text = String(value || '').trim()
  return !text || text === '未指定' || text === '未识别' ? '待补充' : text
}
function initial(value) { return String(value || '团').trim().slice(0, 1) || '团' }
function teamContactKey(team) { return String(team?.contact_user_id || '').trim() }
function teamContactBusy(team) { return Boolean(teamContactKey(team) && contactingTeamId.value === teamContactKey(team)) }
function teamContactLabel(team) {
  if (team?.contact_ready) return '进入对话'
  return linkedDemandId.value ? '发起邀约' : '申请联系'
}
function handleMatchFeedbackTap(event, ...args) {
  event?.stopPropagation?.()
  event?.preventDefault?.()
  return recordMatchFeedback(...args)
}
function handleContactTap(event, team) {
  event?.stopPropagation?.()
  event?.preventDefault?.()
  return contactTeam(team)
}
async function recordMatchFeedback(message, targetType, target, action) {
  const targetId = String(target?.id || target?._id || '').trim()
  if (!targetId) return
  const previousAction = target.feedback_action
  target.feedback_action = action
  try {
    await bridge.agent.feedback({
      target_type: targetType,
      target_id: targetId,
      action,
      context: {
        category_id: message?.result?.category_id || '',
        region: message?.result?.region || '',
        keywords: message?.result?.keywords || []
      }
    })
    persistConversation()
    // “申请联系/发起邀约”也会记录 contacted 行为，但它不是负反馈，不能弹出“已减少类似结果”。
    if (action === 'shortlisted' || action === 'not_relevant') {
      uni.showToast({ title: action === 'shortlisted' ? '已记住这类结果' : '已减少类似结果', icon: 'none' })
    }
  } catch (error) {
    target.feedback_action = previousAction
    console.warn('[agent] feedback failed:', error)
    toastError('反馈暂时没有保存')
  }
}
function viewTeam(team) {
  const userId = String(team?.contact_user_id || team?._id || '').trim()
  if (!userId) return
  void recordMatchFeedback(null, 'team', team, 'viewed')
  uni.navigateTo({ url: `/pages/profile/index?id=${encodeURIComponent(userId)}` })
}
async function contactTeam(team) {
  const userId = teamContactKey(team)
  if (!userId) return viewTeam(team)

  if (team?.contact_ready) {
    void recordMatchFeedback(null, 'team', team, 'contacted')
    return uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(team.contact_user_name || team.name || '')}` })
  }

  // Agent 关联了已发布需求时，点击团队应进入真实提案链路，
  // 不能直接打开一个尚未授权的私聊页。
  if (linkedDemandId.value) {
    if (linkedDemand.value?.status && linkedDemand.value.status !== 'published') {
      uni.showToast({ title: '需求审核通过后才能发起邀约', icon: 'none' })
      return
    }
    if (contactingTeamId.value === userId) return
    contactingTeamId.value = userId
    try {
      const result = await bridge.proposal.invite(linkedDemandId.value, {
        provider_ids: [userId],
        message: `平台根据“${linkedDemandTitle.value}”整理出的合作邀约，请查看需求并回复方案。`
      })
      void recordMatchFeedback(null, 'team', team, 'contacted')
      const count = Number(result?.created || 0) + Number(result?.reopened || 0)
      uni.showToast({ title: count ? '邀约已发出，等待团队回复' : '这支团队已在提案池中', icon: 'success' })
    } catch (error) {
      console.warn('[agent] contact team failed:', error)
      toastError(error?.message || '邀约暂时没有发出去')
    } finally {
      contactingTeamId.value = ''
    }
    return
  }

  // 没有关联需求时，先建立真实的人脉申请；对方通过后再进入私聊。
  try {
    const result = await bridge.network.sendFriendRequest({
      target_user_id: userId,
      message: '在媒合智联看到你的服务介绍，想进一步聊聊合作。'
    })
    void recordMatchFeedback(null, 'team', team, 'contacted')
    if (result?.friend_status === 'friends' || result?.status === 'accepted') {
      return uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(team.contact_user_name || team.name || '')}` })
    }
    uni.showToast({ title: '联系申请已发出，等对方回复', icon: 'success' })
  } catch (error) {
    console.warn('[agent] friend request failed:', error)
    toastError(error?.message || '联系申请暂时没有发出去')
  }
}
function goMatchedDemand(demand) {
  const id = String(demand?._id || demand?.id || '').trim()
  if (id) {
    void recordMatchFeedback(null, 'demand', demand, 'viewed')
    uni.navigateTo({ url: `/pages/demand/detail?id=${encodeURIComponent(id)}` })
  }
}

async function inviteMatchedTeams(message) {
  if (!linkedDemandId.value || invitingMessageId.value || !message?.result) return
  if (linkedDemand.value && linkedDemand.value.status && linkedDemand.value.status !== 'published') {
    uni.showToast({ title: '这条需求当前不能邀约', icon: 'none' })
    return
  }
  invitingMessageId.value = message.id
  try {
    const result = await bridge.proposal.inviteMatches(linkedDemandId.value, {
      limit: 6,
      message: `平台根据“${message.result.summary || linkedDemandTitle.value}”整理出的合作邀请。`
    })
    message.proposalInvite = result
    persistConversation()
    const created = Number(result?.created || 0)
    const reopened = Number(result?.reopened || 0)
    uni.showToast({ title: created || reopened ? `已邀请 ${created + reopened} 支团队` : '这支团队已在申请列表中', icon: 'success' })
  } catch (error) {
    console.warn('[agent] invite matched teams failed:', error)
    toastError('团队申请暂时没发出去')
  } finally {
    invitingMessageId.value = ''
  }
}
</script>

<style scoped>
.agent-page { display: flex; flex-direction: column; min-height: 100vh; height: 100vh; overflow: hidden; color: #28334e; background: #f5f7fb; box-sizing: border-box; }
/* #ifdef H5 */
.agent-page { height: calc(100vh - 44px); }
/* #endif */
.agent-header { position:relative; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; padding:22rpx 24rpx 18rpx; background:#fff; border-bottom:1rpx solid #edf0f5; box-shadow:0 4rpx 16rpx rgba(63,79,119,.035); }
.agent-header-copy { display:flex; flex-direction:column; min-width:0; }
.agent-eyebrow { color:#6573dc; font-size:20rpx; font-weight:700; letter-spacing:.08em; }
.agent-title { margin-top:6rpx; color:#29344f; font-size:34rpx; font-weight:800; letter-spacing:-.04em; }
.agent-subtitle { margin-top:6rpx; overflow:hidden; color:#9aa6b9; font-size:21rpx; text-overflow:ellipsis; white-space:nowrap; }
.clear-button { padding: 10rpx 14rpx; border: 1rpx solid #e4e8f1; border-radius: 12rpx; color: #8490a7; background: #fafbfc; font-size: 21rpx; }
.message-scroll { flex: 1; min-height: 0; }
.conversation { padding:24rpx 20rpx 16rpx; }
.message-row { display:flex; align-items:flex-start; margin-bottom:22rpx; }
.message-row.user { justify-content: flex-end; }
.message-avatar { display: flex; align-items: center; justify-content: center; flex: 0 0 58rpx; width: 58rpx; height: 58rpx; margin-right: 14rpx; border-radius: 18rpx; color: #fff; background: linear-gradient(145deg, #6975dc, #8e79d9); font-size: 24rpx; font-weight: 800; box-shadow: 0 8rpx 16rpx rgba(100, 112, 210, .17); }
.message-content { max-width:calc(100% - 72rpx); min-width:0; }
.message-row.user .message-content { max-width:82%; }
.message-row.user .message-content { display: flex; flex-direction: column; align-items: flex-end; }
.message-label { display: block; margin: 0 8rpx 7rpx; color: #a0aabd; font-size: 19rpx; }
.message-bubble { padding:16rpx 18rpx; border:1rpx solid #e9edf4; border-radius:18rpx; color:#3b4864; background:#fff; font-size:26rpx; line-height:1.52; box-shadow:0 5rpx 18rpx rgba(63,79,119,.04); }
.message-row.user .message-bubble { border: 0; border-top-right-radius: 5rpx; color: #fff; background: linear-gradient(135deg, #6573dc, #7c76d8); box-shadow: 0 8rpx 18rpx rgba(101, 115, 220, .18); }
.message-bubble.error { border-color: #f2d9d2; color: #bd6c5c; background: #fff7f4; }
.message-attachments { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8rpx; margin: 0 0 8rpx; }
.message-row.assistant .message-attachments { justify-content: flex-start; }
.message-attachment { display: flex; align-items: center; gap: 7rpx; max-width: 320rpx; padding: 7rpx 9rpx; border: 1rpx solid #e2e6f0; border-radius: 10rpx; background: #fff; }
.message-attachment-image { width: 58rpx; height: 58rpx; border-radius: 8rpx; background: #eef1f7; }
.message-attachment-icon,.composer-attachment-icon { display: flex; align-items: center; justify-content: center; width: 42rpx; height: 42rpx; flex: 0 0 auto; border-radius: 9rpx; color: #6573dc; background: #eef0ff; font-size: 17rpx; font-weight: 750; }
.message-attachment-copy { display: flex; flex-direction: column; min-width: 0; }
.message-attachment-name { max-width: 220rpx; overflow: hidden; color: #4b5874; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }
.message-attachment-meta { margin-top: 3rpx; color: #a0aabd; font-size: 14rpx; }
.typing-bubble { display: flex; align-items: center; min-width: 76rpx; height: 62rpx; box-sizing: border-box; }
.typing-dot { width: 11rpx; height: 11rpx; margin: 0 4rpx; border-radius: 50%; background: #8994b0; opacity: .55; animation: typing 1.2s ease-in-out infinite; }
.typing-dot:nth-child(2) { animation-delay: .15s; }.typing-dot:nth-child(3) { animation-delay: .3s; }
.result-card { margin-top:12rpx; padding:18rpx; border:1rpx solid #e6e9f5; border-radius:18rpx; background:#fbfcff; }
.result-card-head, .result-actions { display: flex; align-items: center; justify-content: space-between; }
.result-label { color: #5865c9; font-size: 22rpx; font-weight: 750; }.fallback-label { margin-left: 10rpx; padding: 4rpx 8rpx; border-radius: 7rpx; color: #b77952; background: #fff1e6; font-size: 18rpx; }
	.result-confidence { color: #9aa6b9; font-size: 19rpx; }.result-meter { height: 8rpx; margin-top: 12rpx; overflow: hidden; border-radius: 8rpx; background: #e8ebf6; }.result-meter-fill { height: 100%; border-radius: 8rpx; background: linear-gradient(90deg, #6573dc, #8e7bdc); }
	.usage-credit-note { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; margin-top: 10rpx; padding: 8rpx 10rpx; border: 1rpx solid #dcefe8; border-radius: 8rpx; color: #2f806c; background: #f1fbf7; font-size: 16rpx; line-height: 1.35; }
	.quality-summary { margin-top: 12rpx; padding: 12rpx; border-radius: 12rpx; background: #f4f6ff; }.quality-summary.quality-ready { background: #edf9f4; }.quality-summary.quality-needs_more { background: #fff5ed; }.quality-head { display: flex; align-items: center; justify-content: space-between; }.quality-label { color: #5968d8; font-size: 19rpx; font-weight: 750; }.quality-ready .quality-label { color: #2f9b82; }.quality-needs_more .quality-label { color: #b77952; }.quality-score { color: #9aa6b9; font-size: 17rpx; }.quality-next { display: block; margin-top: 6rpx; color: #7e8ba2; font-size: 17rpx; line-height: 1.45; }.quality-gaps { display: flex; flex-wrap: wrap; gap: 6rpx; margin-top: 8rpx; }.quality-gaps text { padding: 4rpx 7rpx; border-radius: 7rpx; color: #a86c51; background: rgba(255,255,255,.72); font-size: 15rpx; }
.result-summary { display: block; margin-top: 16rpx; color: #37445f; font-size: 25rpx; font-weight: 650; line-height: 1.5; }
.conversation-state { display:flex; align-items:flex-start; gap:10rpx; margin-top:14rpx; padding:12rpx; border:1rpx solid #f0dfd3; border-radius:12rpx; background:#fff8f2; }.conversation-state.ready { border-color:#dcefe8; background:#f1fbf7; }.conversation-state-mark { display:flex; align-items:center; justify-content:center; width:30rpx; height:30rpx; flex:0 0 auto; border-radius:50%; color:#c7835e; background:#ffe3d1; font-size:20rpx; font-weight:800; }.conversation-state.ready .conversation-state-mark { color:#218c73; background:#ccefe2; }.conversation-state-copy { display:flex; flex-direction:column; min-width:0; }.conversation-state-title { color:#8b5d47; font-size:18rpx; font-weight:750; }.conversation-state.ready .conversation-state-title { color:#27866e; }.conversation-state-desc { margin-top:3rpx; color:#a18c80; font-size:17rpx; line-height:1.4; }
	.result-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; margin-top: 16rpx; }.result-facts view { display: flex; flex-direction: column; padding: 12rpx; border-radius: 12rpx; background: #f2f4fb; }.result-facts view text:first-child { color: #9aa6b9; font-size: 18rpx; }.result-facts view text:last-child { margin-top: 4rpx; overflow: hidden; color: #45516c; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }
	.result-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 14rpx; }.result-tags text { padding: 5rpx 10rpx; border-radius: 8rpx; color: #6975cf; background: #eef0ff; font-size: 18rpx; }
	.result-missing { display: flex; align-items: center; gap: 10rpx; margin-top: 14rpx; padding: 12rpx; border-radius: 12rpx; color: #a86c51; background: #fff4ed; font-size: 19rpx; }.missing-title { font-weight: 700; }.missing-copy { flex: 1; }
	.result-questions { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 12rpx; }.questions-title { flex: 0 0 100%; color: #8f9bb0; font-size: 18rpx; }.question-chip { padding: 7rpx 10rpx; border-radius: 9rpx; color: #6070ca; background: #eef0ff; font-size: 18rpx; }
	.phase-note { display: flex; gap: 12rpx; margin-top: 12rpx; padding: 12rpx 0; border-top: 1rpx solid #e5e8ee; border-bottom: 1rpx solid #e5e8ee; }.phase-label,.outreach-label { flex: 0 0 auto; color: #929caf; font: 700 16rpx/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; }.phase-value,.phase-reason { display: block; }.phase-value { color: #45516b; font-size: 20rpx; font-weight: 700; }.phase-reason { margin-top: 4rpx; color: #7f8b9e; font-size: 18rpx; line-height: 1.45; }.outreach-note { margin-top: 15rpx; padding: 16rpx; border: 1rpx solid #e3e5e8; border-radius: 10rpx; background: #fbfaf7; }.outreach-title { display: block; margin-top: 6rpx; color: #35312b; font-size: 22rpx; font-weight: 700; }.outreach-opening,.outreach-context { display: block; margin-top: 10rpx; color: #5f5a52; font-size: 19rpx; line-height: 1.6; }.outreach-context { color: #888177; }.outreach-questions { display: flex; flex-direction: column; gap: 5rpx; margin-top: 11rpx; padding-top: 10rpx; border-top: 1rpx solid #e7e2d9; color: #665e53; font-size: 18rpx; line-height: 1.45; }
	.result-editor { margin-top: 15rpx; padding: 15rpx; border: 1rpx solid #dfe4f2; border-radius: 15rpx; background: #fff; }.editor-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; }.editor-title,.editor-desc { display: block; }.editor-title { color: #495673; font-size: 21rpx; font-weight: 750; }.editor-desc { margin-top: 4rpx; color: #99a5b7; font-size: 17rpx; line-height: 1.4; }.editor-close { flex: 0 0 auto; color: #7885a0; font-size: 18rpx; }.editor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10rpx; margin-top: 13rpx; }.editor-field { display: flex; flex-direction: column; min-width: 0; gap: 6rpx; padding: 10rpx; border-radius: 11rpx; background: #f6f7fb; }.editor-field-full { grid-column: 1 / -1; }.editor-field text { color: #98a4b7; font-size: 17rpx; }.editor-field input,.editor-detail { width: 100%; color: #46526d; font-size: 20rpx; box-sizing: border-box; }.editor-detail { display: block; min-height: 78rpx; margin-top: 10rpx; padding: 11rpx; border: 1rpx solid #e7eaf2; border-radius: 11rpx; background: #fbfcff; line-height: 1.45; }.editor-placeholder { color: #afb7c6; }.editor-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 13rpx; }.editor-cancel { color: #919bad; font-size: 18rpx; }.editor-submit { padding: 10rpx 13rpx; border-radius: 10rpx; color: #fff; background: #6573dc; font-size: 18rpx; font-weight: 700; }
	.match-strategy { display: block; margin-top: 6rpx; color: #9aa6b9; font-size: 16rpx; line-height: 1.35; }
  .match-section { margin-top: 16rpx; padding-top: 15rpx; border-top: 1rpx solid #e8ebf3; }.match-section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 10rpx; }.match-section-kicker,.match-section-title { display: block; }.match-section-kicker { color: #7d89a5; font-size: 16rpx; }.match-section-title { margin-top: 4rpx; color: #46526d; font-size: 21rpx; font-weight: 750; }.match-section-count { color: #6573dc; font-size: 17rpx; }.team-match-card { display: flex; align-items: flex-start; gap: 10rpx; margin-top: 10rpx; padding: 11rpx; border: 1rpx solid #e8ebf2; border-radius: 13rpx; background: #fff; }.team-avatar { display: flex; align-items: center; justify-content: center; width: 46rpx; height: 46rpx; flex: 0 0 auto; margin-top: 2rpx; border-radius: 14rpx; color: #fff; background: linear-gradient(145deg,#6975dc,#8d79d9); font-size: 20rpx; font-weight: 800; }.team-main { min-width: 0; flex: 1; }.team-name-line { display: flex; align-items: center; justify-content: space-between; gap: 8rpx; }.team-name-wrap { display: flex; align-items: center; min-width: 0; gap: 6rpx; }.team-name { overflow: hidden; color: #43506b; font-size: 20rpx; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }.ai-team-badge { flex: 0 0 auto; padding: 2rpx 6rpx; border-radius: 5rpx; color: #2f9b82; background: #e8f7f2; font-size: 13rpx; }.team-score { flex: 0 0 auto; color: #2f9b82; font-size: 17rpx; font-weight: 700; }.team-meta { display: block; margin-top: 4rpx; overflow: hidden; color: #98a4b7; font-size: 16rpx; text-overflow: ellipsis; white-space: nowrap; }.ai-team-hint { display: block; margin-top: 4rpx; color: #2f9b82; font-size: 14rpx; }.match-reasons { display: flex; gap: 6rpx; margin-top: 6rpx; overflow: hidden; }.match-reasons text { overflow: hidden; padding: 3rpx 6rpx; border-radius: 6rpx; color: #5b69bf; background: #f0f2ff; font-size: 14rpx; text-overflow: ellipsis; white-space: nowrap; }.team-contact { display: flex; align-items: center; justify-content: center; min-width: 136rpx; min-height: 64rpx; flex: 0 0 auto; padding: 0 12rpx; border-radius: 10rpx; color: #fff; background: #6573dc; font-size: 16rpx; line-height: 1.2; text-align: center; white-space: nowrap; position: relative; z-index: 2; overflow: visible; }.team-contact.pending { opacity: .62; }.team-contact-label { display: block; min-width: 5em; color: #fff !important; font-size: 16rpx; font-weight: 700; line-height: 1.2; text-align: center; white-space: nowrap; visibility: visible; }.demand-match-section { margin-top: 14rpx; }.demand-match-card { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; margin-top: 10rpx; padding: 12rpx; border-radius: 12rpx; background: #f5f7fc; }.demand-match-title,.demand-match-meta { display: block; }.demand-match-title { overflow: hidden; color: #4a5670; font-size: 20rpx; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }.demand-match-meta { margin-top: 5rpx; overflow: hidden; color: #97a3b5; font-size: 16rpx; text-overflow: ellipsis; white-space: nowrap; }.demand-match-arrow { flex: 0 0 auto; color: #7180d5; font-size: 24rpx; }
	.match-feedback { position: relative; z-index: 2; display: flex; align-items: center; gap: 8rpx; margin-top: 7rpx; }.feedback-label { color: #a1aabb; font-size: 15rpx; }.feedback-action { display: inline-flex; align-items: center; justify-content: center; min-height: 44rpx; padding: 3rpx 9rpx; border: 1rpx solid #e2e6f0; border-radius: 7rpx; color: #7b87a0; background: #fafbfe; font-size: 15rpx; line-height: 1.2; }.feedback-action.selected { border-color: #cdd3ff; color: #5d6bd0; background: #eef0ff; }.demand-match-copy { min-width: 0; flex: 1; }
	.result-actions { margin-top: 18rpx; }.apply-button { padding: 12rpx 16rpx; border-radius: 12rpx; color: #fff; background: #6573dc; font-size: 21rpx; font-weight: 700; }.apply-button text { margin-left: 6rpx; }.continue-button { color: #6573dc; font-size: 21rpx; }
.linked-demand-action { display:flex; align-items:center; gap:12rpx; margin-top:14rpx; padding:13rpx; border:1rpx solid #e4e8f8; border-radius:14rpx; background:#f5f6ff; }.linked-demand-copy { min-width:0; flex:1; }.linked-demand-label,.linked-demand-name,.linked-demand-hint { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.linked-demand-label { color:#7d88a3; font-size:17rpx; }.linked-demand-name { margin-top:4rpx; color:#4e5cc2; font-size:20rpx; font-weight:750; }.linked-demand-hint { margin-top:4rpx; color:#9aa5ba; font-size:16rpx; }.invite-button { flex:0 0 auto; padding:10rpx 13rpx; border-radius:10rpx; color:#fff; background:#6573dc; font-size:18rpx; font-weight:700; }.invite-button.disabled { opacity:.6; }.invite-result { margin-top:9rpx; color:#5d9a82; font-size:17rpx; line-height:1.45; }
.retry-line { margin-top: 10rpx; color: #c27864; font-size: 20rpx; text-align: right; }
.quick-prompts { flex:0 0 auto; white-space:nowrap; padding:10rpx 20rpx 12rpx; background:#fff; border-top:1rpx solid #edf0f5; }.quick-prompt { display: inline-block; margin-right: 10rpx; padding: 11rpx 16rpx; border: 1rpx solid #e3e7f1; border-radius: 24rpx; color: #68748b; background: #fafbfe; font-size: 21rpx; }
.composer { flex:0 0 auto; padding:12rpx 20rpx calc(12rpx + env(safe-area-inset-bottom)); background:#fff; border-top:1rpx solid #e7eaf0; }.composer-attachments { display:flex; flex-wrap:wrap; gap:8rpx; margin-bottom:10rpx; }.composer-attachment { display:flex; align-items:center; gap:6rpx; max-width:310rpx; padding:6rpx 8rpx; border:1rpx solid #e0e5f1; border-radius:10rpx; background:#f8f9fd; }.composer-attachment-preview { width:46rpx; height:46rpx; border-radius:7rpx; background:#eef1f7; }.composer-attachment-name { max-width:210rpx; overflow:hidden; color:#55617a; font-size:17rpx; text-overflow:ellipsis; white-space:nowrap; }.composer-attachment-remove { padding:0 4rpx; color:#a0aabd; font-size:25rpx; line-height:1; }.composer-tools { display:flex; align-items:center; gap:10rpx; margin-bottom:10rpx; }.attach-trigger { display:flex; align-items:center; gap:3rpx; padding:7rpx 10rpx; border:1rpx solid #e2e6f0; border-radius:10rpx; color:#6573dc; background:#fafbff; font-size:18rpx; }.attach-trigger.disabled { opacity:.5; }.attach-trigger-icon { font-size:22rpx; line-height:1; }.attachment-hint { color:#a6b0c1; font-size:16rpx; }.composer-input { width:100%; min-height:64rpx; max-height:180rpx; padding:14rpx 16rpx; box-sizing:border-box; border:1rpx solid #e5e8f0; border-radius:15rpx; color:#35415d; background:#f8f9fc; font-size:25rpx; line-height:1.45; }.composer-placeholder { color: #a6b0c1; }.composer-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 10rpx; }.composer-hint { color: #a6b0c1; font-size: 18rpx; }.send-button { display: flex; align-items: center; gap: 8rpx; padding: 11rpx 18rpx; border-radius: 13rpx; color: #a2aabd; background: #edf0f6; font-size: 21rpx; }.send-button.active { color: #fff; background: linear-gradient(135deg, #6573dc, #7b77d9); }.send-button.disabled { opacity: .7; }.send-arrow { font-size: 26rpx; font-weight: 800; }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-5rpx); opacity: 1; } }

/* Enterprise pass: 保留对话结构，收掉装饰性渐变，让“下一步”成为唯一视觉重点。 */
.agent-page { color: #1F2329; background: #F5F6F8; }
.agent-header { border-bottom-color: #E5E6EB; box-shadow: none; }
.agent-eyebrow { color: #1677FF; }
.agent-title { color: #1F2329; }
.clear-button { border-color: #D9DDE3; color: #646A73; background: #FFF; border-radius: 8rpx; }
.message-avatar { width: 54rpx; height: 54rpx; flex-basis: 54rpx; margin-right: 12rpx; border-radius: 10rpx; background: #1677FF; box-shadow: none; }
.message-row.user .message-avatar { margin-right: 0; margin-left: 12rpx; background: #646A73; }
.message-bubble { border-color: #E5E6EB; border-radius: 12rpx; color: #1F2329; box-shadow: 0 2rpx 8rpx rgba(31,35,41,.03); }
.message-row.user .message-bubble { background: #1677FF; box-shadow: none; }
.message-attachment-icon,.composer-attachment-icon { border-radius: 8rpx; color: #1677FF; background: #E8F3FF; }
.result-card { border-color: #D9E7F7; border-top: 3rpx solid #1677FF; border-radius: 12rpx; background: #FFF; }
.result-label { color: #0958D9; }
.result-meter-fill { background: #1677FF; }
.quality-summary { border: 1rpx solid #E8F3FF; background: #F7FBFF; }
.result-tags text, .question-chip { color: #0958D9; background: #E8F3FF; }
.editor-submit, .apply-button, .invite-button { border-radius: 8rpx; background: #1677FF; }
.team-avatar { border-radius: 10rpx; background: #1677FF; }
.team-contact { border-radius: 8rpx; background: #4C8067; }
.team-contact-label { display: block; min-width: 5em; color: #FFFFFF !important; font-size: 16rpx; font-weight: 700; line-height: 1.2; text-align: center; white-space: nowrap; visibility: visible; }
.match-section-count, .continue-button { color: #1677FF; }
.linked-demand-action { border-color: #D9E7F7; border-radius: 10rpx; background: #F7FBFF; }
.linked-demand-name { color: #0958D9; }
.quick-prompts { border-top-color: #E5E6EB; }
.quick-prompt { border-radius: 8rpx; color: #646A73; background: #FFF; }
.composer { border-top-color: #E5E6EB; }
.attach-trigger { border-radius: 8rpx; color: #1677FF; background: #FFF; }
.composer-input { border-color: #D9DDE3; border-radius: 8rpx; background: #FFF; }
.send-button.active { border-radius: 8rpx; background: #1677FF; }

/* Quiet Intelligence v2：AI 以研究笔记呈现，用户输入只做轻量区分。 */
.agent-page { color: #191816; background: #f7f6f2; }
.agent-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 18rpx 28rpx;
  padding: 26rpx 36rpx 28rpx;
  border-bottom: 1rpx solid rgba(30, 27, 22, .11);
  background: #f7f6f2;
}
.agent-document-index { grid-column: 1 / -1; color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .13em; }
.agent-header-copy { min-width: 0; }
.agent-eyebrow { color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 15rpx; font-weight: 400; letter-spacing: .14em; }
.agent-title { max-width: 500rpx; margin-top: 10rpx; color: #191816; font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-size: 40rpx; font-weight: 400; letter-spacing: -.045em; line-height: 1.18; }
.agent-subtitle { margin-top: 12rpx; color: #6f6b63; font-size: 19rpx; font-weight: 400; }
.agent-header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 12rpx; }
.agent-session-state { color: #56624c; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13rpx; letter-spacing: .1em; }
.clear-button { padding: 8rpx 0; border: 0; border-bottom: 1rpx solid rgba(92, 40, 40, .3); border-radius: 0; color: #5c2828; background: transparent; font-size: 17rpx; }

.message-scroll { background: #f7f6f2; }
.conversation { max-width: 660rpx; margin: 0 auto; padding: 40rpx 36rpx 28rpx; }
.message-row { margin-bottom: 42rpx; }
.message-row.assistant { display: block; padding-bottom: 34rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .08); }
.message-avatar { display: none; }
.message-row.user .user-avatar { display: flex; width: 44rpx; height: 44rpx; flex: 0 0 44rpx; margin: 0 0 0 12rpx; border: 1rpx solid rgba(92, 40, 40, .18); border-radius: 4rpx; color: #5c2828; background: #f0e5df; box-shadow: none; font-family: Georgia, serif; font-size: 17rpx; }
.message-content,
.message-row.assistant .message-content { width: 100%; max-width: 100%; }
.message-row.user .message-content { max-width: 78%; }
.message-label { margin: 0 0 12rpx; color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .12em; }
.message-bubble { padding: 0; border: 0; border-radius: 0; color: #25231f; background: transparent; box-shadow: none; font-size: 25rpx; line-height: 1.75; }
.message-row.user .message-bubble { padding: 15rpx 18rpx; border: 1rpx solid rgba(105, 87, 74, .16); border-radius: 5rpx; color: #25231f; background: #f0eee8; box-shadow: none; }
.message-bubble.error { padding: 14rpx; border-left: 3rpx solid #8a4c46; color: #8a4c46; background: rgba(138, 76, 70, .06); }
.message-attachment { border-color: rgba(30, 27, 22, .1); border-radius: 4rpx; background: #fcfbf8; }
.message-attachment-icon,
.composer-attachment-icon { border-radius: 3rpx; color: #69574a; background: #f0eee8; }

.result-ready-action { display: flex; align-items: flex-end; justify-content: space-between; gap: 18rpx; margin-top: 26rpx; padding: 18rpx 0; border-top: 1rpx solid rgba(30, 27, 22, .13); border-bottom: 1rpx solid rgba(30, 27, 22, .10); }
.result-ready-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 6rpx; }.result-ready-label { color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .12em; }.result-ready-title { overflow: hidden; color: #25231f; font-family: 'Songti SC', 'STSong', serif; font-size: 26rpx; font-weight: 400; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }.result-ready-desc { display: -webkit-box; overflow: hidden; color: #756f67; font-size: 18rpx; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.result-ready-actions { display: flex; flex: 0 0 auto; flex-direction: column; align-items: flex-end; gap: 12rpx; }.result-ready-detail { padding-bottom: 3rpx; border-bottom: 1rpx solid rgba(105, 87, 74, .28); color: #69574a; font-size: 17rpx; }.result-ready-primary { display: flex; align-items: center; gap: 9rpx; padding: 11rpx 13rpx; border: 1rpx solid #302d29; border-radius: 4rpx; color: #fcfbf8; background: #302d29; font-size: 18rpx; }.result-ready-primary:active { background: #5c2828; }

.result-card { margin-top: 28rpx; padding: 26rpx 0 10rpx; border: 0; border-top: 1rpx solid rgba(30, 27, 22, .14); border-bottom: 1rpx solid rgba(30, 27, 22, .1); border-radius: 0; background: transparent; }
.result-label,
.result-confidence { color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .1em; }
.fallback-label { border-radius: 3rpx; color: #69574a; background: #f0eee8; }
.result-meter { height: 3rpx; border-radius: 0; background: #e5e1d8; }
.result-meter-fill { border-radius: 0; background: #5c2828; }
.result-summary { margin-top: 22rpx; color: #191816; font-family: 'Songti SC', 'STSong', serif; font-size: 31rpx; font-weight: 400; line-height: 1.45; }
.quality-summary { padding: 14rpx 0; border: 0; border-bottom: 1rpx solid rgba(30, 27, 22, .08); border-radius: 0; background: transparent; }
.quality-summary.quality-ready,
.quality-summary.quality-needs_more { background: transparent; }
.quality-label,
.quality-ready .quality-label { color: #56624c; }
.quality-needs_more .quality-label { color: #8a5a4d; }
.quality-gaps text,
.result-tags text,
.question-chip { border-radius: 3rpx; color: #69574a; background: #f0eee8; }
.conversation-state,
.conversation-state.ready { padding: 14rpx 0; border: 0; border-bottom: 1rpx solid rgba(30, 27, 22, .08); border-radius: 0; background: transparent; }
.conversation-state-mark { border-radius: 3rpx; color: #8a5a4d; background: #f0e5df; }
.conversation-state.ready .conversation-state-mark { color: #56624c; background: rgba(86, 98, 76, .11); }
.result-facts { gap: 0; border-top: 1rpx solid rgba(30, 27, 22, .08); }
.result-facts view { padding: 16rpx 12rpx 16rpx 0; border-bottom: 1rpx solid rgba(30, 27, 22, .08); border-radius: 0; background: transparent; }
.result-facts view:nth-child(even) { padding-left: 16rpx; border-left: 1rpx solid rgba(30, 27, 22, .08); }
.result-missing { border-radius: 3rpx; color: #8a5a4d; background: rgba(217, 119, 87, .08); }
.result-editor { border-color: rgba(30, 27, 22, .11); border-radius: 4rpx; background: #fcfbf8; }
.editor-field { border-radius: 3rpx; background: #f0eee8; }
.editor-detail { border-radius: 3rpx; background: #fcfbf8; }
.editor-submit,
.apply-button,
.invite-button { border-radius: 4rpx; background: #5c2828; }
.continue-button,
.match-section-count { color: #5c2828; }
.match-section { padding-top: 24rpx; border-top-color: rgba(30, 27, 22, .1); }
.match-section-kicker { color: #8a847b; font-family: ui-monospace, monospace; letter-spacing: .1em; }
.match-section-title { color: #191816; font-family: 'Songti SC', 'STSong', serif; font-size: 26rpx; font-weight: 400; }
.team-match-card,
.demand-match-card { margin-top: 0; padding: 20rpx 0; border: 0; border-bottom: 1rpx solid rgba(30, 27, 22, .08); border-radius: 0; background: transparent; }
.team-avatar { border-radius: 3rpx; color: #fcfbf8; background: #69574a; }
.team-name,
.demand-match-title { color: #25231f; }
.team-score { color: #56624c; }
.match-reasons text { border-radius: 3rpx; color: #69574a; background: #f0eee8; }
.team-contact { min-height: 58rpx; border: 1rpx solid #5c2828; border-radius: 4rpx; color: #5c2828; background: transparent; }
.team-contact-label { color: #5c2828 !important; font-weight: 500; }
.linked-demand-action { border-color: rgba(30, 27, 22, .11); border-radius: 4rpx; background: #fcfbf8; }
.linked-demand-name { color: #5c2828; }

.quick-prompts { padding: 12rpx 36rpx; border-top-color: rgba(30, 27, 22, .09); background: #f7f6f2; }
.quick-prompt { border-color: rgba(30, 27, 22, .12); border-radius: 4rpx; color: #69574a; background: transparent; }
.composer { padding: 16rpx 36rpx calc(16rpx + env(safe-area-inset-bottom)); border-top-color: rgba(30, 27, 22, .12); background: #fcfbf8; }
.attach-trigger { border: 0; border-bottom: 1rpx solid rgba(105, 87, 74, .28); border-radius: 0; color: #69574a; background: transparent; }
.composer-input { min-height: 74rpx; padding: 16rpx 0; border: 0; border-top: 1rpx solid rgba(30, 27, 22, .1); border-bottom: 1rpx solid rgba(30, 27, 22, .12); border-radius: 0; color: #191816; background: transparent; font-size: 24rpx; }
.send-button { border-radius: 4rpx; }
.send-button.active { border-radius: 4rpx; background: #5c2828; }

@media (max-width: 420px) {
  .agent-header { padding-right: 28rpx; padding-left: 28rpx; }
  .agent-title { font-size: 35rpx; }
  .agent-session-state { display: none; }
  .conversation { padding-right: 28rpx; padding-left: 28rpx; }
  .composer,
  .quick-prompts { padding-right: 28rpx; padding-left: 28rpx; }
  .result-ready-action { align-items: flex-start; flex-direction: column; }.result-ready-actions { width: 100%; align-items: center; flex-direction: row; justify-content: space-between; }.result-ready-primary { padding-right: 16rpx; padding-left: 16rpx; }
}

/* Agent refinement v4：让对话成为页面主舞台，所有可变内容在自己的边界内收缩。 */
.agent-page.brief-page {
  min-height: 0;
  color: #211d18;
  background: #f6f2ea;
}
.agent-page.brief-page .agent-header {
  flex: 0 0 auto;
  box-sizing: border-box;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16rpx 24rpx;
  padding: 24rpx 32rpx 22rpx;
  border-bottom-color: rgba(30, 27, 22, .13);
  background: #f6f2ea;
}
.agent-page.brief-page .agent-header-copy,
.agent-page.brief-page .agent-header-actions,
.agent-page.brief-page .message-content,
.agent-page.brief-page .result-ready-copy,
.agent-page.brief-page .team-main { min-width: 0; }
.agent-page.brief-page .agent-title { max-width: 560rpx; }
.agent-page.brief-page .agent-subtitle {
  max-width: 560rpx;
  overflow: hidden;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.agent-page.brief-page .agent-header-actions { min-width: 116rpx; }
.agent-page.brief-page .agent-session-state {
  display: flex;
  align-items: center;
  gap: 6rpx;
  min-height: 28rpx;
  white-space: nowrap;
}
.agent-page.brief-page .agent-session-dot {
  color: #56624c;
  font-family: Georgia, serif;
  font-size: 22rpx;
  line-height: 1;
}
.agent-page.brief-page .clear-button {
  min-height: 48rpx;
  padding: 8rpx 0 5rpx;
  box-sizing: border-box;
}
.agent-page.brief-page .message-scroll {
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  box-sizing: border-box;
  background: #f6f2ea;
}
.agent-page.brief-page .conversation {
  width: 100%;
  max-width: 1120px;
  box-sizing: border-box;
  padding: 34rpx 32rpx 38rpx;
}
.agent-page.brief-page .message-row {
  min-width: 0;
  margin-bottom: 32rpx;
}
.agent-page.brief-page .message-row.assistant {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding-bottom: 28rpx;
}
.agent-page.brief-page .message-row.assistant .message-avatar {
  display: flex;
  width: 42rpx;
  height: 42rpx;
  flex: 0 0 42rpx;
  margin: 2rpx 0 0;
  border: 1rpx solid rgba(180, 148, 96, .46);
  border-radius: 50%;
  color: #5c2828;
  background: #efe2d1;
  box-shadow: none;
  font-family: Georgia, 'Songti SC', serif;
  font-size: 17rpx;
  font-weight: 500;
}
.agent-page.brief-page .message-row.assistant .message-content {
  width: auto;
  max-width: calc(100% - 54rpx);
  flex: 1 1 auto;
}
.agent-page.brief-page .message-row.user .message-content {
  width: auto;
  max-width: 78%;
}
.agent-page.brief-page .message-bubble,
.agent-page.brief-page .result-card,
.agent-page.brief-page .result-ready-action,
.agent-page.brief-page .outreach-note,
.agent-page.brief-page .linked-demand-action {
  max-width: 100%;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.agent-page.brief-page .usage-credit-note { border-color: rgba(86, 98, 76, .2); color: #56624c; background: #f1f5ec; }
.agent-page.brief-page .message-bubble > text,
.agent-page.brief-page .result-summary,
.agent-page.brief-page .outreach-opening,
.agent-page.brief-page .outreach-context,
.agent-page.brief-page .conversation-state-desc,
.agent-page.brief-page .result-missing,
.agent-page.brief-page .missing-copy { overflow-wrap: anywhere; word-break: break-word; }
.agent-page.brief-page .message-attachments { max-width: 100%; }
.agent-page.brief-page .message-attachment { max-width: 100%; box-sizing: border-box; }
.agent-page.brief-page .message-attachment-copy { min-width: 0; flex: 1 1 auto; }
.agent-page.brief-page .message-attachment-name { max-width: 100%; }
.agent-page.brief-page .result-ready-action { min-width: 0; }
.agent-page.brief-page .result-ready-actions { min-width: 0; }
.agent-page.brief-page .result-ready-primary { max-width: 100%; white-space: nowrap; }
.agent-page.brief-page .team-match-card,
.agent-page.brief-page .demand-match-card { min-width: 0; max-width: 100%; box-sizing: border-box; }
.agent-page.brief-page .team-name-line,
.agent-page.brief-page .team-name-wrap { min-width: 0; }
.agent-page.brief-page .team-contact { min-width: 116rpx; padding-right: 9rpx; padding-left: 9rpx; }
.agent-page.brief-page .retry-line {
  display: inline-flex;
  align-items: center;
  min-height: 52rpx;
  margin-top: 12rpx;
  padding: 0 14rpx;
  border: 1rpx solid rgba(138, 76, 70, .24);
  border-radius: 4rpx;
  color: #8a4c46;
  background: rgba(138, 76, 70, .055);
  font-size: 18rpx;
}
.agent-page.brief-page .quick-prompts {
  flex: 0 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  padding: 14rpx 32rpx 16rpx;
  border-top-color: rgba(30, 27, 22, .10);
  background: #f6f2ea;
}
.agent-page.brief-page .quick-prompt {
  max-width: 72%;
  overflow: hidden;
  box-sizing: border-box;
  text-overflow: ellipsis;
  vertical-align: middle;
  border-color: rgba(105, 87, 74, .20);
  color: #69574a;
  background: #fcfbf8;
}
.agent-page.brief-page .composer {
  flex: 0 0 auto;
  min-width: 0;
  box-sizing: border-box;
  padding: 18rpx 32rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top-color: rgba(30, 27, 22, .14);
  background: #fcfbf8;
  box-shadow: 0 -8rpx 24rpx rgba(30, 27, 22, .035);
}
.agent-page.brief-page .composer-attachments,
.agent-page.brief-page .composer-tools { min-width: 0; }
.agent-page.brief-page .composer-attachment { max-width: 100%; box-sizing: border-box; }
.agent-page.brief-page .composer-attachment-name { min-width: 0; max-width: 240rpx; }
.agent-page.brief-page .composer-tools { flex-wrap: wrap; gap: 8rpx 10rpx; }
.agent-page.brief-page .attachment-hint {
  min-width: 0;
  flex: 1 1 160rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.agent-page.brief-page .composer-input {
  min-height: 84rpx;
  padding: 15rpx 0 13rpx;
  border-top-color: rgba(30, 27, 22, .14);
  border-bottom-color: rgba(30, 27, 22, .16);
  background: transparent;
}
.agent-page.brief-page .composer-bottom { gap: 16rpx; }
.agent-page.brief-page .composer-hint { flex: 0 0 auto; color: #9b948a; }
.agent-page.brief-page .send-button {
  min-width: 128rpx;
  min-height: 68rpx;
  box-sizing: border-box;
  justify-content: center;
  border-radius: 4rpx;
  color: #a59d91;
  background: #ebe6dc;
}
.agent-page.brief-page .send-button.active {
  color: #fcfbf8;
  background: #5c2828;
  box-shadow: 0 7rpx 16rpx rgba(92, 40, 40, .16);
}
.agent-page.brief-page .send-button.disabled { box-shadow: none; }

/* 联系操作保持统一对比度，避免全局按钮底色与旧标签颜色叠加。 */
.agent-page.brief-page .team-contact {
  min-width: 132px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(92, 40, 40, .42);
  border-radius: 8px;
  background: #f0e5df;
  color: #5c2828;
}
.agent-page.brief-page .team-contact .team-contact-label {
  color: #5c2828 !important;
  font-size: 15px;
  font-weight: 600;
}
.agent-page.brief-page .team-contact:active { background: #e6d5cd; }
.agent-page.brief-page .team-meta { white-space: normal; line-height: 1.6; }
.agent-page.brief-page .match-reasons { flex-wrap: wrap; }

@media (max-width: 700px) {
  .agent-page.brief-page .message-row.assistant { display: block; }
  .agent-page.brief-page .message-row.assistant .message-avatar { margin-bottom: 12px; }
  .agent-page.brief-page .message-row.assistant .message-content { width: 100%; max-width: 100%; }
  .agent-page.brief-page .team-match-card { flex-wrap: wrap; gap: 12px; }
  .agent-page.brief-page .team-main { flex: 1 1 calc(100% - 70px); }
  .agent-page.brief-page .team-contact { width: 100%; min-width: 0; }
}

@media (max-width: 420px) {
  .agent-page.brief-page .agent-header { gap: 14rpx; padding-right: 28rpx; padding-left: 28rpx; }
  .agent-page.brief-page .agent-header-actions { min-width: 92rpx; }
  .agent-page.brief-page .agent-session-state { display: none; }
  .agent-page.brief-page .agent-title { max-width: 430rpx; font-size: 36rpx; }
  .agent-page.brief-page .agent-subtitle { max-width: 430rpx; }
  .agent-page.brief-page .conversation { padding-right: 28rpx; padding-left: 28rpx; }
  .agent-page.brief-page .message-row.user .message-content { max-width: 82%; }
  .agent-page.brief-page .composer,
  .agent-page.brief-page .quick-prompts { padding-right: 28rpx; padding-left: 28rpx; }
  .agent-page.brief-page .composer-attachment-name { max-width: 190rpx; }
  .agent-page.brief-page .send-button { min-width: 116rpx; }
}
</style>
