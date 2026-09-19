<template>
  <view class="page">
    <view class="form-card"><text class="label">标题</text><input class="input" v-model="form.title" placeholder="资讯标题" /></view>
    <view class="form-card"><text class="label">摘要</text><textarea class="textarea" v-model="form.summary" placeholder="列表页展示的摘要" /></view>
    <view class="form-card"><text class="label">正文</text><textarea class="textarea tall" v-model="form.content" placeholder="资讯正文" /></view>
    <view class="form-card"><text class="label">来源名称</text><input class="input" v-model="form.source_name" placeholder="如：媒合智联 / 转载来源" /></view>
    <view class="form-card"><text class="label">来源链接</text><input class="input" v-model="form.source_url" placeholder="可选" /></view>
    <view class="form-card"><text class="label">发布时间</text><input class="input" v-model="form.published_at" placeholder="YYYY-MM-DD HH:mm；留空立即发布" /></view>
    <view class="form-card"><text class="label">状态</text><view class="status-row"><text class="status-option" :class="{ active: form.status === 'draft' }" @tap="form.status = 'draft'">草稿</text><text class="status-option" :class="{ active: form.status === 'published' }" @tap="form.status = 'published'">发布</text><text class="status-option" :class="{ active: form.status === 'disabled' }" @tap="form.status = 'disabled'">下线</text></view></view>
    <view class="bottom-bar"><view class="save-btn" @tap="save"><text>{{ saving ? '保存中…' : '保存资讯' }}</text></view></view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.newsManage')

const itemId = ref('')
const saving = ref(false)
const form = ref({ title: '', summary: '', content: '', source_name: '', source_url: '', published_at: '', status: 'draft' })
onLoad(query => { itemId.value = query?.id || '' })
onMounted(async () => {
  if (!itemId.value) return
  const list = await bridge.admin.news.list()
  const item = list.find(row => row._id === itemId.value)
  if (item) form.value = { ...form.value, ...item }
})
async function save() {
  if (!form.value.title.trim()) { uni.showToast({ title: '请填写资讯标题', icon: 'none' }); return }
  saving.value = true
  try {
    if (itemId.value) await bridge.admin.news.update(itemId.value, form.value)
    else await bridge.admin.news.create(form.value)
    uni.showToast({ title: '资讯已保存', icon: 'success' }); setTimeout(() => uni.navigateBack(), 700)
  } catch (error) { uni.showToast({ title: error?.message || '保存失败', icon: 'none' }) }
  finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 150rpx; background: #F5F6FA; }.form-card { margin-bottom: 14rpx; padding: 22rpx; border-radius: 18rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }.label { display: block; margin-bottom: 12rpx; color: rgba(0,0,0,.82); font-size: 27rpx; font-weight: 700; }.input { width: 100%; box-sizing: border-box; padding: 12rpx 0; color: rgba(0,0,0,.8); font-size: 28rpx; border-bottom: 1rpx solid #F0F1F5; }.textarea { width: 100%; box-sizing: border-box; min-height: 140rpx; padding: 12rpx 0; color: rgba(0,0,0,.8); font-size: 28rpx; border-bottom: 1rpx solid #F0F1F5; }.textarea.tall { min-height: 260rpx; }.status-row { display: flex; gap: 16rpx; }.status-option { padding: 10rpx 20rpx; border-radius: 14rpx; color: rgba(0,0,0,.55); background: #F4F5F8; font-size: 24rpx; }.status-option.active { color: #FF6B35; background: rgba(255,107,53,.1); font-weight: 700; }.bottom-bar { position: fixed; right: 0; bottom: 0; left: 0; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -4rpx 14rpx rgba(0,0,0,.05); }.save-btn { padding: 22rpx; border-radius: 24rpx; color: #fff; text-align: center; background: linear-gradient(135deg, #FF6B35, #FF9A5C); font-size: 28rpx; font-weight: 700; }
.page,
.form-card,
.status-row,
.bottom-bar { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.label,
.input,
.textarea { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.input, .textarea { min-width: 0; }
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
