<template>
  <view class="publish-page">
    <view class="notice-bar">
      <text class="notice-icon">💡</text>
      <text class="notice-text">发布后将在大厅展示，审核通过后即可对接</text>
      <text class="notice-link" @tap="showHelp = true">须知 ›</text>
    </view>

    <view class="form-wrap">
      <view class="form-card">
        <text class="form-label">需求标题 *</text>
        <input class="form-input" v-model="form.title" placeholder="简洁描述您的需求" maxlength="100" />
        <text class="form-count">{{ form.title.length }}/100</text>
      </view>

      <view class="form-card">
        <text class="form-label">公司/项目名称 *</text>
        <input class="form-input" v-model="form.company_name" placeholder="请输入公司或项目名称" />
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
          <input class="budget-input" type="digit" v-model="budgetMin" placeholder="最低" />
          <text class="budget-sep">—</text>
          <input class="budget-input" type="digit" v-model="budgetMax" placeholder="最高" />
        </view>
      </view>

      <view class="form-card">
        <text class="form-label">需求详情 *</text>
        <textarea class="form-area" v-model="form.description" placeholder="请详细描述需求，包含要求、时间节点、交付物等" maxlength="500" />
        <text class="form-count">{{ form.description.length }}/500</text>
      </view>

      <view class="form-card">
        <text class="form-label">联系人 *</text>
        <input class="form-input" v-model="form.contact_name" placeholder="请输入联系人" />
      </view>

      <view class="form-card">
        <text class="form-label">联系电话 *</text>
        <input class="form-input" type="number" v-model="form.contact_phone" placeholder="请输入电话" />
      </view>
    </view>

    <view class="submit-wrap">
      <view class="submit-row">
        <button class="draft-btn" @tap="saveDraft">存草稿</button>
        <button class="pub-btn" @tap="submitForm" :disabled="submitting">
          {{ submitting ? '发布中...' : '发布需求' }}
        </button>
      </view>
    </view>

    <!-- 地区选择 -->
    <view v-if="showRegionPicker" class="picker-mask" @tap="showRegionPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>选择地区</text><text class="picker-close" @tap="showRegionPicker = false">✕</text></view>
        <view class="picker-options">
          <view class="picker-opt" :class="{ active: form.region === r }" v-for="r in regions" :key="r" @tap="form.region = r; showRegionPicker = false">{{ r }}</view>
        </view>
      </view>
    </view>

    <!-- 分类选择 -->
    <view v-if="showCategoryPicker" class="picker-mask" @tap="showCategoryPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>选择分类</text><text class="picker-close" @tap="showCategoryPicker = false">✕</text></view>
        <view class="picker-options">
          <view class="picker-opt" :class="{ active: form.category_id === cat.id }" v-for="cat in categories" :key="cat.id" @tap="form.category_id = cat.id; form.category_name = cat.name; showCategoryPicker = false">{{ cat.icon }} {{ cat.name }}</view>
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

const form = ref({ title: '', company_name: '', region: '', category_id: '', category_name: '', quote_type: 'negotiate', budget_min: null, budget_max: null, description: '', contact_name: '', contact_phone: '', contact_wechat: '' })
const budgetMin = ref('')
const budgetMax = ref('')
const showRegionPicker = ref(false)
const showCategoryPicker = ref(false)
const showHelp = ref(false)
const submitting = ref(false)

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

function saveDraft() {
  uni.setStorageSync('demand_draft', { form: { ...form.value }, budgetMin: budgetMin.value, budgetMax: budgetMax.value, savedAt: new Date().toISOString() })
  uni.showToast({ title: '草稿已保存', icon: 'success' })
}

async function submitForm() {
  const required = ['title', 'company_name', 'region', 'category_id', 'description', 'contact_name', 'contact_phone']
  for (const f of required) {
    if (!form.value[f]?.toString().trim()) { uni.showToast({ title: '请填写完整信息', icon: 'none' }); return }
  }
  if (form.value.quote_type === 'self' && budgetMin.value) {
    form.value.budget_min = Math.round(parseFloat(budgetMin.value) * 100)
    form.value.budget_max = budgetMax.value ? Math.round(parseFloat(budgetMax.value) * 100) : null
  }
  submitting.value = true
  try {
    demandService.create({ ...form.value, created_by: 'demo_user_001' })
    uni.setStorageSync('last_demand_contact', { name: form.value.contact_name, phone: form.value.contact_phone })
    uni.removeStorageSync('demand_draft')
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/demand/list' }), 1500)
  } finally { submitting.value = false }
}
</script>

<style lang="scss">
.publish-page { min-height: 100vh; background: #0A0A0F; padding-bottom: 160rpx; }

.notice-bar { display: flex; align-items: center; gap: 8rpx; padding: 16rpx 24rpx; margin: 16rpx 24rpx 0; background: rgba(245,158,11,0.1); border: 1rpx solid rgba(245,158,11,0.2); border-radius: 16rpx; }
.notice-icon { font-size: 28rpx; }
.notice-text { flex: 1; font-size: 22rpx; color: #FBBF24; }
.notice-link { font-size: 22rpx; color: #FF6B35; }

.form-wrap { padding: 16rpx 24rpx; }
.form-card { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; }
.form-label { font-size: 28rpx; font-weight: 600; color: rgba(255,255,255,0.95); display: block; margin-bottom: 12rpx; }
.form-input { width: 100%; height: 76rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; color: rgba(255,255,255,0.95); }
.form-count { font-size: 22rpx; color: rgba(255,255,255,0.35); text-align: right; display: block; margin-top: 8rpx; }
.form-select { display: flex; justify-content: space-between; align-items: center; height: 76rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; color: rgba(255,255,255,0.95); }
.placeholder { color: rgba(255,255,255,0.35); }
.select-arrow { color: rgba(255,255,255,0.4); }
.form-area { width: 100%; height: 200rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 28rpx; color: rgba(255,255,255,0.95); }

.quote-row { display: flex; gap: 12rpx; }
.quote-opt { flex: 1; height: 76rpx; border: 1rpx solid rgba(255,255,255,0.1); border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.04); }
.quote-opt.active { border-color: #FF6B35; color: #FF6B35; background: rgba(255,107,53,0.1); }

.budget-row { display: flex; align-items: center; gap: 16rpx; }
.budget-input { flex: 1; height: 76rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; text-align: center; color: rgba(255,255,255,0.95); }
.budget-sep { color: rgba(255,255,255,0.4); }

.submit-wrap { position: fixed; bottom: 0; left: 0; right: 0; padding: 24rpx; background: #12121A; border-top: 1rpx solid rgba(255,255,255,0.08); }
.submit-row { display: flex; gap: 16rpx; }
.draft-btn { flex: 1; padding: 20rpx; border-radius: 48rpx; font-size: 28rpx; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.65); border: none; }
.pub-btn { flex: 2; padding: 20rpx; border-radius: 48rpx; font-size: 28rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); color: #fff; border: none; font-weight: bold; }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 400; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; background: #1A1A26; border-radius: 32rpx 32rpx 0 0; padding: 32rpx; }
.picker-header { display: flex; justify-content: space-between; margin-bottom: 24rpx; font-size: 32rpx; font-weight: bold; color: rgba(255,255,255,0.95); }
.picker-close { color: rgba(255,255,255,0.5); padding: 4rpx; }
.picker-options { display: flex; flex-wrap: wrap; gap: 12rpx; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 24rpx; font-size: 28rpx; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.65); }
.picker-opt.active { background: rgba(255,107,53,0.15); color: #FF6B35; }

.help-list { padding: 8rpx 0; }
.help-item { font-size: 26rpx; color: rgba(255,255,255,0.65); display: block; margin-bottom: 12rpx; line-height: 1.6; }
</style>