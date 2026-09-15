<template>
  <view class="cooperation-page" :style="a11yStyle">
    <view class="cooperation-topbar">
      <view class="topbar-copy">
        <text class="topbar-eyebrow">PARTNERSHIP BOARD</text>
        <text class="topbar-title">合作生态</text>
      </view>
      <view class="topbar-action" @tap="goPublish()"><text>发起合作</text><text class="topbar-arrow">→</text></view>
    </view>

    <scroll-view class="cooperation-scroll" scroll-y>
      <view class="cooperation-content">
        <view class="cooperation-hero">
          <view class="hero-orbit hero-orbit-outer" />
          <view class="hero-orbit hero-orbit-inner" />
          <image class="hero-seal" src="/static/images/opening-seal.png" mode="aspectFit" />
          <view class="hero-copy">
            <text class="hero-eyebrow">MEDIA / MATCH · 01</text>
            <text class="hero-title">把资源写进合作，<text class="hero-title-accent">让关系真正发生。</text></text>
            <text class="hero-desc">金融、品牌、场景、健康、组织与项目合作，先从一个清晰的方向开始。</text>
          </view>
          <view class="hero-actions">
            <view class="hero-primary" @tap="goPublish()"><text>发布合作意向</text><text>→</text></view>
            <view class="hero-secondary" @tap="showNoticePanel = true"><text>查看说明</text><text>⌄</text></view>
          </view>
        </view>

        <view class="summary-strip">
          <view class="summary-item"><text class="summary-value">{{ summary.open || 0 }}</text><text class="summary-label">开放合作</text></view>
          <view class="summary-divider" />
          <view class="summary-item"><text class="summary-value">{{ summary.pending || 0 }}</text><text class="summary-label">待确认方向</text></view>
          <view class="summary-divider" />
          <view class="summary-item"><text class="summary-value">{{ summary.categories || 0 }}</text><text class="summary-label">合作板块</text></view>
        </view>

        <view class="filter-heading">
          <view><text class="section-eyebrow">THE OPEN CALL</text><text class="section-title">首批可直接对接方向</text></view>
          <text class="filter-count">{{ filteredItems.length }} 个{{ activeStatus === 'open' ? '开放方向' : '方向' }}</text>
        </view>
        <view class="intake-switch" aria-label="合作方向状态筛选">
          <text class="intake-chip" :class="{ active: activeStatus === 'open' }" @tap="activeStatus = 'open'">正在招募 {{ summary.open || 0 }}</text>
          <text class="intake-chip" :class="{ active: activeStatus === 'all' }" @tap="activeStatus = 'all'">全部方向 {{ summary.total || 0 }}</text>
        </view>
        <scroll-view class="category-scroll" scroll-x show-scrollbar="false">
          <view class="category-row">
            <text class="category-chip" :class="{ active: activeCategory === 'all' }" @tap="activeCategory = 'all'">全部</text>
            <text v-for="category in categories" :key="category.id" class="category-chip" :class="{ active: activeCategory === category.id }" @tap="activeCategory = category.id">{{ category.shortLabel || category.label }}</text>
          </view>
        </scroll-view>

        <view v-if="loadState === 'loading'" class="catalog-state">
          <view class="state-spinner" /><text>正在整理合作方向…</text>
        </view>
        <view v-else-if="loadState === 'error'" class="catalog-state catalog-error" @tap="reload">
          <text class="state-mark">!</text><text>合作目录暂时没有连上</text><text class="state-action">点击重试</text>
        </view>
        <view v-else-if="!filteredItems.length" class="catalog-state">
          <text class="state-mark">—</text><text>这个板块暂时没有正在招募的方向</text><text class="state-action" @tap="activeStatus = 'all'; activeCategory = 'all'">查看全部</text>
        </view>

        <view v-else class="catalog-groups">
          <view v-for="group in groupedItems" :key="group.id" class="catalog-group">
            <view class="group-heading">
              <view class="group-heading-copy"><text class="group-code">{{ group.code }}</text><text class="group-name">{{ group.label }}</text></view>
              <text class="group-count">{{ group.items.length }} 个方向</text>
            </view>
            <view class="opportunity-grid">
              <view v-for="entry in group.items" :key="entry.id" class="opportunity-card card-press" @tap="goPublish(entry)">
                <view class="opportunity-head">
                  <view class="opportunity-icon"><image :src="entry.icon" mode="aspectFit" /></view>
                  <view class="opportunity-status" :class="'status-' + entry.status"><text class="status-dot" />{{ entry.status_label }}</view>
                </view>
                <text class="opportunity-title">{{ entry.title }}</text>
                <text class="opportunity-summary">{{ entry.summary }}</text>
                <view class="tag-row">
                  <text v-for="tag in entry.tags.slice(0, 3)" :key="tag" class="entry-tag">{{ tag }}</text>
                </view>
                <view class="opportunity-foot">
                  <view class="location-line"><text class="location-mark">⌖</text><text>{{ entry.locations.join(' · ') }}</text></view>
                  <text class="opportunity-cta">{{ entry.status === 'open' ? '提交意向' : '补充线索' }} →</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="catalog-note">
          <view class="note-mark">i</view>
          <view class="note-copy"><text class="note-title">先提交方向，再由平台协助核验</text><text class="note-text">{{ notice }}</text></view>
        </view>
        <view class="catalog-foot">MEDIA / MATCH · PARTNERSHIP BOARD · 2026</view>
      </view>
    </scroll-view>

    <view v-if="showNoticePanel" class="notice-mask" @tap="showNoticePanel = false">
      <view class="notice-panel" @tap.stop>
        <view class="notice-panel-head"><view><text class="section-eyebrow">HOW IT WORKS</text><text class="notice-panel-title">合作方向说明</text></view><text class="notice-close" @tap="showNoticePanel = false">×</text></view>
        <view class="notice-step"><text class="step-no">01</text><view><text class="step-title">提交合作意向</text><text class="step-copy">选择一个方向，补充你能提供的资源、场地、机构或项目。</text></view></view>
        <view class="notice-step"><text class="step-no">02</text><view><text class="step-title">平台初步核验</text><text class="step-copy">运营会根据方向、资质与合作边界进行筛选和联系。</text></view></view>
        <view class="notice-step"><text class="step-no">03</text><view><text class="step-title">进入真实跟进</text><text class="step-copy">确认后再进入消息、需求和项目协作流程。</text></view></view>
        <text class="notice-disclaimer">{{ notice }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { DEFAULT_COOPERATION_STATUS, filterCooperationEntries, groupCooperationEntries } from '@/utils/cooperation-filter'
import { toastError } from '@/utils/feedback'
import { useNavTitle } from '@/hooks/useNavTitle'

useNavTitle('titles.cooperation')

const categories = ref([])
const entries = ref([])
const summary = ref({ total: 0, open: 0, pending: 0, categories: 0 })
const notice = ref('以下为合作方向与意向线索，正式合作以双方确认及协议为准。')
const activeCategory = ref('all')
const activeStatus = ref(DEFAULT_COOPERATION_STATUS)
const loadState = ref('loading')
const showNoticePanel = ref(false)

const filteredItems = computed(() => filterCooperationEntries(entries.value, {
  status: activeStatus.value,
  category: activeCategory.value
}))

const groupedItems = computed(() => groupCooperationEntries(categories.value, filteredItems.value))

async function reload() {
  loadState.value = 'loading'
  try {
    const result = await bridge.cooperation.catalog()
    categories.value = Array.isArray(result?.categories) ? result.categories : []
    entries.value = Array.isArray(result?.list) ? result.list : []
    summary.value = result?.summary || { total: entries.value.length, open: entries.value.filter((item) => item.status === 'open').length, pending: entries.value.filter((item) => item.status === 'pending').length, categories: categories.value.length }
    notice.value = result?.notice || notice.value
    loadState.value = 'ready'
  } catch (error) {
    loadState.value = 'error'
    console.warn('[cooperation] catalog load failed:', error)
    toastError('合作目录加载失败，请稍后重试')
  }
}

function goPublish(entry = null) {
  const title = entry ? `寻找「${entry.title}」合作伙伴` : '发布合作生态合作意向'
  const prompt = entry
    ? `合作方向：${entry.title}\n我可以提供的资源：\n希望的合作方式：\n补充信息：`
    : '我希望参与媒合智联的合作生态建设。\n合作方向：\n我可以提供的资源：\n希望的合作方式：\n补充信息：'
  const category = entry?.category_id === 'capital' ? 'cat_11' : entry?.category_id === 'health' ? 'cat_14' : entry?.category_id === 'project' ? 'cat_09' : 'cat_10'
  const query = `?cooperation_title=${encodeURIComponent(title)}&cooperation_prompt=${encodeURIComponent(prompt)}&cooperation_category=${encodeURIComponent(category)}`
  uni.navigateTo({ url: `/pages/demand/publish${query}` })
}

onMounted(reload)
</script>

<style scoped lang="scss">
.cooperation-page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow: hidden; color: #25231f; background: #f7f6f2; }
.cooperation-topbar { display: flex; align-items: flex-end; justify-content: space-between; flex: 0 0 auto; padding: 28rpx 32rpx 22rpx; border-bottom: 1rpx solid rgba(37, 35, 31, .1); }
.topbar-copy, .hero-copy, .group-heading-copy, .note-copy { min-width: 0; }
.topbar-eyebrow, .hero-eyebrow, .section-eyebrow { display: block; color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .14em; }
.topbar-title { display: block; margin-top: 6rpx; font-family: 'Songti SC', 'STSong', Georgia, serif; font-size: 38rpx; letter-spacing: .03em; line-height: 1.1; }
.topbar-action { display: flex; align-items: center; gap: 9rpx; flex: 0 0 auto; padding: 8rpx 0 4rpx 18rpx; color: #5c2828; font-size: 20rpx; }
.topbar-arrow, .hero-primary text:last-child, .opportunity-cta { font-size: 26rpx; }
.cooperation-scroll { flex: 1; min-height: 0; width: 100%; }
.cooperation-content { min-width: 0; padding: 28rpx 28rpx 54rpx; }
.cooperation-hero { position: relative; min-height: 390rpx; overflow: hidden; padding: 31rpx 28rpx 25rpx; border-radius: 7rpx; color: #f7f1e7; background: linear-gradient(132deg, #1e2526 0%, #2c3b38 55%, #66503d 100%); box-shadow: 0 20rpx 36rpx rgba(47, 43, 35, .16); }
.cooperation-hero::after { position: absolute; right: -90rpx; bottom: -170rpx; width: 410rpx; height: 410rpx; border: 1rpx solid rgba(222, 195, 151, .22); border-radius: 50%; content: ''; box-shadow: 0 0 0 32rpx rgba(222, 195, 151, .05), 0 0 0 69rpx rgba(222, 195, 151, .035); pointer-events: none; }
.hero-orbit { position: absolute; border: 1rpx solid rgba(225, 200, 157, .19); border-radius: 50%; transform: rotate(-23deg) scaleY(.48); pointer-events: none; }
.hero-orbit-outer { top: -50rpx; right: 20rpx; width: 230rpx; height: 230rpx; }
.hero-orbit-inner { top: 22rpx; right: 69rpx; width: 135rpx; height: 135rpx; border-color: rgba(255, 255, 255, .12); }
.hero-seal { position: absolute; top: 31rpx; right: 32rpx; z-index: 1; width: 68rpx; height: 68rpx; opacity: .7; filter: sepia(.22) saturate(.7) brightness(1.5); }
.hero-copy { position: relative; z-index: 2; max-width: 580rpx; }
.hero-eyebrow { color: #d7b77e; }
.hero-title { display: block; margin-top: 22rpx; font-family: 'Songti SC', 'STSong', Georgia, serif; font-size: 40rpx; letter-spacing: .02em; line-height: 1.25; }
.hero-title-accent { color: #d7b77e; }
.hero-desc { display: block; max-width: 530rpx; margin-top: 14rpx; color: rgba(247, 241, 231, .68); font-size: 21rpx; line-height: 1.65; }
.hero-actions { position: relative; z-index: 2; display: flex; align-items: center; gap: 12rpx; margin-top: 27rpx; }
.hero-primary, .hero-secondary { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; min-height: 65rpx; padding: 0 18rpx; border: 1rpx solid rgba(215, 183, 126, .65); font-size: 20rpx; }
.hero-primary { min-width: 216rpx; color: #2b2925; background: #d7b77e; }
.hero-secondary { min-width: 132rpx; border-color: rgba(247, 241, 231, .27); color: rgba(247, 241, 231, .82); background: rgba(255, 255, 255, .06); }
.summary-strip { display: flex; align-items: center; margin: 19rpx 0 35rpx; padding: 19rpx 0; border-top: 1rpx solid rgba(37, 35, 31, .1); border-bottom: 1rpx solid rgba(37, 35, 31, .1); }
.summary-item { display: flex; flex: 1; flex-direction: column; align-items: center; min-width: 0; }
.summary-value { color: #5c2828; font-family: Georgia, serif; font-size: 35rpx; line-height: 1; }
.summary-label { margin-top: 8rpx; color: #8a847b; font-size: 17rpx; }
.summary-divider { width: 1rpx; height: 43rpx; background: rgba(37, 35, 31, .12); }
.filter-heading, .group-heading, .opportunity-head, .opportunity-foot, .catalog-note, .notice-panel-head, .notice-step { display: flex; align-items: center; }
.filter-heading { justify-content: space-between; gap: 12rpx; }
.section-title { display: block; margin-top: 8rpx; font-family: 'Songti SC', 'STSong', Georgia, serif; font-size: 31rpx; letter-spacing: .02em; }
.filter-count, .group-count { flex: 0 0 auto; color: #8a847b; font-size: 17rpx; }
.intake-switch { display: flex; gap: 10rpx; margin-top: 18rpx; }
.intake-chip { padding: 10rpx 17rpx; border: 1rpx solid rgba(92, 40, 40, .2); border-radius: 2rpx; color: #725959; background: #fbf7ef; font-size: 19rpx; }
.intake-chip.active { border-color: #5c2828; color: #fffaf1; background: #5c2828; }
.category-scroll { width: 100%; margin: 12rpx 0 29rpx; white-space: nowrap; }
.category-row { display: inline-flex; gap: 9rpx; }
.category-chip { padding: 9rpx 17rpx; border: 1rpx solid rgba(37, 35, 31, .13); border-radius: 2rpx; color: #8a847b; background: rgba(255, 255, 255, .46); font-size: 19rpx; }
.category-chip.active { border-color: #5c2828; color: #fffaf1; background: #5c2828; }
.catalog-groups { display: flex; flex-direction: column; gap: 29rpx; }
.group-heading { justify-content: space-between; gap: 12rpx; margin-bottom: 13rpx; padding-bottom: 10rpx; border-bottom: 1rpx solid rgba(37, 35, 31, .1); }
.group-heading-copy { display: flex; align-items: baseline; gap: 11rpx; }
.group-code { color: #b49460; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .08em; }
.group-name { color: #4a2929; font-family: 'Songti SC', 'STSong', Georgia, serif; font-size: 25rpx; }
.opportunity-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12rpx; }
.opportunity-card { display: flex; flex-direction: column; min-width: 0; min-height: 310rpx; padding: 18rpx; border: 1rpx solid rgba(37, 35, 31, .12); border-radius: 5rpx; background: rgba(255, 255, 255, .62); }
.opportunity-card:active { border-color: rgba(92, 40, 40, .55); background: #fffaf1; }
.opportunity-head { justify-content: space-between; gap: 8rpx; }
.opportunity-icon { display: flex; align-items: center; justify-content: center; width: 53rpx; height: 53rpx; flex: 0 0 auto; border: 1rpx solid rgba(180, 148, 96, .35); border-radius: 50%; background: #f2eadb; }
.opportunity-icon image { display: block; width: 28rpx; height: 28rpx; opacity: .72; }
.opportunity-status { display: flex; align-items: center; gap: 6rpx; max-width: 145rpx; overflow: hidden; color: #5d7663; font-size: 16rpx; text-overflow: ellipsis; white-space: nowrap; }
.opportunity-status.status-pending { color: #9a7651; }
.status-dot { width: 7rpx; height: 7rpx; flex: 0 0 auto; border-radius: 50%; background: currentColor; }
.opportunity-title { display: block; margin-top: 17rpx; overflow: hidden; color: #2f2925; font-family: 'Songti SC', 'STSong', Georgia, serif; font-size: 26rpx; font-weight: 600; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.opportunity-summary { display: -webkit-box; min-height: 66rpx; margin-top: 9rpx; overflow: hidden; color: #7d766e; font-size: 19rpx; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.tag-row { display: flex; gap: 6rpx; min-width: 0; margin-top: 13rpx; overflow: hidden; white-space: nowrap; }
.entry-tag { max-width: 33%; overflow: hidden; padding: 4rpx 7rpx; color: #8a847b; background: #eee8df; font-size: 15rpx; text-overflow: ellipsis; white-space: nowrap; }
.opportunity-foot { justify-content: space-between; gap: 8rpx; min-width: 0; margin-top: auto; padding-top: 13rpx; border-top: 1rpx solid rgba(37, 35, 31, .09); }
.location-line { display: flex; align-items: center; min-width: 0; overflow: hidden; color: #958d83; font-size: 16rpx; text-overflow: ellipsis; white-space: nowrap; }
.location-line text:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.location-mark { margin-right: 4rpx; color: #b49460; font-size: 19rpx; }
.opportunity-cta { flex: 0 0 auto; color: #5c2828; font-size: 17rpx; white-space: nowrap; }
.catalog-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260rpx; border: 1rpx solid rgba(37, 35, 31, .1); color: #8a847b; background: rgba(255, 255, 255, .52); font-size: 20rpx; }
.state-spinner { width: 37rpx; height: 37rpx; margin-bottom: 14rpx; border: 2rpx solid #e5dac8; border-top-color: #5c2828; border-radius: 50%; animation: spin 1s linear infinite; }
.state-mark { margin-bottom: 5rpx; color: #b49460; font-family: Georgia, serif; font-size: 43rpx; line-height: 1; }
.state-action { margin-top: 9rpx; color: #5c2828; font-size: 18rpx; }
.catalog-error { color: #8d665c; }
.catalog-note { align-items: flex-start; gap: 12rpx; margin-top: 32rpx; padding: 17rpx; border: 1rpx solid #e3d5c0; background: #fbf5e9; }
.note-mark { display: flex; align-items: center; justify-content: center; width: 30rpx; height: 30rpx; flex: 0 0 auto; border: 1rpx solid #b49460; border-radius: 50%; color: #9a7949; font-family: Georgia, serif; font-size: 19rpx; }
.note-title, .note-text { display: block; }.note-title { color: #604b35; font-size: 20rpx; font-weight: 600; }.note-text { margin-top: 5rpx; color: #9b896e; font-size: 17rpx; line-height: 1.55; }
.catalog-foot { margin-top: 25rpx; color: #b1a99f; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13rpx; letter-spacing: .1em; text-align: center; }
.notice-mask { position: fixed; z-index: 20; inset: 0; display: flex; align-items: flex-end; justify-content: center; background: rgba(28, 24, 20, .35); }
.notice-panel { width: 100%; max-width: 720rpx; padding: 25rpx 28rpx calc(29rpx + env(safe-area-inset-bottom)); border-radius: 15rpx 15rpx 0 0; background: #f7f6f2; box-shadow: 0 -12rpx 30rpx rgba(25, 20, 15, .14); }
.notice-panel-head { justify-content: space-between; margin-bottom: 22rpx; }.notice-panel-title { display: block; margin-top: 7rpx; font-family: 'Songti SC', 'STSong', Georgia, serif; font-size: 30rpx; }.notice-close { padding: 0 5rpx; color: #8a847b; font-size: 37rpx; line-height: 1; }
.notice-step { align-items: flex-start; gap: 13rpx; padding: 14rpx 0; border-top: 1rpx solid rgba(37, 35, 31, .09); }.step-no { flex: 0 0 auto; color: #b49460; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; }.step-title, .step-copy { display: block; }.step-title { color: #4a2929; font-size: 21rpx; font-weight: 600; }.step-copy { margin-top: 4rpx; color: #8a847b; font-size: 18rpx; line-height: 1.55; }.notice-disclaimer { display: block; margin-top: 13rpx; padding-top: 13rpx; border-top: 1rpx solid rgba(37, 35, 31, .09); color: #9b896e; font-size: 17rpx; line-height: 1.55; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 430px) {
  .cooperation-content { padding-right: 20rpx; padding-left: 20rpx; }
  .cooperation-topbar { padding-right: 24rpx; padding-left: 24rpx; }
  .hero-title { font-size: 36rpx; }
  .opportunity-grid { grid-template-columns: minmax(0, 1fr); }
  .opportunity-card { min-height: 285rpx; }
}

@media (prefers-reduced-motion: reduce) {
  .state-spinner { animation: none; }
}
</style>
