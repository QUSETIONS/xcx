<template>
  <view class="page">
    <view class="header">
      <text class="header-title">需求大厅</text>
      <view class="header-actions">
        <view class="search-btn" @tap="goSearch"><image class="icon-sm" src="/static/icons/search.svg" mode="aspectFit"/></view>
      </view>
    </view>

    <view class="search-row">
      <view class="search-box" :class="{ focused: searchFocused }">
        <image class="search-icon" src="/static/icons/search.svg" mode="aspectFit"/>
        <input class="search-input" v-model="keyword" placeholder="搜索需求" @confirm="doSearch" @focus="searchFocused = true" @blur="searchFocused = false" />
        <text class="search-clear" v-if="keyword" @tap="clearSearch">✕</text>
      </view>
      <text class="search-btn" @tap="doSearch">搜索</text>
    </view>

    <view class="filter-bar">
      <view class="filter-item" :class="{ active: currentCat }" @tap="showCatPicker = true">
        <text>{{ currentCatName || '分类' }}</text>
        <text class="filter-arrow">▾</text>
      </view>
      <view class="filter-item" :class="{ active: currentRegion }" @tap="showRegionPicker = true">
        <text>{{ currentRegion || '地区' }}</text>
        <text class="filter-arrow">▾</text>
      </view>
      <view class="filter-item" :class="{ active: currentSort !== 'latest' }" @tap="showSortPicker = true">
        <text>{{ sortLabel }}</text>
      </view>
    </view>

    <!-- 热门标签 -->
    <view class="recommend-tags" v-if="!keyword && demandList.length">
      <text class="recommend-title">热门搜索</text>
      <view class="tags-wrap">
        <text class="hot-tag" v-for="t in hotKeywords" :key="t" @tap="searchTag(t)">{{ t }}</text>
      </view>
    </view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">

      <!-- 搜索历史 -->
      <view class="search-history" v-if="!demandList.length && !loading && searchHistory.length">
        <text class="history-title">搜索历史</text>
        <view class="history-tags">
          <text class="history-tag" v-for="(h, i) in searchHistory" :key="i" @tap="useHistory(h)">{{ h }}</text>
        </view>
      </view>

      <!-- 骨架屏 -->
      <view class="skeleton-list" v-if="loading && !demandList.length">
        <view class="skeleton-item" v-for="i in 4" :key="i">
          <view class="skeleton-tags"/>
          <view class="skeleton-title"/>
          <view class="skeleton-meta"/>
        </view>
      </view>

      <!-- 列表 -->
      <view class="demand-list" v-else :class="{ 'animate-in': animated }">
        <view class="demand-item card-press" v-for="(item, idx) in demandList" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="item-top">
            <view class="item-cat-tag">{{ item.category_name }}</view>
            <view class="item-quote-tag">{{ formatQuote(item.quote_type) }}</view>
            <text class="item-time">{{ formatTime(item.publish_time) }}</text>
          </view>
          <text class="item-title">{{ item.title }}</text>
          <view class="item-company-row">
            <text class="item-company">{{ item.company_name }}</text>
            <text class="item-region">{{ item.region }}</text>
          </view>
          <view class="item-bottom">
            <view class="item-stats">
              <view class="stat-box card-press"><text class="stat-val">{{ formatCount(item.view_count) }}</text><text class="stat-label">浏览</text></view>
              <view class="stat-box card-press"><text class="stat-val">{{ item.lead_count }}</text><text class="stat-label">对接</text></view>
              <view class="stat-box card-press"><text class="stat-val">{{ item.favorite_count }}</text><text class="stat-label">收藏</text></view>
            </view>
            <view class="heat-indicator" :class="getHeatClass(item)">
              <text>{{ getHeatLevel(item) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading && demandList.length" class="loading"><text>加载中...</text></view>
      <view v-if="noMore && demandList.length" class="end"><text>— 已加载全部 —</text></view>
      <view v-if="!demandList.length && !loading" class="empty">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无相关需求</text>
        <text class="empty-hint" @tap="resetFilter">清空筛选</text>
      </view>
    </scroll-view>

    <!-- 分类选择 -->
    <view v-if="showCatPicker" class="picker-mask" @tap="showCatPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>选择分类</text><text class="picker-close" @tap="showCatPicker = false">✕</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !currentCat }" @tap="selectCat(null)"><text>全部</text></view>
          <view class="picker-opt" :class="{ active: currentCat === cat.id }" v-for="cat in categories" :key="cat.id" @tap="selectCat(cat.id)">
            <text>{{ cat.icon }} {{ cat.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 地区选择 -->
    <view v-if="showRegionPicker" class="picker-mask" @tap="showRegionPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>选择地区</text><text class="picker-close" @tap="showRegionPicker = false">✕</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !currentRegion }" @tap="selectRegion(null)"><text>全部</text></view>
          <view class="picker-opt" :class="{ active: currentRegion === r }" v-for="r in regions" :key="r" @tap="selectRegion(r)"><text>{{ r }}</text></view>
        </view>
      </view>
    </view>

    <!-- 排序选择 -->
    <view v-if="showSortPicker" class="picker-mask" @tap="showSortPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>排序方式</text><text class="picker-close" @tap="showSortPicker = false">✕</text></view>
        <view class="picker-list">
          <view class="picker-opt" :class="{ active: currentSort === s.value }" v-for="s in sortOptions" :key="s.value" @tap="selectSort(s.value)">
            <text>{{ s.icon }} {{ s.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DEMAND_CATEGORIES, REGIONS, QUOTE_TYPES } from '@/config/constants'
import { demandService } from '@/mock/service'

const categories = DEMAND_CATEGORIES
const regions = REGIONS
const sortOptions = [
  { value: 'latest', label: '最新发布', icon: '🕐' },
  { value: 'hot', label: '热度优先', icon: '🔥' },
  { value: 'lead', label: '对接最多', icon: '🤝' }
]

const keyword = ref('')
const searchFocused = ref(false)
const searchHistory = ref([])
const hotKeywords = ['短视频运营', '品牌营销', '私域流量', '达人合作', '活动策划']

const currentCat = ref(null)
const currentRegion = ref(null)
const currentSort = ref('latest')
const currentCatName = computed(() => categories.find(c => c.id === currentCat.value)?.name || '')
const sortLabel = computed(() => sortOptions.find(s => s.value === currentSort.value)?.label || '排序')

const demandList = ref([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const animated = ref(false)
const showCatPicker = ref(false)
const showRegionPicker = ref(false)
const showSortPicker = ref(false)

onMounted(() => {
  loadHistory()
  loadList(true)
})

function loadHistory() {
  try { searchHistory.value = JSON.parse(uni.getStorageSync('demand_search_history') || '[]').slice(0, 5) } catch {}
}
function saveHistory(k) {
  if (!k.trim()) return
  const list = [k, ...searchHistory.value.filter(h => h !== k)].slice(0, 5)
  searchHistory.value = list
  uni.setStorageSync('demand_search_history', JSON.stringify(list))
}

function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }
function formatTime(t) { if (!t) return ''; const diff = (Date.now() - new Date(t).getTime()) / 3600000; if (diff < 1) return '刚刚'; if (diff < 24) return Math.floor(diff) + '小时前'; return Math.floor(diff / 24) + '天前' }
function formatCount(n) { if (n >= 10000) return (n/10000).toFixed(1) + 'w'; if (n >= 1000) return (n/1000).toFixed(1) + 'k'; return n }
function getHeatClass(item) { const h = item.view_count + item.lead_count * 5; if (h > 500) return 'heat-hot'; if (h > 200) return 'heat-medium'; return 'heat-normal' }
function getHeatLevel(item) { const h = item.view_count + item.lead_count * 5; if (h > 500) return '🔥 爆'; if (h > 200) return '⚡ 热'; return '✓ 新' }

function loadList(reset = false) {
  if (reset) { page.value = 1; noMore.value = false }
  loading.value = true
  try {
    let res = demandService.list({
      page: page.value, pageSize: 10,
      sort: currentSort.value,
      category_id: currentCat.value,
      region: currentRegion.value,
      keyword: keyword.value
    })
    if (currentSort.value === 'hot') {
      res.list.sort((a, b) => (b.view_count + b.lead_count * 10) - (a.view_count + a.lead_count * 10))
    }
    demandList.value = reset ? res.list : [...demandList.value, ...res.list]
    noMore.value = res.list.length < 10
  } finally { loading.value = false; refreshing.value = false }
}

function loadMore() { if (!loading.value && !noMore.value) { page.value++; loadList() } }
function onRefresh() { refreshing.value = true; loadList(true) }
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }

function doSearch() { saveHistory(keyword.value); loadList(true) }
function clearSearch() { keyword.value = ''; loadList(true) }
function useHistory(h) { keyword.value = h; doSearch() }
function searchTag(t) { keyword.value = t; doSearch() }
function resetFilter() { currentCat.value = null; currentRegion.value = null; keyword.value = ''; loadList(true) }
function goSearch() { uni.showToast({ title: '请使用上方搜索框', icon: 'none' }) }

function selectCat(id) { currentCat.value = id; showCatPicker.value = false; loadList(true) }
function selectRegion(r) { currentRegion.value = r; showRegionPicker.value = false; loadList(true) }
function selectSort(v) { currentSort.value = v; showSortPicker.value = false; loadList(true) }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }

.header { padding: 24rpx 24rpx 8rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.header-actions { display: flex; }
.search-btn { width: 48rpx; height: 48rpx; }
.icon-sm { width: 28rpx; height: 28rpx; }

.search-row { display: flex; align-items: center; margin: 8rpx 24rpx 12rpx; }
.search-box { flex: 1; display: flex; align-items: center; background: #FFFFFF; border-radius: 24rpx; padding: 16rpx 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.search-box.focused { border: 2rpx solid #FF6B35; }
.search-icon { width: 24rpx; height: 24rpx; }
.search-input { flex: 1; font-size: 28rpx; color: rgba(0,0,0,0.85); margin: 0 12rpx; }
.search-clear { font-size: 24rpx; color: rgba(0,0,0,0.4); padding: 4rpx; }
.search-btn text { font-size: 28rpx; color: #FF6B35; }

.filter-bar { display: flex; margin-bottom: 12rpx; padding: 0 24rpx; }
.filter-item { display: flex; align-items: center; padding: 10rpx 20rpx; background: #FFFFFF; border-radius: 20rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-item.active { background: rgba(255,107,53,0.1); color: #FF6B35; }
.filter-arrow { font-size: 16rpx; }

.recommend-tags { margin: 0 24rpx 12rpx; }
.recommend-title { font-size: 24rpx; color: rgba(0,0,0,0.5); margin-bottom: 8rpx; display: block; }
.tags-wrap { display: flex; flex-wrap: wrap; }
.hot-tag { font-size: 22rpx; color: rgba(0,0,0,0.6); background: #FFFFFF; padding: 8rpx 16rpx; border-radius: 16rpx; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04); }

.search-history { padding: 16rpx 24rpx; }
.history-title { font-size: 24rpx; color: rgba(0,0,0,0.5); margin-bottom: 12rpx; display: block; }
.history-tags { display: flex; flex-wrap: wrap; }
.history-tag { font-size: 24rpx; color: rgba(0,0,0,0.6); background: #FFFFFF; padding: 10rpx 20rpx; border-radius: 20rpx; }

.skeleton-list { display: flex; flex-direction: column; padding: 0 24rpx; }
.skeleton-item { background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; }
.skeleton-tags { width: 120rpx; height: 24rpx; background: #F0F1F5; border-radius: 8rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-title { width: 80%; height: 30rpx; background: #F0F1F5; border-radius: 8rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-meta { width: 60%; height: 24rpx; background: #F0F1F5; border-radius: 8rpx; animation: pulse 1.5s infinite; }

.list-scroll { height: calc(100vh - 220rpx); padding: 0 24rpx; }

.demand-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.demand-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.item-top { display: flex; align-items: center; margin-bottom: 12rpx; }
.item-cat-tag { font-size: 20rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; }
.item-quote-tag { font-size: 20rpx; color: #6366F1; background: rgba(99,102,241,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; }
.item-time { font-size: 20rpx; color: rgba(0,0,0,0.4); margin-left: auto; }
.item-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; line-height: 1.4; }
.item-company-row { display: flex; justify-content: space-between; margin-bottom: 16rpx; }
.item-company { font-size: 24rpx; color: rgba(0,0,0,0.6); }
.item-region { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.item-bottom { display: flex; justify-content: space-between; align-items: center; }
.item-stats { display: flex; }
.stat-box { display: flex; flex-direction: column; align-items: center; }
.stat-val { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.stat-label { font-size: 18rpx; color: rgba(0,0,0,0.4); }
.heat-indicator { padding: 6rpx 14rpx; border-radius: 12rpx; }
.heat-hot { background: rgba(239,68,68,0.1); }
.heat-hot text { font-size: 20rpx; color: #EF4444; font-weight: bold; }
.heat-medium { background: rgba(245,158,11,0.1); }
.heat-medium text { font-size: 20rpx; color: #F59E0B; font-weight: bold; }
.heat-normal { background: rgba(16,185,129,0.1); }
.heat-normal text { font-size: 20rpx; color: #10B981; font-weight: bold; }

.loading, .end { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }
.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.6); display: block; margin-bottom: 16rpx; }
.empty-hint { font-size: 24rpx; color: #FF6B35; }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 400; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { display: flex; justify-content: space-between; margin-bottom: 24rpx; font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.picker-close { color: rgba(0,0,0,0.4); padding: 4rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-list { display: flex; flex-direction: column; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
</style>