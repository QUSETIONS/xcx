<template>
  <view class="page">
    <!-- 头部 -->
    <view class="header">
      <text class="header-title">社区</text>
      <view class="header-right">
        <view class="notify-btn" @tap="goNotify">
          <text>🔔</text>
          <view class="notify-dot"/>
        </view>
      </view>
    </view>

    <!-- 话题横向滚动 -->
    <scroll-view scroll-x class="topic-scroll">
      <view class="topic-list">
        <view class="topic-item" :class="{ active: !currentTopic }" @tap="selectTopic(null)"><text>🔥 全部</text></view>
        <view class="topic-item" :class="{ active: currentTopic === t.id }" v-for="t in topics" :key="t.id" @tap="selectTopic(t.id)">
          <text>{{ t.icon }} {{ t.name }}</text>
          <text class="topic-count" v-if="t.hot">HOT</text>
        </view>
      </view>
    </scroll-view>

    <!-- 热门讨论卡片 -->
    <view v-if="!currentTopic && hotPosts.length" class="hot-section">
      <text class="hot-title">🔥 热门讨论</text>
      <scroll-view scroll-x class="hot-scroll">
        <view class="hot-list">
          <view class="hot-card" v-for="item in hotPosts" :key="item._id" @tap="goDetail(item._id)">
            <view class="hot-header">
              <view class="hot-avatar"><text>{{ item.author.nickname[0] }}</text></view>
              <text class="hot-author">{{ item.author.nickname }}</text>
            </view>
            <text class="hot-content">{{ item.content.slice(0, 50) }}...</text>
            <view class="hot-stats">
              <text>❤️ {{ item.like_count }}</text>
              <text>💬 {{ item.comment_count }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: sortMode === 'latest' }" @tap="sortMode = 'latest'; loadList(true)"><text>最新</text></view>
      <view class="tab-item" :class="{ active: sortMode === 'hot' }" @tap="sortMode = 'hot'; loadList(true)"><text>最热</text></view>
    </view>

    <!-- 帖子列表 -->
    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="post-list">
        <view class="post-item card-press" v-for="item in postList" :key="item._id" @tap="goDetail(item._id)">
          <!-- 作者 -->
          <view class="post-author">
            <view class="author-avatar" :style="{ background: getAvatarColor(item.author.id) }">
              <text class="avatar-text">{{ item.author.nickname[0] }}</text>
            </view>
            <view class="author-info">
              <text class="author-name">{{ item.author.nickname }}</text>
              <text class="author-meta">{{ item.author.company }} · {{ formatTime(item.created_at) }}</text>
            </view>
            <view class="post-topic" v-if="item.topic"><text>{{ item.topic.icon }} {{ item.topic.name }}</text></view>
          </view>

          <!-- 内容 -->
          <text class="post-content">{{ item.content }}</text>

          <!-- 互动 -->
          <view class="post-actions">
            <view class="action-btn" :class="{ liked: item._liked }" @tap.stop="likePost(item)">
              <text class="action-icon">{{ item._liked ? '❤️' : '🤍' }}</text>
              <text class="action-num">{{ item.like_count }}</text>
            </view>
            <view class="action-btn" @tap.stop="goDetail(item._id)">
              <text class="action-icon">💬</text>
              <text class="action-num">{{ item.comment_count }}</text>
            </view>
            <view class="action-btn" @tap.stop="sharePost">
              <text class="action-icon">🔗</text>
              <text class="action-num">{{ item.share_count }}</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="loading" class="loading"><text>加载中...</text></view>
      <view v-if="noMore && postList.length" class="end"><text>— 已加载全部 —</text></view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view class="fab-btn" @tap="goPublish"><text class="fab-icon">✏️</text></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { communityService } from '@/mock/service'

const topics = ref(communityService.topics())
const currentTopic = ref(null)
const sortMode = ref('latest')
const postList = ref([])
const hotPosts = ref([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)

const avatarColors = [
  'linear-gradient(135deg, #FF6B35, #FF9A5C)',
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #EC4899, #F472B6)',
  'linear-gradient(135deg, #3B82F6, #60A5FA)'
]

function getAvatarColor(id) {
  const idx = id ? id.charCodeAt(id.length - 1) % 5 : 0
  return avatarColors[idx]
}

function formatTime(t) {
  if (!t) return ''
  const diff = (Date.now() - new Date(t).getTime()) / 3600000
  if (diff < 1) return '刚刚'
  if (diff < 24) return Math.floor(diff) + '小时前'
  if (diff < 168) return Math.floor(diff / 24) + '天前'
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function loadList(reset = false) {
  if (reset) { page.value = 1; noMore.value = false }
  loading.value = true
  try {
    const res = communityService.posts({
      page: page.value, pageSize: 10,
      topic_id: currentTopic.value,
      sort: sortMode.value
    })
    postList.value = reset ? res.list : [...postList.value, ...res.list]
    noMore.value = res.list.length < 10
  } finally { loading.value = false; refreshing.value = false }
}

function loadHotPosts() {
  const res = communityService.posts({ hot: true, pageSize: 3 })
  hotPosts.value = res.list
}

function loadMore() { if (!loading.value && !noMore.value) { page.value++; loadList() } }
function onRefresh() { refreshing.value = true; loadList(true) }
function selectTopic(id) { currentTopic.value = id; loadList(true) }

function likePost(item) {
  item._liked = !item._liked
  if (item._liked) { communityService.like(item._id); item.like_count++ }
  else { item.like_count-- }
}

function goDetail(id) { uni.navigateTo({ url: `/pages/community/detail?id=${id}` }) }
function goPublish() { uni.navigateTo({ url: '/pages/community/post' }) }
function goNotify() { uni.navigateTo({ url: '/pages/message/index' }) }
function sharePost() { uni.showModal({ title: '分享', content: '点击右上角「...」分享', showCancel: false }) }

loadList(true)
loadHotPosts()
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }

.header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 24rpx 16rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.header-right { display: flex; }
.notify-btn { width: 64rpx; height: 64rpx; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 20rpx; display: flex; align-items: center; justify-content: center; position: relative; font-size: 28rpx; }
.notify-dot { position: absolute; top: 12rpx; right: 12rpx; width: 12rpx; height: 12rpx; background: #EF4444; border-radius: 50%; }

.topic-scroll { padding: 0 24rpx 12rpx; }
.topic-list { display: flex; }
.topic-item { display: flex; align-items: center; padding: 10rpx 24rpx; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 24rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); white-space: nowrap; }
.topic-item.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }
.topic-count { font-size: 16rpx; color: #EF4444; background: rgba(239,68,68,0.15); padding: 2rpx 8rpx; border-radius: 8rpx; }

.hot-section { margin: 0 24rpx 12rpx; }
.hot-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.hot-scroll { white-space: nowrap; }
.hot-list { display: inline-flex; }
.hot-card { width: 320rpx; background: rgba(255,107,53,0.08); border: 1rpx solid rgba(255,107,53,0.15); border-radius: 16rpx; padding: 16rpx; display: inline-block; }
.hot-header { display: flex; align-items: center; margin-bottom: 8rpx; }
.hot-avatar { width: 36rpx; height: 36rpx; border-radius: 50%; background: linear-gradient(135deg, #FF6B35, #FF9A5C); display: flex; align-items: center; justify-content: center; }
.hot-avatar text { font-size: 18rpx; color: #333333; font-weight: bold; }
.hot-author { font-size: 22rpx; color: rgba(0,0,0,0.6); }
.hot-content { font-size: 24rpx; color: rgba(0,0,0,0.7); display: block; margin-bottom: 8rpx; white-space: normal; line-height: 1.4; }
.hot-stats { display: flex; }
.hot-stats text { font-size: 20rpx; color: rgba(0,0,0,0.5); }

.tab-bar { display: flex; padding: 12rpx 24rpx; }
.tab-item { font-size: 28rpx; color: rgba(0,0,0,0.5); padding-bottom: 8rpx; }
.tab-item.active { color: #FF6B35; font-weight: bold; border-bottom: 4rpx solid #FF6B35; }

.list-scroll { height: calc(100vh - 340rpx); padding: 0 24rpx; }
.post-list { display: flex; flex-direction: column; }
.post-item { margin-bottom: 12rpx; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 20rpx; padding: 24rpx; }

.post-author { display: flex; align-items: center; margin-bottom: 16rpx; }
.author-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 24rpx; color: #333333; font-weight: bold; }
.author-info { flex: 1; }
.author-name { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.author-meta { font-size: 20rpx; color: rgba(0,0,0,0.4); }
.post-topic { font-size: 20rpx; color: #FF9A5C; background: rgba(255,107,53,0.12); padding: 4rpx 12rpx; border-radius: 8rpx; }

.post-content { font-size: 28rpx; color: rgba(0,0,0,0.7); line-height: 1.6; display: block; margin-bottom: 16rpx; }

.post-actions { display: flex; }
.action-btn { display: flex; align-items: center; }
.action-btn.liked .action-num { color: #FF6B35; }
.action-icon { font-size: 28rpx; }
.action-num { font-size: 24rpx; color: rgba(0,0,0,0.5); }

.loading, .end { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

.fab-btn { position: fixed; right: 32rpx; bottom: 160rpx; width: 96rpx; height: 96rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 32rpx rgba(255,107,53,0.4); z-index: 100; }
.fab-icon { font-size: 36rpx; }
</style>