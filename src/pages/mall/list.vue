<template>
  <view class="page mall-page" :style="a11yStyle">
    <view class="header">
      <view><text class="header-eyebrow">PROJECT SERVICES</text><text class="header-title">项目整合与企业服务</text></view>
      <view class="header-link" @tap="goCart"><image src="/static/icons/tab/mall.svg" mode="aspectFit"/><text>购物车</text></view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-row">
      <view class="search-box" :class="{ focused: searchFocused }">
        <image class="search-icon" src="/static/icons/search.svg" mode="aspectFit"/>
        <input class="search-input" v-model="keyword" :placeholder="t('mall.searchPlaceholder')" @confirm="doSearch" @focus="searchFocused = true" @blur="searchFocused = false"/>
        <text class="search-clear" v-if="keyword" @tap="clearSearch">✕</text>
      </view>
      <text class="search-btn" @tap="doSearch">{{ t('common.search') }}</text>
    </view>

    <view class="mall-intro">
      <view><text class="intro-kicker">SERVICE DESK</text><text class="intro-title">选择适合当前阶段的服务</text><text class="intro-desc">先看服务范围、交付内容与起步价格，再决定是否沟通</text></view>
      <text class="intro-count">{{ productList.length }}<text>项</text></text>
    </view>

    <scroll-view class="offer-scroll" scroll-x show-scrollbar="false">
      <view class="offer-row">
        <view v-for="offer in serviceOffers" :key="offer.title" class="offer-item" @tap="searchOffer(offer)">
          <text class="offer-label">{{ offer.label }}</text><text class="offer-title">{{ offer.title }}</text><text class="offer-desc">{{ offer.desc }}</text><text class="offer-price">{{ offer.price }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 热门搜索 -->
    <view class="hot-tags" v-if="!keyword && searchHistory.length">
      <text class="hot-title">{{ t('listPage.searchHistory') }}</text>
      <view class="tags-wrap">
        <text class="hot-tag" v-for="(h, i) in searchHistory.slice(0, 5)" :key="i" @tap="useHistory(h)">{{ h }}</text>
      </view>
    </view>

    <!-- 分类 -->
    <scroll-view scroll-x class="cat-scroll">
      <view class="cat-list">
        <view class="cat-item card-press" :class="{ active: !currentType }" @tap="selectType(null)"><text>{{ t('common.all') }}</text></view>
        <view class="cat-item card-press" :class="{ active: currentType === t }" v-for="(label, t) in serviceTypes" :key="t" @tap="selectType(t)">
          <text>{{ label }}</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view scroll-x class="sort-scroll">
      <view class="sort-list">
        <view class="sort-label">{{ t('mall.sortBy') }}</view>
        <view class="sort-item card-press" v-for="option in sortOptions" :key="option.value"
          :class="{ active: currentSort === option.value }" @tap="selectSort(option.value)">
          <text>{{ option.label }}</text>
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

      <view v-else-if="listError && !productList.length" class="list-error" @tap="retryList">
        <text class="error-title">服务列表暂时没加载出来</text><text class="error-action">点击重试</text>
      </view>

      <view class="product-grid" :class="{ 'animate-in': animated }" v-else>
        <view class="product-item card-press" v-for="(item, idx) in productList" :key="item._id" @tap="goDetail(item._id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.06) + 's' }">
          <view class="product-icon-box" :class="'type-' + item.service_type">
            <image class="product-icon" :src="'/static/icons/service/' + item.service_type + '.svg'" mode="aspectFit" lazy-load/>
          </view>
          <view class="product-copy">
            <text class="product-type">{{ serviceTypes[item.service_type] }}</text>
            <text class="product-title">{{ item.title }}</text>
            <text class="product-proof">{{ item.sale_count }}{{ t('mallDetail.boughtSuffix') }} · 订单与进度可查询</text>
          </view>
          <view class="price-row"><text class="price-current">¥{{ (item.price / 100).toFixed(0) }}</text><text class="price-market">¥{{ (item.market_price / 100).toFixed(0) }}</text><text class="detail-arrow">→</text></view>
        </view>
      </view>

      <view v-if="loading && productList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="noMore && productList.length" class="end"><text>— {{ t('listPage.noMore') }} —</text></view>
      <view v-if="!productList.length && !loading" class="empty">
        <view class="empty-icon"><image src="/static/icons/tab/mall.svg" mode="aspectFit" /></view>
        <text class="empty-text">{{ t('listPage.emptyProduct') }}</text>
        <text class="empty-hint" v-if="keyword" @tap="clearSearch">{{ t('listPage.clearSearch') }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { serviceTypes } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { t } from '@/i18n'
import { a11yStyle } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.mall')

const currentType = ref(null)
const currentSort = ref('latest')
const keyword = ref('')
const searchFocused = ref(false)
const searchHistory = ref([])
const animated = ref(true)
const serviceOffers = [
  { label: 'START', title: '单项合作对接', desc: '适合目标和交付明确的项目', price: '¥1,999 起', keyword: '项目' },
  { label: 'GROWTH', title: '业务资源拓展', desc: '适合寻找客户、渠道与供应链', price: '¥5,999 起', keyword: '企业' },
  { label: 'CAPITAL', title: '融资资源沟通', desc: '适合材料齐备、方向明确的项目', price: '¥19,999 起', keyword: '投资人' }
]
const sortOptions = computed(() => [
  { value: 'latest', label: t('mall.sortLatest') },
  { value: 'sales', label: t('mall.sortSales') },
  { value: 'newest', label: t('mall.sortNewest') },
  { value: 'price_asc', label: t('mall.sortPriceAsc') },
  { value: 'price_desc', label: t('mall.sortPriceDesc') }
])
const { list: productList, loading, refreshing, noMore, error: listError, retry: retryList, load: loadList, loadMore, refresh } = useList(
  async (p) => {
    const res = await bridge.product.list({ ...p, service_type: currentType.value, sort: currentSort.value })
    if (keyword.value) {
      const kw = keyword.value.toLowerCase()
      res.list = res.list.filter(it => it.title.toLowerCase().includes(kw) || serviceTypes.value[it.service_type]?.toLowerCase().includes(kw))
    }
    return res
  },
  10
)

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

function onRefresh() { refresh() }
function selectType(t) { currentType.value = t; loadList(true) }
function selectSort(sort) { currentSort.value = sort; loadList(true) }
function goDetail(id) { uni.navigateTo({ url: `/pages/mall/detail?id=${id}` }) }
function goCart() { uni.navigateTo({ url: '/pages/cart/index' }) }

function doSearch() { saveHistory(keyword.value); loadList(true) }
function clearSearch() { keyword.value = ''; loadList(true) }
function useHistory(h) { keyword.value = h; doSearch() }
function searchOffer(offer) { keyword.value = offer.keyword; doSearch() }
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; min-height: 100vh; height: 100vh; overflow: hidden; box-sizing: border-box; padding: 18rpx 24rpx 0; color: #303B57; background: #F5F7FB; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header { padding: 0 0 16rpx; }
.header-eyebrow { display: block; color: #A0AABD; font-family: monospace; font-size: 17rpx; font-weight: 700; letter-spacing: .1em; }
.header-title { display: block; margin-top: 7rpx; color: #303B57; font-size: 42rpx; font-weight: 760; letter-spacing: -.04em; }
.search-row { display: flex; align-items: center; margin-bottom: 18rpx; }
.search-box { flex: 1; display: flex; align-items: center; height: 74rpx; border: 1rpx solid #E7EBF2; border-radius: 21rpx; padding: 0 20rpx; background: #FFF; box-shadow: 0 8rpx 24rpx rgba(70,87,123,.035); }
.search-box.focused { border-color: #AEB7ED; box-shadow: 0 0 0 5rpx rgba(101,115,220,.08); }
.search-icon { display: block; width: 34rpx; height: 34rpx; flex: 0 0 34rpx; object-fit: contain; opacity: .76; }
.search-input { flex: 1; margin: 0 12rpx; color: #303B57; font-size: 25rpx; }
.search-clear { padding: 4rpx; color: #A0AABD; font-size: 24rpx; }
.search-btn { margin-left: 18rpx; color: #6573DC; font-size: 24rpx; font-weight: 650; }
.mall-intro { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; padding: 19rpx 20rpx; border: 1rpx solid #E6EAF3; border-radius: 21rpx; background: linear-gradient(135deg, #F2F4FF, #FFF); }
.intro-title { display: block; color: #4B5872; font-size: 26rpx; font-weight: 700; }
.intro-desc { display: block; margin-top: 6rpx; color: #98A4B7; font-size: 19rpx; }
.intro-mark { display: flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; border-radius: 19rpx; background: #EEF0FF; }
.intro-mark image { display: block; width: 34rpx; height: 34rpx; object-fit: contain; opacity: .82; }
.hot-tags { margin: 0 0 14rpx; }
.hot-title { display: block; margin-bottom: 8rpx; color: #A0AABD; font-size: 18rpx; font-weight: 700; letter-spacing: .05em; }
.tags-wrap { display: flex; flex-wrap: wrap; }
.hot-tag { margin-right: 8rpx; padding: 7rpx 13rpx; border: 1rpx solid #E4E8F0; border-radius: 9rpx; color: #7C899D; background: #FFF; font-size: 19rpx; }
.cat-scroll { padding: 0 0 16rpx; }
.cat-list { display: flex; }
.cat-item { margin-right: 10rpx; padding: 10rpx 16rpx; border: 1rpx solid #E4E8F0; border-radius: 11rpx; color: #7A879B; background: #FFF; font-size: 21rpx; white-space: nowrap; }
.cat-item.active { border-color: #D7DBF7; color: #5D6BD2; background: #EEF0FF; font-weight: 650; }
.sort-scroll { margin: -2rpx 0 16rpx; }
.sort-list { display: flex; align-items: center; }
.sort-label { flex: 0 0 auto; margin-right: 10rpx; color: #A0AABD; font-size: 19rpx; }
.sort-item { flex: 0 0 auto; margin-right: 8rpx; padding: 8rpx 14rpx; border: 1rpx solid #E4E8F0; border-radius: 10rpx; color: #7A879B; background: #FFF; font-size: 19rpx; white-space: nowrap; }
.sort-item.active { border-color: #D7DBF7; color: #5D6BD2; background: #EEF0FF; font-weight: 650; }
.list-scroll { flex: 1; min-height: 0; height: auto; padding-bottom: calc(130rpx + env(safe-area-inset-bottom)); }
.skeleton-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.skeleton-item { width: calc(50% - 6rpx); border: 1rpx solid #E7EBF2; border-radius: 20rpx; padding: 20rpx; background: #FFF; }
.skeleton-icon { width: 72rpx; height: 72rpx; border-radius: 18rpx; margin-bottom: 12rpx; background: #EEF1F6; animation: pulse 1.5s infinite; }
.skeleton-title { width: 80%; height: 28rpx; border-radius: 8rpx; margin-bottom: 8rpx; background: #EEF1F6; animation: pulse 1.5s infinite; }
.skeleton-price { width: 50%; height: 24rpx; border-radius: 8rpx; background: #EEF1F6; animation: pulse 1.5s infinite; }
.product-grid { display: flex; flex-wrap: wrap; gap: 12rpx; opacity: 0; }
.animate-in { opacity: 1; transition: opacity .5s ease-out; }
.product-item { width: calc(50% - 6rpx); border: 1rpx solid #E7EBF2; border-radius: 20rpx; padding: 18rpx; background: #FFF; box-shadow: 0 8rpx 22rpx rgba(70,87,123,.035); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp .4s ease-out both; }
.product-icon-box { display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; margin-bottom: 12rpx; border-radius: 18rpx; }
.type-member { background: #FFF0ED; }.type-linker { background: #EEF0FF; }.type-survey { background: #E7F8F0; }.type-resource_pack { background: #FFF5DF; }.type-certification { background: #FCECF6; }
.product-icon { display: block; width: 44rpx; height: 44rpx; object-fit: contain; }
.product-title { display: -webkit-box; min-height: 42rpx; overflow: hidden; margin-bottom: 4rpx; color: #4D5A73; font-size: 22rpx; font-weight: 700; line-height: 1.35; text-overflow: ellipsis; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.product-type { display: block; margin-bottom: 12rpx; color: #9AA6B8; font-size: 18rpx; }
.price-row { display: flex; align-items: baseline; margin-bottom: 8rpx; }
.price-current { color: #E4745F; font-size: 30rpx; font-weight: 800; }
.price-market { color: #A0AABD; font-size: 18rpx; text-decoration: line-through; }
.sales-tag { display: inline-flex; padding: 4rpx 10rpx; border-radius: 8rpx; background: #E7F8F0; }
.sales-tag text { color: #39A879; font-size: 17rpx; }
.loading, .end { padding: 32rpx; color: #9AA6B8; font-size: 22rpx; text-align: center; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 64rpx 24rpx; }
.empty-icon { display: flex; align-items: center; justify-content: center; width: 86rpx; height: 86rpx; margin-bottom: 16rpx; border-radius: 28rpx; background: #EEF0FF; }
.empty-icon image { display: block; width: 38rpx; height: 38rpx; object-fit: contain; opacity: .66; }
.empty-text { display: block; margin-bottom: 16rpx; color: #7D899D; font-size: 27rpx; }
.empty-hint { color: #6573DC; font-size: 23rpx; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }

/* Quiet Intelligence: 商城以交付信息为主，不再使用彩色双列电商卡片。 */
.page { color: #25231F; background: #F7F6F2; padding-inline: 28rpx; }
.header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 21rpx; }
.header-eyebrow { color: #8A847B; font-size: 15rpx; font-weight: 500; letter-spacing: .15em; }
.header-title { color: #191816; font-family: "Songti SC", "STSong", serif; font-size: 45rpx; font-weight: 500; letter-spacing: -.02em; }
.header-link { display: flex; align-items: center; gap: 7rpx; height: 56rpx; padding: 0 15rpx; border: 1rpx solid rgba(30,27,22,.12); border-radius: 8rpx; color: #5C2828; background: #FCFBF8; }
.header-link image { width: 25rpx; height: 25rpx; opacity: .85; }
.header-link text { font-size: 19rpx; font-weight: 600; }
.search-row { margin-bottom: 22rpx; }
.search-box { height: 76rpx; border-color: rgba(30,27,22,.11); border-radius: 8rpx; background: #FCFBF8; box-shadow: none; }
.search-box.focused { border-color: #69574A; box-shadow: 0 0 0 4rpx rgba(105,87,74,.08); }
.search-input { color: #25231F; }
.search-btn, .empty-hint, .error-action { color: #5C2828; }
.mall-intro { margin-bottom: 20rpx; padding: 24rpx 2rpx; border-width: 1rpx 0; border-color: rgba(30,27,22,.12); border-radius: 0; background: transparent; }
.intro-kicker { display: block; margin-bottom: 7rpx; color: #9A7C57; font-family: monospace; font-size: 14rpx; letter-spacing: .14em; }
.intro-title { color: #25231F; font-family: "Songti SC", "STSong", serif; font-size: 30rpx; font-weight: 500; }
.intro-desc { color: #7B766E; font-size: 18rpx; }
.intro-count { color: #5C2828; font-family: Georgia, serif; font-size: 38rpx; }
.intro-count text { margin-left: 3rpx; color: #8A847B; font-family: inherit; font-size: 16rpx; }
.offer-scroll { margin: 0 -28rpx 20rpx; padding: 0 28rpx; white-space: nowrap; }
.offer-row { display: inline-flex; border-top: 1rpx solid rgba(30,27,22,.1); border-bottom: 1rpx solid rgba(30,27,22,.1); }
.offer-item { width: 232rpx; padding: 20rpx 22rpx 18rpx 0; white-space: normal; }
.offer-item + .offer-item { padding-left: 22rpx; border-left: 1rpx solid rgba(30,27,22,.09); }
.offer-label, .offer-title, .offer-desc, .offer-price { display: block; }
.offer-label { color: #b5a07a; font-family: monospace; font-size: 13rpx; letter-spacing: .11em; }
.offer-title { margin-top: 9rpx; color: #25231f; font-family: "Songti SC", "STSong", serif; font-size: 22rpx; }
.offer-desc { margin-top: 6rpx; color: #979189; font-size: 15rpx; }
.offer-price { margin-top: 8rpx; color: #5c2828; font-family: Georgia, serif; font-size: 20rpx; }
.hot-title { color: #8A847B; font-weight: 500; }
.hot-tag { border-color: rgba(30,27,22,.1); border-radius: 6rpx; color: #6F6B63; background: transparent; }
.cat-scroll { padding-bottom: 13rpx; border-bottom: 1rpx solid rgba(30,27,22,.1); }
.cat-item { padding: 10rpx 16rpx; border: 0; border-radius: 5rpx; color: #777169; background: transparent; }
.cat-item.active { color: #FCFBF8; background: #5C2828; font-weight: 500; }
.sort-scroll { margin: 0 0 18rpx; padding-top: 12rpx; }
.sort-label { color: #9A958D; }
.sort-item { padding: 7rpx 12rpx; border: 0; border-radius: 4rpx; color: #817B73; background: transparent; }
.sort-item.active { color: #5C2828; background: #EEE9E2; font-weight: 600; }
.skeleton-grid, .product-grid { display: flex; flex-direction: column; gap: 0; }
.skeleton-item { width: 100%; margin-bottom: 10rpx; border-color: rgba(30,27,22,.09); border-radius: 8rpx; background: #FCFBF8; }
.product-item { display: flex; align-items: center; width: 100%; min-height: 118rpx; margin-bottom: 10rpx; padding: 20rpx; border-color: rgba(30,27,22,.1); border-radius: 8rpx; background: #FCFBF8; box-shadow: none; }
.product-icon-box, .type-member, .type-linker, .type-survey, .type-resource_pack, .type-certification { flex: 0 0 68rpx; width: 68rpx; height: 68rpx; margin: 0 18rpx 0 0; border: 1rpx solid rgba(105,87,74,.12); border-radius: 7rpx; background: #F0EEE8; }
.product-icon { width: 36rpx; height: 36rpx; filter: saturate(.35) sepia(.12); opacity: .78; }
.product-copy { min-width: 0; flex: 1; }
.product-type { margin: 0 0 5rpx; color: #9A7C57; font-family: monospace; font-size: 15rpx; letter-spacing: .08em; }
.product-title { min-height: 0; margin: 0; color: #292622; font-family: "Songti SC", "STSong", serif; font-size: 25rpx; font-weight: 600; line-height: 1.42; }
.product-proof { display: block; margin-top: 7rpx; color: #99938A; font-size: 16rpx; }
.price-row { flex: 0 0 auto; flex-direction: column; align-items: flex-end; margin: 0 0 0 16rpx; }
.price-current { color: #5C2828; font-family: Georgia, serif; font-size: 29rpx; font-weight: 500; }
.price-market { margin-top: 2rpx; color: #AAA49C; font-size: 15rpx; }
.detail-arrow { margin-top: 8rpx; color: #69574A; font-size: 22rpx; }
.list-error { display: flex; flex-direction: column; align-items: center; padding: 70rpx 24rpx; border: 1rpx solid rgba(30,27,22,.1); border-radius: 8rpx; background: #FCFBF8; }
.error-title { color: #565149; font-size: 23rpx; }
.error-action { margin-top: 9rpx; font-size: 19rpx; }
.empty-icon { border: 1rpx solid rgba(30,27,22,.1); border-radius: 8rpx; background: #FCFBF8; }
.empty-text { color: #777169; }

@media (min-width: 561px) {
  .product-item { min-height: 104px; padding: 20px 22px; }
  .product-icon-box, .type-member, .type-linker, .type-survey, .type-resource_pack, .type-certification { flex-basis: 58px; width: 58px; height: 58px; margin-right: 18px; }
  .product-icon { width: 30px; height: 30px; }
  .product-title { font-size: 18px; }
  .product-proof { font-size: 12px; }
}

/* 服务页以“交付目录”呈现：价格、范围和入口一眼可比较。 */
.product-grid {
  gap: 0;
  border-top: 1rpx solid rgba(30,27,22,.10);
}
.product-item {
  min-height: 126rpx;
  margin: 0;
  padding: 24rpx 4rpx;
  border: 0;
  border-bottom: 1rpx solid rgba(30,27,22,.09);
  border-radius: 0;
  background: transparent;
}
.product-item:active { padding-right: 12rpx; border-color: rgba(92,40,40,.30); background: #f0eee8; box-shadow: none; }
.product-icon-box,
.type-member,
.type-linker,
.type-survey,
.type-resource_pack,
.type-certification {
  width: 60rpx;
  height: 60rpx;
  flex-basis: 60rpx;
  margin-right: 16rpx;
  border-radius: 4rpx;
  background: #f0eee8;
}
.product-title { font-size: 26rpx; font-weight: 500; }
.product-proof { max-width: 330rpx; }
.price-row { min-width: 112rpx; padding-left: 12rpx; border-left: 1rpx solid rgba(30,27,22,.09); }
.price-current { letter-spacing: -.02em; }
.detail-arrow { color: #5c2828; }
</style>
