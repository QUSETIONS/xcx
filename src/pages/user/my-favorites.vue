<template>
  <view class="page">
    <view class="header"><text class="header-title">我的收藏</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="fav-list" :class="{ 'animate-in': animated }">
        <view class="fav-item" v-for="(item, idx) in favList" :key="item.targetId" @tap="goDetail(item)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="fav-icon-box" :class="'type-' + item.targetType">
            <image class="fav-icon" :src="'/static/icons/' + getIconName(item.targetType) + '.svg'" mode="aspectFit"/>
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
        <text class="empty-text">暂无收藏</text>
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
const animated = ref(false)


function loadList() {
  const res = favoriteService.list()
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

function getIconName(type) {
  const map = { demand: 'list', product: 'mall', post: 'community' }
  return map[type] || 'list'
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
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.list-scroll { height: calc(100vh - 80rpx); padding: 0 24rpx; }
.fav-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.fav-item { margin-bottom: 12rpx; display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.fav-icon-box { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.type-demand { background: rgba(255,107,53,0.1); }
.type-product { background: rgba(99,102,241,0.1); }
.type-post { background: rgba(16,185,129,0.1); }
.fav-icon { width: 28rpx; height: 28rpx; }

.fav-info { flex: 1; }
.fav-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.fav-type { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.fav-remove { width: 48rpx; height: 48rpx; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.fav-remove text { font-size: 22rpx; color: #EF4444; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-hint { font-size: 24rpx; color: #FF6B35; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>