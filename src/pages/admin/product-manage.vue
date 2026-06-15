<template>
  <view class="page">
    <view class="header">
      <text class="header-title">商品管理</text>
      <view class="add-btn" @tap="goAdd"><text>+ 新增</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="product-list" :class="{ 'animate-in': animated }">
        <view class="product-item card-press" v-for="(item, idx) in productList" :key="item._id"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="product-main">
            <view class="product-icon-box" :class="'type-' + item.service_type">
              <image class="product-icon" :src="'/static/icons/service/' + item.service_type + '.svg'" mode="aspectFit"/>
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
              <text class="product-status" :class="{ featured: item.is_featured }">{{ item.is_featured ? '精选' : '普通' }}</text>
            </view>
            <view class="product-actions">
              <text class="action-btn" @tap.stop="editProduct(item)">编辑</text>
              <text class="action-btn danger" @tap.stop="deleteProduct(item)">删除</text>
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
const animated = ref(false)


function loadList() {
  const res = productService.list({ pageSize: 100 })
  productList.value = res.list
}

function onRefresh() { refreshing.value = true; loadList(); refreshing.value = false }
function goAdd() {
  uni.showModal({
    title: '新增商品',
    content: '请在后台系统中添加商品信息（标题、价格、类型等）',
    showCancel: false,
    confirmText: '知道了'
  })
}
function editProduct(item) {
  uni.showActionSheet({
    itemList: ['设为精选', '取消精选', '修改价格', '上下架'],
    success: (res) => {
      if (res.tapIndex === 0) { item.is_featured = true; uni.showToast({ title: '已设为精选', icon: 'success' }) }
      else if (res.tapIndex === 1) { item.is_featured = false; uni.showToast({ title: '已取消精选', icon: 'success' }) }
      else if (res.tapIndex === 2) {
        uni.showModal({
          title: '修改价格',
          editable: true,
          placeholderText: '输入新价格（元）',
          success: (r) => {
            if (r.confirm && r.content) {
              item.price = Math.round(parseFloat(r.content) * 100)
              uni.showToast({ title: '价格已更新', icon: 'success' })
            }
          }
        })
      }
      else if (res.tapIndex === 3) {
        item.status = item.status === 'on_sale' ? 'off_sale' : 'on_sale'
        uni.showToast({ title: item.status === 'on_sale' ? '已上架' : '已下架', icon: 'success' })
      }
    }
  })
}

function deleteProduct(item) {
  uni.showModal({
    title: '确认删除', content: `确定要删除「${item.title}」吗？`,
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
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.add-btn { padding: 10rpx 24rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 20rpx; }
.add-btn text { font-size: 24rpx; color: #fff; font-weight: bold; }

.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; }
.product-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.product-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.product-main { display: flex; margin-bottom: 12rpx; }
.product-icon-box { width: 64rpx; height: 64rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.type-member { background: rgba(255,107,53,0.1); }
.type-linker { background: rgba(99,102,241,0.1); }
.type-survey { background: rgba(16,185,129,0.1); }
.type-resource_pack { background: rgba(245,158,11,0.1); }
.type-certification { background: rgba(236,72,153,0.1); }
.product-icon { width: 32rpx; height: 32rpx; }

.product-info { flex: 1; }
.product-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.product-type { font-size: 22rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 8rpx; }
.product-price-row { display: flex; align-items: baseline; }
.product-price { font-size: 28rpx; font-weight: bold; color: #FF6B35; }
.product-market { font-size: 20rpx; color: rgba(0,0,0,0.4); text-decoration: line-through; }

.product-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 12rpx; border-top: 1rpx solid #F5F6FA; }
.product-stats { display: flex; align-items: center; }
.product-stats text { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.product-status { padding: 4rpx 12rpx; background: #F5F6FA; border-radius: 8rpx; font-size: 20rpx; color: rgba(0,0,0,0.5); }
.product-status.featured { background: rgba(255,107,53,0.1); color: #FF6B35; }
.product-actions { display: flex; }
.action-btn { font-size: 24rpx; color: rgba(0,0,0,0.6); padding: 6rpx 16rpx; background: #F5F6FA; border-radius: 12rpx; }
.action-btn.danger { color: #EF4444; background: rgba(239,68,68,0.1); }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(0,0,0,0.5); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>