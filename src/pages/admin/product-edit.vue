<template>
  <view class="page">
    <view class="form-card">
      <text class="form-label">商品标题</text>
      <input class="form-input" v-model="form.title" placeholder="例如：年度会员·畅享版" />
    </view>

    <view class="form-card">
      <text class="form-label">服务类型</text>
      <view class="select-row" @tap="pickType"><text>{{ serviceTypes[form.service_type] || form.service_type }}</text><text>›</text></view>
    </view>

    <view class="form-card">
      <text class="form-label">商品分类</text>
      <view class="select-row" @tap="pickCategory"><text>{{ selectedCategory?.name || '选择分类' }}</text><text>›</text></view>
    </view>

    <view class="form-card two-col">
      <view class="field-col"><text class="form-label">售价（元）</text><input class="form-input" type="digit" v-model="form.price" placeholder="0" /></view>
      <view class="field-col"><text class="form-label">市场价（元）</text><input class="form-input" type="digit" v-model="form.market_price" placeholder="0" /></view>
    </view>

    <view class="form-card two-col">
      <view class="field-col"><text class="form-label">计价单位</text><input class="form-input" v-model="form.unit" placeholder="次 / 年 / 套" /></view>
      <view class="field-col"><text class="form-label">状态</text><view class="select-row" @tap="toggleStatus"><text>{{ form.status === 'on_sale' ? '上架' : '下架' }}</text><text>›</text></view></view>
    </view>

    <view class="form-card switch-card">
      <view><text class="form-label">首页精选</text><text class="form-help">精选商品优先展示在商城推荐位</text></view>
      <switch :checked="form.is_featured" color="#FF6B35" @change="form.is_featured = $event.detail.value" />
    </view>

    <view class="form-card">
      <text class="form-label">服务介绍</text>
      <textarea class="form-textarea" v-model="form.description_rich" placeholder="填写商品权益、交付内容和服务说明" />
    </view>

    <view class="bottom-bar"><view class="save-btn" @tap="save"><text>{{ saving ? '保存中…' : '保存商品' }}</text></view></view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { serviceTypes } from '@/utils/i18n-maps'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.productEdit')

const productId = ref('')
const saving = ref(false)
const categories = ref([])
const form = ref({
  title: '', service_type: 'resource_pack', category_id: '', price: '', market_price: '',
  unit: '次', status: 'on_sale', is_featured: false, description_rich: ''
})
const selectedCategory = computed(() => categories.value.find(item => item.id === form.value.category_id || item._id === form.value.category_id))
const typeOptions = ['member', 'linker', 'survey', 'resource_pack', 'certification']

onLoad((query) => { productId.value = query?.id || '' })
onMounted(async () => {
  const categoryRes = await bridge.admin.categories.list({ type: 'product' })
  categories.value = categoryRes || []
  if (!form.value.category_id) form.value.category_id = categories.value[0]?.id || categories.value[0]?._id || 'prod_cat_04'
  if (!productId.value) return
  const res = await bridge.admin.products.list({ page: 1, pageSize: 100 })
  const item = res.list?.find(product => product._id === productId.value)
  if (item) {
    form.value = {
      ...form.value,
      ...item,
      price: ((Number(item.price) || 0) / 100).toString(),
      market_price: ((Number(item.market_price) || 0) / 100).toString(),
      description_rich: item.description_rich || ''
    }
  }
})

function pickType() {
  uni.showActionSheet({
    itemList: typeOptions.map(type => serviceTypes.value[type] || type),
    success: ({ tapIndex }) => { if (typeOptions[tapIndex]) form.value.service_type = typeOptions[tapIndex] }
  })
}
function pickCategory() {
  if (!categories.value.length) return
  uni.showActionSheet({
    itemList: categories.value.map(item => item.name),
    success: ({ tapIndex }) => { const item = categories.value[tapIndex]; if (item) form.value.category_id = item.id || item._id }
  })
}
function toggleStatus() { form.value.status = form.value.status === 'on_sale' ? 'off_sale' : 'on_sale' }

async function save() {
  if (!form.value.title.trim()) { uni.showToast({ title: '请填写商品标题', icon: 'none' }); return }
  saving.value = true
  try {
    const payload = {
      ...form.value,
      price: Math.round((Number(form.value.price) || 0) * 100),
      market_price: Math.round((Number(form.value.market_price) || Number(form.value.price) || 0) * 100)
    }
    if (productId.value) await bridge.admin.products.update(productId.value, payload)
    else await bridge.admin.products.create(payload)
    uni.showToast({ title: '商品已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 700)
  } catch (error) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' })
  } finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 150rpx; background: #F5F6FA; }
.form-card { margin-bottom: 14rpx; padding: 22rpx; border-radius: 18rpx; background: #FFFFFF; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }
.form-label { display: block; margin-bottom: 12rpx; color: rgba(0,0,0,.82); font-size: 27rpx; font-weight: 700; }
.form-help { color: rgba(0,0,0,.42); font-size: 22rpx; }
.form-input, .form-textarea { width: 100%; box-sizing: border-box; padding: 12rpx 0; color: rgba(0,0,0,.8); font-size: 28rpx; border-bottom: 1rpx solid #F0F1F5; }
.form-textarea { min-height: 180rpx; border: 0; }
.select-row { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; color: rgba(0,0,0,.7); font-size: 28rpx; }
.select-row text:last-child { color: rgba(0,0,0,.28); font-size: 38rpx; }
.two-col { display: flex; gap: 20rpx; }
.field-col { flex: 1; min-width: 0; }
.switch-card { display: flex; justify-content: space-between; align-items: center; }
.switch-card .form-label { margin-bottom: 6rpx; }
.bottom-bar { position: fixed; right: 0; bottom: 0; left: 0; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; box-shadow: 0 -4rpx 14rpx rgba(0,0,0,.05); }
.save-btn { padding: 22rpx; border-radius: 24rpx; color: #FFFFFF; text-align: center; background: linear-gradient(135deg, #FF6B35, #FF9A5C); font-size: 28rpx; font-weight: 700; }
/* Overflow guard: admin forms stay inside the H5 shell and preserve the switch/arrow columns. */
.page,
.form-card,
.two-col,
.field-col,
.select-row,
.switch-card,
.bottom-bar { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.two-col { flex-wrap: wrap; }
.field-col { flex: 1 1 0; }
.switch-card > view:first-child { min-width: 0; flex: 1 1 auto; overflow: hidden; }
.form-help,
.form-label,
.select-row > text:first-child { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.select-row > text:first-child { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-row > text:last-child,
.switch-card > switch { flex: 0 0 auto; white-space: nowrap; }
.bottom-bar { overflow-x: hidden; }
.save-btn { width: 100%; box-sizing: border-box; white-space: nowrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .form-card { padding: 18rpx; }
  .two-col { gap: 12rpx; }
  .bottom-bar { padding-right: 16rpx; padding-left: 16rpx; }
}
</style>
