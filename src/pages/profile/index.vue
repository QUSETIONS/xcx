<template>
  <view class="page" v-if="user">
    <!-- 用户信息头部 -->
    <view class="profile-header">
      <view class="avatar-box" :style="{ background: avatarColor }">
        <text class="avatar-text">{{ user.nickname[0] }}</text>
      </view>
      <view class="user-info">
        <text class="nickname">{{ user.nickname }}</text>
        <text class="company">{{ user.company }}</text>
        <text class="bio">{{ user.bio }}</text>
      </view>
      <view class="follow-btn" :class="{ following: isFollowing }" @tap="toggleFollow">
        <text>{{ isFollowing ? '已关注' : '+ 关注' }}</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-num">{{ user.posts }}</text>
        <text class="stat-label">帖子</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ user.followers }}</text>
        <text class="stat-label">粉丝</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ reviewAvg }}</text>
        <text class="stat-label">评分</text>
      </view>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <text class="tab-item" :class="{ active: tab === 'posts' }" @tap="tab = 'posts'">帖子</text>
      <text class="tab-item" :class="{ active: tab === 'demands' }" @tap="tab = 'demands'">需求</text>
      <text class="tab-item" :class="{ active: tab === 'reviews' }" @tap="tab = 'reviews'">评价</text>
    </view>

    <!-- 帖子列表 -->
    <view v-if="tab === 'posts'" class="content-list">
      <view class="post-item card-press" v-for="item in userPosts" :key="item._id" @tap="goPost(item._id)">
        <text class="post-content">{{ item.content.length > 60 ? item.content.slice(0, 60) + '...' : item.content }}</text>
        <view class="post-meta">
          <text class="post-topic" v-if="item.topic">{{ item.topic.name }}</text>
          <text class="post-stats">❤️ {{ item.like_count }}  💬 {{ item.comment_count }}</text>
        </view>
      </view>
      <view v-if="!userPosts.length" class="empty"><text>暂无帖子</text></view>
    </view>

    <!-- 需求列表 -->
    <view v-if="tab === 'demands'" class="content-list">
      <view class="demand-item card-press" v-for="item in userDemands" :key="item._id" @tap="goDemand(item._id)">
        <text class="demand-title">{{ item.title }}</text>
        <view class="demand-meta">
          <text class="demand-cat">{{ item.category_name }}</text>
          <text class="demand-region">{{ item.region }}</text>
          <text class="demand-stats">👁 {{ item.view_count }}  🤝 {{ item.lead_count }}</text>
        </view>
      </view>
      <view v-if="!userDemands.length" class="empty"><text>暂无需求</text></view>
    </view>

    <!-- 评价列表 -->
    <view v-if="tab === 'reviews'" class="content-list">
      <view class="review-item" v-for="item in userReviews" :key="item._id">
        <view class="review-top">
          <text class="reviewer">{{ item.reviewer.nickname }}</text>
          <text class="review-stars">{{ getStars(item.rating) }}</text>
        </view>
        <text class="review-content">{{ item.content }}</text>
        <view class="review-tags" v-if="item.tags && item.tags.length">
          <text class="review-tag" v-for="(tag, i) in item.tags" :key="i">{{ tag }}</text>
        </view>
      </view>
      <view v-if="!userReviews.length" class="empty"><text>暂无评价</text></view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { communityService, demandService, reviewService, followService } from '@/mock/service'

const userId = ref('')
const user = ref(null)
const isFollowing = ref(false)
const tab = ref('posts')
const userPosts = ref([])
const userDemands = ref([])
const userReviews = ref([])
const reviewAvg = ref('5.0')

const avatarColors = [
  'linear-gradient(135deg, #FF6B35, #FF9A5C)',
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #EC4899, #F472B6)',
  'linear-gradient(135deg, #3B82F6, #60A5FA)',
]
const avatarColor = ref(avatarColors[0])

onLoad((q) => {
  userId.value = q.id
  loadProfile()
})

function loadProfile() {
  user.value = communityService.userInfo(userId.value)
  if (!user.value) return

  avatarColor.value = avatarColors[userId.value.charCodeAt(userId.value.length - 1) % 5]
  isFollowing.value = followService.check(userId.value)

  // 用户帖子
  userPosts.value = communityService.posts({ pageSize: 100 }).list.filter(p => p.author.id === userId.value)

  // 用户需求
  userDemands.value = demandService.list({ pageSize: 100 }).list.filter(d => d.created_by === userId.value || d.company_name === user.value.company)

  // 用户收到的评价
  userReviews.value = reviewService.list({ pageSize: 20 }).list
  const avg = reviewService.avgRating('demand_1')
  reviewAvg.value = avg.avg || '5.0'
}

function getStars(rating) { const r = Math.round(rating); return '⭐'.repeat(r) + '☆'.repeat(5 - r) }

function toggleFollow() {
  const res = followService.toggle(userId.value)
  isFollowing.value = res.followed
  if (res.followed) user.value.followers++
  else user.value.followers--
  uni.showToast({ title: res.followed ? '关注成功' : '已取消', icon: 'none' })
}

function goPost(id) { uni.navigateTo({ url: '/pages/community/detail?id=' + id }) }
function goDemand(id) { uni.navigateTo({ url: '/pages/demand/detail?id=' + id }) }
</script>

<style scoped>
.page { background: #F5F6FA; min-height: 100vh; padding-bottom: 40rpx; }

.profile-header { display: flex; align-items: center; background: #FFFFFF; padding: 32rpx 24rpx; margin-bottom: 16rpx; }
.avatar-box { width: 96rpx; height: 96rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.avatar-text { font-size: 40rpx; color: #FFFFFF; font-weight: bold; }
.user-info { flex: 1; }
.nickname { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.company { font-size: 26rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 4rpx; }
.bio { font-size: 24rpx; color: rgba(0,0,0,0.4); }
.follow-btn { padding: 14rpx 32rpx; border-radius: 28rpx; flex-shrink: 0; }
.follow-btn { background: linear-gradient(135deg, #FF6B35, #FF9A5C); }
.follow-btn text { font-size: 26rpx; color: #FFFFFF; font-weight: bold; }
.follow-btn.following { background: #F5F6FA; }
.follow-btn.following text { color: rgba(0,0,0,0.5); font-weight: normal; }

.stats-bar { display: flex; align-items: center; background: #FFFFFF; padding: 24rpx; margin-bottom: 16rpx; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 36rpx; font-weight: bold; color: #FF6B35; }
.stat-label { font-size: 22rpx; color: rgba(0,0,0,0.5); margin-top: 4rpx; }
.stat-divider { width: 1rpx; height: 48rpx; background: #F0F1F5; }

.tab-bar { display: flex; background: #FFFFFF; padding: 0 24rpx; margin-bottom: 16rpx; }
.tab-item { font-size: 28rpx; color: rgba(0,0,0,0.4); padding: 20rpx 24rpx; position: relative; }
.tab-item.active { color: #FF6B35; font-weight: bold; }
.tab-item.active::after { content: ''; position: absolute; bottom: 0; left: 24rpx; right: 24rpx; height: 4rpx; background: #FF6B35; border-radius: 2rpx; }

.content-list { padding: 0 24rpx; }
.post-item { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.post-content { font-size: 28rpx; color: rgba(0,0,0,0.8); line-height: 1.6; display: block; margin-bottom: 12rpx; }
.post-meta { display: flex; justify-content: space-between; }
.post-topic { font-size: 22rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; }
.post-stats { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.demand-item { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.demand-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.demand-meta { display: flex; align-items: center; }
.demand-cat { font-size: 20rpx; color: #6366F1; background: rgba(99,102,241,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 8rpx; }
.demand-region { font-size: 22rpx; color: rgba(0,0,0,0.4); margin-right: 16rpx; }
.demand-stats { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.review-item { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.review-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.reviewer { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.review-stars { font-size: 20rpx; }
.review-content { font-size: 26rpx; color: rgba(0,0,0,0.7); line-height: 1.6; display: block; margin-bottom: 8rpx; }
.review-tags { display: flex; flex-wrap: wrap; }
.review-tag { font-size: 20rpx; color: #10B981; background: rgba(16,185,129,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 8rpx; }

.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(0,0,0,0.4); }
</style>