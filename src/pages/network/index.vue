<template>
  <view class="page network-page" :style="a11yStyle">
    <view class="topbar">
      <view>
        <text class="eyebrow">RELATIONSHIP DIRECTORY</text>
        <text class="page-title">关系与社群</text>
      </view>
      <view class="topbar-actions">
        <view class="top-action" @tap="goCreate"><image src="/static/icons/plus.svg" mode="aspectFit" /><text>新建</text></view>
        <view class="top-action" @tap="goFriends"><image src="/static/icons/users.svg" mode="aspectFit" /><text>通讯录</text></view>
        <view class="top-action" @tap="goMessage"><image src="/static/icons/chat.svg" mode="aspectFit" /><text>消息</text></view>
      </view>
    </view>

    <scroll-view class="network-scroll" scroll-y>
      <view class="network-content">
    <view class="hero-card">
      <image class="hero-seal" src="/static/images/opening-seal.png" mode="aspectFit" />
      <view class="hero-copy">
        <text class="hero-label">NETWORK / 01</text>
        <text class="hero-title">从认识一个人开始，把项目继续往前推。</text>
        <text class="hero-desc">按行业、城市和合作方向认识具体的人，也可以加入资本、芯片、通信、医药健康、先进制造与商业航天等分会。</text>
      </view>
      <view class="search-box">
        <image class="search-icon" src="/static/icons/search.svg" mode="aspectFit" />
        <input v-model="keyword" class="search-input" confirm-type="search" placeholder="搜索人、社群、分会" placeholder-class="search-placeholder" @confirm="reload" />
        <view v-if="keyword" class="search-clear" @tap="clearSearch">×</view>
      </view>
      <view class="hero-stats">
        <view class="hero-stat" @tap="activeTab = 'people'"><text class="stat-num">{{ stats.following || 0 }}</text><text class="stat-label">我的关注</text></view>
        <view class="stat-line" />
        <view class="hero-stat" @tap="activeTab = 'groups'"><text class="stat-num">{{ stats.joined_groups ?? 0 }}</text><text class="stat-label">已加入社群</text></view>
        <view class="stat-line" />
        <view class="hero-stat" @tap="activeTab = 'groups'"><text class="stat-num">{{ stats.branches ?? 0 }}</text><text class="stat-label">已加入分会</text></view>
      </view>
    </view>

    <view class="main-tabs">
      <view class="main-tab" :class="{ active: activeTab === 'people' }" @tap="switchTab('people')">
        <text class="tab-index">01</text>
        <view><text class="tab-title">独立的人</text><text class="tab-desc">认识具体的人</text></view>
      </view>
      <view class="main-tab" :class="{ active: activeTab === 'groups' }" @tap="switchTab('groups')">
        <text class="tab-index">02</text>
        <view><text class="tab-title">群体的人</text><text class="tab-desc">加入社群与分会</text></view>
      </view>
    </view>

    <view v-if="activeTab === 'people'" class="content-section">
      <view class="section-heading">
        <view><text class="section-eyebrow">找人</text><text class="section-title">看看这些人</text></view>
        <text class="section-link" @tap="goFollow">我的关注 →</text>
      </view>
      <scroll-view class="chip-scroll" scroll-x show-scrollbar="false">
        <view class="chip-row">
          <text class="chip" :class="{ active: cityFilter === 'all' }" @tap="setCity('all')">全部</text>
          <text class="chip" :class="{ active: cityFilter === '上海' }" @tap="setCity('上海')">上海</text>
          <text class="chip" :class="{ active: cityFilter === '北京' }" @tap="setCity('北京')">北京</text>
          <text class="chip" :class="{ active: cityFilter === '深圳' }" @tap="setCity('深圳')">深圳</text>
          <text class="chip" :class="{ active: cityFilter === '杭州' }" @tap="setCity('杭州')">杭州</text>
        </view>
      </scroll-view>
      <scroll-view class="chip-scroll identity-filter-scroll" scroll-x show-scrollbar="false">
        <view class="chip-row">
          <text v-for="item in identityFilters" :key="item.value" class="chip" :class="{ active: identityFilter === item.value }" @tap="setIdentity(item.value)">{{ item.label }}</text>
        </view>
      </scroll-view>

      <view v-if="loading && !people.length" class="state-card"><view class="loading-dot" /><text>正在加载名单…</text></view>
      <view v-else-if="!loading && !people.length" class="state-card"><image src="/static/icons/users.svg" mode="aspectFit" /><text>暂时没有找到匹配的人</text><text class="state-action" @tap="clearSearch">清除筛选</text></view>
      <view v-if="loading && people.length" class="inline-refresh" aria-live="polite"><view class="loading-dot small" /><text>正在更新名单…</text></view>
      <view v-if="people.length" class="people-list">
        <view class="person-card card-press" v-for="(person, index) in people" :key="person.id" @tap="goProfile(person.id)">
          <view class="person-top">
            <view class="person-avatar" :style="{ background: avatarColors[index % avatarColors.length] }"><image v-if="person.avatar" class="person-avatar-image" :src="person.avatar" mode="aspectFill" /><text v-else>{{ getInitial(person.nickname) }}</text></view>
            <view class="person-main">
              <view class="person-name-line"><text class="person-name">{{ person.nickname }}</text><text v-if="person.kind === 'provider'" class="verified-label">已认证</text></view>
              <text class="person-company">{{ person.company || '媒合智联成员' }}<text v-if="person.city"> · {{ person.city }}</text></text>
            </view>
            <view class="follow-button" :class="{ following: person.followed, busy: followBusyId === String(person.id) }" @tap.stop="toggleFollow(person)">
              <text>{{ followBusyId === String(person.id) ? '处理中…' : (person.followed ? '已关注' : '+ 关注') }}</text>
            </view>
          </view>
          <text class="person-bio">{{ person.bio || person.title || '正在找合作伙伴' }}</text>
          <view class="person-bottom">
            <view class="person-tags"><text v-if="person.identity_label" class="identity-tag">{{ person.identity_label }}</text><text v-if="person.title">{{ person.title }}</text><text>{{ formatCount(person.followers) }} 位关注</text></view>
            <view class="person-links">
              <text v-if="person.friend_status === 'friends'" class="person-link message" @tap.stop="openChat(person)">发消息</text>
              <text v-else-if="person.friend_status === 'pending_outgoing'" class="person-link pending">申请中</text>
              <text v-else-if="person.friend_status === 'pending_incoming'" class="person-link pending" @tap.stop="goFriends">待处理</text>
              <text v-else-if="person.can_connect" class="person-link" @tap.stop="goAddFriend(person)">加好友</text>
              <text class="card-arrow">→</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="peopleHasMore" class="people-load-more" :class="{ disabled: peopleLoadingMore }" @tap="loadMorePeople">
        <text>{{ peopleLoadingMore ? '正在加载…' : '加载更多成员' }}</text><text class="load-more-arrow">→</text>
      </view>
      <text v-else-if="people.length" class="people-list-end">已经看到全部成员</text>
    </view>

    <view v-else class="content-section">
      <view class="section-heading">
        <view><text class="section-eyebrow">INDUSTRY CHAPTERS</text><text class="section-title">按行业进入分会</text></view>
        <text class="section-link" @tap="goJoinedGroups">已加入 {{ stats.joined_groups ?? 0 }} 个 →</text>
      </view>
      <scroll-view class="industry-scroll" scroll-x show-scrollbar="false">
        <view class="industry-row">
          <view v-for="item in industryFilters" :key="item.value" class="industry-chip" :class="{ active: industryFilter === item.value }" @tap="setIndustryFilter(item.value)">
            <text class="industry-code">{{ item.code }}</text><text>{{ item.label }}</text>
          </view>
        </view>
      </scroll-view>
      <scroll-view class="chip-scroll" scroll-x show-scrollbar="false">
        <view class="chip-row">
          <text class="chip" :class="{ active: groupFilter === 'all' }" @tap="setGroupFilter('all')">全部</text>
          <text class="chip" :class="{ active: joinedOnly }" @tap="setJoinedFilter">已加入</text>
          <text class="chip" :class="{ active: groupFilter === 'circle' }" @tap="setGroupFilter('circle')">人脉圈</text>
          <text class="chip" :class="{ active: groupFilter === 'community' }" @tap="setGroupFilter('community')">社群</text>
          <text class="chip" :class="{ active: groupFilter === 'branch' }" @tap="setGroupFilter('branch')">分会</text>
          <text class="chip chip-outline" @tap="setActiveSort">{{ sortActive ? '活跃优先' : '综合排序' }}⌄</text>
        </view>
      </scroll-view>

      <view v-if="loading && !groups.length" class="state-card"><view class="loading-dot" /><text>正在加载社群…</text></view>
      <view v-else-if="!loading && !groups.length" class="state-card"><image src="/static/icons/users.svg" mode="aspectFit" /><text>暂时没有找到匹配的社群</text><text class="state-action" @tap="clearSearch">清除筛选</text></view>
      <view v-if="loading && groups.length" class="inline-refresh" aria-live="polite"><view class="loading-dot small" /><text>正在更新社群…</text></view>
      <view v-if="groups.length" class="group-grid">
        <view class="group-card card-press" v-for="(group, index) in groups" :key="group._id || group.id" @tap="goGroup(group._id || group.id)">
          <view class="group-cover" :style="groupCoverStyle(group, index)">
            <view class="cover-top"><text>{{ groupTypeLabel(group.group_type || group.type) }}</text><text class="cover-index">0{{ index + 1 }}</text></view>
            <image class="cover-icon" src="/static/icons/users.svg" mode="aspectFit" />
            <text class="cover-short">{{ groupShortName(group) }}</text>
            <view class="cover-activity"><view class="activity-pulse" /><text>{{ formatCount(group.active_member_count ?? group.member_count ?? group.memberCount) }} 位成员</text></view>
          </view>
          <view class="group-body">
            <view class="group-title-line"><text class="group-name">{{ group.name }}</text><text v-if="group.joined" class="joined-badge">已加入</text></view>
            <text class="group-desc">{{ group.description }}</text>
            <view class="group-meta"><view class="meta-item"><image src="/static/icons/users.svg" mode="aspectFit" /><text>{{ formatCount(group.active_member_count ?? group.member_count ?? group.memberCount) }} 人</text></view><text class="meta-dot">·</text><text>{{ group.branch_count ?? group.branchCount ?? 0 }} 个分会</text><text class="meta-dot">·</text><text>{{ formatCount(group.activity_count ?? group.activityCount ?? 0) }} 动态</text></view>
            <view class="group-action" :class="{ joined: group.joined, pending: joiningId === (group._id || group.id) || group.join_pending }" @tap.stop="joinOrOpen(group)"><text>{{ joiningId === (group._id || group.id) ? '加入中…' : (group.join_pending ? '申请中' : (group.joined ? '进入社群' : '加入社群')) }}</text><text>→</text></view>
          </view>
        </view>
      </view>

      <view class="interaction-note">
        <view class="note-icon"><image src="/static/icons/chat.svg" mode="aspectFit" /></view>
        <view class="note-copy"><text class="note-title">加入社群，先从一次发言开始</text><text class="note-desc">可以发动态、找伙伴，也可以报名分会活动</text></view>
        <text class="note-arrow">→</text>
      </view>
    </view>

    <view style="height: 48rpx;" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.network')

const activeTab = ref('people')
const groupFilter = ref('all')
const industryFilter = ref('all')
const cityFilter = ref('all')
const identityFilter = ref('all')
const keyword = ref('')
const sortActive = ref(false)
const joinedOnly = ref(false)
const joiningId = ref('')
const loading = ref(false)
const peoplePage = ref(1)
const peopleHasMore = ref(false)
const peopleLoadingMore = ref(false)
const people = ref([])
const groups = ref([])
const stats = ref({ following: 0, joined_groups: 0, branches: 0 })
const followBusyIds = new Set()
const followBusyId = ref('')
let reloadSequence = 0
let reloadTimer = null
let reloadInFlight = false
let reloadPending = false
let lastShownAt = 0
let lastOverviewAt = 0
const userStore = useUserStore()

const avatarColors = [
  'linear-gradient(135deg, #5968D8, #8794F5)',
  'linear-gradient(135deg, #E17662, #F5AA89)',
  'linear-gradient(135deg, #2F9B82, #72C7A8)',
  'linear-gradient(135deg, #C78934, #E5BA6D)',
  'linear-gradient(135deg, #7A69C7, #AC99E5)'
]
const coverPalettes = [
  'linear-gradient(135deg, #35484A 0%, #5F7C6C 100%)',
  'linear-gradient(135deg, #875949 0%, #C88768 100%)',
  'linear-gradient(135deg, #66724E 0%, #A4AF70 100%)',
  'linear-gradient(135deg, #8C673C 0%, #C9A25D 100%)',
  'linear-gradient(135deg, #4E6670 0%, #78959A 100%)'
]
const industryFilters = [
  { value: 'all', code: '00', label: '全部行业' },
  { value: '品牌传播', code: '01', label: '市场与品牌' },
  { value: '投融资与资本', code: '02', label: '产业资本' },
  { value: '半导体与芯片', code: '03', label: '半导体芯片' },
  { value: '5G/6G与通信', code: '04', label: '5G/6G通信' },
  { value: '医药大健康', code: '05', label: '医药大健康' },
  { value: '先进制造', code: '06', label: '先进制造' },
  { value: '量子科技', code: '07', label: '量子科技' },
  { value: '商业航天', code: '08', label: '商业航天' }
]
const identityFilters = [
  { value: 'all', label: '全部身份' },
  { value: 'demand_owner', label: '甲方·需求方' },
  { value: 'service_provider', label: '乙方·服务方' },
  { value: 'capital', label: '资金方' },
  { value: 'project', label: '项目方' }
]

const currentPeopleParams = computed(() => ({
  keyword: keyword.value,
  city: cityFilter.value === 'all' ? '' : cityFilter.value,
  identity: identityFilter.value === 'all' ? '' : identityFilter.value,
  page: peoplePage.value,
  pageSize: 24
}))

async function reload() {
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = null
  if (reloadInFlight) {
    reloadPending = true
    return
  }
  reloadInFlight = true
  if (!(await requirePageLogin(userStore, '登录后才能查看人脉圈'))) {
    reloadInFlight = false
    return
  }
  const requestId = ++reloadSequence
  const requestedTab = activeTab.value
  loading.value = true
  peoplePage.value = 1
  peopleHasMore.value = false
  try {
    const overviewRequest = Date.now() - lastOverviewAt > 30000
      ? bridge.network.overview()
      : Promise.resolve({ stats: stats.value })
    const peopleRequest = requestedTab === 'people'
      ? bridge.network.people(currentPeopleParams.value)
      : Promise.resolve(null)
    const groupsRequest = requestedTab === 'groups'
      ? bridge.network.groups({ keyword: keyword.value, type: groupFilter.value, industry: industryFilter.value === 'all' ? '' : industryFilter.value, joined: joinedOnly.value ? 1 : '', sort: sortActive.value ? 'active' : 'default' })
      : Promise.resolve(null)
    const [overview, peopleResult, groupsResult] = await Promise.all([overviewRequest, peopleRequest, groupsRequest])
    if (requestId !== reloadSequence) return
    stats.value = overview?.stats || stats.value
    if (overview?.stats) lastOverviewAt = Date.now()
    if (requestedTab === 'people') {
      people.value = Array.isArray(peopleResult?.list) ? peopleResult.list : []
      peopleHasMore.value = Boolean(peopleResult?.has_more ?? peopleResult?.hasMore)
    } else {
      groups.value = Array.isArray(groupsResult?.list) ? groupsResult.list : []
    }
  } catch (error) {
    if (requestId !== reloadSequence) return
    console.warn('[network] load failed:', error)
    toastError('人脉圈加载失败，请稍后重试')
  } finally {
    if (requestId === reloadSequence) loading.value = false
    reloadInFlight = false
    if (reloadPending) {
      reloadPending = false
      scheduleReload({ immediate: true })
    }
  }
}

function scheduleReload({ immediate = false } = {}) {
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = null
  if (immediate) {
    void reload()
    return
  }
  reloadTimer = setTimeout(() => {
    reloadTimer = null
    void reload()
  }, 160)
}

async function loadMorePeople() {
  if (loading.value || peopleLoadingMore.value || !peopleHasMore.value) return
  const nextPage = peoplePage.value + 1
  peopleLoadingMore.value = true
  try {
    const result = await bridge.network.people({ ...currentPeopleParams.value, page: nextPage })
    const nextList = Array.isArray(result?.list) ? result.list : []
    const existingIds = new Set(people.value.map((item) => String(item?.id || '')).filter(Boolean))
    const uniqueNextList = nextList.filter((item) => {
      const id = String(item?.id || '')
      if (!id || existingIds.has(id)) return false
      existingIds.add(id)
      return true
    })
    people.value = [...people.value, ...uniqueNextList]
    peoplePage.value = nextPage
    peopleHasMore.value = Boolean(result?.has_more ?? result?.hasMore)
  } catch (error) {
    console.warn('[network] load more people failed:', error)
    toastError('更多成员暂时没加载出来，请再试一次')
  } finally {
    peopleLoadingMore.value = false
  }
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'groups' && !groups.value.length) scheduleReload({ immediate: true })
}
function setCity(city) { cityFilter.value = city; scheduleReload() }
function setIdentity(identity) { identityFilter.value = identity; scheduleReload() }
function setGroupFilter(type) { groupFilter.value = type; joinedOnly.value = false; activeTab.value = 'groups'; scheduleReload() }
function setIndustryFilter(industry) { industryFilter.value = industry; joinedOnly.value = false; activeTab.value = 'groups'; scheduleReload() }
function setJoinedFilter() { joinedOnly.value = !joinedOnly.value; groupFilter.value = 'all'; activeTab.value = 'groups'; scheduleReload() }
function setActiveSort() { sortActive.value = !sortActive.value; scheduleReload() }
function clearSearch() { keyword.value = ''; cityFilter.value = 'all'; identityFilter.value = 'all'; groupFilter.value = 'all'; joinedOnly.value = false; scheduleReload() }
function getInitial(value) { return String(value || '人').trim().slice(0, 1) || '人' }
function formatCount(value) {
  const normalized = typeof value === 'string' ? value.replace(/[，,\s]/g, '') : value
  const count = Number(normalized)
  if (!Number.isFinite(count) || count <= 0) return '0'
  const compact = (number, unit) => `${number.toFixed(1).replace(/\.0$/, '')}${unit}`
  if (count >= 10000) return compact(count / 10000, '万')
  if (count >= 1000) return compact(count / 1000, '千')
  return String(Math.floor(count))
}
function groupTypeLabel(type) { return ({ circle: '人脉圈', community: '社群', branch: '分会' })[type] || '社群' }
function groupShortName(group) {
  const shortName = String(group?.short_name || '').trim()
  return ({
    'FOUNDER CIRCLE': '创始人圈',
    'CONTROLLER BRANCH': '实控人分会',
    'GROWTH COMMUNITY': '增长同业',
    'BRAND BRANCH': '市场与品牌',
    'PRIVATE DOMAIN': '私域运营'
  })[shortName] || shortName || '社群'
}
function groupCoverStyle(group, index) {
  const seed = String(group?.id || group?._id || group?.name || index)
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return { background: coverPalettes[hash % coverPalettes.length] }
}

async function toggleFollow(person) {
  const id = String(person?.id || '')
  if (!id || followBusyIds.has(id)) return
  followBusyIds.add(id)
  followBusyId.value = id
  try {
    const result = await bridge.follow.toggle(id)
    person.followed = !!result?.followed
    stats.value.following = Math.max(0, Number(stats.value.following || 0) + (person.followed ? 1 : -1))
    uni.showToast({ title: person.followed ? '已关注' : '已取消关注', icon: 'none' })
  } catch {
    toastError('操作失败，请稍后重试')
  } finally {
    followBusyIds.delete(id)
    if (followBusyId.value === id) followBusyId.value = ''
  }
}

async function sendFriendRequest(person) {
  if (!person?.can_connect || person.friend_status === 'pending_outgoing') return
  try {
    await bridge.network.sendFriendRequest({
      target_user_id: person.id,
      message: `你好，我在媒合智联看到你的${person.title || '业务方向'}，方便认识一下吗？`
    })
    person.friend_status = 'pending_outgoing'
    person.friendStatus = 'pending_outgoing'
    uni.showToast({ title: '申请已发出', icon: 'none' })
  } catch {
    toastError('申请发送失败，请稍后重试')
  }
}

function goAddFriend(person) {
  if (!person?.id) return
  uni.navigateTo({ url: `/pages/network/add-friend?id=${encodeURIComponent(person.id)}` })
}

function joinOrOpen(group) {
  if (group.join_pending) return
  if (group.joined) return goGroup(group._id || group.id)
  joinGroup(group)
}
async function joinGroup(group) {
  const id = group._id || group.id
  if (joiningId.value) return
  joiningId.value = id
  try {
    const result = await bridge.network.joinGroup(id)
    group.joined = !!result?.joined
    group.join_pending = !!result?.pending
    if (result?.group) Object.assign(group, result.group)
    if (result?.joined) stats.value.joined_groups = Number(stats.value.joined_groups || 0) + 1
    uni.showToast({ title: result?.pending ? '申请已提交' : '已加入社群', icon: result?.pending ? 'none' : 'success' })
  } catch {
    toastError('加入失败，请稍后重试')
  } finally {
    joiningId.value = ''
  }
}

function goGroup(id) { uni.navigateTo({ url: `/pages/network/detail?id=${id}` }) }
function goProfile(id) { uni.navigateTo({ url: `/pages/profile/index?id=${id}` }) }
function goFollow() { uni.navigateTo({ url: '/pages/follow/index' }) }
function goFriends() { uni.navigateTo({ url: '/pages/network/friends' }) }
function openChat(person) {
  if (!person?.can_message && person?.friend_status !== 'friends') return
  uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(person.id)}&name=${encodeURIComponent(person.nickname || '')}` })
}
function goJoinedGroups() { joinedOnly.value = true; groupFilter.value = 'all'; activeTab.value = 'groups'; scheduleReload() }
function goMessage() { uni.navigateTo({ url: '/pages/message/index' }) }
function goCreate() { uni.navigateTo({ url: '/pages/network/create' }) }

onShow(() => {
  const now = Date.now()
  if (now - lastShownAt < 5000) return
  lastShownAt = now
  scheduleReload({ immediate: true })
})
onUnload(() => {
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = null
  reloadSequence += 1
})
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow: hidden; color: #27334f; background: #f5f7fb; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.topbar { position: relative; z-index: 3; display: flex; flex: 0 0 auto; justify-content: space-between; align-items: flex-end; padding: 24rpx 24rpx 18rpx; background: #f5f7fb; }
.topbar > view:first-child { min-width: 0; flex: 1; overflow: hidden; }
.network-scroll { flex: 1; min-height: 0; }
.network-content { padding: 0 24rpx 120rpx; box-sizing: border-box; }
.eyebrow, .section-eyebrow { display: block; color: #a0aabd; font-family: monospace; font-size: 17rpx; font-weight: 700; letter-spacing: .1em; }
.page-title { display: block; margin-top: 7rpx; color: #303b57; font-size: 42rpx; font-weight: 760; letter-spacing: -.04em; }
.topbar-actions { display: flex; gap: 14rpx; }
.top-action { display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; border: 1rpx solid #e6eaf2; border-radius: 18rpx; background: #fff; }
.top-action image { display: block; width: 33rpx; height: 33rpx; flex: 0 0 33rpx; object-fit: contain; opacity: .78; }

.hero-card { position: relative; overflow: hidden; padding: 26rpx 24rpx 20rpx; border-radius: 28rpx; color: #fff; background: linear-gradient(135deg, #252e55 0%, #424a91 58%, #6d69c8 100%); box-shadow: 0 18rpx 34rpx rgba(55, 65, 140, .19); }
.hero-card::after { position: absolute; right: -100rpx; bottom: -160rpx; width: 390rpx; height: 390rpx; border: 1rpx solid rgba(255,255,255,.14); border-radius: 50%; content: ''; box-shadow: 0 0 0 35rpx rgba(255,255,255,.04), 0 0 0 74rpx rgba(255,255,255,.03); }
.hero-orb { position: absolute; border-radius: 50%; background: rgba(255,255,255,.08); }
.hero-orb-one { top: -70rpx; right: 60rpx; width: 190rpx; height: 190rpx; }
.hero-orb-two { top: 150rpx; right: 300rpx; width: 60rpx; height: 60rpx; background: rgba(255,184,132,.16); }
.hero-copy, .search-box, .hero-stats { position: relative; z-index: 1; }
.hero-label { display: flex; align-items: center; gap: 8rpx; color: #c8d0ff; font-size: 20rpx; }
.hero-label image { display: block; width: 30rpx; height: 30rpx; flex: 0 0 30rpx; object-fit: contain; filter: brightness(0) invert(1); opacity: .9; }
.hero-title { display: block; margin-top: 16rpx; color: #fff; font-size: 39rpx; font-weight: 760; letter-spacing: -.06em; line-height: 1.22; }
.hero-desc { display: block; margin-top: 9rpx; color: rgba(255,255,255,.65); font-size: 22rpx; line-height: 1.5; }
.search-box { display: flex; align-items: center; height: 72rpx; margin-top: 22rpx; padding: 0 18rpx; border: 1rpx solid rgba(255,255,255,.17); border-radius: 18rpx; background: rgba(13,19,51,.32); box-sizing: border-box; }
.search-icon { display: block; width: 34rpx; height: 34rpx; flex: 0 0 34rpx; margin-right: 12rpx; object-fit: contain; filter: brightness(0) invert(1); opacity: .82; }
.search-input { flex: 1; min-width: 0; color: #fff; font-size: 23rpx; }
.search-placeholder { color: rgba(255,255,255,.45); }
.search-clear { display: flex; align-items: center; justify-content: center; width: 34rpx; height: 34rpx; border-radius: 50%; color: #394170; background: rgba(255,255,255,.8); font-size: 28rpx; line-height: 1; }
.hero-stats { display: flex; align-items: center; margin-top: 22rpx; }
.hero-stat { display: flex; flex: 1; flex-direction: column; align-items: center; }
.stat-num { color: #fff; font-size: 30rpx; font-weight: 760; }
.stat-label { margin-top: 4rpx; color: rgba(255,255,255,.58); font-size: 19rpx; }
.stat-line { width: 1rpx; height: 38rpx; background: rgba(255,255,255,.18); }

.main-tabs { display: flex; gap: 12rpx; margin: 18rpx 0 24rpx; }
.main-tab { display: flex; align-items: center; flex: 1; gap: 12rpx; min-width: 0; padding: 15rpx 14rpx; border: 1rpx solid #e7ebf3; border-radius: 18rpx; background: #fff; box-sizing: border-box; transition: all .2s; }
.main-tab.active { border-color: rgba(89,104,216,.35); background: #f0f1ff; box-shadow: 0 8rpx 20rpx rgba(89,104,216,.09); }
.tab-mark { display: flex; align-items: center; justify-content: center; width: 56rpx; height: 56rpx; flex: 0 0 auto; border-radius: 16rpx; }
.tab-mark image { display: block; width: 32rpx; height: 32rpx; object-fit: contain; }
.tab-mark-people { background: #fff0ed; }.tab-mark-groups { background: #e9f7f2; }
.tab-title, .tab-desc { display: block; }.tab-title { color: #4c5872; font-size: 24rpx; font-weight: 750; }.tab-desc { margin-top: 4rpx; overflow: hidden; color: #a0aabd; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }
.content-section { min-width: 0; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 14rpx; }
.section-title { display: block; margin-top: 7rpx; color: #3b4864; font-size: 31rpx; font-weight: 760; letter-spacing: -.04em; }
.section-link { color: #6875d8; font-size: 20rpx; }
.chip-scroll { margin: 0 -24rpx 14rpx; padding: 0 24rpx; white-space: nowrap; }
.chip-row { display: inline-flex; gap: 10rpx; }
.chip { padding: 10rpx 22rpx; border: 1rpx solid #e7ebf3; border-radius: 23rpx; color: #8d99ac; background: #fff; font-size: 21rpx; }
.chip.active { border-color: #6976da; color: #5866d4; background: #eef0ff; font-weight: 700; }.chip-outline { color: #6573dc; }
.identity-filter-scroll { margin-bottom: 18rpx; }

.people-list { display: flex; flex-direction: column; gap: 12rpx; }
.person-card { padding: 20rpx; border: 1rpx solid #e8ebf2; border-radius: 20rpx; background: #fff; box-shadow: 0 8rpx 22rpx rgba(70,87,123,.035); }
.person-top { display: flex; align-items: center; }.person-avatar { display: flex; align-items: center; justify-content: center; width: 76rpx; height: 76rpx; margin-right: 15rpx; border-radius: 22rpx; color: #fff; flex: 0 0 auto; }.person-avatar text { font-size: 31rpx; font-weight: 760; }
.person-main { min-width: 0; flex: 1; }.person-name-line { display: flex; align-items: center; gap: 8rpx; }.person-name { overflow: hidden; color: #3a4662; font-size: 28rpx; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }.verified-label { padding: 4rpx 8rpx; border-radius: 7rpx; color: #2f9b82; background: #e8f7f2; font-size: 16rpx; white-space: nowrap; }.person-company { display: block; margin-top: 7rpx; overflow: hidden; color: #98a4b7; font-size: 20rpx; text-overflow: ellipsis; white-space: nowrap; }
.follow-button { padding: 11rpx 18rpx; border-radius: 20rpx; color: #fff; background: #6573dc; font-size: 20rpx; white-space: nowrap; }.follow-button.following { color: #7e8a9e; background: #f2f4f8; }
.person-bio { display: block; margin: 16rpx 0 13rpx; overflow: hidden; color: #66728a; font-size: 23rpx; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }.person-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 12rpx; border-top: 1rpx solid #f0f2f6; }.person-tags { display: flex; gap: 10rpx; min-width: 0; overflow: hidden; }.person-tags text { max-width: 230rpx; overflow: hidden; padding: 5rpx 10rpx; border-radius: 7rpx; color: #8b97aa; background: #f6f7fa; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }.person-tags .identity-tag { color: #735d3c; background: #fff4df; }.person-links { display: flex; align-items: center; gap: 14rpx; flex: 0 0 auto; }.person-link { color: #6573dc; font-size: 19rpx; }.person-link.message { color: #2f9b82; }.person-link.pending { color: #a2adbd; }.card-arrow { color: #9aa5b6; font-size: 26rpx; }

.group-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; }.group-card { min-width: 0; overflow: hidden; border: 1rpx solid #e8ebf2; border-radius: 20rpx; background: #fff; box-shadow: 0 8rpx 22rpx rgba(70,87,123,.035); }.group-cover { position: relative; height: 180rpx; padding: 15rpx; color: #fff; box-sizing: border-box; }.group-cover::after { position: absolute; right: -40rpx; bottom: -70rpx; width: 180rpx; height: 180rpx; border: 1rpx solid rgba(255,255,255,.22); border-radius: 50%; content: ''; box-shadow: 0 0 0 22rpx rgba(255,255,255,.05); }.cover-top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; color: rgba(255,255,255,.8); font-size: 16rpx; }.cover-index { font-family: monospace; }.cover-icon { position: absolute; right: 18rpx; bottom: 35rpx; z-index: 1; width: 46rpx; height: 46rpx; filter: brightness(0) invert(1); opacity: .88; }.cover-short { position: absolute; bottom: 15rpx; left: 15rpx; z-index: 1; color: rgba(255,255,255,.65); font-family: monospace; font-size: 14rpx; letter-spacing: .05em; }.group-body { padding: 16rpx; }.group-title-line { display: flex; align-items: center; gap: 6rpx; min-height: 38rpx; }.group-name { overflow: hidden; color: #3d4963; font-size: 25rpx; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }.joined-badge { padding: 4rpx 7rpx; border-radius: 6rpx; color: #2f9b82; background: #e8f7f2; font-size: 15rpx; white-space: nowrap; }.group-desc { display: -webkit-box; height: 58rpx; margin-top: 8rpx; overflow: hidden; color: #8e9aad; font-size: 19rpx; line-height: 1.52; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.group-meta { display: flex; align-items: center; gap: 6rpx; margin-top: 12rpx; color: #9ca7b7; font-size: 17rpx; white-space: nowrap; }.meta-item { display: flex; align-items: center; gap: 4rpx; }.meta-item image { width: 20rpx; height: 20rpx; opacity: .52; }.meta-dot { color: #c4cad4; }.group-action { display: flex; align-items: center; justify-content: space-between; margin-top: 14rpx; padding-top: 12rpx; border-top: 1rpx solid #f0f2f6; color: #6573dc; font-size: 20rpx; font-weight: 700; }.group-action.joined { color: #2f9b82; }
.interaction-note { display: flex; align-items: center; gap: 13rpx; margin-top: 18rpx; padding: 17rpx; border: 1rpx solid #f1e8da; border-radius: 18rpx; background: #fffaf1; }.note-icon { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; border-radius: 15rpx; background: #fff0d5; }.note-icon image { width: 26rpx; height: 26rpx; opacity: .72; }.note-copy { min-width: 0; flex: 1; }.note-title, .note-desc { display: block; }.note-title { color: #735d3c; font-size: 22rpx; font-weight: 700; }.note-desc { margin-top: 4rpx; color: #b39a77; font-size: 18rpx; }.note-arrow { color: #bd9e70; font-size: 26rpx; }
.state-card { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220rpx; border: 1rpx solid #e8ebf2; border-radius: 20rpx; color: #9aa5b6; background: #fff; font-size: 22rpx; }.state-card image { width: 48rpx; height: 48rpx; margin-bottom: 14rpx; opacity: .35; }.state-action { margin-top: 12rpx; color: #6573dc; font-size: 20rpx; }.loading-dot { width: 38rpx; height: 38rpx; margin-bottom: 14rpx; border: 4rpx solid #e3e6f8; border-top-color: #6573dc; border-radius: 50%; animation: spin 1s linear infinite; }
.people-load-more { display: flex; align-items: center; justify-content: center; gap: 9rpx; margin-top: 16rpx; padding: 17rpx; border: 1rpx solid #e5e8f3; border-radius: 16rpx; color: #6573dc; background: #fff; font-size: 20rpx; }.people-load-more.disabled { opacity: .55; }.load-more-arrow { font-size: 24rpx; }.people-list-end { display: block; margin-top: 18rpx; color: #adb6c5; font-size: 18rpx; text-align: center; }
.cover-icon { width: 48rpx; height: 48rpx; object-fit: contain; }
.meta-item image { display: block; width: 22rpx; height: 22rpx; object-fit: contain; }
.note-icon image { display: block; width: 29rpx; height: 29rpx; object-fit: contain; }
.state-card image { display: block; width: 49rpx; height: 49rpx; object-fit: contain; }
.cover-activity { position: absolute; right: 15rpx; bottom: 13rpx; z-index: 2; display: flex; align-items: center; gap: 5rpx; color: rgba(255,255,255,.82); font-size: 15rpx; }.activity-pulse { width: 9rpx; height: 9rpx; border-radius: 50%; background: #c7f3b0; box-shadow: 0 0 0 4rpx rgba(199,243,176,.14); }.group-action.pending { opacity: .55; pointer-events: none; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 视觉收口：用中性底色承载信息，颜色只承担分类和状态。 */
.page, .topbar { color: #1F2329; background: #F5F6F8; }
.page-title { color: #1F2329; }
.hero-card { border-radius: 16rpx; background: linear-gradient(135deg, #2E3B3D 0%, #4D6C5C 58%, #A4774E 100%); box-shadow: 0 10rpx 24rpx rgba(60,76,68,.15); }
.hero-orb-one { background: rgba(255,255,255,.09); }
.hero-orb-two { background: rgba(246,194,132,.18); }
.search-box { border-color: rgba(255,255,255,.35); border-radius: 8rpx; background: rgba(255,255,255,.12); }
.main-tab, .person-card, .group-card, .state-card, .people-load-more { border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(31,35,41,.03); }
.main-tab.active { border-color: #B7D4C5; background: #F0F7F2; box-shadow: none; }
.chip { border-radius: 8rpx; }
.chip.active { border-color: #B7D4C5; color: #356653; background: #EDF6F0; }
.follow-button, .group-action { color: #39735C; }
.follow-button { border: 1rpx solid #B9C8F4; border-radius: 8rpx; color: #4964C8; background: #FFF; }
.follow-button.following { border-color: #E1E5EB; color: #646A73; background: #F0F1F3; }
.group-action { border-top-color: #F0F1F3; }
.interaction-note { border-color: #E6D7BF; border-radius: 12rpx; background: #FFF9EF; }
.note-title { color: #5E4C36; }
.state-action, .section-link, .people-load-more { color: #4C8067; }
.loading-dot { border-color: #D8E9DF; border-top-color: #4C8067; }

/* Quiet Intelligence v2：把人脉页改成可浏览的关系目录，而不是彩色社交卡片墙。 */
.page,
.topbar { color: #191816; background: #f7f6f2; }
.topbar { align-items: flex-end; padding: 30rpx 36rpx 24rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .1); }
.eyebrow,
.section-eyebrow { color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; font-weight: 400; letter-spacing: .13em; }
.page-title { margin-top: 10rpx; color: #191816; font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-size: 42rpx; font-weight: 400; }
.topbar-actions { align-items: center; flex: 0 0 auto; gap: 10rpx; }
.top-action { display: flex; align-items: center; justify-content: center; gap: 8rpx; min-width: 96rpx; min-height: 60rpx; padding: 12rpx 14rpx; border: 1rpx solid rgba(30, 27, 22, .12); border-radius: 4rpx; color: #5c2828; background: #fcfbf8; box-sizing: border-box; font-size: 20rpx; line-height: 1.2; white-space: nowrap; }
.top-action image { display: block; width: 28rpx; height: 28rpx; flex: 0 0 28rpx; object-fit: contain; opacity: .76; }
.network-content { padding: 0 36rpx 140rpx; }

.hero-card { margin-top: 46rpx; padding: 0 0 32rpx; overflow: hidden; border-bottom: 1rpx solid rgba(30, 27, 22, .11); border-radius: 0; color: #191816; background: transparent !important; box-shadow: none; }
.hero-card::after { display: none; }
.hero-label { color: #8a847b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .12em; }
.hero-title { max-width: 620rpx; margin-top: 20rpx; color: #191816; font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-size: 48rpx; font-weight: 400; letter-spacing: -.05em; line-height: 1.18; }
.hero-desc { max-width: 560rpx; margin-top: 18rpx; color: #6f6b63; font-size: 21rpx; line-height: 1.68; }
.search-box { height: 76rpx; margin-top: 30rpx; padding: 0 16rpx; border-color: rgba(30, 27, 22, .12); border-radius: 4rpx; background: #fcfbf8; }
.search-icon { filter: none; opacity: .52; }
.search-input { color: #191816; }
.search-placeholder { color: #aaa49a; }
.search-clear { border-radius: 3rpx; color: #69574a; background: #f0eee8; }
.hero-stats { margin-top: 32rpx; border-top: 1rpx solid rgba(30, 27, 22, .08); }
.hero-stat { align-items: flex-start; padding: 22rpx 18rpx 0 0; }
.hero-stat + .hero-stat { padding-left: 22rpx; border-left: 1rpx solid rgba(30, 27, 22, .08); }
.stat-line { display: none; }
.stat-num { color: #191816; font-family: Georgia, serif; font-size: 34rpx; font-weight: 400; font-variant-numeric: tabular-nums; }
.stat-label { color: #8a847b; font-size: 17rpx; }

.main-tabs { gap: 0; margin: 48rpx 0 42rpx; border-top: 1rpx solid rgba(30, 27, 22, .1); border-bottom: 1rpx solid rgba(30, 27, 22, .1); }
.main-tab { gap: 16rpx; padding: 22rpx 18rpx 20rpx 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
.main-tab + .main-tab { padding-left: 24rpx; border-left: 1rpx solid rgba(30, 27, 22, .09); }
.main-tab.active { border: 0; border-bottom: 3rpx solid #5c2828; color: #5c2828; background: transparent; box-shadow: none; }
.tab-index { color: #b5a07a; font-family: Georgia, serif; font-size: 18rpx; }
.tab-title { color: #25231f; font-size: 22rpx; font-weight: 500; }
.tab-desc { color: #979189; }
.section-heading { margin-bottom: 24rpx; padding-bottom: 18rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .09); }
.section-title { margin-top: 8rpx; color: #191816; font-family: 'Songti SC', 'STSong', serif; font-size: 34rpx; font-weight: 400; }
.section-link { color: #5c2828; }
.industry-scroll { margin: 0 -36rpx 22rpx; padding: 0 36rpx; white-space: nowrap; }
.industry-row { display: inline-flex; gap: 9rpx; }
.industry-chip { display: inline-flex; align-items: baseline; gap: 9rpx; padding: 12rpx 16rpx; border: 1rpx solid rgba(30, 27, 22, .1); border-radius: 4rpx; color: #6f6b63; background: #fcfbf8; white-space: nowrap; }
.industry-code { color: #b5a07a; font-family: Georgia, serif; font-size: 14rpx; }
.industry-chip > text:last-child { font-size: 18rpx; }
.industry-chip.active { border-color: #5c2828; color: #5c2828; background: #f0e5df; }
.industry-chip.active .industry-code { color: #5c2828; }
.chip-scroll { margin-bottom: 22rpx; }
.chip { padding: 9rpx 17rpx; border-color: rgba(30, 27, 22, .1); border-radius: 3rpx; color: #6f6b63; background: #fcfbf8; }
.chip.active { border-color: #5c2828; color: #5c2828; background: #f0e5df; font-weight: 500; }
.chip-outline { color: #69574a; }

.people-list { gap: 0; border-top: 1rpx solid rgba(30, 27, 22, .09); }
.person-card { padding: 26rpx 0; border: 0; border-bottom: 1rpx solid rgba(30, 27, 22, .09); border-radius: 0; background: transparent; box-shadow: none; }
.person-avatar { width: 68rpx; height: 68rpx; border: 1rpx solid rgba(30, 27, 22, .11); border-radius: 4rpx; color: #69574a; background: #f0eee8 !important; }
.person-avatar text { font-family: 'Songti SC', serif; font-size: 27rpx; font-weight: 400; }
.person-avatar-image { display: block; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.person-top,
.person-main,
.person-name-line,
.person-bottom,
.person-tags,
.person-links,
.group-body,
.group-title-line { min-width: 0; }
.group-meta { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.group-meta > text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.page image { max-width: 100%; box-sizing: border-box; }
.person-name { color: #25231f; font-size: 25rpx; font-weight: 500; }
.verified-label { border-radius: 3rpx; color: #56624c; background: rgba(86, 98, 76, .1); }
.person-company,
.person-bio { color: #8a847b; }
.person-bio { margin-left: 83rpx; font-family: 'Songti SC', 'STSong', serif; font-size: 21rpx; }
.person-bottom { margin-left: 83rpx; border-top-color: rgba(30, 27, 22, .07); }
.person-tags text { border-radius: 3rpx; color: #8a847b; background: #f0eee8; }
.follow-button { padding: 9rpx 14rpx; border-color: #5c2828; border-radius: 4rpx; color: #5c2828; background: #fcfbf8; }
.follow-button.following { border-color: rgba(30, 27, 22, .11); color: #8a847b; background: #f0eee8; }
.person-link,
.person-link.message { color: #5c2828; }

.group-grid { display: grid; grid-template-columns: 1fr; gap: 0; border-top: 1rpx solid rgba(30, 27, 22, .09); }
.group-card { display: grid; grid-template-columns: 176rpx minmax(0, 1fr); overflow: hidden; border: 0; border-bottom: 1rpx solid rgba(30, 27, 22, .09); border-radius: 0; background: transparent; box-shadow: none; }
.group-cover { min-height: 204rpx; height: auto; padding: 18rpx; color: #69574a; background: #f0eee8 !important; }
.group-cover::after { display: none; }
.cover-top { color: #8a847b; font-family: ui-monospace, monospace; }
.cover-icon { display: none; }
.cover-short { right: 18rpx; bottom: 18rpx; left: 18rpx; color: #69574a; }
.cover-activity { right: auto; bottom: 48rpx; left: 18rpx; color: #6f6b63; }
.activity-pulse { background: #56624c; box-shadow: none; }
.group-body { padding: 24rpx 0 24rpx 26rpx; }
.group-name { color: #25231f; font-size: 25rpx; font-weight: 500; }
.joined-badge { border-radius: 3rpx; color: #56624c; background: rgba(86, 98, 76, .1); }
.group-desc,
.group-meta { color: #8a847b; }
.group-action { border-top-color: rgba(30, 27, 22, .08); color: #5c2828; font-weight: 500; }
.group-action.joined { color: #56624c; }
.interaction-note { margin-top: 50rpx; padding: 22rpx 0; border: 0; border-top: 1rpx solid rgba(181, 160, 122, .35); border-bottom: 1rpx solid rgba(181, 160, 122, .35); border-radius: 0; background: transparent; }
.note-icon { width: 38rpx; height: 38rpx; border-radius: 3rpx; background: #f0eee8; }
.note-title { color: #69574a; font-weight: 500; }
.note-desc { color: #979189; }
.state-card,
.people-load-more { border-color: rgba(30, 27, 22, .1); border-radius: 4rpx; color: #8a847b; background: #fcfbf8; box-shadow: none; }
.state-action,
.people-load-more { color: #5c2828; }
.loading-dot { border-color: #ded9cf; border-top-color: #5c2828; }
.inline-refresh { display: flex; align-items: center; gap: 10rpx; min-height: 36rpx; padding: 5rpx 0 14rpx; color: #8a847b; font-size: 17rpx; }
.loading-dot.small { width: 20rpx; height: 20rpx; margin: 0; border-width: 2rpx; }
.person-card.card-press:active,
.main-tab:active,
.hero-stat:active,
.chip:active,
.industry-chip:active,
.top-action:active,
.follow-button:active,
.person-link:active,
.group-action:active { opacity: .72; }
.follow-button.busy { border-color: rgba(92, 40, 40, .26); color: #8a847b; background: #f0eee8; }

@media (max-width: 420px) {
  .topbar,
  .network-content { padding-right: 28rpx; padding-left: 28rpx; }
  .hero-title { font-size: 42rpx; }
  .topbar-actions { gap: 6rpx; }
  .top-action { min-width: 82rpx; min-height: 56rpx; gap: 5rpx; padding: 10rpx 8rpx; font-size: 18rpx; }
  .top-action image { width: 24rpx; height: 24rpx; flex-basis: 24rpx; }
  .person-bio,
  .person-bottom { margin-left: 0; }
  .group-card { grid-template-columns: 148rpx minmax(0, 1fr); }
}
</style>
