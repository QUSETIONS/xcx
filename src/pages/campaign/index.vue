<template>
  <view class="page">
    <!-- 头部 -->
    <view class="hero">
      <text class="hero-title">活动中心</text>
      <text class="hero-desc">超值优惠 · 限时抢购</text>
    </view>

    <!-- 倒计时横幅 -->
    <view class="countdown-banner">
      <text class="cb-icon">⏰</text>
      <text class="cb-text">限时秒杀进行中</text>
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
          <text class="cc-emoji">{{ c.cover }}</text>
          <view class="cc-tag"><text>{{ c.tag }}</text></view>
        </view>
        <view class="cc-info">
          <text class="cc-title">{{ c.title }}</text>
          <text class="cc-desc">{{ c.desc }}</text>
          <view class="cc-bottom">
            <view class="cc-end"><text>🕐 {{ c.end }}</text></view>
            <view class="cc-btn"><text>立即参与</text></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 任务中心 -->
    <view class="task-section">
      <text class="section-title">🎯 做任务赚积分</text>
      <view class="task-card" v-for="(task, i) in tasks" :key="i">
        <view class="task-icon" :style="{ background: task.bg }"><text>{{ task.icon }}</text></view>
        <view class="task-info">
          <text class="task-name">{{ task.name }}</text>
          <text class="task-desc">{{ task.desc }}</text>
        </view>
        <view class="task-action">
          <text class="task-reward">+{{ task.reward }}积分</text>
          <view class="task-btn" :class="{ done: task.done }" @tap.stop="doTask(i)">
            <text>{{ task.done ? '已完成' : '去完成' }}</text>
          </view>
        </view>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { campaignService } from '@/mock/service'

const campaigns = ref([])
const countdown = ref({ h: '08', m: '32', s: '45' })
let timer = null

const tasks = ref([
  { name: '每日签到', desc: '连续签到领额外奖励', icon: '📅', bg: 'rgba(255,107,53,0.1)', reward: 10, done: false },
  { name: '发布一条需求', desc: '首次发布得双倍积分', icon: '📝', bg: 'rgba(99,102,241,0.1)', reward: 50, done: false },
  { name: '浏览3个服务', desc: '了解平台精选服务', icon: '👀', bg: 'rgba(16,185,129,0.1)', reward: 15, done: false },
  { name: '邀请1位好友', desc: '好友注册即得奖励', icon: '👥', bg: 'rgba(245,158,11,0.1)', reward: 100, done: false },
  { name: '完善企业资料', desc: '提升信任度与曝光', icon: '🏢', bg: 'rgba(236,72,153,0.1)', reward: 30, done: true }
])

onMounted(() => {
  campaigns.value = campaignService.list()
  startCountdown()
})
onUnmounted(() => { if (timer) clearInterval(timer) })

function startCountdown() {
  let total = 8 * 3600 + 32 * 60 + 45
  timer = setInterval(() => {
    total--
    if (total < 0) total = 8 * 3600
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    countdown.value = {
      h: String(h).padStart(2, '0'),
      m: String(m).padStart(2, '0'),
      s: String(s).padStart(2, '0')
    }
  }, 1000)
}

function joinCampaign(c) {
  const routes = {
    coupon: '/pages/coupon/index',
    member: '/pages/member/index',
    invite: '/pages/user/index',
    task: '',
    rank: '/pages/dashboard/index',
    discount: '/pages/mall/list'
  }
  if (c.type === 'invite') { uni.showToast({ title: '分享链接已复制', icon: 'none' }); return }
  if (c.type === 'task') { uni.pageScrollTo({ scrollTop: 9999 }); return }
  const url = routes[c.type]
  if (url) uni.navigateTo({ url })
}

function doTask(i) {
  if (tasks.value[i].done) return
  tasks.value[i].done = true
  uni.showToast({ title: `+${tasks.value[i].reward}积分`, icon: 'success' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }

.hero { background: linear-gradient(135deg, #FF6B35, #FF9A5C); padding: 40rpx 32rpx; }
.hero-title { font-size: 40rpx; font-weight: bold; color: #FFFFFF; display: block; }
.hero-desc { font-size: 26rpx; color: rgba(255,255,255,0.9); }

.countdown-banner { display: flex; align-items: center; background: #2C2C2C; margin: 16rpx 24rpx; border-radius: 16rpx; padding: 20rpx 24rpx; }
.cb-icon { font-size: 32rpx; margin-right: 12rpx; }
.cb-text { flex: 1; font-size: 26rpx; color: #FFFFFF; font-weight: bold; }
.cb-time { display: flex; align-items: center; }
.time-box { background: #FF6B35; color: #FFFFFF; font-size: 24rpx; font-weight: bold; padding: 6rpx 12rpx; border-radius: 8rpx; min-width: 44rpx; text-align: center; }
.time-sep { color: #FFFFFF; font-size: 24rpx; margin: 0 4rpx; }

.campaign-list { padding: 8rpx 24rpx; }
.campaign-card { display: flex; background: #FFFFFF; border-radius: 16rpx; padding: 16rpx; margin-bottom: 16rpx; overflow: hidden; }
.cc-cover { width: 160rpx; height: 160rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; position: relative; flex-shrink: 0; }
.cc-emoji { font-size: 64rpx; }
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
.task-icon text { font-size: 36rpx; }
.task-info { flex: 1; }
.task-name { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.task-desc { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.task-action { display: flex; flex-direction: column; align-items: flex-end; }
.task-reward { font-size: 24rpx; color: #FF6B35; font-weight: bold; margin-bottom: 8rpx; }
.task-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; padding: 10rpx 24rpx; }
.task-btn.done { background: #F5F6FA; }
.task-btn text { font-size: 24rpx; color: #FFFFFF; font-weight: bold; }
.task-btn.done text { color: rgba(0,0,0,0.4); font-weight: normal; }
</style>