<template>
  <view class="page">
    <view class="header"><view><text class="title">分类管理</text><text class="subtitle">需求、商品、资料共用分类配置</text></view><view class="add-btn" @tap="addCategory">+ 新增</view></view>
    <scroll-view class="list-scroll" scroll-y>
      <view v-for="group in groups" :key="group.type" class="group">
        <view class="group-title"><text>{{ group.label }}</text><text>{{ group.items.length }} 个</text></view>
        <view v-for="item in group.items" :key="item.id || item._id" class="category-item">
          <image class="icon" src="/static/icons/file.svg" mode="aspectFit" /><text class="name">{{ item.name }}</text><text class="state" :class="item.status">{{ item.status === 'active' ? '启用' : '停用' }}</text>
          <text class="edit" @tap="editCategory(item)">编辑</text><text class="delete" @tap="removeCategory(item)">删除</text>
        </view>
      </view>
      <view v-if="!all.length" class="empty">暂无分类</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.categoryManage')

const all = ref([])
const typeLabels = { demand: '需求分类', product: '商品分类', resource: '资料分类' }
const groups = computed(() => Object.keys(typeLabels).map(type => ({ type, label: typeLabels[type], items: all.value.filter(item => item.type === type) })))
async function load() { all.value = await bridge.admin.categories.list({}) || [] }
onMounted(load)
async function addCategory() {
  uni.showActionSheet({ itemList: Object.values(typeLabels), success: ({ tapIndex }) => promptName(Object.keys(typeLabels)[tapIndex]) })
}
function promptName(type, item = null) {
  uni.showModal({ title: item ? '编辑分类' : `新增${typeLabels[type]}`, editable: true, content: item ? item.name : '', placeholderText: '输入分类名称', success: async ({ confirm, content }) => {
    if (!confirm || !content?.trim()) return
    try {
      if (item) await bridge.admin.categories.update(item.id || item._id, { name: content.trim() })
      else await bridge.admin.categories.create({ type, name: content.trim(), icon: 'file' })
      await load(); uni.showToast({ title: '已保存', icon: 'success' })
    } catch (error) { uni.showToast({ title: error?.message || '保存失败', icon: 'none' }) }
  }})
}
function editCategory(item) { promptName(item.type, item) }
function removeCategory(item) {
  uni.showModal({ title: '确认删除', content: `删除「${item.name}」后将不再展示，确认吗？`, success: async ({ confirm }) => {
    if (!confirm) return
    try { await bridge.admin.categories.delete(item.id || item._id); await load(); uni.showToast({ title: '已删除', icon: 'success' }) }
    catch (error) { uni.showToast({ title: error?.message || '删除失败', icon: 'none' }) }
  }})
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding-bottom: 80rpx; background: #F5F6FA; }.header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; }.title { display: block; color: rgba(0,0,0,.85); font-size: 36rpx; font-weight: 700; }.subtitle { display: block; margin-top: 6rpx; color: rgba(0,0,0,.42); font-size: 22rpx; }.add-btn { padding: 12rpx 22rpx; border-radius: 20rpx; color: #fff; background: #FF6B35; font-size: 24rpx; }.list-scroll { height: calc(100vh - 110rpx); padding: 0 24rpx; box-sizing: border-box; }.group { margin-bottom: 18rpx; padding: 18rpx; border-radius: 18rpx; background: #fff; }.group-title { display: flex; justify-content: space-between; padding-bottom: 12rpx; border-bottom: 1rpx solid #F0F1F5; color: rgba(0,0,0,.82); font-size: 25rpx; font-weight: 700; }.group-title text:last-child { color: rgba(0,0,0,.4); font-size: 21rpx; font-weight: 400; }.category-item { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 1rpx solid #F5F6FA; }.category-item:last-child { border-bottom: 0; }.icon { width: 50rpx; font-size: 30rpx; }.name { flex: 1; color: rgba(0,0,0,.78); font-size: 27rpx; }.state { margin-right: 12rpx; color: #10B981; font-size: 21rpx; }.state.disabled { color: #98A2B3; }.edit, .delete { margin-left: 14rpx; padding: 7rpx 12rpx; border-radius: 10rpx; color: #5968D8; background: #EEF0FF; font-size: 21rpx; }.delete { color: #EF4444; background: #FFF0F0; }.empty { padding: 80rpx; color: rgba(0,0,0,.45); text-align: center; font-size: 28rpx; }
.category-item .icon { width: 32rpx; height: 32rpx; margin-right: 18rpx; }
/* 后台列表统一采用“固定页面 + 剩余空间滚动”，避免固定高度把内容顶出视口。 */
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header, .list-scroll, .group, .category-item, .group-title { min-width: 0; }
.header { flex: 0 0 auto; gap: 14rpx; }
.header > view:first-child { min-width: 0; flex: 1; overflow: hidden; }
.title, .subtitle { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.add-btn { flex: 0 0 auto; white-space: nowrap; }
.list-scroll { flex: 1; min-height: 0; height: auto; max-width: 100%; }
.group-title { gap: 12rpx; }
.group-title text { min-width: 0; overflow-wrap: anywhere; }
.category-item .icon { flex: 0 0 32rpx; }
.name { min-width: 0; overflow: hidden; overflow-wrap: anywhere; word-break: break-word; }
.state, .edit, .delete { flex: 0 0 auto; white-space: nowrap; }
.edit, .delete { margin-left: 8rpx; }
</style>
