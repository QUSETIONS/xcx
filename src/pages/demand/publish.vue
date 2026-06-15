<template>
  <view class="publish-page">
    <view class="notice-bar">
      <text class="notice-icon">💡</text>
      <text class="notice-text">{{ isEdit ? '编辑后需重新审核' : '发布后将在大厅展示，审核通过后即可对接' }}</text>
      <text class="notice-link" @tap="showHelp = true">须知 ›</text>
    </view>

    <view class="form-wrap">
      <view class="form-card">
        <text class="form-label">需求标题 *</text>
        <input class="form-input" v-model="form.title" placeholder="简洁描述您的需求" maxlength="100"/>
        <text class="form-count">{{ form.title.length }}/100</text>
      </view>

      <view class="form-card">
        <text class="form-label">公司/项目名称 *</text>
        <input class="form-input" v-model="form.company_name" placeholder="请输入公司或项目名称"/>
      </view>

      <view class="form-card">
        <text class="form-label">需求地区 *</text>
        <view class="form-select" @tap="showRegionPicker = true">
          <text :class="{ placeholder: !form.region }">{{ form.region || '请选择地区' }}</text>
          <text class="select-arrow">▸</text>
        </view>
      </view>

      <view class="form-card">
        <text class="form-label">需求分类 *</text>
        <view class="form-select" @tap="showCategoryPicker = true">
          <text :class="{ placeholder: !form.category_name }">{{ form.category_name || '请选择分类' }}</text>
          <text class="select-arrow">▸</text>
        </view>
      </view>

      <view class="form-card">
        <text class="form-label">报价方式</text>
        <view class="quote-row">
          <view class="quote-opt" :class="{ active: form.quote_type === q.value }" v-for="q in quoteTypes" :key="q.value" @tap="form.quote_type = q.value">
            <text>{{ q.label }}</text>
          </view>
        </view>
      </view>

      <view v-if="form.quote_type === 'self'" class="form-card">
        <text class="form-label">预算区间（元）</text>
        <view class="budget-row">
          <input class="budget-input" type="digit" v-model="budgetMin" placeholder="最低"/>
          <text class="budget-sep">—</text>
          <input class="budget-input" type="digit" v-model="budgetMax" placeholder="最高"/>
        </view>
      </view>

      <view class="form-card">
        <text class="form-label">需求详情 *</text>
        <textarea class="form-textarea" v-model="form.description" placeholder="详细描述您的需求，包括具体要求、时间节点、交付物等" maxlength="2000"/>
        <text class="form-count">{{ form.description.length }}/2000</text>
      </view>

      <view class="form-card">
        <text class="form-label">联系人 *</text>
        <input class="form-input" v-model="form.contact_name" placeholder="您的称呼"/>
      </view>

      <view class="form-card">
        <text class="form-label">联系电话 *</text>
        <input class="form-input" type="tel" v-model="form.contact_phone" placeholder="手机号码" maxlength="11"/>
      </view>

      <view class="form-card">
        <text class="form-label">微信号</text>
        <input class="form-input" v-model="form.contact_wechat" placeholder="选填"/>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="draft-btn" @tap="saveDraft"><text>保存草稿</text></view>
      <view class="submit-btn" @tap="submitForm"><text>{{ isEdit ? '保存修改' : '发布需求' }}</text></view>
    </view>

    <!-- 地区选择 -->
    <view v-if="showRegionPicker" class="picker-mask" @tap="showRegionPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>选择地区</text><text class="picker-close" @tap="showRegionPicker = false">✕</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: form.region === r }" v-for="r in regions" :key="r" @tap="form.region = r; showRegionPicker = false"><text>{{ r }}</text></view>
        </view>
      </view>
    </view>

    <!-- 分类选择 -->
    <view v-if="showCategoryPicker" class="picker-mask" @tap="showCategoryPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>选择分类</text><text class="picker-close" @tap="showCategoryPicker = false">✕</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: form.category_id === c.id }" v-for="c in categories" :key="c.id" @tap="form.category_id = c.id; form.category_name = c.name; showCategoryPicker = false"><text>{{ c.name }}</text></view>
        </view>
      </view>
    </view>

    <!-- 发布须知 -->
    <view v-if="showHelp" class="picker-mask" @tap="showHelp = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>发布须知</text><text class="picker-close" @tap="showHelp = false">✕</text></view>
        <view class="help-list">
          <text class="help-item">1. 标题需简洁明了，便于服务方快速理解</text>
          <text class="help-item">2. 详情尽量包含：具体要求、时间节点、交付物标准</text>
          <text class="help-item">3. 联系方式仅对接方可见，保障隐私</text>
          <text class="help-item">4. 自报价建议填合理预算区间，提高对接效率</text>
          <text class="help-item">5. 发布后管理员审核，通过后即可展示</text>
          <text class="help-item">6. 需求有效期30天，到期可续期</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { DEMAND_CATEGORIES, REGIONS, QUOTE_TYPES } from '@/config/constants'
import { demandService } from '@/mock/service'

const categories = DEMAND_CATEGORIES
const regions = REGIONS
const quoteTypes = QUOTE_TYPES

const isEdit = ref(false)
const editId = ref(null)

const form = ref({ title: '', company_name: '', region: '', category_id: '', category_name: '', quote_type: 'negotiate', budget_min: null, budget_max: null, description: '', contact_name: '', contact_phone: '', contact_wechat: '' })
const budgetMin = ref('')
const budgetMax = ref('')
const showRegionPicker = ref(false)
const showCategoryPicker = ref(false)
const showHelp = ref(false)
const submitting = ref(false)

// 检查是否编辑模式
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]
if (currentPage?.options?.id) {
  isEdit.value = true
  editId.value = currentPage.options.id
  const detail = demandService.detail(editId.value)
  if (detail) {
    Object.assign(form.value, {
      title: detail.title,
      company_name: detail.company_name,
      region: detail.region,
      category_id: detail.category_id,
      category_name: detail.category_name,
      quote_type: detail.quote_type || 'negotiate',
      description: detail.description || '',
      contact_name: detail.contact_name || '',
      contact_phone: detail.phone || '',
      contact_wechat: detail.wechat || ''
    })
    if (detail.budget_min) budgetMin.value = (detail.budget_min / 100).toString()
    if (detail.budget_max) budgetMax.value = (detail.budget_max / 100).toString()
  }
} else {
  // 恢复草稿
  try {
    const draft = uni.getStorageSync('demand_draft')
    if (draft) { Object.assign(form.value, draft.form); budgetMin.value = draft.budgetMin || ''; budgetMax.value = draft.budgetMax || '' }
  } catch {}
  // 恢复联系方式
  try {
    const last = uni.getStorageSync('last_demand_contact')
    if (last && !form.value.contact_name) { form.value.contact_name = last.name || ''; form.value.contact_phone = last.phone || '' }
  } catch {}
}

function saveDraft() {
  uni.setStorageSync('demand_draft', { form: { ...form.value }, budgetMin: budgetMin.value, budgetMax: budgetMax.value })
  uni.showToast({ title: '草稿已保存', icon: 'success' })
}

function submitForm() {
  const required = ['title', 'company_name', 'region', 'category_id', 'description', 'contact_name', 'contact_phone']
  for (const f of required) {
    if (!form.value[f]?.toString().trim()) { uni.showToast({ title: '请填写完整信息', icon: 'none' }); return }
  }
  // 手机号格式验证
  if (!/^1[3-9]\d{9}$/.test(form.value.contact_phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
  }
  if (form.value.quote_type === 'self' && budgetMin.value) {
    form.value.budget_min = Math.round(parseFloat(budgetMin.value) * 100)
    form.value.budget_max = budgetMax.value ? Math.round(parseFloat(budgetMax.value) * 100) : null
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      demandService.update(editId.value, { ...form.value })
      uni.showToast({ title: '修改成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      demandService.create({ ...form.value, created_by: 'demo_user_001' })
      uni.setStorageSync('last_demand_contact', { name: form.value.contact_name, phone: form.value.contact_phone })
      uni.removeStorageSync('demand_draft')
      uni.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => uni.switchTab({ url: '/pages/demand/list' }), 1500)
    }
  } finally { submitting.value = false }
}
</script>

<style lang="scss" scoped>
.publish-page { min-height: 100vh; background: #F5F6FA; padding-bottom: 160rpx; }

.notice-bar { display: flex; align-items: center; padding: 16rpx 24rpx; margin: 16rpx 24rpx 0; background: rgba(245,158,11,0.1); border: 1rpx solid rgba(245,158,11,0.2); border-radius: 16rpx; }
.notice-icon { font-size: 28rpx; }
.notice-text { flex: 1; font-size: 22rpx; color: #F59E0B; }
.notice-link { font-size: 22rpx; color: #FF6B35; }

.form-wrap { padding: 16rpx 24rpx; }
.form-card { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.form-label { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.form-input { font-size: 28rpx; color: rgba(0,0,0,0.85); padding: 12rpx 0; border-bottom: 1rpx solid #F5F6FA; }
.form-textarea { font-size: 28rpx; color: rgba(0,0,0,0.85); width: 100%; min-height: 200rpx; padding: 12rpx 0; }
.form-count { font-size: 20rpx; color: rgba(0,0,0,0.35); display: block; text-align: right; margin-top: 4rpx; }
.form-select { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; border-bottom: 1rpx solid #F5F6FA; }
.placeholder { color: rgba(0,0,0,0.35); }
.select-arrow { color: rgba(0,0,0,0.3); }

.quote-row { display: flex; }
.quote-opt { padding: 12rpx 24rpx; background: #F5F6FA; border-radius: 16rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); }
.quote-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

.budget-row { display: flex; align-items: center; }
.budget-input { flex: 1; font-size: 28rpx; color: rgba(0,0,0,0.85); padding: 12rpx; background: #F5F6FA; border-radius: 12rpx; text-align: center; }
.budget-sep { color: rgba(0,0,0,0.3); }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.04); }
.draft-btn { padding: 20rpx 40rpx; background: #F5F6FA; border-radius: 24rpx; font-size: 28rpx; color: rgba(0,0,0,0.6); }
.submit-btn { flex: 1; padding: 20rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; text-align: center; }
.submit-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 400; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { display: flex; justify-content: space-between; margin-bottom: 24rpx; font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.picker-close { color: rgba(0,0,0,0.4); padding: 4rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

.help-list { padding: 12rpx 0; }
.help-item { font-size: 24rpx; color: rgba(0,0,0,0.6); line-height: 2; }
</style>