<template>
  <view class="page">
    <view class="header">
      <text class="header-title">{{ t('titles.productManage') }}</text>
      <view class="add-btn" @tap="goAdd"><text>{{ t('admin.add') }}</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !productList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
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
              <text>{{ t('admin.sales') }}{{ item.sale_count }}</text>
              <text class="product-status" :class="{ featured: item.is_featured }">{{ item.is_featured ? t('admin.featured') : t('admin.normal') }}</text>
            </view>
            <view class="product-actions">
              <text class="action-btn" @tap.stop="editProduct(item)">{{ t('admin.edit') }}</text>
              <text class="action-btn danger" @tap.stop="deleteProduct(item)">{{ t('admin.delete') }}</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="loading && productList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="!productList.length && !loading" class="empty"><text>{{ t('admin.emptyProduct') }}</text></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { serviceTypes } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
useNavTitle('titles.productManage')

const animated = ref(true)

const { list: productList, loading, refreshing, load: loadList, refresh } = useList(
  (params) => bridge.admin.products.list({ ...params, page: 1, pageSize: 100 }),
  100
)

function onRefresh() { refresh() }
onMounted(() => loadList(true))
function goAdd() {
  uni.navigateTo({ url: '/pages/admin/product-edit' })
}
function editProduct(item) {
  uni.navigateTo({ url: `/pages/admin/product-edit?id=${item._id}` })
}

function deleteProduct(item) {
  uni.showModal({
    title: t('admin.confirmDelete'), content: t('admin.deleteContent').replace('{title}', item.title),
    success: async (res) => {
      if (res.confirm) {
        try {
          await bridge.admin.products.delete(item._id)
        } catch (error) {
          uni.showToast({ title: error?.message || t('common.loadFailed'), icon: 'none' })
          return
        }
        const idx = productList.value.findIndex(p => p._id === item._id)
        if (idx > -1) productList.value.splice(idx, 1)
        uni.showToast({ title: t('admin.deleted'), icon: 'success' })
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
.loading { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
/* 后台列表统一采用“固定页面 + 剩余空间滚动”，商品信息和操作列可收缩。 */
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .list-scroll, .product-item, .product-main, .product-info, .product-bottom, .product-stats { min-width: 0; }
.header { flex: 0 0 auto; gap: 14rpx; }
.header-title, .product-title, .product-type { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.header-title, .product-title, .product-type { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.add-btn, .action-btn, .product-status { flex: 0 0 auto; white-space: nowrap; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; box-sizing: border-box; }
.product-info { overflow: hidden; }
.product-main, .product-bottom { gap: 12rpx; }
.product-price-row { flex-wrap: wrap; gap: 6rpx; }
.product-actions { flex-wrap: wrap; justify-content: flex-end; gap: 8rpx; }
</style>
