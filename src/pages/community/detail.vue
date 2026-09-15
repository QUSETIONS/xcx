<template>
  <view v-if="detailState === 'loading'" class="detail-state"><text>正在加载帖子…</text></view>

  <view v-else-if="detailState === 'error'" class="detail-state error-state" @tap="reload">
    <image class="detail-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>帖子加载失败，点击重试</text>
  </view>

  <view class="page" v-else-if="post">
    <!-- 作者信息 -->
    <view class="post-header">
      <view class="author-avatar" @tap="goProfile">
        <text class="avatar-text">{{ post.author.nickname[0] }}</text>
      </view>
      <view class="author-info" @tap="goProfile">
        <text class="author-name">{{ post.author.nickname }}</text>
        <text class="author-meta">{{ post.author.company }} · {{ formatTime(post.created_at) }}</text>
      </view>
      <view class="follow-btn" :class="{ active: following, disabled: followPending }" @tap="follow"><text>{{ following ? '已关注' : t('community.follow') }}</text></view>
    </view>

    <!-- 话题标签 -->
    <view class="post-topic" v-if="post.topic">
      <text>{{ post.topic.icon }} {{ post.topic.name }}</text>
    </view>

    <!-- 内容 -->
    <text class="post-content">{{ post.content }}</text>

    <!-- 互动数据 -->
    <view class="post-stats">
      <text class="stats-item">{{ post.view_count }} {{ t('community.views') }}</text>
      <text class="stats-item">{{ post.like_count }} {{ t('community.like') }}</text>
      <text class="stats-item">{{ post.comment_count }} {{ t('community.comment') }}</text>
    </view>

    <!-- 操作栏 -->
    <view class="post-actions">
      <view class="action-btn" :class="{ liked: post._liked, disabled: likePending }" @tap="likePost">
        <image class="action-icon" src="/static/icons/heart.svg" mode="aspectFit" />
        <text class="action-text">{{ post._liked ? '已点赞' : t('community.like') }}</text>
      </view>
      <view class="action-btn" @tap="share">
        <image class="action-icon" src="/static/icons/handshake.svg" mode="aspectFit" />
        <text class="action-text">{{ t('community.share') }}</text>
      </view>
      <view class="action-btn" :class="{ active: favorited, disabled: favoritePending }" @tap="collect">
        <text class="action-icon">{{ favorited ? '★' : '☆' }}</text>
        <text class="action-text">{{ favorited ? '已收藏' : t('community.favorite') }}</text>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comments-section">
      <text class="comments-title">{{ t('community.allComments') }} {{ comments.length }}</text>
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
              <text class="comment-likes">赞 {{ item.like_count }}</text>
            </view>
          </view>
        </view>
        <view v-if="!comments.length" class="no-comments"><text>{{ t('community.noComments') }}</text></view>
      </view>
    </view>

    <!-- 底部评论输入 -->
    <view class="comment-bar">
      <input class="comment-input" v-model="commentText" :placeholder="t('community.commentPlaceholder')" />
      <view class="send-btn" @tap="submitComment"><text>{{ t('community.send') }}</text></view>
    </view>
  </view>

  <view v-else class="empty"><image class="empty-icon" src="/static/icons/chat.svg" mode="aspectFit" /><text>{{ t('community.notExist') }}</text></view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { useRequest } from '@/hooks/useRequest'
import { formatRelativeTime as formatTime } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
useNavTitle('titles.communityDetail')

const userStore = useUserStore()
const postId = ref('')
const comments = ref([])
const commentText = ref('')
const following = ref(false)
const favorited = ref(false)
const likePending = ref(false)
const followPending = ref(false)
const favoritePending = ref(false)
const commentPending = ref(false)

const { data: post, state: detailState, run: loadRequest } = useRequest(loadDetail)

async function loadDetail(id) {
  const detail = await bridge.community.postDetail(id)
  if (detail) {
    detail._liked = !!(detail.liked || detail._liked)
    comments.value = await bridge.community.comments(id)
    detail.view_count = Number(detail.view_count || 0) + 1
    if (userStore.isLoggedIn && detail.author?.id) {
      const [followed, favorite] = await Promise.allSettled([
        bridge.follow.check(detail.author.id),
        bridge.favorite.check({ targetType: 'post', targetId: id })
      ])
      following.value = followed.status === 'fulfilled' && !!followed.value
      favorited.value = favorite.status === 'fulfilled' && !!favorite.value
    } else {
      following.value = false
      favorited.value = false
    }
  }
  return detail
}

async function reload() {
  if (!postId.value) return
  await loadRequest(postId.value)
}

async function ensureInteractiveSession() {
  if (userStore.isLoggedIn) return true
  try {
    const ensured = await userStore.ensureLogin()
    if (ensured || userStore.isLoggedIn) return true
  } catch {}
  toastError('请先登录后再进行互动')
  setTimeout(() => uni.navigateTo({ url: '/pages/user/login' }), 300)
  return false
}

async function likePost() {
  if (!post.value || likePending.value || !(await ensureInteractiveSession())) return
  likePending.value = true
  try {
    const result = await bridge.community.like(postId.value)
    post.value._liked = !!result?.liked
    post.value.like_count = Math.max(0, Number(result?.count ?? post.value.like_count))
  } catch {
    toastError('点赞失败，请稍后重试')
  } finally {
    likePending.value = false
  }
}

async function follow() {
  if (!post.value?.author?.id || followPending.value || !(await ensureInteractiveSession())) return
  followPending.value = true
  try {
    const result = await bridge.follow.toggle(post.value.author.id)
    following.value = !!result?.followed
    uni.showToast({ title: following.value ? '已关注' : '已取消关注', icon: 'none' })
  } catch {
    toastError('关注失败，请稍后重试')
  } finally {
    followPending.value = false
  }
}

function share() {
  // #ifdef MP-WEIXIN
  if (typeof uni.showShareMenu === 'function') {
    uni.showShareMenu({ withShareTicket: true })
    uni.showToast({ title: '已开启分享，请点击右上角转发', icon: 'none' })
    return
  }
  // #endif
  uni.showModal({ title: t('community.share'), content: t('community.shareContent'), showCancel: false })
}

onShareAppMessage(() => ({
  title: post.value?.content ? `${post.value.author?.nickname || '社群成员'}：${post.value.content}`.slice(0, 48) : '媒合智联：看看这条行业动态',
  path: `/pages/community/detail?id=${encodeURIComponent(postId.value)}`
}))

onShareTimeline(() => ({
  title: post.value?.content ? String(post.value.content).slice(0, 48) : '媒合智联：看看这条行业动态',
  query: `id=${encodeURIComponent(postId.value)}`
}))

async function collect() {
  if (favoritePending.value || !(await ensureInteractiveSession())) return
  favoritePending.value = true
  try {
    const result = await bridge.favorite.toggle({ targetType: 'post', targetId: postId.value })
    favorited.value = !!result?.isFavorited
    uni.showToast({ title: favorited.value ? '已收藏' : '已取消收藏', icon: 'none' })
  } catch {
    toastError('收藏失败，请稍后重试')
  } finally {
    favoritePending.value = false
  }
}

async function submitComment() {
  if (!commentText.value.trim() || commentPending.value) {
    if (!commentText.value.trim()) uni.showToast({ title: t('community.enterComment'), icon: 'none' })
    return
  }
  if (!(await ensureInteractiveSession())) return
  commentPending.value = true
  try {
    await bridge.community.createComment(postId.value, commentText.value.trim())
    comments.value = await bridge.community.comments(postId.value)
    post.value.comment_count = comments.value.length
    commentText.value = ''
    uni.showToast({ title: t('community.commentSuccess'), icon: 'success' })
  } catch {
    toastError('评论失败，请稍后重试')
  } finally {
    commentPending.value = false
  }
}

onLoad(async (q) => {
  postId.value = q.id || ''
  if (postId.value) await loadRequest(postId.value)
})

function goProfile() {
  if (post.value && post.value.author) {
    uni.navigateTo({ url: '/pages/profile/index?id=' + post.value.author.id })
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 160rpx; }

.post-header { display: flex; align-items: center; margin-bottom: 16rpx; }
.author-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 28rpx; color: #333333; font-weight: bold; }
.author-info { flex: 1; }
.author-name { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.author-meta { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.follow-btn { padding: 8rpx 24rpx; background: rgba(255,107,53,0.15); border: 1rpx solid rgba(255,107,53,0.25); border-radius: 24rpx; }
.follow-btn.active { color: #2F9B82; background: rgba(47,155,130,.12); border-color: rgba(47,155,130,.25); }
.follow-btn.disabled, .action-btn.disabled { opacity: .5; pointer-events: none; }
.follow-btn text { font-size: 24rpx; color: #FF6B35; }

.post-topic { font-size: 24rpx; color: #FF9A5C; background: rgba(255,107,53,0.12); padding: 8rpx 16rpx; border-radius: 8rpx; display: inline-flex; margin-bottom: 16rpx; }

.post-content { font-size: 32rpx; color: rgba(0,0,0,0.85); line-height: 1.7; display: block; margin-bottom: 24rpx; }

.post-stats { display: flex; padding: 16rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.06); margin-bottom: 16rpx; }
.stats-item { font-size: 24rpx; color: rgba(255,255,255,0.6); }

.post-actions { display: flex; margin-bottom: 32rpx; }
.action-btn { display: flex; align-items: center; padding: 12rpx 24rpx; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 24rpx; }
.action-btn.liked { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); }
.action-btn.active { background: rgba(255,190,70,.15); border-color: rgba(255,190,70,.3); }
.action-icon { width: 26rpx; height: 26rpx; }
.action-text { font-size: 24rpx; color: rgba(0,0,0,0.6); }

.comments-section { margin-top: 32rpx; }
.comments-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.comment-list { display: flex; flex-direction: column; }
.comment-item { display: flex; }
.comment-avatar { width: 48rpx; height: 48rpx; border-radius: 50%; background: #FFFFFF; display: flex; align-items: center; justify-content: center; }
.comment-avatar .avatar-text { font-size: 20rpx; color: rgba(0,0,0,0.6); }
.comment-body { flex: 1; }
.comment-author { font-size: 24rpx; font-weight: bold; color: rgba(0,0,0,0.7); display: block; margin-bottom: 4rpx; }
.comment-content { font-size: 26rpx; color: rgba(255,255,255,0.75); display: block; margin-bottom: 8rpx; line-height: 1.5; }
.comment-meta { display: flex; }
.comment-time { font-size: 20rpx; color: rgba(0,0,0,0.4); }
.comment-likes { font-size: 20rpx; color: rgba(0,0,0,0.5); }
.no-comments { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

.comment-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; padding: 16rpx 24rpx; background: #12121A; border-top: 1rpx solid rgba(0,0,0,0.06); }
.comment-input { flex: 1; height: 64rpx; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 32rpx; padding: 16rpx 20rpx; font-size: 26rpx; color: rgba(0,0,0,0.85); }
.send-btn { padding: 16rpx 32rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; }
.send-btn text { font-size: 26rpx; color: #333333; font-weight: bold; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { width: 80rpx; height: 80rpx; display: block; margin: 0 auto 16rpx; }
.detail-state { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; color: rgba(0,0,0,0.5); font-size: 28rpx; }
.detail-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }

/* 详情页容器和互动行不再被昵称、URL 或操作文案撑破。 */
.page {
  overflow-x: hidden;
  box-sizing: border-box;
}
.post-header,
.author-info,
.comment-item,
.comment-body {
  min-width: 0;
}
.author-avatar { flex: 0 0 auto; }
.author-info {
  flex: 1;
  overflow: hidden;
}
.author-name,
.author-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.follow-btn,
.send-btn { flex: 0 0 auto; white-space: nowrap; }
.post-topic {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}
.post-stats { flex-wrap: wrap; gap: 8rpx 18rpx; }
.stats-item { min-width: 0; }
.post-actions { gap: 8rpx; }
.post-actions .action-btn {
  min-width: 0;
  flex: 1 1 0;
  justify-content: center;
  padding-right: 10rpx;
  padding-left: 10rpx;
}
.action-icon { flex: 0 0 auto; }
.comment-avatar { flex: 0 0 auto; }
.comment-body { overflow: hidden; }
.comment-content {
  overflow-wrap: anywhere;
  word-break: break-word;
}
.comment-bar { box-sizing: border-box; max-width: 100%; }
.comment-input { min-width: 0; box-sizing: border-box; }
</style>
