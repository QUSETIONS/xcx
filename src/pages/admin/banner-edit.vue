<template>
  <view class="page">
    <view class="form-card"><text class="label">标题</text><input class="input" v-model="form.title" placeholder="Banner 主标题" /></view>
    <view class="form-card"><text class="label">副标题</text><input class="input" v-model="form.subtitle" placeholder="补充说明文字" /></view>
    <view class="form-card"><text class="label">点击去向</text><view class="select" @tap="pickType"><text>{{ typeLabel(form.type) }}</text><text>›</text></view></view>
    <view v-if="!['demand','publish','zone','resource'].includes(form.type)" class="form-card"><text class="label">目标 ID</text><input class="input" v-model="form.target_id" placeholder="商品或页面 ID，可选" /></view>
    <view class="form-card"><text class="label">排序</text><input class="input" type="number" v-model="form.sort" placeholder="0" /></view>
    <view class="form-card"><text class="label">状态</text><view class="status-row"><text class="status-option" :class="{ active: form.status === 'active' }" @tap="form.status = 'active'">展示</text><text class="status-option" :class="{ active: form.status !== 'active' }" @tap="form.status = 'disabled'">停用</text></view></view>
    <view class="bottom-bar"><view class="save-btn" @tap="save"><text>{{ saving ? '保存中…' : '保存 Banner' }}</text></view></view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.bannerManage')

const bannerId = ref('')
const saving = ref(false)
const form = ref({ title: '', subtitle: '', type: 'demand', target_id: '', sort: 0, status: 'active' })
const types = ['demand', 'publish', 'product', 'resource', 'zone', 'none']
onLoad(query => { bannerId.value = query?.id || '' })
onMounted(async () => {
  if (!bannerId.value) return
  const list = await bridge.admin.banners.list()
  const item = list.find(row => row._id === bannerId.value)
  if (item) form.value = { ...form.value, ...item }
})
function typeLabel(type) { return ({ demand: '需求大厅', publish: '发布需求', product: '商品详情', resource: '资料库', zone: '专区', none: '无跳转' })[type] || '普通链接' }
function pickType() { uni.showActionSheet({ itemList: types.map(typeLabel), success: ({ tapIndex }) => { if (types[tapIndex]) form.value.type = types[tapIndex] } }) }
async function save() {
  if (!form.value.title.trim()) { uni.showToast({ title: '请填写 Banner 标题', icon: 'none' }); return }
  saving.value = true
  try {
    const payload = { ...form.value, sort: Number(form.value.sort) || 0 }
    if (bannerId.value) await bridge.admin.banners.update(bannerId.value, payload)
    else await bridge.admin.banners.create(payload)
    uni.showToast({ title: 'Banner 已保存', icon: 'success' }); setTimeout(() => uni.navigateBack(), 700)
  } catch (error) { uni.showToast({ title: error?.message || '保存失败', icon: 'none' }) }
  finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 150rpx; background: #F5F6FA; }.form-card { margin-bottom: 14rpx; padding: 22rpx; border-radius: 18rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }.label { display: block; margin-bottom: 12rpx; color: rgba(0,0,0,.82); font-size: 27rpx; font-weight: 700; }.input { width: 100%; box-sizing: border-box; padding: 12rpx 0; color: rgba(0,0,0,.8); font-size: 28rpx; border-bottom: 1rpx solid #F0F1F5; }.select { display: flex; justify-content: space-between; padding: 12rpx 0; color: rgba(0,0,0,.7); font-size: 28rpx; }.status-row { display: flex; gap: 16rpx; }.status-option { padding: 10rpx 20rpx; border-radius: 14rpx; color: rgba(0,0,0,.55); background: #F4F5F8; font-size: 24rpx; }.status-option.active { color: #FF6B35; background: rgba(255,107,53,.1); font-weight: 700; }.bottom-bar { position: fixed; right: 0; bottom: 0; left: 0; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -4rpx 14rpx rgba(0,0,0,.05); }.save-btn { padding: 22rpx; border-radius: 24rpx; color: #fff; text-align: center; background: linear-gradient(135deg, #FF6B35, #FF9A5C); font-size: 28rpx; font-weight: 700; }
/* Overflow guard: banner copy and target IDs can be long on compact admin screens. */
.page,
.form-card,
.select,
.status-row,
.bottom-bar { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.label,
.input,
.select > text:first-child { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.input { min-width: 0; }
.select > text:first-child { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select > text:last-child { flex: 0 0 auto; white-space: nowrap; }
.status-row { flex-wrap: wrap; gap: 10rpx; }
.status-option { flex: 0 0 auto; white-space: nowrap; }
.bottom-bar { overflow-x: hidden; }
.save-btn { width: 100%; box-sizing: border-box; white-space: nowrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .form-card { padding: 18rpx; }
  .bottom-bar { padding-right: 16rpx; padding-left: 16rpx; }
}
</style>
