<template>
  <view class="page" v-if="post">
    <!-- 作者信息 -->
    <view class="post-header">
      <view class="author-avatar">
        <text class="avatar-text">{{ post.author.nickname[0] }}</text>
      </view>
      <view class="author-info">
        <text class="author-name">{{ post.author.nickname }}</text>
        <text class="author-meta">{{ post.author.company }} · {{ formatTime(post.created_at) }}</text>
      </view>
      <view class="follow-btn" @tap="follow"><text>关注</text></view>
    </view>

    <!-- 话题标签 -->
    <view class="post-topic" v-if="post.topic">
      <text>{{ post.topic.icon }} {{ post.topic.name }}</text>
    </view>

    <!-- 内容 -->
    <text class="post-content">{{ post.content }}</text>

    <!-- 互动数据 -->
    <view class="post-stats">
      <text class="stats-item">👁 {{ post.view_count }} 浏览</text>
      <text class="stats-item">❤️ {{ post.like_count }} 赞</text>
      <text class="stats-item">💬 {{ post.comment_count }} 评论</text>
    </view>

    <!-- 操作栏 -->
    <view class="post-actions">
      <view class="action-btn" :class="{ liked: post._liked }" @tap="likePost">
        <text class="action-icon">{{ post._liked ? '❤️' : '🤍' }}</text>
        <text class="action-text">赞</text>
      </view>
      <view class="action-btn" @tap="share">
        <text class="action-icon">🔗</text>
        <text class="action-text">分享</text>
      </view>
      <view class="action-btn" @tap="collect">
        <text class="action-icon">⭐</text>
        <text class="action-text">收藏</text>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comments-section">
      <text class="comments-title">全部评论 {{ comments.length }}</text>
      <view class="comment-list">
        <view class="comment-item" v-for="item in comments" :key="item._id">
          <view class="comment-avatar">
            <text class="avatar-text">{{ item.author.nickname[0] }}</text>
          </view>
          <view class="comment-body">
            <text class="comment-author">{{ item.author.nickname }}</text>
            <text class="comment-content">{{ item.content }}</text>
            <view class="comment-meta">
              <text class="comment-time">{{ formatTime(item.created_at) }}</text>
              <text class="comment-likes">❤️ {{ item.like_count }}</text>
            </view>
          </view>
        </view>
        <view v-if="!comments.length" class="no-comments"><text>暂无评论，快来抢沙发吧</text></view>
      </view>
    </view>

    <!-- 底部评论输入 -->
    <view class="comment-bar">
      <input class="comment-input" v-model="commentText" placeholder="说点什么..." />
      <view class="send-btn" @tap="submitComment"><text>发送</text></view>
    </view>
  </view>

  <view v-else class="empty"><text class="empty-icon">📭</text><text>帖子不存在</text></view>
</template>

<script setup>
import { ref } from 'vue'
import { communityService } from '@/mock/service'

const postId = ref('')
const post = ref(null)
const comments = ref([])
const commentText = ref('')

function formatTime(t) {
  if (!t) return ''
  const diff = (Date.now() - new Date(t).getTime()) / 3600000
  if (diff < 1) return '刚刚'
  if (diff < 24) return Math.floor(diff) + '小时前'
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function loadDetail() {
  post.value = communityService.postDetail(postId.value)
  if (post.value) {
    post.value._liked = false
    comments.value = communityService.comments(postId.value)
    post.value.view_count++
  }
}

function likePost() {
  post.value._liked = !post.value._liked
  if (post.value._liked) {
    communityService.like(postId.value)
    post.value.like_count++
  } else {
    post.value.like_count--
  }
}

function follow() { uni.showToast({ title: '关注成功', icon: 'success' }) }
function share() { uni.showModal({ title: '分享', content: '点击右上角「...」分享', showCancel: false }) }
function collect() { uni.showToast({ title: '已收藏', icon: 'success' }) }

function submitComment() {
  if (!commentText.value.trim()) { uni.showToast({ title: '请输入评论', icon: 'none' }); return }
  communityService.createComment(postId.value, commentText.value)
  comments.value = communityService.comments(postId.value)
  post.value.comment_count++
  commentText.value = ''
  uni.showToast({ title: '评论成功', icon: 'success' })
}

onLoad((q) => { postId.value = q.id; loadDetail() })
</script>

<style lang="scss">
.page { min-height: 100vh; background: #0A0A0F; padding: 24rpx; padding-bottom: 160rpx; }

.post-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.author-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 28rpx; color: #fff; font-weight: bold; }
.author-info { flex: 1; }
.author-name { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; }
.author-meta { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.follow-btn { padding: 8rpx 24rpx; background: rgba(255,107,53,0.15); border: 1rpx solid rgba(255,107,53,0.25); border-radius: 24rpx; }
.follow-btn text { font-size: 24rpx; color: #FF6B35; }

.post-topic { font-size: 24rpx; color: #FF9A5C; background: rgba(255,107,53,0.12); padding: 8rpx 16rpx; border-radius: 8rpx; display: inline-flex; margin-bottom: 16rpx; }

.post-content { font-size: 32rpx; color: rgba(255,255,255,0.95); line-height: 1.7; display: block; margin-bottom: 24rpx; }

.post-stats { display: flex; gap: 24rpx; padding: 16rpx 0; border-bottom: 1rpx solid rgba(255,255,255,0.1); margin-bottom: 16rpx; }
.stats-item { font-size: 24rpx; color: rgba(255,255,255,0.6); }

.post-actions { display: flex; gap: 32rpx; margin-bottom: 32rpx; }
.action-btn { display: flex; align-items: center; gap: 8rpx; padding: 12rpx 24rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 24rpx; }
.action-btn.liked { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); }
.action-icon { font-size: 24rpx; }
.action-text { font-size: 24rpx; color: rgba(255,255,255,0.65); }

.comments-section { margin-top: 32rpx; }
.comments-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 16rpx; }
.comment-list { display: flex; flex-direction: column; gap: 16rpx; }
.comment-item { display: flex; gap: 12rpx; }
.comment-avatar { width: 48rpx; height: 48rpx; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; }
.comment-avatar .avatar-text { font-size: 20rpx; color: rgba(255,255,255,0.65); }
.comment-body { flex: 1; }
.comment-author { font-size: 24rpx; font-weight: bold; color: rgba(255,255,255,0.85); display: block; margin-bottom: 4rpx; }
.comment-content { font-size: 26rpx; color: rgba(255,255,255,0.75); display: block; margin-bottom: 8rpx; line-height: 1.5; }
.comment-meta { display: flex; gap: 16rpx; }
.comment-time { font-size: 20rpx; color: rgba(255,255,255,0.4); }
.comment-likes { font-size: 20rpx; color: rgba(255,255,255,0.5); }
.no-comments { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(255,255,255,0.5); }

.comment-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; gap: 12rpx; padding: 16rpx 24rpx; background: #12121A; border-top: 1rpx solid rgba(255,255,255,0.1); }
.comment-input { flex: 1; height: 64rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 32rpx; padding: 16rpx 20rpx; font-size: 26rpx; color: rgba(255,255,255,0.95); }
.send-btn { padding: 16rpx 32rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; }
.send-btn text { font-size: 26rpx; color: #fff; font-weight: bold; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
</style>