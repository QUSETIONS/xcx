<template>
  <view class="page">
    <view class="header">
      <text class="header-title">对接管理</text>
      <view class="filter-btn" :class="{ active: statusFilter }" @tap="showStatusPicker = true"><text>{{ statusFilter ? statusMap[statusFilter] : '全部状态' }}</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="lead-list" :class="{ 'animate-in': animated }">
        <view class="lead-item card-press" v-for="(item, idx) in filteredList" :key="item._id" @tap="goDemand(item.demand_id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="lead-top">
            <text class="lead-contact">{{ item.contact_name }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <text class="lead-phone">{{ item.phone }}</text>
          <text class="lead-msg" v-if="item.message">{{ item.message }}</text>
          <view class="lead-bottom">
            <text class="lead-demand">需求：{{ item.demand_title || item.demand_id }}</text>
            <text class="lead-time">{{ formatDate(item.created_at) }}</text>
          </view>
          <view class="lead-actions">
            <view class="action-btn" @tap.stop="updateStatus(item, 'contacted')"><text>已联系</text></view>
            <view class="action-btn success" @tap.stop="updateStatus(item, 'deal')"><text>成交</text></view>
            <view class="action-btn warn" @tap.stop="updateStatus(item, 'invalid')"><text>无效</text></view>
          </view>
        </view>
      </view>
      <view v-if="!filteredList.length" class="empty"><text>暂无对接记录</text></view>
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
import { LEAD_STATUS } from '@/config/constants'
import { leadService } from '@/mock/service'
import { formatDate } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.leadManage')

const statusMap = LEAD_STATUS
const statusFilter = ref('')
const refreshing = ref(false)
const showStatusPicker = ref(false)
const animated = ref(false)

const allLeads = ref(leadService.myLeads().list)
const filteredList = computed(() => {
  let list = allLeads.value
  if (statusFilter.value) list = list.filter(l => l.status === statusFilter.value)
  return list
})

function onRefresh() { refreshing.value = true; allLeads.value = leadService.myLeads().list; refreshing.value = false }
function goDemand(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function updateStatus(item, newStatus) {
  item.status = newStatus
  uni.showToast({ title: `状态已更新为${statusMap[newStatus]}`, icon: 'success' })
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.filter-btn { padding: 10rpx 20rpx; background: #FFFFFF; border-radius: 20rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-btn.active { background: rgba(255,107,53,0.1); color: #FF6B35; }

.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; }
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
.lead-bottom { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.lead-demand { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.lead-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.lead-actions { display: flex; padding-top: 12rpx; border-top: 1rpx solid #F5F6FA; }
.action-btn { padding: 8rpx 16rpx; background: #F5F6FA; border-radius: 12rpx; font-size: 22rpx; color: rgba(0,0,0,0.6); }
.action-btn.success { background: rgba(16,185,129,0.1); color: #10B981; }
.action-btn.warn { background: #F5F6FA; color: rgba(0,0,0,0.45); }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(0,0,0,0.5); }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 400; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 24rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>