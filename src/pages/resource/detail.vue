<template>
  <view class="detail-page" v-if="resource">
    <view class="info-card">
      <text class="info-title">{{ resource.title }}</text>
      <view class="info-tags">
        <text class="tag">{{ resource.category_name }}</text>
        <text class="tag">{{ resource.file_type }}</text>
        <text class="tag">{{ resource.file_size }}</text>
      </view>
    </view>

    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-val">{{ resource.view_count }}</text>
        <text class="stat-label">浏览</text>
      </view>
      <view class="stat-item">
        <text class="stat-val">{{ resource.download_count }}</text>
        <text class="stat-label">下载</text>
      </view>
      <view class="stat-item">
        <text class="stat-val">{{ resource.favorite_count }}</text>
        <text class="stat-label">收藏</text>
      </view>
    </view>

    <view class="desc-card">
      <text class="card-label">资料简介</text>
      <text class="desc-text">{{ resource.summary }}</text>
    </view>

    <view class="preview-card">
      <text class="card-label">资料预览</text>
      <view class="preview-box">
        <text class="preview-icon">📄</text>
        <text class="preview-name">{{ resource.title }}.{{ resource.file_type }}</text>
      </view>
    </view>

    <view class="download-tips">
      <text class="tips-title">下载说明</text>
      <text class="tips-item">• 资料下载后可永久使用</text>
      <text class="tips-item">• 支持PDF/Word/PPT/Excel格式</text>
      <text class="tips-item">• 如有问题请联系客服</text>
    </view>

    <view class="action-bar">
      <view class="collect-btn" @tap="toggleCollect">
        <text>{{ isCollected ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="download-btn" :class="{ free: resource.is_free }" @tap="download">
        <text>{{ resource.is_free ? '免费下载' : `¥${(resource.price/100).toFixed(0)} 获取` }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { resourceService, favoriteService } from '@/mock/service'

const resource = ref(null)
const isCollected = ref(false)

onLoad((q) => {
  resource.value = resourceService.detail(q.id)
  if (resource.value) {
    isCollected.value = favoriteService.check({ userId: 'demo_user_001', targetType: 'resource', targetId: q.id })
  }
})

function toggleCollect() {
  if (!resource.value) return
  favoriteService.toggle({ userId: 'demo_user_001', targetType: 'resource', targetId: resource.value._id })
  isCollected.value = !isCollected.value
  uni.showToast({ title: isCollected.value ? '已收藏' : '已取消收藏', icon: 'success' })
}

function download() {
  if (!resource.value) return

  if (resource.value.is_free) {
    // 免费资料直接下载
    uni.showModal({
      title: '下载确认',
      content: `确定要下载「${resource.value.title}」吗？`,
      success: (res) => {
        if (res.confirm) {
          resource.value.download_count = (resource.value.download_count || 0) + 1
          uni.showModal({
            title: '下载成功',
            content: '资料已保存到您的设备，请在"我的下载"中查看',
            showCancel: false
          })
        }
      }
    })
  } else {
    // 付费资料
    uni.showModal({
      title: '付费获取',
      content: `该资料需要 ¥${(resource.value.price/100).toFixed(0)}，确定购买吗？`,
      confirmText: '立即购买',
      success: (res) => {
        if (res.confirm) {
          uni.showToast({ title: 'Demo：支付功能开发中', icon: 'none' })
        }
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 160rpx; }

.info-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.info-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.info-tags { display: flex; }
.tag { font-size: 22rpx; color: rgba(0,0,0,0.6); background: #F5F6FA; padding: 8rpx 16rpx; border-radius: 12rpx; }

.stats-card { display: flex; background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-val { font-size: 32rpx; font-weight: bold; color: #FF6B35; }
.stat-label { font-size: 22rpx; color: rgba(0,0,0,0.5); margin-top: 4rpx; }

.desc-card, .preview-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.card-label { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.desc-text { font-size: 28rpx; color: rgba(0,0,0,0.6); line-height: 1.7; }

.preview-box { display: flex; align-items: center; padding: 24rpx; background: #F5F6FA; border-radius: 16rpx; }
.preview-icon { font-size: 48rpx; }
.preview-name { font-size: 24rpx; color: rgba(0,0,0,0.6); }

.download-tips { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.tips-title { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.tips-item { font-size: 24rpx; color: rgba(0,0,0,0.5); line-height: 2; display: block; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.04); }
.collect-btn { padding: 20rpx 32rpx; background: #F5F6FA; border-radius: 24rpx; font-size: 28rpx; color: rgba(0,0,0,0.6); }
.download-btn { flex: 1; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; text-align: center; padding: 20rpx; }
.download-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
.download-btn.free { background: linear-gradient(135deg, #10B981, #34D399); }
</style>