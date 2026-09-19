<template>
  <view class="page">
    <view class="header"><text class="title">活动管理</text><view class="add-btn" @tap="goAdd">+ 新增</view></view>
    <scroll-view class="list-scroll" scroll-y>
      <view v-for="item in list" :key="item._id" class="item">
        <view class="item-head"><text class="item-title">{{ item.title }}</text><text class="item-tag">{{ item.tag || typeLabel(item.type) }}</text></view>
        <text class="item-desc">{{ item.desc_text || item.desc }}</text>
        <view class="item-meta"><text>{{ item.city || '不限城市' }}</text><text>{{ item.starts_at || '时间待定' }}</text><text :class="item.status">{{ item.status === 'active' ? '上架中' : '已下架' }}</text><view class="actions"><text @tap="edit(item)">编辑</text><text class="danger" @tap="remove(item)">下架</text></view></view>
      </view>
      <view v-if="!list.length" class="empty">暂无活动</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.campaignManage')

const list = ref([])
async function load() { list.value = await bridge.admin.campaigns.list() || [] }
onMounted(load)
function goAdd() { uni.navigateTo({ url: '/pages/admin/campaign-edit' }) }
function edit(item) { uni.navigateTo({ url: `/pages/admin/campaign-edit?id=${item._id}` }) }
function typeLabel(type) { return ({ event: '活动', offline: '线下', online: '线上', coupon: '权益', member: '会员', invite: '邀请', task: '任务', rank: '榜单', discount: '优惠' })[type] || '活动' }
function remove(item) {
  uni.showModal({ title: '确认下架', content: `确定下架「${item.title}」吗？下架后公开端不再展示。`, success: async ({ confirm }) => {
    if (!confirm) return
    try { await bridge.admin.campaigns.delete(item._id); await load(); uni.showToast({ title: '已下架', icon: 'success' }) }
    catch (error) { uni.showToast({ title: error?.message || '操作失败', icon: 'none' }) }
  }})
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding-bottom: 80rpx; background: #F5F6FA; }.header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; }.title { color: rgba(0,0,0,.85); font-size: 36rpx; font-weight: 700; }.add-btn { padding: 12rpx 22rpx; border-radius: 20rpx; color: #fff; background: #FF6B35; font-size: 24rpx; }.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; box-sizing: border-box; }.item { margin-bottom: 16rpx; padding: 20rpx; border-radius: 20rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }.item-head { display: flex; align-items: center; justify-content: space-between; }.item-title { color: rgba(0,0,0,.85); font-size: 29rpx; font-weight: 700; }.item-tag { padding: 4rpx 14rpx; border-radius: 10rpx; color: #B45309; background: #FEF3C7; font-size: 20rpx; }.item-desc { display: block; margin-top: 10rpx; color: rgba(0,0,0,.55); font-size: 24rpx; }.item-meta { display: flex; align-items: center; margin-top: 14rpx; color: rgba(0,0,0,.48); font-size: 22rpx; gap: 14rpx; }.item-meta .active { color: #10B981; }.item-meta .disabled { color: #98A2B3; }.actions { display: flex; gap: 16rpx; margin-left: auto; }.actions text { padding: 7rpx 14rpx; border-radius: 10rpx; color: #5968D8; background: #EEF0FF; }.actions .danger { color: #EF4444; background: #FFF0F0; }.empty { padding: 80rpx; color: rgba(0,0,0,.45); text-align: center; font-size: 28rpx; }
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .list-scroll, .item, .item-head, .item-meta, .actions { min-width: 0; }
.header { flex: 0 0 auto; gap: 14rpx; }
.title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.add-btn, .actions text { flex: 0 0 auto; white-space: nowrap; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; }
.item-head > .item-title { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-desc, .item-meta text { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.item-meta { flex-wrap: wrap; }
.actions { flex-wrap: wrap; }
</style>
