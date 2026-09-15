<template>
  <view class="page">
    <view class="intro">
      <text class="eyebrow">CONTENT REVIEW</text>
      <text class="title">举报与申诉</text>
      <text class="copy">我们会保留处理记录，并在复核完成后通过消息中心通知你。</text>
    </view>

    <view v-if="targetType && targetId" class="appeal-card">
      <text class="card-label">内容状态通知</text>
      <text class="card-title">对这条内容提出申诉</text>
      <textarea v-model="reason" class="reason" maxlength="500" placeholder="请说明你认为处理有误的原因，并补充必要背景。" />
      <view class="submit" :class="{ disabled: submitting }" @tap="submitAppeal">{{ submitting ? '提交中…' : '提交申诉' }}</view>
    </view>

    <view class="section-head"><text>我的申诉记录</text><text class="count">{{ appeals.length }} 条</text></view>
    <view v-if="loading" class="empty">正在加载…</view>
    <view v-else-if="!appeals.length" class="empty">暂时没有申诉记录</view>
    <view v-else class="list">
      <view v-for="item in appeals" :key="item._id || item.id" class="appeal-row">
        <view class="row-head"><text class="row-title">{{ typeLabel(item.target_type) }}</text><text class="status" :class="item.status">{{ statusLabel(item.status, item.decision) }}</text></view>
        <text class="row-reason">{{ item.reason }}</text>
        <text v-if="item.resolution" class="row-resolution">处理说明：{{ item.resolution }}</text>
        <text class="row-time">{{ item.created_at }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
import { toastError } from '@/utils/feedback'

const userStore = useUserStore()
const appeals = ref([])
const loading = ref(false)
const submitting = ref(false)
const targetType = ref('')
const targetId = ref('')
const reason = ref('')

onLoad((query = {}) => {
  targetType.value = String(query.target_type || '')
  targetId.value = String(query.target_id || '')
})

const typeLabel = (value) => ({ community_post: '社区动态', community_comment: '社区评论', network_post: '社群动态', network_comment: '社群评论' }[value] || '内容申诉')
const statusLabel = (status, decision) => {
  if (decision === 'restore') return '已恢复'
  if (status === 'resolved' || status === 'rejected') return '已复核'
  if (status === 'reviewing') return '复核中'
  return '待处理'
}

async function load() {
  if (!(await requirePageLogin(userStore, '登录后才能查看申诉记录'))) return
  loading.value = true
  try {
    const result = await bridge.governance.appeals()
    appeals.value = result?.list || []
  } catch (error) {
    toastError(error?.message || '申诉记录加载失败')
  } finally { loading.value = false }
}

async function submitAppeal() {
  if (submitting.value) return
  if (!targetType.value || !targetId.value) return toastError('缺少申诉对象')
  if (reason.value.trim().length < 10) return toastError('请至少说明 10 个字的申诉理由')
  submitting.value = true
  try {
    const created = await bridge.governance.appeal({ target_type: targetType.value, target_id: targetId.value, reason: reason.value.trim() })
    const id = created?._id || created?.id
    if (!appeals.value.some((item) => (item._id || item.id) === id)) appeals.value.unshift(created)
    reason.value = ''
    uni.showToast({ title: '申诉已提交', icon: 'success' })
  } catch (error) {
    toastError(error?.message || '申诉提交失败')
  } finally { submitting.value = false }
}

onMounted(load)
</script>

<style scoped>
.page { min-height: 100vh; padding: 44rpx 28rpx 96rpx; box-sizing: border-box; background: #F7F6F2; color: #25231F; }
.intro { padding: 8rpx 4rpx 38rpx; }.eyebrow,.card-label { display:block; color:#8A7B69; font:600 18rpx/1.2 monospace; letter-spacing:.12em; }.title { display:block; margin-top:12rpx; font-family:Georgia,serif; font-size:52rpx; font-weight:500; }.copy { display:block; margin-top:14rpx; color:#6F6B63; font-size:25rpx; line-height:1.65; }
.appeal-card,.appeal-row { border:1rpx solid rgba(48,42,34,.12); border-radius:12rpx; background:#FCFBF8; }.appeal-card { padding:28rpx; margin-bottom:34rpx; }.card-title { display:block; margin-top:12rpx; font-size:31rpx; font-weight:600; }.reason { width:100%; min-height:160rpx; margin-top:20rpx; padding:18rpx; box-sizing:border-box; border:1rpx solid rgba(48,42,34,.14); border-radius:8rpx; color:#25231F; background:#F7F6F2; font-size:26rpx; line-height:1.6; }.submit { margin-top:18rpx; padding:20rpx; border-radius:7rpx; color:#FCFBF8; background:#41463C; font-size:26rpx; text-align:center; }.submit.disabled { opacity:.55; }
.section-head { display:flex; align-items:center; justify-content:space-between; margin:12rpx 4rpx 18rpx; font-size:30rpx; font-weight:600; }.count { color:#8A7B69; font-size:22rpx; font-weight:400; }.list { display:flex; flex-direction:column; gap:16rpx; }.appeal-row { padding:24rpx; }.row-head { display:flex; justify-content:space-between; gap:16rpx; }.row-title { font-size:27rpx; font-weight:600; }.status { color:#8A7B69; font-size:22rpx; }.status.resolved,.status.rejected { color:#556052; }.row-reason,.row-resolution,.row-time { display:block; }.row-reason { margin-top:14rpx; color:#5E5A53; font-size:24rpx; line-height:1.6; }.row-resolution { margin-top:12rpx; color:#41463C; font-size:23rpx; line-height:1.55; }.row-time { margin-top:16rpx; color:#979189; font-size:20rpx; }.empty { padding:72rpx 0; color:#979189; font-size:25rpx; text-align:center; }
/* Overflow guard: review records and resolution text can be arbitrarily long. */
.page,
.intro,
.appeal-card,
.section-head,
.list,
.appeal-row,
.row-head { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.intro,
.appeal-card,
.appeal-row { overflow-wrap: anywhere; word-break: break-word; }
.section-head > text:first-child,
.row-head > text:first-child { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count,
.status { flex: 0 0 auto; white-space: nowrap; }
.row-reason,
.row-resolution,
.row-time { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }

@media (max-width: 420px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .appeal-card,
  .appeal-row { padding-right: 18rpx; padding-left: 18rpx; }
}
</style>
