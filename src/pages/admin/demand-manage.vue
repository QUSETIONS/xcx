<template>
  <view class="page">
    <view class="header">
      <text class="header-title">{{ t('titles.demandManage') }}</text>
      <view class="header-actions">
        <view class="filter-btn" :class="{ active: statusFilter }" @tap="showStatusPicker = true"><text>{{ statusFilter ? statusMap[statusFilter] : t('common.all') }}</text></view>
      </view>
      <view class="search-row">
        <input class="search-input" v-model="keyword" placeholder="搜索需求、公司或地区" confirm-type="search" @confirm="doSearch" />
        <text v-if="keyword" class="search-clear" @tap="clearSearch">✕</text>
        <text class="search-submit" @tap="doSearch">搜索</text>
      </view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !filteredList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view class="demand-list" :class="{ 'animate-in': animated }">
        <view class="demand-item card-press" v-for="(item, idx) in filteredList" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="item-top">
            <text class="item-title">{{ item.title }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <view class="item-meta">
            <text class="item-company">{{ companyName(item.company_name) }}</text>
            <text class="item-region">{{ regionName(item.region) }}</text>
          </view>
          <view class="item-flags" v-if="item.is_top || item.is_featured">
            <text v-if="item.is_top" class="flag flag-top">置顶</text>
            <text v-if="item.is_featured" class="flag flag-featured">精选</text>
          </view>
          <view class="item-stats">
            <view class="stat-box card-press"><text>{{ item.view_count }} 次浏览</text></view>
            <view class="stat-box card-press"><text>{{ item.lead_count }} 条对接</text></view>
            <text class="item-time">{{ formatDate(item.publish_time) }}</text>
          </view>
          <view class="item-actions">
            <view class="action-btn" @tap.stop="editDemand(item)"><text>{{ t('admin.edit') }}</text></view>
            <view class="action-btn flag-action" :class="{ active: item.is_top }" @tap.stop="toggleFlag(item, 'is_top')"><text>{{ item.is_top ? '取消置顶' : '置顶' }}</text></view>
            <view class="action-btn flag-action" :class="{ active: item.is_featured }" @tap.stop="toggleFlag(item, 'is_featured')"><text>{{ item.is_featured ? '取消精选' : '精选' }}</text></view>
            <view class="action-btn warn" v-if="item.status === 'published'" @tap.stop="offlineDemand(item)"><text>{{ t('admin.offline') }}</text></view>
            <view class="action-btn success" v-if="item.status === 'offline'" @tap.stop="publishDemand(item)"><text>{{ t('admin.online') }}</text></view>
            <view class="action-btn danger" @tap.stop="deleteDemand(item)"><text>{{ t('admin.delete') }}</text></view>
          </view>
        </view>
      </view>
      <view v-if="loading && filteredList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="!filteredList.length && !loading" class="empty"><text>{{ t('admin.emptyDemand') }}</text></view>
    </scroll-view>

    <view v-if="showStatusPicker" class="picker-mask" @tap="showStatusPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('admin.selectStatus') }}</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !statusFilter }" @tap="selectStatus('')"><text>{{ t('common.all') }}</text></view>
          <view class="picker-opt" :class="{ active: statusFilter === k }" v-for="(v, k) in statusMap" :key="k" @tap="selectStatus(k)"><text>{{ v }}</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { demandStatusMap as statusMap, regionName, companyName } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { formatDate } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
useNavTitle('titles.demandManage')

const statusFilter = ref('')
const keyword = ref('')
const showStatusPicker = ref(false)
const animated = ref(true)

const { list: allDemands, loading, refreshing, load: loadList, refresh } = useList(
  (params) => bridge.admin.demands.list({ ...params, page: 1, pageSize: 100, status: statusFilter.value || undefined, keyword: keyword.value.trim() || undefined }),
  100
)
const filteredList = computed(() => {
  let list = allDemands.value
  if (statusFilter.value) list = list.filter(d => d.status === statusFilter.value)
  return list
})

function onRefresh() { refresh() }
function selectStatus(status) {
  statusFilter.value = status
  showStatusPicker.value = false
  loadList(true)
}
function doSearch() { loadList(true) }
function clearSearch() { keyword.value = ''; loadList(true) }
onMounted(() => loadList(true))
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }

function editDemand(item) { uni.navigateTo({ url: `/pages/demand/publish?id=${item._id}` }) }
function offlineDemand(item) {
  uni.showModal({ title: t('admin.confirmOffline'), content: t('admin.offlineContent').replace('{title}', item.title), success: (res) => {
    if (res.confirm) updateDemandStatus(item, 'offline')
  }})
}
function publishDemand(item) {
  uni.showModal({ title: t('admin.confirmOnline'), content: t('admin.onlineContent').replace('{title}', item.title), success: (res) => {
    if (res.confirm) updateDemandStatus(item, 'published')
  }})
}
async function updateDemandStatus(item, status) {
  try {
    const updated = await bridge.admin.demands.updateStatus(item._id, status)
    if (updated) Object.assign(item, updated)
    uni.showToast({ title: status === 'published' ? t('admin.onlined') : t('admin.offlined'), icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || t('common.loadFailed'), icon: 'none' })
  }
}
async function toggleFlag(item, field) {
  const nextValue = !item[field]
  try {
    const updated = await bridge.admin.demands.updateFlags(item._id, { [field]: nextValue })
    if (updated) Object.assign(item, updated)
    uni.showToast({ title: nextValue ? (field === 'is_top' ? '已置顶' : '已设为精选') : (field === 'is_top' ? '已取消置顶' : '已取消精选'), icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || t('common.loadFailed'), icon: 'none' })
  }
}
function deleteDemand(item) {
  uni.showModal({ title: t('admin.confirmDelete'), content: t('admin.deleteContent').replace('{title}', item.title), success: (res) => {
    if (res.confirm) removeDemand(item)
  }})
}
async function removeDemand(item) {
  try {
    await bridge.admin.demands.delete(item._id)
    const idx = allDemands.value.findIndex(d => d._id === item._id)
    if (idx > -1) allDemands.value.splice(idx, 1)
    uni.showToast({ title: t('admin.deleted'), icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || t('common.loadFailed'), icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx 24rpx 16rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.header-actions { display: flex; position: absolute; top: 24rpx; right: 24rpx; }
.filter-btn { padding: 10rpx 20rpx; background: #FFFFFF; border-radius: 20rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-btn.active { background: rgba(255,107,53,0.1); color: #FF6B35; }
.search-row { display: flex; align-items: center; padding: 14rpx 18rpx; border-radius: 18rpx; background: #FFFFFF; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.search-input { flex: 1; min-width: 0; color: rgba(0,0,0,0.8); font-size: 24rpx; }
.search-clear { margin: 0 12rpx; color: rgba(0,0,0,0.35); font-size: 21rpx; }
.search-submit { color: #FF6B35; font-size: 23rpx; }

.list-scroll { height: calc(100vh - 220rpx); padding: 0 24rpx; }
.demand-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.demand-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.item-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); flex: 1; }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-published { background: rgba(16,185,129,0.1); color: #10B981; }
.status-pending { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-draft { background: #F5F6FA; color: rgba(0,0,0,0.5); }
.status-offline { background: rgba(239,68,68,0.1); color: #EF4444; }
.item-meta { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.item-company { font-size: 24rpx; color: rgba(0,0,0,0.6); }
.item-region { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.item-flags { display: flex; gap: 8rpx; margin-bottom: 8rpx; }
.flag { padding: 4rpx 9rpx; border-radius: 7rpx; font-size: 18rpx; }
.flag-top { color: #d77c2d; background: #fff3df; }
.flag-featured { color: #6372d8; background: #eef0ff; }
.item-stats { display: flex; margin-bottom: 12rpx; }
.stat-box text { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.item-time { margin-left: auto; font-size: 22rpx; color: rgba(0,0,0,0.4); }
.item-actions { display: flex; flex-wrap: wrap; gap: 8rpx; padding-top: 12rpx; border-top: 1rpx solid #F5F6FA; }
.action-btn { padding: 8rpx 16rpx; background: #F5F6FA; border-radius: 12rpx; font-size: 22rpx; color: rgba(0,0,0,0.6); }
.flag-action.active { color: #6372d8; background: #eef0ff; }
.action-btn.success { background: rgba(16,185,129,0.1); color: #10B981; }
.action-btn.warn { background: rgba(245,158,11,0.1); color: #F59E0B; }
.action-btn.danger { background: rgba(239,68,68,0.1); color: #EF4444; }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(0,0,0,0.5); }
.loading { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1200; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 24rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
/* 后台列表统一采用“固定页面 + 剩余空间滚动”，避免搜索区和列表叠加后产生横向/纵向溢出。 */
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .list-scroll, .demand-item, .item-top, .item-meta, .item-stats { min-width: 0; }
.header { position: relative; flex: 0 0 auto; }
.header-title { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.header-actions { max-width: 100%; flex-wrap: wrap; }
.filter-btn, .search-submit, .action-btn, .status-tag, .flag { flex: 0 0 auto; white-space: nowrap; }
.search-row { min-width: 0; max-width: 100%; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; box-sizing: border-box; }
.item-title { min-width: 0; overflow: hidden; overflow-wrap: anywhere; word-break: break-word; }
.status-tag { margin-left: 8rpx; }
.item-company, .item-region, .item-time { min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-meta { gap: 12rpx; }
.item-actions { max-width: 100%; }
</style>
