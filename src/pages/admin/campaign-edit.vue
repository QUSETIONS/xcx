<template>
  <view class="page">
    <view class="form-card"><text class="label">活动标题</text><input class="input" v-model="form.title" placeholder="活动标题" /></view>
    <view class="form-card"><text class="label">简介</text><textarea class="textarea" v-model="form.desc_text" placeholder="活动说明，公开展示" /></view>
    <view class="form-card"><text class="label">类型</text><view class="select" @tap="pickType"><text>{{ typeLabel(form.type) }}</text><text>›</text></view></view>
    <view class="form-card"><text class="label">标签</text><input class="input" v-model="form.tag" placeholder="如：报名中 / 限时" /></view>
    <view class="form-card"><text class="label">城市</text><input class="input" v-model="form.city" placeholder="如：上海；留空表示不限" /></view>
    <view class="form-card"><text class="label">分类</text><input class="input" v-model="form.category" placeholder="如：行业峰会" /></view>
    <view class="form-card"><text class="label">开始时间</text><input class="input" v-model="form.starts_at" placeholder="YYYY-MM-DD HH:mm" /></view>
    <view class="form-card"><text class="label">结束时间</text><input class="input" v-model="form.ends_at" placeholder="YYYY-MM-DD HH:mm" /></view>
    <view class="form-card"><text class="label">结束提示文案</text><input class="input" v-model="form.end_text" placeholder="如：7天后" /></view>
    <view class="form-card"><text class="label">报名链接</text><input class="input" v-model="form.signup_url" placeholder="可选" /></view>
    <view class="form-card"><text class="label">状态</text><view class="status-row"><text class="status-option" :class="{ active: form.status === 'active' }" @tap="form.status = 'active'">上架</text><text class="status-option" :class="{ active: form.status !== 'active' }" @tap="form.status = 'disabled'">下架</text></view></view>
    <view class="bottom-bar"><view class="save-btn" @tap="save"><text>{{ saving ? '保存中…' : '保存活动' }}</text></view></view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.campaignManage')

const itemId = ref('')
const saving = ref(false)
const form = ref({ title: '', desc_text: '', type: 'event', tag: '', city: '', category: '', starts_at: '', ends_at: '', end_text: '', signup_url: '', status: 'active' })
const types = ['event', 'offline', 'online', 'coupon', 'member', 'invite', 'task', 'rank', 'discount']
onLoad(query => { itemId.value = query?.id || '' })
onMounted(async () => {
  if (!itemId.value) return
  const list = await bridge.admin.campaigns.list()
  const item = list.find(row => row._id === itemId.value)
  if (item) form.value = { ...form.value, ...item }
})
function typeLabel(type) { return ({ event: '活动', offline: '线下', online: '线上', coupon: '权益', member: '会员', invite: '邀请', task: '任务', rank: '榜单', discount: '优惠' })[type] || '活动' }
function pickType() { uni.showActionSheet({ itemList: types.map(typeLabel), success: ({ tapIndex }) => { if (types[tapIndex]) form.value.type = types[tapIndex] } }) }
async function save() {
  if (!form.value.title.trim()) { uni.showToast({ title: '请填写活动标题', icon: 'none' }); return }
  saving.value = true
  try {
    if (itemId.value) await bridge.admin.campaigns.update(itemId.value, form.value)
    else await bridge.admin.campaigns.create(form.value)
    uni.showToast({ title: '活动已保存', icon: 'success' }); setTimeout(() => uni.navigateBack(), 700)
  } catch (error) { uni.showToast({ title: error?.message || '保存失败', icon: 'none' }) }
  finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 150rpx; background: #F5F6FA; }.form-card { margin-bottom: 14rpx; padding: 22rpx; border-radius: 18rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }.label { display: block; margin-bottom: 12rpx; color: rgba(0,0,0,.82); font-size: 27rpx; font-weight: 700; }.input { width: 100%; box-sizing: border-box; padding: 12rpx 0; color: rgba(0,0,0,.8); font-size: 28rpx; border-bottom: 1rpx solid #F0F1F5; }.textarea { width: 100%; box-sizing: border-box; min-height: 140rpx; padding: 12rpx 0; color: rgba(0,0,0,.8); font-size: 28rpx; border-bottom: 1rpx solid #F0F1F5; }.select { display: flex; justify-content: space-between; padding: 12rpx 0; color: rgba(0,0,0,.7); font-size: 28rpx; }.status-row { display: flex; gap: 16rpx; }.status-option { padding: 10rpx 20rpx; border-radius: 14rpx; color: rgba(0,0,0,.55); background: #F4F5F8; font-size: 24rpx; }.status-option.active { color: #FF6B35; background: rgba(255,107,53,.1); font-weight: 700; }.bottom-bar { position: fixed; right: 0; bottom: 0; left: 0; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -4rpx 14rpx rgba(0,0,0,.05); }.save-btn { padding: 22rpx; border-radius: 24rpx; color: #fff; text-align: center; background: linear-gradient(135deg, #FF6B35, #FF9A5C); font-size: 28rpx; font-weight: 700; }
.page,
.form-card,
.select,
.status-row,
.bottom-bar { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.label,
.input,
.textarea,
.select > text:first-child { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.input, .textarea { min-width: 0; }
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
