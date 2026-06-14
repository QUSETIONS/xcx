<template>
  <view class="manage-page">
    <view class="manage-header"><text>需求管理</text></view>
    <scroll-view class="list-scroll" scroll-y>
      <view class="list-item" v-for="item in list" :key="item._id">
        <text class="item-title">{{ item.title }}</text>
        <view class="item-row">
          <text class="item-company">{{ item.company_name }}</text>
          <text class="item-status">{{ item.status }}</text>
        </view>
        <view class="item-actions">
          <text class="action-btn" @tap="updateStatus(item._id, 'published')">通过</text>
          <text class="action-btn reject" @tap="updateStatus(item._id, 'offline')">下架</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { demandService } from '@/mock/service'

const list = ref(demandService.list({ pageSize: 50 }).list)
function updateStatus(id, status) { demandService.updateStatus(id, status); uni.showToast({ title: '已更新', icon: 'success' }) }
</script>

<style lang="scss" scoped>
.manage-page { min-height: 100vh; background: #f5f5f5; }
.manage-header { padding: 24rpx; background: #fff; font-size: 32rpx; font-weight: 600; }
.list-scroll { height: calc(100vh - 80rpx); padding: 16rpx 24rpx; }
.list-item { background: #fff; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.item-title { font-size: 28rpx; color: #333; display: block; margin-bottom: 8rpx; }
.item-row { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.item-company { font-size: 24rpx; color: #666; }
.item-status { font-size: 24rpx; color: #FF6B35; }
.item-actions { display: flex; gap: 16rpx; }
.action-btn { font-size: 24rpx; color: #1890FF; padding: 8rpx 16rpx; background: #1890FF10; border-radius: 8rpx; }
.action-btn.reject { color: #FF4D4F; background: #FF4D4F10; }
</style>