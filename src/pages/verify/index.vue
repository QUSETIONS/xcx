<template>
  <view class="page">
    <!-- 未认证 -->
    <block v-if="status === 'none'">
      <view class="banner">
        <text class="banner-icon">🏛️</text>
        <text class="banner-title">企业实名认证</text>
        <text class="banner-desc">完成认证，获得专属标识，提升信任度与接单率</text>
      </view>

      <view class="benefits">
        <view class="benefit-item">
          <text class="b-icon">✓</text>
          <view><text class="b-title">专属认证标识</text><text class="b-desc">企业主页展示官方认证标</text></view>
        </view>
        <view class="benefit-item">
          <text class="b-icon">📈</text>
          <view><text class="b-title">接单率提升60%</text><text class="b-desc">认证企业优先推荐</text></view>
        </view>
        <view class="benefit-item">
          <text class="b-icon">🤝</text>
          <view><text class="b-title">需求方更信赖</text><text class="b-desc">认证标识增强信任</text></view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">填写认证信息</text>
        <view class="form-card">
          <text class="form-label">企业名称 *</text>
          <input class="form-input" v-model="form.company_name" placeholder="请输入营业执照上的企业全称" />
        </view>
        <view class="form-card">
          <text class="form-label">统一社会信用代码 *</text>
          <input class="form-input" v-model="form.credit_code" placeholder="18位信用代码" maxlength="18" />
        </view>
        <view class="form-card">
          <text class="form-label">法人姓名 *</text>
          <input class="form-input" v-model="form.legal_person" placeholder="法定代表人姓名" />
        </view>
        <view class="form-card">
          <text class="form-label">联系电话 *</text>
          <input class="form-input" type="number" v-model="form.phone" placeholder="企业联系电话" />
        </view>
        <view class="form-card">
          <text class="form-label">营业执照照片 *</text>
          <view class="upload-box" @tap="uploadLicense">
            <text class="upload-text" v-if="!form.license_uploaded">📷 上传营业执照</text>
            <text class="upload-done" v-else>✓ 已上传</text>
          </view>
        </view>
      </view>

      <view class="submit-btn" @tap="submit"><text>提交认证申请</text></view>
      <view style="height: 60rpx;"></view>
    </block>

    <!-- 审核中 -->
    <view v-else-if="status === 'pending'" class="status-box">
      <text class="status-icon">⏳</text>
      <text class="status-title">认证审核中</text>
      <text class="status-desc">您的认证申请已提交，预计1-3个工作日完成审核</text>
      <view class="status-info">
        <view class="info-row"><text class="info-label">企业名称</text><text class="info-value">{{ info.company_name }}</text></view>
        <view class="info-row"><text class="info-label">提交时间</text><text class="info-value">{{ formatTime(info.submitted_at) }}</text></view>
      </view>
      <view class="simulate-btn" @tap="simulateApprove"><text>模拟审核通过（Demo）</text></view>
    </view>

    <!-- 已认证 -->
    <view v-else-if="status === 'verified'" class="status-box">
      <text class="status-icon verified">✓</text>
      <text class="status-title verified">认证成功</text>
      <view class="verified-badge"><text>企业认证 · 已通过</text></view>
      <view class="status-info">
        <view class="info-row"><text class="info-label">企业名称</text><text class="info-value">{{ info.company_name }}</text></view>
        <view class="info-row"><text class="info-label">信用代码</text><text class="info-value">{{ info.credit_code }}</text></view>
        <view class="info-row"><text class="info-label">法人</text><text class="info-value">{{ info.legal_person }}</text></view>
        <view class="info-row"><text class="info-label">认证时间</text><text class="info-value">{{ formatTime(info.verified_at) }}</text></view>
      </view>
      <text class="verified-tip">认证标识已展示在您的需求与主页</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { verifyService } from '@/mock/service'

const status = ref('none')
const info = ref(null)
const form = ref({ company_name: '', credit_code: '', legal_person: '', phone: '', license_uploaded: false })

onMounted(() => {
  info.value = verifyService.getInfo()
  status.value = verifyService.status()
})

function uploadLicense() {
  form.value.license_uploaded = true
  uni.showToast({ title: '上传成功（模拟）', icon: 'success' })
}

function submit() {
  if (!form.value.company_name || !form.value.credit_code || !form.value.legal_person || !form.value.phone) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' }); return
  }
  if (form.value.credit_code.length !== 18) { uni.showToast({ title: '信用代码需18位', icon: 'none' }); return }
  if (!form.value.license_uploaded) { uni.showToast({ title: '请上传营业执照', icon: 'none' }); return }
  verifyService.submit(form.value)
  info.value = verifyService.getInfo()
  status.value = 'pending'
  uni.showToast({ title: '提交成功', icon: 'success' })
}

function simulateApprove() {
  verifyService.approve()
  info.value = verifyService.getInfo()
  status.value = 'verified'
  uni.showToast({ title: '认证成功', icon: 'success' })
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
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