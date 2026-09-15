<template>
  <view class="page" :style="a11yStyle">
    <view class="header">
      <text class="eyebrow">NETWORK DISCOVERY</text>
      <text class="title">认识新朋友</text>
      <text class="subtitle">先看看对方在做什么，再发一条说明来意的申请。</text>
    </view>

    <view class="search-box">
      <image src="/static/icons/search.svg" mode="aspectFit" />
      <input v-model="keyword" confirm-type="search" placeholder="搜索姓名、公司或业务方向" placeholder-class="placeholder" @confirm="reload" />
      <text v-if="keyword" class="clear" @tap="clearSearch">×</text>
      <view class="search-action" @tap="reload">搜索</view>
    </view>

    <view class="hint-card"><view class="hint-mark">◎</view><view><text class="hint-title">让认识有个由头</text><text class="hint-copy">在申请里写清楚来意，对方更容易决定是否通过。</text></view></view>

    <view v-if="loading" class="state"><view class="loading-dot" /><text>正在加载成员…</text></view>
    <view v-else-if="!people.length" class="empty"><image src="/static/icons/users.svg" mode="aspectFit" /><text class="empty-title">没有找到相关成员</text><text class="empty-desc">换个关键词，或先看看全部成员。</text><view class="empty-action" @tap="clearSearch">看全部成员 →</view></view>
    <view v-else class="people-list">
      <view v-for="(person, index) in people" :key="person.id" class="person-card" @tap="openProfile(person)">
        <view class="avatar" :style="{ background: avatarColors[index % avatarColors.length] }"><text>{{ initial(person.nickname) }}</text></view>
        <view class="person-copy"><view class="name-row"><text class="name">{{ person.nickname }}</text><text v-if="person.kind === 'provider'" class="verified">已认证</text></view><text class="meta">{{ person.company || '媒合智联成员' }}<text v-if="person.city"> · {{ person.city }}</text></text><text class="bio">{{ person.bio || person.title || '正在寻找长期合作伙伴' }}</text><view class="tags"><text v-if="person.title">{{ person.title }}</text><text>{{ person.followers || 0 }} 位关注</text></view></view>
        <view class="person-action" :class="{ pending: person.friend_status === 'pending_outgoing', friends: person.friend_status === 'friends' }" @tap.stop="handleAction(person)"><text>{{ actionLabel(person) }}</text></view>
      </view>
    </view>
    <view v-if="hasMore" class="people-load-more" :class="{ disabled: loadingMore }" @tap="loadMore">
      <text>{{ loadingMore ? '正在加载…' : '加载更多成员' }}</text><text class="load-more-arrow">→</text>
    </view>
    <text v-else-if="people.length" class="people-list-end">已经看到全部成员</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { isAuthError, toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'

const keyword = ref('')
const people = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(false)
const reloadSequence = ref(0)
const avatarColors = ['linear-gradient(135deg,#5968D8,#8794F5)', 'linear-gradient(135deg,#E17662,#F5AA89)', 'linear-gradient(135deg,#2F9B82,#72C7A8)', 'linear-gradient(135deg,#C78934,#E5BA6D)', 'linear-gradient(135deg,#7A69C7,#AC99E5)']
const userStore = useUserStore()

onLoad((query) => { keyword.value = String(query?.keyword || '').trim(); reload() })
onShow(() => { if (people.value.length) reload() })

async function reload() {
  if (!(await requirePageLogin(userStore, '登录后才能认识新朋友'))) return
  const requestId = ++reloadSequence.value
  loading.value = true
  page.value = 1
  hasMore.value = false
  try {
    const result = await bridge.network.people({ keyword: keyword.value.trim(), page: 1, pageSize: 24 })
    if (requestId !== reloadSequence.value) return
    people.value = Array.isArray(result?.list) ? result.list : []
    hasMore.value = Boolean(result?.has_more ?? result?.hasMore)
  } catch (error) {
    if (requestId !== reloadSequence.value) return
    console.warn('[network/discover] load failed:', error)
    if (!isAuthError(error)) toastError('成员列表没打开，请稍后再试')
  } finally {
    if (requestId === reloadSequence.value) loading.value = false
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return
  const nextPage = page.value + 1
  const requestId = reloadSequence.value
  loadingMore.value = true
  try {
    const result = await bridge.network.people({ keyword: keyword.value.trim(), page: nextPage, pageSize: 24 })
    if (requestId !== reloadSequence.value) return
    const nextList = Array.isArray(result?.list) ? result.list : []
    const existingIds = new Set(people.value.map((item) => String(item?.id || item?._id || '')).filter(Boolean))
    const uniqueNextList = nextList.filter((item) => {
      const id = String(item?.id || item?._id || '')
      if (!id || existingIds.has(id)) return false
      existingIds.add(id)
      return true
    })
    people.value = [...people.value, ...uniqueNextList]
    page.value = nextPage
    hasMore.value = Boolean(result?.has_more ?? result?.hasMore)
  } catch (error) {
    if (requestId !== reloadSequence.value) return
    console.warn('[network/discover] load more failed:', error)
    if (!isAuthError(error)) toastError('更多成员暂时没加载出来，请再试一次')
  } finally {
    if (requestId === reloadSequence.value) loadingMore.value = false
  }
}

function clearSearch() { keyword.value = ''; reload() }
function initial(value) { return String(value || '人').slice(0, 1) }
function actionLabel(person) { return ({ friends: '已是好友', pending_outgoing: '申请中', pending_incoming: '查看申请', none: '加好友' }[person?.friend_status] || '查看主页') }
function openProfile(person) { if (person?.id) uni.navigateTo({ url: `/pages/profile/index?id=${encodeURIComponent(person.id)}` }) }
function handleAction(person) {
  if (!person?.id) return
  if (person.friend_status === 'none' && !person.can_connect) return openProfile(person)
  if (person.friend_status === 'friends') return uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(person.id)}&name=${encodeURIComponent(person.nickname || '')}` })
  if (person.friend_status === 'pending_incoming') return uni.navigateTo({ url: '/pages/network/friends' })
  if (person.friend_status === 'pending_outgoing') return uni.showToast({ title: '申请已发出，等对方回复', icon: 'none' })
  uni.navigateTo({ url: `/pages/network/add-friend?id=${encodeURIComponent(person.id)}` })
}
</script>

<style scoped lang="scss">
.page { min-height: 100vh; padding: 28rpx 24rpx 100rpx; color: #27334f; background: #f5f7fb; box-sizing: border-box; }
.header { margin-bottom: 22rpx; }.eyebrow { display: block; color: #a0aabd; font: 700 17rpx/1.2 monospace; letter-spacing: .08em; }.title { display: block; margin-top: 8rpx; color: #303b57; font-size: 42rpx; font-weight: 760; letter-spacing: -.05em; }.subtitle { display: block; margin-top: 8rpx; color: #8f9bb0; font-size: 21rpx; line-height: 1.5; }
.search-box { display: flex; align-items: center; height: 72rpx; padding: 0 15rpx 0 18rpx; border: 1rpx solid #e5e9f1; border-radius: 20rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(70,87,123,.04); }.search-box image { width: 31rpx; height: 31rpx; opacity: .7; }.search-box input { min-width: 0; flex: 1; margin: 0 10rpx; color: #3d4964; font-size: 22rpx; }.placeholder { color: #b1bac8; }.clear { padding: 4rpx 9rpx; color: #a0aabd; font-size: 28rpx; }.search-action { padding: 9rpx 13rpx; border-radius: 12rpx; color: #fff; background: #6573dc; font-size: 19rpx; }
.hint-card { display: flex; align-items: center; gap: 12rpx; margin: 16rpx 0; padding: 15rpx 17rpx; border: 1rpx solid #e1e5fa; border-radius: 18rpx; background: linear-gradient(135deg,#f2f4ff,#fff); }.hint-mark { display: flex; align-items: center; justify-content: center; width: 45rpx; height: 45rpx; border-radius: 15rpx; color: #6573dc; background: #e7eaff; font-size: 26rpx; }.hint-title,.hint-copy { display: block; }.hint-title { color: #5968c8; font-size: 20rpx; font-weight: 700; }.hint-copy { margin-top: 4rpx; color: #9ba6bd; font-size: 17rpx; }
.people-list { display: flex; flex-direction: column; gap: 12rpx; }.person-card { display: flex; align-items: center; gap: 13rpx; padding: 17rpx; border: 1rpx solid #e7ebf2; border-radius: 20rpx; background: #fff; }.avatar { display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; flex: 0 0 auto; border-radius: 22rpx; color: #fff; font-size: 30rpx; font-weight: 760; }.person-copy { min-width: 0; flex: 1; }.name-row { display: flex; align-items: center; gap: 7rpx; }.name { overflow: hidden; color: #3b4762; font-size: 25rpx; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }.verified { padding: 4rpx 7rpx; border-radius: 7rpx; color: #2f9b82; background: #e8f7f2; font-size: 15rpx; }.meta,.bio { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.meta { margin-top: 6rpx; color: #9aa5b7; font-size: 18rpx; }.bio { margin-top: 6rpx; color: #6f7b91; font-size: 18rpx; }.tags { display: flex; gap: 7rpx; margin-top: 8rpx; }.tags text { padding: 4rpx 7rpx; border-radius: 7rpx; color: #6573dc; background: #eef0ff; font-size: 15rpx; }.person-action { flex: 0 0 auto; padding: 10rpx 11rpx; border: 1rpx solid #b9c8f4; border-radius: 14rpx; color: #4964c8; background: #fff; font-size: 18rpx; }.person-action.pending,.person-action.friends { border-color: #e1e5eb; color: #7f8aa0; background: #f1f3f7; }
.people-load-more { display: flex; align-items: center; justify-content: center; gap: 9rpx; margin-top: 16rpx; padding: 17rpx; border: 1rpx solid #e5e8f3; border-radius: 16rpx; color: #6573dc; background: #fff; font-size: 20rpx; }.people-load-more.disabled { opacity: .55; }.load-more-arrow { font-size: 24rpx; }.people-list-end { display: block; margin-top: 18rpx; color: #adb6c5; font-size: 18rpx; text-align: center; }
.state,.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 360rpx; color: #9aa5b6; font-size: 20rpx; }.loading-dot { width: 26rpx; height: 26rpx; margin-bottom: 15rpx; border: 3rpx solid #dfe3fb; border-top-color: #6573dc; border-radius: 50%; animation: spin 1s linear infinite; }.empty image { width: 52rpx; height: 52rpx; margin-bottom: 15rpx; opacity: .5; }.empty-title { color: #59657e; font-size: 25rpx; font-weight: 700; }.empty-desc { margin-top: 7rpx; color: #a0aabd; font-size: 18rpx; }.empty-action { margin-top: 20rpx; padding: 12rpx 18rpx; border-radius: 15rpx; color: #6573dc; background: #eef0ff; font-size: 19rpx; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Overflow guard: keep the action button visible while names and company data shrink safely. */
.page,
.header,
.search-box,
.hint-card,
.hint-card > view:last-child,
.people-list,
.person-card,
.person-copy,
.name-row,
.tags,
.people-load-more { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.header .title,
.header .subtitle,
.hint-title,
.hint-copy,
.name,
.meta,
.bio,
.empty-title,
.empty-desc { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.hint-card > view:last-child,
.person-copy { flex: 1 1 auto; overflow: hidden; }
.hint-copy,
.name,
.meta,
.bio { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hint-mark,
.avatar,
.verified,
.person-action,
.clear,
.search-action,
.load-more-arrow { flex: 0 0 auto; }
.person-action,
.search-action { white-space: nowrap; }
.name-row,
.person-card,
.search-box,
.hint-card { gap: 10rpx; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .title { font-size: 36rpx; }
  .person-card { padding: 14rpx; }
  .avatar { width: 62rpx; height: 62rpx; border-radius: 18rpx; }
  .person-action { padding-right: 8rpx; padding-left: 8rpx; font-size: 17rpx; }
  .search-action { padding-right: 10rpx; padding-left: 10rpx; }
}
</style>
