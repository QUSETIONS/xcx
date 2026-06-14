<template>
  <view class="demand-page">
    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-box glass-card" @tap="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-hint">{{ keyword || '搜索需求' }}</text>
      </view>
      <view class="filter-bar">
        <view class="filter-item" :class="{ active: currentCat }" @tap="showCatPicker = true">
          <text>{{ currentCatName || '分类' }}</text>
          <text class="filter-arrow">▾</text>
        </view>
        <view class="filter-item" :class="{ active: currentSort !== 'latest' }" @tap="showSortPicker = true">
          <text>{{ sortLabel }}</text>
          <text class="filter-arrow">▾</text>
        </view>
      </view>
    </view>

    <!-- 列表 -->
    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="demand-list">
        <view class="demand-item glass-card" v-for="item in demandList" :key="item._id" @tap="goDetail(item._id)">
          <!-- 顶部标签 -->
          <view class="item-top">
            <view class="ui-tag ui-tag--primary"><text>{{ item.category_name }}</text></view>
            <view class="ui-tag ui-tag--accent"><text>{{ formatQuote(item.quote_type) }}</text></view>
          </view>

          <!-- 标题 -->
          <text class="item-title">{{ item.title }}</text>

          <!-- 公司信息 -->
          <view class="item-company-row">
            <text class="item-company">{{ item.company_name }}</text>
            <text class="item-region">{{ item.region }}</text>
          </view>

          <!-- 数据指标 -->
          <view class="item-stats">
            <view class="stat-item">
              <text class="stat-val">{{ item.view_count }}</text>
              <text class="stat-label">浏览</text>
            </view>
            <view class="stat-divider" />
            <view class="stat-item">
              <text class="stat-val">{{ item.lead_count }}</text>
              <text class="stat-label">对接</text>
            </view>
            <view class="stat-divider" />
            <view class="stat-item">
              <text class="stat-val">{{ item.favorite_count }}</text>
              <text class="stat-label">收藏</text>
            </view>
          </view>

          <!-- 热度进度条 -->
          <view class="heat-bar-wrap">
            <view class="heat-bar" :style="{ background: getHeatGradient(item) }">
              <view class="heat-fill" :style="{ width: getHeat(item) + '%' }" />
            </view>
            <text class="heat-label">{{ getHeatLevel(item) }}</text>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading-state"><text>加载中...</text></view>
      <view v-if="noMore && demandList.length" class="end-state"><text>— 已加载全部 —</text></view>
      <view v-if="!demandList.length && !loading" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无相关需求</text>
      </view>
    </scroll-view>

    <!-- 分类选择器 -->
    <view v-if="showCatPicker" class="picker-mask" @tap="showCatPicker = false">
      <view class="picker-panel glass-card-strong" @tap.stop>
        <text class="picker-title">选择分类</text>
        <view class="picker-options">
          <view class="picker-opt" :class="{ active: !currentCat }" @tap="selectCat(null)"><text>全部</text></view>
          <view class="picker-opt" :class="{ active: currentCat === cat.id }" v-for="cat in categories" :key="cat.id" @tap="selectCat(cat.id)"><text>{{ cat.icon }} {{ cat.name }}</text></view>
        </view>
      </view>
    </view>

    <!-- 排序选择器 -->
    <view v-if="showSortPicker" class="picker-mask" @tap="showSortPicker = false">
      <view class="picker-panel glass-card-strong" @tap.stop>
        <text class="picker-title">排序方式</text>
        <view class="picker-options">
          <view class="picker-opt" :class="{ active: currentSort === s.value }" v-for="s in sortOptions" :key="s.value" @tap="selectSort(s.value)"><text>{{ s.label }}</text></view>
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
const quoteTypes = QUOTE_TYPES

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

function formatQuote(type) { return quoteTypes.find(q => q.value === type)?.label || '面议' }
function getHeat(item) { return Math.min(100, Math.round((item.view_count / 5000) * 100)) }
function getHeatLevel(item) { const h = getHeat(item); if (h > 80) return '🔥 热门'; if (h > 50) return '⚡ 活跃'; return '📝 新发' }
function getHeatGradient(item) { const h = getHeat(item); if (h > 80) return 'rgba(239,68,68,0.15)'; if (h > 50) return 'rgba(245,158,11,0.15)'; return 'rgba(255,255,255,0.05)' }

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

<style lang="scss" scoped>
.demand-page { min-height: 100vh; background: $bg-primary; padding-bottom: 140rpx; }

.search-section { padding: $space-3 $space-4; }
.search-box { display: flex; align-items: center; gap: $space-2; padding: $space-3 $space-4; margin-bottom: $space-2; }
.search-icon { font-size: 28rpx; }
.search-hint { font-size: $font-base; color: $text-placeholder; }
.filter-bar { display: flex; gap: $space-2; }
.filter-item { display: flex; align-items: center; gap: 6rpx; padding: 10rpx 20rpx; background: $glass-bg; border: 1rpx solid $glass-border; border-radius: $radius-md; font-size: $font-sm; color: $text-secondary; }
.filter-item.active { background: rgba(255,107,53,0.12); border-color: rgba(255,107,53,0.20); color: $color-primary; }
.filter-arrow { font-size: 16rpx; color: $text-tertiary; }

.list-scroll { height: calc(100vh - 200rpx); }
.demand-list { padding: $space-2 $space-4; display: flex; flex-direction: column; gap: $space-3; }
.demand-item { padding: $space-4; }

.item-top { display: flex; gap: $space-2; margin-bottom: $space-2; }
.item-title { font-size: $font-md; font-weight: $weight-bold; color: $text-primary; display: block; margin-bottom: $space-2; line-height: 1.4; }
.item-company-row { display: flex; justify-content: space-between; margin-bottom: $space-3; }
.item-company { font-size: $font-sm; color: $text-secondary; }
.item-region { font-size: $font-xs; color: $text-tertiary; }

.item-stats { display: flex; align-items: center; gap: $space-2; margin-bottom: $space-3; padding: $space-2 0; border-top: 1rpx solid $border-color; border-bottom: 1rpx solid $border-color; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-val { font-size: $font-lg; font-weight: $weight-bold; color: $text-primary; }
.stat-label { font-size: $font-xs; color: $text-tertiary; }
.stat-divider { width: 1rpx; height: 40rpx; background: $border-color; }

.heat-bar-wrap { display: flex; align-items: center; gap: $space-2; }
.heat-bar { height: 6rpx; flex: 1; border-radius: 3rpx; position: relative; }
.heat-fill { position: absolute; left: 0; top: 0; height: 100%; background: $gradient-primary; border-radius: 3rpx; }
.heat-label { font-size: $font-xs; color: $color-primary; font-weight: $weight-medium; }

.loading-state, .end-state { text-align: center; padding: $space-6; font-size: $font-sm; color: $text-tertiary; }
.empty-state { text-align: center; padding: $space-10; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: $space-3; }
.empty-text { font-size: $font-md; color: $text-tertiary; }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: $z-modal; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: $space-5; border-radius: $radius-xl $radius-xl 0 0; }
.picker-title { font-size: $font-lg; font-weight: $weight-bold; color: $text-primary; display: block; margin-bottom: $space-4; }
.picker-options { display: flex; flex-wrap: wrap; gap: $space-2; }
.picker-opt { padding: 14rpx 32rpx; background: $glass-bg; border: 1rpx solid $glass-border; border-radius: $radius-md; font-size: $font-sm; color: $text-secondary; }
.picker-opt.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: $color-primary; }
</style>