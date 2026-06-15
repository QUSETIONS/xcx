<template>
  <view class="page">
    <view class="header"><text class="header-title">资料库</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="resource-list" :class="{ 'animate-in': animated }">
        <view class="resource-item" v-for="(item, idx) in list" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="resource-icon-box">
            <text class="resource-icon">{{ getFileIcon(item.file_type) }}</text>
          </view>
          <view class="resource-main">
            <text class="resource-title">{{ item.title }}</text>
            <text class="resource-summary">{{ item.summary }}</text>
            <view class="resource-meta">
              <text class="meta-tag">{{ item.category_name }}</text>
              <text class="meta-type">{{ item.file_type }} · {{ item.file_size }}</text>
            </view>
            <view class="resource-stats">
              <text>👁 {{ item.view_count }}</text>
              <text>⬇ {{ item.download_count }}</text>
            </view>
          </view>
          <view class="resource-price">
            <text v-if="item.is_free" class="price-free">免费</text>
            <text v-else class="price-num">¥{{ (item.price / 100).toFixed(0) }}</text>
          </view>
        </view>
      </view>
      <view v-if="!list.length" class="empty">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无资料</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { resourceService } from '@/mock/service'

const list = ref([])
const refreshing = ref(false)
const animated = ref(false)

onMounted(() => {
  const res = resourceService.list({ page: 1, pageSize: 20 })
  list.value = res.list
  setTimeout(() => { animated.value = true }, 100)
})

function getFileIcon(type) {
  const map = { pdf: '📄', docx: '📝', pptx: '📊', xlsx: '📈' }
  return map[type] || '📁'
}

function goDetail(id) { uni.navigateTo({ url: `/pages/resource/detail?id=${id}` }) }
function onRefresh() { refreshing.value = true; const res = resourceService.list({ page: 1, pageSize: 20 }); list.value = res.list; refreshing.value = false }
</script>

<style lang="scss">
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }

.header { padding: 24rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.list-scroll { height: calc(100vh - 80rpx); padding: 0 24rpx; }
.resource-list { display: flex; flex-direction: column; gap: 12rpx; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }

.resource-item { display: flex; align-items: flex-start; gap: 16rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.resource-icon-box { width: 56rpx; height: 56rpx; background: #F5F6FA; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.resource-icon { font-size: 28rpx; }

.resource-main { flex: 1; }
.resource-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 8rpx; }
.resource-summary { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 12rpx; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.resource-meta { display: flex; gap: 8rpx; align-items: center; margin-bottom: 8rpx; }
.meta-tag { font-size: 20rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; }
.meta-type { font-size: 20rpx; color: rgba(0,0,0,0.4); }
.resource-stats { display: flex; gap: 16rpx; }
.resource-stats text { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.resource-price { display: flex; align-items: center; }
.price-free { font-size: 26rpx; color: #10B981; font-weight: bold; background: rgba(16,185,129,0.1); padding: 6rpx 16rpx; border-radius: 12rpx; }
.price-num { font-size: 28rpx; color: #FF6B35; font-weight: bold; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>