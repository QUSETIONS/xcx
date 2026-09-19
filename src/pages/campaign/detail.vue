<template>
  <view class="campaign-detail-page" :style="a11yStyle">
    <view v-if="loadState === 'loading'" class="detail-state">
      <text>正在加载活动详情…</text>
    </view>

    <view v-else-if="loadState === 'error'" class="detail-state detail-error" @tap="reload">
      <text>活动详情暂时加载失败</text>
      <text class="detail-state-action">点击重新加载</text>
    </view>

    <view v-else-if="campaign" class="detail-content">
      <view class="detail-header">
        <view class="detail-kicker-row">
          <text class="eyebrow">MEDIA / MATCH · EVENT</text>
          <text class="status-badge">{{ statusText }}</text>
        </view>
        <text class="detail-title">{{ campaign.title || '活动详情' }}</text>
        <text class="detail-subtitle">{{ campaign.category || '平台活动' }} · {{ campaign.tag || '活动信息' }}</text>
      </view>

      <image v-if="validImage(campaign.cover)" class="detail-cover" :src="campaign.cover" mode="aspectFill" />

      <view class="detail-facts">
        <view class="fact-item">
          <text class="fact-label">时间</text>
          <text class="fact-value">{{ dateText }}</text>
        </view>
        <view class="fact-item">
          <text class="fact-label">地点</text>
          <text class="fact-value">{{ locationText }}</text>
        </view>
        <view v-if="campaign.organizer" class="fact-item">
          <text class="fact-label">主办方</text>
          <text class="fact-value">{{ campaign.organizer }}</text>
        </view>
        <view v-if="campaign.registration_count != null" class="fact-item">
          <text class="fact-label">报名情况</text>
          <text class="fact-value">已有 {{ campaign.registration_count }} 人报名</text>
        </view>
      </view>

      <view class="detail-section">
        <text class="section-heading">活动介绍</text>
        <text class="detail-copy">{{ campaign.desc || campaign.description || '主办方暂未补充活动介绍。' }}</text>
      </view>

      <view class="detail-section">
        <text class="section-heading">报名说明</text>
        <text class="detail-copy">{{ signupDescription }}</text>
      </view>

      <button class="action-button" :disabled="ended" @tap="handleSignup">{{ actionText }}</button>
    </view>

    <view v-else class="detail-state">
      <text>暂未找到这项活动</text>
      <text class="detail-state-action">请返回资讯页重新选择</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { a11yStyle } from '@/utils/accessibility'

const campaignId = ref('')
const campaign = ref(null)

function normalizeCampaign(item) {
  if (!item) return null
  return {
    ...item,
    id: item.id || item._id,
    desc: item.desc || item.description || item.desc_text || item.subtitle || '',
    end: item.end || item.end_text || ''
  }
}

const { state: loadState, run: loadRequest } = useRequest(async (id) => {
  if (!id) return null
  return normalizeCampaign(await bridge.campaign.detail(id))
})

async function loadDetail() {
  if (!campaignId.value) return
  campaign.value = await loadRequest(campaignId.value)
}

async function reload() {
  try {
    await loadDetail()
  } catch {
    // useRequest 已经把页面切到错误态，保留当前页面供用户重试。
  }
}

function validImage(url) {
  return /^(https?:\/\/|\/(?!\/))/i.test(String(url || ''))
}

function validSignup(url) {
  return /^https:\/\/[^\s]+$/i.test(String(url || ''))
}

function formatDate(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return raw
  const datePart = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${datePart} ${hours}:${minutes}`
}

const ended = computed(() => {
  if (!campaign.value) return false
  if (campaign.value.ended) return true
  const value = campaign.value.ends_at
  return Boolean(value && !Number.isNaN(new Date(value).getTime()) && new Date(value).getTime() < Date.now())
})
const statusText = computed(() => ended.value ? '已结束' : campaign.value?.tag || '开放中')
const dateText = computed(() => {
  if (!campaign.value) return '时间待更新'
  if (campaign.value.end) return campaign.value.end
  const values = [campaign.value.starts_at, campaign.value.ends_at].filter(Boolean).map(formatDate)
  return values.join(' — ') || '时间待更新'
})
const locationText = computed(() => {
  if (!campaign.value) return '地点待定'
  const values = [campaign.value.city, campaign.value.location].filter(Boolean).map(String)
  return [...new Set(values)].join(' · ') || '地点待定'
})
const canJoin = computed(() => Boolean(campaign.value && !ended.value && validSignup(campaign.value.signup_url)))
const actionText = computed(() => canJoin.value ? '复制报名链接' : ended.value ? '活动已结束' : '报名方式待补充')
const signupDescription = computed(() => {
  if (ended.value) return '活动已结束，暂不接受新的报名。'
  if (canJoin.value) return '点击下方按钮复制报名链接，再按主办方要求完成报名。'
  return '主办方暂未补充报名链接，请留意后续通知或联系活动主办方。'
})

function handleSignup() {
  if (!campaign.value || ended.value) return
  if (!canJoin.value) {
    return uni.showModal({ title: '报名说明', content: '主办方暂未补充报名链接，请留意后续通知。', showCancel: false, confirmText: '知道了' })
  }
  uni.setClipboardData({
    data: campaign.value.signup_url,
    success: () => uni.showToast({ title: '报名链接已复制，请在浏览器打开', icon: 'none' })
  })
}

onLoad(async (query = {}) => {
  campaignId.value = String(query.id || '').trim()
  await reload()
})
</script>

<style scoped>
.campaign-detail-page { box-sizing: border-box; min-height: 100vh; padding: 0 24px calc(76px + env(safe-area-inset-bottom)); background: var(--page-bg, #f6f2ea); color: var(--ink, #17232d); font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.detail-content { width: 100%; max-width: 880px; margin: 0 auto; padding-top: 20px; }
.detail-header { padding-bottom: 24px; border-bottom: 1px solid var(--line, rgba(23, 35, 45, .13)); }
.detail-kicker-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.eyebrow { color: var(--accent, #b49460); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: .12em; }
.status-badge { padding: 4px 9px; border: 1px solid var(--brand, #5a2530); border-radius: 3px; color: var(--brand, #5a2530); font-size: 11px; }
.detail-title { display: block; margin-top: 22px; color: var(--ink, #17232d); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', Georgia, serif; font-size: 32px; font-weight: 400; letter-spacing: -.035em; line-height: 1.3; overflow-wrap: anywhere; }
.detail-subtitle { display: block; margin-top: 10px; color: var(--ink-muted, #968f83); font-size: 13px; }
.detail-cover { display: block; width: 100%; height: 340px; margin-top: 24px; border-radius: 5px; background: var(--surface-muted, #eee7da); }
.detail-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 28px; padding: 22px 0; border-bottom: 1px solid var(--line, rgba(23, 35, 45, .13)); }
.fact-item { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.fact-label { color: var(--ink-muted, #968f83); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: .04em; }
.fact-value { color: var(--ink-soft, #626b6d); font-size: 14px; line-height: 1.55; overflow-wrap: anywhere; }
.detail-section { padding: 24px 0; border-bottom: 1px solid var(--line-soft, rgba(23, 35, 45, .075)); }
.section-heading { display: block; padding-left: 11px; border-left: 2px solid var(--accent, #b49460); color: var(--ink, #17232d); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', Georgia, serif; font-size: 21px; font-weight: 400; line-height: 1.3; }
.detail-copy { display: block; margin-top: 13px; color: var(--ink-soft, #626b6d); white-space: pre-wrap; overflow-wrap: anywhere; font-size: 15px; line-height: 1.85; }
.action-button { width: 100%; margin: 26px 0 0; padding: 10px 18px; border-radius: 4px; background: var(--brand, #5a2530); color: var(--surface, #fcfaf5); font-size: 14px; line-height: 1.5; }
.action-button::after { border: 0; }
.action-button[disabled] { background: var(--ink-muted, #968f83); color: var(--surface, #fcfaf5); opacity: .72; }
.detail-state { display: flex; min-height: 70vh; align-items: center; justify-content: center; flex-direction: column; gap: 12px; color: var(--ink-muted, #968f83); font-size: 14px; text-align: center; }
.detail-error { color: var(--brand, #5a2530); }
.detail-state-action { color: var(--accent, #b49460); font-size: 12px; }
@media (max-width: 540px) {
  .campaign-detail-page { padding-right: 16px; padding-left: 16px; }
  .detail-content { padding-top: 14px; }
  .detail-title { font-size: 27px; }
  .detail-cover { height: 230px; margin-top: 18px; }
  .detail-facts { grid-template-columns: 1fr; gap: 14px; padding: 18px 0; }
  .detail-section { padding: 20px 0; }
  .detail-copy { font-size: 14px; }
}
</style>
