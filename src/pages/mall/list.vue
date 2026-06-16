<template>
  <view class="page">
    <view class="header">
      <text class="header-title">{{ t('mall.title') }}</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-row">
      <view class="search-box" :class="{ focused: searchFocused }">
        <image class="search-icon" src="/static/icons/search.svg" mode="aspectFit"/>
        <input class="search-input" v-model="keyword" placeholder="搜索商品" @confirm="doSearch" @focus="searchFocused = true" @blur="searchFocused = false"/>
        <text class="search-clear" v-if="keyword" @tap="clearSearch">✕</text>
      </view>
      <text class="search-btn" @tap="doSearch">搜索</text>
    </view>

    <!-- 热门搜索 -->
    <view class="hot-tags" v-if="!keyword && searchHistory.length">
      <text class="hot-title">搜索历史</text>
      <view class="tags-wrap">
        <text class="hot-tag" v-for="(h, i) in searchHistory.slice(0, 5)" :key="i" @tap="useHistory(h)">{{ h }}</text>
      </view>
    </view>

    <!-- 分类 -->
    <scroll-view scroll-x class="cat-scroll">
      <view class="cat-list">
        <view class="cat-item card-press" :class="{ active: !currentType }" @tap="selectType(null)"><text>全部</text></view>
        <view class="cat-item card-press" :class="{ active: currentType === t }" v-for="(label, t) in serviceTypes" :key="t" @tap="selectType(t)">
          <text>{{ label }}</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">

      <!-- 骨架屏 -->
      <view class="skeleton-grid" v-if="loading && !productList.length">
        <view class="skeleton-item" v-for="i in 4" :key="i">
          <view class="skeleton-icon"/>
          <view class="skeleton-title"/>
          <view class="skeleton-price"/>
        </view>
      </view>

      <view class="product-grid" :class="{ 'animate-in': animated }" v-else>
        <view class="product-item card-press" v-for="(item, idx) in productList" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.06) + 's' }">
          <view class="product-icon-box" :class="'type-' + item.service_type">
            <image class="product-icon" :src="'/static/icons/service/' + item.service_type + '.svg'" mode="aspectFit"/>
          </view>
          <text class="product-title">{{ item.title }}</text>
          <text class="product-type">{{ serviceTypes[item.service_type] }}</text>
          <view class="price-row">
            <text class="price-current">¥{{ (item.price / 100).toFixed(0) }}</text>
            <text class="price-market">¥{{ (item.market_price / 100).toFixed(0) }}</text>
          </view>
          <view class="sales-tag"><text>{{ item.sale_count }}人已购</text></view>
        </view>
      </view>

      <view v-if="loading && productList.length" class="loading"><text>加载中...</text></view>
      <view v-if="noMore && productList.length" class="end"><text>— 已加载全部 —</text></view>
      <view v-if="!productList.length && !loading" class="empty">
        <text class="empty-icon">🛒</text>
        <text class="empty-text">暂无商品</text>
        <text class="empty-hint" v-if="keyword" @tap="clearSearch">清空搜索</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { SERVICE_TYPES } from '@/config/constants'
import { productService } from '@/mock/service'
import { t } from '@/i18n'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.mall')

const serviceTypes = SERVICE_TYPES
const currentType = ref(null)
const keyword = ref('')
const searchFocused = ref(false)
const searchHistory = ref([])
const productList = ref([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const animated = ref(false)

onMounted(() => {
  loadHistory()
  loadList(true)
})

function loadHistory() {
  try { searchHistory.value = JSON.parse(uni.getStorageSync('mall_search_history') || '[]') } catch {}
}
function saveHistory(k) {
  if (!k.trim()) return
  const list = [k, ...searchHistory.value.filter(h => h !== k)].slice(0, 5)
  searchHistory.value = list
  uni.setStorageSync('mall_search_history', JSON.stringify(list))
}

function loadList(reset = false) {
  if (reset) { page.value = 1; noMore.value = false }
  loading.value = true
  try {
    let res = productService.list({ page: page.value, pageSize: 10, service_type: currentType.value })
    // 关键词过滤
    if (keyword.value) {
      const kw = keyword.value.toLowerCase()
      res.list = res.list.filter(p => p.title.toLowerCase().includes(kw) || serviceTypes[p.service_type]?.toLowerCase().includes(kw))
    }
    productList.value = reset ? res.list : [...productList.value, ...res.list]
    noMore.value = res.list.length < 10
  } finally { loading.value = false; refreshing.value = false }
}

function loadMore() { if (!loading.value && !noMore.value) { page.value++; loadList() } }
function onRefresh() { refreshing.value = true; loadList(true) }
function selectType(t) { currentType.value = t; loadList(true) }
function goDetail(id) { uni.navigateTo({ url: `/pages/mall/detail?id=${id}` }) }

function doSearch() { saveHistory(keyword.value); loadList(true) }
function clearSearch() { keyword.value = ''; loadList(true) }
function useHistory(h) { keyword.value = h; doSearch() }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }

.header { padding: 24rpx 24rpx 8rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.search-row { display: flex; align-items: center; margin: 8rpx 24rpx 12rpx; }
.search-box { flex: 1; display: flex; align-items: center; background: #FFFFFF; border-radius: 24rpx; padding: 16rpx 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.search-box.focused { border: 2rpx solid #FF6B35; }
.search-icon { width: 24rpx; height: 24rpx; }
.search-input { flex: 1; font-size: 28rpx; color: rgba(0,0,0,0.85); margin: 0 12rpx; }
.search-clear { font-size: 24rpx; color: rgba(0,0,0,0.4); padding: 4rpx; }
.search-btn text { font-size: 28rpx; color: #FF6B35; }

.hot-tags { margin: 0 24rpx 12rpx; }
.hot-title { font-size: 24rpx; color: rgba(0,0,0,0.5); margin-bottom: 8rpx; display: block; }
.tags-wrap { display: flex; flex-wrap: wrap; }
.hot-tag { font-size: 22rpx; color: rgba(0,0,0,0.6); background: #FFFFFF; padding: 8rpx 16rpx; border-radius: 16rpx; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04); }

.cat-scroll { padding: 0 24rpx 16rpx; }
.cat-list { display: flex; }
.cat-item { padding: 10rpx 24rpx; background: #FFFFFF; border-radius: 24rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); white-space: nowrap; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.cat-item.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

.list-scroll { height: calc(100vh - 200rpx); padding: 0 24rpx; }

.skeleton-grid { display: flex; flex-wrap: wrap; }
.skeleton-item { width: calc(50% - 6rpx); background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; }
.skeleton-icon { width: 72rpx; height: 72rpx; background: #F5F6FA; border-radius: 18rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-title { width: 80%; height: 28rpx; background: #F5F6FA; border-radius: 8rpx; margin-bottom: 8rpx; animation: pulse 1.5s infinite; }
.skeleton-price { width: 50%; height: 24rpx; background: #F5F6FA; border-radius: 8rpx; animation: pulse 1.5s infinite; }

.product-grid { display: flex; flex-wrap: wrap; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.product-item { width: calc(50% - 6rpx); background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.product-icon-box { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; }
.type-member { background: rgba(255,107,53,0.1); }
.type-linker { background: rgba(99,102,241,0.1); }
.type-survey { background: rgba(16,185,129,0.1); }
.type-resource_pack { background: rgba(245,158,11,0.1); }
.type-certification { background: rgba(236,72,153,0.1); }
.product-icon { width: 36rpx; height: 36rpx; }

.product-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.product-type { font-size: 22rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 12rpx; }
.price-row { display: flex; align-items: baseline; margin-bottom: 8rpx; }
.price-current { font-size: 32rpx; font-weight: bold; color: #FF6B35; }
.price-market { font-size: 22rpx; color: rgba(0,0,0,0.4); text-decoration: line-through; }
.sales-tag { background: rgba(16,185,129,0.1); border-radius: 8rpx; padding: 4rpx 12rpx; display: inline-flex; }
.sales-tag text { font-size: 20rpx; color: #10B981; }

.loading, .end { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }
.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-hint { font-size: 24rpx; color: #FF6B35; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
</style>