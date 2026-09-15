<template>
  <view class="page">
    <view class="header"><text class="title">Banner 管理</text><view class="add-btn" @tap="goAdd">+ 新增</view></view>
    <scroll-view class="list-scroll" scroll-y>
      <view v-for="item in list" :key="item._id" class="banner-item">
        <view class="banner-preview"><text class="preview-mark">✦</text><view><text class="banner-title">{{ item.title }}</text><text class="banner-subtitle">{{ item.subtitle }}</text></view></view>
        <view class="banner-meta"><text>{{ typeLabel(item.type) }}</text><text :class="item.status">{{ item.status === 'active' ? '展示中' : '已停用' }}</text><view class="actions"><text @tap="edit(item)">编辑</text><text class="danger" @tap="remove(item)">删除</text></view></view>
      </view>
      <view v-if="!list.length" class="empty">暂无 Banner</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.bannerManage')

const list = ref([])
async function load() { list.value = await bridge.admin.banners.list() || [] }
onMounted(load)
function goAdd() { uni.navigateTo({ url: '/pages/admin/banner-edit' }) }
function edit(item) { uni.navigateTo({ url: `/pages/admin/banner-edit?id=${item._id}` }) }
function typeLabel(type) { return ({ demand: '需求大厅', product: '商品', resource: '资料库', publish: '发布入口', zone: '专区' })[type] || '普通链接' }
function remove(item) {
  uni.showModal({ title: '确认删除', content: `确定删除「${item.title}」吗？`, success: async ({ confirm }) => {
    if (!confirm) return
    try { await bridge.admin.banners.delete(item._id); await load(); uni.showToast({ title: '已删除', icon: 'success' }) }
    catch (error) { uni.showToast({ title: error?.message || '删除失败', icon: 'none' }) }
  }})
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding-bottom: 80rpx; background: #F5F6FA; }.header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; }.title { color: rgba(0,0,0,.85); font-size: 36rpx; font-weight: 700; }.add-btn { padding: 12rpx 22rpx; border-radius: 20rpx; color: #fff; background: #FF6B35; font-size: 24rpx; }.list-scroll { height: calc(100vh - 100rpx); padding: 0 24rpx; box-sizing: border-box; }.banner-item { margin-bottom: 16rpx; padding: 20rpx; border-radius: 20rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }.banner-preview { display: flex; align-items: center; min-height: 120rpx; padding: 22rpx; border-radius: 16rpx; color: #fff; background: linear-gradient(135deg, #202A49, #6366B8); }.preview-mark { margin-right: 18rpx; color: #FFBD86; font-size: 44rpx; }.banner-title, .banner-subtitle { display: block; }.banner-title { font-size: 29rpx; font-weight: 700; }.banner-subtitle { margin-top: 8rpx; color: rgba(255,255,255,.72); font-size: 22rpx; }.banner-meta { display: flex; align-items: center; margin-top: 14rpx; color: rgba(0,0,0,.48); font-size: 22rpx; }.banner-meta > text:nth-child(2) { margin-left: 12rpx; color: #10B981; }.banner-meta > text:nth-child(2).disabled { color: #98A2B3; }.actions { display: flex; gap: 16rpx; margin-left: auto; }.actions text { padding: 7rpx 14rpx; border-radius: 10rpx; color: #5968D8; background: #EEF0FF; }.actions .danger { color: #EF4444; background: #FFF0F0; }.empty { padding: 80rpx; color: rgba(0,0,0,.45); text-align: center; font-size: 28rpx; }
/* 后台列表统一采用“固定页面 + 剩余空间滚动”，同时允许标题和操作列在窄屏换行。 */
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .list-scroll, .banner-item, .banner-preview, .banner-meta, .actions { min-width: 0; }
.header { flex: 0 0 auto; gap: 14rpx; }
.title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.add-btn, .actions text { flex: 0 0 auto; white-space: nowrap; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; }
.banner-preview > view { min-width: 0; flex: 1; overflow: hidden; }
.banner-title, .banner-subtitle { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.banner-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.banner-subtitle { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.banner-meta { flex-wrap: wrap; gap: 8rpx 12rpx; }
.banner-meta > text:nth-child(2) { margin-left: 0; }
.actions { flex-wrap: wrap; }
</style>
