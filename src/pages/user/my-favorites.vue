<template>
  <view class="page">
    <view class="header"><text class="header-title">我的收藏</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="fav-list">
        <view class="fav-item" v-for="item in favList" :key="item.targetId" @tap="goDetail(item)">
          <view class="fav-icon-box" :style="{ background: getIconBg(item.targetType) }">
            <text class="fav-icon">{{ getTypeIcon(item.targetType) }}</text>
          </view>
          <view class="fav-info">
            <text class="fav-title">{{ item.title }}</text>
            <text class="fav-type">{{ getTypeName(item.targetType) }}</text>
          </view>
          <view class="fav-remove" @tap.stop="removeFav(item)"><text>✕</text></view>
        </view>
      </view>
      <view v-if="!favList.length" class="empty">
        <text class="empty-icon">❤️</text>
        <text>暂无收藏</text>
        <text class="empty-hint" @tap="goBrowse">去逛逛</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { favoriteService, demandService, productService } from '@/mock/service'

const favList = ref([])
const refreshing = ref(false)

onMounted(() => loadList())

function loadList() {
  const res = favoriteService.list()
  // 丰富收藏数据：关联实际内容
  favList.value = res.list.map(f => {
    let title = f.targetId
    if (f.targetType === 'demand') {
      const d = demandService.detail(f.targetId)
      if (d) title = d.title
    } else if (f.targetType === 'product') {
      const p = productService.detail(f.targetId)
      if (p) title = p.title
    }
    return { ...f, title }
  })
}

function getTypeIcon(type) {
  const map = { demand: '📋', product: '🛒', post: '💬' }
  return map[type] || '📦'
}

function getIconBg(type) {
  const map = {
    demand: 'rgba(255,107,53,0.15)',
    product: 'rgba(99,102,241,0.15)',
    post: 'rgba(16,185,129,0.15)'
  }
  return map[type] || 'rgba(255,255,255,0.08)'
}

function getTypeName(type) {
  const map = { demand: '需求', product: '商品', post: '帖子' }
  return map[type] || '其他'
}

function removeFav(item) {
  favoriteService.toggle({ userId: 'demo_user_001', targetType: item.targetType, targetId: item.targetId })
  loadList()
  uni.showToast({ title: '已取消收藏', icon: 'none' })
}

function goDetail(item) {
  if (item.targetType === 'demand') uni.navigateTo({ url: `/pages/demand/detail?id=${item.targetId}` })
  else if (item.targetType === 'product') uni.navigateTo({ url: `/pages/mall/detail?id=${item.targetId}` })
}

function goBrowse() { uni.switchTab({ url: '/pages/demand/list' }) }
function onRefresh() { refreshing.value = true; loadList(); refreshing.value = false }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 140rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(255,255,255,0.95); }

.list-scroll { height: calc(100vh - 80rpx); padding: 0 24rpx; }
.fav-list { display: flex; flex-direction: column; gap: 12rpx; }
.fav-item { display: flex; align-items: center; gap: 16rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 20rpx; }
.fav-icon-box { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.fav-icon { font-size: 28rpx; }
.fav-info { flex: 1; }
.fav-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 4rpx; }
.fav-type { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.fav-remove { width: 48rpx; height: 48rpx; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.fav-remove text { font-size: 22rpx; color: #F87171; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty text { font-size: 28rpx; color: rgba(255,255,255,0.5); display: block; margin-bottom: 16rpx; }
.empty-hint { font-size: 24rpx; color: #FF6B35; }
</style>