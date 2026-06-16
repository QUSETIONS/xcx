<template>
  <view class="page">
    <!-- 积分卡片 -->
    <view class="points-card">
      <view class="pc-top">
        <text class="pc-label">我的积分</text>
        <text class="pc-num">{{ info.balance }}</text>
      </view>
      <view class="pc-streak">
        <text class="pc-fire">🔥</text>
        <text class="pc-streak-text">已连续签到 {{ info.checkinStreak }} 天</text>
      </view>
      <view class="pc-checkin-btn" :class="{ checked: info.todayChecked }" @tap="doCheckin">
        <text>{{ info.todayChecked ? '今日已签到' : '立即签到 +' + (info.checkinStreak % 6 === 0 ? 50 : 10) }}</text>
      </view>
    </view>

    <!-- 签到日历 -->
    <view class="calendar-card">
      <text class="card-title">本周签到</text>
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
      <text class="card-title">积分规则</text>
      <view class="rule-item" v-for="(rule, i) in info.rules" :key="i">
        <text class="rule-action">{{ rule.action }}</text>
        <text class="rule-points">{{ rule.points }}</text>
      </view>
    </view>

    <!-- 积分记录 -->
    <view class="history-card">
      <text class="card-title">积分记录</text>
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
import { ref } from 'vue'
import { pointsService } from '@/mock/service'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.points')

const info = ref(pointsService.getInfo())
const history = ref(pointsService.history())
const weekDays = [
  { label: '一', points: 10 },
  { label: '二', points: 10 },
  { label: '三', points: 10 },
  { label: '四', points: 10 },
  { label: '五', points: 10 },
  { label: '六', points: 10 },
  { label: '日', points: 50 },
]

function doCheckin() {
  const res = pointsService.checkin()
  if (res.success) {
    info.value = pointsService.getInfo()
    history.value = pointsService.history()
    uni.showToast({ title: `签到成功 +${res.points}`, icon: 'success' })
  } else {
    uni.showToast({ title: '今天已签到', icon: 'none' })
  }
}
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }

.points-card { background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 20rpx; padding: 32rpx; margin-bottom: 16rpx; }
.pc-top { display: flex; flex-direction: column; margin-bottom: 16rpx; }
.pc-label { font-size: 26rpx; color: rgba(255,255,255,0.8); }
.pc-num { font-size: 64rpx; font-weight: bold; color: #FFFFFF; margin-top: 4rpx; }
.pc-streak { display: flex; align-items: center; margin-bottom: 20rpx; }
.pc-fire { font-size: 24rpx; margin-right: 8rpx; }
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
</style>