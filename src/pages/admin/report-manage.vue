<template>
  <view class="page">
    <view class="topbar"><view><text class="eyebrow">CONTENT SAFETY</text><text class="title">举报处理</text><text class="subtitle">先看事实，再决定保留还是隐藏内容。</text></view><text class="count">{{ reports.length }} 条</text></view>
    <view class="filters"><text v-for="item in filters" :key="item.value" class="filter" :class="{ active: status === item.value }" @tap="changeFilter(item.value)">{{ item.label }}</text></view>
    <view v-if="loading" class="state">正在加载举报记录…</view>
    <view v-else-if="!reports.length" class="empty"><image src="/static/icons/shield.svg" mode="aspectFit" /><text>当前没有待处理举报</text></view>
    <view v-else class="list"><view v-for="report in reports" :key="report._id || report.id" class="report-card"><view class="report-head"><view><text class="type">{{ typeLabel(report.target_type) }}</text><text class="report-time">{{ report.created_at }}</text></view><text class="state-label" :class="report.status">{{ statusLabel(report.status) }}</text></view><text class="reason">{{ reasonLabel(report.reason) }}</text><text v-if="report.detail" class="detail">{{ report.detail }}</text><view class="target"><text>对象：{{ report.target_id }}</text><text>反馈人：{{ report.reporter?.nickname || report.reporter_name || '用户' }}</text></view><view v-if="report.status === 'pending' || report.status === 'reviewing'" class="actions"><view class="action keep" @tap="review(report, 'keep')">保留内容</view><view class="action hide" @tap="review(report, 'hide')">隐藏内容</view></view><view v-else class="resolved">{{ report.decision === 'hide' ? '已隐藏' : '已保留' }} · {{ report.resolution || '已完成复核' }}</view></view></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { toastError } from '@/utils/feedback'

const status = ref('pending')
const reports = ref([])
const loading = ref(true)
const filters = [{ value: 'pending', label: '待处理' }, { value: 'reviewing', label: '处理中' }, { value: 'resolved', label: '已处理' }, { value: '', label: '全部' }]
const typeLabel = (type) => ({ user: '用户举报', group: '社群举报', community_post: '社区动态', community_comment: '社区评论', network_post: '群内动态', network_comment: '群内评论' }[type] || '内容举报')
const reasonLabel = (reason) => ({ spam: '垃圾广告', abuse: '骚扰或攻击', fraud: '虚假或诈骗', copyright: '侵权内容', other: '其他问题' }[reason] || reason || '其他问题')
const statusLabel = (value) => ({ pending: '待处理', reviewing: '处理中', resolved: '已完成', rejected: '已驳回' }[value] || value)
async function load() { loading.value = true; try { const result = await bridge.admin.reports.list({ status: status.value, page: 1, pageSize: 100 }); reports.value = result?.list || [] } catch { toastError('举报记录加载失败') } finally { loading.value = false } }
function changeFilter(value) { status.value = value; load() }
async function review(report, decision) { try { const result = await bridge.admin.reports.update(report._id || report.id, { status: 'resolved', decision, resolution: decision === 'hide' ? '经复核，内容违反社区规范，已隐藏。' : '经复核，暂不构成违规，保留内容。' }); Object.assign(report, result); uni.showToast({ title: decision === 'hide' ? '内容已隐藏' : '已保留内容', icon: 'none' }); if (status.value === 'pending' || status.value === 'reviewing') reports.value = reports.value.filter((item) => item !== report) } catch { toastError('举报处理失败') } }
onShow(load)
</script>

<style scoped lang="scss">
.page { min-height: 100vh; padding: 28rpx 24rpx 100rpx; color: #27334f; background: #f5f7fb; box-sizing: border-box; }.topbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 19rpx; }.eyebrow { display: block; color: #a0aabd; font: 700 16rpx/1.2 monospace; letter-spacing: .1em; }.title { display: block; margin-top: 8rpx; color: #303b57; font-size: 40rpx; font-weight: 760; }.subtitle { display: block; margin-top: 7rpx; color: #8f9bb0; font-size: 19rpx; }.count { color: #6573dc; font-size: 19rpx; }.filters { display: flex; gap: 8rpx; margin-bottom: 13rpx; padding: 6rpx; border: 1rpx solid #e7ebf3; border-radius: 18rpx; background: #fff; }.filter { flex: 1; padding: 11rpx 5rpx; border-radius: 13rpx; color: #9aa5b6; font-size: 18rpx; text-align: center; }.filter.active { color: #5968d8; background: #eef0ff; font-weight: 700; }.list { display: flex; flex-direction: column; gap: 11rpx; }.report-card { padding: 17rpx; border: 1rpx solid #e8ebf2; border-radius: 19rpx; background: #fff; }.report-head { display: flex; align-items: flex-start; justify-content: space-between; }.type, .report-time { display: block; }.type { color: #4a5670; font-size: 21rpx; font-weight: 700; }.report-time { margin-top: 5rpx; color: #a0aabd; font-size: 15rpx; }.state-label { padding: 5rpx 9rpx; border-radius: 7rpx; color: #b27b3d; background: #fff4dd; font-size: 15rpx; }.state-label.resolved { color: #2f9b82; background: #e8f7f2; }.state-label.rejected { color: #a0aabd; background: #f2f4f8; }.reason { display: block; margin-top: 14rpx; color: #6573dc; font-size: 20rpx; font-weight: 700; }.detail { display: block; margin-top: 6rpx; color: #66728a; font-size: 19rpx; line-height: 1.5; }.target { display: flex; flex-direction: column; gap: 4rpx; margin-top: 12rpx; color: #9aa5b6; font-size: 16rpx; }.actions { display: flex; gap: 9rpx; margin-top: 15rpx; }.action { flex: 1; padding: 11rpx; border-radius: 13rpx; font-size: 18rpx; text-align: center; }.keep { color: #2f9b82; background: #e8f7f2; }.hide { color: #d86b59; background: #fff0ed; }.resolved { margin-top: 13rpx; color: #9aa5b6; font-size: 17rpx; }.state, .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260rpx; color: #9aa5b6; font-size: 20rpx; }.empty image { width: 48rpx; height: 48rpx; margin-bottom: 13rpx; opacity: .4; }
/* 举报队列在窄屏下让标题区和卡片正文收缩，操作按钮在卡片内换行。 */
.page { width: 100%; max-width: 100%; overflow-x: hidden; }
.topbar, .topbar > view, .filters, .filter, .list, .report-card, .report-head, .actions { min-width: 0; }
.topbar > view { flex: 1; overflow: hidden; }
.title, .subtitle, .type, .report-time, .reason, .detail, .resolved { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.title, .subtitle { overflow: hidden; text-overflow: ellipsis; }
.title { white-space: nowrap; }
.count, .state-label, .action { flex: 0 0 auto; white-space: nowrap; }
.filters { flex-wrap: wrap; }
.filter { min-width: 0; }
.report-head { gap: 12rpx; }
.report-head > view { min-width: 0; flex: 1; overflow: hidden; }
.actions { flex-wrap: wrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .title { font-size: 36rpx; }
  .subtitle { white-space: normal; }
}
</style>
