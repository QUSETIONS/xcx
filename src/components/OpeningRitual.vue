<template>
  <view
    class="opening-ritual"
    :class="[
      `opening-ritual--${phase}`,
      { 'opening-ritual--closing': closing }
    ]"
    role="status"
    aria-live="polite"
    aria-label="媒合智联正在打开"
    @touchmove.stop.prevent="blockScroll"
    @wheel.stop.prevent="blockScroll"
  >
    <view class="opening-ritual__shell">
      <view class="opening-ritual__stage">
        <view class="opening-ritual__stage-halo" />
        <view class="opening-ritual__stage-mark opening-ritual__stage-mark--top" />
        <view class="opening-ritual__stage-mark opening-ritual__stage-mark--right" />
        <view class="opening-ritual__stage-mark opening-ritual__stage-mark--bottom" />
        <view class="opening-ritual__stage-mark opening-ritual__stage-mark--left" />
        <view class="opening-ritual__edition">
          <text>MEDIAMATCH / ATELIER 01</text>
          <text>上海 · 2024</text>
        </view>
        <view class="opening-ritual__card-shadow" />
        <view class="opening-ritual__card">
          <view class="opening-ritual__card-edge" />
          <view class="opening-ritual__card-topline">
            <text>MEDIA / MATCH</text>
            <text>01</text>
          </view>
          <view class="opening-ritual__card-seal-frame">
            <image class="opening-ritual__seal" :src="openingSeal" mode="aspectFit" />
          </view>
          <view class="opening-ritual__card-wordmark">MEDIAMATCH</view>
          <view class="opening-ritual__card-caption">THE ART OF CONNECTION</view>
          <view class="opening-ritual__card-footer">
            <text>OPENING EDITION</text>
            <view />
            <text>MM / 01</text>
          </view>
        </view>
        <view class="opening-ritual__light-sweep" />
        <view class="opening-ritual__stage-caption">
          <text>THE NETWORK, REFINED</text>
          <text>一件关于连接的作品</text>
        </view>
      </view>

      <view class="opening-ritual__lockup">
        <text class="opening-ritual__name">MEDIAMATCH</text>
        <view class="opening-ritual__lockup-rule"><view /></view>
        <text class="opening-ritual__caption">媒合智联</text>
      </view>

      <view class="opening-ritual__footer">
        <view class="opening-ritual__footer-rule" />
        <text class="opening-ritual__status">{{ statusText }}</text>
      </view>

      <button class="opening-ritual__skip" aria-label="跳过开屏动画" @tap="skip">跳过</button>
    </view>
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import openingSeal from '@/static/images/opening-seal.png'

const emit = defineEmits(['complete'])
const phase = ref('calibrating')
const closing = ref(false)
const timers = []
let done = false
const OPENING_TIMING = {
  drawing: 140,
  locked: 520,
  complete: 980,
  exit: 220
}

const statusText = computed(() => {
  if (phase.value === 'drawing') return '抽取你的合作网络'
  if (phase.value === 'locked') return '连接已就位'
  return '校准连接封印'
})

function later(callback, delay) {
  const timer = setTimeout(callback, delay)
  timers.push(timer)
  return timer
}

function complete() {
  if (done) return
  done = true
  timers.splice(0).forEach(clearTimeout)
  closing.value = true
  later(() => emit('complete'), OPENING_TIMING.exit)
}

function skip() {
  if (done) return
  phase.value = 'locked'
  complete()
}

const scrollLockTargets = []

function lockPageScroll() {
  if (typeof document === 'undefined') return

  const targets = [document.documentElement, document.body, document.querySelector('#app')].filter(Boolean)
  targets.forEach((element) => {
    scrollLockTargets.push({
      element,
      overflow: element.style.overflow,
      overflowY: element.style.overflowY,
      overscrollBehavior: element.style.overscrollBehavior,
      touchAction: element.style.touchAction
    })
    element.style.overflow = 'hidden'
    element.style.overflowY = 'hidden'
    element.style.overscrollBehavior = 'none'
    element.style.touchAction = 'none'
  })
}

function unlockPageScroll() {
  scrollLockTargets.splice(0).forEach(({ element, overflow, overflowY, overscrollBehavior, touchAction }) => {
    element.style.overflow = overflow
    element.style.overflowY = overflowY
    element.style.overscrollBehavior = overscrollBehavior
    element.style.touchAction = touchAction
  })
}

function blockScroll(event) {
  event?.preventDefault?.()
}

onMounted(() => {
  lockPageScroll()
  // 首屏数据已并行加载，开屏只保留一次轻量品牌过渡，不能占住用户入口。
  later(() => { if (!done) phase.value = 'drawing' }, OPENING_TIMING.drawing)
  later(() => { if (!done) phase.value = 'locked' }, OPENING_TIMING.locked)
  later(complete, OPENING_TIMING.complete)
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  unlockPageScroll()
})
</script>

<style scoped>
.opening-ritual {
  position: fixed;
  z-index: 9999;
  inset: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  color: #24191A;
  background: #EEE7DC;
  opacity: 1;
  overscroll-behavior: none;
  touch-action: none;
  user-select: none;
  transition: opacity .48s ease;
  pointer-events: auto;
}

.opening-ritual--closing {
  opacity: 0;
  pointer-events: none;
}

.opening-ritual__shell {
  display: flex;
  width: 100%;
  width: min(100%, 680rpx);
  height: 100%;
  min-height: 0;
  padding: calc(44rpx + env(safe-area-inset-top)) 32rpx calc(36rpx + env(safe-area-inset-bottom));
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.opening-ritual__stage {
  position: relative;
  width: 100%;
  max-width: 590rpx;
  height: 680rpx;
  min-height: 560rpx;
  overflow: hidden;
  border: 2rpx solid #B49460;
  border-radius: 4rpx;
  background: #351A20;
  box-shadow: 0 26rpx 54rpx rgba(62, 25, 34, .2);
  transform: translateZ(0);
  transform-style: preserve-3d;
}

.opening-ritual__stage::before,
.opening-ritual__stage::after {
  position: absolute;
  z-index: 0;
  content: '';
  pointer-events: none;
}

.opening-ritual__stage::before {
  inset: 16rpx;
  border: 1rpx solid rgba(240, 226, 194, .76);
  border-radius: 2rpx;
}

.opening-ritual__stage::after {
  inset: 0;
  background: radial-gradient(circle at 50% 44%, rgba(180, 148, 96, .15), transparent 42%), linear-gradient(135deg, rgba(255, 241, 214, .05), transparent 45%);
  opacity: .9;
}

.opening-ritual__stage-halo {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  width: 74%;
  height: 58%;
  border: 1rpx solid rgba(226, 196, 137, .34);
  border-radius: 50%;
  opacity: .68;
  transform: translate(-50%, -50%) rotate(-14deg);
  animation: opening-stage-halo 22s linear infinite;
}

.opening-ritual__stage-halo::before,
.opening-ritual__stage-halo::after {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1rpx solid rgba(226, 196, 137, .2);
  border-radius: 50%;
  content: '';
  transform: translate(-50%, -50%);
}

.opening-ritual__stage-halo::before {
  width: 72%;
  height: 72%;
}

.opening-ritual__stage-halo::after {
  width: 2rpx;
  height: 2rpx;
  border: 0;
  background: #F9E9C1;
  box-shadow: 0 0 14rpx 4rpx rgba(249, 233, 193, .48);
}

.opening-ritual__stage-mark {
  position: absolute;
  z-index: 2;
  width: 12rpx;
  height: 12rpx;
  border: 1rpx solid #E9DEC9;
  border-radius: 50%;
  background: #B49460;
  box-shadow: 0 0 0 6rpx rgba(180, 148, 96, .1);
}

.opening-ritual__stage-mark--top { top: 19%; left: 50%; transform: translateX(-50%); }
.opening-ritual__stage-mark--right { top: 50%; right: 12%; transform: translateY(-50%); }
.opening-ritual__stage-mark--bottom { bottom: 19%; left: 50%; transform: translateX(-50%); }
.opening-ritual__stage-mark--left { top: 50%; left: 12%; transform: translateY(-50%); }

.opening-ritual__edition {
  position: absolute;
  z-index: 4;
  top: 44rpx;
  right: 44rpx;
  left: 44rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(240, 226, 194, .58);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16rpx;
  letter-spacing: .12em;
}

.opening-ritual__card-shadow {
  position: absolute;
  z-index: 2;
  right: 19%;
  bottom: 10%;
  left: 19%;
  height: 9%;
  border-radius: 50%;
  background: rgba(21, 8, 12, .64);
  opacity: 0;
  filter: blur(5rpx);
  transition: opacity .7s ease;
}

.opening-ritual__card {
  position: absolute;
  z-index: 3;
  bottom: 10%;
  left: 50%;
  width: 58%;
  height: 61%;
  border: 2rpx solid #B49460;
  background: linear-gradient(135deg, #F8F2E8 0%, #EEE4D5 100%);
  box-shadow: 8rpx 22rpx 34rpx rgba(18, 7, 10, .32);
  opacity: 0;
  transform: translate3d(-50%, 56%, 0) rotateX(16deg) rotateZ(-4deg);
  transform-origin: center bottom;
  transition: opacity .48s ease, transform 1.62s cubic-bezier(.12, .8, .2, 1), box-shadow .8s ease;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: opacity, transform;
}

.opening-ritual__card::before,
.opening-ritual__card::after {
  position: absolute;
  content: '';
  pointer-events: none;
}

.opening-ritual__card::before {
  z-index: 0;
  top: 7rpx;
  right: -8rpx;
  bottom: -10rpx;
  left: 8rpx;
  border: 1rpx solid rgba(180, 148, 96, .38);
  background: #E5D8C8;
  transform: translateZ(-8rpx);
}

.opening-ritual__card::after {
  z-index: 4;
  inset: 12rpx;
  border: 1rpx solid rgba(180, 148, 96, .4);
}

.opening-ritual__card-edge {
  position: absolute;
  z-index: 1;
  inset: 22rpx;
  border: 1rpx solid rgba(180, 148, 96, .26);
}

.opening-ritual__card-topline {
  position: absolute;
  z-index: 2;
  top: 34rpx;
  right: 34rpx;
  left: 34rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(92, 40, 40, .58);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14rpx;
  letter-spacing: .1em;
}

.opening-ritual__card-seal-frame {
  position: absolute;
  z-index: 1;
  top: 24%;
  left: 50%;
  width: 66%;
  height: 46%;
  border: 1rpx solid rgba(180, 148, 96, .5);
  border-radius: 50%;
  transform: translateX(-50%) rotate(-8deg);
}

.opening-ritual__card-seal-frame::before,
.opening-ritual__card-seal-frame::after {
  position: absolute;
  top: 50%;
  width: 18rpx;
  height: 1rpx;
  background: #B49460;
  content: '';
}

.opening-ritual__card-seal-frame::before { left: -9rpx; }
.opening-ritual__card-seal-frame::after { right: -9rpx; }

.opening-ritual__seal {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 64%;
  height: auto;
  opacity: .24;
  transform: translate3d(-50%, -50%, 0) rotate(-18deg) scale(.82);
  transition: opacity .6s ease;
  will-change: opacity, transform;
}

.opening-ritual__card-wordmark {
  position: absolute;
  z-index: 2;
  right: 24rpx;
  bottom: 56rpx;
  left: 24rpx;
  color: #5A2530;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 20rpx;
  letter-spacing: .24em;
  text-align: center;
}

.opening-ritual__card-caption {
  position: absolute;
  z-index: 2;
  right: 24rpx;
  bottom: 37rpx;
  left: 24rpx;
  color: rgba(92, 40, 40, .52);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11rpx;
  letter-spacing: .08em;
  text-align: center;
}

.opening-ritual__card-footer {
  position: absolute;
  z-index: 2;
  right: 34rpx;
  bottom: 19rpx;
  left: 34rpx;
  display: flex;
  align-items: center;
  color: rgba(92, 40, 40, .46);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10rpx;
  letter-spacing: .08em;
}

.opening-ritual__card-footer view {
  flex: 1;
  height: 1rpx;
  margin: 0 10rpx;
  background: rgba(180, 148, 96, .52);
}

.opening-ritual__light-sweep {
  position: absolute;
  z-index: 5;
  top: -18%;
  left: -28%;
  width: 18%;
  height: 136%;
  background: linear-gradient(90deg, transparent, rgba(255, 241, 202, .36), transparent);
  opacity: 0;
  transform: rotate(18deg) skewX(-10deg);
  pointer-events: none;
}

.opening-ritual__stage-caption {
  position: absolute;
  z-index: 4;
  right: 44rpx;
  bottom: 42rpx;
  left: 44rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(240, 226, 194, .46);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14rpx;
  letter-spacing: .1em;
}

.opening-ritual--drawing .opening-ritual__card,
.opening-ritual--locked .opening-ritual__card {
  opacity: 1;
  transform: translate3d(-50%, 0, 0) rotateX(4deg) rotateZ(-3deg);
}

.opening-ritual--drawing .opening-ritual__card-shadow,
.opening-ritual--locked .opening-ritual__card-shadow {
  opacity: 1;
}

.opening-ritual--locked .opening-ritual__card {
  box-shadow: 7rpx 15rpx 28rpx rgba(18, 7, 10, .22), 0 0 0 1rpx rgba(226, 196, 137, .12);
  transform: translate3d(-50%, 0, 0) rotateX(0deg) rotateZ(0deg);
}

.opening-ritual--drawing .opening-ritual__seal {
  opacity: 1;
  animation: opening-seal-turn 2.1s cubic-bezier(.12, .78, .2, 1) both;
}

.opening-ritual--locked .opening-ritual__seal {
  opacity: 1;
  transform: translate3d(-50%, -50%, 0) rotate(360deg) scale(1);
  animation: opening-seal-breathe 1.5s ease-in-out .12s both;
}

.opening-ritual--drawing .opening-ritual__light-sweep {
  animation: opening-light-sweep 1.5s .52s cubic-bezier(.2, .72, .2, 1) both;
}

.opening-ritual--locked .opening-ritual__stage-halo {
  opacity: .94;
  animation: opening-stage-lock 1.2s ease-out both;
}

.opening-ritual--locked .opening-ritual__stage::after {
  animation: opening-stage-flare 1s ease-out both;
}

.opening-ritual--locked .opening-ritual__stage-caption {
  color: rgba(240, 226, 194, .68);
}

.opening-ritual__lockup {
  display: flex;
  margin-top: 44rpx;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: translateY(14rpx);
  transition: opacity .72s ease .16s, transform .82s cubic-bezier(.2, .72, .2, 1) .16s;
}

.opening-ritual--locked .opening-ritual__lockup {
  opacity: 1;
  transform: translateY(0);
}

.opening-ritual__name {
  color: #24191A;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 28rpx;
  letter-spacing: .24em;
}

.opening-ritual__lockup-rule {
  display: flex;
  width: 172rpx;
  height: 18rpx;
  align-items: center;
  justify-content: center;
}

.opening-ritual__lockup-rule::before,
.opening-ritual__lockup-rule::after {
  width: 64rpx;
  height: 1rpx;
  background: #B49460;
  content: '';
}

.opening-ritual__lockup-rule view {
  width: 8rpx;
  height: 8rpx;
  margin: 0 12rpx;
  background: #B49460;
  transform: rotate(45deg);
}

.opening-ritual__caption {
  color: #24191A;
  font-family: 'Songti SC', 'Noto Serif CJK SC', serif;
  font-size: 36rpx;
  letter-spacing: .2em;
}

.opening-ritual__footer {
  display: flex;
  width: 100%;
  max-width: 420rpx;
  margin-top: 58rpx;
  align-items: center;
  justify-content: center;
  color: rgba(36, 25, 26, .52);
}

.opening-ritual__footer-rule {
  width: 72rpx;
  height: 1rpx;
  margin-right: 16rpx;
  background: rgba(180, 148, 96, .7);
}

.opening-ritual__status {
  font-size: 18rpx;
  letter-spacing: .1em;
}

.opening-ritual__skip {
  min-width: 96rpx;
  margin: 26rpx 0 0;
  padding: 4rpx 16rpx;
  border: 0;
  color: rgba(36, 25, 26, .46);
  background: transparent;
  font-size: 18rpx;
  line-height: 1.8;
}

.opening-ritual__skip::after { border: 0; }

@keyframes opening-stage-halo {
  to { transform: translate(-50%, -50%) rotate(346deg); }
}

@keyframes opening-stage-lock {
  0% { opacity: .68; transform: translate(-50%, -50%) rotate(-14deg) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1.04); }
  100% { opacity: .94; transform: translate(-50%, -50%) rotate(4deg) scale(1); }
}

@keyframes opening-stage-flare {
  0% { opacity: .9; }
  45% { opacity: 1; }
  100% { opacity: .9; }
}

@keyframes opening-light-sweep {
  0% { left: -28%; opacity: 0; }
  18% { opacity: 1; }
  100% { left: 116%; opacity: 0; }
}

@keyframes opening-seal-turn {
  0% { opacity: .24; transform: translate3d(-50%, -50%, 0) rotate(-18deg) scale(.82); }
  58% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(286deg) scale(1.04); }
  100% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(360deg) scale(1); }
}

@keyframes opening-seal-breathe {
  0% { transform: translate3d(-50%, -50%, 0) rotate(360deg) scale(1); }
  55% { transform: translate3d(-50%, -50%, 0) rotate(360deg) scale(1.025); }
  100% { transform: translate3d(-50%, -50%, 0) rotate(360deg) scale(1); }
}

@media (max-width: 420px) {
  .opening-ritual__shell { padding-right: 24rpx; padding-left: 24rpx; }
  .opening-ritual__stage { height: 560rpx; min-height: 440rpx; }
  .opening-ritual__edition { top: 32rpx; right: 32rpx; left: 32rpx; font-size: 13rpx; }
  .opening-ritual__stage-caption { right: 32rpx; bottom: 32rpx; left: 32rpx; font-size: 12rpx; }
  .opening-ritual__lockup { margin-top: 30rpx; }
  .opening-ritual__footer { margin-top: 36rpx; }
}

@media (prefers-reduced-motion: reduce) {
  /* 保留低幅度、低速动效；开屏不能因为系统偏好而静默消失。 */
  .opening-ritual__stage-halo { animation-duration: 40s; }
  .opening-ritual__seal { animation-duration: 3.4s !important; }
  .opening-ritual__card { transition-duration: 2.4s; }
}
</style>
