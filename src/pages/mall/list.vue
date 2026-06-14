<template>
  <view class="mall-page">
    <!-- 分类滚动 -->
    <scroll-view scroll-x class="cat-scroll">
      <view class="cat-list">
        <view class="cat-item" :class="{ active: !currentType }" @tap="selectType(null)"><text>全部</text></view>
        <view class="cat-item" :class="{ active: currentType === t }" v-for="(label, t) in serviceTypes" :key="t" @tap="selectType(t)">
          <text>{{ getServiceIcon(t) }} {{ label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 商品网格 -->
    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="product-grid">
        <view class="product-item glass-card" v-for="item in productList" :key="item._id" @tap="goDetail(item._id)">
          <!-- 服务类型图标 -->
          <view class="product-icon-box" :style="{ background: getIconBg(item.service_type) }">
            <text class="product-icon">{{ getServiceIcon(item.service_type) }}</text>
          </view>

          <!-- 服务信息 -->
          <text class="product-title">{{ item.title }}</text>
          <text class="product-type">{{ serviceTypes[item.service_type] }}</text>

          <!-- 价格 -->
          <view class="price-row">
            <text class="price-current">¥{{ (item.price / 100).toFixed(0) }}</text>
            <text class="price-market">¥{{ (item.market_price / 100).toFixed(0) }}</text>
          </view>

          <!-- 销量标签 -->
          <view class="sales-tag"><text>{{ item.sale_count }}人已购</text></view>
        </view>
      </view>

      <view v-if="loading" class="loading-state"><text>加载中...</text></view>
      <view v-if="noMore && productList.length" class="end-state"><text>— 已加载全部 —</text></view>
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

loadList(true)
</script>

<style lang="scss" scoped>
.mall-page { min-height: 100vh; background: $bg-primary; padding-bottom: 140rpx; }

.cat-scroll { padding: $space-3 $space-4; }
.cat-list { display: flex; gap: $space-2; }
.cat-item { padding: 12rpx 28rpx; background: $glass-bg; border: 1rpx solid $glass-border; border-radius: $radius-full; font-size: $font-sm; color: $text-secondary; white-space: nowrap; }
.cat-item.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: $color-primary; }

.list-scroll { height: calc(100vh - 120rpx); padding: 0 $space-4; }
.product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; }
.product-item { padding: $space-4; display: flex; flex-direction: column; }

.product-icon-box { width: 80rpx; height: 80rpx; border-radius: $radius-lg; display: flex; align-items: center; justify-content: center; margin-bottom: $space-3; }
.product-icon { font-size: 40rpx; }

.product-title { font-size: $font-base; font-weight: $weight-semibold; color: $text-primary; margin-bottom: $space-1; line-height: 1.3; }
.product-type { font-size: $font-xs; color: $text-tertiary; margin-bottom: $space-3; }

.price-row { display: flex; align-items: baseline; gap: $space-2; margin-bottom: $space-2; }
.price-current { font-size: $font-lg; font-weight: $weight-bold; color: $color-primary; }
.price-market { font-size: $font-xs; color: $text-tertiary; text-decoration: line-through; }

.sales-tag { align-self: flex-start; background: rgba(16,185,129,0.12); border-radius: $radius-sm; padding: 4rpx 12rpx; }
.sales-tag text { font-size: $font-xs; color: $color-success; }

.loading-state, .end-state { text-align: center; padding: $space-6; font-size: $font-sm; color: $text-tertiary; }
</style>