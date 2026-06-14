<template>
  <view class="admin-page">
    <view class="admin-header"><text class="admin-title">后台管理</text></view>
    <view class="admin-grid">
      <view class="admin-item" @tap="goManage('demand')">
        <text class="admin-icon">📋</text><text class="admin-label">需求管理</text>
      </view>
      <view class="admin-item" @tap="goManage('lead')">
        <text class="admin-icon">🤝</text><text class="admin-label">对接管理</text>
      </view>
      <view class="admin-item" @tap="goManage('order')">
        <text class="admin-icon">📦</text><text class="admin-label">订单管理</text>
      </view>
      <view class="admin-item" @tap="goManage('product')">
        <text class="admin-icon">🛒</text><text class="admin-label">商品管理</text>
      </view>
      <view class="admin-item" @tap="goManage('resource')">
        <text class="admin-icon">📁</text><text class="admin-label">资料管理</text>
      </view>
      <view class="admin-item" @tap="goManage('banner')">
        <text class="admin-icon">🖼️</text><text class="admin-label">运营位</text>
      </view>
    </view>
  </view>
</template>

<script setup>
function goManage(type) {
  const urls = { demand: '/pages/admin/demand-manage', lead: '/pages/admin/lead-manage', order: '/pages/admin/order-manage' }
  uni.navigateTo({ url: urls[type] || '/pages/admin/manage?type=' + type })
}
</script>

<style lang="scss" scoped>
.admin-page { min-height: 100vh; background: #f5f5f5; }
.admin-header { padding: 32rpx; background: #fff; }
.admin-title { font-size: 36rpx; font-weight: 700; color: #333; }
.admin-grid { display: flex; flex-wrap: wrap; gap: 16rpx; padding: 24rpx; }
.admin-item { width: calc(33.3% - 12rpx); background: #fff; border-radius: 20rpx; padding: 32rpx 16rpx; display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.admin-icon { font-size: 48rpx; }
.admin-label { font-size: 26rpx; color: #333; }
</style>