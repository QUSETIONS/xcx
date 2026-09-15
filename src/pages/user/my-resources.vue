<template>
  <view class="page">
    <view class="hero">
      <view>
        <text class="eyebrow">我的资料</text>
        <text class="title">把看过的内容，留在手边</text>
        <text class="desc">已购买、下载和收藏的资料都会在这里汇总</text>
      </view>
      <view class="hero-icon">▤</view>
    </view>

    <view class="stats-card">
      <view class="stat-item"><text class="stat-value">{{ stats.purchased }}</text><text class="stat-label">已解锁</text></view>
      <view class="stat-item"><text class="stat-value">{{ stats.downloaded }}</text><text class="stat-label">已下载</text></view>
      <view class="stat-item"><text class="stat-value">{{ stats.favorites }}</text><text class="stat-label">已收藏</text></view>
    </view>

    <scroll-view scroll-x class="tabs-scroll">
      <view class="tabs">
        <view v-for="tab in tabs" :key="tab.value" class="tab" :class="{ active: mode === tab.value }" @tap="selectMode(tab.value)">
          <text>{{ tab.label }}</text>
          <text v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading" class="state"><text>正在整理你的资料…</text></view>
      <view v-else-if="error" class="state error" @tap="load">加载失败，点击重试</view>
      <view v-else-if="!list.length" class="state empty">
        <text class="empty-icon">▤</text>
        <text class="empty-title">{{ emptyTitle }}</text>
        <text class="empty-desc">去资料库挑一份现在用得上的内容</text>
        <view class="browse-btn" @tap="goLibrary">打开资料库</view>
      </view>
      <view v-else class="resource-list">
        <view v-for="item in list" :key="item._id" class="resource-card" @tap="goDetail(item._id)">
          <view class="file-badge" :class="fileClass(item.file_type)"><text>{{ fileLabel(item.file_type) }}</text></view>
          <view class="resource-content">
            <view class="title-row"><text class="resource-title">{{ item.title }}</text><text v-if="item.is_favorited" class="saved">已收藏</text></view>
            <text class="resource-summary">{{ item.summary || '暂无摘要' }}</text>
            <view class="meta-row"><text>{{ item.category_name || '未分类' }}</text><text>{{ item.file_type || '在线资料' }} · {{ item.file_size || '—' }}</text></view>
            <view class="status-row"><text v-if="item.is_purchased" class="status purchased">已解锁</text><text v-if="item.downloaded_at" class="status downloaded">已下载</text><text v-if="item.is_favorited" class="status favorite">收藏</text></view>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.myResources')

const userStore = useUserStore()
const mode = ref('all')
const list = ref([])
const loading = ref(false)
const refreshing = ref(false)
const error = ref(false)
const stats = ref({ purchased: 0, downloaded: 0, favorites: 0 })

const tabs = computed(() => [
  { value: 'all', label: '全部', count: stats.value.purchased + stats.value.downloaded + stats.value.favorites ? undefined : 0 },
  { value: 'purchased', label: '已解锁', count: stats.value.purchased },
  { value: 'downloaded', label: '已下载', count: stats.value.downloaded },
  { value: 'favorites', label: '收藏', count: stats.value.favorites }
])
const emptyTitle = computed(() => ({ purchased: '还没有已解锁的资料', downloaded: '还没有下载记录', favorites: '还没有收藏资料' })[mode.value] || '资料夹还是空的')

async function load() {
  if (!(await ensureSession())) return
  loading.value = true
  error.value = false
  try {
    const [overview, result] = await Promise.all([
      bridge.resource.overview(),
      bridge.resource.my({ mode: mode.value, page: 1, pageSize: 50 })
    ])
    stats.value = overview?.mine_stats || { purchased: 0, downloaded: 0, favorites: 0 }
    list.value = result?.list || []
  } catch (cause) {
    error.value = true
    console.warn('[my-resources] load failed', cause)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

async function ensureSession() {
  if (userStore.isLoggedIn) return true
  const ok = await userStore.ensureLogin()
  if (!ok) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/user/login' }), 250)
    return false
  }
  return true
}

function selectMode(value) { if (mode.value !== value) { mode.value = value; load() } }
function onRefresh() { refreshing.value = true; load() }
function goLibrary() { uni.navigateTo({ url: '/pages/resource/list' }) }
function goDetail(id) { uni.navigateTo({ url: `/pages/resource/detail?id=${id}` }) }
function fileLabel(type) { return String(type || 'FILE').toUpperCase().slice(0, 4) }
function fileClass(type) { return `file-${String(type || 'file').toLowerCase()}` }

onMounted(load)
onShow(() => { if (list.value.length) load() })
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; padding: 24rpx 24rpx 80rpx; color: #303B57; background: #F5F7FB; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.hero { display: flex; align-items: center; justify-content: space-between; padding: 26rpx 24rpx; border-radius: 24rpx; background: linear-gradient(135deg, #27345F, #6877D9); color: #fff; box-shadow: 0 16rpx 34rpx rgba(54, 70, 138, .16); }
.eyebrow { display: block; color: #BFC9FF; font-size: 18rpx; letter-spacing: .12em; }.title { display: block; margin-top: 10rpx; font-size: 34rpx; font-weight: 750; }.desc { display: block; margin-top: 8rpx; color: #D5DAF5; font-size: 20rpx; }.hero-icon { display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; border: 1rpx solid rgba(255,255,255,.22); border-radius: 22rpx; color: #FFF; font-size: 42rpx; }
.stats-card { display: flex; margin: 18rpx 0; padding: 20rpx 8rpx; border: 1rpx solid #E7EBF3; border-radius: 20rpx; background: #FFF; }.stat-item { flex: 1; text-align: center; border-right: 1rpx solid #EEF1F5; }.stat-item:last-child { border-right: 0; }.stat-value { display: block; color: #303B57; font-size: 33rpx; font-weight: 750; }.stat-label { display: block; margin-top: 5rpx; color: #98A4B7; font-size: 19rpx; }
.tabs-scroll { margin: 2rpx -24rpx 16rpx; }.tabs { display: flex; padding: 0 24rpx; }.tab { display: flex; align-items: center; flex: 0 0 auto; margin-right: 10rpx; padding: 10rpx 18rpx; border: 1rpx solid #E5E9F1; border-radius: 12rpx; color: #7F8CA2; background: #FFF; font-size: 21rpx; }.tab.active { border-color: #BFC7FF; color: #5968D8; background: #EEF0FF; font-weight: 700; }.tab-count { margin-left: 6rpx; color: inherit; font-size: 18rpx; opacity: .75; }
.list-scroll { flex: 1; min-height: 0; height: auto; }.resource-card { display: flex; align-items: flex-start; margin-bottom: 12rpx; padding: 18rpx; border: 1rpx solid #E7EBF3; border-radius: 20rpx; background: #FFF; box-shadow: 0 7rpx 20rpx rgba(70,87,123,.035); }.file-badge { display: flex; align-items: center; justify-content: center; flex: 0 0 76rpx; width: 76rpx; height: 76rpx; margin-right: 16rpx; border-radius: 20rpx; color: #3C63CF; background: #EAF0FF; font-size: 18rpx; font-weight: 800; }.file-pdf { color: #D85F59; background: #FFF0EF; }.file-docx { color: #3C63CF; background: #EAF0FF; }.file-pptx { color: #C98227; background: #FFF5DF; }.file-xlsx { color: #2D9A6D; background: #E7F8F0; }.resource-content { flex: 1; min-width: 0; }.title-row { display: flex; align-items: center; }.resource-title { flex: 1; overflow: hidden; color: #46536D; font-size: 25rpx; font-weight: 720; text-overflow: ellipsis; white-space: nowrap; }.saved { flex: 0 0 auto; margin-left: 8rpx; color: #6573DC; font-size: 17rpx; }.resource-summary { display: -webkit-box; overflow: hidden; margin-top: 8rpx; color: #8D99AC; font-size: 20rpx; line-height: 1.45; text-overflow: ellipsis; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.meta-row { display: flex; justify-content: space-between; margin-top: 10rpx; color: #A0AABD; font-size: 17rpx; }.status-row { display: flex; margin-top: 10rpx; }.status { margin-right: 8rpx; padding: 4rpx 8rpx; border-radius: 7rpx; font-size: 17rpx; }.purchased { color: #2D9A6D; background: #E7F8F0; }.downloaded { color: #5968D8; background: #EEF0FF; }.favorite { color: #C98227; background: #FFF5DF; }.arrow { align-self: center; margin-left: 8rpx; color: #B1BACC; font-size: 36rpx; }
.state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 42vh; color: #9AA6B8; font-size: 23rpx; }.state.error { color: #D9685D; }.empty-icon { margin-bottom: 18rpx; color: #AFB9E9; font-size: 70rpx; }.empty-title { color: #66738A; font-size: 27rpx; font-weight: 700; }.empty-desc { margin-top: 8rpx; color: #A0AABD; font-size: 20rpx; }.browse-btn { margin-top: 22rpx; padding: 12rpx 22rpx; border-radius: 12rpx; color: #FFF; background: #6573DC; font-size: 21rpx; }

/* 资料页的摘要和元信息共享可变列，长标题不会把右侧图标推出卡片。 */
.hero,
.stats-card,
.stat-item,
.resource-card,
.title-row,
.meta-row { min-width: 0; }
.hero > view:first-child,
.resource-content { flex: 1; min-width: 0; overflow: hidden; }
.hero-icon,
.file-badge,
.saved,
.arrow { flex: 0 0 auto; }
.title,
.desc,
.resource-title,
.resource-summary,
.meta-row > text { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.title,
.desc,
.resource-title,
.meta-row > text { white-space: nowrap; }
.resource-summary { overflow-wrap: anywhere; word-break: break-word; }
.meta-row > text { min-width: 0; }
.meta-row > text:first-child { flex: 1; }
.meta-row > text:last-child { flex: 0 1 55%; text-align: right; }

@media (max-width: 360px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .resource-card { padding-right: 14rpx; padding-left: 14rpx; }
  .file-badge { flex-basis: 64rpx; width: 64rpx; height: 64rpx; margin-right: 12rpx; }
  .hero { padding-right: 16rpx; padding-left: 16rpx; }
}
</style>
