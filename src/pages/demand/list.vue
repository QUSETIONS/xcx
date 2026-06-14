<template>
  <view class="demand-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-wrap">
        <text class="search-icon">🔍</text>
        <input class="search-input" v-model="keyword" placeholder="搜索需求" confirm-type="search" @confirm="onSearch" />
        <text v-if="keyword" class="search-clear" @tap="keyword = ''; onSearch()">✕</text>
      </view>
    </view>

    <!-- 分类横向滚动 -->
    <scroll-view scroll-x class="cat-scroll">
      <view class="cat-list">
        <view class="cat-item" :class="{ active: !currentCat }" @tap="selectCat(null)">
          <text>全部</text>
        </view>
        <view class="cat-item" :class="{ active: currentCat === cat.id }" v-for="cat in categories" :key="cat.id" @tap="selectCat(cat.id)">
          <text>{{ cat.icon }} {{ cat.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 筛选条 -->
    <view class="filter-row">
      <view class="filter-item" :class="{ active: currentRegion }" @tap="showPicker('region')">
        <text>{{ currentRegion || '地区' }}</text>
        <text class="filter-arrow">▾</text>
      </view>
      <view class="filter-item" :class="{ active: currentSort !== 'latest' }" @tap="showPicker('sort')">
        <text>{{ sortLabel }}</text>
        <text class="filter-arrow">▾</text>
      </view>
      <view class="filter-item" :class="{ active: currentQuote }" @tap="showPicker('quote')">
        <text>{{ quoteLabel }}</text>
        <text class="filter-arrow">▾</text>
      </view>
      <view v-if="hasFilter" class="filter-clear" @tap="clearFilter">
        <text>清除</text>
      </view>
    </view>

    <!-- 筛选结果 -->
    <view v-if="hasFilter && demandList.length" class="filter-result">
      <text>找到 {{ demandList.length }} 条相关需求</text>
    </view>

    <!-- 列表 -->
    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="demandList.length === 0 && !loading" class="empty">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无相关需求</text>
      </view>

      <view class="demand-item" v-for="item in demandList" :key="item._id" @tap="goDetail(item._id)">
        <!-- 置顶标签 -->
        <view v-if="item.is_top" class="top-tag">
          <text>置顶</text>
        </view>
        <view class="item-header">
          <text class="item-company">{{ item.company_name }}</text>
          <text class="item-region">{{ item.region }}</text>
        </view>
        <text class="item-title">{{ item.title }}</text>
        <view class="item-tags">
          <text class="tag tag-cat">{{ item.category_name }}</text>
          <text class="tag tag-quote">{{ formatQuote(item.quote_type) }}</text>
          <text v-if="item.quote_type === 'self'" class="tag tag-budget">¥{{ (item.budget_min / 100).toFixed(0) }}-{{ (item.budget_max / 100).toFixed(0) }}</text>
        </view>
        <view class="item-footer">
          <text class="item-time">{{ formatTime(item.publish_time) }}</text>
          <text class="item-views">{{ item.view_count }}浏览</text>
          <text class="item-leads">{{ item.lead_count }}人对接</text>
        </view>
      </view>

      <view v-if="loading" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-if="noMore && demandList.length" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 筛选弹窗 -->
    <view v-if="pickerVisible" class="picker-mask" @tap="pickerVisible = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header">
          <text>{{ pickerTitle }}</text>
          <text class="picker-close" @tap="pickerVisible = false">✕</text>
        </view>
        <view class="picker-options">
          <view class="picker-option" :class="{ active: isPickerActive(opt) }" v-for="opt in pickerOptions" :key="opt.value" @tap="onPickerSelect(opt)">
            <text>{{ opt.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { DEMAND_CATEGORIES, REGIONS, QUOTE_TYPES } from '@/config/constants'
import { demandService } from '@/mock/service'

const categories = DEMAND_CATEGORIES
const keyword = ref('')
const currentCat = ref(null)
const currentRegion = ref('')
const currentSort = ref('latest')
const currentQuote = ref('')

const demandList = ref([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)

const pickerVisible = ref(false)
const pickerType = ref('')
const pickerOptions = ref([])
const pickerTitle = ref('')

const sortOptions = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '最多浏览' }
]

const sortLabel = computed(() => sortOptions.find(s => s.value === currentSort.value)?.label || '排序')
const quoteLabel = computed(() => currentQuote.value ? QUOTE_TYPES.find(q => q.value === currentQuote.value)?.label : '报价')
const hasFilter = computed(() => keyword.value || currentCat.value || currentRegion.value || currentQuote.value)

function formatQuote(type) { return QUOTE_TYPES.find(q => q.value === type)?.label || '面议' }
function formatTime(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }

async function loadList(reset = false) {
  if (reset) { page.value = 1; noMore.value = false }
  if (noMore.value && !reset) return
  loading.value = true
  try {
    const res = demandService.list({
      page: page.value, pageSize: 10, sort: currentSort.value,
      keyword: keyword.value, category_id: currentCat.value,
      region: currentRegion.value, quote_type: currentQuote.value
    })
    demandList.value = reset ? res.list : [...demandList.value, ...res.list]
    noMore.value = res.list.length < 10
  } finally { loading.value = false; refreshing.value = false }
}

function loadMore() { if (!loading.value && !noMore.value) { page.value++; loadList() } }
function onRefresh() { refreshing.value = true; loadList(true) }
function onSearch() { loadList(true) }

function selectCat(id) { currentCat.value = id; loadList(true) }

function showPicker(type) {
  pickerType.value = type
  if (type === 'region') {
    pickerTitle.value = '选择地区'
    pickerOptions.value = REGIONS.map(r => ({ value: r, label: r }))
  } else if (type === 'sort') {
    pickerTitle.value = '排序方式'
    pickerOptions.value = sortOptions
  } else if (type === 'quote') {
    pickerTitle.value = '报价方式'
    pickerOptions.value = [{ value: '', label: '全部' }, ...QUOTE_TYPES]
  }
  pickerVisible.value = true
}

function isPickerActive(opt) {
  if (pickerType.value === 'region') return currentRegion.value === opt.value
  if (pickerType.value === 'sort') return currentSort.value === opt.value
  if (pickerType.value === 'quote') return currentQuote.value === opt.value
  return false
}

function onPickerSelect(opt) {
  if (pickerType.value === 'region') currentRegion.value = opt.value
  else if (pickerType.value === 'sort') currentSort.value = opt.value
  else if (pickerType.value === 'quote') currentQuote.value = opt.value
  pickerVisible.value = false
  loadList(true)
}

function clearFilter() {
  keyword.value = ''; currentCat.value = null; currentRegion.value = ''; currentQuote.value = ''
  loadList(true)
}

function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }

// 初始加载
loadList(true)
</script>

<style lang="scss" scoped>
.demand-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 120rpx; }

.search-bar { padding: 16rpx 24rpx; background: #fff; }
.search-wrap { display: flex; align-items: center; gap: 12rpx; background: #f5f5f5; border-radius: 36rpx; padding: 16rpx 24rpx; }
.search-icon { font-size: 28rpx; }
.search-input { flex: 1; font-size: 28rpx; height: 40rpx; }
.search-clear { font-size: 28rpx; color: #999; padding: 4rpx 8rpx; }

.cat-scroll { background: #fff; padding: 16rpx 0; }
.cat-list { display: inline-flex; gap: 8rpx; padding: 0 24rpx; white-space: nowrap; }
.cat-item { padding: 10rpx 24rpx; border-radius: 28rpx; font-size: 24rpx; color: #666; background: #f5f5f5; flex-shrink: 0; }
.cat-item.active { background: #FF6B3518; color: #FF6B35; font-weight: 600; }

.filter-row { display: flex; align-items: center; padding: 16rpx 24rpx; gap: 24rpx; background: #fff; border-top: 1rpx solid #f0f0f0; }
.filter-item { display: flex; align-items: center; font-size: 24rpx; color: #666; gap: 4rpx; }
.filter-item.active { color: #FF6B35; font-weight: 600; }
.filter-arrow { font-size: 18rpx; color: #ccc; }
.filter-clear { font-size: 24rpx; color: #999; margin-left: auto; }

.filter-result { padding: 12rpx 24rpx; background: #FF6B3508; }
.filter-result text { font-size: 22rpx; color: #FF6B35; }

.list-scroll { height: calc(100vh - 320rpx); }

.demand-item { background: #fff; border-radius: 24rpx; padding: 24rpx; margin: 16rpx 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); position: relative; }
.top-tag { position: absolute; top: 0; right: 24rpx; background: #FF6B35; color: #fff; font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 0 0 12rpx 12rpx; }

.item-header { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.item-company { font-size: 24rpx; color: #666; }
.item-region { font-size: 22rpx; color: #999; background: #f5f5f5; padding: 4rpx 12rpx; border-radius: 8rpx; }
.item-title { font-size: 30rpx; font-weight: 600; color: #333; display: block; margin-bottom: 12rpx; line-height: 1.5; }

.item-tags { display: flex; gap: 8rpx; margin-bottom: 12rpx; }
.tag { font-size: 20rpx; padding: 4rpx 14rpx; border-radius: 6rpx; }
.tag-cat { color: #1890FF; background: #1890FF10; }
.tag-quote { color: #FF6B35; background: #FF6B3510; }
.tag-budget { color: #52C41A; background: #52C41A10; }

.item-footer { display: flex; gap: 20rpx; }
.item-time, .item-views, .item-leads { font-size: 22rpx; color: #bbb; }

.empty { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }

.loading-more, .no-more { text-align: center; padding: 20rpx; font-size: 24rpx; color: #ccc; }

/* 弹窗 */
.picker-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 32rpx; max-height: 60vh; }
.picker-header { display: flex; justify-content: space-between; margin-bottom: 24rpx; font-size: 32rpx; font-weight: 600; }
.picker-close { color: #999; padding: 4rpx; }
.picker-options { display: flex; flex-wrap: wrap; gap: 16rpx; }
.picker-option { padding: 14rpx 32rpx; border-radius: 28rpx; font-size: 28rpx; background: #f5f5f5; color: #666; }
.picker-option.active { background: #FF6B3518; color: #FF6B35; font-weight: 600; }
</style>