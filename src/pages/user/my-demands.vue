<template>
  <view class="page">
    <view class="header">
      <text class="header-title">我的需求</text>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="demand-list" :class="{ 'animate-in': animated }">
        <view class="demand-item" v-for="(item, idx) in list" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="item-top">
            <text class="item-title">{{ item.title }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <view class="item-meta">
            <text class="item-cat">{{ item.category_name }}</text>
            <text class="item-region">{{ item.region }}</text>
          </view>
          <view class="item-stats">
            <view class="stat-box"><image class="stat-icon" src="/static/icons/eye.svg"/><text>{{ item.view_count }}</text></view>
            <view class="stat-box"><image class="stat-icon" src="/static/icons/handshake.svg"/><text>{{ item.lead_count }}</text></view>
            <text class="item-time">{{ formatDate(item.publish_time) }}</text>
          </view>
        </view>
      </view>
      <view v-if="!list.length" class="empty">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无需求</text>
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
const animated = ref(false)

function loadList() { list.value = demandService.myDemands().list }
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function goPublish() { uni.navigateTo({ url: '/pages/demand/publish' }) }
function onRefresh() { refreshing.value = true; loadList(); refreshing.value = false }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.list-scroll { height: calc(100vh - 80rpx); padding: 0 24rpx; }
.demand-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.demand-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.item-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); flex: 1; }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-published { background: rgba(16,185,129,0.1); color: #10B981; }
.status-pending { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-draft { background: #F5F6FA; color: rgba(0,0,0,0.5); }

.item-meta { display: flex; margin-bottom: 8rpx; }
.item-cat { font-size: 24rpx; color: rgba(0,0,0,0.6); }
.item-region { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.item-stats { display: flex; align-items: center; }
.stat-box { display: flex; align-items: center; }
.stat-icon { width: 18rpx; height: 18rpx; }
.stat-box text { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.item-time { margin-left: auto; font-size: 22rpx; color: rgba(0,0,0,0.4); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-btn { font-size: 24rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 12rpx 32rpx; border-radius: 24rpx; display: inline-flex; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>