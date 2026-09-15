<template>
  <view class="page information-page" :style="a11yStyle">
    <view class="page-header">
      <view><text class="eyebrow">MEDIA / MATCH</text><text class="page-title">资讯</text><text class="page-desc">行业动态、平台活动和正在发生的合作机会。</text></view>
      <text class="header-index">INFO / 01</text>
    </view>

    <view v-if="loading" class="state-card"><view class="loading-dot" /><text>正在整理资讯…</text></view>
    <view v-else>
      <view class="section-heading"><view><text class="section-kicker">INDUSTRY NEWS</text><text class="section-title">行业动态</text></view><text class="section-count">{{ news.length }} 条</text></view>
      <view v-if="news.length" class="news-list">
        <view v-for="(item, index) in news" :key="item._id || item.id || index" class="news-card" @tap="openNews(item)">
          <view class="news-index">0{{ index + 1 }}</view>
          <view class="news-copy"><text class="news-tag">{{ newsTag(item) }}</text><text class="news-title">{{ item.title }}</text><text class="news-summary">{{ item.subtitle || item.desc || '查看这条行业内容，了解平台正在连接的项目与资源。' }}</text></view>
          <text class="news-arrow">↗</text>
        </view>
      </view>
      <view v-else class="empty-card">近期暂无行业动态，先去和 AI 聊聊你的项目。</view>

      <view class="section-heading activity-heading"><view><text class="section-kicker">EVENTS &amp; PROGRAMS</text><text class="section-title">活动</text></view><text class="section-count">{{ activities.length }} 项</text></view>
      <view v-if="activities.length" class="activity-list">
        <view v-for="item in activities" :key="item.id || item._id" class="activity-card" @tap="openActivity(item)">
          <view class="activity-cover" :style="{ background: item.color || '#69574A' }"><image v-if="item.cover" :src="item.cover" mode="aspectFit" /><text v-else>MM</text></view>
          <view class="activity-copy"><view class="activity-meta"><text>{{ item.tag || '平台活动' }}</text><text>{{ item.end || '持续开放' }}</text></view><text class="activity-title">{{ item.title }}</text><text class="activity-desc">{{ item.desc || item.subtitle }}</text></view>
          <text class="activity-arrow">→</text>
        </view>
      </view>
      <view v-else class="empty-card">暂时没有可报名活动，后续会在这里更新。</view>
    </view>
    <view style="height: 120rpx" />
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'

useNavTitle('titles.information')
const loading = ref(true)
const news = ref([])
const activities = ref([])

async function load() {
  loading.value = true
  const [bannerResult, activityResult] = await Promise.allSettled([bridge.banner.list(), bridge.campaign.list()])
  const newsData = bannerResult.status === 'fulfilled' ? bannerResult.value : []
  news.value = (Array.isArray(newsData) ? newsData : newsData?.list || []).filter((item) => item.status !== 'disabled')
  const activityData = activityResult.status === 'fulfilled' ? activityResult.value : []
  activities.value = Array.isArray(activityData) ? activityData.filter((item) => item.status !== 'disabled') : Array.isArray(activityData?.list) ? activityData.list : []
  loading.value = false
}

function newsTag(item) { return ({ demand: '需求观察', publish: '平台动态', zone: '合作专题', resource: '资料更新', product: '服务资讯' }[item?.type] || '行业动态') }
function openNews(item) {
  if (item?.type === 'publish') return uni.navigateTo({ url: '/pages/demand/publish' })
  if (item?.type === 'demand') return uni.switchTab({ url: '/pages/demand/list' })
  if (item?.type === 'zone') return uni.navigateTo({ url: '/pages/campaign/index' })
  if (item?.type === 'resource') return uni.navigateTo({ url: '/pages/resource/list' })
  uni.showToast({ title: '内容正在整理中', icon: 'none' })
}
function openActivity(item) {
  if (item?.id || item?._id) uni.navigateTo({ url: `/pages/campaign/index?id=${encodeURIComponent(item.id || item._id)}` })
}

onMounted(load)
</script>

<style scoped lang="scss">
.page { box-sizing: border-box; min-height: 100vh; padding: 28rpx 34rpx 0; color: #25231f; background: #f7f6f2; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 30rpx; border-bottom: 1rpx solid rgba(30,27,22,.1); }
.eyebrow, .section-kicker { display: block; color: #8a847b; font: 500 14rpx/1.2 ui-monospace, monospace; letter-spacing: .12em; }
.page-title { display: block; margin-top: 18rpx; color: #191816; font: 400 45rpx/1.15 'Songti SC', serif; }
.page-desc { display: block; margin-top: 9rpx; color: #8a847b; font-size: 18rpx; }
.header-index { color: #b49460; font: 500 14rpx/1 ui-monospace, monospace; letter-spacing: .1em; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 38rpx; padding-bottom: 17rpx; border-bottom: 1rpx solid rgba(30,27,22,.1); }
.section-title { display: block; margin-top: 9rpx; color: #302b26; font: 400 30rpx/1.2 'Songti SC', serif; }
.section-count { color: #8a847b; font-size: 17rpx; }
.news-card, .activity-card { display: flex; align-items: flex-start; gap: 16rpx; padding: 22rpx 0; border-bottom: 1rpx solid rgba(30,27,22,.09); }
.news-index { flex: 0 0 30rpx; color: #b49460; font: 500 17rpx/1.2 Georgia, serif; }
.news-copy, .activity-copy { min-width: 0; flex: 1; }
.news-tag { display: block; color: #8a847b; font-size: 16rpx; }
.news-title { display: block; margin-top: 8rpx; color: #302b26; font: 500 24rpx/1.4 'Songti SC', serif; }
.news-summary { display: block; margin-top: 7rpx; overflow: hidden; color: #8a847b; font-size: 18rpx; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.news-arrow, .activity-arrow { flex: 0 0 auto; color: #5c2828; font-size: 26rpx; }
.activity-heading { margin-top: 48rpx; }
.activity-card { align-items: center; gap: 14rpx; }
.activity-cover { display: flex; width: 76rpx; height: 76rpx; flex: 0 0 76rpx; align-items: center; justify-content: center; color: #fcfbf8; }
.activity-cover image { width: 38rpx; height: 38rpx; filter: brightness(0) invert(1); opacity: .85; }
.activity-cover text { font: 500 19rpx/1 Georgia, serif; letter-spacing: .12em; }
.activity-meta { display: flex; justify-content: space-between; color: #8a847b; font-size: 16rpx; }
.activity-title { display: block; margin-top: 8rpx; color: #302b26; font-size: 22rpx; font-weight: 600; }
.activity-desc { display: block; margin-top: 6rpx; overflow: hidden; color: #8a847b; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }
.state-card, .empty-card { display: flex; align-items: center; justify-content: center; min-height: 180rpx; gap: 12rpx; color: #8a847b; font-size: 18rpx; }
.loading-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #b49460; animation: pulse 1s ease-in-out infinite; }
.empty-card { padding: 30rpx 0; border-bottom: 1rpx solid rgba(30,27,22,.09); }
@keyframes pulse { 50% { opacity: .35; transform: scale(.72); } }
@media (prefers-reduced-motion: reduce) { .loading-dot { animation: none; } }
@media (max-width: 420px) { .page { padding-right: 28rpx; padding-left: 28rpx; }.page-title { font-size: 41rpx; } }
</style>
