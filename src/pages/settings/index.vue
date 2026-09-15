<template>
  <view v-if="loadState === 'loading'" class="page-state">
    <text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
    <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>{{ t('common.loadFailed') }}</text>
    <text class="page-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="page" :style="a11yStyle">
    <!-- 账户信息 -->
    <view class="section">
      <text class="section-title">{{ t('settings.account') }}</text>
      <view class="card">
        <view class="cell" @tap="goProfile">
          <view class="cell-icon"><image src="/static/icons/user.svg" mode="aspectFit" /></view>
          <text class="cell-label">个人资料</text>
          <text class="cell-value">{{ nickname }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="goVerify">
          <view class="cell-icon"><image src="/static/icons/shield.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.verify') }}</text>
          <text class="cell-value" :class="verifyClass">{{ verifyText }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="goMember">
          <view class="cell-icon"><image src="/static/icons/star.svg" mode="aspectFit" /></view>
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
          <view class="cell-icon"><image src="/static/icons/bell.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.notifLead') }}</text>
          <switch :checked="notify.lead" @change="(e) => toggleNotify('lead', e)" color="#FF6B35"/>
        </view>
        <view class="cell">
          <view class="cell-icon"><image src="/static/icons/package.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.notifOrder') }}</text>
          <switch :checked="notify.order" @change="(e) => toggleNotify('order', e)" color="#FF6B35"/>
        </view>
        <view class="cell">
          <view class="cell-icon"><image src="/static/icons/chat.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.notifInteract') }}</text>
          <switch :checked="notify.interact" @change="(e) => toggleNotify('interact', e)" color="#FF6B35"/>
        </view>
        <view class="cell">
          <view class="cell-icon"><image src="/static/icons/dashboard.svg" mode="aspectFit" /></view>
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
          <view class="cell-icon"><image src="/static/icons/cat/cat_04.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.language') }}</text>
          <text class="cell-value">{{ currentLocaleLabel }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="showFontPicker">
          <view class="cell-icon"><image src="/static/icons/edit.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.fontSize') }}</text>
          <text class="cell-value">{{ fontLabel }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell">
          <view class="cell-icon"><image src="/static/icons/settings.svg" mode="aspectFit" /></view>
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
          <view class="cell-icon"><image src="/static/icons/cat/cat_04.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.clearCache') }}</text>
          <text class="cell-value">{{ cacheSize }}</text>
          <text class="cell-clear" @tap.stop="clearCache">{{ t('settings.cacheClear') }}</text>
        </view>
        <view class="cell" @tap="checkUpdate">
          <view class="cell-icon"><image src="/static/icons/dashboard.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.checkUpdate') }}</text>
          <text class="cell-value">v1.0.0</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="showAgreement">
          <view class="cell-icon"><image src="/static/icons/file.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.agreement') }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="showPrivacy">
          <view class="cell-icon"><image src="/static/icons/shield.svg" mode="aspectFit" /></view>
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
          <view class="cell-icon"><image src="/static/icons/chat.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.onlineService') }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="feedback">
          <view class="cell-icon"><image src="/static/icons/edit.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.feedback') }}</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="goGovernance">
          <view class="cell-icon"><image src="/static/icons/shield.svg" mode="aspectFit" /></view>
          <text class="cell-label">举报与申诉</text>
          <text class="cell-arrow">›</text>
        </view>
        <view class="cell" @tap="aboutUs">
          <view class="cell-icon"><image src="/static/icons/alert.svg" mode="aspectFit" /></view>
          <text class="cell-label">{{ t('settings.about') }}</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-btn" @tap="logout"><text>{{ t('settings.logout') }}</text></view>
    <view class="delete-account" @tap="deleteAccount"><text>注销账号</text><text>注销后个人资料与公开内容会被匿名化</text></view>
    <text class="version-text">{{ t('settings.appVersion') }}</text>
    <view style="height: 60rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { t, locale, locales, setLocale } from '@/i18n'
import { fontScales, fontScale, setFontScale, highContrast, toggleContrast, currentFontLabel, a11yStyle } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useRequest } from '@/hooks/useRequest'
import { toastError } from '@/utils/feedback'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.settings')

const nickname = ref('创业者')
const userStore = useUserStore()
const cacheSize = ref('0 KB')
const notify = ref({ system: true, lead: true, order: true, deal: true, interact: true, proposal: true, campaign: true })
const verifyStatus = ref('none')
const memberInfo = ref({ tier: 'free' })

const verifyText = computed(() => ({ none: t('settings.verifyNone'), pending: t('settings.verifyPending'), verified: t('settings.verifyVerified') }[verifyStatus.value]))
const verifyClass = computed(() => ({ none: 'gray', pending: 'orange', verified: 'green' }[verifyStatus.value]))
const memberText = computed(() => ({ free: t('member.free'), pro: t('member.pro'), enterprise: t('member.enterprise') }[memberInfo.value.tier] || t('member.free')))

// i18n / 无障碍
const currentLocaleLabel = computed(() => locales.find(l => l.value === locale.value)?.label || locales[0].label)
const fontLabel = computed(() => currentFontLabel.value)
const contrast = computed(() => highContrast.value)

const { state: loadState, run: loadRequest } = useRequest(async () => {
  const [status, member] = await Promise.all([
    bridge.verify.status(),
    bridge.member.current()
  ])
  const preferences = await bridge.notify.preferences().catch(() => null)
  return { status, member, preferences }
})

async function reload() {
  if (!(await requirePageLogin(userStore, '登录后才能打开设置'))) return
  try {
    const data = await loadRequest()
    verifyStatus.value = data.status || 'none'
    memberInfo.value = data.member || { tier: 'free' }
    if (data.preferences && typeof data.preferences === 'object') {
      notify.value = { ...notify.value, ...data.preferences }
    }
    nickname.value = userStore.userInfo?.nickname || uni.getStorageSync('qiye_ku_nickname') || '创业者'
    if (!data.preferences) {
      try {
        const storedNotify = uni.getStorageSync('qiye_ku_notify')
        const parsedNotify = typeof storedNotify === 'string' ? JSON.parse(storedNotify) : storedNotify
        if (parsedNotify && typeof parsedNotify === 'object') notify.value = { ...notify.value, ...parsedNotify }
      } catch {}
    }
    calcCache()
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

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

async function toggleNotify(key, e) {
  const previous = notify.value[key]
  const next = Boolean(e.detail.value)
  notify.value[key] = next
  try {
    const updated = await bridge.notify.updatePreferences({ [key]: next })
    if (updated && typeof updated === 'object') notify.value = { ...notify.value, ...updated }
    uni.setStorageSync('qiye_ku_notify', JSON.stringify(notify.value))
  } catch {
    notify.value[key] = previous
    toastError('通知设置保存失败，请稍后重试')
  }
}

function goProfile() { uni.navigateTo({ url: '/pages/user/profile' }) }
function goVerify() { uni.navigateTo({ url: '/pages/verify/index' }) }
function goMember() { uni.navigateTo({ url: '/pages/member/index' }) }
function goChat() { uni.navigateTo({ url: '/pages/chat/index' }) }
function goGovernance() { uni.navigateTo({ url: '/pages/governance/index' }) }

function clearCache() {
  uni.showModal({
    title: '清除缓存', content: '将清除本地缓存数据，不影响您的账户',
    success: (r) => {
      if (r.confirm) {
        // 保留登录态与会员信息
        const keep = ['user', 'qiye_ku_token', 'qiye_ku_member', 'qiye_ku_verify', 'qiye_ku_user', 'qiye_ku_notify', 'qiye_ku_nickname']
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
function showAgreement() { uni.navigateTo({ url: '/pages/legal/index?type=agreement' }) }
function showPrivacy() { uni.navigateTo({ url: '/pages/legal/index?type=privacy' }) }
function feedback() {
  uni.showModal({
    title: '意见反馈', editable: true, placeholderText: '说说你的建议...',
    success: (r) => { if (r.confirm) uni.showToast({ title: t('settings.feedbackThanks'), icon: 'success' }) }
  })
}
function aboutUs() { uni.showModal({ title: '关于媒合智联', content: '媒合智联 MediaMatch - 找项目、找伙伴、找服务\nv1.0.0', showCancel: false }) }

function logout() {
  uni.showModal({
    title: '退出登录', content: '确定退出当前账号？',
    success: (r) => {
      if (r.confirm) {
        userStore.logout()
        try { uni.clearStorageSync() } catch {}
        uni.showToast({ title: '已退出', icon: 'none' })
        setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1000)
      }
    }
  })
}

function deleteAccount() {
  uni.showModal({
    title: '确认注销账号？',
    content: '注销后将退出登录，个人资料、公开动态和联系方式会被匿名化，已完成的订单记录会保留为业务凭证。',
    confirmText: '确认注销',
    confirmColor: '#EF4444',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await bridge.user.deleteAccount()
        userStore.logout()
        try { uni.clearStorageSync() } catch {}
        uni.showToast({ title: '账号已注销', icon: 'none' })
        setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 900)
      } catch (error) {
        uni.showToast({ title: error?.message || '注销失败，请稍后重试', icon: 'none' })
      }
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }

.section { margin-top: 24rpx; }
.section-title { font-size: 26rpx; color: rgba(0,0,0,0.5); padding: 0 32rpx; margin-bottom: 12rpx; }
.card { background: #FFFFFF; margin: 0 24rpx; border-radius: 16rpx; overflow: hidden; }

.cell { display: flex; align-items: center; padding: 28rpx 24rpx; border-bottom: 1rpx solid #F5F6FA; }
.cell:last-child { border-bottom: none; }
.cell-icon { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; flex: 0 0 48rpx; margin-right: 16rpx; border-radius: 15rpx; background: #F5F6FA; line-height: 1; }
.cell-icon image { display: block; width: 30rpx; height: 30rpx; }
.cell-label { flex: 1; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.cell-value { font-size: 26rpx; color: rgba(0,0,0,0.4); margin-right: 8rpx; }
.cell-value.green { color: #10B981; }
.cell-value.orange { color: #F59E0B; }
.cell-value.gray { color: rgba(0,0,0,0.4); }
.cell-arrow { font-size: 32rpx; color: rgba(0,0,0,0.2); }
.cell-clear { font-size: 26rpx; color: #FF6B35; padding: 8rpx 20rpx; background: rgba(255,107,53,0.1); border-radius: 20rpx; }

.logout-btn { margin: 40rpx 24rpx; background: #FFFFFF; border-radius: 16rpx; padding: 28rpx; text-align: center; }
.logout-btn text { font-size: 30rpx; color: #EF4444; font-weight: bold; }
.delete-account { display: flex; flex-direction: column; align-items: center; gap: 8rpx; margin: -24rpx 24rpx 26rpx; padding: 14rpx; color: #a0aabd; font-size: 20rpx; text-align: center; }
.delete-account text:first-child { color: #c66f6f; font-size: 22rpx; }
.version-text { display: block; text-align: center; font-size: 22rpx; color: rgba(0,0,0,0.3); }

/* 设置单元格的标签、状态和值按剩余空间排列，长账号信息不会把箭头或开关挤出卡片。 */
.page, .section, .card, .cell, .cell-label, .cell-value { min-width: 0; }
.page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.cell { gap: 12rpx; }
.cell-label { flex: 1; overflow: hidden; overflow-wrap: anywhere; word-break: break-word; }
.cell-value { flex: 0 1 auto; max-width: 42%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell-icon, .cell-arrow, .cell-clear, .cell > switch { flex: 0 0 auto; }
.cell-arrow, .cell-clear { white-space: nowrap; }
.delete-account text { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }

@media (max-width: 420px) {
  .page { padding-bottom: 24rpx; }
  .cell { padding-right: 16rpx; padding-left: 16rpx; }
  .cell-value { max-width: 36%; font-size: 23rpx; }
  .cell-clear { padding-right: 12rpx; padding-left: 12rpx; }
}
</style>
