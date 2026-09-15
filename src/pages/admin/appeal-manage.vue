<template>
  <view class="page">
    <view class="topbar"><view><text class="eyebrow">REVIEW QUEUE</text><text class="title">申诉复核</text><text class="subtitle">恢复展示前，请确认事实、规则和必要留痕。</text></view><text class="count">{{ appeals.length }} 条</text></view>
    <view class="filters"><text v-for="item in filters" :key="item.value" class="filter" :class="{ active: status === item.value }" @tap="changeStatus(item.value)">{{ item.label }}</text></view>
    <view v-if="loading" class="state">正在加载申诉记录…</view>
    <view v-else-if="!appeals.length" class="empty">当前没有需要复核的申诉</view>
    <view v-else class="list"><view v-for="appeal in appeals" :key="appeal._id || appeal.id" class="appeal-card"><view class="head"><view><text class="type">{{ typeLabel(appeal.target_type) }}</text><text class="time">{{ appeal.created_at }}</text></view><text class="status" :class="appeal.status">{{ statusLabel(appeal.status) }}</text></view><text class="appellant">提交人：{{ appeal.appellant?.nickname || '用户' }}</text><text class="reason">{{ appeal.reason }}</text><view v-if="appeal.status === 'pending' || appeal.status === 'reviewing'" class="actions"><text class="restore" @tap="review(appeal, 'restore')">恢复展示</text><text class="uphold" @tap="review(appeal, 'uphold')">维持处理</text></view><text v-else class="resolved">{{ appeal.decision === 'restore' ? '已恢复展示' : '维持原处理' }} · {{ appeal.resolution || '已完成复核' }}</text></view></view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { toastError } from '@/utils/feedback'

const status = ref('pending')
const appeals = ref([])
const loading = ref(false)
const filters = [{ value: 'pending', label: '待处理' }, { value: 'reviewing', label: '复核中' }, { value: '', label: '全部' }]
const typeLabel = (value) => ({ community_post: '社区动态', community_comment: '社区评论', network_post: '社群动态', network_comment: '社群评论' }[value] || '内容申诉')
const statusLabel = (value) => ({ pending: '待处理', reviewing: '复核中', resolved: '已完成', rejected: '已结束' }[value] || '待处理')

async function load() { loading.value = true; try { const result = await bridge.admin.appeals.list({ status: status.value, page: 1, pageSize: 100 }); appeals.value = result?.list || [] } catch { toastError('申诉记录加载失败') } finally { loading.value = false } }
function changeStatus(value) { status.value = value; load() }
function review(appeal, decision) { const content = decision === 'restore' ? '确认恢复该内容的公开展示？' : '确认维持当前处理结果？'; uni.showModal({ title: '完成申诉复核', content, success: async (result) => { if (!result.confirm) return; try { const updated = await bridge.admin.appeals.update(appeal._id || appeal.id, { status: 'resolved', decision, resolution: decision === 'restore' ? '经复核，内容已恢复展示。' : '经复核，维持原处理结果。' }); Object.assign(appeal, updated); if (status.value === 'pending' || status.value === 'reviewing') appeals.value = appeals.value.filter((item) => item !== appeal) } catch { toastError('申诉复核失败') } } }) }
onMounted(load)
</script>

<style scoped>
.page { min-height:100vh; padding:28rpx 24rpx 100rpx; box-sizing:border-box; background:#F7F6F2; color:#25231F; }.topbar { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:20rpx; }.eyebrow { display:block; color:#8A7B69; font:600 16rpx/1.2 monospace; letter-spacing:.1em; }.title { display:block; margin-top:8rpx; font-family:Georgia,serif; font-size:42rpx; font-weight:500; }.subtitle { display:block; margin-top:7rpx; color:#6F6B63; font-size:19rpx; }.count { color:#69574A; font-size:19rpx; }.filters { display:flex; gap:8rpx; margin-bottom:16rpx; padding:6rpx; border:1rpx solid rgba(48,42,34,.1); border-radius:10rpx; background:#FCFBF8; }.filter { flex:1; padding:11rpx 5rpx; border-radius:6rpx; color:#979189; font-size:18rpx; text-align:center; }.filter.active { color:#FCFBF8; background:#41463C; }.list { display:flex; flex-direction:column; gap:12rpx; }.appeal-card { padding:20rpx; border:1rpx solid rgba(48,42,34,.1); border-radius:10rpx; background:#FCFBF8; }.head { display:flex; align-items:flex-start; justify-content:space-between; }.type,.time,.appellant,.reason,.resolved { display:block; }.type { font-size:22rpx; font-weight:600; }.time { margin-top:5rpx; color:#979189; font-size:15rpx; }.status { color:#8A7B69; font-size:17rpx; }.appellant { margin-top:15rpx; color:#6F6B63; font-size:18rpx; }.reason { margin-top:8rpx; color:#25231F; font-size:21rpx; line-height:1.55; }.actions { display:flex; gap:10rpx; margin-top:17rpx; }.actions text { flex:1; padding:12rpx; border-radius:6rpx; font-size:19rpx; text-align:center; }.restore { color:#FCFBF8; background:#41463C; }.uphold { border:1rpx solid rgba(48,42,34,.16); color:#69574A; }.resolved { margin-top:14rpx; color:#6F6B63; font-size:18rpx; }.state,.empty { display:flex; min-height:260rpx; align-items:center; justify-content:center; color:#979189; font-size:20rpx; }
/* 复核队列在窄屏下让标题区和卡片正文收缩，筛选项保持在容器内。 */
.page { width: 100%; max-width: 100%; overflow-x: hidden; }
.topbar, .topbar > view, .filters, .filter, .list, .appeal-card, .head, .actions { min-width: 0; }
.topbar > view { flex: 1; overflow: hidden; }
.title, .subtitle, .type, .time, .appellant, .reason, .resolved { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.title, .subtitle { overflow: hidden; text-overflow: ellipsis; }
.title { white-space: nowrap; }
.count, .status, .actions text { flex: 0 0 auto; white-space: nowrap; }
.filters { flex-wrap: wrap; }
.filter { min-width: 0; }
.head { gap: 12rpx; }
.head > view { min-width: 0; flex: 1; overflow: hidden; }
.actions { flex-wrap: wrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .title { font-size: 36rpx; }
  .subtitle { white-space: normal; }
}
</style>
