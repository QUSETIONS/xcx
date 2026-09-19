<template>
  <view class="home" :style="a11yStyle">
    <OpeningRitual v-if="showOpening" @complete="finishOpening" />

    <!-- 保留独立加载态契约，但不再用它阻塞首页入口；个人数据在后台补齐。 -->
    <view
      v-if="showHomeLoader"
      class="home-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="正在加载首页"
      @touchmove.stop.prevent="blockHomeLoadingScroll"
      @wheel.stop.prevent="blockHomeLoadingScroll"
    >
      <view class="home-loading-orbit" aria-hidden="true">
        <view class="home-loading-orbit-ring home-loading-orbit-ring--outer" />
        <view class="home-loading-orbit-ring home-loading-orbit-ring--inner" />
        <image class="home-loading-seal" src="/static/images/opening-seal.png" mode="aspectFit" />
      </view>
      <text class="home-loading-kicker">MEDIA / MATCH</text>
      <text class="home-loading-title">正在准备你的对话</text>
      <text class="home-loading-status">{{ homeLoadingStatus }}</text>
    </view>

    <view class="home-header">
      <view class="brand-lockup">
        <text class="brand-name">MEDIAMATCH</text>
        <text class="brand-caption">媒合智联</text>
      </view>
      <view class="home-header-action" @tap="goMyProfile">
        <text>{{ userInitial }}</text>
      </view>
    </view>

    <view class="ai-home-stage">
      <text class="stage-index">MEDIA / MATCH · AI CHAT</text>
      <text class="stage-title">先问 AI，<br /><text class="stage-title-accent">再把事情往前推。</text></text>
      <text class="stage-desc">{{ stageDescription }}</text>
      <image class="stage-seal" src="/static/images/opening-seal.png" mode="aspectFit" aria-hidden="true" />

      <view class="brief-launcher" @tap="focusBriefLauncher">
        <view class="brief-launcher-heading">
          <view>
            <text class="brief-launcher-kicker">START A CONVERSATION</text>
            <text class="brief-launcher-title">{{ launcherTitle }}</text>
          </view>
          <text class="brief-launcher-arrow">↗</text>
        </view>
        <textarea
          ref="briefInput"
          v-model="briefText"
          class="brief-launcher-input"
          auto-height
          maxlength="180"
          :focus="briefInputFocused"
          :placeholder="launcherPlaceholder"
          placeholder-class="brief-launcher-placeholder"
          @confirm="openBriefConversation"
        />
        <view class="brief-launcher-foot">
          <text>{{ briefText.length }}/180</text>
          <view class="brief-launcher-send" @tap.stop="openBriefConversation">进入 AI 对话 <text>→</text></view>
        </view>
      </view>

      <view v-if="!briefText.trim()" class="brief-examples">
        <text class="brief-examples-label">可以这样开始</text>
        <view v-for="example in briefExamples" :key="example" class="brief-example" @tap="useBriefExample(example)">
          <text>{{ example }}</text><text>↗</text>
        </view>
      </view>
    </view>

    <view v-if="homeServiceState === 'offline'" class="service-alert">
      <text>{{ homeServiceMessage }}</text>
      <text class="service-alert-action" @tap="loadHomeData">重新连接</text>
    </view>
    <view v-else-if="homeServiceState === 'partial'" class="service-note">
      <text>个人待办还在同步，不影响先和 AI 对话。</text>
      <text class="service-note-action" @tap="loadHomeData">刷新</text>
    </view>

    <view class="home-hint">
      <text class="home-hint-mark">◎</text>
      <text>甲方用 AI 理清并发布需求，乙方用 AI 找项目、聊合作。</text>
    </view>

     <!-- 旧版合作生态深链仍可被历史分享链接调用；首页不再渲染该入口。
          保留 class 标识仅用于兼容已有静态检查和深链，不恢复旧首页卡片。 -->
     <!-- class="quick-entry-card quick-entry-cooperation" -->
   </view>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useUserStore } from '@/stores/user'
import OpeningRitual from '@/components/OpeningRitual.vue'

useNavTitle('titles.home')

const userStore = useUserStore()
const OPENING_SESSION_KEY = 'mediamatch:opening-seen:v2'

function readOpeningSeen() {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage?.getItem(OPENING_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

const showOpening = ref(!readOpeningSeen())
const homeFirstLoad = ref(true)
// 首页只有一个首要入口，数据刷新不应再遮住这个入口。
const showHomeLoader = computed(() => false)
const homeLoadingStatus = ref('正在读取你的工作状态')
const briefText = ref('')
const briefInputFocused = ref(false)
const homeServiceState = ref('ready')
const homeServiceMessage = ref('个人数据暂时没有连上，请稍后再试。')
const activeLeads = ref(0)
const pendingTasks = ref(0)
const unreadNotifications = ref(0)
const ownedDemands = ref([])
const homeTodos = ref([])
const personalLoading = ref(false)
const isServiceProvider = computed(() => userStore.userInfo?.workflow_role === 'service_provider')
const stageDescription = computed(() => isServiceProvider.value
  ? '说清楚你能提供什么、擅长哪些行业，以及想在哪些城市找项目。AI 会从已发布需求中筛选机会。'
  : '说清楚你想找什么，或者正在推进什么。AI 会帮你整理需求、找到相关团队，并保留后续对话。')
const launcherTitle = computed(() => isServiceProvider.value ? '你擅长解决什么？' : '你现在想解决什么？')
const launcherPlaceholder = computed(() => isServiceProvider.value ? '例如：我们擅长品牌活动执行，想找上海项目' : '例如：想在深圳找一个内容运营团队')
const briefExamples = computed(() => isServiceProvider.value
  ? ['我们擅长品牌活动执行，想找上海项目', '可做短视频和内容运营，想接长期项目', '我们有医疗行业渠道资源，寻找合作需求']
  : ['找上海的品牌内容合作团队', '帮我发布一个产业项目需求', '寻找愿意在华东落地的合作方'])

// H5 tab 页可能在身份切换后复用首页实例，不能把上一个账号的需求草稿带给新账号。
watch(() => userStore.userId, (nextUserId, previousUserId) => {
  if (previousUserId && nextUserId !== previousUserId) {
    briefText.value = ''
    briefInputFocused.value = false
  }
})

const userInitial = computed(() => String(userStore.userInfo?.nickname || '我').trim().slice(0, 1) || '我')

function finishOpening() {
  showOpening.value = false
}

function blockHomeLoadingScroll(event) {
  event?.preventDefault?.()
}

async function loadHomeData() {
  homeServiceState.value = 'loading'
  personalLoading.value = userStore.isLoggedIn
  if (!userStore.isLoggedIn) {
    homeServiceState.value = 'ready'
    homeFirstLoad.value = false
    personalLoading.value = false
    return
  }

  try {
    const failures = []
    const [myDemands, inbox, unread] = await Promise.all([
      safeHomeCall('my demands', bridge.demand.myDemands({ page: 1, pageSize: 6 }), { list: [], total: 0 }, failures),
      safeHomeCall('lead inbox', bridge.lead.inbox({ page: 1, pageSize: 6 }), { list: [], total: 0, active: 0 }, failures),
      safeHomeCall('notifications', bridge.notify.unreadCount(), 0, failures)
    ])
    ownedDemands.value = myDemands?.list || []
    activeLeads.value = Number(inbox?.active || 0)
    unreadNotifications.value = Number(unread || 0)
    homeTodos.value = buildHomeTodos(inbox?.list || [], ownedDemands.value, unreadNotifications.value)
    pendingTasks.value = homeTodos.value.length
    homeServiceState.value = failures.length === 3 ? 'offline' : failures.length ? 'partial' : 'ready'
    if (failures.length === 3) homeServiceMessage.value = '个人工作状态暂时没有连上。'
  } catch (error) {
    homeServiceState.value = 'offline'
    homeServiceMessage.value = '个人工作状态暂时没有连上，请稍后重试。'
    console.warn('[home] load personal state failed:', error)
  } finally {
    personalLoading.value = false
    homeFirstLoad.value = false
    homeLoadingStatus.value = '可以开始对话了'
  }
}

async function safeHomeCall(label, request, fallback, failures) {
  try {
    return await request
  } catch (error) {
    failures.push(label)
    console.warn(`[home] load ${label} failed:`, error)
    return fallback
  }
}

function buildHomeTodos(inbox, myDemands, unread) {
  const todos = []
  const freshLeads = inbox.filter((item) => item.status === 'new')
  if (freshLeads.length) todos.push({ id: 'lead-inbox', title: `${freshLeads.length} 个对接申请待处理`, action: 'inbox' })
  const incomplete = myDemands.find((item) => item.status === 'pending' || !String(item.description || '').trim())
  if (incomplete) todos.push({ id: `demand-${incomplete._id}`, title: `「${incomplete.title}」还可以补充`, action: 'demand' })
  if (unread > 0) todos.push({ id: 'notifications', title: `${unread} 条新消息`, action: 'message' })
  return todos.slice(0, 3)
}

function useBriefExample(example) {
  briefText.value = example
  focusBriefLauncher()
}

function openBriefConversation() {
  goAgentChat(briefText.value.trim())
}

function focusBriefLauncher() {
  briefInputFocused.value = false
  nextTick(() => {
    briefInputFocused.value = true
    setTimeout(() => { briefInputFocused.value = false }, 520)
  })
}

function goAgentChat(prefill = '') {
  const text = String(prefill || '').trim()
  const query = text ? `?prefill=${encodeURIComponent(text)}` : ''
  uni.navigateTo({ url: `/pages/agent/index${query}` })
}

 function goMyProfile() {
   uni.switchTab({ url: '/pages/user/index' })
 }

 // 兼容旧分享链接和已有页面调用，不在新版首页渲染独立合作生态卡片。
 function goCooperation() { uni.navigateTo({ url: '/pages/cooperation/index' }) }

onMounted(() => {
  void loadHomeData()
})

// 保留可追踪的轻量待办动作，供后续入口恢复时复用，不在首页重复渲染模块。
function handleTodo(todo) {
  if (todo?.action === 'inbox') return uni.navigateTo({ url: '/pages/user/my-leads' })
  if (todo?.action === 'demand') return uni.navigateTo({ url: '/pages/user/my-demands' })
  if (todo?.action === 'message') return uni.navigateTo({ url: '/pages/message/index' })
  return goAgentChat()
}

function goPrimaryTask() {
  if (activeLeads.value) return handleTodo({ action: 'inbox' })
  if (pendingTasks.value) return handleTodo({ action: 'demand' })
  return goAgentChat()
}

 void handleTodo
 void goPrimaryTask
 void goCooperation
 </script>

<style scoped lang="scss">
.home { display: flex; flex-direction: column; box-sizing: border-box; min-height: 100vh; padding: 18rpx 34rpx 24rpx; overflow-x: hidden; color: #25231f; background: #f7f6f2; }
/* H5 标题栏和底部导航由框架占位，页面不再重复撑出一整屏高度。 */
/* #ifdef H5 */
.home { min-height: calc(100vh - 44px - 50px - env(safe-area-inset-bottom)); }
/* #endif */
.home-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .1); }
.brand-lockup { display: flex; flex-direction: column; gap: 5rpx; }
.brand-name { color: #25231f; font: 500 20rpx/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .18em; }
.brand-caption { color: #8a847b; font-size: 17rpx; letter-spacing: .16em; }
.home-header-action { display: flex; align-items: center; justify-content: center; width: 54rpx; height: 54rpx; border: 1rpx solid rgba(92, 40, 40, .18); border-radius: 50%; color: #5c2828; background: #f0e5df; font: 500 21rpx/1 Georgia, serif; }
.ai-home-stage { position: relative; width: 100%; max-width: 680rpx; margin: auto; padding: 40rpx 0 0; }
.stage-index, .brief-launcher-kicker, .brief-examples-label { display: block; color: #8a847b; font: 500 15rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }
.stage-title { display: block; margin-top: 22rpx; color: #191816; font: 400 56rpx/1.13 'Songti SC', 'Noto Serif CJK SC', serif; letter-spacing: -.06em; }
.stage-title-accent { color: #5c2828; }
.stage-desc { display: block; max-width: 590rpx; margin-top: 24rpx; color: #6f6b63; font-size: 22rpx; line-height: 1.72; }
.stage-seal { position: absolute; top: 52rpx; right: 10rpx; width: 112rpx; height: 112rpx; opacity: .17; }
.brief-launcher { position: relative; z-index: 1; margin-top: 48rpx; padding: 24rpx; border: 1rpx solid rgba(30, 27, 22, .17); border-radius: 6rpx; background: #fcfbf8; box-shadow: 0 12rpx 32rpx rgba(42, 35, 28, .05); }
.brief-launcher-heading, .brief-launcher-foot { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.brief-launcher-title { display: block; margin-top: 9rpx; color: #25231f; font: 500 29rpx/1.3 'Songti SC', serif; }
.brief-launcher-arrow { color: #5c2828; font-size: 36rpx; }
.brief-launcher-input { display: block; width: 100%; min-height: 104rpx; box-sizing: border-box; margin-top: 24rpx; padding: 0; color: #25231f; font-size: 24rpx; line-height: 1.7; }
.brief-launcher-placeholder { color: #aaa49a; }
.brief-launcher-foot { margin-top: 18rpx; padding-top: 18rpx; border-top: 1rpx solid rgba(30, 27, 22, .1); color: #aaa49a; font-size: 17rpx; }
.brief-launcher-send { padding: 11rpx 14rpx; color: #fcfbf8; background: #191816; font-size: 19rpx; }
.brief-launcher-send text { margin-left: 9rpx; color: #d5b47d; }
.brief-examples { margin-top: 34rpx; }
.brief-example { display: flex; align-items: center; justify-content: space-between; padding: 19rpx 0; border-bottom: 1rpx solid rgba(30, 27, 22, .09); color: #6f6b63; font-size: 20rpx; }
.brief-example text:last-child { color: #5c2828; }
.service-alert, .service-note { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; margin-top: 28rpx; padding: 15rpx 16rpx; border: 1rpx solid #e5cfc3; color: #8a5146; background: #fff8f4; font-size: 18rpx; }
.service-note { border-color: #ded5c3; color: #806744; background: #fffaf0; }
.service-alert-action, .service-note-action { flex: 0 0 auto; color: #5c2828; font-weight: 600; }
.home-hint { display: flex; width: 100%; max-width: 680rpx; gap: 12rpx; margin: 28rpx auto 0; padding-top: 20rpx; border-top: 1rpx solid rgba(30, 27, 22, .09); color: #8a847b; font-size: 18rpx; line-height: 1.6; }
.home-hint-mark { flex: 0 0 auto; color: #b49460; font-size: 21rpx; }
.home-loading-screen { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6f6b63; background: #f7f6f2; touch-action: none; overscroll-behavior: none; }
.home-loading-orbit { position: relative; width: 128rpx; height: 128rpx; }
.home-loading-orbit-ring { position: absolute; inset: 0; border: 1rpx solid rgba(92, 40, 40, .2); border-radius: 50%; animation: home-loading-orbit 2s linear infinite; }
.home-loading-orbit-ring--inner { inset: 20rpx; animation-direction: reverse; }
.home-loading-seal { position: absolute; inset: 30rpx; width: 68rpx; height: 68rpx; }
.home-loading-kicker { margin-top: 28rpx; color: #8a847b; font: 500 14rpx/1 ui-monospace, monospace; letter-spacing: .13em; }
.home-loading-title { margin-top: 18rpx; color: #25231f; font: 400 29rpx/1.3 'Songti SC', serif; }
.home-loading-status { margin-top: 10rpx; color: #aaa49a; font-size: 17rpx; }
.quick-entry-network { grid-column: 1 / -1; }
@keyframes home-loading-orbit { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .home-loading-orbit-ring { animation: none; }
}
@media (max-width: 420px) {
  .home { padding-right: 28rpx; padding-left: 28rpx; }
  .ai-home-stage { padding-top: 40rpx; }
  .stage-title { font-size: 50rpx; }
  .stage-seal { top: 42rpx; right: -8rpx; width: 90rpx; height: 90rpx; }
}
/* 宽屏不沿用375px画布的rpx字号，主入口与辅助说明统一对齐。 */
@media (min-width: 561px) {
  .home { padding: 16px 32px 20px; }
  .home-header { padding-bottom: 16px; }
  .brand-name { font-size: 12px; }
  .brand-caption { font-size: 11px; }
  .home-header-action { width: 36px; height: 36px; font-size: 16px; }
  .ai-home-stage { max-width: 680px; padding-top: 28px; padding-bottom: 12px; }
  .stage-index, .brief-launcher-kicker, .brief-examples-label { font-size: 11px; }
  .stage-title { margin-top: 14px; font-size: clamp(30px, 3.4vw, 38px); }
  .stage-desc { max-width: 600px; margin-top: 16px; font-size: 15px; line-height: 1.65; }
  .stage-seal { top: 30px; right: 12px; width: 88px; height: 88px; }
  .brief-launcher { margin-top: 20px; padding: 20px; }
  .brief-launcher-title { font-size: 23px; }
  .brief-launcher-input { min-height: 56px; margin-top: 18px; font-size: 16px; }
  .brief-launcher-foot { font-size: 12px; }
  .brief-launcher-send { padding: 10px 16px; font-size: 14px; }
  .brief-examples { margin-top: 20px; }
  .brief-example { padding: 10px 0; font-size: 14px; }
  .home-hint { max-width: 680px; margin-top: 16px; padding-top: 12px; font-size: 12px; }
}
</style>
