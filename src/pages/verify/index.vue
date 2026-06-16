<template>
  <view class="page">
    <!-- 未认证 -->
    <block v-if="status === 'none'">
      <view class="banner">
        <text class="banner-icon">🏛️</text>
        <text class="banner-title">{{ t('verify.bannerTitle') }}</text>
        <text class="banner-desc">{{ t('verify.bannerDesc') }}</text>
      </view>

      <view class="benefits">
        <view class="benefit-item">
          <text class="b-icon">✓</text>
          <view><text class="b-title">{{ t('verify.b1Title') }}</text><text class="b-desc">{{ t('verify.b1Desc') }}</text></view>
        </view>
        <view class="benefit-item">
          <text class="b-icon">📈</text>
          <view><text class="b-title">{{ t('verify.b2Title') }}</text><text class="b-desc">{{ t('verify.b2Desc') }}</text></view>
        </view>
        <view class="benefit-item">
          <text class="b-icon">🤝</text>
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
            <text class="upload-text" v-if="!form.license_uploaded">📷 {{ t('verify.uploadLicense') }}</text>
            <text class="upload-done" v-else>✓ {{ t('verify.uploaded') }}</text>
          </view>
        </view>
      </view>

      <view class="submit-btn" @tap="submit"><text>{{ t('verify.submit') }}</text></view>
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
      <view class="simulate-btn" @tap="simulateApprove"><text>{{ t('verify.simulateApprove') }}</text></view>
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
import { ref, onMounted } from 'vue'
import { verifyService } from '@/mock/service'
import { formatDateFull as formatTime } from "@/utils/util"
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
useNavTitle('titles.verify')

const status = ref('none')
const info = ref(null)
const form = ref({ company_name: '', credit_code: '', legal_person: '', phone: '', license_uploaded: false })

onMounted(() => {
  info.value = verifyService.getInfo()
  status.value = verifyService.status()
})

function uploadLicense() {
  form.value.license_uploaded = true
  uni.showToast({ title: t('verify.uploadSuccess'), icon: 'success' })
}

function submit() {
  if (!form.value.company_name || !form.value.credit_code || !form.value.legal_person || !form.value.phone) {
    uni.showToast({ title: t('demandPublish.fillComplete'), icon: 'none' }); return
  }
  if (form.value.credit_code.length !== 18) { uni.showToast({ title: t('verify.creditLength'), icon: 'none' }); return }
  if (!form.value.license_uploaded) { uni.showToast({ title: t('verify.uploadLicenseRequired'), icon: 'none' }); return }
  verifyService.submit(form.value)
  info.value = verifyService.getInfo()
  status.value = 'pending'
  uni.showToast({ title: t('demandDetail.submitSuccess'), icon: 'success' })
}

function simulateApprove() {
  verifyService.approve()
  info.value = verifyService.getInfo()
  status.value = 'verified'
  uni.showToast({ title: t('verify.verifySuccess'), icon: 'success' })
}

</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }

.banner { background: linear-gradient(135deg, #FF6B35, #FF9A5C); padding: 48rpx 32rpx; display: flex; flex-direction: column; align-items: center; }
.banner-icon { font-size: 72rpx; margin-bottom: 16rpx; }
.banner-title { font-size: 36rpx; font-weight: bold; color: #FFFFFF; margin-bottom: 8rpx; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.9); }

.benefits { background: #FFFFFF; margin: 16rpx 24rpx; border-radius: 16rpx; padding: 24rpx; }
.benefit-item { display: flex; align-items: center; padding: 16rpx 0; }
.b-icon { width: 56rpx; height: 56rpx; background: rgba(255,107,53,0.1); border-radius: 14rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; color: #FF6B35; margin-right: 16rpx; }
.b-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; }
.b-desc { font-size: 22rpx; color: rgba(0,0,0,0.4); }

.form-section { margin: 16rpx 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.form-card { background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.form-label { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 8rpx; }
.form-input { font-size: 28rpx; color: rgba(0,0,0,0.85); padding: 8rpx 0; }
.upload-box { border: 2rpx dashed rgba(0,0,0,0.15); border-radius: 12rpx; padding: 32rpx; display: flex; align-items: center; justify-content: center; }
.upload-text { font-size: 26rpx; color: rgba(0,0,0,0.4); }
.upload-done { font-size: 26rpx; color: #10B981; font-weight: bold; }

.submit-btn { margin: 24rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 32rpx; padding: 24rpx; text-align: center; }
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

.simulate-btn { margin-top: 32rpx; border: 1rpx solid #FF6B35; border-radius: 32rpx; padding: 18rpx 40rpx; }
.simulate-btn text { font-size: 26rpx; color: #FF6B35; }
.verified-tip { font-size: 24rpx; color: #10B981; margin-top: 24rpx; }
</style>