<template>
  <view class="page demand-page" :style="a11yStyle">
    <view class="header">
      <view>
        <text class="header-eyebrow">找合作</text>
        <text class="header-title">{{ t('demand.hall') }}</text>
      </view>
      <view class="header-actions">
        <view class="header-action" @tap="goPublish"><image class="icon-sm" src="/static/icons/plus.svg" mode="aspectFit"/><text>发布</text></view>
      </view>
    </view>

    <view class="search-row">
      <view class="search-box" :class="{ focused: searchFocused }">
        <image class="search-icon" src="/static/icons/search.svg" mode="aspectFit"/>
        <input class="search-input" v-model="keyword" :placeholder="t('demand.searchPlaceholder')" @confirm="doSearch" @focus="searchFocused = true" @blur="searchFocused = false" />
        <text class="search-clear" v-if="keyword" @tap="clearSearch">✕</text>
      </view>
      <text class="search-btn" @tap="doSearch">{{ t('common.search') }}</text>
    </view>

    <view class="list-intro">
      <view><text class="intro-kicker">OPEN BRIEFS</text><text class="intro-title">找到项目下一步需要的资源</text><text class="intro-desc">资金、客户、渠道、供应链和专业服务，都从明确需求开始</text></view>
      <view class="intro-live"><text class="live-dot" />{{ demandList.length ? `已读取 ${demandList.length} 条` : '实时更新' }}</view>
    </view>

    <scroll-view class="intent-scroll" scroll-x show-scrollbar="false">
      <view class="intent-row">
        <text class="intent-label">合作目的</text>
        <text v-for="intent in collaborationIntents" :key="intent.keyword" class="intent-chip" :class="{ active: keyword === intent.keyword }" @tap="selectIntent(intent)">{{ intent.label }}</text>
      </view>
    </scroll-view>

    <view class="filter-bar">
      <view class="filter-item" :class="{ active: currentCat }" @tap="showCatPicker = true">
        <text>{{ currentCatName || t('demand.category') }}</text>
        <text class="filter-arrow">▾</text>
      </view>
      <view class="filter-item" :class="{ active: currentRegion }" @tap="showRegionPicker = true">
        <text>{{ regionName(currentRegion) || t('demand.region') }}</text>
        <text class="filter-arrow">▾</text>
      </view>
      <view class="filter-item" :class="{ active: currentQuoteType }" @tap="showQuotePicker = true">
        <text>{{ quoteFilterLabel }}</text>
        <text class="filter-arrow">▾</text>
      </view>
      <view class="filter-item" :class="{ active: currentSort !== 'latest' }" @tap="showSortPicker = true">
        <text>{{ sortLabel }}</text>
      </view>
    </view>

    <!-- 热门标签 -->
    <view class="recommend-tags" v-if="!keyword && demandList.length && hotKeywords.length">
      <text class="recommend-title">{{ t('listPage.hotSearch') }}</text>
      <view class="tags-wrap">
        <text class="hot-tag" v-for="t in hotKeywords" :key="t" @tap="searchTag(t)">{{ t }}</text>
      </view>
    </view>

    <view class="saved-toolbar">
      <view class="saved-toolbar-copy"><text class="saved-toolbar-title">保存这组筛选</text><text class="saved-toolbar-desc">下次直接检查有没有新需求</text></view>
      <text class="saved-toolbar-action" @tap="saveCurrentSearch">保存当前</text>
      <text class="saved-toolbar-action muted" @tap="toggleSavedSearches">已保存 {{ savedSearches.length }}</text>
    </view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">

      <view v-if="showSavedSearches" class="saved-panel">
        <view class="saved-panel-head"><view><text class="saved-panel-title">我的筛选</text><text class="saved-panel-desc">点“检查新需求”，只会把上次检查后出现的机会标出来</text></view><text class="saved-panel-close" @tap="showSavedSearches = false">收起</text></view>
        <view v-if="savedSearchesLoading" class="saved-panel-empty">正在读取已保存的筛选…</view>
        <view v-else-if="!savedSearches.length" class="saved-panel-empty">还没有保存筛选，先设置关键词或条件吧。</view>
        <view v-else class="saved-list">
          <view v-for="saved in savedSearches" :key="saved.id || saved._id" class="saved-item">
            <view class="saved-item-copy" @tap="applySavedSearch(saved)"><text class="saved-item-name">{{ saved.name }}</text><text class="saved-item-meta">{{ savedSearchSummary(saved) }}</text></view>
            <view class="saved-item-actions"><text class="saved-check" @tap="checkSavedSearch(saved)">{{ savedActionLabel(saved) }}</text><text class="saved-delete" @tap="removeSavedSearch(saved)">删除</text></view>
          </view>
        </view>
      </view>

      <!-- 搜索历史 -->
      <view class="search-history" v-if="!demandList.length && !loading && searchHistory.length">
        <text class="history-title">{{ t('listPage.searchHistory') }}</text>
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

      <view v-else-if="listError && !demandList.length" class="list-error" @tap="retryList">
        <text class="error-icon">↻</text>
        <text class="error-title">暂时没加载出来</text>
        <text class="error-action">点一下重试</text>
      </view>

      <!-- 列表 -->
      <view class="demand-list" v-else :class="{ 'animate-in': animated }">
        <view class="demand-item card-press" v-for="(item, idx) in demandList" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="item-top">
            <view class="item-origin">
              <view class="company-mark" :class="'brand-' + (idx % 4)">{{ getCompanyInitial(item) }}</view>
              <view class="origin-copy"><text class="item-company">{{ companyName(item.company_name) }}</text><text class="item-region">{{ regionName(item.region) }} · {{ formatTime(item.publish_time) }}</text></view>
            </view>
            <view class="match-badge"><text>{{ Number(item.lead_count || 0) }}</text><text>次响应</text></view>
          </view>
          <text class="item-title">{{ item.title }}</text>
          <view class="item-tag-row">
            <view class="item-cat-tag">{{ categoryName(item.category_id, item.category_name) }}</view>
            <view class="item-quote-tag">{{ formatQuote(item.quote_type) }}</view>
            <text class="item-time">更新于 {{ formatTime(item.publish_time) }}</text>
          </view>
          <view class="item-bottom">
            <view class="item-stats">
              <view class="stat-box card-press"><text class="stat-val">{{ formatCount(item.view_count) }}</text><text class="stat-label">{{ t('demandDetail.views') }}</text></view>
              <view class="stat-box card-press"><text class="stat-val">{{ item.lead_count }}</text><text class="stat-label">{{ t('demandDetail.leads') }}</text></view>
              <view class="stat-box card-press"><text class="stat-val">{{ item.favorite_count }}</text><text class="stat-label">{{ t('demandDetail.favorites') }}</text></view>
            </view>
            <view class="heat-indicator" :class="getHeatClass(item)">
              <text>{{ getHeatLevel(item) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="listError && demandList.length" class="inline-error" @tap="retryList">加载下一页失败，点此重试</view>
      <view v-if="loading && demandList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="noMore && demandList.length" class="end"><text>— {{ t('listPage.noMore') }} —</text></view>
      <view v-if="!demandList.length && !loading && !listError" class="empty">
        <view class="empty-icon"><image src="/static/icons/tab/list.svg" mode="aspectFit" /></view>
        <text class="empty-text">{{ t('listPage.emptyDemand') }}</text>
        <text class="empty-hint" @tap="resetFilter">{{ t('listPage.clearFilter') }}</text>
      </view>
    </scroll-view>

    <view class="publish-fab card-press" @tap="goPublish"><image src="/static/icons/plus.svg" mode="aspectFit" /><text>发布需求</text></view>

    <!-- 分类选择 -->
    <view v-if="showCatPicker" class="picker-mask" @tap="showCatPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('listPage.selectCategory') }}</text><text class="picker-close" @tap="showCatPicker = false">✕</text></view>
        <text class="picker-group-label">市场与专业服务</text>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !currentCat }" @tap="selectCat(null)"><text>{{ t('common.all') }}</text></view>
          <view class="picker-opt" :class="{ active: currentCat === categoryId(cat) }" v-for="cat in mediaCategories" :key="categoryId(cat)" @tap="selectCat(categoryId(cat))">
            <text>{{ categoryName(categoryId(cat), cat.name) }}</text>
          </view>
        </view>
        <text class="picker-group-label industry">产业与技术合作</text>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: currentCat === categoryId(cat) }" v-for="cat in industryCategories" :key="categoryId(cat)" @tap="selectCat(categoryId(cat))">
            <text>{{ categoryName(categoryId(cat), cat.name) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 地区选择 -->
    <view v-if="showRegionPicker" class="picker-mask" @tap="showRegionPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('listPage.selectRegion') }}</text><text class="picker-close" @tap="showRegionPicker = false">✕</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !currentRegion }" @tap="selectRegion(null)"><text>{{ t('common.all') }}</text></view>
          <view class="picker-opt" :class="{ active: currentRegion === r }" v-for="r in regions" :key="r" @tap="selectRegion(r)"><text>{{ r }}</text></view>
        </view>
      </view>
    </view>

    <!-- 报价方式选择 -->
    <view v-if="showQuotePicker" class="picker-mask" @tap="showQuotePicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('demand.quote') }}</text><text class="picker-close" @tap="showQuotePicker = false">✕</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !currentQuoteType }" @tap="selectQuoteType(null)"><text>{{ t('common.all') }}</text></view>
          <view class="picker-opt" :class="{ active: currentQuoteType === q.value }" v-for="q in quoteTypes" :key="q.value" @tap="selectQuoteType(q.value)">
            <text>{{ q.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 排序选择 -->
    <view v-if="showSortPicker" class="picker-mask" @tap="showSortPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('listPage.sortBy') }}</text><text class="picker-close" @tap="showSortPicker = false">✕</text></view>
        <view class="picker-list">
          <view class="picker-opt" :class="{ active: currentSort === s.value }" v-for="s in sortOptions" :key="s.value" @tap="selectSort(s.value)">
            <text>{{ s.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DEMAND_CATEGORIES, REGIONS } from '@/config/constants'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { formatRelativeTime as formatTime } from "@/utils/util"
import { quoteLabel, quoteTypes, categoryName, regionName, companyName } from '@/utils/i18n-maps'
import { a11yStyle } from '@/utils/accessibility'
import { t } from '@/i18n'
import { useNavTitle } from '@/hooks/useNavTitle'
import { hasStoredAccessToken } from '@/utils/session'
useNavTitle('titles.demandHall')

const categories = ref([...DEMAND_CATEGORIES])
const regions = REGIONS
const sortOptions = computed(() => [
  { value: 'latest', label: t('demand.sortLatest') },
  { value: 'hot', label: t('demand.sortHot') },
  { value: 'lead', label: t('demand.sortLead') }
])

const keyword = ref('')
const collaborationIntents = [
  { label: '找投资人', keyword: '投资人' },
  { label: '找业务下游', keyword: '下游客户' },
  { label: '找供应链', keyword: '供应链' },
  { label: '找技术合作', keyword: '技术合作' },
  { label: '找渠道', keyword: '渠道' },
  { label: '找人才', keyword: '人才' }
]
const searchFocused = ref(false)
const searchHistory = ref([])
const hotKeywords = ref([])
const savedSearches = ref([])
const savedSearchesLoading = ref(false)
const showSavedSearches = ref(false)
const checkingSavedIds = ref(new Set())

const currentCat = ref(null)
const currentRegion = ref(null)
const currentQuoteType = ref(null)
const currentSort = ref('latest')
const currentCatName = computed(() => categories.value.find(c => (c.id || c._id) === currentCat.value)?.name || '')
const mediaCategories = computed(() => categories.value.filter((item) => categoryNumber(item) <= 10))
const industryCategories = computed(() => categories.value.filter((item) => categoryNumber(item) > 10))
const quoteFilterLabel = computed(() => currentQuoteType.value ? quoteTypes.value.find(q => q.value === currentQuoteType.value)?.label || t('demand.quote') : t('demand.quote'))
const sortLabel = computed(() => sortOptions.value.find(s => s.value === currentSort.value)?.label || t('demand.sort'))

const animated = ref(true)
const { list: demandList, loading, refreshing, noMore, error: listError, retry: retryList, load: loadList, loadMore, refresh } = useList(
  (p) => bridge.demand.list({ ...p, sort: currentSort.value, keyword: keyword.value, category_id: currentCat.value, region: currentRegion.value, quote_type: currentQuoteType.value }),
  10
)
const showCatPicker = ref(false)
const showRegionPicker = ref(false)
const showQuotePicker = ref(false)
const showSortPicker = ref(false)

onMounted(async () => {
  loadHistory()
  try {
    const storedFilters = uni.getStorageSync('demand_list_filters')
    if (storedFilters && typeof storedFilters === 'object') {
      keyword.value = storedFilters.keyword || ''
      currentCat.value = storedFilters.currentCat || null
      currentRegion.value = storedFilters.currentRegion || null
      currentQuoteType.value = storedFilters.currentQuoteType || null
      currentSort.value = storedFilters.currentSort || 'latest'
    }
  } catch {}
  try {
    const storedCategory = uni.getStorageSync('demand_category_filter')
    if (storedCategory) { currentCat.value = storedCategory; uni.removeStorageSync('demand_category_filter') }
  } catch {}
  try {
    const remoteCategories = await bridge.category.list({ type: 'demand' })
    if (remoteCategories?.length) categories.value = remoteCategories
  } catch (error) { console.warn('[demand-list] load categories failed:', error) }
  loadHotKeywords()
  loadSavedSearches()
  loadList(true)
})

function loadHistory() {
  try { searchHistory.value = JSON.parse(uni.getStorageSync('demand_search_history') || '[]').slice(0, 5) } catch {}
}
async function loadHotKeywords() {
  try {
    const keywords = await bridge.search.hotKeywords()
    hotKeywords.value = Array.isArray(keywords) ? keywords.slice(0, 8) : []
  } catch (error) {
    console.warn('[demand-list] load hot keywords failed:', error)
    // 接口短暂不可用时，使用已经从后端加载的分类做兜底，不展示另一份写死的热词。
    hotKeywords.value = categories.value.slice(0, 5).map((item) => item.name).filter(Boolean)
  }
}
async function loadSavedSearches() {
  if (!hasStoredAccessToken()) {
    savedSearches.value = []
    savedSearchesLoading.value = false
    return
  }
  savedSearchesLoading.value = true
  try {
    const list = await bridge.search.saved()
    savedSearches.value = Array.isArray(list) ? list : []
  } catch (error) {
    // 游客或后端尚未登录时不打断需求浏览，只隐藏个人筛选入口的内容。
    console.warn('[demand-list] load saved searches failed:', error)
    savedSearches.value = []
  } finally {
    savedSearchesLoading.value = false
  }
}
function saveHistory(k) {
  if (!k.trim()) return
  const list = [k, ...searchHistory.value.filter(h => h !== k)].slice(0, 5)
  searchHistory.value = list
  uni.setStorageSync('demand_search_history', JSON.stringify(list))
}

function formatQuote(type) { return quoteLabel(type) }
function categoryId(item) { return item?.id || item?._id || '' }
function categoryNumber(item) { return Number(String(categoryId(item)).match(/(\d+)$/)?.[1] || 0) }

function formatCount(n) { return n >= 10000 ? (n / 10000).toFixed(1) + 'w' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n }
function getHeatClass(item) { const v = item.view_count || 0; if (v >= 2000) return 'heat-hot'; if (v >= 500) return 'heat-medium'; return 'heat-normal' }
function getHeatLevel(item) { const v = item.view_count || 0; if (v >= 2000) return t('listPage.heatHot'); if (v >= 500) return t('listPage.heatMedium'); return t('listPage.heatNormal') }
function getCompanyInitial(item) { return (companyName(item.company_name) || '企').trim().slice(0, 1) }

function onRefresh() { refresh() }
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
function persistFilters() {
  uni.setStorageSync('demand_list_filters', {
    keyword: keyword.value,
    currentCat: currentCat.value,
    currentRegion: currentRegion.value,
    currentQuoteType: currentQuoteType.value,
    currentSort: currentSort.value
  })
}

function doSearch() { saveHistory(keyword.value); persistFilters(); loadList(true) }
function clearSearch() { keyword.value = ''; persistFilters(); loadList(true) }
function useHistory(h) { keyword.value = h; doSearch() }
function searchTag(t) { keyword.value = t; doSearch() }
function selectIntent(intent) {
  keyword.value = keyword.value === intent.keyword ? '' : intent.keyword
  doSearch()
}
function resetFilter() { currentCat.value = null; currentRegion.value = null; currentQuoteType.value = null; currentSort.value = 'latest'; keyword.value = ''; persistFilters(); loadList(true) }
function goSearch() { uni.showToast({ title: t('listPage.useSearchAbove'), icon: 'none' }) }
function goPublish() { uni.navigateTo({ url: '/pages/demand/publish' }) }

function currentSearchPayload() {
  return {
    name: [keyword.value.trim(), currentCatName.value, currentRegion.value || '全国'].filter(Boolean).join(' · '),
    keyword: keyword.value.trim(),
    category_id: currentCat.value || '',
    region: currentRegion.value || '',
    quote_type: currentQuoteType.value || '',
    sort: currentSort.value
  }
}
function hasSearchCondition(payload) { return !!(payload.keyword || payload.category_id || payload.region && payload.region !== '全国' || payload.quote_type) }
function savedSearchSummary(saved) {
  const parts = [saved.keyword, saved.category_id && categoryName(saved.category_id), saved.region || '全国', saved.quote_type && quoteLabel(saved.quote_type)].filter(Boolean)
  return parts.join(' · ')
}
function savedActionLabel(saved) {
  const id = saved?.id || saved?._id
  if (checkingSavedIds.value.has(id)) return '检查中…'
  return Number(saved?.new_count || 0) > 0 ? `新需求 ${saved.new_count}` : '检查新需求'
}
function toggleSavedSearches() {
  if (!hasStoredAccessToken()) {
    uni.showToast({ title: '登录后可保存和管理筛选', icon: 'none' })
    return
  }
  showSavedSearches.value = !showSavedSearches.value
  if (showSavedSearches.value && !savedSearches.value.length) loadSavedSearches()
}
async function saveCurrentSearch() {
  if (!hasStoredAccessToken()) {
    uni.showToast({ title: '登录后可保存筛选', icon: 'none' })
    return
  }
  const payload = currentSearchPayload()
  if (!hasSearchCondition(payload)) return uni.showToast({ title: '先选一个关键词或筛选条件', icon: 'none' })
  try {
    const saved = await bridge.search.save(payload)
    if (saved) savedSearches.value = [saved, ...savedSearches.value.filter((item) => (item.id || item._id) !== (saved.id || saved._id))]
    showSavedSearches.value = true
    uni.showToast({ title: '已保存，下次可检查新需求', icon: 'none' })
  } catch (error) { uni.showToast({ title: error?.message || '保存失败，请稍后重试', icon: 'none' }) }
}
function applySavedSearch(saved) {
  keyword.value = saved.keyword || ''
  currentCat.value = saved.category_id || null
  currentRegion.value = saved.region || null
  currentQuoteType.value = saved.quote_type || null
  currentSort.value = saved.sort || 'latest'
  persistFilters()
  showSavedSearches.value = false
  loadList(true)
}
async function checkSavedSearch(saved) {
  const id = saved?.id || saved?._id
  if (!id || checkingSavedIds.value.has(id)) return
  checkingSavedIds.value = new Set([...checkingSavedIds.value, id])
  try {
    const result = await bridge.search.checkSaved(id)
    if (result?.search) Object.assign(saved, result.search)
    const count = Number(result?.new_count || 0)
    applySavedSearch(saved)
    uni.showToast({ title: count ? `发现 ${count} 条新需求` : '暂时没有新需求', icon: 'none' })
  } catch (error) { uni.showToast({ title: error?.message || '检查失败，请稍后重试', icon: 'none' }) } finally {
    const next = new Set(checkingSavedIds.value)
    next.delete(id)
    checkingSavedIds.value = next
  }
}
function removeSavedSearch(saved) {
  const id = saved?.id || saved?._id
  if (!id) return
  uni.showModal({ title: '删除这条筛选？', content: '删除后不会影响需求大厅里的公开需求。', confirmText: '删除', confirmColor: '#D86B59', success: async ({ confirm }) => {
    if (!confirm) return
    try {
      await bridge.search.removeSaved(id)
      savedSearches.value = savedSearches.value.filter((item) => (item.id || item._id) !== id)
      uni.showToast({ title: '已删除', icon: 'none' })
    } catch (error) { uni.showToast({ title: error?.message || '删除失败，请稍后重试', icon: 'none' }) }
  } })
}

function selectCat(id) { currentCat.value = id; showCatPicker.value = false; persistFilters(); loadList(true) }
function selectRegion(r) { currentRegion.value = r; showRegionPicker.value = false; persistFilters(); loadList(true) }
function selectQuoteType(type) { currentQuoteType.value = type; showQuotePicker.value = false; persistFilters(); loadList(true) }
function selectSort(v) { currentSort.value = v; showSortPicker.value = false; persistFilters(); loadList(true) }
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; min-height: 100vh; height: 100vh; overflow: hidden; box-sizing: border-box; background: #F5F7FB; padding: 18rpx 24rpx 0; color: #303B57; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */

.header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18rpx; }
.header-eyebrow { display: block; color: #A0AABD; font-family: monospace; font-size: 17rpx; font-weight: 700; letter-spacing: .1em; }
.header-title { display: block; margin-top: 7rpx; color: #303B57; font-size: 42rpx; font-weight: 760; letter-spacing: -.04em; }
.header-actions { display: flex; }
.header-action { display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; border: 1rpx solid #E6EAF2; border-radius: 18rpx; background: #FFF; }
.header-action image { display: block; width: 29rpx; height: 29rpx; object-fit: contain; opacity: .64; }
.icon-sm { width: 29rpx; height: 29rpx; }

.search-row { display: flex; align-items: center; margin-bottom: 18rpx; }
.search-box { flex: 1; display: flex; align-items: center; height: 74rpx; border: 1rpx solid #E7EBF2; border-radius: 21rpx; padding: 0 20rpx; background: #FFF; box-shadow: 0 8rpx 24rpx rgba(70,87,123,.035); }
.search-box.focused { border-color: #AEB7ED; box-shadow: 0 0 0 5rpx rgba(101,115,220,.08); }
.search-icon { display: block; width: 34rpx; height: 34rpx; flex: 0 0 34rpx; object-fit: contain; opacity: .76; }
.search-input { flex: 1; font-size: 25rpx; color: #303B57; margin: 0 12rpx; }
.search-clear { font-size: 24rpx; color: #A0AABD; padding: 4rpx; }
.search-btn { margin-left: 18rpx; color: #6573DC; font-size: 24rpx; font-weight: 650; }

.list-intro { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; padding: 20rpx 20rpx 19rpx; border: 1rpx solid #E6EAF3; border-radius: 21rpx; background: linear-gradient(135deg, #F2F4FF, #FFF); }
.intro-title { display: block; color: #4B5872; font-size: 26rpx; font-weight: 700; }
.intro-desc { display: block; margin-top: 6rpx; color: #98A4B7; font-size: 19rpx; }
.intro-live { display: flex; align-items: center; gap: 7rpx; color: #4CA77D; font-size: 18rpx; white-space: nowrap; }
.live-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background: #59C58C; box-shadow: 0 0 0 5rpx rgba(89,197,140,.12); }

.filter-bar { display: flex; gap: 8rpx; margin-bottom: 16rpx; }
.filter-item { display: flex; align-items: center; justify-content: center; min-width: 0; flex: 1; gap: 6rpx; padding: 10rpx 9rpx; border: 1rpx solid #E4E8F0; border-radius: 11rpx; background: #FFF; color: #7A879B; font-size: 20rpx; }
.filter-item > text:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filter-item.active { border-color: #D7DBF7; color: #5D6BD2; background: #EEF0FF; }
.filter-arrow { color: #A0AABD; font-size: 16rpx; }

.recommend-tags { margin: 0 0 16rpx; }
.recommend-title { display: block; margin-bottom: 8rpx; color: #A0AABD; font-size: 18rpx; font-weight: 700; letter-spacing: .05em; }
.tags-wrap { display: flex; flex-wrap: wrap; }
.hot-tag { margin-right: 8rpx; padding: 7rpx 13rpx; border: 1rpx solid #E4E8F0; border-radius: 9rpx; color: #7C899D; background: #FFF; font-size: 19rpx; }

.saved-toolbar { display: flex; align-items: center; gap: 9rpx; margin: 0 0 14rpx; padding: 13rpx 14rpx; border: 1rpx solid #E3E7F6; border-radius: 16rpx; background: #F7F8FF; }
.saved-toolbar-copy { min-width: 0; flex: 1; }
.saved-toolbar-title, .saved-toolbar-desc { display: block; }
.saved-toolbar-title { color: #5664C7; font-size: 20rpx; font-weight: 700; }
.saved-toolbar-desc { margin-top: 4rpx; color: #9AA5C1; font-size: 16rpx; }
.saved-toolbar-action { padding: 8rpx 10rpx; border-radius: 10rpx; color: #5968D8; background: #E9ECFF; font-size: 17rpx; white-space: nowrap; }
.saved-toolbar-action.muted { color: #7C879A; background: #FFF; }
.saved-panel { margin-bottom: 14rpx; padding: 15rpx; border: 1rpx solid #E6EAF2; border-radius: 17rpx; background: #FFF; }
.saved-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10rpx; }
.saved-panel-title, .saved-panel-desc { display: block; }
.saved-panel-title { color: #4C5973; font-size: 22rpx; font-weight: 700; }
.saved-panel-desc { margin-top: 5rpx; color: #9CA7B7; font-size: 16rpx; line-height: 1.4; }
.saved-panel-close { color: #6573DC; font-size: 17rpx; white-space: nowrap; }
.saved-panel-empty { padding: 18rpx 0 5rpx; color: #A0AABD; font-size: 17rpx; text-align: center; }
.saved-list { margin-top: 12rpx; }
.saved-item { display: flex; align-items: center; gap: 10rpx; padding: 12rpx 0; border-top: 1rpx solid #F0F2F6; }
.saved-item-copy { min-width: 0; flex: 1; }
.saved-item-name, .saved-item-meta { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.saved-item-name { color: #53607A; font-size: 19rpx; font-weight: 700; }
.saved-item-meta { margin-top: 5rpx; color: #9AA5B6; font-size: 16rpx; }
.saved-item-actions { display: flex; align-items: center; gap: 9rpx; flex: 0 0 auto; }
.saved-check { padding: 7rpx 9rpx; border-radius: 9rpx; color: #5968D8; background: #EEF0FF; font-size: 16rpx; white-space: nowrap; }
.saved-delete { color: #C98578; font-size: 16rpx; white-space: nowrap; }

.search-history { padding: 16rpx 24rpx; }
.history-title { font-size: 24rpx; color: rgba(0,0,0,0.5); margin-bottom: 12rpx; display: block; }
.history-tags { display: flex; flex-wrap: wrap; }
.history-tag { font-size: 24rpx; color: rgba(0,0,0,0.6); background: #FFFFFF; padding: 10rpx 20rpx; border-radius: 20rpx; }

.skeleton-list { display: flex; flex-direction: column; padding: 0 24rpx; }
.skeleton-item { background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; }
.skeleton-tags { width: 120rpx; height: 24rpx; background: #F0F1F5; border-radius: 8rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-title { width: 80%; height: 30rpx; background: #F0F1F5; border-radius: 8rpx; margin-bottom: 12rpx; animation: pulse 1.5s infinite; }
.skeleton-meta { width: 60%; height: 24rpx; background: #F0F1F5; border-radius: 8rpx; animation: pulse 1.5s infinite; }

.list-scroll { flex: 1; min-height: 0; height: auto; padding-bottom: calc(130rpx + env(safe-area-inset-bottom)); }

.demand-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.demand-item { margin-bottom: 14rpx; padding: 19rpx 18rpx 16rpx; border: 1rpx solid #E6EAF2; border-radius: 21rpx; background: #FFF; box-shadow: 0 8rpx 22rpx rgba(70,87,123,.035); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.item-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 17rpx; }
.item-origin { display: flex; align-items: center; min-width: 0; }
.company-mark { display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; margin-right: 12rpx; border-radius: 17rpx; color: #FFF; font-size: 23rpx; font-weight: 750; }
.brand-0 { background: #FF776F; }.brand-1 { background: #6673DF; }.brand-2 { background: #38B981; }.brand-3 { background: #E9A33A; }
.origin-copy { min-width: 0; }
.item-company { display: block; overflow: hidden; color: #52607A; font-size: 22rpx; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.item-region { display: block; margin-top: 5rpx; color: #A0AABD; font-size: 17rpx; }
.match-badge { display: flex; flex-direction: column; align-items: flex-end; flex: 0 0 auto; color: #5E6CDA; }
.match-badge text:first-child { font-size: 29rpx; font-weight: 750; line-height: 1; }
.match-badge text:last-child { margin-top: 5rpx; color: #A1ACBD; font-size: 14rpx; }
.item-title { display: block; margin-bottom: 14rpx; color: #3D4963; font-size: 27rpx; font-weight: 700; line-height: 1.4; }
.item-tag-row { display: flex; align-items: center; margin-bottom: 16rpx; }
.item-cat-tag, .item-quote-tag { padding: 5rpx 9rpx; border-radius: 7rpx; font-size: 17rpx; }
.item-cat-tag { color: #6473D6; background: #EEF0FF; }
.item-quote-tag { margin-left: 7rpx; color: #D49339; background: #FFF5DF; }
.item-time { overflow: hidden; margin-left: auto; color: #A1ACBD; font-size: 16rpx; text-overflow: ellipsis; white-space: nowrap; }
.item-bottom { display: flex; justify-content: space-between; align-items: center; }
.item-stats { display: flex; gap: 18rpx; }
.stat-box { display: flex; flex-direction: column; align-items: flex-start; }
.stat-val { color: #52607A; font-size: 23rpx; font-weight: 700; }
.stat-label { margin-top: 2rpx; color: #A0AABD; font-size: 16rpx; }
.heat-indicator { padding: 6rpx 14rpx; border-radius: 12rpx; }
.heat-hot { background: rgba(239,68,68,0.1); }
.heat-hot text { font-size: 20rpx; color: #EF4444; font-weight: bold; }
.heat-medium { background: rgba(245,158,11,0.1); }
.heat-medium text { font-size: 20rpx; color: #F59E0B; font-weight: bold; }
.heat-normal { background: rgba(16,185,129,0.1); }
.heat-normal text { font-size: 20rpx; color: #10B981; font-weight: bold; }

.loading, .end { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }
.list-error { display: flex; flex-direction: column; align-items: center; padding: 90rpx 24rpx; color: #8D99AC; }
.error-icon { display: flex; align-items: center; justify-content: center; width: 68rpx; height: 68rpx; margin-bottom: 14rpx; border-radius: 22rpx; color: #6573DC; background: #EEF0FF; font-size: 36rpx; }
.error-title { color: #52607A; font-size: 25rpx; font-weight: 650; }
.error-action { margin-top: 8rpx; color: #6573DC; font-size: 20rpx; }
.inline-error { margin: 8rpx 24rpx; padding: 12rpx 16rpx; border-radius: 12rpx; color: #B35E4F; background: #FFF1ED; font-size: 19rpx; text-align: center; }
.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.6); display: block; margin-bottom: 16rpx; }
.empty-hint { font-size: 24rpx; color: #6573DC; }

.publish-fab { position: fixed; right: 28rpx; bottom: 148rpx; z-index: 120; display: flex; align-items: center; gap: 7rpx; padding: 13rpx 17rpx; border-radius: 15rpx; color: #FFF; background: #6573DC; box-shadow: 0 12rpx 26rpx rgba(101,115,220,.28); }
.publish-fab image { display: block; width: 25rpx; height: 25rpx; object-fit: contain; filter: brightness(0) invert(1); }
.publish-fab text { font-size: 21rpx; font-weight: 650; }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1200; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { display: flex; justify-content: space-between; margin-bottom: 24rpx; font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.picker-close { color: rgba(0,0,0,0.4); padding: 4rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-list { display: flex; flex-direction: column; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

/* Quiet Intelligence: 把需求页从后台列表收拢为编辑式机会清单。 */
.page { color: #25231F; background: #F7F6F2; padding-inline: 28rpx; }
.header { align-items: center; margin-bottom: 22rpx; }
.header-eyebrow { color: #8A847B; font-size: 16rpx; font-weight: 500; letter-spacing: .15em; }
.header-title { color: #191816; font-family: "Songti SC", "STSong", serif; font-size: 45rpx; font-weight: 500; letter-spacing: -.02em; }
.header-action { width: auto; height: 58rpx; gap: 7rpx; padding: 0 16rpx; border-color: rgba(30,27,22,.12); border-radius: 8rpx; color: #5C2828; background: #FCFBF8; }
.header-action image { width: 25rpx; height: 25rpx; opacity: .85; }
.header-action text { font-size: 20rpx; font-weight: 600; }
.search-row { margin-bottom: 22rpx; }
.search-box { height: 76rpx; border-color: rgba(30,27,22,.11); border-radius: 8rpx; background: #FCFBF8; box-shadow: none; }
.search-box.focused { border-color: #69574A; box-shadow: 0 0 0 4rpx rgba(105,87,74,.08); }
.search-input { color: #25231F; }
.search-btn, .saved-panel-close, .empty-hint, .error-action { color: #5C2828; }
.list-intro { margin-bottom: 19rpx; padding: 24rpx 2rpx; border-width: 1rpx 0; border-color: rgba(30,27,22,.12); border-radius: 0; background: transparent; box-shadow: none; }
.intro-kicker { display: block; margin-bottom: 7rpx; color: #9A7C57; font-family: monospace; font-size: 14rpx; letter-spacing: .14em; }
.intro-title { color: #25231F; font-family: "Songti SC", "STSong", serif; font-size: 29rpx; font-weight: 500; }
.intro-desc { color: #7B766E; font-size: 18rpx; }
.intro-live { color: #62685D; }
.live-dot { background: #737B69; box-shadow: none; }
.intent-scroll { margin: 0 -28rpx 18rpx; padding: 0 28rpx; white-space: nowrap; }
.intent-row { display: inline-flex; align-items: center; gap: 9rpx; }
.intent-label { margin-right: 5rpx; color: #9a958d; font-family: monospace; font-size: 15rpx; letter-spacing: .08em; }
.intent-chip { padding: 10rpx 15rpx; border: 1rpx solid rgba(30,27,22,.1); border-radius: 4rpx; color: #6f6b63; background: #fcfbf8; font-size: 19rpx; }
.intent-chip.active { border-color: #5c2828; color: #fcfbf8; background: #5c2828; }
.filter-bar { gap: 0; border-bottom: 1rpx solid rgba(30,27,22,.1); }
.filter-item { justify-content: flex-start; padding: 12rpx 10rpx 14rpx; border: 0; border-radius: 0; color: #777169; background: transparent; }
.filter-item + .filter-item { border-left: 1rpx solid rgba(30,27,22,.08); }
.filter-item.active { color: #5C2828; background: #F0ECE5; }
.hot-tag { border-color: rgba(30,27,22,.1); border-radius: 6rpx; color: #6F6B63; background: transparent; }
.saved-toolbar { border-color: rgba(30,27,22,.1); border-radius: 8rpx; background: #F0EEE8; }
.saved-toolbar-title { color: #5C2828; }
.saved-toolbar-desc { color: #837E76; }
.saved-toolbar-action { border-radius: 5rpx; color: #5C2828; background: #FCFBF8; }
.saved-panel { border-color: rgba(30,27,22,.1); border-radius: 8rpx; background: #FCFBF8; }
.demand-item { margin-bottom: 12rpx; padding: 23rpx 21rpx 19rpx; border-color: rgba(30,27,22,.1); border-radius: 8rpx; background: #FCFBF8; box-shadow: none; }
.company-mark, .brand-0, .brand-1, .brand-2, .brand-3 { border: 1rpx solid rgba(92,40,40,.14); border-radius: 7rpx; color: #5C2828; background: #F0E9E2; }
.item-company { color: #4B4741; font-weight: 600; }
.item-region, .item-time { color: #99938A; }
.match-badge { color: #41463C; }
.match-badge text:first-child { font-family: Georgia, serif; font-size: 27rpx; font-weight: 500; }
.match-badge text:last-child { color: #8A847B; }
.item-title { color: #24211E; font-family: "Songti SC", "STSong", serif; font-size: 29rpx; font-weight: 600; line-height: 1.48; }
.item-cat-tag, .item-quote-tag { border-radius: 4rpx; background: #F0EEE8; }
.item-cat-tag { color: #5C2828; }
.item-quote-tag { color: #786443; background: #F3EEE3; }
.stat-val { color: #4C4842; font-weight: 600; }
.stat-label { color: #99938A; }
.heat-indicator, .heat-hot, .heat-medium, .heat-normal { border-radius: 4rpx; background: #F0EEE8; }
.heat-hot text, .heat-medium text, .heat-normal text { color: #69574A; font-size: 18rpx; font-weight: 500; }
.publish-fab { right: 30rpx; border-radius: 7rpx; background: #302D29; box-shadow: 0 9rpx 24rpx rgba(40,35,30,.18); }
.picker-mask { background: rgba(25,24,22,.36); }
.picker-panel { border-radius: 14rpx 14rpx 0 0; background: #F7F6F2; }
.picker-header { color: #25231F; font-weight: 600; }
.picker-group-label { display: block; margin: 6rpx 0 12rpx; color: #8a847b; font-family: monospace; font-size: 15rpx; letter-spacing: .1em; }
.picker-group-label.industry { margin-top: 26rpx; padding-top: 18rpx; border-top: 1rpx solid rgba(30,27,22,.09); color: #9a7c57; }
.picker-opt { border-radius: 6rpx; color: #6F6B63; background: #F0EEE8; }
.picker-opt.active { color: #FCFBF8; background: #5C2828; }
.empty-icon { display: flex; align-items: center; justify-content: center; width: 78rpx; height: 78rpx; margin: 0 auto 16rpx; border: 1rpx solid rgba(30,27,22,.1); border-radius: 8rpx; background: #FCFBF8; }
.empty-icon image { width: 36rpx; height: 36rpx; opacity: .7; }

/* 机会以清单阅读，不再像一组等待促销的商品卡。 */
.demand-list {
  gap: 0;
  border-top: 1rpx solid rgba(30,27,22,.10);
}
.demand-item {
  margin: 0;
  padding: 28rpx 4rpx 26rpx;
  border: 0;
  border-bottom: 1rpx solid rgba(30,27,22,.09);
  border-radius: 0;
  background: transparent;
}
.demand-item:active { padding-right: 12rpx; border-color: rgba(92,40,40,.30); background: #f0eee8; box-shadow: none; }
.item-top { margin-bottom: 18rpx; }
.company-mark,
.brand-0,
.brand-1,
.brand-2,
.brand-3 {
  width: 52rpx;
  height: 52rpx;
  margin-right: 14rpx;
  border-radius: 4rpx;
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 500;
}
.item-tag-row { margin-bottom: 17rpx; }
.item-bottom { padding-top: 2rpx; }
.heat-indicator { padding: 5rpx 9rpx; border: 1rpx solid rgba(30,27,22,.08); }
.publish-fab { right: 32rpx; bottom: 150rpx; min-width: 126rpx; min-height: 68rpx; justify-content: center; padding: 0 19rpx; border: 1rpx solid #302d29; border-radius: 5rpx; color: #fff; box-shadow: 0 10rpx 22rpx rgba(40,35,30,.14); }

/* 需求卡片在窄屏上优先保护内容列，筛选和统计不会把外层横向撑开。 */
.header > view:first-child,
.list-intro > view:first-child,
.saved-toolbar-copy,
.saved-panel-head > view:first-child,
.item-origin,
.origin-copy,
.demand-item,
.item-bottom,
.item-stats {
  min-width: 0;
}
.header > view:first-child,
.list-intro > view:first-child { flex: 1; overflow: hidden; }
.header-actions,
.intro-live,
.match-badge,
.heat-indicator { flex: 0 0 auto; }
.intro-title,
.intro-desc,
.item-title,
.item-company,
.item-region,
.item-time {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.intro-desc { white-space: nowrap; }
.item-title { overflow-wrap: anywhere; word-break: break-word; }
.item-tag-row { min-width: 0; }
.item-cat-tag,
.item-quote-tag { flex: 0 0 auto; white-space: nowrap; }
.item-time { min-width: 0; }
.item-stats { flex: 1; overflow: hidden; }
.stat-box { min-width: 0; }
.stat-label { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
