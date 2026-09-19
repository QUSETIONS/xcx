<template>
  <scroll-view class="login-scroll" scroll-y>
    <view class="login-page" :class="{ 'registration-page': fixedParty }">
      <view class="brand-row">
        <view class="brand-mark"><text>MM</text></view>
        <view class="brand-copy">
          <text class="brand-name">媒合智联</text>
          <text class="brand-en">MediaMatch</text>
        </view>
        <view class="real-badge"><text>正式账号</text></view>
      </view>

      <view v-if="!fixedParty" class="hero-copy">
        <text class="hero-eyebrow">从需求，到合作</text>
        <text class="hero-title">把事情说清楚，<br /><text class="hero-accent">找到愿意合作的人</text></text>
        <text class="hero-desc">先补全身份和业务信息，平台才能按条件筛选团队、社群和合作机会。</text>
      </view>

      <view class="auth-card">
        <view v-if="!fixedParty" class="mode-tabs">
          <view class="mode-tab" :class="{ active: mode === 'login' || mode === 'reset' }" @tap="switchMode('login')">登录</view>
          <view class="mode-tab" :class="{ active: mode === 'register' }" @tap="switchMode('register')">注册新账号</view>
        </view>

        <view class="form-intro">
          <text class="form-title">{{ mode === 'login' ? '继续使用媒合智联' : mode === 'register' ? (fixedParty === 'capital' ? '甲方注册' : fixedParty === 'project' ? '乙方注册' : '请选择注册身份') : '重置登录密码' }}</text>
          <text class="form-subtitle">{{ mode === 'login' ? '登录后可以继续查看需求和对接进展' : mode === 'register' ? (fixedParty === 'capital' ? '有需求、要发布 · 创建账号后发布需求并与乙方对接' : fixedParty === 'project' ? '提供服务 / 找项目 · 创建账号后完善乙方能力档案' : '甲方、乙方使用各自独立的注册页面') : `用绑定的${resetChannel === 'email' ? '邮箱' : '手机号'}验证身份，再设置新密码` }}</text>
        </view>

        <view v-if="mode === 'register' && !fixedParty" class="party-choices">
          <button class="party-choice" @tap="chooseParty('capital')"><text class="party-title">甲方注册</text><text class="party-desc">有需求、要发布</text><text class="party-action">进入甲方注册页</text></button>
          <button class="party-choice" @tap="chooseParty('project')"><text class="party-title">乙方注册</text><text class="party-desc">提供服务、找项目</text><text class="party-action">进入乙方注册页</text></button>
        </view>

        <template v-if="mode !== 'register' || fixedParty">

        <view v-if="mode === 'register'" class="field">
          <text class="field-label">怎么称呼</text>
          <input v-model="form.nickname" class="field-input" type="text" maxlength="20" placeholder="请输入姓名或常用称呼" confirm-type="next" />
        </view>

        <view v-if="mode !== 'reset' || resetChannel === 'phone'" class="field">
          <text class="field-label">手机号</text>
          <input v-model="form.phone" class="field-input" type="number" maxlength="11" placeholder="请输入11位手机号" confirm-type="next" />
        </view>
        <view v-if="mode === 'register'" class="field">
          <text class="field-label">短信验证码</text>
          <view class="verification-wrap">
            <input v-model="form.code" class="field-input verification-input" type="text" inputmode="numeric" maxlength="6" placeholder="请输入6位验证码" confirm-type="next" />
            <button class="code-btn" :disabled="codeSending || codeCountdown > 0" @tap="requestRegisterCode">
              <text>{{ codeCountdown > 0 ? codeCountdown + 's 后重发' : (codeSending ? '发送中…' : '获取验证码') }}</text>
            </button>
          </view>
          <text v-if="debugCode" class="debug-hint">本地联调验证码：{{ debugCode }}（仅开发环境显示）</text>
        </view>
        <view v-if="mode === 'reset' && resetChannel === 'email'" class="field">
          <text class="field-label">邮箱地址</text>
          <input v-model="form.email" class="field-input" type="text" maxlength="160" placeholder="请输入已验证的邮箱" confirm-type="next" />
        </view>

        <view v-if="mode !== 'reset'" class="field">
          <text class="field-label">登录密码</text>
          <view class="password-wrap">
            <input v-model="form.password" class="field-input password-input" :type="passwordVisible ? 'text' : 'password'" maxlength="72" placeholder="至少8位，包含字母和数字" confirm-type="next" />
            <text class="password-toggle" @tap="passwordVisible = !passwordVisible">{{ passwordVisible ? '隐藏' : '显示' }}</text>
          </view>
        </view>

        <template v-if="mode === 'reset'">
          <view class="reset-channels">
            <text class="reset-channel-label">验证方式</text>
            <view class="reset-channel" :class="{ active: resetChannel === 'phone' }" @tap="switchResetChannel('phone')">手机号</view>
            <view class="reset-channel" :class="{ active: resetChannel === 'email' }" @tap="switchResetChannel('email')">邮箱</view>
          </view>
          <view class="field">
            <text class="field-label">{{ resetChannel === 'email' ? '邮箱验证码' : '短信验证码' }}</text>
            <view class="verification-wrap">
              <input v-model="form.code" class="field-input verification-input" type="text" inputmode="numeric" maxlength="6" placeholder="请输入6位验证码" confirm-type="next" />
              <button class="code-btn" :disabled="codeSending || codeCountdown > 0" @tap="requestResetCode">
                <text>{{ codeCountdown > 0 ? codeCountdown + 's 后重发' : (codeSending ? '发送中…' : '获取验证码') }}</text>
              </button>
            </view>
            <text v-if="debugCode" class="debug-hint">本地联调验证码：{{ debugCode }}（仅开发环境显示）</text>
          </view>
          <view class="field">
            <text class="field-label">新登录密码</text>
            <view class="password-wrap">
              <input v-model="form.password" class="field-input password-input" :type="passwordVisible ? 'text' : 'password'" maxlength="72" placeholder="至少8位，包含字母和数字" confirm-type="next" />
              <text class="password-toggle" @tap="passwordVisible = !passwordVisible">{{ passwordVisible ? '隐藏' : '显示' }}</text>
            </view>
          </view>
          <view class="field">
            <text class="field-label">确认新密码</text>
            <input v-model="form.confirmPassword" class="field-input" :type="passwordVisible ? 'text' : 'password'" maxlength="72" placeholder="再输入一次新密码" confirm-type="done" />
          </view>
        </template>

        <template v-if="mode === 'register'">
          <view class="field">
            <text class="field-label">确认密码</text>
            <input v-model="form.confirmPassword" class="field-input" :type="passwordVisible ? 'text' : 'password'" maxlength="72" placeholder="再输入一次密码" confirm-type="next" />
          </view>

          <view class="profile-grid">
            <view class="field compact-field">
              <text class="field-label">公司 / 机构名称</text>
              <input v-model="form.company" class="field-input" type="text" maxlength="40" placeholder="所在公司或机构" />
            </view>
            <view class="field compact-field">
              <text class="field-label">你的职位</text>
              <input v-model="form.title" class="field-input" type="text" maxlength="30" placeholder="例如：市场负责人" />
            </view>
          </view>
          <view class="field">
            <text class="field-label">所在城市</text>
            <input v-model="form.city" class="field-input" type="text" maxlength="20" placeholder="例如：上海" confirm-type="done" />
          </view>
          <view class="field">
            <view class="field-label-row"><text class="field-label">机构类型</text><text class="field-hint">描述你的机构，与甲乙方身份无关</text></view>
            <view class="org-options">
              <view v-for="item in ORGANIZATION_TYPE_OPTIONS" :key="item.value" class="org-option" :class="{ active: form.organization_type === item.value }" @tap="form.organization_type = item.value">{{ item.label }}</view>
            </view>
          </view>
          <view class="field invite-field">
            <view class="field-label-row"><text class="field-label">邀请码</text><text class="field-hint">可选，受邀人可单独选择权益</text></view>
            <view class="verification-wrap">
              <input v-model="form.invite_code" class="field-input verification-input" type="text" maxlength="40" placeholder="有邀请码就填，没有可留空" @input="invalidateInvitePreview" @confirm="loadInvitePreview" />
              <button class="code-btn" :disabled="inviteLoading" @tap="loadInvitePreview"><text>{{ inviteLoading ? '验证中…' : '验证邀请码' }}</text></button>
            </view>
            <text v-if="inviteMessage" class="invite-status" :class="{ success: inviteValid }">{{ inviteMessage }}</text>
            <view v-if="rewardOptions.length" class="reward-options">
              <text v-if="inviterReward" class="reward-owner">邀请人已指定：{{ inviterReward.display || inviterReward.label }}</text>
              <text class="reward-title">请选择你要获得的权益（双方可以不同）</text>
              <view v-for="item in rewardOptions" :key="item.value" class="reward-option" :class="{ active: form.reward_type === item.value }" @tap="selectReward(item.value)">
                <view class="reward-option-copy"><text class="reward-option-name">{{ item.display || item.label }}</text><text class="reward-option-desc">{{ item.desc }}</text></view>
                <text class="reward-option-check">{{ form.reward_type === item.value ? '✓' : '○' }}</text>
              </view>
            </view>
          </view>
        </template>

        <view v-if="mode !== 'reset'" class="consent-row" @tap="toggleConsent">
          <view class="consent-box" :class="{ checked: consentChecked }"><text v-if="consentChecked">✓</text></view>
          <text class="consent-copy">我已阅读并同意</text>
          <text class="consent-link" @tap.stop="goLegal('agreement')">用户协议</text>
          <text class="consent-copy">和</text>
          <text class="consent-link" @tap.stop="goLegal('privacy')">隐私政策</text>
        </view>

        <text v-if="formError" class="form-error">{{ formError }}</text>
        <button class="primary-btn" :disabled="submitting" @tap="submit">
          <text>{{ submitting ? (mode === 'login' ? '登录中…' : mode === 'register' ? '注册中…' : '保存中…') : (mode === 'login' ? '登录' : mode === 'register' ? '注册账号' : '重置密码') }}</text>
        </button>
        </template>

        <view v-if="mode === 'login'" class="login-actions">
          <view class="mode-switch" @tap="switchMode('register')">
            <text>没有账号？</text>
            <text class="mode-switch-link">注册一个</text>
          </view>
          <text class="forgot-link" @tap="switchMode('reset')">忘记密码</text>
        </view>
        <view v-else class="mode-switch" @tap="switchMode('login')">
          <text>{{ mode === 'register' ? '已经有账号？' : '想起密码了？' }}</text>
          <text class="mode-switch-link">返回登录</text>
        </view>

        <!-- #ifdef MP-WEIXIN -->
        <view v-if="mode === 'login'" class="wechat-divider"><view /><text>或使用微信</text><view /></view>
        <button v-if="mode === 'login'" class="wechat-btn" :disabled="submitting" @tap="doWechatLogin">微信登录</button>
        <!-- #endif -->
      </view>

      <view v-if="!fixedParty" class="benefit-row">
        <view class="benefit-item"><text class="benefit-icon">⌁</text><text>需求整理</text></view>
        <view class="benefit-item"><text class="benefit-icon">◎</text><text>按条件找团队</text></view>
        <view class="benefit-item"><text class="benefit-icon">↗</text><text>对接进展可追踪</text></view>
      </view>

      <view v-if="ENV.ALLOW_DEMO_LOGIN && !fixedParty" class="demo-panel">
        <view class="demo-heading"><text>开发演示入口</text><text>仅用于联调，不代表正式账号</text></view>
        <view class="demo-actions">
          <button :disabled="submitting" @tap="demoLogin('user')">普通账号</button>
          <button :disabled="submitting" @tap="demoLogin('provider')">团队账号</button>
          <button :disabled="submitting" @tap="demoLogin('admin')">运营账号</button>
        </view>
      </view>

      <view class="legal-links">
        <text @tap="goLegal('agreement')">用户协议</text><text> · </text><text @tap="goLegal('privacy')">隐私政策</text>
        <text class="legal-version">版本 {{ LEGAL_DOCUMENT_VERSION }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { useNavTitle } from '@/hooks/useNavTitle'
import { ENV } from '@/utils/env'
import { LEGAL_DOCUMENT_VERSION } from '@/config/legal'

const props = defineProps({ fixedParty: { type: String, default: '' }, inviteCode: { type: String, default: '' } })
if (!props.fixedParty) useNavTitle('titles.login')

// 注册页只决定业务角色（甲方=发布需求，乙方=提供服务/找项目）；
// 机构类型由用户在表单里单独选择，与甲乙方身份解耦。
const registrationRole = computed(() => props.fixedParty === 'capital' ? 'demand_owner' : 'service_provider')
const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'project', label: '项目企业' },
  { value: 'capital', label: '资金 / 投资机构' },
  { value: 'brand', label: '品牌方' },
  { value: 'agency', label: '服务机构' },
  { value: 'other', label: '其他机构' }
]
const ORGANIZATION_TYPE_VALUES = new Set(ORGANIZATION_TYPE_OPTIONS.map((item) => item.value))

const userStore = useUserStore()
const mode = ref(props.fixedParty ? 'register' : 'login')
const resetChannel = ref('phone')
const submitting = ref(false)
const passwordVisible = ref(false)
const consentChecked = ref(false)
const formError = ref('')
const codeSending = ref(false)
const codeCountdown = ref(0)
const debugCode = ref('')
const inviteLoading = ref(false)
const inviteValid = ref(false)
const inviteMessage = ref('')
const rewardOptions = ref([])
const inviterReward = ref(null)
let codeTimer = null
const form = ref({
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  code: '',
  nickname: '',
  company: '',
  title: '',
  city: '',
  organization_type: '',
  invite_code: '',
  reward_type: ''
})

const consentPayload = computed(() => ({
  agreement_consent: true,
  privacy_consent: true,
  legal_version: LEGAL_DOCUMENT_VERSION,
  agreement_version: LEGAL_DOCUMENT_VERSION,
  privacy_version: LEGAL_DOCUMENT_VERSION
}))

function switchMode(next) {
  if (props.fixedParty) return uni.redirectTo({ url: '/pages/user/login' })
  const previous = mode.value
  mode.value = next
  formError.value = ''
  passwordVisible.value = false
  debugCode.value = ''
  if (previous === 'reset' || next === 'reset') {
    form.value.email = ''
    form.value.code = ''
    form.value.password = ''
    form.value.confirmPassword = ''
  }
  if (previous === 'reset') form.value.phone = ''
  if (next !== 'reset') {
    stopCodeCountdown()
  }
}

function chooseParty(party) {
  const page = party === 'capital' ? 'register-a' : 'register-b'
  const code = String(form.value.invite_code || '').trim()
  uni.navigateTo({ url: `/pages/user/${page}${code ? '?invite_code=' + encodeURIComponent(code) : ''}` })
}

watch(() => props.inviteCode, (code) => {
  if (!code) return
  mode.value = 'register'
  form.value.invite_code = code.trim().toUpperCase()
  void loadInvitePreview()
}, { immediate: true })

function invalidateInvitePreview() {
  inviteValid.value = false
  inviteMessage.value = ''
  rewardOptions.value = []
  inviterReward.value = null
  form.value.reward_type = ''
}

async function loadInvitePreview() {
  const code = String(form.value.invite_code || '').trim().toUpperCase()
  form.value.invite_code = code
  if (!code) {
    invalidateInvitePreview()
    return
  }
  inviteLoading.value = true
  inviteMessage.value = ''
  try {
    const preview = await bridge.intake.invitePreview(code)
    const options = Array.isArray(preview?.reward_options) ? preview.reward_options : []
    rewardOptions.value = options
    inviterReward.value = preview?.inviter_reward || options.find((item) => item.value === preview?.inviter_reward_type) || null
    if (!options.some((item) => item.value === form.value.reward_type)) form.value.reward_type = options[0]?.value || ''
    inviteValid.value = options.length > 0
    inviteMessage.value = inviteValid.value ? '邀请码有效；邀请人的权益已锁定，你可任选自己的权益' : '邀请码有效，但当前没有可选奖励'
  } catch (error) {
    invalidateInvitePreview()
    inviteMessage.value = error?.message || '邀请码无效或已失效'
  } finally {
    inviteLoading.value = false
  }
}

function selectReward(value) {
  if (!inviteValid.value) return
  form.value.reward_type = value
}

function switchResetChannel(next) {
  if (resetChannel.value === next) return
  resetChannel.value = next
  form.value.code = ''
  formError.value = ''
  debugCode.value = ''
  stopCodeCountdown()
}

function toggleConsent() {
  consentChecked.value = !consentChecked.value
}

function validate() {
  const data = form.value
  if (mode.value === 'reset') {
    if (resetChannel.value === 'phone' && !/^1\d{10}$/.test(String(data.phone).trim())) return '请输入有效的11位手机号'
    if (resetChannel.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.email).trim())) return '请输入有效的邮箱地址'
    if (!/^\d{6}$/.test(String(data.code).trim())) return `请输入6位${resetChannel.value === 'email' ? '邮箱' : '短信'}验证码`
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(data.password)) return '新密码至少8位，且必须包含字母和数字'
    if (data.password !== data.confirmPassword) return '两次输入的新密码不一致'
    return ''
  }
  if (!/^1\d{10}$/.test(String(data.phone).trim())) return '请输入有效的11位手机号'
  if (!data.password) return '请输入登录密码'
  if (mode.value === 'register') {
    if (String(data.nickname).trim().length < 2) return '请填写至少2个字的姓名或称呼'
    if (!ORGANIZATION_TYPE_VALUES.has(data.organization_type)) return '请选择你的机构类型'
    if (!/^\d{6}$/.test(String(data.code).trim())) return '请输入6位短信验证码'
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(data.password)) return '密码至少8位，且必须包含字母和数字'
    if (data.password !== data.confirmPassword) return '两次输入的密码不一致'
    if (!String(data.company).trim()) return '请填写所在公司'
    if (!String(data.title).trim()) return '请填写你的职位'
    if (!String(data.city).trim()) return '请填写所在城市'
    if (String(data.invite_code || '').trim() && (!inviteValid.value || !data.reward_type)) return '请先验证邀请码并选择一项邀请权益'
  }
  if (!consentChecked.value) return '请先阅读并同意用户协议和隐私政策'
  return ''
}

async function submit() {
  if (submitting.value) return
  formError.value = validate()
  if (formError.value) return
  submitting.value = true
  try {
    const payload = { ...form.value, phone: String(form.value.phone || '').trim(), code: String(form.value.code || '').trim(), ...consentPayload.value,
      ...(mode.value === 'register' ? { registration_party: registrationRole.value,
        organization_type: form.value.organization_type, workflow_role: registrationRole.value } : {}) }
    if (mode.value === 'register') {
      const registration = await userStore.register(payload)
      const hasReferralReward = String(payload.invite_code || '').trim() && registration?.referral_rewards?.length
      uni.showToast({ title: hasReferralReward ? '账号创建成功，权益已到账' : '账号创建成功', icon: 'success' })
    } else if (mode.value === 'reset') {
      await bridge.user.resetPassword({
        channel: resetChannel.value,
        ...(resetChannel.value === 'email'
          ? { email: String(payload.email).trim().toLowerCase() }
          : { phone: String(payload.phone).trim() }),
        code: String(payload.code).trim(),
        password: payload.password
      })
      stopCodeCountdown()
      form.value.password = ''
      form.value.confirmPassword = ''
      form.value.code = ''
      debugCode.value = ''
      switchMode('login')
      uni.showToast({ title: '密码已重置，请登录', icon: 'success' })
      return
    } else {
      await userStore.loginWithPassword({ phone: payload.phone, password: payload.password, ...consentPayload.value })
    }
    if (mode.value !== 'register') uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      if (mode.value === 'register') uni.reLaunch({ url: '/pages/intake/index' })
      else uni.switchTab({ url: '/pages/index/index' })
    }, 300)
  } catch (error) {
    formError.value = error?.message || (
      mode.value === 'register'
        ? '注册失败，请稍后重试'
        : mode.value === 'reset'
          ? '密码重置失败，请检查验证码'
          : '登录失败，请检查账号密码'
    )
  } finally {
    submitting.value = false
  }
}

async function requestResetCode() {
  if (codeSending.value || codeCountdown.value > 0) return
  const phone = String(form.value.phone || '').trim()
  const email = String(form.value.email || '').trim().toLowerCase()
  if (resetChannel.value === 'phone' && !/^1\d{10}$/.test(phone)) {
    formError.value = '请先填写有效的11位手机号'
    return
  }
  if (resetChannel.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    formError.value = '请先填写有效的邮箱地址'
    return
  }
  codeSending.value = true
  formError.value = ''
  try {
    const result = await bridge.user.requestPasswordResetCode(
      resetChannel.value === 'email' ? { channel: 'email', email } : { channel: 'phone', phone }
    )
    debugCode.value = result?.debug_code || ''
    startCodeCountdown(Number(result?.retry_after) || 60)
    uni.showToast({ title: debugCode.value ? '验证码已生成' : '验证码已发送', icon: 'none' })
  } catch (error) {
    formError.value = error?.message || '验证码发送失败，请稍后重试'
  } finally {
    codeSending.value = false
  }
}

async function requestRegisterCode() {
  if (codeSending.value || codeCountdown.value > 0) return
  const phone = String(form.value.phone || '').trim()
  if (!/^1\d{10}$/.test(phone)) {
    formError.value = '请先填写有效的11位手机号'
    return
  }
  codeSending.value = true
  formError.value = ''
  try {
    const result = await bridge.user.requestRegisterCode({ phone })
    debugCode.value = result?.debug_code || ''
    startCodeCountdown(Number(result?.retry_after) || 60)
    uni.showToast({ title: debugCode.value ? '验证码已生成' : '验证码已发送', icon: 'none' })
  } catch (error) {
    formError.value = error?.message || '验证码发送失败，请稍后重试'
  } finally {
    codeSending.value = false
  }
}

function startCodeCountdown(seconds) {
  stopCodeCountdown()
  codeCountdown.value = Math.max(1, Math.floor(seconds))
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) stopCodeCountdown()
  }, 1000)
}

function stopCodeCountdown() {
  if (codeTimer) {
    clearInterval(codeTimer)
    codeTimer = null
  }
  codeCountdown.value = 0
}

onUnmounted(stopCodeCountdown)

async function demoLogin(role) {
  if (submitting.value) return
  submitting.value = true
  formError.value = ''
  try {
    await userStore.demoLogin(role)
    uni.switchTab({ url: '/pages/index/index' })
  } catch (error) {
    formError.value = error?.message || '演示账号登录失败'
  } finally {
    submitting.value = false
  }
}

function goLegal(type) {
  uni.navigateTo({ url: `/pages/legal/index?type=${type}` })
}

function doWechatLogin() {
  if (!consentChecked.value) {
    formError.value = '请先阅读并同意用户协议和隐私政策'
    return
  }
  if (submitting.value) return
  submitting.value = true
  const beginLogin = () => {
    uni.login({
      provider: 'weixin',
      success: async ({ code }) => {
        try {
          await userStore.loginWithWechat(code, {}, consentPayload.value)
          uni.switchTab({ url: '/pages/index/index' })
        } catch (error) {
          formError.value = error?.message || '微信登录失败，请稍后重试'
        } finally {
          submitting.value = false
        }
      },
      fail: () => {
        submitting.value = false
        formError.value = '未完成微信授权'
      }
    })
  }
  if (typeof uni.requirePrivacyAuthorize !== 'function') beginLogin()
  else uni.requirePrivacyAuthorize({ success: beginLogin, fail: () => { submitting.value = false; formError.value = '请先完成微信隐私授权' } })
}
</script>

<style lang="scss" scoped>
.login-scroll { min-height: 100vh; background: #F5F7FB; }
.login-page { min-height: 100vh; padding: 44rpx 34rpx 56rpx; color: #263455; background: radial-gradient(circle at 90% 5%, #E8ECFF 0, #F5F7FB 34%, #F5F7FB 100%); }
.brand-row { display: flex; align-items: center; }
.brand-mark { display: flex; align-items: center; justify-content: center; width: 68rpx; height: 68rpx; border-radius: 21rpx; color: #FFF; background: linear-gradient(145deg, #6272E4, #8994F0); box-shadow: 0 12rpx 22rpx rgba(98,114,228,.2); }
.brand-mark text { font-size: 21rpx; font-weight: 900; letter-spacing: .08em; }
.brand-copy { display: flex; flex-direction: column; margin-left: 15rpx; }
.brand-name { font-size: 28rpx; font-weight: 800; letter-spacing: .04em; }
.brand-en { margin-top: 2rpx; color: #98A4BD; font-size: 17rpx; letter-spacing: .18em; }
.real-badge { margin-left: auto; padding: 9rpx 15rpx; border: 1rpx solid #DCE2F7; border-radius: 99rpx; background: rgba(255,255,255,.72); }
.real-badge text { color: #6573DC; font-size: 19rpx; }
.hero-copy { margin: 74rpx 4rpx 36rpx; }
.hero-eyebrow { display: block; margin-bottom: 17rpx; color: #6573DC; font-size: 22rpx; font-weight: 700; letter-spacing: .13em; }
.hero-title { display: block; color: #263455; font-size: 61rpx; font-weight: 850; line-height: 1.18; letter-spacing: -.06em; }
.hero-accent { color: #6573DC; }
.hero-desc { display: block; max-width: 650rpx; margin-top: 20rpx; color: #8390AA; font-size: 24rpx; line-height: 1.75; }
.auth-card { padding: 29rpx 26rpx 26rpx; border: 1rpx solid rgba(222,227,241,.94); border-radius: 31rpx; background: rgba(255,255,255,.94); box-shadow: 0 22rpx 60rpx rgba(44,60,105,.09); }
.mode-tabs { display: flex; padding: 7rpx; border-radius: 17rpx; background: #F3F5FA; }
.mode-tab { flex: 1; padding: 17rpx 0; border-radius: 13rpx; color: #9AA5BB; font-size: 25rpx; text-align: center; transition: all .2s; }
.mode-tab.active { color: #2D3A5A; font-weight: 800; background: #FFF; box-shadow: 0 5rpx 15rpx rgba(52,64,108,.08); }
.form-intro { margin: 30rpx 3rpx 22rpx; }
.form-title, .form-subtitle { display: block; }
.form-title { color: #2D3A5A; font-size: 34rpx; font-weight: 800; }
.form-subtitle { margin-top: 7rpx; color: #98A4BB; font-size: 21rpx; }
.field { margin-top: 18rpx; }
.field-label { display: block; margin: 0 4rpx 9rpx; color: #53627E; font-size: 21rpx; font-weight: 700; }
.field-input { width: 100%; height: 82rpx; box-sizing: border-box; padding: 0 22rpx; border: 1rpx solid #E6EAF2; border-radius: 17rpx; color: #2D3A5A; background: #FAFBFD; font-size: 25rpx; }
.field-input:focus { border-color: #94A0F0; background: #FFF; }
.password-wrap { position: relative; }
.password-input { padding-right: 94rpx; }
.password-toggle { position: absolute; top: 0; right: 20rpx; display: flex; align-items: center; height: 82rpx; color: #6573DC; font-size: 20rpx; }
.verification-wrap { display: flex; align-items: center; gap: 12rpx; }
.verification-input { min-width: 0; flex: 1; }
.reset-channels { display: flex; align-items: center; gap: 12rpx; margin-top: 20rpx; }
.reset-channel-label { margin-right: 4rpx; color: #9AA5BB; font-size: 20rpx; }
.reset-channel { padding: 9rpx 17rpx; border: 1rpx solid #E2E6F1; border-radius: 99rpx; color: #8793AA; background: #FAFBFD; font-size: 19rpx; }
.reset-channel.active { border-color: #6573DC; color: #6573DC; background: #EEF0FF; font-weight: 700; }
.code-btn { width: 190rpx; height: 82rpx; flex: 0 0 190rpx; padding: 0; border-radius: 17rpx; color: #6573DC; background: #EEF0FF; font-size: 20rpx; line-height: 82rpx; }
.code-btn[disabled] { color: #A6AFBF; background: #F2F4F8; }
.debug-hint { display: block; margin: 9rpx 4rpx 0; color: #BA7C41; font-size: 18rpx; }
.profile-grid { display: flex; gap: 18rpx; }
.compact-field { flex: 1; min-width: 0; }
.compact-field .field-input { padding-left: 17rpx; padding-right: 17rpx; font-size: 22rpx; }
.identity-field { margin-top: 24rpx; }
.identity-options { display: flex; gap: 12rpx; }
.identity-option { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 6rpx; padding: 15rpx 14rpx; border: 1rpx solid rgba(30, 27, 22, .12); border-radius: 4rpx; background: #fcfbf8; }
.identity-option.active { border-color: #5c2828; background: #f0e5df; box-shadow: inset 0 0 0 1rpx rgba(92, 40, 40, .12); }
.identity-option-title { overflow: hidden; color: #25231f; font-size: 20rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.identity-option-desc { overflow: hidden; color: #8a847b; font-size: 16rpx; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.consent-row { display: flex; align-items: center; flex-wrap: wrap; gap: 7rpx; margin: 23rpx 3rpx 17rpx; color: #9AA5BB; font-size: 19rpx; line-height: 1.7; }
.consent-box { display: inline-flex; align-items: center; justify-content: center; width: 28rpx; height: 28rpx; margin-right: 2rpx; border: 2rpx solid #CBD3E4; border-radius: 7rpx; color: #FFF; font-size: 20rpx; }
.consent-box.checked { border-color: #6573DC; background: #6573DC; }
.consent-link { color: #6573DC; }
.form-error { display: block; margin: 0 3rpx 15rpx; color: #D76565; font-size: 20rpx; line-height: 1.5; }
.primary-btn, .wechat-btn { width: 100%; height: 84rpx; border-radius: 17rpx; font-size: 27rpx; font-weight: 800; line-height: 84rpx; }
.primary-btn { color: #FFF; background: linear-gradient(105deg, #6573DC, #818CE8); box-shadow: 0 13rpx 24rpx rgba(101,115,220,.25); }
.primary-btn[disabled], .wechat-btn[disabled] { opacity: .55; box-shadow: none; }
.login-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 22rpx; }
.mode-switch { display: flex; align-items: center; justify-content: center; margin-top: 22rpx; color: #9AA5BB; font-size: 21rpx; }
.login-actions .mode-switch { margin-top: 0; }
.mode-switch-link { margin-left: 7rpx; color: #6573DC; font-weight: 700; }
.forgot-link { color: #6573DC; font-size: 21rpx; }
.wechat-divider { display: flex; align-items: center; gap: 16rpx; margin: 27rpx 0 17rpx; color: #B0B8C9; font-size: 19rpx; }
.wechat-divider view { flex: 1; height: 1rpx; background: #EBEEF5; }
.wechat-btn { color: #2D8B5D; background: #F0FBF5; }
.benefit-row { display: flex; justify-content: space-between; margin: 26rpx 9rpx 0; }
.benefit-item { display: flex; flex-direction: column; align-items: center; color: #8995AD; font-size: 18rpx; }
.benefit-icon { display: flex; align-items: center; justify-content: center; width: 43rpx; height: 43rpx; margin-bottom: 6rpx; border: 1rpx solid #DCE2F7; border-radius: 14rpx; color: #6573DC; background: #EEF0FF; font-size: 28rpx; }
.demo-panel { margin-top: 31rpx; padding: 20rpx; border: 1rpx dashed #D9DDE8; border-radius: 20rpx; background: rgba(255,255,255,.54); }
.demo-heading { display: flex; align-items: baseline; justify-content: space-between; }
.demo-heading text:first-child { color: #68758A; font-size: 21rpx; font-weight: 700; }
.demo-heading text:last-child { color: #A8B0C0; font-size: 17rpx; }
.demo-actions { display: flex; gap: 12rpx; margin-top: 15rpx; }
.demo-actions button { flex: 1; padding: 13rpx 4rpx; border-radius: 12rpx; color: #6573DC; background: #EEF0FF; font-size: 18rpx; }
.legal-links { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; margin-top: 30rpx; color: #9FA9BB; font-size: 19rpx; }
.legal-links text { margin: 0 3rpx; }
.legal-links text:first-child, .legal-links text:nth-child(3) { color: #6573DC; }
.legal-version { width: 100%; margin-top: 8rpx !important; color: #B7BECD !important; text-align: center; }

/* Quiet Intelligence：身份入口是一页简洁的品牌前言，而不是蓝紫色注册模板。 */
.login-scroll { background: #f7f6f2; }
.login-page {
  min-height: 100vh;
  padding: 34rpx 36rpx 52rpx;
  color: #191816;
  background: #f7f6f2;
}
.brand-row { padding-bottom: 24rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .1); }
.brand-mark {
  width: 52rpx;
  height: 52rpx;
  border: 1rpx solid rgba(30, 27, 22, .14);
  border-radius: 3rpx;
  color: #5c2828;
  background: #f0eee8;
  box-shadow: none;
}
.brand-mark text { font-family: Georgia, serif; font-size: 16rpx; font-weight: 500; letter-spacing: .12em; }
.brand-copy { margin-left: 13rpx; }
.brand-name { color: #191816; font-family: 'Songti SC', 'STSong', serif; font-size: 25rpx; font-weight: 500; letter-spacing: .02em; }
.brand-en { margin-top: 3rpx; color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13rpx; letter-spacing: .15em; }
.real-badge { padding: 7rpx 0; border: 0; border-bottom: 1rpx solid rgba(92, 40, 40, .28); border-radius: 0; background: transparent; }
.real-badge text { color: #5c2828; font-size: 16rpx; }

.hero-copy { margin: 68rpx 0 42rpx; }
.hero-eyebrow { margin-bottom: 19rpx; color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; font-weight: 400; letter-spacing: .14em; }
.hero-title { max-width: 620rpx; color: #191816; font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-size: 55rpx; font-weight: 400; letter-spacing: -.055em; line-height: 1.12; }
.hero-accent { color: #5c2828; }
.hero-desc { max-width: 590rpx; margin-top: 23rpx; color: #6f6b63; font-size: 21rpx; line-height: 1.72; }

.auth-card { padding: 28rpx 0 8rpx; border: 0; border-top: 1rpx solid rgba(30, 27, 22, .14); border-bottom: 1rpx solid rgba(30, 27, 22, .1); border-radius: 0; background: transparent; box-shadow: none; }
.mode-tabs { padding: 0; border-bottom: 1rpx solid rgba(30, 27, 22, .1); border-radius: 0; background: transparent; }
.mode-tab { padding: 14rpx 0 16rpx; border-bottom: 2rpx solid transparent; border-radius: 0; color: #8a847b; font-size: 20rpx; transition: color .18s ease, border-color .18s ease; }
.mode-tab.active { border-bottom-color: #5c2828; color: #191816; font-weight: 500; background: transparent; box-shadow: none; }
.form-intro { margin: 30rpx 0 24rpx; }
.form-title { color: #191816; font-family: 'Songti SC', 'STSong', serif; font-size: 31rpx; font-weight: 400; }
.form-subtitle { margin-top: 9rpx; color: #8a847b; font-size: 19rpx; line-height: 1.55; }
.field { margin-top: 21rpx; }
.field-label { margin: 0 0 8rpx; color: #6f6b63; font-size: 18rpx; font-weight: 500; }
.field-input { height: 74rpx; padding: 0 16rpx; border-color: rgba(30, 27, 22, .12); border-radius: 4rpx; color: #191816; background: #fcfbf8; font-size: 22rpx; }
.field-input:focus { border-color: #69574a; background: #fcfbf8; }
.password-toggle { right: 15rpx; height: 74rpx; color: #5c2828; font-size: 18rpx; }
.reset-channels { gap: 0; border-bottom: 1rpx solid rgba(30, 27, 22, .08); }
.reset-channel-label { color: #8a847b; }
.reset-channel { padding: 10rpx 15rpx; border: 0; border-bottom: 2rpx solid transparent; border-radius: 0; color: #8a847b; background: transparent; }
.reset-channel.active { border-bottom-color: #5c2828; color: #5c2828; background: transparent; font-weight: 500; }
.code-btn { height: 74rpx; border: 1rpx solid rgba(92, 40, 40, .28); border-radius: 4rpx; color: #5c2828; background: transparent; font-size: 18rpx; line-height: 72rpx; }
.code-btn[disabled] { color: #aaa49a; background: #f0eee8; }
.debug-hint { color: #8a5a4d; }
.consent-row { margin-right: 0; margin-left: 0; color: #8a847b; }
.consent-box { border-color: #c9c3b8; border-radius: 3rpx; }
.consent-box.checked { border-color: #5c2828; background: #5c2828; }
.consent-link,
.mode-switch-link,
.forgot-link { color: #5c2828; }
.form-error { margin-right: 0; margin-left: 0; color: #8a4c46; }
.primary-btn,
.wechat-btn { height: 76rpx; border-radius: 4rpx; font-size: 21rpx; font-weight: 500; line-height: 76rpx; }
.primary-btn { color: #fcfbf8; background: #191816; box-shadow: none; }
.wechat-btn { color: #56624c; background: rgba(86, 98, 76, .08); }
.mode-switch,
.forgot-link { font-size: 19rpx; }
.wechat-divider { color: #979189; }
.wechat-divider view { background: rgba(30, 27, 22, .09); }

.benefit-row { margin: 34rpx 0 0; border-top: 1rpx solid rgba(30, 27, 22, .09); border-bottom: 1rpx solid rgba(30, 27, 22, .09); }
.benefit-item { flex: 1; align-items: flex-start; padding: 20rpx 12rpx 20rpx 0; color: #6f6b63; font-size: 16rpx; }
.benefit-item + .benefit-item { padding-left: 16rpx; border-left: 1rpx solid rgba(30, 27, 22, .08); }
.benefit-icon { width: auto; height: auto; margin-bottom: 9rpx; border: 0; border-radius: 0; color: #b5a07a; background: transparent; font-family: Georgia, serif; font-size: 21rpx; }
.demo-panel { border-color: rgba(30, 27, 22, .14); border-radius: 4rpx; background: #fcfbf8; }
.demo-actions button { border-radius: 3rpx; color: #5c2828; background: #f0eee8; }
.legal-links { color: #979189; }
.legal-links text:first-child,
.legal-links text:nth-child(3) { color: #5c2828; }
.legal-version { color: #aaa49a !important; }

@media (max-width: 420px) {
  .login-page { padding-right: 28rpx; padding-left: 28rpx; }
  .hero-title { font-size: 49rpx; }
  .profile-grid { display: block; }
  .identity-options { display: block; }
  .identity-option + .identity-option { margin-top: 10rpx; }
  .benefit-item { font-size: 15rpx; }
}
/* Overflow guard: login actions and verification controls must not push the auth card wider. */
.login-scroll,
.login-page,
.brand-row,
.brand-copy,
.hero-copy,
.auth-card,
.mode-tabs,
.verification-wrap,
.reset-channels,
.profile-grid,
.login-actions,
.benefit-row,
.demo-panel,
.demo-actions { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.login-scroll,
.login-page { overflow-x: hidden; }
.brand-copy,
.hero-copy,
.auth-card,
.demo-panel { overflow-wrap: anywhere; word-break: break-word; }
.brand-copy { flex: 1 1 auto; overflow: hidden; }
.real-badge,
.code-btn,
.password-toggle,
.login-actions > text,
.benefit-icon { flex: 0 0 auto; white-space: nowrap; }
.hero-title,
.hero-desc,
.form-title,
.form-subtitle,
.field-label,
.form-error,
.debug-hint,
.benefit-item,
.demo-heading { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.mode-tabs > view,
.verification-input,
.compact-field { min-width: 0; }
.mode-tabs > view { flex: 1 1 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.verification-wrap,
.reset-channels,
.login-actions,
.benefit-row,
.demo-actions { flex-wrap: wrap; }
.verification-input { flex: 1 1 0; }
.code-btn { width: auto; flex-basis: auto; min-width: 138rpx; }
.benefit-item { flex: 1 1 0; min-width: 0; overflow: hidden; }
.demo-actions button { min-width: 0; box-sizing: border-box; white-space: nowrap; }

.field-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12rpx; }
.field-hint { color: #9a9286; font-size: 16rpx; font-weight: 400; }
.org-options { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 8rpx; }
.org-option { padding: 12rpx 24rpx; border: 1rpx solid #d8d2c8; border-radius: 999rpx; background: #fff; color: #5a5348; font-size: 24rpx; line-height: 1.5; }
.org-option.active { border-color: #5c2828; color: #5c2828; box-shadow: inset 0 0 0 1rpx #5c2828; }
.invite-status { display: block; margin-top: 8rpx; color: #8a4c46; font-size: 17rpx; line-height: 1.45; }
.invite-status.success { color: #56624c; }
.reward-options { margin-top: 15rpx; padding-top: 13rpx; border-top: 1rpx solid rgba(30, 27, 22, .09); }
.reward-owner { display: block; margin-bottom: 6rpx; color: #5c2828; font-size: 17rpx; font-weight: 700; }
.reward-title { display: block; margin-bottom: 8rpx; color: #6f6b63; font-size: 17rpx; }
.reward-option { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; padding: 12rpx 13rpx; border: 1rpx solid rgba(30, 27, 22, .1); background: #fcfbf8; }
.reward-option + .reward-option { margin-top: 8rpx; }
.reward-option.active { border-color: #5c2828; background: #f0e5df; }
.reward-option-copy { flex: 1; min-width: 0; }
.reward-option-name, .reward-option-desc { display: block; overflow-wrap: anywhere; word-break: break-word; }
.reward-option-name { color: #403a33; font-size: 19rpx; }
.reward-option-desc { margin-top: 4rpx; color: #9a9286; font-size: 16rpx; }
.reward-option-check { flex: 0 0 auto; color: #9a9286; font-family: Georgia, serif; font-size: 22rpx; }
.reward-option.active .reward-option-check { color: #5c2828; }

@media (max-width: 420px) {
  .login-page { padding-right: 24rpx; padding-left: 24rpx; }
  .auth-card { padding-right: 20rpx; padding-left: 20rpx; }
  .code-btn { min-width: 124rpx; }
  .benefit-item { padding-right: 8rpx; padding-left: 8rpx; }
}
</style>

<style scoped>
.party-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
.party-choice { box-sizing: border-box; width: 100%; margin: 0; padding: 24px; text-align: left; border: 1px solid #cadbeb; border-radius: 16px; background: #fff; line-height: 1.5; }
.party-choice::after { border: 0; }
.party-choice:focus-visible { outline: 3px solid #087cdb; outline-offset: 3px; }
.party-title, .party-desc, .party-action { display: block; }
.party-title { color: #073e72; font-size: 24px; font-weight: 700; }
.party-desc { color: #62748a; font-size: 15px; margin-top: 8px; }
.party-action { color: #087cdb; font-size: 14px; margin-top: 24px; }
.login-page { max-width: 760px; margin: 0 auto; }
.registration-page .auth-card { margin-top: 24px; border-top: 0; padding-top: 0; }
.registration-page .form-title { color: #073e72; font-family: inherit; font-size: 28px; font-weight: 700; }
.registration-page .form-subtitle { color: #61748a; font-size: 14px; }
.registration-page .field-label { font-size: 14px; color: #3c4c60; }
.registration-page .field-input { min-height: 44px; font-size: 15px; }
.registration-page .code-btn { min-width: 104px; min-height: 44px; line-height: 44px; font-size: 13px; }
.registration-page .consent-row, .registration-page .legal-links, .registration-page .mode-switch { font-size: 13px; }
.registration-page .consent-row { min-height: 44px; }
.registration-page .primary-btn { min-height: 46px; background: #087cdb; color: #fff; font-size: 16px; line-height: 46px; }
@media (max-width: 540px) { .party-choices { grid-template-columns: 1fr; } }
</style>
