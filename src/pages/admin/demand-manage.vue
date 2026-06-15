<template>
  <view class="page">
    <view class="header">
      <text class="header-title">需求管理</text>
      <view class="header-actions">
        <view class="search-box" @tap="showSearch = true"><text>🔍 搜索</text></view>
        <view class="filter-btn" :class="{ active: statusFilter }" @tap="showStatusPicker = true"><text>{{ statusFilter || '全部' }}</text></view>
      </view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="demand-list">
        <view class="demand-item" v-for="item in filteredList" :key="item._id" @tap="goDetail(item._id)">
          <view class="item-top">
            <text class="item-title">{{ item.title }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <view class="item-meta">
            <text class="item-company">{{ item.company_name }}</text>
            <text class="item-region">{{ item.region }}</text>
          </view>
          <view class="item-stats">
            <text>👁 {{ item.view_count }}</text>
            <text>🤝 {{ item.lead_count }}</text>
            <text class="item-time">{{ formatDate(item.publish_time) }}</text>
          </view>
        </view>
      </view>
      <view v-if="!filteredList.length" class="empty"><text>暂无需求</text></view>
    </scroll-view>

    <view v-if="showStatusPicker" class="picker-mask" @tap="showStatusPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-opt" :class="{ active: !statusFilter }" @tap="statusFilter = ''; showStatusPicker = false"><text>全部</text></view>
        <view class="picker-opt" :class="{ active: statusFilter === k }" v-for="(v, k) in statusMap" :key="k" @tap="statusFilter = k; showStatusPicker = false"><text>{{ v }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { DEMAND_STATUS } from '@/config/constants'
import { demandService } from '@/mock/service'

const statusMap = DEMAND_STATUS
const statusFilter = ref('')
const refreshing = ref(false)
const showStatusPicker = ref(false)
const showSearch = ref(false)

const allDemands = ref(demandService.list({ pageSize: 50, sort: 'latest' }).list)
const filteredList = computed(() => {
  let list = allDemands.value
  if (statusFilter.value) list = list.filter(d => d.status === statusFilter.value)
  return list
})

function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function onRefresh() { refreshing.value = true; allDemands.value = demandService.list({ pageSize: 50, sort: 'latest' }).list; refreshing.value = false }
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 140rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 16rpx; }
.header-actions { display: flex; gap: 12rpx; }
.search-box, .filter-btn { padding: 10rpx 20rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; font-size: 24rpx; color: rgba(255,255,255,0.65); }
.filter-btn.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }

.list-scroll { height: calc(100vh - 160rpx); padding: 0 24rpx; }
.demand-list { display: flex; flex-direction: column; gap: 12rpx; }
.demand-item { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 20rpx; }
.item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.item-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); flex: 1; }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-published { background: rgba(16,185,129,0.15); color: #34D399; }
.status-pending { background: rgba(245,158,11,0.15); color: #FBBF24; }
.status-draft { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
.status-offline { background: rgba(239,68,68,0.15); color: #F87171; }
.item-meta { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.item-company { font-size: 24rpx; color: rgba(255,255,255,0.65); }
.item-region { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.item-stats { display: flex; gap: 16rpx; }
.item-stats text { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.item-time { margin-left: auto; }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(255,255,255,0.5); }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 400; display: flex; align-items: flex-end; justify-content: center; padding: 24rpx; }
.picker-panel { display: flex; flex-wrap: wrap; gap: 12rpx; background: #1A1A26; border-radius: 24rpx; padding: 24rpx; width: 100%; }
.picker-opt { padding: 14rpx 28rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; font-size: 26rpx; color: rgba(255,255,255,0.65); }
.picker-opt.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }
</style>