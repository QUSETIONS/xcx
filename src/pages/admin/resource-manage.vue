<template>
  <view class="page">
    <view class="header"><view><text class="header-title">资料管理</text><text class="header-subtitle">维护资料、访问权限与发布状态</text></view><view class="add-btn" @tap="goAdd"><text>+ 新增</text></view></view>
    <view class="toolbar"><view class="search"><text class="search-icon">⌕</text><input v-model="keyword" placeholder="搜索标题、摘要或标签" @confirm="load" /><text v-if="keyword" class="clear" @tap="keyword = ''; load()">×</text></view><view class="status-tabs"><text v-for="item in statuses" :key="item.value" :class="{ active: status === item.value }" @tap="selectStatus(item.value)">{{ item.label }}</text></view></view>
    <view class="summary"><text>当前显示 <strong>{{ total }}</strong> 份</text><text>精选 <strong>{{ featuredCount }}</strong></text></view>
    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-for="(item, idx) in list" :key="item._id" class="resource-item" :style="{ animationDelay: (idx * .06) + 's' }">
        <view class="resource-head"><text class="resource-title">{{ item.title }}</text><text class="status" :class="item.status">{{ statusLabel(item.status) }}</text></view>
        <text class="resource-meta">{{ item.category_name || '未分类' }} · {{ item.file_type || '文件' }} · {{ item.file_size || '未标注大小' }} · {{ item.is_free ? '免费' : '¥' + (item.price / 100).toFixed(0) }}</text>
        <text class="resource-summary">{{ item.summary || '暂无摘要' }}</text>
        <view class="resource-counts"><text>浏览 {{ item.view_count || 0 }}</text><text>下载 {{ item.download_count || 0 }}</text><text>购买 {{ item.purchase_count || 0 }}</text></view>
        <view class="actions"><text class="action" @tap="edit(item)">编辑</text><text class="action" @tap="toggleStatus(item)">{{ item.status === 'published' ? '下线' : '发布' }}</text><text class="action danger" @tap="remove(item)">归档</text></view>
      </view>
      <view v-if="!list.length" class="empty">暂无资料</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.resourceManage')

const list = ref([])
const total = ref(0)
const keyword = ref('')
const status = ref('')
const refreshing = ref(false)
const statuses = [{ value: '', label: '全部' }, { value: 'published', label: '已发布' }, { value: 'draft', label: '草稿' }, { value: 'offline', label: '已下线' }]
const featuredCount = computed(() => list.value.filter(item => item.is_featured).length)
async function load() { const res = await bridge.admin.resources.list({ page: 1, pageSize: 100, keyword: keyword.value, status: status.value }); list.value = res.list || []; total.value = res.total || list.value.length }
async function onRefresh() { refreshing.value = true; await load(); refreshing.value = false }
function selectStatus(value) { if (status.value !== value) { status.value = value; load() } }
onMounted(load)
function goAdd() { uni.navigateTo({ url: '/pages/admin/resource-edit' }) }
function edit(item) { uni.navigateTo({ url: `/pages/admin/resource-edit?id=${item._id}` }) }
function statusLabel(status) { return status === 'published' ? '已发布' : status === 'draft' ? '草稿' : '已下线' }
async function toggleStatus(item) {
  const next = item.status === 'published' ? 'offline' : 'published'
  try { const updated = await bridge.admin.resources.update(item._id, { status: next }); Object.assign(item, updated); uni.showToast({ title: next === 'published' ? '已发布' : '已下线', icon: 'success' }) }
  catch (error) { uni.showToast({ title: error?.message || '状态更新失败', icon: 'none' }) }
}
function remove(item) {
  uni.showModal({ title: '确认删除', content: `确定删除「${item.title}」吗？`, success: async ({ confirm }) => {
    if (!confirm) return
    try { await bridge.admin.resources.delete(item._id); list.value = list.value.filter(row => row._id !== item._id); uni.showToast({ title: '已删除', icon: 'success' }) }
    catch (error) { uni.showToast({ title: error?.message || '删除失败', icon: 'none' }) }
  }})
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding-bottom: 120rpx; background: #F5F6FA; }.header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; }
.header-title { color: rgba(0,0,0,.85); font-size: 36rpx; font-weight: 700; }
.header-subtitle { display: block; margin-top: 6rpx; color: rgba(0,0,0,.42); font-size: 21rpx; }
.add-btn { padding: 10rpx 24rpx; border-radius: 20rpx; color: #fff; background: #FF6B35; font-size: 24rpx; }
.toolbar { padding: 0 24rpx 12rpx; }.search { display: flex; align-items: center; padding: 0 16rpx; height: 68rpx; border: 1rpx solid #E7EBF2; border-radius: 16rpx; background: #FFF; }.search-icon { margin-right: 9rpx; color: #94A0B4; font-size: 36rpx; }.search input { flex: 1; color: #36435D; font-size: 23rpx; }.clear { color: #9AA6B8; font-size: 30rpx; }.status-tabs { display: flex; margin-top: 12rpx; }.status-tabs text { margin-right: 10rpx; padding: 8rpx 14rpx; border-radius: 10rpx; color: #8995A8; background: #FFF; font-size: 20rpx; }.status-tabs text.active { color: #5968D8; background: #EEF0FF; font-weight: 700; }.summary { display: flex; gap: 22rpx; padding: 0 24rpx 12rpx; color: #9AA6B8; font-size: 20rpx; }.summary strong { color: #5968D8; font-size: 24rpx; }
.list-scroll { height: calc(100vh - 270rpx); padding: 0 24rpx; box-sizing: border-box; }
.resource-item { margin-bottom: 14rpx; padding: 22rpx; border-radius: 18rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); animation: rise .35s ease-out both; }
.resource-head, .actions { display: flex; justify-content: space-between; align-items: center; }
.resource-title { flex: 1; color: rgba(0,0,0,.85); font-size: 29rpx; font-weight: 700; }
.status { margin-left: 14rpx; padding: 5rpx 12rpx; border-radius: 10rpx; color: #10B981; background: rgba(16,185,129,.1); font-size: 20rpx; }
.status.draft { color: #F59E0B; background: rgba(245,158,11,.1); }.status.offline { color: #8A94A6; background: #F2F4F7; }
.resource-meta, .resource-summary { display: block; margin-top: 10rpx; color: rgba(0,0,0,.48); font-size: 22rpx; line-height: 1.5; }.resource-summary { color: rgba(0,0,0,.62); }
.resource-counts { display: flex; gap: 18rpx; margin-top: 10rpx; color: #A0AABD; font-size: 19rpx; }
.actions { justify-content: flex-end; gap: 16rpx; margin-top: 16rpx; padding-top: 14rpx; border-top: 1rpx solid #F1F2F5; }
.action { padding: 8rpx 18rpx; border-radius: 12rpx; color: #5968D8; background: #EEF0FF; font-size: 23rpx; }.action.danger { color: #EF4444; background: #FFF0F0; }
.empty { padding: 80rpx; color: rgba(0,0,0,.45); text-align: center; font-size: 28rpx; }
@keyframes rise { from { opacity: 0; transform: translateY(14rpx); } to { opacity: 1; transform: translateY(0); } }
/* 后台列表统一采用“固定页面 + 剩余空间滚动”，筛选条和操作列在窄屏自动收缩。 */
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .toolbar, .summary, .list-scroll, .resource-item, .resource-head, .resource-counts, .actions { min-width: 0; }
.header { flex: 0 0 auto; gap: 14rpx; }
.header > view:first-child { min-width: 0; flex: 1; overflow: hidden; }
.header-title, .header-subtitle, .resource-title, .resource-meta, .resource-summary { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.header-title, .resource-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.add-btn, .status, .action { flex: 0 0 auto; white-space: nowrap; }
.toolbar { flex: 0 0 auto; }
.search, .search input, .status-tabs { min-width: 0; max-width: 100%; }
.search input { overflow: hidden; }
.status-tabs { flex-wrap: wrap; gap: 8rpx; }
.status-tabs text { margin-right: 0; flex: 0 0 auto; white-space: nowrap; }
.summary { flex: 0 0 auto; flex-wrap: wrap; gap: 8rpx 22rpx; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; }
.resource-head { gap: 12rpx; align-items: flex-start; }
.resource-head .status { margin-left: 0; }
.resource-counts { flex-wrap: wrap; gap: 8rpx 18rpx; }
.actions { flex-wrap: wrap; }
</style>
