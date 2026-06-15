<template>
  <view class="page">
    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input class="search-input" v-model="keyword" :placeholder="placeholder" confirm-type="search" @confirm="doSearch" :focus="true" />
        <text class="clear-btn" v-if="keyword" @tap="clearKeyword">✕</text>
      </view>
      <text class="search-btn" @tap="doSearch">搜索</text>
    </view>

    <!-- 搜索结果 -->
    <view v-if="searched" class="result-section">
      <view class="result-summary">
        <text>共找到 {{ result.total }} 条结果</text>
      </view>

      <block v-if="result.total">
        <!-- 需求结果 -->
        <view v-if="result.demands.length" class="result-group">
          <text class="group-title">📌 需求 ({{ result.demands.length }})</text>
          <view class="result-item card-press" v-for="item in result.demands" :key="item._id" @tap="goDemand(item._id)">
            <text class="ri-title">{{ item.title }}</text>
            <view class="ri-meta">
              <text class="ri-tag">{{ item.category_name }}</text>
              <text class="ri-stat">👁 {{ item.view_count }} · 🤝 {{ item.lead_count }}</text>
            </view>
          </view>
        </view>

        <!-- 服务结果 -->
        <view v-if="result.products.length" class="result-group">
          <text class="group-title">🛍️ 服务 ({{ result.products.length }})</text>
          <view class="result-item card-press" v-for="item in result.products" :key="item._id" @tap="goProduct(item._id)">
            <view class="ri-row">
              <text class="ri-title">{{ item.title }}</text>
              <text class="ri-price">¥{{ (item.price / 100).toFixed(0) }}</text>
            </view>
            <text class="ri-stat">销量 {{ item.sale_count }}</text>
          </view>
        </view>

        <!-- 帖子结果 -->
        <view v-if="result.posts.length" class="result-group">
          <text class="group-title">💬 社区 ({{ result.posts.length }})</text>
          <view class="result-item card-press" v-for="item in result.posts" :key="item._id" @tap="goPost(item._id)">
            <text class="ri-content">{{ item.content.slice(0, 50) }}...</text>
            <text class="ri-stat">❤️ {{ item.like_count }} · 💬 {{ item.comment_count }}</text>
          </view>
        </view>
      </block>

      <view v-else class="empty-result">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">未找到「{{ searchedKeyword }}」相关内容</text>
      </view>
    </view>

    <!-- 搜索引导（未搜索时） -->
    <view v-else>
      <!-- 搜索历史 -->
      <view v-if="history.length" class="suggest-section">
        <view class="suggest-header">
          <text class="suggest-title">搜索历史</text>
          <text class="suggest-clear" @tap="clearHistory">清空</text>
        </view>
        <view class="tag-list">
          <view class="tag-item" v-for="(h, i) in history" :key="i" @tap="quickSearch(h)"><text>{{ h }}</text></view>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view class="suggest-section">
        <text class="suggest-title">🔥 热门搜索</text>
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
import { ref, onMounted } from 'vue'
import { searchService } from '@/mock/service'

const keyword = ref('')
const searched = ref(false)
const searchedKeyword = ref('')
const placeholder = '搜索需求、服务、社区内容'
const history = ref([])
const hotKeywords = ref([])
const result = ref({ demands: [], products: [], posts: [], total: 0 })

onMounted(() => {
  history.value = searchService.history()
  hotKeywords.value = searchService.hotKeywords()
})

function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) { uni.showToast({ title: '请输入搜索词', icon: 'none' }); return }
  searched.value = true
  searchedKeyword.value = kw
  searchService.addHistory(kw)
  history.value = searchService.history()
  result.value = searchService.search(kw)
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

function clearHistory() {
  searchService.clearHistory()
  history.value = []
}

function goDemand(id) { uni.navigateTo({ url: '/pages/demand/detail?id=' + id }) }
function goProduct(id) { uni.navigateTo({ url: '/pages/mall/detail?id=' + id }) }
function goPost(id) { uni.navigateTo({ url: '/pages/community/detail?id=' + id }) }
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; }

.search-bar { display: flex; align-items: center; padding: 16rpx 24rpx; background: #FFFFFF; }
.search-input-wrap { flex: 1; display: flex; align-items: center; background: #F5F6FA; border-radius: 32rpx; padding: 12rpx 24rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
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
.empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
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
</style>