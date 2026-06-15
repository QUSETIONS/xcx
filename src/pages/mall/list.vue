<template>
  <view class="page">
    <view class="header">
      <text class="header-title">商城</text>
      <view class="header-actions">
        <view class="search-btn" @tap="goSearch"><text>🔍</text></view>
      </view>
    </view>

    <scroll-view scroll-x class="cat-scroll">
      <view class="cat-list">
        <view class="cat-item" :class="{ active: !currentType }" @tap="selectType(null)"><text>全部</text></view>
        <view class="cat-item" :class="{ active: currentType === t }" v-for="(label, t) in serviceTypes" :key="t" @tap="selectType(t)">
          <text>{{ getServiceIcon(t) }} {{ label }}</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="product-grid">
        <view class="product-item" v-for="item in productList" :key="item._id" @tap="goDetail(item._id)">
          <view class="product-icon-box" :style="{ background: getIconBg(item.service_type) }">
            <text class="product-icon">{{ getServiceIcon(item.service_type) }}</text>
          </view>
          <text class="product-title">{{ item.title }}</text>
          <text class="product-type">{{ serviceTypes[item.service_type] }}</text>
          <view class="price-row">
            <text class="price-current">¥{{ (item.price / 100).toFixed(0) }}</text>
            <text class="price-market">¥{{ (item.market_price / 100).toFixed(0) }}</text>
          </view>
          <view class="sales-tag"><text>{{ item.sale_count }}人已购</text></view>
        </view>
      </view>
      <view v-if="loading" class="loading"><text>加载中...</text></view>
      <view v-if="noMore && productList.length" class="end"><text>— 已加载全部 —</text></view>
      <view v-if="!productList.length && !loading" class="empty">
        <text class="empty-icon">🛒</text>
        <text>暂无商品</text>
      </view>
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

function getIconBg(type) {
  const map = {
    member: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.05))',
    linker: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))',
    survey: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
    resource_pack: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
    certification: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))'
  }
  return map[type] || map.resource_pack
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
function selectType(t) { currentType.value = t; loadList(true) }
function goDetail(id) { uni.navigateTo({ url: `/pages/mall/detail?id=${id}` }) }
function goSearch() { uni.showToast({ title: '搜索功能开发中', icon: 'none' }) }

loadList(true)
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 140rpx; }

.header { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.search-btn { width: 64rpx; height: 64rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; }

.cat-scroll { padding: 0 24rpx 16rpx; }
.cat-list { display: flex; gap: 12rpx; }
.cat-item { padding: 10rpx 24rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 24rpx; font-size: 24rpx; color: rgba(255,255,255,0.65); white-space: nowrap; }
.cat-item.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }

.list-scroll { height: calc(100vh - 180rpx); padding: 0 24rpx; }
.product-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.product-item { width: calc(50% - 6rpx); background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 20rpx; }
.product-icon-box { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; }
.product-icon { font-size: 36rpx; }
.product-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 4rpx; }
.product-type { font-size: 22rpx; color: rgba(255,255,255,0.5); display: block; margin-bottom: 12rpx; }
.price-row { display: flex; align-items: baseline; gap: 8rpx; margin-bottom: 8rpx; }
.price-current { font-size: 32rpx; font-weight: bold; color: #FF6B35; }
.price-market { font-size: 22rpx; color: rgba(255,255,255,0.4); text-decoration: line-through; }
.sales-tag { background: rgba(16,185,129,0.12); border-radius: 8rpx; padding: 4rpx 12rpx; display: inline-flex; }
.sales-tag text { font-size: 20rpx; color: #34D399; }

.loading, .end { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(255,255,255,0.5); }
.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
</style>