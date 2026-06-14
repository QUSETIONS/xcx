<template>
  <view class="mall-page">
    <scroll-view scroll-x class="cat-scroll">
      <view class="cat-list">
        <view class="cat-item" :class="{ active: !currentType }" @tap="currentType = null; loadList(true)">
          <text>全部</text>
        </view>
        <view class="cat-item" :class="{ active: currentType === t }" v-for="(label, t) in serviceTypes" :key="t" @tap="currentType = t; loadList(true)">
          <text>{{ getServiceIcon(t) }} {{ label }}</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="product-grid">
        <view class="product-item" v-for="item in productList" :key="item._id" @tap="goDetail(item._id)">
          <view class="product-icon-box">
            <text class="product-icon">{{ getServiceIcon(item.service_type) }}</text>
          </view>
          <text class="product-title">{{ item.title }}</text>
          <view class="product-price-row">
            <text class="product-price">¥{{ (item.price / 100).toFixed(0) }}</text>
            <text class="product-unit">/{{ item.unit }}</text>
          </view>
          <text class="product-sales">{{ item.sale_count }}人已购</text>
        </view>
      </view>
      <view v-if="loading" class="loading-more"><text>加载中...</text></view>
      <view v-if="noMore && productList.length" class="no-more"><text>没有更多了</text></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { SERVICE_TYPES } from '@/config/constants'
import { productService } from '@/mock/service'

const serviceTypes = SERVICE_TYPES
const currentType = ref(null)
const productList = ref([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function loadList(reset = false) {
  if (reset) { page.value = 1; noMore.value = false }
  loading.value = true
  try {
    const res = productService.list({ page: page.value, pageSize: 10, service_type: currentType.value })
    productList.value = reset ? res.list : [...productList.value, ...res.list]
    noMore.value = res.list.length < 10
  } finally { loading.value = false; refreshing.value = false }
}

function loadMore() { if (!loading.value && !noMore.value) { page.value++; loadList() } }
function onRefresh() { refreshing.value = true; loadList(true) }
function goDetail(id) { uni.navigateTo({ url: `/pages/mall/detail?id=${id}` }) }

loadList(true)
</script>

<style lang="scss" scoped>
.mall-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 120rpx; }
.cat-scroll { background: #fff; padding: 16rpx 0; }
.cat-list { display: inline-flex; gap: 8rpx; padding: 0 24rpx; }
.cat-item { padding: 10rpx 24rpx; border-radius: 28rpx; font-size: 24rpx; color: #666; background: #f5f5f5; }
.cat-item.active { background: #FF6B3518; color: #FF6B35; font-weight: 600; }
.list-scroll { height: calc(100vh - 100rpx); }
.product-grid { display: flex; flex-wrap: wrap; gap: 12rpx; padding: 16rpx 24rpx; }
.product-item { width: calc(50% - 6rpx); background: #fff; border-radius: 20rpx; padding: 20rpx; }
.product-icon-box { width: 80rpx; height: 80rpx; border-radius: 20rpx; background: #FF6B3510; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; }
.product-icon { font-size: 40rpx; }
.product-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 8rpx; }
.product-price-row { display: flex; align-items: baseline; gap: 4rpx; }
.product-price { font-size: 32rpx; font-weight: 700; color: #FF6B35; }
.product-unit { font-size: 22rpx; color: #999; }
.product-sales { font-size: 22rpx; color: #999; }
.loading-more, .no-more { text-align: center; padding: 20rpx; font-size: 24rpx; color: #ccc; }
</style>