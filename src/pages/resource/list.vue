<template>
  <view class="resource-page">
    <view class="resource-item" v-for="item in list" :key="item._id" @tap="goDetail(item._id)">
      <view class="resource-main">
        <text class="resource-title">{{ item.title }}</text>
        <text class="resource-summary">{{ item.summary }}</text>
        <view class="resource-meta">
          <text class="meta-tag">{{ item.category_name }}</text>
          <text class="meta-views">{{ item.view_count }}浏览</text>
          <text class="meta-down">{{ item.download_count }}下载</text>
        </view>
      </view>
      <view class="resource-price">
        <text v-if="item.is_free" class="price-free">免费</text>
        <text v-else class="price-num">¥{{ (item.price / 100).toFixed(0) }}</text>
      </view>
    </view>
    <view v-if="!list.length" class="empty"><text>暂无资料</text></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { resourceService } from '@/mock/service'

const list = ref([])
const res = resourceService.list({ page: 1, pageSize: 20 })
list.value = res.list

function goDetail(id) { uni.navigateTo({ url: `/pages/resource/detail?id=${id}` }) }
</script>

<style lang="scss" scoped>
.resource-page { min-height: 100vh; background: #f5f5f5; padding: 16rpx 24rpx; }
.resource-item { display: flex; background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; }
.resource-main { flex: 1; }
.resource-title { font-size: 30rpx; font-weight: 600; color: #333; display: block; margin-bottom: 8rpx; }
.resource-summary { font-size: 26rpx; color: #666; display: block; margin-bottom: 12rpx; line-height: 1.5; }
.resource-meta { display: flex; gap: 12rpx; }
.meta-tag { font-size: 22rpx; color: #1890FF; background: #1890FF10; padding: 4rpx 12rpx; border-radius: 8rpx; }
.meta-views, .meta-down { font-size: 22rpx; color: #999; }
.resource-price { display: flex; align-items: center; padding-left: 16rpx; }
.price-free { font-size: 28rpx; color: #52C41A; font-weight: 600; }
.price-num { font-size: 28rpx; color: #FF6B35; font-weight: 600; }
.empty { text-align: center; padding: 80rpx; color: #999; }
</style>