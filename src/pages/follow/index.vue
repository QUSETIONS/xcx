<template>
  <view class="page">
    <view class="header"><text class="header-title">我的关注</text></view>

    <view class="follow-list">
      <view class="follow-item" v-for="item in list" :key="item._id">
        <view class="avatar-box" :style="{ background: getAvatarColor(item.user.id) }">
          <text class="avatar-text">{{ item.user.nickname[0] }}</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ item.user.nickname }}</text>
          <text class="user-company">{{ item.user.company }}</text>
          <text class="user-bio">{{ item.user.bio }}</text>
        </view>
        <view class="follow-btn following" @tap="unfollow(item)">
          <text>已关注</text>
        </view>
      </view>
    </view>

    <view v-if="!list.length" class="empty">
      <text class="empty-icon">👥</text>
      <text class="empty-text">暂未关注任何人</text>
      <text class="empty-btn" @tap="goCommunity">去社区看看</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { followService } from '@/mock/service'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.follow')

const list = ref(followService.list())

const colors = [
  'linear-gradient(135deg, #FF6B35, #FF9A5C)',
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #EC4899, #F472B6)',
  'linear-gradient(135deg, #3B82F6, #60A5FA)',
]

function getAvatarColor(id) {
  return colors[id ? id.charCodeAt(id.length - 1) % 5 : 0]
}

function unfollow(item) {
  uni.showModal({
    title: '取消关注',
    content: `确定取消关注「${item.user.nickname}」吗？`,
    success: (res) => {
      if (res.confirm) {
        followService.toggle(item.user.id)
        list.value = followService.list()
        uni.showToast({ title: '已取消关注', icon: 'none' })
      }
    }
  })
}

function goCommunity() { uni.switchTab({ url: '/pages/community/index' }) }
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }
.header { margin-bottom: 16rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.follow-list { display: flex; flex-direction: column; }
.follow-item { display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.avatar-box { width: 80rpx; height: 80rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.avatar-text { font-size: 32rpx; color: #FFFFFF; font-weight: bold; }
.user-info { flex: 1; }
.user-name { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.user-company { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 4rpx; }
.user-bio { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.follow-btn { padding: 12rpx 28rpx; border-radius: 24rpx; flex-shrink: 0; }
.follow-btn.following { background: #F5F6FA; }
.follow-btn.following text { font-size: 24rpx; color: rgba(0,0,0,0.5); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-btn { font-size: 24rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 12rpx 32rpx; border-radius: 24rpx; display: inline-flex; }
</style>