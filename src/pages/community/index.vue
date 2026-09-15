<template>
  <view class="page community-page" :style="a11yStyle">
    <!-- 头部 -->
    <view class="header">
      <view><text class="header-eyebrow">社区动态</text><text class="header-title">{{ t('community.title') }}</text></view>
      <view class="header-right">
        <view class="notify-btn" @tap="goNotify">
          <image src="/static/icons/bell.svg" mode="aspectFit" />
          <view v-if="unreadNotifications" class="notify-dot"/>
        </view>
      </view>
    </view>

    <view class="network-entry card-press" @tap="goNetwork">
      <view class="network-entry-icon"><image src="/static/icons/users.svg" mode="aspectFit" /></view>
      <view class="network-entry-copy"><text class="network-entry-title">人脉圈</text><text class="network-entry-desc">先认识一个人，再看看适合你的社群</text></view>
      <text class="network-entry-arrow">→</text>
    </view>

    <!-- 话题横向滚动 -->
    <scroll-view scroll-x class="topic-scroll">
      <view class="topic-list">
        <view class="topic-item" :class="{ active: !currentTopic }" @tap="selectTopic(null)"><text>{{ t('common.all') }}</text></view>
        <view class="topic-item" :class="{ active: currentTopic === t.id }" v-for="t in topics" :key="t.id" @tap="selectTopic(t.id)">
          <text>{{ t.name }}</text>
          <text class="topic-count" v-if="t.hot">HOT</text>
        </view>
      </view>
    </scroll-view>

    <!-- 热门讨论卡片 -->
    <view v-if="!currentTopic && hotPosts.length" class="hot-section">
      <text class="hot-title">{{ t('community.hotDiscussions') }}</text>
      <scroll-view scroll-x class="hot-scroll">
        <view class="hot-list">
          <view class="hot-card" v-for="item in hotPosts" :key="item._id" @tap="goDetail(item._id)">
            <view class="hot-header">
              <view class="hot-avatar"><text>{{ item.author.nickname[0] }}</text></view>
              <text class="hot-author">{{ item.author.nickname }}</text>
            </view>
            <text class="hot-content">{{ item.content.slice(0, 50) }}...</text>
            <view class="hot-stats">
              <text>{{ item.like_count }} 次赞同</text>
              <text>{{ item.comment_count }} 条讨论</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: sortMode === 'latest' }" @tap="sortMode = 'latest'; loadList(true)"><text>{{ t('community.latest') }}</text></view>
      <view class="tab-item" :class="{ active: sortMode === 'hot' }" @tap="sortMode = 'hot'; loadList(true)"><text>{{ t('community.hot') }}</text></view>
    </view>

    <!-- 帖子列表 -->
    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="post-list">
        <view class="post-item card-press" v-for="item in postList" :key="item._id" @tap="goDetail(item._id)">
          <!-- 作者 -->
          <view class="post-author">
            <view class="author-avatar" :style="{ background: getAvatarColor(item.author.id) }" @tap.stop="goProfile(item.author.id)">
              <text class="avatar-text">{{ item.author.nickname[0] }}</text>
            </view>
            <view class="author-info" @tap.stop="goProfile(item.author.id)">
              <text class="author-name">{{ item.author.nickname }}</text>
              <text class="author-meta">{{ item.author.company }} · {{ formatTime(item.created_at) }}</text>
            </view>
            <view class="post-topic" v-if="item.topic"><text>{{ item.topic.name }}</text></view>
          </view>

          <!-- 内容 -->
          <text class="post-content">{{ item.content }}</text>

          <!-- 互动 -->
          <view class="post-actions">
            <view class="action-btn" :class="{ liked: item._liked }" @tap.stop="likePost(item)">
              <image class="action-icon" src="/static/icons/heart.svg" mode="aspectFit" />
              <text class="action-num">{{ item.like_count }}</text>
            </view>
            <view class="action-btn" @tap.stop="goDetail(item._id)">
              <image class="action-icon" src="/static/icons/chat.svg" mode="aspectFit" />
              <text class="action-num">{{ item.comment_count }}</text>
            </view>
            <view class="action-btn" @tap.stop="sharePost">
              <image class="action-icon" src="/static/icons/handshake.svg" mode="aspectFit" />
              <text class="action-num">{{ item.share_count }}</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="listError && !postList.length && !loading" class="list-error" @tap="retryList">
        <text class="error-icon">↻</text>
        <text class="error-title">社区动态没加载出来</text>
        <text class="error-action">点一下重试</text>
      </view>
      <view v-if="listError && postList.length" class="inline-error" @tap="retryList">加载更多失败，点此重试</view>
      <view v-if="loading" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="noMore && postList.length && !listError" class="end"><text>— {{ t('listPage.noMore') }} —</text></view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view class="fab-btn" @tap="goPublish"><image class="fab-icon" src="/static/icons/edit.svg" mode="aspectFit" /></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { formatRelativeTime as formatTime } from "@/utils/util"
import { t } from '@/i18n'
import { a11yStyle } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useUserStore } from '@/stores/user'
import { hasStoredAccessToken } from '@/utils/session'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.community')

const topics = ref([])
const userStore = useUserStore()
const currentTopic = ref(null)
const sortMode = ref('latest')
const hotPosts = ref([])
const unreadNotifications = ref(0)
const { list: postList, loading, refreshing, noMore, error: listError, retry: retryList, load: loadList, loadMore, refresh } = useList(
  (p) => bridge.community.posts({ ...p, topic_id: currentTopic.value, sort: sortMode.value }),
  10
)

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


async function loadHotPosts() {
  try {
    const res = await bridge.community.posts({ hot: true, pageSize: 3 })
    hotPosts.value = res?.list || []
  } catch {
    hotPosts.value = []
  }
}

async function loadUnreadNotifications() {
  if (!hasStoredAccessToken()) return
  try {
    unreadNotifications.value = Number(await bridge.notify.unreadCount()) || 0
  } catch {
    unreadNotifications.value = 0
  }
}

function onRefresh() { refresh() }
function selectTopic(id) { currentTopic.value = id; loadList(true) }

async function likePost(item) {
  if (item._likePending || !(await requirePageLogin(userStore, '登录后才能点赞动态'))) return
  item._likePending = true
  try {
    const result = await bridge.community.like(item._id)
    item._liked = !!result?.liked
    item.like_count = Math.max(0, Number(result?.count ?? item.like_count))
  } catch {
    uni.showToast({ title: '点赞失败，请稍后重试', icon: 'none' })
  } finally {
    item._likePending = false
  }
}

function goDetail(id) { uni.navigateTo({ url: `/pages/community/detail?id=${id}` }) }
function goPublish() { uni.navigateTo({ url: '/pages/community/post' }) }
function goNotify() { uni.navigateTo({ url: '/pages/message/index' }) }
function goNetwork() { uni.navigateTo({ url: '/pages/network/index' }) }
function goProfile(id) { uni.navigateTo({ url: '/pages/profile/index?id=' + id }) }
function sharePost() { uni.showModal({ title: t('community.share'), content: t('community.shareContent'), showCancel: false }) }

loadList(true)
loadHotPosts()
loadUnreadNotifications()
bridge.community.topics().then(list => { topics.value = list || [] }).catch(() => { topics.value = [] })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 18rpx 24rpx 130rpx; color: #303B57; background: #F5F7FB; }

.header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18rpx; }
.header-eyebrow { display: block; color: #A0AABD; font-family: monospace; font-size: 17rpx; font-weight: 700; letter-spacing: .1em; }
.header-title { display: block; margin-top: 7rpx; color: #303B57; font-size: 42rpx; font-weight: 760; letter-spacing: -.04em; }
.header-right { display: flex; }
.notify-btn { position: relative; display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; border: 1rpx solid #E6EAF2; border-radius: 18rpx; background: #FFF; }
.notify-btn image { display: block; width: 33rpx; height: 33rpx; object-fit: contain; opacity: .76; }
.notify-dot { position: absolute; top: 12rpx; right: 12rpx; width: 12rpx; height: 12rpx; background: #EF4444; border-radius: 50%; }

.network-entry { display: flex; align-items: center; margin-bottom: 18rpx; padding: 17rpx 18rpx; border: 1rpx solid #DDE2FA; border-radius: 21rpx; background: linear-gradient(135deg, #F0F2FF, #FFF); }
.network-entry-icon { display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; margin-right: 13rpx; border-radius: 18rpx; background: #E1E5FF; }
.network-entry-icon image { display: block; width: 33rpx; height: 33rpx; object-fit: contain; opacity: .8; }
.network-entry-copy { flex: 1; min-width: 0; }
.network-entry-title { display: block; color: #4E5CCB; font-size: 24rpx; font-weight: 700; }
.network-entry-desc { display: block; overflow: hidden; margin-top: 4rpx; color: #8E9AB0; font-size: 18rpx; text-overflow: ellipsis; white-space: nowrap; }
.network-entry-arrow { color: #7480D7; font-size: 28rpx; }

.topic-scroll { padding: 0 24rpx 12rpx; }
.topic-list { display: flex; }
.topic-item { display: flex; align-items: center; padding: 10rpx 24rpx; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 24rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); white-space: nowrap; }
.topic-item.active { border-color: #D7DBF7; color: #5D6BD2; background: #EEF0FF; }
.topic-count { font-size: 16rpx; color: #EF4444; background: rgba(239,68,68,0.15); padding: 2rpx 8rpx; border-radius: 8rpx; }

.hot-section { margin: 0 24rpx 12rpx; }
.hot-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.hot-scroll { white-space: nowrap; }
.hot-list { display: inline-flex; }
.hot-card { display: inline-block; width: 320rpx; padding: 16rpx; border: 1rpx solid #E1E5FB; border-radius: 18rpx; background: #F4F5FF; }
.hot-header { display: flex; align-items: center; margin-bottom: 8rpx; }
.hot-avatar { width: 36rpx; height: 36rpx; border-radius: 50%; background: linear-gradient(135deg, #FF6B35, #FF9A5C); display: flex; align-items: center; justify-content: center; }
.hot-avatar text { font-size: 18rpx; color: #333333; font-weight: bold; }
.hot-author { font-size: 22rpx; color: rgba(0,0,0,0.6); }
.hot-content { font-size: 24rpx; color: rgba(0,0,0,0.7); display: block; margin-bottom: 8rpx; white-space: normal; line-height: 1.4; }
.hot-stats { display: flex; }
.hot-stats text { font-size: 20rpx; color: rgba(0,0,0,0.5); }

.tab-bar { display: flex; gap: 24rpx; padding: 12rpx 0; }
.tab-item { padding-bottom: 8rpx; color: #98A4B7; font-size: 25rpx; }
.tab-item.active { border-bottom: 4rpx solid #6573DC; color: #6573DC; font-weight: 700; }

.post-list { display: flex; flex-direction: column; }
.post-item { margin-bottom: 14rpx; padding: 20rpx; border: 1rpx solid #E7EBF2; border-radius: 21rpx; background: #FFF; box-shadow: 0 8rpx 22rpx rgba(70,87,123,.035); }

.post-author { display: flex; align-items: center; margin-bottom: 16rpx; }
.author-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 24rpx; color: #333333; font-weight: bold; }
.author-info { flex: 1; }
.author-name { display: block; color: #52607A; font-size: 25rpx; font-weight: 700; }
.author-meta { color: #A0AABD; font-size: 18rpx; }
.post-topic { padding: 5rpx 9rpx; border-radius: 7rpx; color: #6573D6; background: #EEF0FF; font-size: 17rpx; }

.post-content { display: block; margin-bottom: 16rpx; color: #59667D; font-size: 25rpx; line-height: 1.65; }

.post-actions { display: flex; }
.action-btn { display: flex; align-items: center; gap: 6rpx; }
.action-btn.liked .action-num { color: #6573DC; }
.action-icon { display: inline-flex; align-items: center; justify-content: center; width: 32rpx; height: 32rpx; font-size: 26rpx; line-height: 1; }
.action-num { font-size: 24rpx; color: rgba(0,0,0,0.5); }

.loading, .end { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }
.list-error { display: flex; flex-direction: column; align-items: center; padding: 90rpx 24rpx; color: #8D99AC; }
.error-icon { display: flex; align-items: center; justify-content: center; width: 68rpx; height: 68rpx; margin-bottom: 14rpx; border-radius: 22rpx; color: #6573DC; background: #EEF0FF; font-size: 36rpx; }
.error-title { color: #52607A; font-size: 25rpx; font-weight: 650; }
.error-action { margin-top: 8rpx; color: #6573DC; font-size: 20rpx; }
.inline-error { margin: 8rpx 0; padding: 12rpx 16rpx; border-radius: 12rpx; color: #B35E4F; background: #FFF1ED; font-size: 19rpx; text-align: center; }

.fab-btn { position: fixed; right: 28rpx; bottom: 148rpx; z-index: 100; display: flex; align-items: center; justify-content: center; width: 88rpx; height: 88rpx; border-radius: 28rpx; background: #6573DC; box-shadow: 0 12rpx 26rpx rgba(101,115,220,.28); }
.fab-icon { display: inline-flex; align-items: center; justify-content: center; width: 36rpx; height: 36rpx; font-size: 33rpx; line-height: 1; }

/* Enterprise pass: 社区强调内容流和参与入口，颜色只承担状态表达。 */
.page { color: #1F2329; background: #F5F6F8; }
.header-title { color: #1F2329; }
.network-entry, .hot-card, .post-item { border-color: #E5E6EB; border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(31,35,41,.03); }
.network-entry { background: #FFF; }
.tab-item.active { border-bottom-color: #1677FF; color: #1677FF; }
.post-topic { color: #0958D9; background: #E8F3FF; }
.action-btn.liked .action-num, .error-action { color: #1677FF; }
.error-icon { border-color: #D9E7F7; color: #1677FF; background: #E8F3FF; }
.fab-btn { width: 80rpx; height: 80rpx; border-radius: 10rpx; background: #1677FF; box-shadow: 0 6rpx 16rpx rgba(22,119,255,.2); }

/* Overflow guard: the feed height follows the real header instead of a guessed
 * viewport subtraction, and every text-bearing row gets a shrinking column. */
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header > view:first-child,
.network-entry-copy,
.author-info,
.post-author,
.post-item {
  min-width: 0;
}
.header > view:first-child,
.author-info { flex: 1; overflow: hidden; }
.header-title,
.author-name,
.author-meta,
.post-topic {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.post-topic { max-width: 34%; }
.topic-scroll,
.hot-scroll,
.list-scroll { width: 100%; max-width: 100%; }
.topic-list,
.hot-list,
.topic-item,
.hot-card { flex: 0 0 auto; }
.list-scroll {
  flex: 1;
  min-height: 0;
  height: auto;
  padding-bottom: calc(130rpx + env(safe-area-inset-bottom));
}
.post-content,
.hot-content,
.comment-content {
  overflow-wrap: anywhere;
  word-break: break-word;
}
.action-btn,
.action-icon { flex: 0 0 auto; }
</style>
