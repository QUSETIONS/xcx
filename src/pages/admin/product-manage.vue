<template>
  <view class="page">
    <view class="header">
      <text class="header-title">商品管理</text>
      <view class="add-btn" @tap="goAdd"><text>+ 新增</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="product-list">
        <view class="product-item" v-for="item in productList" :key="item._id">
          <view class="product-main">
            <view class="product-icon-box" :style="{ background: getIconBg(item.service_type) }">
              <text class="product-icon">{{ getServiceIcon(item.service_type) }}</text>
            </view>
            <view class="product-info">
              <text class="product-title">{{ item.title }}</text>
              <text class="product-type">{{ serviceTypes[item.service_type] }}</text>
              <view class="product-price-row">
                <text class="product-price">¥{{ (item.price / 100).toFixed(0) }}</text>
                <text class="product-market">¥{{ (item.market_price / 100).toFixed(0) }}</text>
              </view>
            </view>
          </view>
          <view class="product-bottom">
            <view class="product-stats">
              <text>销量: {{ item.sale_count }}</text>
              <text class="product-status" :class="{ active: item.is_featured }">{{ item.is_featured ? '精选' : '普通' }}</text>
            </view>
            <view class="product-actions">
              <text class="action-btn" @tap="editProduct(item)">编辑</text>
              <text class="action-btn danger" @tap="deleteProduct(item)">删除</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="!productList.length" class="empty"><text>暂无商品</text></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { SERVICE_TYPES } from '@/config/constants'
import { productService } from '@/mock/service'

const serviceTypes = SERVICE_TYPES
const productList = ref([])
const refreshing = ref(false)

onMounted(() => loadList())

function loadList() {
  const res = productService.list({ pageSize: 100 })
  productList.value = res.list
}

function getServiceIcon(type) {
  const map = { member: '👑', linker: '🔗', survey: '📊', resource_pack: '📦', certification: '✅' }
  return map[type] || '📦'
}

function getIconBg(type) {
  const map = {
    member: 'rgba(255,107,53,0.15)',
    linker: 'rgba(99,102,241,0.15)',
    survey: 'rgba(16,185,129,0.15)',
    resource_pack: 'rgba(245,158,11,0.15)',
    certification: 'rgba(236,72,153,0.15)'
  }
  return map[type] || map.resource_pack
}

function onRefresh() { refreshing.value = true; loadList(); refreshing.value = false }
function goAdd() { uni.showToast({ title: '新增商品功能开发中', icon: 'none' }) }
function editProduct(item) { uni.showToast({ title: '编辑功能开发中', icon: 'none' }) }

function deleteProduct(item) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除「${item.title}」吗？`,
    success: (res) => {
      if (res.confirm) {
        const idx = productList.value.findIndex(p => p._id === item._id)
        if (idx > -1) productList.value.splice(idx, 1)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 140rpx; }
.header { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.add-btn { padding: 10rpx 24rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 20rpx; }
.add-btn text { font-size: 24rpx; color: #fff; font-weight: bold; }

.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; }
.product-list { display: flex; flex-direction: column; gap: 12rpx; }
.product-item { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 20rpx; }
.product-main { display: flex; gap: 16rpx; margin-bottom: 12rpx; }
.product-icon-box { width: 64rpx; height: 64rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.product-icon { font-size: 32rpx; }
.product-info { flex: 1; }
.product-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 4rpx; }
.product-type { font-size: 22rpx; color: rgba(255,255,255,0.5); display: block; margin-bottom: 8rpx; }
.product-price-row { display: flex; gap: 8rpx; align-items: baseline; }
.product-price { font-size: 28rpx; font-weight: bold; color: #FF6B35; }
.product-market { font-size: 20rpx; color: rgba(255,255,255,0.4); text-decoration: line-through; }
.product-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 12rpx; border-top: 1rpx solid rgba(255,255,255,0.06); }
.product-stats { display: flex; gap: 16rpx; align-items: center; }
.product-stats text { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.product-status { padding: 4rpx 12rpx; background: rgba(255,255,255,0.08); border-radius: 8rpx; }
.product-status.active { background: rgba(255,107,53,0.15); color: #FF6B35; }
.product-actions { display: flex; gap: 16rpx; }
.action-btn { font-size: 24rpx; color: rgba(255,255,255,0.65); padding: 6rpx 16rpx; background: rgba(255,255,255,0.06); border-radius: 12rpx; }
.action-btn.danger { color: #F87171; background: rgba(239,68,68,0.1); }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(255,255,255,0.5); }
</style>