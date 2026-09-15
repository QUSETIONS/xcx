<template>
  <view class="page">
    <view class="header"><text class="header-title">{{ t('user.myFavorite') }}</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !favList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view class="fav-list" :class="{ 'animate-in': animated }">
        <view class="fav-item card-press" v-for="(item, idx) in favList" :key="item.targetId" @tap="goDetail(item)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="fav-icon-box" :class="'type-' + item.targetType">
            <image class="fav-icon" :src="'/static/icons/' + getIconName(item.targetType) + '.svg'" mode="aspectFit"/>
          </view>
          <view class="fav-info">
            <text class="fav-title">{{ item.title }}</text>
            <text class="fav-type">{{ getTypeName(item.targetType) }}</text>
          </view>
          <view class="fav-remove" @tap.stop="removeFav(item)"><text>✕</text></view>
        </view>
      </view>
      <view v-if="loading && favList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="!favList.length && !loading" class="empty">
        <image class="empty-icon" src="/static/icons/heart.svg" mode="aspectFit" />
        <text class="empty-text">{{ t('user.emptyFavorite') }}</text>
        <text class="empty-hint" @tap="goBrowse">{{ t('cartPage.goShop') }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.myFavorites')

const animated = ref(true)
const userStore = useUserStore()

const { list: favList, loading, refreshing, load: loadList, refresh } = useList(
  async (params) => {
    const res = await bridge.favorite.list({ ...params, page: 1, pageSize: 100 })
    const enriched = await Promise.all((res.list || []).map(async (f) => {
    let title = f.targetId
    if (f.targetType === 'demand') {
      try { const d = await bridge.demand.detail(f.targetId); if (d) title = d.title } catch {}
    } else if (f.targetType === 'product') {
      try { const p = await bridge.product.detail(f.targetId); if (p) title = p.title } catch {}
    } else if (f.targetType === 'post') {
      try {
        const post = await bridge.community.postDetail(f.targetId)
        if (post) title = post.content?.slice(0, 36) || '社区动态'
      } catch {}
    } else if (f.targetType === 'resource') {
      try {
        const resource = await bridge.resource.detail(f.targetId)
        if (resource) title = resource.title
      } catch {}
    }
      return { ...f, title }
    }))
    return { ...res, list: enriched }
  },
  100
)

function getIconName(type) {
  const map = { demand: 'list', product: 'mall', post: 'community', resource: 'file' }
  return map[type] || 'list'
}

function getTypeName(type) {
  const map = { demand: t('user.typeDemand'), product: t('user.typeProduct'), post: t('user.typePost'), resource: t('user.typeResource') }
  return map[type] || t('user.typeOther')
}

async function removeFav(item) {
  await bridge.favorite.toggle({ targetType: item.targetType, targetId: item.targetId })
  await loadList(true)
  uni.showToast({ title: t('user.removedFav'), icon: 'none' })
}

function goDetail(item) {
  if (item.targetType === 'demand') uni.navigateTo({ url: `/pages/demand/detail?id=${item.targetId}` })
  else if (item.targetType === 'product') uni.navigateTo({ url: `/pages/mall/detail?id=${item.targetId}` })
  else if (item.targetType === 'post') uni.navigateTo({ url: `/pages/community/detail?id=${item.targetId}` })
  else if (item.targetType === 'resource') uni.navigateTo({ url: `/pages/resource/detail?id=${item.targetId}` })
}

function goBrowse() { uni.switchTab({ url: '/pages/demand/list' }) }
function onRefresh() { refresh() }
onMounted(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能查看我的收藏'))) return
  await loadList(true)
})
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; background: #F5F6FA; padding-bottom: 120rpx; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header { padding: 24rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.list-scroll { flex: 1; min-height: 0; height: auto; padding: 0 24rpx; }
.fav-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.fav-item { margin-bottom: 12rpx; display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.fav-icon-box { width: 60rpx; height: 60rpx; border-radius: 15rpx; display: flex; align-items: center; justify-content: center; }
.type-demand { background: rgba(255,107,53,0.1); }
.type-product { background: rgba(99,102,241,0.1); }
.type-post { background: rgba(16,185,129,0.1); }
.fav-icon { width: 33rpx; height: 33rpx; object-fit: contain; opacity: .82; }

.fav-info { flex: 1; }
.fav-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.fav-type { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.fav-remove { width: 48rpx; height: 48rpx; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.fav-remove text { font-size: 22rpx; color: #EF4444; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { width: 64rpx; height: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-hint { font-size: 24rpx; color: #FF6B35; }
.loading { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }

/* 收藏标题列可收缩，删除按钮始终保留在卡片内部。 */
.header,
.fav-item,
.fav-info { min-width: 0; }
.header { flex: 0 0 auto; }
.fav-info { overflow: hidden; }
.fav-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fav-icon-box,
.fav-remove { flex: 0 0 auto; }

@media (max-width: 360px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .list-scroll { padding-right: 18rpx; padding-left: 18rpx; }
  .fav-item { padding-right: 16rpx; padding-left: 16rpx; }
}
</style>
