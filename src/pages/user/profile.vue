<template>
  <scroll-view class="profile-scroll" scroll-y>
    <view class="profile-page">
      <view class="profile-hero">
        <view class="avatar"><text>{{ firstLetter }}</text></view>
        <view class="hero-copy">
          <text class="hero-title">个人资料</text>
          <text class="hero-desc">资料越完整，平台越容易按条件找到适合你的团队和社群。</text>
        </view>
      </view>

      <view class="completion-card">
        <view class="completion-head">
          <view><text class="completion-title">资料完成度</text><text class="completion-desc">用于匹配结果和对接介绍</text></view>
          <text class="completion-value">{{ completion }}%</text>
        </view>
        <view class="progress-track"><view class="progress-value" :style="{ width: `${completion}%` }" /></view>
        <text class="completion-tip">{{ completion >= 100 ? '资料已完整，可以开始发布需求了' : `还差 ${100 - completion}% ，补全后筛选会更准确` }}</text>
      </view>

      <view class="section-card">
        <view class="section-heading"><text>怎么称呼你</text><text>公开展示昵称，不展示密码</text></view>
        <view class="field">
          <text class="field-label">昵称</text>
          <input v-model="form.nickname" class="field-input" type="text" maxlength="20" placeholder="请输入姓名或常用称呼" />
        </view>
        <view class="field">
          <text class="field-label">绑定手机号</text>
          <view class="readonly-input"><text>{{ form.phone || '注册后绑定' }}</text><text>已绑定</text></view>
        </view>
      </view>

      <view class="section-card">
        <view class="section-heading"><text>你的业务身份</text><text>让合作方快速了解你</text></view>
        <view class="identity-group">
          <text class="field-label">机构类型</text>
          <view class="identity-options">
            <view v-for="item in organizationTypeOptions" :key="item.value" class="identity-option" :class="{ active: form.organization_type === item.value }" @tap="form.organization_type = item.value"><text>{{ item.label }}</text><text>{{ item.desc }}</text></view>
          </view>
        </view>
        <view class="identity-group">
          <text class="field-label">平台使用方式</text>
          <view class="identity-options">
            <view class="identity-option" :class="{ active: form.workflow_role === 'demand_owner' }" @tap="form.workflow_role = 'demand_owner'"><text>甲方 · 发布需求</text><text>让 AI 帮我整理并发布合作需求</text></view>
            <view class="identity-option" :class="{ active: form.workflow_role === 'service_provider' }" @tap="form.workflow_role = 'service_provider'"><text>乙方 · 寻找项目</text><text>从需求广场找机会并与需求 Agent 沟通</text></view>
          </view>
        </view>
        <view class="field">
          <text class="field-label">所在公司</text>
          <input v-model="form.company" class="field-input" type="text" maxlength="40" placeholder="请输入公司或组织名称" />
        </view>
        <view class="field">
          <text class="field-label">职位 / 擅长方向</text>
          <input v-model="form.title" class="field-input" type="text" maxlength="30" placeholder="例如：品牌增长负责人" />
        </view>
        <view class="field">
          <text class="field-label">所在城市</text>
          <input v-model="form.city" class="field-input" type="text" maxlength="20" placeholder="例如：上海" />
        </view>
      </view>

      <view class="section-card">
        <view class="section-heading"><text>安全联系方式</text><text>邮箱可用于找回密码</text></view>
        <view class="field">
          <text class="field-label">邮箱地址</text>
          <view class="verification-wrap">
            <input v-model="form.email" class="field-input verification-input" type="text" maxlength="160" placeholder="请输入常用邮箱" @input="onEmailInput" />
            <button class="code-button" :disabled="emailSending || emailCountdown > 0" @tap="requestEmailCode">
              {{ emailCountdown > 0 ? emailCountdown + 's' : (emailSending ? '发送中…' : '获取验证码') }}
            </button>
          </view>
          <text v-if="form.emailVerified" class="verified-hint">✓ 邮箱已验证，可用于找回密码</text>
          <text v-if="emailDebugCode" class="debug-hint">本地联调验证码：{{ emailDebugCode }}（仅开发环境显示）</text>
        </view>
        <view v-if="emailCodeSent && !form.emailVerified" class="field">
          <text class="field-label">邮箱验证码</text>
          <view class="verification-wrap">
            <input v-model="emailCode" class="field-input verification-input" type="number" maxlength="6" placeholder="请输入6位验证码" />
            <button class="verify-button" :disabled="emailVerifying" @tap="confirmEmailCode"><text>{{ emailVerifying ? '验证中…' : '验证邮箱' }}</text></button>
          </view>
        </view>
      </view>

      <view class="privacy-note"><text class="privacy-mark">i</text><text>手机号仅用于账号安全和必要的沟通，不会在公开页面展示。验证后的邮箱可用于找回密码。</text></view>
      <text v-if="errorMessage" class="error-message">{{ errorMessage }}</text>
      <button class="save-button" :disabled="saving || loading" @tap="save"><text>{{ saving ? '保存中…' : '保存资料' }}</text></button>
      <view class="bottom-space" />
    </view>
  </scroll-view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { useNavTitle } from '@/hooks/useNavTitle'

useNavTitle('titles.profileSettings', '个人资料')

const userStore = useUserStore()
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
// 机构类型只描述“你是谁”，不再决定甲乙方身份；平台使用方式才是业务角色。
const organizationTypeOptions = [
  { value: 'project', label: '项目企业', desc: '有融资、渠道、资源或业务合作需求' },
  { value: 'capital', label: '资金 / 投资机构', desc: '银行、基金、券商、FA 或产业资本' },
  { value: 'brand', label: '品牌方', desc: '消费品牌、厂商或内容 IP 方' },
  { value: 'agency', label: '服务机构', desc: '营销、活动、媒体等专业服务团队' },
  { value: 'other', label: '其他机构', desc: '园区、协会、平台或其他组织' }
]
const form = ref({ nickname: '', phone: '', email: '', emailVerified: false, company: '', title: '', city: '', workflow_role: 'demand_owner', organization_type: 'project' })
const originalEmail = ref('')
const emailCode = ref('')
const emailCodeSent = ref(false)
const emailSending = ref(false)
const emailVerifying = ref(false)
const emailCountdown = ref(0)
const emailDebugCode = ref('')
let emailTimer = null

const requiredFields = computed(() => [form.value.nickname, form.value.company, form.value.title, form.value.city, form.value.workflow_role, form.value.organization_type])
const completion = computed(() => Math.round(requiredFields.value.filter((item) => String(item || '').trim()).length / requiredFields.value.length * 100))
const firstLetter = computed(() => String(form.value.nickname || userStore.nickname || '我').trim().slice(0, 1) || '我')

function fillForm(user = {}) {
  form.value = {
    nickname: user.nickname || '',
    phone: user.phone || '',
    email: user.email || '',
    emailVerified: Boolean(user.email_verified),
    company: user.company || '',
    title: user.title || '',
    city: user.city || '',
    workflow_role: user.workflow_role || 'demand_owner',
    organization_type: user.organization_type || 'project'
  }
  originalEmail.value = String(user.email || '').trim().toLowerCase()
  emailCode.value = ''
  emailCodeSent.value = false
  emailDebugCode.value = ''
}

onMounted(async () => {
  if (!userStore.token) {
    uni.reLaunch({ url: '/pages/user/login' })
    return
  }
  try {
    const user = await userStore.refreshInfo()
    fillForm(user || userStore.userInfo || {})
  } catch (error) {
    errorMessage.value = error?.message || '资料加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
})

function onEmailInput() {
  const email = String(form.value.email || '').trim().toLowerCase()
  if (email !== originalEmail.value) {
    form.value.emailVerified = false
    emailCodeSent.value = false
    emailCode.value = ''
  }
}

function startEmailCountdown(seconds) {
  stopEmailCountdown()
  emailCountdown.value = Math.max(1, Math.floor(seconds))
  emailTimer = setInterval(() => {
    emailCountdown.value -= 1
    if (emailCountdown.value <= 0) stopEmailCountdown()
  }, 1000)
}

function stopEmailCountdown() {
  if (emailTimer) clearInterval(emailTimer)
  emailTimer = null
  emailCountdown.value = 0
}

async function requestEmailCode() {
  const email = String(form.value.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errorMessage.value = '请先填写有效的邮箱地址'
    return
  }
  if (emailSending.value || emailCountdown.value > 0) return
  emailSending.value = true
  errorMessage.value = ''
  try {
    const result = await bridge.user.requestEmailVerificationCode({ email })
    emailDebugCode.value = result?.debug_code || ''
    emailCodeSent.value = true
    startEmailCountdown(Number(result?.retry_after) || 60)
    uni.showToast({ title: emailDebugCode.value ? '验证码已生成' : '验证码已发送', icon: 'none' })
  } catch (error) {
    errorMessage.value = error?.message || '验证码发送失败，请稍后重试'
  } finally {
    emailSending.value = false
  }
}

async function confirmEmailCode() {
  const email = String(form.value.email || '').trim().toLowerCase()
  const code = String(emailCode.value || '').trim()
  if (!emailCodeSent.value) return (errorMessage.value = '请先获取邮箱验证码')
  if (!/^\d{6}$/.test(code)) return (errorMessage.value = '请输入6位邮箱验证码')
  if (emailVerifying.value) return
  emailVerifying.value = true
  errorMessage.value = ''
  try {
    const user = await bridge.user.confirmEmailVerificationCode({ email, code })
    form.value.emailVerified = true
    emailDebugCode.value = ''
    emailCodeSent.value = false
    stopEmailCountdown()
    if (user) userStore.userInfo = user
    uni.showToast({ title: '邮箱已验证', icon: 'success' })
  } catch (error) {
    errorMessage.value = error?.message || '邮箱验证失败，请检查验证码'
  } finally {
    emailVerifying.value = false
  }
}

async function save() {
  const data = form.value
  if (String(data.nickname).trim().length < 2) return (errorMessage.value = '昵称至少填写2个字')
  if (!String(data.company).trim()) return (errorMessage.value = '请填写所在公司')
  if (!String(data.title).trim()) return (errorMessage.value = '请填写职位或擅长方向')
  if (!String(data.city).trim()) return (errorMessage.value = '请填写所在城市')
  if (saving.value) return
  errorMessage.value = ''
  saving.value = true
  try {
    const user = await userStore.updateProfile({
      nickname: String(data.nickname).trim(),
      company: String(data.company).trim(),
      title: String(data.title).trim(),
      city: String(data.city).trim(),
      workflow_role: data.workflow_role,
      organization_type: data.organization_type
    })
    fillForm(user || data)
    uni.showToast({ title: '资料已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 350)
  } catch (error) {
    errorMessage.value = error?.message || '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}

onUnmounted(stopEmailCountdown)
</script>

<style lang="scss" scoped>
.profile-scroll { min-height: 100vh; background: #F5F7FB; }
.profile-page { min-height: 100vh; padding: 30rpx 28rpx 0; background: #F5F7FB; }
.profile-hero { display: flex; align-items: center; padding: 9rpx 6rpx 28rpx; }
.avatar { display: flex; align-items: center; justify-content: center; width: 98rpx; height: 98rpx; border-radius: 31rpx; color: #FFF; background: linear-gradient(145deg, #6272E4, #8E98F0); box-shadow: 0 14rpx 25rpx rgba(98,114,228,.2); }
.avatar text { font-size: 42rpx; font-weight: 850; }
.hero-copy { flex: 1; margin-left: 20rpx; }
.hero-title { display: block; color: #2D3A5A; font-size: 39rpx; font-weight: 850; }
.hero-desc { display: block; margin-top: 7rpx; color: #8B97AE; font-size: 21rpx; line-height: 1.55; }
.completion-card { margin-bottom: 21rpx; padding: 24rpx; border-radius: 24rpx; color: #FFF; background: linear-gradient(120deg, #273457, #6675DD); box-shadow: 0 17rpx 34rpx rgba(52,66,125,.18); }
.completion-head { display: flex; align-items: flex-start; justify-content: space-between; }
.completion-title, .completion-desc { display: block; }
.completion-title { font-size: 27rpx; font-weight: 800; }
.completion-desc { margin-top: 5rpx; color: rgba(255,255,255,.65); font-size: 19rpx; }
.completion-value { font-size: 43rpx; font-weight: 850; }
.progress-track { height: 10rpx; margin-top: 19rpx; overflow: hidden; border-radius: 99rpx; background: rgba(255,255,255,.2); }
.progress-value { height: 100%; border-radius: 99rpx; background: #FFCB83; transition: width .25s ease; }
.completion-tip { display: block; margin-top: 12rpx; color: rgba(255,255,255,.72); font-size: 19rpx; }
.section-card { margin-bottom: 18rpx; padding: 23rpx 22rpx 25rpx; border: 1rpx solid #E5E9F1; border-radius: 24rpx; background: #FFF; box-shadow: 0 9rpx 24rpx rgba(70,87,123,.035); }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 5rpx; }
.section-heading text:first-child { color: #34415F; font-size: 27rpx; font-weight: 800; }
.section-heading text:last-child { color: #A0ABBD; font-size: 18rpx; }
.field { margin-top: 19rpx; }
.field-label { display: block; margin-bottom: 8rpx; color: #69758B; font-size: 20rpx; font-weight: 700; }
.identity-group { margin-top: 19rpx; }
.identity-group > .field-label { margin-bottom: 10rpx; }
.identity-options { display: flex; gap: 10rpx; }
.identity-option { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 5rpx; padding: 13rpx 12rpx; border: 1rpx solid #E6EAF2; border-radius: 14rpx; color: #69758B; background: #FAFBFD; }
.identity-option text:first-child { color: #34415F; font-size: 21rpx; font-weight: 700; }
.identity-option text:last-child { overflow: hidden; color: #9AA5B7; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }
.identity-option.active { border-color: #6573DC; background: #EEF0FF; box-shadow: 0 5rpx 14rpx rgba(101,115,220,.12); }
.identity-option.active text:first-child { color: #4F5DC8; }
.field-input, .readonly-input { width: 100%; height: 78rpx; box-sizing: border-box; padding: 0 19rpx; border: 1rpx solid #E6EAF2; border-radius: 16rpx; color: #34415F; background: #FAFBFD; font-size: 24rpx; }
.readonly-input { display: flex; align-items: center; justify-content: space-between; color: #7D899F; }
.readonly-input text:last-child { padding: 6rpx 12rpx; border-radius: 99rpx; color: #3C9B71; background: #EEF9F3; font-size: 17rpx; }
.verification-wrap { display: flex; align-items: center; gap: 12rpx; }
.verification-input { min-width: 0; flex: 1; }
.code-button, .verify-button { width: 174rpx; height: 78rpx; flex: 0 0 174rpx; padding: 0; border-radius: 16rpx; font-size: 19rpx; line-height: 78rpx; }
.code-button { color: #6573DC; background: #EEF0FF; }
.verify-button { color: #FFF; background: #6573DC; }
.code-button[disabled], .verify-button[disabled] { opacity: .55; }
.verified-hint, .debug-hint { display: block; margin-top: 9rpx; font-size: 18rpx; }
.verified-hint { color: #3C9B71; }
.debug-hint { color: #BA7C41; }
.privacy-note { display: flex; align-items: flex-start; margin: 8rpx 5rpx 20rpx; color: #9AA5B7; font-size: 19rpx; line-height: 1.55; }
.privacy-mark { display: flex; align-items: center; justify-content: center; flex: 0 0 27rpx; width: 27rpx; height: 27rpx; margin: 2rpx 9rpx 0 0; border: 1rpx solid #B8C1D3; border-radius: 50%; color: #8C98AC; font-size: 17rpx; }
.error-message { display: block; margin: 0 4rpx 13rpx; color: #D76565; font-size: 20rpx; }
.save-button { width: 100%; height: 84rpx; border-radius: 17rpx; color: #FFF; background: linear-gradient(105deg, #6573DC, #818CE8); box-shadow: 0 13rpx 24rpx rgba(101,115,220,.22); font-size: 27rpx; font-weight: 800; line-height: 84rpx; }
.save-button[disabled] { opacity: .55; box-shadow: none; }
.bottom-space { height: 70rpx; }

/* 资料页在窄屏下让表单输入和验证码按钮分配剩余空间，长说明只在内容列内折行。 */
.profile-scroll, .profile-page, .profile-hero, .hero-copy, .completion-card, .completion-head,
.section-card, .section-heading, .readonly-input, .verification-wrap, .privacy-note { min-width: 0; }
.profile-scroll, .profile-page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.hero-copy { flex: 1; overflow: hidden; }
.hero-title, .hero-desc, .completion-title, .completion-desc, .completion-tip,
.section-heading text, .readonly-input text, .privacy-note > text:last-child { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.hero-title, .completion-title, .completion-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hero-desc, .completion-tip, .privacy-note > text:last-child { display: block; }
.completion-head, .section-heading { gap: 12rpx; }
.completion-head > view, .section-heading text:first-child { min-width: 0; flex: 1; overflow: hidden; }
.completion-value, .section-heading text:last-child, .readonly-input text:last-child, .code-button, .verify-button { flex: 0 0 auto; white-space: nowrap; }
.readonly-input text:first-child, .verification-input { min-width: 0; overflow: hidden; }
.readonly-input text:first-child { text-overflow: ellipsis; white-space: nowrap; }
.privacy-note { align-items: flex-start; }

@media (max-width: 420px) {
  .profile-page { padding-right: 16rpx; padding-left: 16rpx; }
  .profile-hero { padding-right: 0; padding-left: 0; }
  .avatar { width: 78rpx; height: 78rpx; }
  .hero-copy { margin-left: 14rpx; }
  .hero-title { font-size: 32rpx; }
  .code-button, .verify-button { width: 148rpx; flex-basis: 148rpx; }
  .section-heading { align-items: flex-start; }
  .section-heading text:first-child { white-space: normal; }
  .identity-options { flex-direction: column; }
}
</style>
