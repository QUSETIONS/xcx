<template>
  <view class="page">
    <view class="header"><text class="header-title">我的对接</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="lead-list" :class="{ 'animate-in': animated }">
        <view class="lead-item card-press" v-for="(item, idx) in list" :key="item._id" @tap="goDemand(item.demand_id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
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
        <text class="empty-text">暂无对接记录</text>
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
const animated = ref(false)

function loadList() { list.value = leadService.myLeads().list }
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function goDemand(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function onRefresh() { refreshing.value = true; loadList(); refreshing.value = false }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.list-scroll { height: calc(100vh - 80rpx); padding: 0 24rpx; }
.lead-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.lead-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.lead-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.lead-contact { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-new { background: rgba(59,130,246,0.1); color: #3B82F6; }
.status-contacted { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-deal { background: rgba(16,185,129,0.1); color: #10B981; }
.status-invalid { background: #F5F6FA; color: rgba(0,0,0,0.45); }

.lead-phone { font-size: 24rpx; color: rgba(0,0,0,0.6); display: block; margin-bottom: 8rpx; }
.lead-msg { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 8rpx; line-height: 1.4; }
.lead-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>