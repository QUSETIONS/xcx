<template>
  <view class="page">
    <view class="header"><text class="header-title">我的需求</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="demand-list">
        <view class="demand-item" v-for="item in list" :key="item._id" @tap="goDetail(item._id)">
          <view class="item-top">
            <text class="item-title">{{ item.title }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <view class="item-meta">
            <text class="item-cat">{{ item.category_name }}</text>
            <text class="item-region">{{ item.region }}</text>
          </view>
          <view class="item-stats">
            <text>👁 {{ item.view_count }}</text>
            <text>🤝 {{ item.lead_count }}</text>
            <text class="item-time">{{ formatDate(item.publish_time) }}</text>
          </view>
        </view>
      </view>
      <view v-if="!list.length" class="empty">
        <text class="empty-icon">📋</text>
        <text>暂无需求</text>
        <text class="empty-btn" @tap="goPublish">发布需求</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DEMAND_STATUS } from '@/config/constants'
import { demandService } from '@/mock/service'

const statusMap = DEMAND_STATUS
const list = ref([])
const refreshing = ref(false)

onMounted(() => loadList())

function loadList() { list.value = demandService.myDemands().list }
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function goPublish() { uni.navigateTo({ url: '/pages/demand/publish' }) }
function onRefresh() { refreshing.value = true; loadList(); refreshing.value = false }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 140rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); }

.list-scroll { height: calc(100vh - 80rpx); padding: 0 24rpx; }
.demand-list { display: flex; flex-direction: column; gap: 12rpx; }
.demand-item { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 20rpx; }
.item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.item-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); flex: 1; }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-published { background: rgba(16,185,129,0.15); color: #34D399; }
.status-pending { background: rgba(245,158,11,0.15); color: #FBBF24; }
.status-draft { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); }
.item-meta { display: flex; gap: 16rpx; margin-bottom: 8rpx; }
.item-cat { font-size: 24rpx; color: rgba(255,255,255,0.65); }
.item-region { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.item-stats { display: flex; gap: 16rpx; }
.item-stats text { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.item-time { margin-left: auto; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty text { font-size: 28rpx; color: rgba(255,255,255,0.5); display: block; margin-bottom: 16rpx; }
.empty-btn { font-size: 24rpx; color: #FF6B35; background: rgba(255,107,53,0.12); padding: 12rpx 32rpx; border-radius: 24rpx; display: inline-flex; }
</style>