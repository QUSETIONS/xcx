<template>
  <view class="page">
    <!-- 账户信息 -->
    <view class="section">
      <text class="section-title">{{ t('settings.account') }}</text>
      <view class="card">
        <view class="cell" @tap="editNickname">
          <text class="cell-icon">👤</text>
          <text class="cell-label">{{ t('settings.nickname') }}</text>
          <text class="cell-value">{{ nickname }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="goVerify">
          <text class="cell-icon">🏛️</text>
          <text class="cell-label">{{ t('settings.verify') }}</text>
          <text class="cell-value" :class="verifyClass">{{ verifyText }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="goMember">
          <text class="cell-icon">⭐</text>
          <text class="cell-label">{{ t('settings.memberLevel') }}</text>
          <text class="cell-value">{{ memberText }}</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 通知设置 -->
    <view class="section">
      <text class="section-title">{{ t('settings.notification') }}</text>
      <view class="card">
        <view class="cell">
          <text class="cell-icon">🔔</text>
          <text class="cell-label">{{ t('settings.notifLead') }}</text>
          <switch :checked="notify.lead" @change="(e) => toggleNotify('lead', e)" color="#FF6B35"/>
        </view>
        <view class="cell">
          <text class="cell-icon">📦</text>
          <text class="cell-label">{{ t('settings.notifOrder') }}</text>
          <switch :checked="notify.order" @change="(e) => toggleNotify('order', e)" color="#FF6B35"/>
        </view>
        <view class="cell">
          <text class="cell-icon">💬</text>
          <text class="cell-label">{{ t('settings.notifInteract') }}</text>
          <switch :checked="notify.interact" @change="(e) => toggleNotify('interact', e)" color="#FF6B35"/>
        </view>
        <view class="cell">
          <text class="cell-icon">🎯</text>
          <text class="cell-label">{{ t('settings.notifCampaign') }}</text>
          <switch :checked="notify.campaign" @change="(e) => toggleNotify('campaign', e)" color="#FF6B35"/>
        </view>
      </view>
    </view>

    <!-- 无障碍与语言 -->
    <view class="section">
      <text class="section-title">{{ t('settings.display') }}</text>
      <view class="card">
        <view class="cell" @tap="showLanguagePicker">
          <text class="cell-icon">🌍</text>
          <text class="cell-label">{{ t('settings.language') }}</text>
          <text class="cell-value">{{ currentLocaleLabel }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="showFontPicker">
          <text class="cell-icon">🔤</text>
          <text class="cell-label">{{ t('settings.fontSize') }}</text>
          <text class="cell-value">{{ fontLabel }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell">
          <text class="cell-icon">🎨</text>
          <text class="cell-label">{{ t('settings.highContrast') }}</text>
          <switch :checked="contrast" @change="onToggleContrast" color="#FF6B35"/>
        </view>
      </view>
    </view>

    <!-- 通用 -->
    <view class="section">
      <text class="section-title">{{ t('settings.general') }}</text>
      <view class="card">
        <view class="cell">
          <text class="cell-icon">🌐</text>
          <text class="cell-label">{{ t('settings.clearCache') }}</text>
          <text class="cell-value">{{ cacheSize }}</text>
          <text class="cell-clear" @tap.stop="clearCache">{{ t('settings.cacheClear') }}</text>
        </view>
        <view class="cell" @tap="checkUpdate">
          <text class="cell-icon">🔄</text>
          <text class="cell-label">{{ t('settings.checkUpdate') }}</text>
          <text class="cell-value">v1.0.0</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="showAgreement">
          <text class="cell-icon">📄</text>
          <text class="cell-label">{{ t('settings.agreement') }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="showPrivacy">
          <text class="cell-icon">🔒</text>
          <text class="cell-label">{{ t('settings.privacy') }}</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 反馈 -->
    <view class="section">
      <text class="section-title">{{ t('settings.helpFeedback') }}</text>
      <view class="card">
        <view class="cell" @tap="goChat">
          <text class="cell-icon">💬</text>
          <text class="cell-label">{{ t('settings.onlineService') }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="feedback">
          <text class="cell-icon">✏️</text>
          <text class="cell-label">{{ t('settings.feedback') }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="aboutUs">
          <text class="cell-icon">ℹ️</text>
          <text class="cell-label">{{ t('settings.about') }}</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-btn" @tap="logout"><text>{{ t('settings.logout') }}</text></view>
    <text class="version-text">企业库 v1.0.0 · 仅供演示</text>
    <view style="height: 60rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { verifyService, memberService } from '@/mock/service'
import { locale, locales, setLocale } from '@/i18n'
import { fontScales, fontScale, setFontScale, highContrast, toggleContrast, currentFontLabel } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.settings')

const nickname = ref('创业者')
const cacheSize = ref('0 KB')
const notify = ref({ lead: true, order: true, interact: true, campaign: false })
const verifyStatus = ref('none')
const memberInfo = ref({ tier: 'free' })

const verifyText = computed(() => ({ none: '未认证', pending: '审核中', verified: '已认证' }[verifyStatus.value]))
const verifyClass = computed(() => ({ none: 'gray', pending: 'orange', verified: 'green' }[verifyStatus.value]))
const memberText = computed(() => ({ free: '普通会员', pro: '专业版', enterprise: '企业版' }[memberInfo.value.tier] || '普通会员'))

// i18n / 无障碍
const currentLocaleLabel = computed(() => locales.find(l => l.value === locale.value)?.label || '简体中文')
const fontLabel = computed(() => currentFontLabel.value)
const contrast = computed(() => highContrast.value)

onMounted(() => {
  verifyStatus.value = verifyService.status()
  memberInfo.value = memberService.current()
  nickname.value = uni.getStorageSync('qiye_ku_nickname') || '创业者'
  calcCache()
})

function showLanguagePicker() {
  uni.showActionSheet({
    itemList: locales.map(l => l.label),
    success: (r) => {
      const picked = locales[r.tapIndex]
      if (picked) { setLocale(picked.value); uni.showToast({ title: '已切换', icon: 'success' }) }
    }
  })
}

function showFontPicker() {
  uni.showActionSheet({
    itemList: fontScales.map(f => f.label),
    success: (r) => {
      const picked = fontScales[r.tapIndex]
      if (picked) { setFontScale(picked.value); uni.showToast({ title: '已应用', icon: 'success' }) }
    }
  })
}

function onToggleContrast(e) {
  if (e.detail.value !== highContrast.value) toggleContrast()
}

function calcCache() {
  try {
    const info = uni.getStorageInfoSync()
    cacheSize.value = info.currentSize < 1024 ? info.currentSize + ' KB' : (info.currentSize / 1024).toFixed(1) + ' MB'
  } catch { cacheSize.value = '0 KB' }
}

function toggleNotify(key, e) {
  notify.value[key] = e.detail.value
  uni.setStorageSync('qiye_ku_notify', JSON.stringify(notify.value))
}

function editNickname() {
  uni.showModal({
    title: '修改昵称', editable: true, placeholderText: '请输入新昵称',
    success: (r) => {
      if (r.confirm && r.content) {
        nickname.value = r.content
        uni.setStorageSync('qiye_ku_nickname', r.content)
        uni.showToast({ title: '已修改', icon: 'success' })
      }
    }
  })
}

function goVerify() { uni.navigateTo({ url: '/pages/verify/index' }) }
function goMember() { uni.navigateTo({ url: '/pages/member/index' }) }
function goChat() { uni.navigateTo({ url: '/pages/chat/index' }) }

function clearCache() {
  uni.showModal({
    title: '清除缓存', content: '将清除本地缓存数据，不影响您的账户',
    success: (r) => {
      if (r.confirm) {
        // 保留登录态与会员信息
        const keep = ['qiye_ku_token', 'qiye_ku_member', 'qiye_ku_verify', 'qiye_ku_user']
        const keepVals = {}
        keep.forEach(k => { try { keepVals[k] = uni.getStorageSync(k) } catch {} })
        try { uni.clearStorageSync() } catch {}
        Object.entries(keepVals).forEach(([k, v]) => { if (v !== '' && v !== null) uni.setStorageSync(k, v) })
        calcCache()
        uni.showToast({ title: '已清理', icon: 'success' })
      }
    }
  })
}

function checkUpdate() { uni.showToast({ title: '已是最新版本', icon: 'none' }) }
function showAgreement() { uni.showModal({ title: '用户协议', content: '本应用为演示用途，用户协议内容暂略。', showCancel: false }) }
function showPrivacy() { uni.showModal({ title: '隐私政策', content: '我们重视您的隐私，演示版本不收集真实数据。', showCancel: false }) }
function feedback() {
  uni.showModal({
    title: '意见反馈', editable: true, placeholderText: '说说你的建议...',
    success: (r) => { if (r.confirm) uni.showToast({ title: '感谢反馈', icon: 'success' }) }
  })
}
function aboutUs() { uni.showModal({ title: '关于企业库', content: '企业库 - 企业服务精准对接平台\n演示版本 v1.0.0', showCancel: false }) }

function logout() {
  uni.showModal({
    title: '退出登录', content: '确定退出当前账号？',
    success: (r) => {
      if (r.confirm) {
        try { uni.clearStorageSync() } catch {}
        uni.showToast({ title: '已退出', icon: 'none' })
        setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1000)
      }
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }

.section { margin-top: 24rpx; }
.section-title { font-size: 26rpx; color: rgba(0,0,0,0.5); padding: 0 32rpx; margin-bottom: 12rpx; }
.card { background: #FFFFFF; margin: 0 24rpx; border-radius: 16rpx; overflow: hidden; }

.cell { display: flex; align-items: center; padding: 28rpx 24rpx; border-bottom: 1rpx solid #F5F6FA; }
.cell:last-child { border-bottom: none; }
.cell-icon { font-size: 36rpx; margin-right: 16rpx; width: 40rpx; text-align: center; }
.cell-label { flex: 1; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.cell-value { font-size: 26rpx; color: rgba(0,0,0,0.4); margin-right: 8rpx; }
.cell-value.green { color: #10B981; }
.cell-value.orange { color: #F59E0B; }
.cell-value.gray { color: rgba(0,0,0,0.4); }
.cell-arrow { font-size: 32rpx; color: rgba(0,0,0,0.2); }
.cell-clear { font-size: 26rpx; color: #FF6B35; padding: 8rpx 20rpx; background: rgba(255,107,53,0.1); border-radius: 20rpx; }

.logout-btn { margin: 40rpx 24rpx; background: #FFFFFF; border-radius: 16rpx; padding: 28rpx; text-align: center; }
.logout-btn text { font-size: 30rpx; color: #EF4444; font-weight: bold; }
.version-text { display: block; text-align: center; font-size: 22rpx; color: rgba(0,0,0,0.3); }
</style>