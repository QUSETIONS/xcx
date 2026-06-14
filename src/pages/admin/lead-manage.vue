<template>
  <view class="manage-page">
    <view class="manage-header"><text>对接管理</text></view>
    <scroll-view class="list-scroll" scroll-y>
      <view class="list-item" v-for="item in list" :key="item._id">
        <text class="item-title">{{ item.demand_title }}</text>
        <view class="item-row">
          <text class="item-contact">{{ item.contact_name }} · {{ item.phone }}</text>
          <text class="item-status">{{ item.status }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { leadService } from '@/mock/service'

const list = ref(leadService.myLeads().list)
</script>

<style lang="scss" scoped>
.manage-page { min-height: 100vh; background: #f5f5f5; }
.manage-header { padding: 24rpx; background: #fff; font-size: 32rpx; font-weight: 600; }
.list-scroll { height: calc(100vh - 80rpx); padding: 16rpx 24rpx; }
.list-item { background: #fff; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.item-title { font-size: 28rpx; color: #333; display: block; margin-bottom: 8rpx; }
.item-row { display: flex; justify-content: space-between; }
.item-contact { font-size: 24rpx; color: #666; }
.item-status { font-size: 24rpx; color: #FF6B35; }
</style>