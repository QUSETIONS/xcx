<template>
  <view class="page">
    <view class="header"><text class="header-title">我的对接</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="lead-list">
        <view class="lead-item" v-for="item in list" :key="item._id" @tap="goDemand(item.demand_id)">
          <view class="lead-top">
            <text class="lead-contact">{{ item.contact_name }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <text class="lead-phone">{{ item.phone }}</text>
          <text class="lead-msg" v-if="item.message">{{ item.message }}</text>
          <text class="lead-time">{{ formatDate(item.created_at) }}</text>
        </view>
      </view>
      <view v-if="!list.length" class="empty">
        <text class="empty-icon">🤝</text>
        <text>暂无对接记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { LEAD_STATUS } from '@/config/constants'
import { leadService } from '@/mock/service'

const statusMap = LEAD_STATUS
const list = ref([])
const refreshing = ref(false)

onMounted(() => loadList())
function loadList() { list.value = leadService.myLeads().list }
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function goDemand(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function onRefresh() { refreshing.value = true; loadList(); refreshing.value = false }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 140rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); }

.list-scroll { height: calc(100vh - 80rpx); padding: 0 24rpx; }
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
.lead-msg { font-size: 24rpx; color: rgba(255,255,255,0.55); display: block; margin-bottom: 8rpx; line-height: 1.4; }
.lead-time { font-size: 22rpx; color: rgba(255,255,255,0.4); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty text { font-size: 28rpx; color: rgba(255,255,255,0.5); }
</style>