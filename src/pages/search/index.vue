<template>
  <view v-if="pageState === 'loading'" class="page-state">
    <text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="pageState === 'error'" class="page-state error-state" @tap="reload">
    <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>{{ t('common.loadFailed') }}</text>
    <text class="page-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="page search-page">
    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <image class="search-icon" src="/static/icons/search.svg" mode="aspectFit" />
        <input class="search-input" v-model="keyword" :placeholder="placeholder" confirm-type="search" @confirm="doSearch" :focus="true" />
        <text class="clear-btn" v-if="keyword" @tap="clearKeyword">✕</text>
      </view>
      <text class="search-btn" @tap="doSearch">{{ t('common.search') }}</text>
    </view>

    <!-- 搜索结果 -->
    <view v-if="searched" class="result-section">
      <view v-if="searchState === 'loading'" class="searching-state"><text>{{ t('common.loading') }}</text></view>
      <view class="result-summary">
        <text>{{ t('search.resultCount').replace('{total}', result.total) }}</text>
      </view>

      <block v-if="result.total">
        <!-- 需求结果 -->
        <view v-if="result.demands.length" class="result-group">
          <text class="group-title">{{ t('search.groupDemand') }} · {{ result.demands.length }}</text>
          <view class="result-item card-press" v-for="item in result.demands" :key="item._id" @tap="goDemand(item._id)">
            <text class="ri-title">{{ item.title }}</text>
            <view class="ri-meta">
              <text class="ri-tag">{{ categoryName(item.category_id, item.category_name) }}</text>
              <text class="ri-stat">{{ item.view_count }} 次浏览 · {{ item.lead_count }} 次响应</text>
            </view>
          </view>
        </view>

        <!-- 服务结果 -->
        <view v-if="result.products.length" class="result-group">
          <text class="group-title">{{ t('search.groupService') }} · {{ result.products.length }}</text>
          <view class="result-item card-press" v-for="item in result.products" :key="item._id" @tap="goProduct(item._id)">
            <view class="ri-row">
              <text class="ri-title">{{ item.title }}</text>
              <text class="ri-price">¥{{ (item.price / 100).toFixed(0) }}</text>
            </view>
            <text class="ri-stat">{{ t('search.sales') }} {{ item.sale_count }}</text>
          </view>
        </view>

        <!-- 帖子结果 -->
        <view v-if="result.posts.length" class="result-group">
          <text class="group-title">{{ t('search.groupCommunity') }} · {{ result.posts.length }}</text>
          <view class="result-item card-press" v-for="item in result.posts" :key="item._id" @tap="goPost(item._id)">
            <text class="ri-content">{{ item.content.slice(0, 50) }}...</text>
            <text class="ri-stat">{{ item.like_count }} 次赞同 · {{ item.comment_count }} 条讨论</text>
          </view>
        </view>
      </block>

      <view v-else class="empty-result">
        <image class="empty-icon" src="/static/icons/search.svg" mode="aspectFit" />
        <text class="empty-text">{{ t('search.noResult').replace('{kw}', searchedKeyword) }}</text>
      </view>
    </view>

    <!-- 搜索引导（未搜索时） -->
    <view v-else>
      <!-- 搜索历史 -->
      <view v-if="history.length" class="suggest-section">
        <view class="suggest-header">
          <text class="suggest-title">{{ t('listPage.searchHistory') }}</text>
          <text class="suggest-clear" @tap="clearHistory">{{ t('search.clear') }}</text>
        </view>
        <view class="tag-list">
          <view class="tag-item" v-for="(h, i) in history" :key="i" @tap="quickSearch(h)"><text>{{ h }}</text></view>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view class="suggest-section">
        <text class="suggest-title">{{ t('listPage.hotSearch') }}</text>
        <view class="hot-list">
          <view class="hot-item" v-for="(k, i) in hotKeywords" :key="i" @tap="quickSearch(k)">
            <text class="hot-rank" :class="'r' + (i < 3 ? i + 1 : 'n')">{{ i + 1 }}</text>
            <text class="hot-text">{{ k }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { debounce } from '@/utils/util'
import { useNavTitle } from '@/hooks/useNavTitle'
import { categoryName } from '@/utils/i18n-maps'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
useNavTitle('titles.search')

const keyword = ref('')
const searched = ref(false)
const searchedKeyword = ref('')
const placeholder = t('search.placeholder')
const history = ref([])
const hotKeywords = ref([])
const result = ref({ demands: [], products: [], posts: [], total: 0 })

const { state: pageState, run: loadRequest } = useRequest(async () => {
  const [nextHistory, nextHotKeywords] = await Promise.all([
    bridge.search.history(),
    bridge.search.hotKeywords()
  ])
  return { history: nextHistory, hotKeywords: nextHotKeywords }
})
const { state: searchState, run: searchRequest } = useRequest(async (kw) => {
  await bridge.search.addHistory(kw)
  const [nextHistory, nextResult] = await Promise.all([
    bridge.search.history(),
    bridge.search.search(kw)
  ])
  return { history: nextHistory, result: nextResult }
})
const { run: clearHistoryRequest } = useRequest(() => bridge.search.clearHistory())

async function reload() {
  try {
    const data = await loadRequest()
    history.value = data.history || []
    hotKeywords.value = data.hotKeywords || []
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

async function runSearch(kw) {
  const data = await searchRequest(kw)
  history.value = data.history || []
  result.value = data.result || { demands: [], products: [], posts: [], total: 0 }
  return data
}

// 输入防抖：用户停止输入 400ms 后自动搜索（已搜索状态下）
const debouncedSearch = debounce(() => {
  if (searched.value && keyword.value.trim()) doSearch()
}, 400)
watch(keyword, () => { debouncedSearch() })

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) { uni.showToast({ title: t('search.enterKeyword'), icon: 'none' }); return }
  searched.value = true
  searchedKeyword.value = kw
  try {
    await runSearch(kw)
  } catch {
    toastError(t('common.loadFailed'))
  }
}

function quickSearch(kw) {
  keyword.value = kw
  doSearch()
}

function clearKeyword() {
  keyword.value = ''
  searched.value = false
  result.value = { demands: [], products: [], posts: [], total: 0 }
}

async function clearHistory() {
  try {
    await clearHistoryRequest()
    history.value = []
  } catch {
    toastError(t('common.loadFailed'))
  }
}

function goDemand(id) { uni.navigateTo({ url: '/pages/demand/detail?id=' + id }) }
function goProduct(id) { uni.navigateTo({ url: '/pages/mall/detail?id=' + id }) }
function goPost(id) { uni.navigateTo({ url: '/pages/community/detail?id=' + id }) }
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { font-size: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }
.searching-state { padding: 24rpx 0; text-align: center; color: rgba(0,0,0,0.45); }

.search-bar { display: flex; align-items: center; padding: 16rpx 24rpx; background: #FFFFFF; }
.search-input-wrap { flex: 1; display: flex; align-items: center; background: #F5F6FA; border-radius: 32rpx; padding: 12rpx 24rpx; }
.search-icon { display: inline-flex; align-items: center; justify-content: center; width: 30rpx; height: 30rpx; flex: 0 0 30rpx; margin-right: 12rpx; font-size: 24rpx; line-height: 1; text-align: center; }
.search-input { flex: 1; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.clear-btn { font-size: 28rpx; color: rgba(0,0,0,0.3); padding: 4rpx 8rpx; }
.search-btn { font-size: 28rpx; color: #FF6B35; font-weight: bold; padding-left: 20rpx; }

.result-section { padding: 16rpx 24rpx; }
.result-summary { font-size: 24rpx; color: rgba(0,0,0,0.4); margin-bottom: 16rpx; }
.result-group { margin-bottom: 24rpx; }
.group-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.result-item { background: #FFFFFF; border-radius: 12rpx; padding: 20rpx; margin-bottom: 12rpx; }
.ri-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 8rpx; }
.ri-content { font-size: 26rpx; color: rgba(0,0,0,0.7); display: block; margin-bottom: 8rpx; line-height: 1.5; }
.ri-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.ri-price { font-size: 28rpx; font-weight: bold; color: #FF6B35; }
.ri-meta { display: flex; align-items: center; }
.ri-tag { font-size: 20rpx; color: #6366F1; background: rgba(99,102,241,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 12rpx; }
.ri-stat { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.empty-result { display: flex; flex-direction: column; align-items: center; padding: 120rpx; }
.empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; margin-bottom: 16rpx; font-size: 42rpx; line-height: 1; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.4); }

.suggest-section { padding: 24rpx; }
.suggest-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.suggest-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.suggest-clear { font-size: 24rpx; color: rgba(0,0,0,0.4); }

.tag-list { display: flex; flex-wrap: wrap; }
.tag-item { background: #FFFFFF; border-radius: 24rpx; padding: 12rpx 24rpx; margin: 0 12rpx 12rpx 0; }
.tag-item text { font-size: 26rpx; color: rgba(0,0,0,0.7); }

.hot-list { display: flex; flex-direction: column; }
.hot-item { display: flex; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #F0F1F5; }
.hot-item:last-child { border-bottom: none; }
.hot-rank { width: 40rpx; font-size: 28rpx; font-weight: bold; text-align: center; }
.hot-rank.r1 { color: #FF6B35; }
.hot-rank.r2 { color: #FF9A5C; }
.hot-rank.r3 { color: #F59E0B; }
.hot-rank.rn { color: rgba(0,0,0,0.3); }
.hot-text { font-size: 28rpx; color: rgba(0,0,0,0.8); }

/* 搜索页所有横向行都显式声明可收缩，长标题/关键词只在自己的内容列内处理。 */
.search-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.search-bar, .search-input-wrap, .result-section, .result-item, .ri-row, .ri-meta,
.suggest-header, .hot-item { min-width: 0; max-width: 100%; }
.search-input-wrap { overflow: hidden; }
.search-input { min-width: 0; }
.clear-btn, .search-btn, .ri-price, .ri-tag, .hot-rank { flex: 0 0 auto; white-space: nowrap; }
.search-btn { overflow: hidden; text-overflow: ellipsis; }
.result-item { box-sizing: border-box; }
.ri-title, .ri-content, .ri-meta, .hot-text, .empty-text { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.ri-title, .ri-content, .hot-text { overflow: hidden; }
.ri-title, .hot-text { text-overflow: ellipsis; white-space: nowrap; }
.ri-meta { overflow: hidden; }
.ri-tag { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.hot-text { min-width: 0; flex: 1; }

@media (max-width: 420px) {
  .search-bar { padding-right: 16rpx; padding-left: 16rpx; }
  .search-input-wrap { padding-right: 16rpx; padding-left: 16rpx; }
  .search-btn { padding-left: 14rpx; font-size: 25rpx; }
  .result-section, .suggest-section { padding-right: 16rpx; padding-left: 16rpx; }
  .result-item { padding: 16rpx; }
}
</style>
