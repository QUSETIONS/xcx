<template>
  <view class="page">
    <view class="header"><text class="header-title">{{ t('user.myOrder') }}</text></view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !list.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view class="order-list" :class="{ 'animate-in': animated }">
        <view class="order-item card-press" v-for="(item, idx) in list" :key="item._id"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="order-top">
            <text class="order-product">{{ item.items?.[0]?.title || t('user.typeProduct') }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <view class="order-bottom">
            <text class="order-amount">¥{{ (item.total_amount / 100).toFixed(2) }}</text>
            <text class="order-time">{{ formatDate(item.created_at) }}</text>
          </view>
        </view>
      </view>
      <view v-if="loading && list.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="!list.length && !loading" class="empty">
        <image class="empty-icon" src="/static/icons/package.svg" mode="aspectFit" />
        <text class="empty-text">{{ t('user.emptyOrder') }}</text>
        <text class="empty-btn" @tap="goMall">{{ t('user.goMall') }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orderStatusMap as statusMap } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { formatDate } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.myOrders')

const animated = ref(true)
const userStore = useUserStore()
const { list, loading, refreshing, load: loadList, refresh } = useList(
  (params) => bridge.order.myOrders({ ...params, page: 1, pageSize: 100 }),
  100
)
function goMall() { uni.navigateTo({ url: '/pages/member/index' }) }
function onRefresh() { refresh() }
onMounted(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能查看订单'))) return
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
.order-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.order-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.order-product { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); flex: 1; }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-created { background: rgba(59,130,246,0.1); color: #3B82F6; }
.status-paid { background: rgba(99,102,241,0.1); color: #6366F1; }
.status-confirmed { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-serving { background: rgba(16,185,129,0.1); color: #10B981; }
.status-completed { background: rgba(16,185,129,0.15); color: #10B981; }
.status-cancelled { background: #F5F6FA; color: rgba(0,0,0,0.45); }

.order-bottom { display: flex; justify-content: space-between; align-items: center; }
.order-amount { font-size: 30rpx; font-weight: bold; color: #FF6B35; }
.order-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { width: 64rpx; height: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-btn { font-size: 24rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 12rpx 32rpx; border-radius: 24rpx; display: inline-flex; }
.loading { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }

/* 商品标题列允许缩短，状态标签和金额不会把订单卡片撑宽。 */
.header,
.order-top,
.order-bottom,
.order-item,
.order-product { min-width: 0; }
.header { flex: 0 0 auto; }
.order-product { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-tag,
.order-amount,
.order-time { flex: 0 0 auto; white-space: nowrap; }

@media (max-width: 360px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .list-scroll { padding-right: 18rpx; padding-left: 18rpx; }
  .order-item { padding-right: 16rpx; padding-left: 16rpx; }
}
</style>
