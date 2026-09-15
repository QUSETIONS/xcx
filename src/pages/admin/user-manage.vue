<template>
  <view class="page">
    <view class="header"><view><text class="title">用户管理</text><text class="subtitle">查看账号状态与后台角色</text></view><view class="filter" @tap="pickFilter"><text>{{ filterLabel }}⌄</text></view></view>
    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-for="item in list" :key="item._id" class="user-card">
        <view class="user-main"><view class="avatar">{{ (item.nickname || '用').slice(0, 1) }}</view><view class="user-copy"><text class="nickname">{{ item.nickname || '未命名用户' }}</text><text class="company">{{ item.company || '未填写企业' }} · {{ item.phone || '未绑定手机' }}</text></view><text class="status" :class="item.status">{{ item.status === 'active' ? '正常' : '已禁用' }}</text></view>
        <view class="user-bottom"><text class="role">{{ item.role === 'admin' ? '管理员' : item.role === 'provider' ? '服务商' : '普通用户' }}</text><text class="created">{{ formatDate(item.created_at) }}</text><view class="actions"><text @tap="toggleStatus(item)">{{ item.status === 'active' ? '禁用' : '启用' }}</text><text v-if="item.role !== 'provider'" @tap="toggleRole(item)">{{ item.role === 'admin' ? '取消管理员' : '设为管理员' }}</text></view></view>
      </view>
      <view v-if="!list.length" class="empty">暂无用户</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { formatDate } from '@/utils/util'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.userManage')

const list = ref([])
const refreshing = ref(false)
const roleFilter = ref('')
const filterLabel = computed(() => roleFilter.value === 'admin' ? '管理员' : '全部角色')
async function load() { const res = await bridge.admin.users.list({ page: 1, pageSize: 100, role: roleFilter.value || undefined }); list.value = res.list || [] }
async function onRefresh() { refreshing.value = true; await load(); refreshing.value = false }
onMounted(load)
function pickFilter() {
  uni.showActionSheet({ itemList: ['全部角色', '管理员', '普通用户', '服务商'], success: async ({ tapIndex }) => { roleFilter.value = ['', 'admin', 'user', 'provider'][tapIndex]; await load() } })
}
async function toggleStatus(item) {
  const next = item.status === 'active' ? 'disabled' : 'active'
  try { const updated = await bridge.admin.users.updateStatus(item._id, next); if (updated) Object.assign(item, updated); uni.showToast({ title: next === 'active' ? '账号已启用' : '账号已禁用', icon: 'success' }) }
  catch (error) { uni.showToast({ title: error?.message || '操作失败', icon: 'none' }) }
}
async function toggleRole(item) {
  const next = item.role === 'admin' ? 'user' : 'admin'
  try { const updated = await bridge.admin.users.updateRole(item._id, next); if (updated) Object.assign(item, updated); uni.showToast({ title: next === 'admin' ? '已设为管理员' : '已取消管理员', icon: 'success' }) }
  catch (error) { uni.showToast({ title: error?.message || '操作失败', icon: 'none' }) }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding-bottom: 80rpx; background: #F5F6FA; }.header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; }.title { display: block; color: rgba(0,0,0,.85); font-size: 36rpx; font-weight: 700; }.subtitle { display: block; margin-top: 6rpx; color: rgba(0,0,0,.42); font-size: 22rpx; }.filter { padding: 12rpx 18rpx; border-radius: 18rpx; color: #5968D8; background: #EEF0FF; font-size: 23rpx; }.list-scroll { height: calc(100vh - 110rpx); padding: 0 24rpx; box-sizing: border-box; }.user-card { margin-bottom: 14rpx; padding: 20rpx; border-radius: 18rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }.user-main, .user-bottom { display: flex; align-items: center; }.avatar { display: flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; margin-right: 14rpx; border-radius: 18rpx; color: #5968D8; background: #EEF0FF; font-size: 28rpx; font-weight: 700; }.user-copy { flex: 1; min-width: 0; }.nickname, .company { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.nickname { color: rgba(0,0,0,.82); font-size: 28rpx; font-weight: 700; }.company { margin-top: 6rpx; color: rgba(0,0,0,.45); font-size: 21rpx; }.status { padding: 6rpx 12rpx; border-radius: 10rpx; color: #10B981; background: rgba(16,185,129,.1); font-size: 20rpx; }.status.disabled { color: #EF4444; background: #FFF0F0; }.user-bottom { margin-top: 16rpx; padding-top: 14rpx; border-top: 1rpx solid #F1F2F5; }.role { color: #FF6B35; font-size: 22rpx; }.created { margin-left: 14rpx; color: rgba(0,0,0,.35); font-size: 20rpx; }.actions { display: flex; gap: 12rpx; margin-left: auto; }.actions text { padding: 7rpx 12rpx; border-radius: 10rpx; color: #5968D8; background: #EEF0FF; font-size: 20rpx; }.empty { padding: 80rpx; color: rgba(0,0,0,.45); text-align: center; font-size: 28rpx; }
/* 后台列表统一采用“固定页面 + 剩余空间滚动”，用户信息和操作列不再互相挤压。 */
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .list-scroll, .user-card, .user-main, .user-bottom, .user-copy, .actions { min-width: 0; }
.header { flex: 0 0 auto; gap: 14rpx; }
.header > view:first-child { min-width: 0; flex: 1; overflow: hidden; }
.title, .subtitle, .company { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.filter, .status, .actions text { flex: 0 0 auto; white-space: nowrap; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; }
.user-copy { overflow: hidden; }
.user-main, .user-bottom { gap: 12rpx; }
.status { margin-left: 0; }
.user-bottom { flex-wrap: wrap; }
.created { margin-left: 0; }
.actions { flex-wrap: wrap; margin-left: auto; }
</style>
