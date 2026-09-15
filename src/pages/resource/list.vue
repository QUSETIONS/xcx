<template>
  <view class="page">
    <view class="header"><text class="header-eyebrow">资料库</text><text class="header-title">{{ t('resource.title') }}</text><text class="header-desc">把有用的经验，留给下一次项目</text></view>

    <view class="resource-intro"><view><text class="intro-title">实用资料，随时取用</text><text class="intro-desc">方案、模板和行业资料都在这里沉淀</text><view class="intro-stats"><text><strong>{{ overview.total }}</strong> 份资料</text><text><strong>{{ overview.free }}</strong> 份免费</text></view></view><view class="intro-mark"><image src="/static/icons/file.svg" mode="aspectFit" /></view></view>

    <view class="search-row">
      <view class="search-box" :class="{ focused: searchFocused }">
        <image class="search-icon" src="/static/icons/search.svg" mode="aspectFit"/>
        <input class="search-input" v-model="keyword" :placeholder="t('resource.searchPlaceholder')" @confirm="doSearch" @focus="searchFocused = true" @blur="searchFocused = false" />
        <text class="search-clear" v-if="keyword" @tap="clearSearch">✕</text>
      </view>
      <text class="search-btn" @tap="doSearch">{{ t('common.search') }}</text>
    </view>

    <scroll-view scroll-x class="cat-scroll">
      <view class="cat-list">
        <view class="cat-item card-press" :class="{ active: !currentCategory }" @tap="selectCategory(null)">
          <text>{{ t('resource.allCategories') }}</text>
        </view>
        <view class="cat-item card-press" :class="{ active: currentCategory === (cat.id || cat._id) }" v-for="cat in categories" :key="cat.id || cat._id" @tap="selectCategory(cat.id || cat._id)">
          <text>{{ categoryName(cat.id || cat._id, cat.name) }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="filter-row">
      <view v-for="item in accessFilters" :key="item.value" class="filter-pill" :class="{ active: access === item.value }" @tap="selectAccess(item.value)"><text>{{ item.label }}</text></view>
      <view class="sort-pill" @tap="pickSort"><text>{{ sortLabel }}</text><text class="sort-arrow">⌄</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y @scrolltolower="loadMore" :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !list.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view class="resource-list" :class="{ 'animate-in': animated }">
        <view class="resource-item" v-for="(item, idx) in list" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="resource-icon-box">
            <image class="resource-icon" src="/static/icons/file.svg" mode="aspectFit" />
          </view>
          <view class="resource-main">
            <text class="resource-title">{{ item.title }}</text>
            <text class="resource-summary">{{ item.summary }}</text>
            <view class="resource-meta">
              <text class="meta-tag">{{ categoryName(item.category_id, item.category_name) }}</text>
              <text class="meta-type">{{ item.file_type }} · {{ item.file_size }}</text>
            </view>
            <view class="resource-stats">
              <text>浏览 {{ item.view_count }}</text>
              <text>下载 {{ item.download_count }}</text>
            </view>
          </view>
          <view class="resource-price">
            <text v-if="item.is_featured" class="featured-mark">精选</text>
            <text v-if="item.is_free" class="price-free">{{ t('resource.free') }}</text>
            <text v-else class="price-num">¥{{ (item.price / 100).toFixed(0) }}</text>
          </view>
        </view>
      </view>
      <view v-if="loading && list.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="noMore && list.length" class="end"><text>— {{ t('listPage.noMore') }} —</text></view>
      <view v-if="!list.length && !loading" class="empty">
        <view class="empty-icon"><image src="/static/icons/file.svg" mode="aspectFit" /></view>
        <text class="empty-text">{{ t('resource.empty') }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { useNavTitle } from '@/hooks/useNavTitle'
import { categoryName } from '@/utils/i18n-maps'
import { t } from '@/i18n'
useNavTitle('titles.resource')

const animated = ref(true)
const keyword = ref('')
const searchFocused = ref(false)
const categories = ref([])
const currentCategory = ref(null)
const access = ref('all')
const sort = ref('latest')
const overview = ref({ total: 0, free: 0, featured: 0, downloads: 0 })
const accessFilters = [
  { value: 'all', label: '全部' },
  { value: 'free', label: '免费' },
  { value: 'paid', label: '付费' }
]
const sortOptions = [{ value: 'latest', label: '最新发布' }, { value: 'popular', label: '浏览最多' }, { value: 'downloads', label: '下载最多' }]
const sortLabel = computed(() => sortOptions.find(item => item.value === sort.value)?.label || '最新发布')
const { list, loading, refreshing, noMore, load: loadList, loadMore, refresh } = useList(
  (params) => bridge.resource.list({ ...params, keyword: keyword.value, category_id: currentCategory.value, access: access.value, sort: sort.value }),
  20
)

function goDetail(id) { uni.navigateTo({ url: `/pages/resource/detail?id=${id}` }) }
function onRefresh() { refresh() }
function selectCategory(id) { currentCategory.value = id; loadList(true) }
function selectAccess(value) { if (access.value !== value) { access.value = value; loadList(true) } }
function doSearch() { loadList(true) }
function clearSearch() { keyword.value = ''; loadList(true) }
function pickSort() {
  uni.showActionSheet({ itemList: sortOptions.map(item => item.label), success: ({ tapIndex }) => {
    const item = sortOptions[tapIndex]
    if (item && item.value !== sort.value) { sort.value = item.value; loadList(true) }
  } })
}

onMounted(async () => {
  const [summary, remoteCategories] = await Promise.allSettled([bridge.resource.overview(), bridge.category.list({ type: 'resource' })])
  if (summary.status === 'fulfilled' && summary.value) {
    overview.value = summary.value
    if (summary.value.categories?.length) categories.value = summary.value.categories
  }
  if (remoteCategories.status === 'fulfilled' && remoteCategories.value?.length && !categories.value.length) categories.value = remoteCategories.value
  loadList(true)
})
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; min-height: 100vh; height: 100vh; box-sizing: border-box; padding: 18rpx 24rpx 24rpx; color: #303B57; background: #F5F7FB; }
/* #ifdef H5 */
.page { min-height: calc(100vh - 44px); height: calc(100vh - 44px); }
/* #endif */

.header { padding-bottom: 18rpx; }
.header-eyebrow { display: block; color: #A0AABD; font-family: monospace; font-size: 17rpx; font-weight: 700; letter-spacing: .1em; }
.header-title { display: block; margin-top: 7rpx; color: #303B57; font-size: 42rpx; font-weight: 760; letter-spacing: -.04em; }
.header-desc { display: block; margin-top: 7rpx; color: #98A4B7; font-size: 20rpx; }
.resource-intro { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; padding: 19rpx 20rpx; border: 1rpx solid #E6EAF3; border-radius: 21rpx; background: linear-gradient(135deg, #F2F4FF, #FFF); }
.intro-title { display: block; color: #4B5872; font-size: 26rpx; font-weight: 700; }
.intro-desc { display: block; margin-top: 6rpx; color: #98A4B7; font-size: 19rpx; }
.intro-stats { display: flex; margin-top: 11rpx; color: #9AA6B8; font-size: 17rpx; }.intro-stats text { margin-right: 16rpx; }.intro-stats strong { color: #6573DC; font-size: 21rpx; }
.intro-mark { display: flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; border-radius: 19rpx; background: #E7F8F0; }
.intro-mark image { display: block; width: 34rpx; height: 34rpx; object-fit: contain; opacity: .8; }

.search-row { display: flex; align-items: center; margin-bottom: 14rpx; }
.search-box { flex: 1; display: flex; align-items: center; height: 70rpx; border: 1rpx solid #E7EBF2; border-radius: 20rpx; padding: 0 18rpx; background: #FFF; box-shadow: 0 8rpx 24rpx rgba(70,87,123,.035); }
.search-box.focused { border-color: #AEB7ED; box-shadow: 0 0 0 5rpx rgba(101,115,220,.08); }
.search-icon { display: block; width: 34rpx; height: 34rpx; flex: 0 0 34rpx; object-fit: contain; opacity: .76; }
.search-input { flex: 1; margin: 0 12rpx; color: #303B57; font-size: 24rpx; }
.search-clear { padding: 4rpx; color: #A0AABD; font-size: 23rpx; }
.search-btn { margin-left: 16rpx; color: #6573DC; font-size: 23rpx; font-weight: 650; }
.cat-scroll { margin-bottom: 16rpx; }
.cat-list { display: flex; }
.cat-item { flex: 0 0 auto; margin-right: 10rpx; padding: 9rpx 15rpx; border: 1rpx solid #E4E8F0; border-radius: 11rpx; color: #7A879B; background: #FFF; font-size: 20rpx; white-space: nowrap; }
.cat-item.active { border-color: #BFE9D8; color: #29966B; background: #E7F8F0; font-weight: 650; }
.filter-row { display: flex; align-items: center; margin: -4rpx 0 16rpx; }.filter-pill, .sort-pill { padding: 8rpx 14rpx; border: 1rpx solid #E4E8F0; border-radius: 10rpx; color: #8A96A9; background: #FFF; font-size: 18rpx; }.filter-pill { margin-right: 8rpx; }.filter-pill.active { border-color: #BFC7FF; color: #5968D8; background: #EEF0FF; font-weight: 650; }.sort-pill { display: flex; align-items: center; margin-left: auto; }.sort-arrow { margin-left: 5rpx; color: #A0AABD; font-size: 21rpx; }
.list-scroll { flex: 1; min-height: 0; height: auto; }
.resource-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }

.resource-item { display: flex; align-items: flex-start; margin-bottom: 12rpx; border: 1rpx solid #E7EBF2; border-radius: 20rpx; padding: 18rpx; background: #FFF; box-shadow: 0 8rpx 22rpx rgba(70,87,123,.035); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.resource-icon-box { display: flex; align-items: center; justify-content: center; width: 62rpx; height: 62rpx; margin-right: 14rpx; border-radius: 18rpx; background: #E7F8F0; }
.resource-icon { display: block; width: 38rpx; height: 38rpx; object-fit: contain; opacity: .8; }

.resource-main { flex: 1; min-width: 0; }
.resource-title { display: block; margin-bottom: 8rpx; overflow: hidden; color: #4D5A73; font-size: 25rpx; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.resource-summary { display: -webkit-box; overflow: hidden; margin-bottom: 12rpx; color: #8D99AC; font-size: 21rpx; line-height: 1.5; text-overflow: ellipsis; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.resource-meta { display: flex; align-items: center; margin-bottom: 8rpx; }
.meta-tag { padding: 5rpx 9rpx; border-radius: 7rpx; color: #39A879; background: #E7F8F0; font-size: 17rpx; }
.meta-type { color: #A0AABD; font-size: 17rpx; }
.resource-stats { display: flex; }
.resource-stats text { margin-right: 16rpx; color: #A0AABD; font-size: 17rpx; }

.resource-price { display: flex; align-items: center; }
.featured-mark { margin-right: 8rpx; padding: 5rpx 8rpx; border-radius: 7rpx; color: #C98227; background: #FFF5DF; font-size: 16rpx; }
.price-free { padding: 6rpx 12rpx; border-radius: 10rpx; color: #39A879; background: #E7F8F0; font-size: 21rpx; font-weight: 700; }
.price-num { color: #E4745F; font-size: 25rpx; font-weight: 800; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 64rpx 24rpx; }
.empty-icon { display: flex; align-items: center; justify-content: center; width: 86rpx; height: 86rpx; margin-bottom: 16rpx; border-radius: 28rpx; background: #E7F8F0; }
.empty-icon image { display: block; width: 38rpx; height: 38rpx; object-fit: contain; opacity: .7; }
.empty-text { color: #7D899D; font-size: 27rpx; }
.loading, .end { padding: 32rpx; color: #9AA6B8; font-size: 22rpx; text-align: center; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }

/* Enterprise pass: 资料库按“搜索—筛选—内容—权限”组织信息。 */
.page { color: #1F2329; background: #F5F6F8; }
.header-title { color: #1F2329; }
.resource-intro, .resource-item, .search-box { border-color: #E5E6EB; border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(31,35,41,.03); }
.resource-intro { background: #FFF; }
.search-box { background: #FFF; }
.search-box.focused { border-color: #1677FF; box-shadow: 0 0 0 5rpx rgba(22,119,255,.1); }
.search-btn, .cat-item.active, .filter-pill.active { color: #0958D9; }
.cat-item.active, .filter-pill.active { border-color: #91CAFF; background: #E8F3FF; }
.resource-icon-box, .empty-icon { border-radius: 10rpx; background: #E8F3FF; }
.resource-title { color: #1F2329; }
.meta-tag, .price-free { color: #1A9A6C; background: #E8F8F2; }
</style>
