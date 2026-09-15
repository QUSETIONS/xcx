<template>
  <view v-if="loadState === 'loading'" class="page-state">
    <text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
    <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>{{ t('common.loadFailed') }}</text>
    <text class="page-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="page">
    <!-- 未认证 -->
    <block v-if="status === 'none'">
      <view class="banner">
        <image class="banner-icon" src="/static/icons/shield.svg" mode="aspectFit" />
        <text class="banner-title">{{ t('verify.bannerTitle') }}</text>
        <text class="banner-desc">{{ t('verify.bannerDesc') }}</text>
      </view>

      <view class="benefits">
        <view class="benefit-item">
          <view class="b-icon"><image src="/static/icons/shield.svg" mode="aspectFit" /></view>
          <view><text class="b-title">{{ t('verify.b1Title') }}</text><text class="b-desc">{{ t('verify.b1Desc') }}</text></view>
        </view>
        <view class="benefit-item">
          <view class="b-icon"><image src="/static/icons/dashboard.svg" mode="aspectFit" /></view>
          <view><text class="b-title">{{ t('verify.b2Title') }}</text><text class="b-desc">{{ t('verify.b2Desc') }}</text></view>
        </view>
        <view class="benefit-item">
          <view class="b-icon"><image src="/static/icons/handshake.svg" mode="aspectFit" /></view>
          <view><text class="b-title">{{ t('verify.b3Title') }}</text><text class="b-desc">{{ t('verify.b3Desc') }}</text></view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">{{ t('verify.formTitle') }}</text>
        <view class="form-card">
          <text class="form-label">{{ t('verify.companyLabel') }}</text>
          <input class="form-input" v-model="form.company_name" :placeholder="t('verify.companyPlaceholder')" />
        </view>
        <view class="form-card">
          <text class="form-label">{{ t('verify.creditLabel') }}</text>
          <input class="form-input" v-model="form.credit_code" :placeholder="t('verify.creditPlaceholder')" maxlength="18" />
        </view>
        <view class="form-card">
          <text class="form-label">{{ t('verify.legalLabel') }}</text>
          <input class="form-input" v-model="form.legal_person" :placeholder="t('verify.legalPlaceholder')" />
        </view>
        <view class="form-card">
          <text class="form-label">{{ t('verify.phoneLabel') }}</text>
          <input class="form-input" type="number" v-model="form.phone" :placeholder="t('verify.phonePlaceholder')" />
        </view>
        <view class="form-card">
          <text class="form-label">{{ t('verify.licenseLabel') }}</text>
          <view class="upload-box" @tap="uploadLicense">
            <view class="upload-text" v-if="!form.license_uploaded"><image src="/static/icons/file.svg" mode="aspectFit" /><text>{{ t('verify.uploadLicense') }}</text></view>
            <text class="upload-done" v-else>✓ {{ t('verify.uploaded') }}</text>
          </view>
        </view>
      </view>

      <view class="submit-btn" :class="{ disabled: submitting }" @tap="submit"><text>{{ submitting ? t('common.loading') : t('verify.submit') }}</text></view>
      <view style="height: 60rpx;"></view>
    </block>

    <!-- 审核中 -->
    <view v-else-if="status === 'pending'" class="status-box">
      <text class="status-icon">⏳</text>
      <text class="status-title">{{ t('verify.pendingTitle') }}</text>
      <text class="status-desc">{{ t('verify.pendingDesc') }}</text>
      <view class="status-info">
        <view class="info-row"><text class="info-label">{{ t('verify.companyName') }}</text><text class="info-value">{{ info.company_name }}</text></view>
        <view class="info-row"><text class="info-label">{{ t('verify.submittedAt') }}</text><text class="info-value">{{ formatTime(info.submitted_at) }}</text></view>
      </view>
      <view class="review-note"><text class="review-note-mark">i</text><text>资料已提交，运营审核通过后会在消息中心通知你。审核结果不会由用户自行修改。</text></view>
    </view>

    <!-- 已认证 -->
    <view v-else-if="status === 'verified'" class="status-box">
      <text class="status-icon verified">✓</text>
      <text class="status-title verified">{{ t('verify.verifiedTitle') }}</text>
      <view class="verified-badge"><text>{{ t('verify.verifiedBadge') }}</text></view>
      <view class="status-info">
        <view class="info-row"><text class="info-label">{{ t('verify.companyName') }}</text><text class="info-value">{{ info.company_name }}</text></view>
        <view class="info-row"><text class="info-label">{{ t('verify.creditCode') }}</text><text class="info-value">{{ info.credit_code }}</text></view>
        <view class="info-row"><text class="info-label">{{ t('verify.legalPerson') }}</text><text class="info-value">{{ info.legal_person }}</text></view>
        <view class="info-row"><text class="info-label">{{ t('verify.verifiedAt') }}</text><text class="info-value">{{ formatTime(info.verified_at) }}</text></view>
      </view>
      <text class="verified-tip">{{ t('verify.verifiedTip') }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { formatDateFull as formatTime } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useRequest } from '@/hooks/useRequest'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.verify')

const status = ref('none')
const info = ref(null)
const form = ref({ company_name: '', credit_code: '', legal_person: '', phone: '', license_uploaded: false })
const userStore = useUserStore()

const { state: loadState, run: loadRequest } = useRequest(async () => {
  const [nextInfo, nextStatus] = await Promise.all([
    bridge.verify.getInfo(),
    bridge.verify.status()
  ])
  return { info: nextInfo, status: nextStatus }
})
const { state: submitState, run: submitRequest } = useRequest(async (payload) => {
  await bridge.verify.submit(payload)
  const [nextInfo, nextStatus] = await Promise.all([
    bridge.verify.getInfo(),
    bridge.verify.status()
  ])
  return { info: nextInfo, status: nextStatus }
})
const submitting = computed(() => submitState.value === 'loading')

async function reload() {
  if (!(await requirePageLogin(userStore, '登录后才能进行企业认证'))) return
  try {
    const data = await loadRequest()
    info.value = data.info
    status.value = data.status || 'none'
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

function uploadLicense() {
  form.value.license_uploaded = true
  uni.showToast({ title: t('verify.uploadSuccess'), icon: 'success' })
}

async function submit() {
  if (submitting.value) return
  if (!form.value.company_name || !form.value.credit_code || !form.value.legal_person || !form.value.phone) {
    uni.showToast({ title: t('demandPublish.fillComplete'), icon: 'none' }); return
  }
  if (form.value.credit_code.length !== 18) { uni.showToast({ title: t('verify.creditLength'), icon: 'none' }); return }
  if (!form.value.license_uploaded) { uni.showToast({ title: t('verify.uploadLicenseRequired'), icon: 'none' }); return }
  try {
    const data = await submitRequest({ ...form.value })
    info.value = data.info
    status.value = data.status || 'pending'
    uni.showToast({ title: t('demandDetail.submitSuccess'), icon: 'success' })
  } catch {
    toastError(t('common.loadFailed'))
  }
}

</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }

.banner { background: linear-gradient(135deg, #FF6B35, #FF9A5C); padding: 48rpx 32rpx; display: flex; flex-direction: column; align-items: center; }
.banner-icon { width: 52rpx; height: 52rpx; margin-bottom: 16rpx; padding: 12rpx; border-radius: 10rpx; background: #FCFBF8; }
.banner-title { font-size: 36rpx; font-weight: bold; color: #FFFFFF; margin-bottom: 8rpx; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.9); }

.benefits { background: #FFFFFF; margin: 16rpx 24rpx; border-radius: 16rpx; padding: 24rpx; }
.benefit-item { display: flex; align-items: center; padding: 16rpx 0; }
.b-icon { width: 56rpx; height: 56rpx; background: rgba(255,107,53,0.1); border-radius: 14rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; color: #FF6B35; margin-right: 16rpx; }
.b-icon image { width: 30rpx; height: 30rpx; }
.b-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.b-desc { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.form-section { margin: 16rpx 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.form-card { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.form-label { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 8rpx; }
.form-input { font-size: 28rpx; color: rgba(0,0,0,0.85); padding: 8rpx 0; }
.upload-box { border: 2rpx dashed rgba(0,0,0,0.15); border-radius: 12rpx; padding: 32rpx; display: flex; align-items: center; justify-content: center; }
.upload-text { display: flex; align-items: center; gap: 10rpx; font-size: 26rpx; color: rgba(0,0,0,0.4); }
.upload-text image { width: 30rpx; height: 30rpx; }
.upload-done { font-size: 26rpx; color: #10B981; font-weight: bold; }

.submit-btn { margin: 24rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 24rpx; text-align: center; }
.submit-btn.disabled { opacity: 0.65; }
.submit-btn text { font-size: 30rpx; color: #FFFFFF; font-weight: bold; }

.status-box { display: flex; flex-direction: column; align-items: center; padding: 80rpx 48rpx; }
.status-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.status-icon.verified { color: #10B981; }
.status-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 12rpx; }
.status-title.verified { color: #10B981; }
.status-desc { font-size: 26rpx; color: rgba(0,0,0,0.5); text-align: center; line-height: 1.6; margin-bottom: 32rpx; }

.verified-badge { background: linear-gradient(135deg, #FF6B35, #FF9A5C); padding: 12rpx 32rpx; border-radius: 24rpx; margin-bottom: 32rpx; }
.verified-badge text { font-size: 26rpx; color: #FFFFFF; font-weight: bold; }

.status-info { width: 100%; background: #FFFFFF; border-radius: 16rpx; padding: 24rpx; }
.info-row { display: flex; justify-content: space-between; padding: 12rpx 0; border-bottom: 1rpx solid #F5F6FA; }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 26rpx; color: rgba(0,0,0,0.5); }
.info-value { font-size: 26rpx; color: rgba(0,0,0,0.85); }

.review-note { display: flex; align-items: flex-start; width: 100%; box-sizing: border-box; margin-top: 30rpx; padding: 18rpx; border-radius: 14rpx; color: rgba(0,0,0,.52); background: #FFF8EE; font-size: 22rpx; line-height: 1.55; }
.review-note-mark { display: flex; align-items: center; justify-content: center; flex: 0 0 27rpx; width: 27rpx; height: 27rpx; margin: 1rpx 9rpx 0 0; border: 1rpx solid #DCA65F; border-radius: 50%; color: #C4802D; font-size: 17rpx; }
.verified-tip { font-size: 24rpx; color: #10B981; margin-top: 24rpx; }

/* Enterprise workflow pass: verification should feel trustworthy and procedural. */
.page { background: #F5F6F8; color: #1F2329; }
.error-state { color: #D4380D; }
.banner { background: #172B4D; border-bottom: 3rpx solid #1677FF; }
.benefits, .form-card, .status-info { border: 1rpx solid #E5E6EB; border-radius: 12rpx; box-shadow: none; }
.b-icon { color: #0958D9; background: #E8F3FF; border-radius: 10rpx; }
.b-title, .section-title, .status-title, .info-value { color: #1F2329; }
.b-desc, .form-label, .info-label, .status-desc { color: #86909C; }
.upload-box { border-color: #91CAFF; background: #F7FBFF; }
.submit-btn, .verified-badge { background: #1677FF; border-radius: 8rpx; }
.verified-tip, .status-icon.verified, .status-title.verified, .upload-done { color: #087F5B; }

/* 认证页的权益行、信息行和上传操作在小屏自动收缩，避免内容撑破卡片。 */
.page, .banner, .benefits, .benefit-item, .form-section, .form-card, .status-box, .status-info,
.info-row, .review-note { min-width: 0; }
.page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.banner-title, .banner-desc, .b-title, .b-desc, .form-label, .info-label, .info-value,
.status-title, .status-desc, .review-note > text:last-child, .verified-tip { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.banner-title, .status-title { text-align: center; }
.benefit-item > view:last-child { min-width: 0; flex: 1; overflow: hidden; }
.b-title, .b-desc { display: block; }
.b-title, .info-label, .info-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.info-row { gap: 12rpx; }
.info-label, .info-value { min-width: 0; }
.info-value { flex: 1; text-align: right; }
.upload-text { max-width: 100%; flex-wrap: wrap; justify-content: center; }
.upload-text text { min-width: 0; overflow-wrap: anywhere; }
.review-note > text:last-child { display: block; flex: 1; }

@media (max-width: 420px) {
  .page { padding-bottom: 24rpx; }
  .banner { padding-right: 20rpx; padding-left: 20rpx; }
  .benefits, .form-section { margin-right: 16rpx; margin-left: 16rpx; }
  .benefits { padding: 18rpx; }
  .form-card { padding: 16rpx; }
  .status-box { padding-right: 24rpx; padding-left: 24rpx; }
  .info-row { align-items: flex-start; }
}
</style>
