<template>
  <view class="publish-page">
    <view class="notice-bar">
      <image class="notice-icon" src="/static/icons/alert.svg" mode="aspectFit" />
      <text class="notice-text">{{ isEdit ? t('demandPublish.noticeEdit') : t('demandPublish.noticePublish') }}</text>
      <text class="notice-link" @tap="showHelp = true">{{ t('demandPublish.guide') }} ›</text>
    </view>

    <view v-if="draftContext" class="draft-context-card">
      <view class="draft-context-head">
        <view class="draft-context-title"><text class="draft-context-mark">✦</text><text>{{ draftContext.source === 'agent' ? (draftContext.fallback ? '已按当前内容带入' : '需求整理已带入') : '已恢复上次草稿' }}</text></view>
        <text class="draft-context-close" @tap="dismissDraftContext">×</text>
      </view>
      <text class="draft-context-desc">{{ draftContext.source === 'agent' ? (draftContext.fallback ? '服务暂时没响应，先按关键词把内容带进来了；你可以继续修改并发布。' : '标题、地区和原话已填好，继续补充关键细节就能发布。') : '上次填写的内容已恢复，你可以接着修改。' }}</text>
      <view v-if="draftContext.missing && draftContext.missing.length" class="draft-context-block">
        <text class="draft-context-block-title">发布前建议补上</text>
        <text v-for="item in draftContext.missing" :key="item" class="draft-context-item">• {{ item }}</text>
      </view>
      <view v-if="draftContext.questions && draftContext.questions.length" class="draft-context-block draft-context-questions">
        <text class="draft-context-block-title">可以顺手确认</text>
        <text v-for="question in draftContext.questions" :key="question" class="draft-context-item">• {{ question }}</text>
      </view>
    </view>

    <view class="form-wrap">
      <view class="form-card">
        <text class="form-label">{{ t('demandPublish.titleLabel') }}</text>
        <input class="form-input" v-model="form.title" :placeholder="t('demandPublish.titlePlaceholder')" maxlength="100"/>
        <text class="form-count">{{ form.title.length }}/100</text>
      </view>

      <view class="form-card">
        <text class="form-label">{{ t('demandPublish.companyLabel') }}</text>
        <input class="form-input" v-model="form.company_name" :placeholder="t('demandPublish.companyPlaceholder')"/>
      </view>

      <view class="form-card">
        <text class="form-label">{{ t('demandPublish.regionLabel') }}</text>
        <view class="form-select" @tap="showRegionPicker = true">
          <text :class="{ placeholder: !form.region }">{{ regionName(form.region) || t('demandPublish.selectRegion') }}</text>
          <text class="select-arrow">▸</text>
        </view>
      </view>

      <view class="form-card">
        <text class="form-label">{{ t('demandPublish.categoryLabel') }}</text>
        <view class="form-select" @tap="showCategoryPicker = true">
          <text :class="{ placeholder: !form.category_name }">{{ categoryName(form.category_id, form.category_name) || t('demandPublish.selectCategory') }}</text>
          <text class="select-arrow">▸</text>
        </view>
      </view>

      <view class="form-card">
        <view class="form-label-row"><text class="form-label">{{ t('demand.quote') }}</text><text v-if="hasAgentNeed('预算')" class="agent-field-badge">建议补充预算</text></view>
        <view class="quote-row">
          <view class="quote-opt" :class="{ active: form.quote_type === q.value }" v-for="q in quoteTypes" :key="q.value" @tap="form.quote_type = q.value">
            <text>{{ q.label }}</text>
          </view>
        </view>
        <text v-if="hasAgentNeed('预算')" class="agent-field-hint">如果有预算范围，选“自报价”后填写。</text>
      </view>

      <view v-if="form.quote_type === 'self' && form.category_id" class="form-card price-suggest-card">
        <text class="price-suggest-title">{{ t('demandPublish.priceSuggestTitle') }}</text>
        <text class="price-suggest-text">{{ priceSuggestion ? priceSuggestion.tip : t('demandPublish.priceSuggestEmpty') }}</text>
        <view class="price-suggest-row" v-if="priceSuggestion">
          <view class="ps-tag"><text>{{ priceSuggestion.level }}</text></view>
          <text class="ps-range">{{ t('demandPublish.priceReference') }}¥{{ priceSuggestion.min }} - ¥{{ priceSuggestion.max }}</text>
        </view>
      </view>

      <view v-if="qualityScore" class="form-card quality-card">
        <view class="quality-header">
          <text class="quality-title">{{ t('demandPublish.qualityTitle') }}</text>
          <text class="quality-score" :class="'q-' + qualityLevel">{{ qualityScore.total }}/100</text>
        </view>
        <view class="quality-bar">
          <view class="quality-fill" :class="'q-fill-' + qualityLevel" :style="{ width: qualityScore.total + '%' }"></view>
        </view>
        <view class="quality-tips" v-if="qualityScore.tips.length">
          <text class="quality-tip" v-for="(tip, i) in qualityScore.tips.slice(0, 3)" :key="i">• {{ tip }}</text>
        </view>
      </view>

      <view v-if="form.quote_type === 'self'" class="form-card" :class="{ 'agent-focus-card': hasAgentNeed('预算') }">
        <view class="form-label-row"><text class="form-label">{{ t('demandPublish.budgetRange') }}</text><text v-if="hasAgentNeed('预算')" class="agent-field-badge">建议补充</text></view>
        <view class="budget-row">
          <input class="budget-input" type="digit" v-model="budgetMin" :placeholder="t('demandPublish.budgetMin')"/>
          <text class="budget-sep">—</text>
          <input class="budget-input" type="digit" v-model="budgetMax" :placeholder="t('demandPublish.budgetMax')"/>
        </view>
      </view>

      <view class="form-card" :class="{ 'agent-focus-card': hasAgentNeed('设计', '内容', '交付', '周期', '行业') }">
        <view class="form-label-row"><text class="form-label">{{ t('demandPublish.detailLabel') }}</text><text v-if="hasAgentNeed('设计', '内容', '交付', '周期', '行业')" class="agent-field-badge">建议补充</text></view>
        <textarea class="form-textarea" v-model="form.description" :placeholder="t('demandPublish.detailPlaceholder')" maxlength="2000"/>
        <text class="form-count">{{ form.description.length }}/2000</text>
      </view>

      <view class="form-card">
        <text class="form-label">{{ t('demandPublish.contactLabel') }}</text>
        <input class="form-input" v-model="form.contact_name" :placeholder="t('demandPublish.contactPlaceholder')"/>
      </view>

      <view class="form-card">
        <text class="form-label">{{ t('demandPublish.phoneLabel') }}</text>
        <input class="form-input" type="tel" v-model="form.contact_phone" :placeholder="t('demandPublish.phonePlaceholder')" maxlength="11"/>
      </view>

      <view class="form-card">
        <text class="form-label">{{ t('demandPublish.wechatLabel') }}</text>
        <input class="form-input" v-model="form.contact_wechat" :placeholder="t('demandPublish.optional')"/>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="draft-btn" @tap="saveDraft"><text>{{ t('demandPublish.saveDraft') }}</text></view>
      <view class="submit-btn" :class="{ submitting }" @tap="submitForm"><text>{{ submitting ? t('common.loading') : (isEdit ? t('demandPublish.saveChanges') : t('demand.publish')) }}</text></view>
    </view>

    <!-- 地区选择 -->
    <view v-if="showRegionPicker" class="picker-mask" @tap="showRegionPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('listPage.selectRegion') }}</text><text class="picker-close" @tap="showRegionPicker = false">✕</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: form.region === r }" v-for="r in regions" :key="r" @tap="form.region = r; showRegionPicker = false"><text>{{ regionName(r) }}</text></view>
        </view>
      </view>
    </view>

    <!-- 分类选择 -->
    <view v-if="showCategoryPicker" class="picker-mask" @tap="showCategoryPicker = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('listPage.selectCategory') }}</text><text class="picker-close" @tap="showCategoryPicker = false">✕</text></view>
        <view class="picker-grid">
          <view class="picker-opt" :class="{ active: form.category_id === c.id }" v-for="c in categories" :key="c.id" @tap="form.category_id = c.id; form.category_name = c.name; showCategoryPicker = false"><text>{{ c.icon }} {{ categoryName(c.id, c.name) }}</text></view>
        </view>
      </view>
    </view>

    <!-- 发布须知 -->
    <view v-if="showHelp" class="picker-mask" @tap="showHelp = false">
      <view class="picker-panel" @tap.stop>
        <view class="picker-header"><text>{{ t('demandPublish.guideTitle') }}</text><text class="picker-close" @tap="showHelp = false">✕</text></view>
        <view class="help-list">
          <text class="help-item">{{ t('demandPublish.help1') }}</text>
          <text class="help-item">{{ t('demandPublish.help2') }}</text>
          <text class="help-item">{{ t('demandPublish.help3') }}</text>
          <text class="help-item">{{ t('demandPublish.help4') }}</text>
          <text class="help-item">{{ t('demandPublish.help5') }}</text>
          <text class="help-item">{{ t('demandPublish.help6') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { DEMAND_CATEGORIES, REGIONS, STORAGE_KEYS } from '@/config/constants'
import { bridge } from '@/api/bridge'
import { guardClick, toastError } from '@/utils/feedback'
import { quoteTypes, categoryName, regionName } from '@/utils/i18n-maps'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { scopedStorageKey } from '@/utils/session'
import { useUserStore } from '@/stores/user'
useNavTitle('titles.demandPublish')

const userStore = useUserStore()
const demandDraftKey = () => scopedStorageKey(STORAGE_KEYS.DEMAND_DRAFT, userStore.userId)
const agentDraftKey = () => scopedStorageKey(STORAGE_KEYS.AGENT_DRAFT, userStore.userId)
const demandContactKey = () => scopedStorageKey(STORAGE_KEYS.LAST_DEMAND_CONTACT, userStore.userId)

const categories = ref([...DEMAND_CATEGORIES])
const regions = REGIONS

const isEdit = ref(false)
const editId = ref(null)

const form = ref({ title: '', company_name: '', region: '', category_id: '', category_name: '', quote_type: 'negotiate', budget_min: null, budget_max: null, description: '', contact_name: '', contact_phone: '', contact_wechat: '', tags: [] })
const budgetMin = ref('')
const budgetMax = ref('')
const draftContext = ref(null)
const showRegionPicker = ref(false)
const showCategoryPicker = ref(false)
const showHelp = ref(false)
const { state: submitState, run: submitRequest } = useRequest((payload) => {
  if (isEdit.value) return bridge.demand.update(editId.value, payload)
  return bridge.demand.create(payload)
})
const submitting = computed(() => submitState.value === 'loading')

// 智能价格建议（Mock/真实后端统一通过 bridge）
const priceSuggestion = ref(null)
watch(
  [() => form.value.quote_type, () => form.value.category_id],
  async ([qt, cid]) => {
    if (qt !== 'self' || !cid) { priceSuggestion.value = null; return }
    try {
      priceSuggestion.value = await bridge.smart.priceSuggestion(cid, qt)
    } catch (e) {
      priceSuggestion.value = null
    }
  },
  { immediate: true }
)

// 需求质量评分
const qualityScore = computed(() => {
  if (!form.value.title && !form.value.description) return null
  return bridge.smart.scoreDemandQuality(form.value)
})
const qualityLevel = computed(() => {
  if (!qualityScore.value) return 'low'
  if (qualityScore.value.total >= 80) return 'high'
  if (qualityScore.value.total >= 60) return 'mid'
  return 'low'
})

// 检查是否编辑模式
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1]

function decodeRouteOption(value) {
  const raw = String(value || '')
  if (!raw) return ''
  try { return decodeURIComponent(raw) } catch { return raw }
}

function applyCooperationIntent(options = {}) {
  const title = decodeRouteOption(options.cooperation_title)
  const prompt = decodeRouteOption(options.cooperation_prompt)
  const categoryId = decodeRouteOption(options.cooperation_category)
  if (title) form.value.title = title
  if (prompt) form.value.description = prompt
  if (categoryId) {
    form.value.category_id = categoryId
    const category = categories.value.find((item) => String(item.id || item._id) === categoryId)
    if (category) form.value.category_name = category.name
  }
}

if (currentPage?.options?.id) {
  isEdit.value = true
  editId.value = currentPage.options.id
} else {
  // 恢复草稿
  try {
    const draft = uni.getStorageSync(demandDraftKey())
    if (draft) {
      Object.assign(form.value, draft.form)
      budgetMin.value = draft.budgetMin || ''
      budgetMax.value = draft.budgetMax || ''
      draftContext.value = draft.agent_context || { source: draft.source === 'agent' ? 'agent' : 'manual', missing: [], questions: [] }
    }
  } catch {}
  if (currentPage?.options?.prompt) {
    try {
      form.value.description = decodeURIComponent(currentPage.options.prompt)
    } catch {
      form.value.description = currentPage.options.prompt
    }
  }
  try {
    const agentDraft = uni.getStorageSync(agentDraftKey())
    if (agentDraft?.source === 'agent') {
      applyAgentDraft(agentDraft)
      uni.removeStorageSync(agentDraftKey())
    }
  } catch {}
  // 恢复联系方式
  try {
    const last = uni.getStorageSync(demandContactKey())
    if (last && !form.value.contact_name) { form.value.contact_name = last.name || ''; form.value.contact_phone = last.phone || '' }
  } catch {}
  // 从合作生态进入时，意向标题、合作方向和补充模板优先于旧草稿，避免用户点了具体方向却仍看到上一条草稿。
  applyCooperationIntent(currentPage?.options || {})
}

function applyAgentDraft(draft) {
  if (!form.value.title && draft.title) form.value.title = draft.title
  if (!form.value.region && draft.region) form.value.region = draft.region
  if (!form.value.category_id && draft.category_id) {
    form.value.category_id = draft.category_id
    form.value.category_name = draft.category_name || ''
  }
  if (form.value.quote_type === 'negotiate' && draft.quote_type) form.value.quote_type = draft.quote_type
  if (!budgetMin.value && draft.budgetMin) budgetMin.value = draft.budgetMin
  if (!budgetMax.value && draft.budgetMax) budgetMax.value = draft.budgetMax
  if (!form.value.description && draft.description) form.value.description = draft.description
  if ((!form.value.tags || !form.value.tags.length) && Array.isArray(draft.tags)) form.value.tags = draft.tags
  draftContext.value = draft.agent_context || { source: 'agent', missing: [], questions: [] }
  persistDemandDraft()
}

// 编辑模式异步读取详情
onMounted(async () => {
  try {
    const remoteCategories = await bridge.category.list({ type: 'demand' })
    if (remoteCategories?.length) categories.value = remoteCategories
  } catch (error) { console.warn('[demand-publish] load categories failed:', error) }
  if (!isEdit.value) return
  const detail = await bridge.demand.detail(editId.value)
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
      contact_phone: detail.contact_phone || detail.phone || '',
      contact_wechat: detail.contact_wechat || detail.wechat || '',
      tags: detail.tags || []
    })
    if (detail.budget_min) budgetMin.value = (detail.budget_min / 100).toString()
    if (detail.budget_max) budgetMax.value = (detail.budget_max / 100).toString()
  }
})

function persistDemandDraft() {
  uni.setStorageSync(demandDraftKey(), {
    source: draftContext.value?.source || 'manual',
    form: { ...form.value },
    budgetMin: budgetMin.value,
    budgetMax: budgetMax.value,
    agent_context: draftContext.value
  })
}

function saveDraft() {
  persistDemandDraft()
  uni.showToast({ title: t('demandPublish.draftSaved'), icon: 'success' })
}

function dismissDraftContext() {
  draftContext.value = null
  persistDemandDraft()
}

function hasAgentNeed(...keywords) {
  const missing = draftContext.value?.missing || []
  return missing.some((item) => keywords.some((keyword) => String(item).includes(keyword)))
}

async function doSubmit() {
  const required = ['title', 'company_name', 'region', 'category_id', 'description', 'contact_name', 'contact_phone']
  for (const f of required) {
    if (!form.value[f]?.toString().trim()) { uni.showToast({ title: t('demandPublish.fillComplete'), icon: 'none' }); return }
  }
  // 手机号格式验证
  if (!/^1[3-9]\d{9}$/.test(form.value.contact_phone)) {
    uni.showToast({ title: t('demandPublish.invalidPhone'), icon: 'none' }); return
  }
  if (form.value.quote_type === 'self' && budgetMin.value) {
    form.value.budget_min = Math.round(parseFloat(budgetMin.value) * 100)
    form.value.budget_max = budgetMax.value ? Math.round(parseFloat(budgetMax.value) * 100) : null
  }
  try {
    const payload = {
      ...form.value,
      ...(draftContext.value?.source === 'agent' ? { agent_context: draftContext.value } : {})
    }
    const result = await submitRequest(payload)
    if (isEdit.value) {
      uni.showToast({ title: t('demandPublish.updateSuccess'), icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      uni.setStorageSync(demandContactKey(), { name: form.value.contact_name, phone: form.value.contact_phone })
      uni.removeStorageSync(demandDraftKey())
      const pending = result?.status === 'pending'
      uni.showToast({ title: pending ? t('demandPublish.pendingSuccess') : t('demandPublish.publishSuccess'), icon: 'success' })
      setTimeout(() => {
        if (result?._id) {
          uni.redirectTo({ url: `/pages/demand/detail?id=${result._id}` })
        } else {
          uni.switchTab({ url: '/pages/demand/list' })
        }
      }, 1500)
    }
  } catch {
    toastError(t('common.loadFailed'))
  }
}

// 防重复提交：避免误触重复发布需求
const submitForm = guardClick(doSubmit, 1500)
</script>

<style lang="scss" scoped>
.publish-page { min-height: 100vh; background: #F5F6FA; padding-bottom: 160rpx; }

.notice-bar { display: flex; align-items: center; padding: 16rpx 24rpx; margin: 16rpx 24rpx 0; background: rgba(245,158,11,0.1); border: 1rpx solid rgba(245,158,11,0.2); border-radius: 16rpx; }
.notice-icon { display: block; width: 28rpx; height: 28rpx; flex: 0 0 28rpx; }
.notice-text { flex: 1; font-size: 22rpx; color: #F59E0B; }
.notice-link { font-size: 22rpx; color: #FF6B35; }

.draft-context-card { margin: 16rpx 24rpx 0; padding: 18rpx 20rpx; border: 1rpx solid rgba(101,115,220,.2); border-radius: 16rpx; background: linear-gradient(135deg, rgba(101,115,220,.08), rgba(255,255,255,.92)); }
.draft-context-head, .draft-context-title { display: flex; align-items: center; }
.draft-context-head { justify-content: space-between; gap: 12rpx; }
.draft-context-title { gap: 7rpx; color: #3d4874; font-size: 25rpx; font-weight: 700; }
.draft-context-mark { color: #6876d8; font-size: 24rpx; }
.draft-context-close { padding: 2rpx 6rpx; color: #98a2b9; font-size: 32rpx; line-height: 1; }
.draft-context-desc { display: block; margin-top: 7rpx; color: #7d89a1; font-size: 22rpx; line-height: 1.45; }
.draft-context-block { margin-top: 12rpx; padding-top: 11rpx; border-top: 1rpx solid rgba(101,115,220,.12); }
.draft-context-block-title { display: block; color: #6673c9; font-size: 21rpx; font-weight: 700; }
.draft-context-item { display: block; margin-top: 5rpx; color: #68748d; font-size: 21rpx; line-height: 1.4; }
.draft-context-questions .draft-context-block-title { color: #4b9a78; }

.form-label-row { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.form-label-row .form-label { margin-bottom: 0; }
.agent-focus-card { border: 1rpx solid rgba(255,107,53,.22); box-shadow: 0 4rpx 14rpx rgba(255,107,53,.06); }
.agent-field-badge { padding: 5rpx 9rpx; border-radius: 8rpx; color: #ed7650; background: #fff1eb; font-size: 20rpx; }
.agent-field-hint { display: block; margin-top: 10rpx; color: #ed7650; font-size: 21rpx; }

.form-wrap { padding: 16rpx 24rpx; }
.form-card { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.form-label { display: block; margin-bottom: 12rpx; color: rgba(0,0,0,0.85); font-family: inherit; font-size: 26rpx; font-weight: 700; line-height: 1.35; }
.form-input { display: block; width: 100%; height: 80rpx; min-height: 80rpx; box-sizing: border-box; padding: 14rpx 2rpx 12rpx; border: 0; border-bottom: 1rpx solid #F5F6FA; border-radius: 0; color: rgba(0,0,0,0.85); background: transparent; font-family: inherit; font-size: 28rpx; font-weight: 500; line-height: 1.45; vertical-align: middle; }
.form-textarea { display: block; width: 100%; min-height: 200rpx; box-sizing: border-box; padding: 14rpx 2rpx; border: 0; border-bottom: 1rpx solid #F5F6FA; border-radius: 0; color: rgba(0,0,0,0.85); background: transparent; font-family: inherit; font-size: 28rpx; font-weight: 500; line-height: 1.6; }
.form-count { font-size: 20rpx; color: rgba(0,0,0,0.35); display: block; text-align: right; margin-top: 4rpx; }
.form-select { display: flex; align-items: center; justify-content: space-between; min-height: 76rpx; padding: 0 2rpx; border-bottom: 1rpx solid #F5F6FA; }
.form-select > text:first-child { min-width: 0; overflow: hidden; color: rgba(0,0,0,0.85); font-family: inherit; font-size: 28rpx; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.placeholder { color: rgba(0,0,0,0.35); }
.select-arrow { flex: 0 0 auto; margin-left: 16rpx; color: rgba(0,0,0,0.3); font-size: 22rpx; line-height: 1; }

.quote-row { display: flex; }
.quote-opt { padding: 12rpx 24rpx; background: #F5F6FA; border-radius: 16rpx; font-size: 24rpx; color: rgba(0,0,0,0.6); }
.quote-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

.budget-row { display: flex; align-items: center; }
.budget-input { display: block; min-width: 0; height: 72rpx; flex: 1; box-sizing: border-box; padding: 12rpx; border: 1rpx solid transparent; border-radius: 12rpx; color: rgba(0,0,0,0.85); background: #F5F6FA; font-family: inherit; font-size: 28rpx; line-height: 1.45; text-align: center; }
.budget-sep { color: rgba(0,0,0,0.3); }

/* 价格建议卡片 */
.price-suggest-card { background: rgba(59,130,246,0.05); border: 1rpx solid rgba(59,130,246,0.15); }
.price-suggest-title { font-size: 26rpx; font-weight: bold; color: #3B82F6; display: block; margin-bottom: 8rpx; }
.price-suggest-text { font-size: 24rpx; color: rgba(0,0,0,0.6); display: block; margin-bottom: 12rpx; }
.price-suggest-row { display: flex; align-items: center; }
.ps-tag { background: rgba(16,185,129,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 12rpx; }
.ps-tag text { font-size: 20rpx; color: #10B981; font-weight: bold; }
.ps-range { font-size: 24rpx; color: rgba(0,0,0,0.5); }

/* 质量评分卡片 */
.quality-card { background: rgba(255,107,53,0.04); border: 1rpx solid rgba(255,107,53,0.12); }
.quality-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.quality-title { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.quality-score { font-size: 32rpx; font-weight: bold; }
.q-high { color: #10B981; }
.q-mid { color: #F59E0B; }
.q-low { color: #EF4444; }
.quality-bar { height: 10rpx; background: #F5F6FA; border-radius: 5rpx; overflow: hidden; margin-bottom: 12rpx; }
.quality-fill { height: 100%; border-radius: 5rpx; transition: width 0.3s ease; }
.q-fill-high { background: linear-gradient(90deg, #10B981, #34D399); }
.q-fill-mid { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
.q-fill-low { background: linear-gradient(90deg, #EF4444, #F87171); }
.quality-tips { display: flex; flex-direction: column; }
.quality-tip { font-size: 22rpx; color: rgba(0,0,0,0.5); line-height: 1.8; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.04); }
.draft-btn { padding: 20rpx 40rpx; background: #F5F6FA; border-radius: 24rpx; font-size: 28rpx; color: rgba(0,0,0,0.6); }
.submit-btn { flex: 1; padding: 20rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; text-align: center; }
.submit-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }

.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1200; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.picker-header { display: flex; justify-content: space-between; margin-bottom: 24rpx; font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.picker-close { color: rgba(0,0,0,0.4); padding: 4rpx; }
.picker-grid { display: flex; flex-wrap: wrap; }
.picker-opt { padding: 14rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; background: #F5F6FA; color: rgba(0,0,0,0.6); }
.picker-opt.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

.help-list { padding: 12rpx 0; }
.help-item { font-size: 24rpx; color: rgba(0,0,0,0.6); line-height: 2; }
/* Overflow guard: form guidance, picker options and the fixed submit bar all shrink safely. */
.publish-page,
.notice-bar,
.draft-context-card,
.draft-context-head,
.draft-context-title,
.form-wrap,
.form-card,
.form-label-row,
.price-suggest-row,
.quality-header,
.bottom-bar,
.picker-panel,
.picker-header,
.picker-grid,
.help-list { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.publish-page { overflow-x: hidden; }
.notice-text,
.draft-context-title,
.draft-context-desc,
.draft-context-item,
.form-label,
.agent-field-hint,
.price-suggest-text,
.ps-range,
.quality-title,
.quality-tip,
.help-item { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.notice-text,
.draft-context-title,
.form-label-row > .form-label,
.quality-title,
.ps-range { min-width: 0; flex: 1 1 auto; overflow: hidden; }
.notice-link,
.draft-context-close,
.agent-field-badge,
.quality-score,
.select-arrow,
.budget-sep { flex: 0 0 auto; white-space: nowrap; }
.draft-context-head,
.form-label-row,
.quality-header { gap: 10rpx; }
.form-select > text:first-child { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.quote-row,
.picker-grid,
.price-suggest-row { flex-wrap: wrap; gap: 8rpx; }
.quote-opt,
.picker-opt,
.ps-tag { flex: 0 0 auto; max-width: 100%; }
.ps-range { white-space: normal; }
.bottom-bar { gap: 10rpx; overflow-x: hidden; }
.draft-btn { flex: 0 0 auto; white-space: nowrap; }
.submit-btn { min-width: 0; box-sizing: border-box; white-space: nowrap; }
.picker-panel { overflow-x: hidden; overflow-y: auto; }
.picker-header > text:first-child { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notice-bar,
.draft-context-card { width: auto; }

@media (max-width: 420px) {
  .notice-bar,
  .draft-context-card { margin-right: 16rpx; margin-left: 16rpx; }
  .form-wrap { padding-right: 16rpx; padding-left: 16rpx; }
  .bottom-bar { padding-right: 16rpx; padding-left: 16rpx; }
  .draft-btn { padding-right: 20rpx; padding-left: 20rpx; }
  .submit-btn { padding-right: 14rpx; padding-left: 14rpx; }
  .picker-panel { padding-right: 20rpx; padding-left: 20rpx; }
}
</style>
