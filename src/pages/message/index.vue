<template>
  <view class="page">
    <view class="header">
      <text class="header-title">消息中心</text>
      <text class="read-all-btn" @tap="readAll" v-if="unreadCount > 0">全部已读</text>
    </view>

    <view class="tab-bar">
      <text class="tab-item" :class="{ active: tab === 'all' }" @tap="tab = 'all'">全部</text>
      <text class="tab-item" :class="{ active: tab === 'system' }" @tap="tab = 'system'">系统</text>
      <text class="tab-item" :class="{ active: tab === 'lead' }" @tap="tab = 'lead'">对接</text>
      <text class="tab-item" :class="{ active: tab === 'deal' }" @tap="tab = 'deal'">成交</text>
      <text class="tab-item" :class="{ active: tab === 'interact' }" @tap="tab = 'interact'">互动</text>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="msg-list">
        <view class="msg-item card-press" v-for="item in filteredList" :key="item._id"
          :class="{ unread: !item.read }" @tap="readMsg(item)">
          <view class="msg-icon-box" :class="'type-' + item.type">
            <text class="msg-icon">{{ getIcon(item.type) }}</text>
          </view>
          <view class="msg-content">
            <view class="msg-top">
              <text class="msg-title">{{ item.title }}</text>
              <text class="msg-time">{{ item.time }}</text>
            </view>
            <text class="msg-desc">{{ item.desc }}</text>
          </view>
          <view class="msg-dot" v-if="!item.read"></view>
        </view>
      </view>
      <view v-if="!filteredList.length" class="empty">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消息</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { notifyService } from '@/mock/service'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.message')

const tab = ref('all')
const refreshing = ref(false)

const messages = ref(notifyService.list().list)
const unreadCount = ref(notifyService.unreadCount())

const filteredList = computed(() => {
  if (tab.value === 'all') return messages.value
  return messages.value.filter(m => m.type === tab.value)
})

function getIcon(type) {
  const map = { system: '📢', lead: '🤝', deal: '✅', interact: '💬' }
  return map[type] || '📬'
}

function readMsg(item) {
  if (!item.read) {
    notifyService.read(item._id)
    item.read = true
    unreadCount.value = notifyService.unreadCount()
  }

  // 根据消息类型跳转
  if (item.type === 'lead' && item.link_id) {
    uni.navigateTo({ url: '/pages/deals/index' })
  } else if (item.type === 'deal' && item.link_id) {
    uni.navigateTo({ url: '/pages/deals/index' })
  }
}

function readAll() {
  notifyService.readAll()
  messages.value.forEach(m => m.read = true)
  unreadCount.value = 0
  uni.showToast({ title: '全部已读', icon: 'success' })
}

function onRefresh() { refreshing.value = true; messages.value = notifyService.list().list; refreshing.value = false }
</script>

<style scoped>
.page { background: #F5F6FA; min-height: 100vh; padding-bottom: 40rpx; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.read-all-btn { font-size: 26rpx; color: #FF6B35; }

.tab-bar { display: flex; padding: 0 24rpx 16rpx; }
.tab-item { font-size: 26rpx; color: rgba(0,0,0,0.5); padding: 10rpx 20rpx; background: #FFFFFF; border-radius: 20rpx; margin-right: 12rpx; }
.tab-item.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

.list-scroll { height: calc(100vh - 180rpx); padding: 0 24rpx; }
.msg-list { display: flex; flex-direction: column; }
.msg-item { display: flex; align-items: flex-start; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.msg-item.unread { background: rgba(255,107,53,0.03); border-left: 4rpx solid #FF6B35; }

.msg-icon-box { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.type-system { background: rgba(59,130,246,0.1); }
.type-lead { background: rgba(255,107,53,0.1); }
.type-deal { background: rgba(16,185,129,0.1); }
.type-interact { background: rgba(99,102,241,0.1); }
.msg-icon { font-size: 28rpx; }

.msg-content { flex: 1; }
.msg-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.msg-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.msg-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.msg-desc { font-size: 24rpx; color: rgba(0,0,0,0.6); line-height: 1.5; }
.msg-dot { width: 12rpx; height: 12rpx; background: #FF6B35; border-radius: 50%; flex-shrink: 0; margin-left: 8rpx; margin-top: 8rpx; }

.empty { text-align: center; padding: 80rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); }
</style>