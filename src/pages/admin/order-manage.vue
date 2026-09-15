<template>
  <view class="page">
    <view class="header">
      <text class="header-title">{{ t('titles.orderManage') }}</text>
      <view class="filter-btn" :class="{ active: statusFilter }" @tap="showStatusPicker = true"><text>{{ statusFilter ? statusMap[statusFilter] : t('admin.allStatus') }}</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !filteredList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
    <view class="order-list" :class="{ 'animate-in': animated }">
      <view class="order-item card-press" v-for="(item, idx) in filteredList" :key="item._id"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }" @tap="changeStatus(item)">
          <view class="order-top">
            <text class="order-id">{{ t('admin.orderPrefix') }}{{ item._id }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <text class="order-product">{{ item.items?.[0]?.title || t('user.typeProduct') }}</text>
          <view v-if="item.remark" class="order-remark" @tap.stop="editRemark(item)"><text>订单备注：{{ item.remark }}</text></view>
          <view class="order-bottom">
            <text class="order-amount">¥{{ (item.total_amount / 100).toFixed(2) }}</text>
            <text class="order-time">{{ formatDate(item.created_at) }}</text>
          </view>
          <view class="order-action-hint"><text @tap.stop="editRemark(item)">{{ item.remark ? '编辑备注' : '添加备注' }}</text><text>点击推进状态 ›</text></view>
        </view>
      </view>
      <view v-if="loading && filteredList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="!filteredList.length && !loading" class="empty"><text>{{ t('admin.emptyOrder') }}</text></view>
    </scroll-view>

    <view v-if="showStatusPicker" class="picker-mask" @tap="showStatusPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('admin.selectStatus') }}</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: !statusFilter }" @tap="selectStatus('')"><text>{{ t('common.all') }}</text></view>
          <view class="picker-opt" :class="{ active: statusFilter === k }" v-for="(v, k) in statusMap" :key="k" @tap="selectStatus(k)"><text>{{ v }}</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderStatusMap as statusMap } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { formatDate } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
useNavTitle('titles.orderManage')

const statusFilter = ref('')
const showStatusPicker = ref(false)
const animated = ref(true)

const { list: allOrders, loading, refreshing, load: loadList, refresh } = useList(
  (params) => bridge.admin.orders.list({ ...params, page: 1, pageSize: 100, status: statusFilter.value || undefined }),
  100
)
const filteredList = computed(() => {
  let list = allOrders.value
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  return list
})

function onRefresh() { refresh() }
function selectStatus(status) {
  statusFilter.value = status
  showStatusPicker.value = false
  loadList(true)
}

async function changeStatus(item) {
  const statusOptions = ['paid', 'confirmed', 'serving', 'completed', 'cancelled'].filter(status => status !== item.status)
  const labels = statusOptions.map(status => statusMap.value[status] || status)
  uni.showActionSheet({
    itemList: labels,
    success: async ({ tapIndex }) => {
      const nextStatus = statusOptions[tapIndex]
      if (!nextStatus) return
      try {
        const updated = await bridge.admin.orders.updateStatus(item._id, nextStatus)
        if (updated) Object.assign(item, updated)
        uni.showToast({ title: t('admin.statusUpdated').replace('{status}', statusMap.value[nextStatus] || nextStatus), icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error?.message || t('common.loadFailed'), icon: 'none' })
      }
    }
  })
}

function editRemark(item) {
  uni.showModal({
    title: '编辑订单备注',
    editable: true,
    content: item.remark || '',
    placeholderText: '记录履约进度、交付信息或售后备注',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const updated = await bridge.admin.orders.updateRemark(item._id, res.content || '')
        if (updated) Object.assign(item, updated)
        uni.showToast({ title: '备注已保存', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error?.message || t('common.loadFailed'), icon: 'none' })
      }
    }
  })
}

onMounted(() => loadList(true))
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.filter-btn { padding: 10rpx 20rpx; background: #FFFFFF; border-radius: 20rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-btn.active { background: rgba(255,107,53,0.1); color: #FF6B35; }

.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; }
.order-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.order-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.order-id { font-size: 24rpx; color: rgba(0,0,0,0.5); }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-created { background: rgba(59,130,246,0.1); color: #3B82F6; }
.status-paid { background: rgba(99,102,241,0.1); color: #6366F1; }
.status-confirmed { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-serving { background: rgba(16,185,129,0.1); color: #10B981; }
.status-completed { background: rgba(16,185,129,0.15); color: #10B981; }
.status-cancelled { background: #F5F6FA; color: rgba(0,0,0,0.45); }
.order-product { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.order-remark { margin-bottom: 12rpx; padding: 10rpx 12rpx; border-radius: 10rpx; color: #8f6d2f; background: #fff8e9; font-size: 22rpx; line-height: 1.45; }
.order-bottom { display: flex; justify-content: space-between; align-items: center; }
.order-amount { font-size: 30rpx; font-weight: bold; color: #FF6B35; }
.order-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.order-action-hint { display: flex; justify-content: space-between; margin-top: 14rpx; padding-top: 12rpx; border-top: 1rpx solid #F5F6FA; color: #98A2B3; font-size: 21rpx; }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(0,0,0,0.5); }
.loading { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1200; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 24rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
/* 后台列表统一采用“固定页面 + 剩余空间滚动”，订单编号和备注不会撑破卡片。 */
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .list-scroll, .order-item, .order-top, .order-bottom, .order-action-hint { min-width: 0; }
.header { flex: 0 0 auto; gap: 14rpx; }
.header-title, .order-id, .order-product, .order-remark { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.filter-btn, .status-tag { flex: 0 0 auto; white-space: nowrap; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; box-sizing: border-box; }
.order-top, .order-bottom, .order-action-hint { gap: 12rpx; }
.order-id, .order-product, .order-time { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-remark { display: block; }
</style>
