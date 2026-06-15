<template>
  <view class="page">
    <view class="header">
      <text class="header-title">需求管理</text>
      <view class="header-actions">
        <view class="filter-btn" :class="{ active: statusFilter }" @tap="showStatusPicker = true"><text>{{ statusFilter ? statusMap[statusFilter] : '全部' }}</text></view>
      </view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="demand-list" :class="{ 'animate-in': animated }">
        <view class="demand-item" v-for="(item, idx) in filteredList" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="item-top">
            <text class="item-title">{{ item.title }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <view class="item-meta">
            <text class="item-company">{{ item.company_name }}</text>
            <text class="item-region">{{ item.region }}</text>
          </view>
          <view class="item-stats">
            <view class="stat-box"><text>👁 {{ item.view_count }}</text></view>
            <view class="stat-box"><text>🤝 {{ item.lead_count }}</text></view>
            <text class="item-time">{{ formatDate(item.publish_time) }}</text>
          </view>
          <view class="item-actions">
            <view class="action-btn" @tap.stop="editDemand(item)"><text>编辑</text></view>
            <view class="action-btn warn" v-if="item.status === 'published'" @tap.stop="offlineDemand(item)"><text>下架</text></view>
            <view class="action-btn success" v-if="item.status === 'offline'" @tap.stop="publishDemand(item)"><text>上架</text></view>
            <view class="action-btn danger" @tap.stop="deleteDemand(item)"><text>删除</text></view>
          </view>
        </view>
      </view>
      <view v-if="!filteredList.length" class="empty"><text>暂无需求</text></view>
    </scroll-view>

    <view v-if="showStatusPicker" class="picker-mask" @tap="showStatusPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>选择状态</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !statusFilter }" @tap="statusFilter = ''; showStatusPicker = false"><text>全部</text></view>
          <view class="picker-opt" :class="{ active: statusFilter === k }" v-for="(v, k) in statusMap" :key="k" @tap="statusFilter = k; showStatusPicker = false"><text>{{ v }}</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DEMAND_STATUS } from '@/config/constants'
import { demandService } from '@/mock/service'

const statusMap = DEMAND_STATUS
const statusFilter = ref('')
const refreshing = ref(false)
const showStatusPicker = ref(false)
const animated = ref(false)

const allDemands = ref(demandService.list({ pageSize: 50, sort: 'latest' }).list)
const filteredList = computed(() => {
  let list = allDemands.value
  if (statusFilter.value) list = list.filter(d => d.status === statusFilter.value)
  return list
})

onMounted(() => { setTimeout(() => { animated.value = true }, 100) })
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function onRefresh() { refreshing.value = true; allDemands.value = demandService.list({ pageSize: 50, sort: 'latest' }).list; refreshing.value = false }
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }

function editDemand(item) { uni.showToast({ title: '编辑功能开发中', icon: 'none' }) }
function offlineDemand(item) {
  uni.showModal({ title: '确认下架', content: `确定要下架「${item.title}」吗？`, success: (res) => {
    if (res.confirm) { item.status = 'offline'; uni.showToast({ title: '已下架', icon: 'success' }) }
  }})
}
function publishDemand(item) {
  uni.showModal({ title: '确认上架', content: `确定要上架「${item.title}」吗？`, success: (res) => {
    if (res.confirm) { item.status = 'published'; uni.showToast({ title: '已上架', icon: 'success' }) }
  }})
}
function deleteDemand(item) {
  uni.showModal({ title: '确认删除', content: `确定要删除「${item.title}」吗？`, success: (res) => {
    if (res.confirm) {
      const idx = allDemands.value.findIndex(d => d._id === item._id)
      if (idx > -1) allDemands.value.splice(idx, 1)
      uni.showToast({ title: '已删除', icon: 'success' })
    }
  }})
}
</script>

<style lang="scss">
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.header-actions { display: flex; gap: 12rpx; }
.filter-btn { padding: 10rpx 20rpx; background: #FFFFFF; border-radius: 20rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-btn.active { background: rgba(255,107,53,0.1); color: #FF6B35; }

.list-scroll { height: calc(100vh - 160rpx); padding: 0 24rpx; }
.demand-list { display: flex; flex-direction: column; gap: 12rpx; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.demand-item { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
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
.item-stats { display: flex; gap: 16rpx; margin-bottom: 12rpx; }
.stat-box text { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.item-time { margin-left: auto; font-size: 22rpx; color: rgba(0,0,0,0.4); }
.item-actions { display: flex; gap: 12rpx; padding-top: 12rpx; border-top: 1rpx solid #F5F6FA; }
.action-btn { padding: 8rpx 16rpx; background: #F5F6FA; border-radius: 12rpx; font-size: 22rpx; color: rgba(0,0,0,0.6); }
.action-btn.success { background: rgba(16,185,129,0.1); color: #10B981; }
.action-btn.warn { background: rgba(245,158,11,0.1); color: #F59E0B; }
.action-btn.danger { background: rgba(239,68,68,0.1); color: #EF4444; }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(0,0,0,0.5); }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 400; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 24rpx; }
.picker-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>