<template>
  <view v-if="loadState === 'loading'" class="page-state">
    <text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
    <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>{{ t('common.loadFailed') }}</text>
    <text class="page-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="page">
    <!-- 头部 -->
    <view class="hero">
      <text class="hero-title">{{ t('user.campaign') }}</text>
      <text class="hero-desc">{{ t('campaign.heroDesc') }}</text>
    </view>

    <!-- 倒计时横幅 -->
    <view v-if="countdown" class="countdown-banner">
      <image class="cb-icon" src="/static/icons/ticket.svg" mode="aspectFit" />
      <text class="cb-text">{{ countdownLabel }}</text>
      <view class="cb-time">
        <text class="time-box">{{ countdown.h }}</text>
        <text class="time-sep">:</text>
        <text class="time-box">{{ countdown.m }}</text>
        <text class="time-sep">:</text>
        <text class="time-box">{{ countdown.s }}</text>
      </view>
    </view>

    <!-- 活动列表 -->
    <view class="campaign-list">
      <view class="campaign-card card-press" v-for="c in campaigns" :key="c.id" @tap="joinCampaign(c)">
        <view class="cc-cover" :style="{ background: c.color }">
          <image class="cc-emoji" :src="c.cover" mode="aspectFit" />
          <view class="cc-tag"><text>{{ c.tag }}</text></view>
        </view>
        <view class="cc-info">
          <text class="cc-title">{{ c.title }}</text>
          <text class="cc-desc">{{ c.desc }}</text>
          <view class="cc-bottom">
            <view class="cc-end"><text>{{ c.end }}</text></view>
            <view class="cc-btn"><text>{{ t('home.joinNow') }}</text></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 任务中心 -->
    <view class="task-section">
      <text class="section-title">{{ t('campaign.taskTitle') }}</text>
      <view class="task-card" v-for="(task, i) in tasks" :key="i">
        <view class="task-icon"><image :src="task.icon" mode="aspectFit" /></view>
        <view class="task-info">
          <text class="task-name">{{ task.name }}</text>
          <text class="task-desc">{{ task.desc }}</text>
        </view>
        <view class="task-action">
          <text v-if="task.reward" class="task-reward">+{{ task.reward }}{{ t('campaign.pointsUnit') }}</text>
          <view class="task-btn" :class="{ done: task.done }" @tap.stop="doTask(i)">
            <text>{{ task.done ? t('campaign.taskDone') : (task.actionLabel || t('campaign.taskGo')) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useRequest } from '@/hooks/useRequest'
import { toastError } from '@/utils/feedback'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.campaign')

const campaigns = ref([])
const countdown = ref(null)
let timer = null
const userStore = useUserStore()

const tasks = ref([])
const flashCampaign = computed(() => campaigns.value.find((item) => /\d+天后/.test(String(item.end || ''))) || campaigns.value[0] || null)
const countdownLabel = computed(() => flashCampaign.value?.title
  ? `距离「${flashCampaign.value.title}」结束`
  : t('campaign.flash'))

function getRuleReward(rules, keyword) {
  const rule = (rules || []).find((item) => String(item.action || '').includes(keyword))
  return String(rule?.points || '').replace(/^\+/, '')
}

function buildTasks({ points, demands, inbox, network }) {
  const info = userStore.userInfo || {}
  const demandTotal = Number(demands?.total || demands?.list?.length || 0)
  const pendingLeads = Number(inbox?.pending || 0)
  const joinedGroups = Number(network?.stats?.joined_groups || 0)
  const profileDone = Boolean(info.company && info.title && info.city)
  return [
    {
      id: 'checkin', icon: '/static/icons/ticket.svg', reward: getRuleReward(points?.rules, '签到'),
      name: '每日签到', desc: points?.todayChecked ? '今天已完成签到，积分已到账' : `当前可用 ${Number(points?.balance || 0)} 积分，签到后会更新余额`,
      done: Boolean(points?.todayChecked), actionLabel: '去签到', route: '/pages/points/index'
    },
    {
      id: 'demand', icon: '/static/icons/edit.svg', reward: '',
      name: '发布需求', desc: demandTotal ? `已发布或保存 ${demandTotal} 条需求` : '先把一个真实项目整理成可对接的需求',
      done: demandTotal > 0, actionLabel: '去发布', route: '/pages/demand/publish'
    },
    {
      id: 'lead', icon: '/static/icons/handshake.svg', reward: '',
      name: '处理收到的对接', desc: pendingLeads ? `还有 ${pendingLeads} 条对接申请等待回复` : '当前没有待处理的对接申请',
      done: pendingLeads === 0, actionLabel: '去处理', route: '/pages/user/my-leads'
    },
    {
      id: 'network', icon: '/static/icons/users.svg', reward: '',
      name: '加入社群', desc: joinedGroups ? `已加入 ${joinedGroups} 个社群或分会` : '找一个与你的项目方向相关的社群',
      done: joinedGroups > 0, actionLabel: '去看看', route: '/pages/network/index'
    },
    {
      id: 'profile', icon: '/static/icons/user.svg', reward: '',
      name: '完善企业资料', desc: profileDone ? '企业、职位和城市资料已补全' : '补全企业、职位和城市，方便合作方判断是否适合对接',
      done: profileDone, actionLabel: '去完善', route: '/pages/settings/index'
    }
  ]
}

const { state: loadState, run: loadRequest } = useRequest(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能查看活动中心'))) return null
  const [nextCampaigns, points, demands, inbox, network] = await Promise.all([
    bridge.campaign.list(),
    bridge.points.getInfo(),
    bridge.demand.myDemands(),
    bridge.lead.inbox(),
    bridge.network.overview()
  ])
  return { campaigns: nextCampaigns, points, demands, inbox, network }
})

async function reload() {
  try {
    const data = await loadRequest()
    if (!data) return
    campaigns.value = data?.campaigns || []
    tasks.value = buildTasks(data || {})
    startCountdown(campaigns.value)
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

function stopCountdown() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onUnmounted(stopCountdown)

function startCountdown(list = []) {
  stopCountdown()
  const days = Math.max(0, Number(String(flashCampaign.value?.end || '').match(/(\d+)天后/)?.[1] || 0))
  if (!days) {
    countdown.value = null
    return
  }
  const deadline = Date.now() + days * 86400000
  const updateCountdown = () => {
    const total = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    countdown.value = {
      h: String(h).padStart(2, '0'),
      m: String(m).padStart(2, '0'),
      s: String(s).padStart(2, '0')
    }
  }
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
}

function joinCampaign(c) {
  const routes = {
    coupon: '/pages/coupon/index',
    member: '/pages/member/index',
    invite: '/pages/user/index',
    task: '',
    rank: '/pages/dashboard/index',
    discount: '/pages/member/index'
  }
  if (c.type === 'invite') { uni.showToast({ title: t('campaign.linkCopied'), icon: 'none' }); return }
  if (c.type === 'task') { uni.pageScrollTo({ scrollTop: 9999 }); return }
  const url = routes[c.type]
  if (url) uni.navigateTo({ url })
}

function doTask(i) {
  const task = tasks.value[i]
  if (!task || task.done) return
  if (task.id === 'demand') return uni.navigateTo({ url: task.route })
  if (task.id === 'network') return uni.navigateTo({ url: task.route })
  uni.navigateTo({ url: task.route })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }

.hero { background: linear-gradient(135deg, #FF6B35, #FF9A5C); padding: 40rpx 32rpx; }
.hero-title { font-size: 40rpx; font-weight: bold; color: #FFFFFF; display: block; }
.hero-desc { font-size: 26rpx; color: rgba(255,255,255,0.9); }

.countdown-banner { display: flex; align-items: center; background: #2C2C2C; margin: 16rpx 24rpx; border-radius: 16rpx; padding: 20rpx 24rpx; }
.cb-icon { width: 32rpx; height: 32rpx; margin-right: 12rpx; }
.cb-text { flex: 1; font-size: 26rpx; color: #FFFFFF; font-weight: bold; }
.cb-time { display: flex; align-items: center; }
.time-box { background: #FF6B35; color: #FFFFFF; font-size: 24rpx; font-weight: bold; padding: 6rpx 12rpx; border-radius: 8rpx; min-width: 44rpx; text-align: center; }
.time-sep { color: #FFFFFF; font-size: 24rpx; margin: 0 4rpx; }

.campaign-list { padding: 8rpx 24rpx; }
.campaign-card { display: flex; background: #FFFFFF; border-radius: 16rpx; padding: 16rpx; margin-bottom: 16rpx; overflow: hidden; }
.cc-cover { width: 160rpx; height: 160rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; position: relative; flex-shrink: 0; }
.cc-emoji { width: 64rpx; height: 64rpx; }
.cc-tag { position: absolute; top: 8rpx; left: 8rpx; background: rgba(255,255,255,0.9); padding: 2rpx 12rpx; border-radius: 8rpx; }
.cc-tag text { font-size: 18rpx; color: rgba(0,0,0,0.7); font-weight: bold; }
.cc-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 8rpx 0; }
.cc-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 8rpx; }
.cc-desc { font-size: 24rpx; color: rgba(0,0,0,0.5); flex: 1; }
.cc-bottom { display: flex; justify-content: space-between; align-items: center; }
.cc-end text { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.cc-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; padding: 10rpx 24rpx; }
.cc-btn text { font-size: 24rpx; color: #FFFFFF; font-weight: bold; }

.task-section { padding: 24rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.task-card { display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.task-icon { width: 72rpx; height: 72rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.task-icon image { width: 34rpx; height: 34rpx; }
.task-info { flex: 1; }
.task-name { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.task-desc { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.task-action { display: flex; flex-direction: column; align-items: flex-end; }
.task-reward { font-size: 24rpx; color: #FF6B35; font-weight: bold; margin-bottom: 8rpx; }
.task-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; padding: 10rpx 24rpx; }
.task-btn.done { background: #F5F6FA; }
.task-btn text { font-size: 24rpx; color: #FFFFFF; font-weight: bold; }
.task-btn.done text { color: rgba(0,0,0,0.4); font-weight: normal; }

/* 活动卡片在小屏幕上按“固定图标 + 可收缩内容”布局，长文案只在内容列内折行。 */
.page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.hero, .countdown-banner, .campaign-card, .cc-info, .cc-bottom, .task-card, .task-info, .task-action { min-width: 0; }
.hero-title, .hero-desc, .cb-text, .cc-title, .cc-desc, .task-name, .task-desc { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.hero-title, .cc-title, .task-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cb-text, .cc-info, .task-info { overflow: hidden; }
.countdown-banner { box-sizing: border-box; }
.cb-time, .time-box, .cc-btn, .task-btn { flex: 0 0 auto; white-space: nowrap; }
.cc-bottom { gap: 10rpx; }
.cc-end { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-info { flex: 1; }
.task-action { margin-left: 10rpx; align-items: flex-end; }

@media (max-width: 420px) {
  .countdown-banner { margin-right: 16rpx; margin-left: 16rpx; padding-right: 16rpx; padding-left: 16rpx; }
  .campaign-list, .task-section { padding-right: 16rpx; padding-left: 16rpx; }
  .cc-cover { width: 120rpx; height: 120rpx; margin-right: 14rpx; }
  .cc-title { font-size: 27rpx; }
  .cc-btn, .task-btn { padding-right: 16rpx; padding-left: 16rpx; }
  .task-card { padding: 16rpx; }
  .task-icon { width: 60rpx; height: 60rpx; margin-right: 12rpx; }
  .task-action { margin-left: 6rpx; }
}
</style>
