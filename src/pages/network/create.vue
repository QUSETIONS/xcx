<template>
  <view class="page" :style="a11yStyle">
    <view class="topbar">
      <view><text class="eyebrow">NETWORK STUDIO</text><text class="title">创建一个社群</text><text class="subtitle">把共同方向的人，聚到一个长期往来的空间里。</text></view>
    </view>

    <view class="form-card">
      <view class="field"><text class="label">社群名称</text><input v-model="form.name" class="input" maxlength="60" placeholder="例如：上海品牌主理人圈" placeholder-class="placeholder" /></view>
      <view class="field"><text class="label">一句话介绍</text><textarea v-model="form.description" class="textarea" maxlength="500" auto-height placeholder="说清楚这里连接谁、主要聊什么" placeholder-class="placeholder" /><text class="counter">{{ form.description.length }}/500</text></view>
      <view class="field"><text class="label">社群类型</text><view class="chip-row"><text v-for="item in groupTypes" :key="item.value" class="chip" :class="{ active: form.group_type === item.value }" @tap="form.group_type = item.value">{{ item.label }}</text></view></view>
      <view class="field"><text class="label">加入方式</text><view class="mode-grid"><view v-for="item in joinModes" :key="item.value" class="mode-card" :class="{ active: form.join_mode === item.value }" @tap="form.join_mode = item.value"><text class="mode-title">{{ item.label }}</text><text class="mode-desc">{{ item.desc }}</text></view></view></view>
      <view class="field-row"><view class="field half"><text class="label">主要城市</text><input v-model="form.city" class="input" maxlength="30" placeholder="全国 / 上海" placeholder-class="placeholder" /></view><view class="field half"><text class="label">交流方向</text><input v-model="form.industry" class="input" maxlength="40" placeholder="品牌、投资、增长" placeholder-class="placeholder" /></view></view>
    </view>

    <view class="tips"><image src="/static/icons/shield.svg" mode="aspectFit" /><view><text class="tips-title">先把边界说清楚</text><text class="tips-desc">创建后你会自动成为群主，可以继续设置分会、管理员和入群规则。</text></view></view>
    <view class="submit" :class="{ disabled: submitting || !form.name.trim() }" @tap="submit"><text>{{ submitting ? '创建中…' : '创建社群' }}</text></view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'

const submitting = ref(false)
const userStore = useUserStore()
const form = reactive({ name: '', description: '', group_type: 'community', join_mode: 'open', city: '', industry: '' })
const groupTypes = [{ value: 'community', label: '同业社群' }, { value: 'circle', label: '人脉圈' }]
const joinModes = [
  { value: 'open', label: '直接加入', desc: '适合开放交流，加入后即可发言' },
  { value: 'approval', label: '审核加入', desc: '先提交申请，由群主确认后进入' }
]

async function submit() {
  if (submitting.value || !form.name.trim()) return
  if (!(await requirePageLogin(userStore, '登录后才能创建社群'))) return
  submitting.value = true
  try {
    const group = await bridge.network.createGroup({ ...form, name: form.name.trim(), description: form.description.trim() })
    uni.showToast({ title: '社群已创建', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: `/pages/network/detail?id=${encodeURIComponent(group?._id || group?.id || '')}` }), 500)
  } catch {
    toastError('创建失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.page { min-height: 100vh; padding: 28rpx 24rpx 120rpx; color: #27334f; background: #f5f7fb; box-sizing: border-box; }
.topbar { margin-bottom: 22rpx; }.eyebrow { display: block; color: #a0aabd; font: 700 17rpx/1.2 monospace; letter-spacing: .1em; }.title { display: block; margin-top: 9rpx; color: #303b57; font-size: 42rpx; font-weight: 760; letter-spacing: -.05em; }.subtitle { display: block; margin-top: 9rpx; color: #8f9bb0; font-size: 21rpx; line-height: 1.5; }
.form-card { padding: 4rpx 20rpx 20rpx; border: 1rpx solid #e8ebf2; border-radius: 23rpx; background: #fff; box-shadow: 0 10rpx 24rpx rgba(70,87,123,.035); }.field { position: relative; margin-top: 20rpx; }.field-row { display: flex; gap: 14rpx; }.field-row .field { flex: 1; min-width: 0; }.label { display: block; margin-bottom: 9rpx; color: #59657c; font-size: 21rpx; font-weight: 700; }.input, .textarea { width: 100%; padding: 14rpx 15rpx; border: 1rpx solid #e7ebf2; border-radius: 14rpx; color: #4b5872; background: #fbfcfe; font-size: 21rpx; box-sizing: border-box; }.textarea { min-height: 125rpx; line-height: 1.55; }.placeholder { color: #b1bac7; }.counter { position: absolute; right: 14rpx; bottom: 13rpx; color: #b1bac7; font-size: 16rpx; }
.chip-row { display: flex; gap: 9rpx; }.chip { padding: 10rpx 19rpx; border: 1rpx solid #e7ebf2; border-radius: 19rpx; color: #8d99ac; background: #fff; font-size: 19rpx; }.chip.active { border-color: #8b96e7; color: #5968d8; background: #eef0ff; font-weight: 700; }.mode-grid { display: flex; gap: 10rpx; }.mode-card { flex: 1; padding: 14rpx; border: 1rpx solid #e7ebf2; border-radius: 16rpx; background: #fbfcfe; }.mode-card.active { border-color: #8b96e7; background: #f4f5ff; }.mode-title, .mode-desc { display: block; }.mode-title { color: #56627d; font-size: 21rpx; font-weight: 700; }.mode-desc { margin-top: 6rpx; color: #a0aabd; font-size: 17rpx; line-height: 1.45; }.tips { display: flex; gap: 12rpx; margin-top: 17rpx; padding: 16rpx; border: 1rpx solid #f1e8da; border-radius: 18rpx; background: #fffaf1; }.tips image { width: 28rpx; height: 28rpx; margin-top: 2rpx; opacity: .6; }.tips-title, .tips-desc { display: block; }.tips-title { color: #735d3c; font-size: 20rpx; font-weight: 700; }.tips-desc { margin-top: 5rpx; color: #ad9878; font-size: 18rpx; line-height: 1.45; }.submit { margin-top: 24rpx; padding: 16rpx; border-radius: 18rpx; color: #fff; background: #6573dc; font-size: 22rpx; font-weight: 700; text-align: center; }.submit.disabled { opacity: .45; pointer-events: none; }
</style>
