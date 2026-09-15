<template>
  <view class="page">
    <view class="header">
      <text class="header-title">{{ t('titles.leadManage') }}</text>
      <view class="filter-btn" :class="{ active: statusFilter }" @tap="showStatusPicker = true"><text>{{ statusFilter ? statusMap[statusFilter] : t('admin.allStatus') }}</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="loading && !filteredList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view class="lead-list" :class="{ 'animate-in': animated }">
        <view class="lead-item card-press" v-for="(item, idx) in filteredList" :key="item._id" @tap="goDemand(item.demand_id)"
          :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
          <view class="lead-top">
            <text class="lead-contact">{{ item.contact_name }}</text>
            <view class="status-tag" :class="'status-' + item.status"><text>{{ statusMap[item.status] || item.status }}</text></view>
          </view>
          <text class="lead-phone">{{ item.phone }}</text>
          <text class="lead-msg" v-if="item.message">{{ item.message }}</text>
          <view class="lead-note" v-if="item.admin_note"><text>运营备注：{{ item.admin_note }}</text></view>
          <view class="lead-bottom">
            <text class="lead-demand">{{ t('admin.demandPrefix') }}{{ item.demand_title || item.demand_id }}</text>
            <text class="lead-time">{{ formatDate(item.created_at) }}</text>
          </view>
          <view class="lead-actions">
            <view class="action-btn" @tap.stop="updateStatus(item, 'contacted')"><text>{{ t('admin.contacted') }}</text></view>
            <view class="action-btn success" @tap.stop="updateStatus(item, 'deal')"><text>{{ t('admin.deal') }}</text></view>
            <view class="action-btn warn" @tap.stop="updateStatus(item, 'invalid')"><text>{{ t('admin.invalid') }}</text></view>
            <view class="action-btn note" @tap.stop="editNote(item)"><text>{{ item.admin_note ? '编辑备注' : '添加备注' }}</text></view>
          </view>
        </view>
      </view>
      <view v-if="loading && filteredList.length" class="loading"><text>{{ t('common.loading') }}</text></view>
      <view v-if="!filteredList.length && !loading" class="empty"><text>{{ t('admin.emptyLead') }}</text></view>
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
import { leadStatusMap as statusMap } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useList } from '@/hooks/useList'
import { formatDate } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
useNavTitle('titles.leadManage')

const statusFilter = ref('')
const showStatusPicker = ref(false)
const animated = ref(true)

const { list: allLeads, loading, refreshing, load: loadList, refresh } = useList(
  (params) => bridge.admin.leads.list({ ...params, page: 1, pageSize: 100, status: statusFilter.value || undefined }),
  100
)
const filteredList = computed(() => {
  let list = allLeads.value
  if (statusFilter.value) list = list.filter(l => l.status === statusFilter.value)
  return list
})

function onRefresh() { refresh() }
function selectStatus(status) {
  statusFilter.value = status
  showStatusPicker.value = false
  loadList(true)
}
onMounted(() => loadList(true))
function goDemand(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }
async function updateStatus(item, newStatus) {
  try {
    const updated = await bridge.admin.leads.updateStatus(item._id, newStatus)
    if (updated) Object.assign(item, updated)
    uni.showToast({ title: t('admin.statusUpdated').replace('{status}', statusMap.value[newStatus]), icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || t('common.loadFailed'), icon: 'none' })
  }
}
function editNote(item) {
  uni.showModal({
    title: '编辑运营备注',
    editable: true,
    content: item.admin_note || '',
    placeholderText: '记录跟进重点、处理结果或下一步动作',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const updated = await bridge.admin.leads.updateNote(item._id, res.content || '')
        if (updated) Object.assign(item, updated)
        uni.showToast({ title: '备注已保存', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error?.message || t('common.loadFailed'), icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 120rpx; }
.header { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.filter-btn { padding: 10rpx 20rpx; background: #FFFFFF; border-radius: 20rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-btn.active { background: rgba(255,107,53,0.1); color: #FF6B35; }

.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; }
.lead-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.lead-item { margin-bottom: 12rpx; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }

.lead-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.lead-contact { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-new { background: rgba(59,130,246,0.1); color: #3B82F6; }
.status-contacted { background: rgba(245,158,11,0.1); color: #F59E0B; }
.status-deal { background: rgba(16,185,129,0.1); color: #10B981; }
.status-invalid { background: #F5F6FA; color: rgba(0,0,0,0.45); }
.lead-phone { font-size: 24rpx; color: rgba(0,0,0,0.6); display: block; margin-bottom: 8rpx; }
.lead-msg { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 8rpx; line-height: 1.4; }
.lead-bottom { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.lead-demand { font-size: 22rpx; color: rgba(0,0,0,0.5); }
.lead-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.lead-actions { display: flex; flex-wrap: wrap; gap: 8rpx; padding-top: 12rpx; border-top: 1rpx solid #F5F6FA; }
.action-btn { padding: 8rpx 16rpx; background: #F5F6FA; border-radius: 12rpx; font-size: 22rpx; color: rgba(0,0,0,0.6); }
.action-btn.success { background: rgba(16,185,129,0.1); color: #10B981; }
.action-btn.warn { background: #F5F6FA; color: rgba(0,0,0,0.45); }
.action-btn.note { background: #eef0ff; color: #6372d8; }
.lead-note { display: block; margin-bottom: 10rpx; padding: 10rpx 12rpx; border-radius: 10rpx; color: #8f6d2f; background: #fff8e9; font-size: 22rpx; line-height: 1.45; }
.empty { text-align: center; padding: 64rpx; font-size: 28rpx; color: rgba(0,0,0,0.5); }
.loading { text-align: center; padding: 32rpx; font-size: 24rpx; color: rgba(0,0,0,0.5); }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1200; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 24rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
/* 后台列表统一采用“固定页面 + 剩余空间滚动”，操作按钮和长文本按内容收缩。 */
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .list-scroll, .lead-item, .lead-top, .lead-bottom { min-width: 0; }
.header { flex: 0 0 auto; gap: 14rpx; }
.header-title, .lead-contact, .lead-demand, .lead-msg, .lead-note { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.filter-btn, .status-tag, .action-btn { flex: 0 0 auto; white-space: nowrap; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; box-sizing: border-box; }
.lead-top, .lead-bottom { gap: 12rpx; }
.lead-contact, .lead-demand, .lead-time { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lead-msg, .lead-note { display: block; }
.lead-actions { max-width: 100%; }
</style>
