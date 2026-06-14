<template>
  <view class="page">
    <view class="header">
      <view class="search-box" @tap="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-hint">{{ keyword || '搜索需求' }}</text>
      </view>
      <view class="filter-bar">
        <view class="filter-item" :class="{ active: currentCat }" @tap="showCatPicker = true">
          <text>{{ currentCatName || '分类' }}</text>
        </view>
        <view class="filter-item" :class="{ active: currentSort !== 'latest' }" @tap="showSortPicker = true">
          <text>{{ sortLabel }}</text>
        </view>
      </view>
    </view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="demand-list">
        <view class="demand-item" v-for="item in demandList" :key="item._id" @tap="goDetail(item._id)">
          <view class="item-top">
            <text class="item-cat">{{ item.category_name }}</text>
            <text class="item-quote">{{ formatQuote(item.quote_type) }}</text>
          </view>
          <text class="item-title">{{ item.title }}</text>
          <view class="item-meta">
            <text class="item-company">{{ item.company_name }}</text>
            <text class="item-region">{{ item.region }}</text>
          </view>
          <view class="item-stats">
            <text>👁 {{ item.view_count }}</text>
            <text>🤝 {{ item.lead_count }}</text>
            <text>❤️ {{ item.favorite_count }}</text>
          </view>
        </view>
      </view>
      <view v-if="loading" class="loading"><text>加载中...</text></view>
      <view v-if="noMore && demandList.length" class="end"><text>— 已加载全部 —</text></view>
      <view v-if="!demandList.length && !loading" class="empty">
        <text class="empty-icon">📭</text>
        <text>暂无相关需求</text>
      </view>
    </scroll-view>

    <view v-if="showCatPicker" class="picker-mask" @tap="showCatPicker = false">
      <view class="picker-panel" @tap.stop>
        <text class="picker-title">选择分类</text>
        <view class="picker-options">
          <view class="picker-opt" :class="{ active: !currentCat }" @tap="selectCat(null)"><text>全部</text></view>
          <view class="picker-opt" :class="{ active: currentCat === cat.id }" v-for="cat in categories" :key="cat.id" @tap="selectCat(cat.id)">
            <text>{{ cat.icon }} {{ cat.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showSortPicker" class="picker-mask" @tap="showSortPicker = false">
      <view class="picker-panel" @tap.stop>
        <text class="picker-title">排序方式</text>
        <view class="picker-options">
          <view class="picker-opt" :class="{ active: currentSort === s.value }" v-for="s in sortOptions" :key="s.value" @tap="selectSort(s.value)">
            <text>{{ s.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { DEMAND_CATEGORIES, QUOTE_TYPES } from '@/config/constants'
import { demandService } from '@/mock/service'

const categories = DEMAND_CATEGORIES
const sortOptions = [{ value: 'latest', label: '最新发布' }, { value: 'hot', label: '热度优先' }]
const keyword = ref('')
const currentCat = ref(null)
const currentSort = ref('latest')
const currentCatName = computed(() => categories.find(c => c.id === currentCat.value)?.name || '')
const sortLabel = computed(() => sortOptions.find(s => s.value === currentSort.value)?.label || '排序')

const demandList = ref([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const showCatPicker = ref(false)
const showSortPicker = ref(false)

function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }

function loadList(reset = false) {
  if (reset) { page.value = 1; noMore.value = false }
  loading.value = true
  try {
    const res = demandService.list({ page: page.value, pageSize: 10, sort: currentSort.value, category_id: currentCat.value })
    demandList.value = reset ? res.list : [...demandList.value, ...res.list]
    noMore.value = res.list.length < 10
  } finally { loading.value = false; refreshing.value = false }
}

function loadMore() { if (!loading.value && !noMore.value) { page.value++; loadList() } }
function onRefresh() { refreshing.value = true; loadList(true) }
function goSearch() { uni.showToast({ title: '搜索功能开发中', icon: 'none' }) }
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function selectCat(id) { currentCat.value = id; showCatPicker.value = false; loadList(true) }
function selectSort(v) { currentSort.value = v; showSortPicker.value = false; loadList(true) }

loadList(true)
</script>

<style lang="scss">
.page { min-height: 100vh; background: #0A0A0F; padding-bottom: 120rpx; }
.header { padding: 16rpx 24rpx; }
.search-box { display: flex; align-items: center; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 24rpx; padding: 20rpx 24rpx; margin-bottom: 16rpx; }
.search-icon { font-size: 28rpx; }
.search-hint { font-size: 28rpx; color: rgba(255,255,255,0.35); margin-left: 12rpx; }
.filter-bar { display: flex; gap: 12rpx; }
.filter-item { padding: 10rpx 20rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; font-size: 24rpx; color: rgba(255,255,255,0.65); }
.filter-item.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.2); color: #FF6B35; }

.list-scroll { height: calc(100vh - 180rpx); padding: 0 24rpx; }
.demand-list { display: flex; flex-direction: column; gap: 12rpx; }
.demand-item { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 20rpx; }
.item-top { display: flex; gap: 8rpx; margin-bottom: 12rpx; }
.item-cat { font-size: 20rpx; color: #FF9A5C; background: rgba(255,107,53,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.item-quote { font-size: 20rpx; color: #F472B6; background: rgba(236,72,153,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.item-title { font-size: 30rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 12rpx; line-height: 1.4; }
.item-meta { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.item-company { font-size: 24rpx; color: rgba(255,255,255,0.65); }
.item-region { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.item-stats { display: flex; gap: 16rpx; }
.item-stats text { font-size: 22rpx; color: rgba(255,255,255,0.5); }

.loading, .end { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(255,255,255,0.5); }
.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 400; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #1A1A26; border-radius: 32rpx 32rpx 0 0; }
.picker-title { font-size: 32rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 24rpx; }
.picker-options { display: flex; flex-wrap: wrap; gap: 12rpx; }
.picker-opt { padding: 14rpx 32rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; font-size: 26rpx; color: rgba(255,255,255,0.65); }
.picker-opt.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.2); color: #FF6B35; }
</style>