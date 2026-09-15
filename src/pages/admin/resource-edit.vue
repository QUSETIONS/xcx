<template>
  <view class="page">
    <view class="form-card"><text class="label">资料标题</text><input class="input" v-model="form.title" placeholder="例如：品牌营销趋势报告" /></view>
    <view class="form-card"><text class="label">资料分类</text><view class="select" @tap="pickCategory"><text>{{ selectedCategory?.name || '选择分类' }}</text><text>›</text></view></view>
    <view class="form-card two-col"><view><text class="label">文件类型</text><input class="input" v-model="form.file_type" placeholder="pdf" /></view><view><text class="label">文件大小</text><input class="input" v-model="form.file_size" placeholder="10MB" /></view></view>
    <view class="form-card"><text class="label">文件地址</text><input class="input" v-model="form.file_url" placeholder="可选：填写文件下载地址" /></view>
    <view class="form-card"><text class="label">资料摘要</text><textarea class="textarea" v-model="form.summary" placeholder="填写资料内容简介" /></view>
    <view class="form-card"><text class="label">在线预览正文</text><text class="help">支持基础 HTML；没有文件地址时，下载会生成这段内容的离线 HTML</text><textarea class="textarea content" v-model="form.content_rich" placeholder="填写资料正文、章节和使用说明" /></view>
    <view class="form-card"><text class="label">标签</text><input class="input" v-model="tagsText" placeholder="用逗号分隔，例如：品牌,策略,模板" /></view>
    <view class="form-card switch-card"><view><text class="label">免费资料</text><text class="help">关闭后按价格展示</text></view><switch :checked="form.is_free" color="#10B981" @change="form.is_free = $event.detail.value" /></view>
    <view v-if="!form.is_free" class="form-card"><text class="label">售价（元）</text><input class="input" type="digit" v-model="form.price" placeholder="0" /></view>
    <view class="form-card switch-card"><view><text class="label">精选资料</text><text class="help">在资料库优先展示</text></view><switch :checked="form.is_featured" color="#6573DC" @change="form.is_featured = $event.detail.value" /></view>
    <view class="form-card"><text class="label">发布状态</text><view class="status-row"><text v-for="item in statuses" :key="item.value" class="status-option" :class="{ active: form.status === item.value }" @tap="form.status = item.value">{{ item.label }}</text></view></view>
    <view class="bottom-bar"><view class="save-btn" @tap="save"><text>{{ saving ? '保存中…' : '保存资料' }}</text></view></view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.resourceManage')

const resourceId = ref('')
const saving = ref(false)
const categories = ref([])
const tagsText = ref('')
const form = ref({ title: '', category_id: '', file_type: 'pdf', file_size: '', file_url: '', summary: '', content_rich: '', tags: [], is_free: true, is_featured: false, price: '', status: 'published' })
const statuses = [{ value: 'published', label: '已发布' }, { value: 'draft', label: '草稿' }, { value: 'offline', label: '已下线' }]
const selectedCategory = computed(() => categories.value.find(item => (item.id || item._id) === form.value.category_id))
onLoad(query => { resourceId.value = query?.id || '' })
onMounted(async () => {
  categories.value = await bridge.admin.categories.list({ type: 'resource' }) || []
  if (!form.value.category_id) form.value.category_id = categories.value[0]?.id || categories.value[0]?._id || 'resource_cat_01'
  if (!resourceId.value) return
  const res = await bridge.admin.resources.list({ page: 1, pageSize: 100 })
  const item = res.list?.find(row => row._id === resourceId.value)
  if (item) { form.value = { ...form.value, ...item, price: ((Number(item.price) || 0) / 100).toString(), is_free: !!item.is_free, is_featured: !!item.is_featured }; tagsText.value = (item.tags || []).join(',') }
})
function pickCategory() {
  uni.showActionSheet({ itemList: categories.value.map(item => item.name), success: ({ tapIndex }) => { const item = categories.value[tapIndex]; if (item) form.value.category_id = item.id || item._id } })
}
async function save() {
  if (!form.value.title.trim()) { uni.showToast({ title: '请填写资料标题', icon: 'none' }); return }
  if (!form.value.summary.trim()) { uni.showToast({ title: '请补充资料摘要', icon: 'none' }); return }
  if (!form.value.is_free && Number(form.value.price) <= 0) { uni.showToast({ title: '付费资料请填写售价', icon: 'none' }); return }
  saving.value = true
  try {
    const payload = { ...form.value, tags: tagsText.value.split(/[,，]/).map(item => item.trim()).filter(Boolean), price: form.value.is_free ? 0 : Math.round((Number(form.value.price) || 0) * 100) }
    if (resourceId.value) await bridge.admin.resources.update(resourceId.value, payload)
    else await bridge.admin.resources.create(payload)
    uni.showToast({ title: '资料已保存', icon: 'success' }); setTimeout(() => uni.navigateBack(), 700)
  } catch (error) { uni.showToast({ title: error?.message || '保存失败', icon: 'none' }) }
  finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 150rpx; background: #F5F6FA; }.form-card { margin-bottom: 14rpx; padding: 22rpx; border-radius: 18rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }.label { display: block; margin-bottom: 12rpx; color: rgba(0,0,0,.82); font-size: 27rpx; font-weight: 700; }.help { display: block; margin-bottom: 6rpx; color: rgba(0,0,0,.42); font-size: 22rpx; line-height: 1.5; }.input, .textarea { width: 100%; box-sizing: border-box; padding: 12rpx 0; color: rgba(0,0,0,.8); font-size: 28rpx; border-bottom: 1rpx solid #F0F1F5; }.textarea { min-height: 170rpx; border: 0; }.textarea.content { min-height: 300rpx; }.select, .status-row { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 0; color: rgba(0,0,0,.7); font-size: 28rpx; }.two-col { display: flex; gap: 20rpx; }.two-col > view { flex: 1; min-width: 0; }.switch-card { display: flex; align-items: center; justify-content: space-between; }.status-row { justify-content: flex-start; gap: 16rpx; }.status-option { padding: 10rpx 18rpx; border-radius: 14rpx; color: rgba(0,0,0,.55); background: #F4F5F8; font-size: 23rpx; }.status-option.active { color: #FF6B35; background: rgba(255,107,53,.1); font-weight: 700; }.bottom-bar { position: fixed; right: 0; bottom: 0; left: 0; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -4rpx 14rpx rgba(0,0,0,.05); }.save-btn { padding: 22rpx; border-radius: 24rpx; color: #fff; text-align: center; background: linear-gradient(135deg, #FF6B35, #FF9A5C); font-size: 28rpx; font-weight: 700; }
/* Overflow guard: long URLs, summaries and status labels must never widen the editor. */
.page,
.form-card,
.two-col,
.two-col > view,
.select,
.status-row,
.switch-card,
.bottom-bar { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.two-col { flex-wrap: wrap; }
.two-col > view { flex: 1 1 0; }
.switch-card > view:first-child { min-width: 0; flex: 1 1 auto; overflow: hidden; }
.label,
.help,
.select > text:first-child { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.select > text:first-child { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select > text:last-child,
.switch-card > switch { flex: 0 0 auto; white-space: nowrap; }
.status-row { flex-wrap: wrap; justify-content: flex-start; gap: 10rpx; }
.status-option { flex: 0 0 auto; white-space: nowrap; }
.bottom-bar { overflow-x: hidden; }
.save-btn { width: 100%; box-sizing: border-box; white-space: nowrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .form-card { padding: 18rpx; }
  .two-col { gap: 12rpx; }
  .bottom-bar { padding-right: 16rpx; padding-left: 16rpx; }
}
</style>
