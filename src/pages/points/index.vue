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
    <!-- 积分卡片 -->
    <view class="points-card">
      <view class="pc-top">
        <text class="pc-label">{{ t('points.myPoints') }}</text>
        <text class="pc-num">{{ info.balance }}</text>
      </view>
      <view class="pc-streak">
        <image class="pc-fire" src="/static/icons/star.svg" mode="aspectFit" />
        <text class="pc-streak-text">{{ t('points.streak').replace('{n}', info.checkinStreak) }}</text>
      </view>
    <view class="pc-checkin-btn" :class="{ checked: info.todayChecked, submitting: checking }" @tap="doCheckin">
        <text>{{ checking ? t('common.loading') : (info.todayChecked ? t('points.todayChecked') : t('points.checkin') + (info.checkinStreak % 7 === 6 ? 50 : 10)) }}</text>
      </view>
    </view>

    <!-- 签到日历 -->
    <view class="calendar-card">
      <text class="card-title">{{ t('points.weekTitle') }}</text>
      <view class="week-row">
        <view class="day-item" v-for="(day, i) in weekDays" :key="i">
          <text class="day-label">{{ day.label }}</text>
          <view class="day-circle" :class="{ done: i < info.checkinStreak % 7 || (info.checkinStreak % 7 === 0 && info.todayChecked), today: i === (info.checkinStreak - 1) % 7 }">
            <text v-if="i < (info.checkinStreak - 1) % 7 || (info.todayChecked && i === (info.checkinStreak - 1) % 7)" class="day-check">✓</text>
            <text v-else class="day-num">{{ day.points }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 积分规则 -->
    <view class="rules-card">
      <text class="card-title">{{ t('points.rulesTitle') }}</text>
      <view class="rule-item" v-for="(rule, i) in info.rules" :key="i">
        <text class="rule-action">{{ rule.action }}</text>
        <text class="rule-points">{{ rule.points }}</text>
      </view>
    </view>

    <!-- 积分记录 -->
    <view class="history-card">
      <text class="card-title">{{ t('points.historyTitle') }}</text>
      <view class="history-item" v-for="(item, i) in history" :key="i">
        <view class="hi-left">
          <text class="hi-desc">{{ item.desc }}</text>
          <text class="hi-date">{{ item.date }}</text>
        </view>
        <text class="hi-points">+{{ item.points }}</text>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.points')

const userStore = useUserStore()

const info = ref({ balance: 0, checkinStreak: 0, todayChecked: false, rules: [] })
const history = ref([])

const { state: loadState, run: loadRequest } = useRequest(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能查看积分'))) return null
  const [nextInfo, nextHistory] = await Promise.all([
    bridge.points.getInfo(),
    bridge.points.history()
  ])
  return { info: nextInfo, history: nextHistory }
})
const { state: checkinState, run: checkinRequest } = useRequest(() => bridge.points.checkin())
const checking = computed(() => checkinState.value === 'loading')

async function reload() {
  try {
    const data = await loadRequest()
    if (!data) return
    info.value = data.info || { balance: 0, checkinStreak: 0, todayChecked: false, rules: [] }
    history.value = data.history || []
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

const weekDays = computed(() => {
  const labels = t('points.days')
  const points = [10, 10, 10, 10, 10, 10, 50]
  return labels.map((label, i) => ({ label, points: points[i] }))
})

async function doCheckin() {
  if (checking.value || info.value.todayChecked) return
  try {
    const res = await checkinRequest()
    if (res.success) {
      await reload()
      uni.showToast({ title: t('points.checkinSuccess').replace('{n}', res.points), icon: 'success' })
    } else {
      uni.showToast({ title: t('points.alreadyChecked'), icon: 'none' })
    }
  } catch {
    toastError(t('common.loadFailed'))
  }
}
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }

.points-card { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 20rpx; padding: 32rpx; margin-bottom: 16rpx; }
.pc-top { display: flex; flex-direction: column; margin-bottom: 16rpx; }
.pc-label { font-size: 26rpx; color: rgba(255,255,255,0.8); }
.pc-num { font-size: 64rpx; font-weight: bold; color: #FFFFFF; margin-top: 4rpx; }
.pc-streak { display: flex; align-items: center; margin-bottom: 20rpx; }
.pc-fire { width: 24rpx; height: 24rpx; margin-right: 8rpx; }
.pc-streak-text { font-size: 24rpx; color: rgba(255,255,255,0.9); }
.pc-checkin-btn { background: rgba(255,255,255,0.95); border-radius: 32rpx; padding: 20rpx; text-align: center; transition: all 0.15s ease; }
.pc-checkin-btn:active { transform: scale(0.97); }
.pc-checkin-btn text { font-size: 30rpx; font-weight: bold; color: #FF6B35; }
.pc-checkin-btn.checked { background: rgba(255,255,255,0.3); }
.pc-checkin-btn.checked text { color: rgba(255,255,255,0.7); }

.calendar-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 20rpx; }
.week-row { display: flex; justify-content: space-between; }
.day-item { display: flex; flex-direction: column; align-items: center; }
.day-label { font-size: 22rpx; color: rgba(0,0,0,0.4); margin-bottom: 12rpx; }
.day-circle { width: 64rpx; height: 64rpx; border-radius: 50%; background: #F5F6FA; display: flex; align-items: center; justify-content: center; }
.day-circle.done { background: rgba(255,107,53,0.1); }
.day-circle.today { background: #FF6B35; }
.day-check { font-size: 28rpx; color: #FF6B35; }
.day-circle.today .day-check { color: #FFFFFF; }
.day-num { font-size: 20rpx; color: rgba(0,0,0,0.4); }

.rules-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.rule-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #F5F6FA; }
.rule-item:last-child { border-bottom: none; }
.rule-action { font-size: 28rpx; color: rgba(0,0,0,0.7); }
.rule-points { font-size: 28rpx; font-weight: bold; color: #FF6B35; }

.history-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #F5F6FA; }
.history-item:last-child { border-bottom: none; }
.hi-left { display: flex; flex-direction: column; }
.hi-desc { font-size: 28rpx; color: rgba(0,0,0,0.8); }
.hi-date { font-size: 22rpx; color: rgba(0,0,0,0.4); margin-top: 4rpx; }
.hi-points { font-size: 32rpx; font-weight: bold; color: #10B981; }

/* Overflow guard: rules and history contain translated/user-provided labels. */
.page,
.points-card,
.calendar-card,
.rules-card,
.history-card,
.pc-top,
.pc-streak,
.week-row,
.day-item,
.rule-item,
.history-item,
.hi-left { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.pc-label,
.pc-num,
.pc-streak-text,
.card-title,
.rule-action,
.rule-points,
.hi-desc,
.hi-date,
.hi-points { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.pc-streak-text,
.rule-action,
.hi-desc,
.hi-date { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-top,
.pc-streak,
.week-row,
.rule-item,
.history-item { gap: 10rpx; }
.pc-checkin-btn,
.day-item,
.rule-points,
.hi-points { flex: 0 0 auto; }
.day-item { width: auto; flex: 1 1 0; }
.hi-left { flex: 1 1 auto; overflow: hidden; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .points-card,
  .calendar-card,
  .rules-card,
  .history-card { padding-right: 18rpx; padding-left: 18rpx; }
  .day-circle { width: 54rpx; height: 54rpx; }
  .day-label { font-size: 20rpx; }
}
</style>
