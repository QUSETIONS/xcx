<template>
  <view class="page">
    <!-- 头部 -->
    <view class="header">
      <text class="header-title">社区</text>
      <view class="header-actions">
        <view class="search-btn" @tap="goSearch">
          <text>🔍</text>
        </view>
      </view>
    </view>

    <!-- 话题横向滚动 -->
    <scroll-view scroll-x class="topic-scroll">
      <view class="topic-list">
        <view class="topic-item" :class="{ active: !currentTopic }" @tap="selectTopic(null)">
          <text>🔥 全部</text>
        </view>
        <view class="topic-item" :class="{ active: currentTopic === t.id }" v-for="t in topics" :key="t.id" @tap="selectTopic(t.id)">
          <text>{{ t.icon }} {{ t.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 热门帖子 Banner -->
    <view v-if="!currentTopic && hotPosts.length" class="hot-section">
      <text class="hot-title">🔥 热门讨论</text>
      <scroll-view scroll-x class="hot-scroll">
        <view class="hot-list">
          <view class="hot-item" v-for="item in hotPosts" :key="item._id" @tap="goDetail(item._id)">
            <text class="hot-content">{{ item.content.slice(0, 40) }}...</text>
            <view class="hot-meta">
              <text class="hot-author">{{ item.author.nickname }}</text>
              <text class="hot-likes">❤️ {{ item.like_count }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 帖子列表 -->
    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="post-list">
        <view class="post-item" v-for="item in postList" :key="item._id" @tap="goDetail(item._id)">
          <!-- 作者信息 -->
          <view class="post-author">
            <view class="author-avatar">
              <text class="avatar-text">{{ item.author.nickname[0] }}</text>
            </view>
            <view class="author-info">
              <text class="author-name">{{ item.author.nickname }}</text>
              <text class="author-company">{{ item.author.company }}</text>
            </view>
            <view class="post-topic" v-if="item.topic">
              <text>{{ item.topic.icon }} {{ item.topic.name }}</text>
            </view>
          </view>

          <!-- 内容 -->
          <text class="post-content">{{ item.content }}</text>

          <!-- 互动数据 -->
          <view class="post-actions">
            <view class="action-item" @tap.stop="likePost(item)">
              <text>{{ item._liked ? '❤️' : '🤍' }}</text>
              <text class="action-count">{{ item.like_count }}</text>
            </view>
            <view class="action-item" @tap.stop="goDetail(item._id)">
              <text>💬</text>
              <text class="action-count">{{ item.comment_count }}</text>
            </view>
            <view class="action-item" @tap.stop="sharePost">
              <text>🔗</text>
              <text class="action-count">{{ item.share_count }}</text>
            </view>
            <text class="post-time">{{ formatTime(item.created_at) }}</text>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading"><text>加载中...</text></view>
      <view v-if="noMore && postList.length" class="end"><text>— 已加载全部 —</text></view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view class="fab-btn" @tap="goPublish">
      <text class="fab-icon">✏️</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { communityService } from '@/mock/service'

const topics = ref(communityService.topics())
const currentTopic = ref(null)
const postList = ref([])
const hotPosts = ref([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)

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
      sort: 'latest'
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
  if (item._liked) {
    communityService.like(item._id)
    item.like_count++
  } else {
    item.like_count--
  }
}

function goDetail(id) { uni.navigateTo({ url: `/pages/community/detail?id=${id}` }) }
function goPublish() { uni.navigateTo({ url: '/pages/community/post' }) }
function goSearch() { uni.showToast({ title: '搜索功能开发中', icon: 'none' }) }
function sharePost() { uni.showModal({ title: '分享', content: '点击右上角「...」分享', showCancel: false }) }

loadList(true)
loadHotPosts()
</script>

<style lang="scss">
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 120rpx; }

.header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 24rpx 16rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.search-btn { width: 64rpx; height: 64rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; }

.topic-scroll { padding: 0 24rpx 16rpx; }
.topic-list { display: flex; gap: 12rpx; }
.topic-item { padding: 10rpx 24rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 24rpx; font-size: 24rpx; color: rgba(255,255,255,0.65); white-space: nowrap; }
.topic-item.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }

.hot-section { margin: 0 24rpx 16rpx; }
.hot-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 12rpx; }
.hot-scroll { white-space: nowrap; }
.hot-list { display: inline-flex; gap: 12rpx; }
.hot-item { width: 360rpx; background: rgba(255,107,53,0.08); border: 1rpx solid rgba(255,107,53,0.15); border-radius: 16rpx; padding: 16rpx; display: inline-block; }
.hot-content { font-size: 24rpx; color: rgba(255,255,255,0.85); display: block; margin-bottom: 8rpx; white-space: normal; line-height: 1.4; }
.hot-meta { display: flex; justify-content: space-between; }
.hot-author { font-size: 20rpx; color: rgba(255,255,255,0.5); }
.hot-likes { font-size: 20rpx; color: #FF6B35; }

.list-scroll { height: calc(100vh - 300rpx); padding: 0 24rpx; }
.post-list { display: flex; flex-direction: column; gap: 16rpx; }
.post-item { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 24rpx; }

.post-author { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
.author-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 24rpx; color: #fff; font-weight: bold; }
.author-info { flex: 1; }
.author-name { font-size: 26rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; }
.author-company { font-size: 20rpx; color: rgba(255,255,255,0.5); }
.post-topic { font-size: 20rpx; color: #FF9A5C; background: rgba(255,107,53,0.12); padding: 4rpx 12rpx; border-radius: 8rpx; }

.post-content { font-size: 28rpx; color: rgba(255,255,255,0.85); line-height: 1.6; display: block; margin-bottom: 16rpx; }

.post-actions { display: flex; align-items: center; gap: 24rpx; }
.action-item { display: flex; align-items: center; gap: 6rpx; font-size: 24rpx; }
.action-count { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.post-time { font-size: 20rpx; color: rgba(255,255,255,0.35); margin-left: auto; }

.loading, .end { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(255,255,255,0.5); }

.fab-btn { position: fixed; right: 32rpx; bottom: 160rpx; width: 96rpx; height: 96rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 32rpx rgba(255,107,53,0.4); z-index: 100; }
.fab-icon { font-size: 36rpx; }
</style>