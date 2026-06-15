<template>
  <view class="page">
    <view class="header">
      <text class="header-title">对接管理</text>
      <view class="filter-btn" :class="{ active: statusFilter }" @tap="showStatusPicker = true"><text>{{ statusFilter ? statusMap[statusFilter] : '全部状态' }}</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="lead-list">
        <view class="lead-item" v-for="item in filteredList" :key="item._id" @tap="goDemand(item.demand_id)">
          <view class="lead-top">
            <text class="lead-contact">{{ item.contact_name }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <text class="lead-phone">{{ item.phone }}</text>
          <view class="lead-bottom">
            <text class="lead-demand">需求：{{ item.demand_id }}</text>
            <text class="lead-time">{{ formatDate(item.created_at) }}</text>
          </view>
          <text class="lead-message" v-if="item.message">{{ item.message }}</text>
        </view>
      </view>
      <view v-if="!filteredList.length" class="empty"><text>暂无对接记录</text></view>
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
import { LEAD_STATUS } from '@/config/constants'
import { leadService } from '@/mock/service'

const statusMap = LEAD_STATUS
const statusFilter = ref('')
const refreshing = ref(false)
const showStatusPicker = ref(false)

const allLeads = ref(leadService.myLeads().list)
const filteredList = computed(() => {
  let list = allLeads.value
  if (statusFilter.value) list = list.filter(l => l.status === statusFilter.value)
  return list
})

function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function onRefresh() { refreshing.value = true; allLeads.value = leadService.myLeads().list; refreshing.value = false }
function goDemand(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 140rpx; }
.header { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.filter-btn { padding: 10rpx 20rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; font-size: 24rpx; color: rgba(255,255,255,0.65); }
.filter-btn.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }

.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; }
.lead-list { display: flex; flex-direction: column; gap: 12rpx; }
.lead-item { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 20rpx; }
.lead-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.lead-contact { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-new { background: rgba(59,130,246,0.15); color: #60A5FA; }
.status-contacted { background: rgba(245,158,11,0.15); color: #FBBF24; }
.status-deal { background: rgba(16,185,129,0.15); color: #34D399; }
.status-invalid { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); }
.lead-phone { font-size: 24rpx; color: rgba(255,255,255,0.65); display: block; margin-bottom: 8rpx; }
.lead-bottom { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.lead-demand { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.lead-time { font-size: 22rpx; color: rgba(255,255,255,0.4); }
.lead-message { font-size: 24rpx; color: rgba(255,255,255,0.6); display: block; line-height: 1.4; padding-top: 8rpx; border-top: 1rpx solid rgba(255,255,255,0.06); }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(255,255,255,0.5); }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 400; display: flex; align-items: flex-end; justify-content: center; padding: 24rpx; }
.picker-panel { display: flex; flex-wrap: wrap; gap: 12rpx; background: #1A1A26; border-radius: 24rpx; padding: 24rpx; width: 100%; }
.picker-opt { padding: 14rpx 28rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; font-size: 26rpx; color: rgba(255,255,255,0.65); }
.picker-opt.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }
</style>