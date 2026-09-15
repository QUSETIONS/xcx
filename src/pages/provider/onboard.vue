<template>
  <scroll-view class="onboard-scroll" scroll-y>
    <view class="onboard-page">
      <view class="hero">
        <view class="hero-mark"><image src="/static/icons/handshake.svg" mode="aspectFit" /></view>
        <view class="hero-copy">
          <text class="eyebrow">MediaMatch · 服务方</text>
          <text class="hero-title">让合适的需求找到你</text>
          <text class="hero-desc">提交真实的服务能力和案例方向，审核通过后才会出现在匹配与邀约中。</text>
        </view>
      </view>

      <view v-if="provider" class="status-banner" :class="`status-${verification}`">
        <view class="status-dot" />
        <view class="status-copy">
          <text class="status-title">{{ statusTitle }}</text>
          <text class="status-desc">{{ statusDescription }}</text>
        </view>
      </view>
      <view v-if="reviewNote" class="review-note"><text class="review-note-label">审核说明</text><text class="review-note-copy">{{ reviewNote }}</text></view>

      <view class="section-card">
        <view class="section-heading"><text>服务方资料</text><text>必填</text></view>
        <view class="field">
          <text class="field-label">服务方名称</text>
          <input v-model="form.name" class="field-input" maxlength="60" placeholder="例如：青禾品牌顾问" />
        </view>
        <view class="field">
          <text class="field-label">所在公司 / 工作室</text>
          <input v-model="form.company" class="field-input" maxlength="80" placeholder="对外合作时使用的主体名称" />
        </view>
        <view class="field-row">
          <view class="field half">
            <text class="field-label">联系人职位</text>
            <input v-model="form.title" class="field-input" maxlength="40" placeholder="例如：负责人" />
          </view>
          <view class="field half">
            <text class="field-label">所在城市</text>
            <input v-model="form.city" class="field-input" maxlength="20" placeholder="例如：上海" />
          </view>
        </view>
        <view class="field">
          <text class="field-label">主要服务类别</text>
          <picker mode="selector" :range="categories" range-key="name" :value="categoryIndex" @change="selectCategory">
            <view class="picker-input"><text :class="{ placeholder: !selectedCategory }">{{ selectedCategory || '请选择一个服务类别' }}</text><text class="picker-arrow">⌄</text></view>
          </picker>
        </view>
        <view class="field">
          <text class="field-label">服务地区</text>
          <input v-model="form.region" class="field-input" maxlength="60" placeholder="例如：上海 / 全国" />
        </view>
        <view class="field">
          <text class="field-label">参考起步报价（元）</text>
          <input v-model="form.avg_price_yuan" class="field-input" type="number" maxlength="10" placeholder="可填 0，具体以沟通报价为准" />
        </view>
      </view>

      <view class="section-card">
        <view class="section-heading"><text>你能解决什么问题</text><text>至少 12 个字</text></view>
        <textarea v-model="form.intro" class="textarea" maxlength="500" placeholder="说清楚服务范围、擅长行业、交付方式或合作经验" />
        <view class="field">
          <text class="field-label">服务标签</text>
          <input v-model="form.tagsText" class="field-input" maxlength="120" placeholder="用逗号分隔，例如：品牌定位，公关传播，年度策略" />
        </view>
      </view>

      <view v-if="errorMessage" class="error-message">{{ errorMessage }}</view>
      <view class="notice"><text class="notice-mark">i</text><text>提交后由运营审核服务资料。审核通过后，服务方才会进入公开匹配和项目邀约。</text></view>
      <button class="submit-button" :disabled="saving || loading" @tap="save"><text>{{ saving ? '提交中…' : (provider ? '保存并重新提交审核' : '提交入驻申请') }}</text></button>
      <view class="bottom-space" />
    </view>
  </scroll-view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { useNavTitle } from '@/hooks/useNavTitle'
import { toastError } from '@/utils/feedback'

useNavTitle('titles.providerOnboard', '服务方入驻')

const userStore = useUserStore()
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const provider = ref(null)
const verification = ref('none')
const reviewNote = ref('')
const categories = ref([])
const categoryIndex = ref(0)
const form = ref({ name: '', company: '', title: '', city: '', category_id: '', region: '', avg_price_yuan: '', intro: '', tagsText: '' })

const selectedCategory = computed(() => categories.value.find((item) => item.id === form.value.category_id)?.name || '')
const statusTitle = computed(() => ({ pending: '资料审核中', verified: '已认证，可接收邀约', rejected: '需要补充资料' }[verification.value] || '服务方资料'))
const statusDescription = computed(() => ({ pending: '运营审核通过后，你会出现在匹配结果中。', verified: '你的服务档案已对需求方开放。', rejected: '请根据审核意见补充信息后重新提交。' }[verification.value] || '完善资料后提交审核。'))

function fillProvider(data) {
  const next = data?.provider || data
  if (!next) return
  provider.value = next
  verification.value = data?.verification || 'pending'
  const user = data?.user || userStore.userInfo || {}
  reviewNote.value = parseVerifyInfo(user.verify_info).review_note || ''
  const tags = Array.isArray(next.tags) ? next.tags : []
  form.value = {
    ...form.value,
    name: next.name || '',
    category_id: next.category_id || '',
    region: next.region || '',
    avg_price_yuan: next.avg_price ? String(Math.round(Number(next.avg_price) / 100)) : '',
    intro: next.intro || '',
    tagsText: tags.join('，')
  }
  form.value.company = user.company || form.value.company
  form.value.title = user.title || form.value.title
  form.value.city = user.city || form.value.city
  const nextIndex = categories.value.findIndex((item) => item.id === form.value.category_id)
  if (nextIndex >= 0) categoryIndex.value = nextIndex
}

function parseVerifyInfo(value) {
  if (!value) return {}
  if (typeof value === 'object') return value
  try { return JSON.parse(value) || {} } catch { return {} }
}

async function load() {
  if (!userStore.token) {
    uni.reLaunch({ url: '/pages/user/login' })
    return
  }
  try {
    const isProviderAccount = userStore.userInfo?.account_type === 'provider' || userStore.userInfo?.role === 'provider'
    const [categoryResult, providerResult] = await Promise.all([
      bridge.category.list({ type: 'demand' }),
      // 普通需求方没有 provider 记录，不请求不存在的资源，避免页面初次打开误报 404。
      isProviderAccount ? bridge.provider.me().catch(() => null) : Promise.resolve(null)
    ])
    categories.value = Array.isArray(categoryResult) ? categoryResult : []
    if (providerResult?.provider) fillProvider(providerResult)
    else {
      form.value.company = userStore.userInfo?.company || ''
      form.value.title = userStore.userInfo?.title || ''
      form.value.city = userStore.userInfo?.city || ''
    }
  } catch (error) {
    errorMessage.value = error?.message || '页面加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function selectCategory(event) {
  const index = Number(event.detail.value) || 0
  categoryIndex.value = index
  form.value.category_id = categories.value[index]?.id || ''
}

async function save() {
  if (saving.value) return
  const data = form.value
  if (!data.name.trim() || !data.company.trim() || !data.title.trim() || !data.city.trim()) return (errorMessage.value = '请先填写名称、公司、职位和城市')
  if (!data.category_id) return (errorMessage.value = '请选择服务类别')
  if (!data.region.trim()) return (errorMessage.value = '请填写服务地区')
  if (data.intro.trim().length < 12) return (errorMessage.value = '服务介绍至少填写 12 个字')
  errorMessage.value = ''
  saving.value = true
  try {
    const payload = {
      name: data.name.trim(), company: data.company.trim(), title: data.title.trim(), city: data.city.trim(),
      category_id: data.category_id, region: data.region.trim(),
      avg_price: Math.max(0, Math.round(Number(data.avg_price_yuan || 0) * 100)),
      intro: data.intro.trim(), tags: data.tagsText.split(/[,，、]/).map((item) => item.trim()).filter(Boolean).slice(0, 12)
    }
    const result = provider.value ? await bridge.provider.update(payload) : await bridge.provider.onboard(payload)
    fillProvider(result)
    if (result?.user) {
      userStore.userInfo = result.user
      userStore.isAdmin = result.user.role === 'admin'
    }
    uni.showToast({ title: '资料已提交，等待审核', icon: 'success' })
  } catch (error) {
    errorMessage.value = error?.message || '提交失败，请稍后重试'
    toastError(errorMessage.value)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.onboard-scroll { min-height: 100vh; background: #F5F7FB; }
.onboard-page { min-height: 100vh; padding: 28rpx 28rpx 0; color: #303B57; background: #F5F7FB; }
.hero { display: flex; align-items: center; padding: 8rpx 4rpx 25rpx; }
.hero-mark { display: flex; align-items: center; justify-content: center; flex: 0 0 86rpx; width: 86rpx; height: 86rpx; border-radius: 27rpx; background: #EEF0FF; }
.hero-mark image { width: 47rpx; height: 47rpx; }
.hero-copy { margin-left: 18rpx; }
.eyebrow { display: block; color: #6573DC; font-size: 18rpx; letter-spacing: .12em; }
.hero-title { display: block; margin-top: 7rpx; color: #2D3A5A; font-size: 34rpx; font-weight: 850; }
.hero-desc { display: block; max-width: 560rpx; margin-top: 8rpx; color: #8B97AE; font-size: 20rpx; line-height: 1.55; }
.status-banner { display: flex; align-items: center; margin-bottom: 18rpx; padding: 18rpx 20rpx; border: 1rpx solid #E5E9F1; border-radius: 19rpx; background: #FFF; }
.status-dot { width: 15rpx; height: 15rpx; margin-right: 14rpx; border-radius: 50%; background: #F0A33B; }
.status-verified .status-dot { background: #2CA879; }.status-rejected .status-dot { background: #D76565; }
.status-copy { min-width: 0; }.status-title, .status-desc { display: block; }.status-title { color: #34415F; font-size: 23rpx; font-weight: 800; }.status-desc { margin-top: 4rpx; color: #8D99AC; font-size: 19rpx; }
.section-card { margin-bottom: 18rpx; padding: 23rpx 22rpx 25rpx; border: 1rpx solid #E5E9F1; border-radius: 23rpx; background: #FFF; box-shadow: 0 9rpx 24rpx rgba(70,87,123,.035); }
.section-heading { display: flex; justify-content: space-between; align-items: baseline; }.section-heading text:first-child { color: #34415F; font-size: 27rpx; font-weight: 800; }.section-heading text:last-child { color: #A0ABBD; font-size: 18rpx; }
.field { margin-top: 18rpx; }.field-row { display: flex; gap: 16rpx; }.half { flex: 1; min-width: 0; }.field-label { display: block; margin-bottom: 8rpx; color: #69758B; font-size: 20rpx; font-weight: 700; }.field-input, .picker-input { width: 100%; height: 76rpx; box-sizing: border-box; padding: 0 18rpx; border: 1rpx solid #E6EAF2; border-radius: 15rpx; color: #34415F; background: #FAFBFD; font-size: 23rpx; }.picker-input { display: flex; align-items: center; justify-content: space-between; }.picker-input .placeholder { color: #A3ADBC; }.picker-arrow { color: #8D99AC; font-size: 28rpx; }.textarea { width: 100%; min-height: 180rpx; box-sizing: border-box; margin-top: 18rpx; padding: 17rpx; border: 1rpx solid #E6EAF2; border-radius: 15rpx; color: #34415F; background: #FAFBFD; font-size: 23rpx; line-height: 1.55; }
.notice { display: flex; align-items: flex-start; margin: 5rpx 5rpx 18rpx; color: #8D99AC; font-size: 19rpx; line-height: 1.55; }.notice-mark { display: flex; align-items: center; justify-content: center; flex: 0 0 27rpx; width: 27rpx; height: 27rpx; margin: 2rpx 9rpx 0 0; border: 1rpx solid #B8C1D3; border-radius: 50%; font-size: 17rpx; }
.review-note { display: flex; flex-direction: column; margin: -4rpx 0 18rpx; padding: 16rpx 18rpx; border: 1rpx solid #F0DCC4; border-radius: 15rpx; background: #FFF8EE; }.review-note-label { color: #A8702C; font-size: 19rpx; font-weight: 800; }.review-note-copy { margin-top: 5rpx; color: #8B7357; font-size: 20rpx; line-height: 1.55; }
.error-message { margin: 0 4rpx 12rpx; color: #D76565; font-size: 20rpx; }.submit-button { width: 100%; height: 84rpx; border-radius: 17rpx; color: #FFF; background: linear-gradient(105deg, #6573DC, #818CE8); box-shadow: 0 13rpx 24rpx rgba(101,115,220,.22); font-size: 27rpx; font-weight: 800; line-height: 84rpx; }.submit-button[disabled] { opacity: .55; box-shadow: none; }.bottom-space { height: 70rpx; }

/* 入驻表单的固定图标/按钮保留尺寸，所有说明和输入内容在可变列内收缩。 */
.onboard-scroll, .onboard-page, .hero, .hero-copy, .status-banner, .status-copy, .section-card, .section-heading, .field-row, .half, .picker-input, .notice { min-width: 0; }
.onboard-scroll, .onboard-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.hero-copy, .status-copy { flex: 1; overflow: hidden; }
.hero-title, .hero-desc, .status-title, .status-desc, .section-heading text, .notice > text:last-child, .review-note-copy { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.hero-title, .status-title, .section-heading text:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hero-desc, .status-desc, .review-note-copy, .notice > text:last-child { display: block; }
.status-banner { align-items: flex-start; }
.status-dot, .hero-mark, .notice-mark, .submit-button { flex: 0 0 auto; }
.picker-input text:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker-arrow { flex: 0 0 auto; }
.section-heading { gap: 12rpx; }
.section-heading text:last-child { flex: 0 0 auto; white-space: nowrap; }
.notice { align-items: flex-start; }

@media (max-width: 420px) {
  .onboard-page { padding-right: 16rpx; padding-left: 16rpx; }
  .hero-mark { width: 70rpx; height: 70rpx; flex-basis: 70rpx; }
  .hero-copy { margin-left: 12rpx; }
  .hero-title { font-size: 30rpx; }
  .field-row { flex-direction: column; gap: 0; }
  .section-heading { align-items: flex-start; }
  .section-heading text:first-child { white-space: normal; }
}
</style>
