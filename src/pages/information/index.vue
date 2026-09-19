<template>
  <view class="information-page" :style="a11yStyle">
    <view class="news-half">
      <view class="news-header"><view class="news-header-main"><text class="page-title">资讯</text><button class="refresh-button" :disabled="loading" @tap="load">{{ loading ? '更新中' : '刷新' }}</button></view><text class="today">{{ today }}</text><text class="news-subtitle">行业快讯 · 活动信息</text></view>
      <view class="news-panel">
        <view class="section-heading"><text class="section-title">行业快讯速览</text><text class="section-count">{{ news.length }} 条快讯</text></view>
        <view v-if="loading && !news.length" class="empty-state">正在加载快讯…</view>
        <view v-else-if="newsError" class="empty-state"><text>快讯暂时加载失败</text><button @tap="load">重新加载</button></view>
        <scroll-view v-else-if="news.length" scroll-y class="news-feed">
          <button v-for="item in news" :key="item.id" class="news-item" @tap="openNews(item)">
            <view class="news-meta"><text>{{ newsTime(item.published_at) }}</text><text>{{ item.source_name || '平台编辑' }}</text></view>
            <text class="news-title">{{ item.title }}</text><text v-if="item.summary" class="news-summary">{{ item.summary }}</text>
          </button>
        </scroll-view>
        <view v-else class="empty-state"><text>暂无已发布的行业快讯</text><text class="empty-hint">新内容发布后将在这里更新。</text></view>
      </view>
    </view>

    <view class="activities-half">
      <view class="section-heading"><text class="section-title">活动</text><text class="section-count">{{ activities.length }} 项</text></view>
      <view v-if="loading && !activities.length" class="empty-state">正在加载活动…</view>
      <view v-else-if="activityError" class="empty-state"><text>活动暂时加载失败</text><button @tap="load">重新加载</button></view>
      <view v-else-if="!activities.length" class="empty-state">暂无开放活动，敬请关注后续更新。</view>
      <view v-else class="activity-list">
        <view v-for="item in activities" :key="item.id || item._id" class="activity-card">
          <view v-if="validImage(item.cover)" class="activity-cover" @tap="openActivity(item)"><image :src="item.cover" mode="aspectFill" /><text class="activity-badge">{{ item.ended ? '已结束' : item.tag || '开放中' }}</text></view>
          <view class="activity-copy"><text class="activity-title" @tap="openActivity(item)">{{ item.title }}</text><text class="activity-desc">{{ item.desc || item.subtitle }}</text><view class="activity-bottom"><view class="activity-meta"><text class="activity-category">{{ item.category || item.tag || '平台活动' }} · {{ item.tag || '活动' }}</text><text>{{ item.end || '时间以活动说明为准' }}{{ item.city ? ' · ' + item.city : '' }}</text><text v-if="item.registration_count != null">已有 {{ item.registration_count }} 人报名</text></view><button class="join-button" @tap="openActivity(item)">{{ !item.ended && !item.started && (item.group_id || validSignup(item.signup_url)) ? '立即参与' : '查看详情' }}</button></view></view>
        </view>
      </view>
    </view>

    <view v-if="selectedNews" class="detail-overlay" @tap="closeNews"><view class="news-detail" @tap.stop><view class="section-heading"><text class="section-title">快讯详情</text><button class="close-button" @tap="closeNews">关闭</button></view><scroll-view scroll-y class="detail-scroll"><text class="detail-title">{{ selectedNews.title }}</text><text class="news-meta">{{ selectedNews.source_name || '平台编辑' }} · {{ newsTime(selectedNews.published_at) }}</text><text class="detail-body">{{ selectedNews.content || selectedNews.summary }}</text></scroll-view><button v-if="hasSourceUrl" class="source-button" @tap="copySource">复制原文链接</button></view></view>
  </view>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
const loading = ref(false)
const news = ref([])
const activities = ref([])
const newsError = ref(false)
const activityError = ref(false)
const selectedNews = ref(null)
const today = ref('')
const hasSourceUrl = computed(() => /^https?:\/\//i.test(selectedNews.value?.source_url || ''))
const asList = (value) => Array.isArray(value) ? value : Array.isArray(value?.list) ? value.list : []
async function load() {
  if (loading.value) return
  loading.value = true
  const now = new Date()
  today.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]}`
  const [newsResult, activityResult] = await Promise.allSettled([bridge.information.news(), bridge.information.activities()])
  newsError.value = newsResult.status === 'rejected'
  activityError.value = activityResult.status === 'rejected'
  if (!newsError.value) news.value = asList(newsResult.value)
  if (!activityError.value) activities.value = asList(activityResult.value).filter(item => item.status !== 'disabled')
  loading.value = false
}
function newsTime(value) {
  if (!value) return '时间待更新'
  const normalized = String(value).trim().replace(' ', 'T')
  const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : normalized + 'Z')
  if (Number.isNaN(date.getTime())) return '时间待更新'
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
function validImage(url) { return /^(https?:\/\/|\/(?!\/))/i.test(String(url || '')) }
function validSignup(url) { return /^https:\/\/[^\s]+$/i.test(String(url || '')) }
function openNews(item) { selectedNews.value = item }
function closeNews() { selectedNews.value = null }
function copySource() { if (hasSourceUrl.value) uni.setClipboardData({ data: selectedNews.value.source_url }) }
function openActivity(item) {
  const activityId = String(item.id || item._id || '').trim()
  if (item.group_id) return uni.navigateTo({ url: `/pages/network/detail?id=${encodeURIComponent(item.group_id)}${activityId ? `&event_id=${encodeURIComponent(activityId)}` : ''}` })
  if (activityId) return uni.navigateTo({ url: `/pages/campaign/detail?id=${encodeURIComponent(activityId)}` })
  const canJoin = !item.ended && validSignup(item.signup_url)
  uni.showModal({ title: item.title, content: `${item.desc || '请查看活动说明'}\n${item.end || ''} ${item.city || ''}${item.ended ? '\n活动已结束' : !canJoin ? '\n报名方式待主办方补充' : ''}`, confirmText: canJoin ? '复制报名链接' : '知道了', showCancel: canJoin, success: ({ confirm }) => {
    if (confirm && canJoin) uni.setClipboardData({ data: item.signup_url, success: () => uni.showToast({ title: '报名链接已复制，请在浏览器打开', icon: 'none' }) })
  } })
}
onMounted(load)
</script>

<style scoped>
/* 资讯页和首页、人脉页共用同一套安静的米白底、深酒红行动色和细边框。 */
.information-page { box-sizing: border-box; min-height: 100vh; padding: 0 24px calc(76px + env(safe-area-inset-bottom)); background: var(--page-bg, #f6f2ea); color: var(--ink, #17232d); font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.news-half, .activities-half { width: 100%; max-width: 1040px; margin-right: auto; margin-left: auto; }
.news-half { min-height: 46vh; padding-top: 18px; }
.news-header { padding: 0 0 20px; border-bottom: 1px solid var(--line, rgba(23, 35, 45, .13)); background: transparent; color: var(--ink, #17232d); }
.news-header-main { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.page-title { color: var(--ink, #17232d); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', Georgia, serif; font-size: 30px; font-weight: 400; letter-spacing: -.04em; }
.refresh-button { flex: 0 0 auto; margin: 0; padding: 5px 13px; border: 1px solid var(--line, rgba(23, 35, 45, .13)); border-radius: 4px; background: var(--surface, #fcfaf5); color: var(--brand, #5a2530); font-size: 13px; line-height: 1.5; }
.refresh-button::after, .news-item::after, .join-button::after, .close-button::after, .source-button::after, .empty-state button::after { border: 0; }
.today { display: block; margin-top: 16px; color: var(--ink-soft, #626b6d); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; letter-spacing: .03em; }
.news-subtitle { display: block; margin-top: 5px; color: var(--ink-muted, #968f83); font-size: 13px; }
.news-panel { box-sizing: border-box; position: relative; margin: 0; padding: 24px 0 0; border-radius: 0; background: transparent; box-shadow: none; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.section-title { padding-left: 11px; border-left: 2px solid var(--accent, #b49460); color: var(--ink, #17232d); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', Georgia, serif; font-size: 22px; font-weight: 400; letter-spacing: -.025em; line-height: 1.25; }
.section-count { color: var(--ink-muted, #968f83); font-size: 12px; white-space: nowrap; }
.news-feed { height: 240px; max-height: 30vh; }
.news-item { display: block; width: 100%; margin: 0; padding: 14px 0; border-bottom: 1px solid var(--line-soft, rgba(23, 35, 45, .075)); border-radius: 0; background: transparent; text-align: left; line-height: 1.6; }
.news-item:active { opacity: .7; }
.news-meta { display: flex; flex-wrap: wrap; gap: 12px; color: var(--ink-muted, #968f83); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: .02em; }
.news-title { display: block; margin-top: 6px; color: var(--ink, #17232d); font-size: 16px; font-weight: 500; line-height: 1.5; }
.news-summary { display: block; margin-top: 5px; color: var(--ink-soft, #626b6d); font-size: 13px; line-height: 1.55; }
.activities-half { margin-top: 30px; padding-top: 24px; border-top: 1px solid var(--line, rgba(23, 35, 45, .13)); }
.activity-list { display: flex; flex-direction: column; gap: 10px; }
.activity-card { display: flex; gap: 18px; min-width: 0; padding: 16px; border: 1px solid var(--line-soft, rgba(23, 35, 45, .075)); border-radius: 6px; background: var(--surface, #fcfaf5); }
.activity-card:active { opacity: .86; }
.activity-cover { position: relative; width: 180px; height: 140px; flex-shrink: 0; overflow: hidden; border-radius: 3px; background: var(--surface-muted, #eee7da); }
.activity-cover image { width: 100%; height: 100%; }
.activity-cover image.activity-icon { width: 50%; height: 50%; margin: 25%; }
.activity-badge { position: absolute; top: 0; left: 0; padding: 4px 8px; background: var(--brand, #5a2530); color: var(--surface, #fcfaf5); font-size: 11px; }
.activity-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.activity-title { color: var(--ink, #17232d); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', Georgia, serif; font-size: 18px; font-weight: 400; line-height: 1.45; overflow-wrap: anywhere; }
.activity-desc { margin-top: 6px; color: var(--ink-soft, #626b6d); font-size: 13px; line-height: 1.55; }
.activity-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 14px; }
.activity-meta { display: flex; min-width: 0; flex-direction: column; gap: 4px; color: var(--ink-muted, #968f83); font-size: 11px; line-height: 1.45; }
.activity-category { color: var(--brand, #5a2530); font-size: 12px; }
.join-button, .source-button { flex-shrink: 0; margin: 0; padding: 7px 16px; border-radius: 4px; background: var(--brand, #5a2530); color: var(--surface, #fcfaf5); font-size: 13px; line-height: 1.5; }
.join-button:active, .source-button:active { background: var(--brand-deep, #3e1922); }
.empty-state { display: flex; min-height: 160px; align-items: center; justify-content: center; flex-direction: column; gap: 12px; color: var(--ink-muted, #968f83); font-size: 14px; text-align: center; }
.empty-state button { padding: 5px 14px; border: 1px solid var(--line); border-radius: 4px; background: var(--surface); color: var(--brand); font-size: 13px; }
.empty-hint { font-size: 12px; }
.detail-overlay { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(23, 35, 45, .58); }
.news-detail { box-sizing: border-box; width: 100%; max-width: 680px; padding: 24px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface, #fcfaf5); }
.detail-scroll { height: 50vh; max-height: 60vh; }
.close-button { margin: 0; padding: 4px 12px; border: 1px solid var(--line); border-radius: 4px; background: transparent; color: var(--brand); font-size: 13px; }
.detail-title { display: block; margin: 12px 0; color: var(--ink); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', Georgia, serif; font-size: 22px; font-weight: 400; line-height: 1.5; }
.detail-body { display: block; padding: 20px 0; color: var(--ink-soft); white-space: pre-wrap; overflow-wrap: anywhere; font-size: 15px; line-height: 1.8; }
@media (max-width: 540px) {
  .information-page { padding-right: 16px; padding-left: 16px; }
  .news-half { padding-top: 14px; }
  .page-title { font-size: 27px; }
  .section-title { font-size: 20px; }
  .news-feed { height: 220px; max-height: 30vh; }
  .activity-card { gap: 12px; padding: 12px; }
  .activity-cover { width: 104px; height: 132px; }
  .activity-title { font-size: 16px; }
  .activity-desc { font-size: 12px; }
  .activity-bottom { align-items: stretch; flex-direction: column; gap: 9px; padding-top: 10px; }
  .join-button { align-self: flex-start; padding: 6px 13px; font-size: 12px; }
  .activities-half { margin-top: 24px; padding-top: 20px; }
  .detail-overlay { padding: 12px; }
  .news-detail { padding: 18px; }
}
</style>
