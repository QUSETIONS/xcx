<template>
  <view v-if="loadState === 'loading'" class="state-page">
    <view class="loading-dot" /><text>正在打开主页…</text>
  </view>
  <view v-else-if="loadState === 'error'" class="state-page error-state" @tap="reload">
    <text class="state-icon">!</text><text>主页暂时没打开</text><text class="state-action">点击重试</text>
  </view>
  <view v-else-if="user" class="page" :style="a11yStyle">
    <view class="profile-hero" :style="{ background: coverColor }">
      <view class="hero-orb hero-orb-one" /><view class="hero-orb hero-orb-two" />
      <view class="profile-kicker"><text>独立的人</text><text v-if="user.verified" class="verified-badge">已认证</text></view>
      <view class="profile-main">
        <view class="avatar" :style="{ background: avatarColor }"><text>{{ initial(user.nickname) }}</text></view>
        <view class="profile-copy">
          <text class="nickname">{{ user.nickname }}</text>
          <text class="company">{{ user.company || '媒合智联成员' }}<text v-if="user.city"> · {{ user.city }}</text></text>
          <text class="title" v-if="user.title">{{ user.title }}</text>
          <text class="bio">{{ user.bio || '正在寻找长期合作伙伴' }}</text>
        </view>
      </view>
      <view class="profile-actions">
        <view class="follow-action" :class="{ following: isFollowing, disabled: followState === 'loading' }" @tap="toggleFollow"><text>{{ followState === 'loading' ? '处理中…' : (isFollowing ? '已关注' : '关注') }}</text></view>
        <view v-if="user.can_connect" class="connect-action" :class="{ muted: relationship !== 'none' || relationshipLoading }" @tap="handleConnection"><text>{{ relationshipLoading ? '申请中…' : relationshipLabel }}</text></view>
      </view>
    </view>

    <view class="profile-stats">
      <view><text class="stat-number">{{ formatCount(user.posts) }}</text><text class="stat-label">公开动态</text></view>
      <view class="stat-divider" />
      <view><text class="stat-number">{{ formatCount(user.followers) }}</text><text class="stat-label">关注者</text></view>
      <view class="stat-divider" />
      <view><text class="stat-number">{{ reviewAvg }}</text><text class="stat-label">合作评价</text></view>
    </view>

    <view class="relationship-note">
      <view class="note-mark"><image src="/static/icons/handshake.svg" mode="aspectFit" /></view>
      <view class="note-copy"><text class="note-title">{{ relationshipHint }}</text><text class="note-desc">先从一个具体项目或共同方向开始聊，更容易建立联系。</text></view>
    </view>

    <view v-if="relationship === 'none' && referralOptions.length" class="referral-card" @tap="openReferralSheet">
      <view class="referral-copy"><text class="referral-kicker">WARM INTRODUCTION</text><text class="referral-title">有共同联系人可以帮你介绍</text><text class="referral-desc">通过 {{ referralOptions[0]?.connector?.nickname || '共同联系人' }} 说明来意，再决定是否转介绍。</text></view>
      <text class="referral-action">请引荐</text>
    </view>

    <view class="trust-ledger">
      <view class="trust-heading"><view><text class="trust-kicker">COOPERATION RECORD</text><text class="trust-title">合作记录</text></view><text class="trust-state" :class="{ verified: user.trust?.verified }">{{ user.trust?.verified ? '资料已核验' : '资料待完善' }}</text></view>
      <view v-if="hasPublicTrust" class="trust-grid">
        <view v-if="user.trust?.rating" class="trust-item"><text>{{ Number(user.trust.rating).toFixed(1) }}</text><text>合作评价</text></view>
        <view v-if="user.trust?.deal_count" class="trust-item"><text>{{ user.trust.deal_count }}</text><text>公开成交</text></view>
        <view v-if="user.trust?.response_rate" class="trust-item"><text>{{ user.trust.response_rate }}%</text><text>回复率</text></view>
      </view>
      <text v-else class="trust-empty">认证状态、公开评价和履约信息会在完成资料授权后逐步展示。</text>
    </view>

    <view class="profile-tabs">
      <text :class="{ active: tab === 'posts' }" @tap="tab = 'posts'">动态 <text class="tab-count">{{ userPosts.length }}</text></text>
      <text :class="{ active: tab === 'demands' }" @tap="tab = 'demands'">需求 <text class="tab-count">{{ userDemands.length }}</text></text>
      <text :class="{ active: tab === 'reviews' }" @tap="tab = 'reviews'">评价 <text class="tab-count">{{ userReviews.length }}</text></text>
    </view>

    <view v-if="tab === 'posts'" class="content-section">
      <view class="section-heading"><view><text class="section-eyebrow">RECENT ACTIVITY</text><text class="section-title">最近在聊什么</text></view><text class="section-hint">公开动态</text></view>
      <view v-if="userPosts.length" class="content-list">
        <view v-for="item in userPosts" :key="item._id || item.id" class="content-card card-press" @tap="goPost(item._id || item.id)">
          <text class="content-text">{{ postSummary(item) }}</text>
          <view class="content-meta"><text class="content-tag">{{ item.topic?.name || postTypeLabel(item.post_type || item.postType) }}</text><text>{{ formatCount(item.like_count) }} 赞 · {{ formatCount(item.comment_count) }} 评论</text></view>
        </view>
      </view>
      <view v-else class="empty-card"><image src="/static/icons/chat.svg" mode="aspectFit" /><text>还没有公开动态</text><text class="empty-hint">等一次分享，让更多人认识这个方向</text></view>
    </view>

    <view v-else-if="tab === 'demands'" class="content-section">
      <view class="section-heading"><view><text class="section-eyebrow">OPEN PROJECTS</text><text class="section-title">正在关注的项目</text></view><text class="section-hint">需求动态</text></view>
      <view v-if="userDemands.length" class="content-list">
        <view v-for="item in userDemands" :key="item._id || item.id" class="content-card card-press" @tap="goDemand(item._id || item.id)">
          <text class="content-title">{{ item.title }}</text>
          <view class="content-meta"><text class="content-tag demand">{{ categoryName(item.category_id, item.category_name) }}</text><text>{{ regionName(item.region) || '全国' }} · {{ formatCount(item.view_count) }} 浏览</text></view>
        </view>
      </view>
      <view v-else class="empty-card"><image src="/static/icons/file.svg" mode="aspectFit" /><text>暂时没有公开需求</text><text class="empty-hint">有合适的项目，可以从关注开始</text></view>
    </view>

    <view v-else class="content-section">
      <view class="section-heading"><view><text class="section-eyebrow">COOPERATION NOTES</text><text class="section-title">合作伙伴怎么说</text></view><text class="section-hint">真实反馈</text></view>
      <view v-if="userReviews.length" class="content-list">
        <view v-for="item in userReviews" :key="item._id || item.id" class="review-card">
          <view class="review-top"><text class="reviewer">{{ item.reviewer?.nickname || '合作伙伴' }}</text><text class="review-stars">{{ getStars(item.rating) }}</text></view>
          <text class="review-content">{{ item.content }}</text>
          <view v-if="item.tags?.length" class="review-tags"><text v-for="tag in item.tags" :key="tag">{{ tag }}</text></view>
        </view>
      </view>
      <view v-else class="empty-card"><image src="/static/icons/star.svg" mode="aspectFit" /><text>还没有公开评价</text><text class="empty-hint">完成一次合作后，这里会留下反馈</text></view>
    </view>

    <view class="profile-footnote">公开信息只用于认识彼此，联系方式需要在双方建立关系后再交换。</view>

    <view v-if="showIntroSheet" class="intro-mask" @tap="showIntroSheet = false">
      <view class="intro-sheet" @tap.stop>
        <text class="intro-kicker">INTRODUCTION</text><text class="intro-title">说清楚你为什么想认识对方</text>
        <textarea v-model="introMessage" class="intro-input" maxlength="120" auto-height placeholder="例如：我正在推进一个上海的线下发布项目，想请教你们的场地和执行经验。" />
        <view class="intro-actions"><text class="intro-cancel" @tap="showIntroSheet = false">取消</text><text class="intro-send" :class="{ disabled: relationshipLoading || !introMessage.trim() }" @tap="sendFriendRequest">{{ relationshipLoading ? '发送中…' : '发出申请' }}</text></view>
      </view>
    </view>

    <view v-if="showReferralSheet" class="intro-mask" @tap="showReferralSheet = false">
      <view class="intro-sheet" @tap.stop>
        <text class="intro-kicker">WARM INTRODUCTION</text><text class="intro-title">请共同联系人帮忙介绍</text>
        <view class="connector-options"><text v-for="option in referralOptions" :key="option.connector?.id || option.connector?._id" class="connector-option" :class="{ selected: referralConnectorId === (option.connector?.id || option.connector?._id) }" @tap="referralConnectorId = option.connector?.id || option.connector?._id">{{ option.connector?.nickname || '共同联系人' }}</text></view>
        <textarea v-model="referralContext" class="intro-input" maxlength="180" auto-height placeholder="说明项目背景、你想认识对方的原因，以及希望共同联系人怎样介绍你。" />
        <view class="intro-actions"><text class="intro-cancel" @tap="showReferralSheet = false">取消</text><text class="intro-send" :class="{ disabled: referralSending || !referralContext.trim() }" @tap="sendReferralRequest">{{ referralSending ? '提交中…' : '提交引荐申请' }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useRequest } from '@/hooks/useRequest'
import { categoryName, regionName } from '@/utils/i18n-maps'
import { a11yStyle } from '@/utils/accessibility'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { hasStoredAccessToken } from '@/utils/session'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.userProfile')

const userId = ref('')
const userStore = useUserStore()
const user = ref(null)
const isFollowing = ref(false)
const relationship = ref('none')
const relationshipLoading = ref(false)
const showIntroSheet = ref(false)
const introMessage = ref('')
const referralOptions = ref([])
const showReferralSheet = ref(false)
const referralConnectorId = ref('')
const referralContext = ref('')
const referralSending = ref(false)
const tab = ref('posts')
const userPosts = ref([])
const userDemands = ref([])
const userReviews = ref([])
const reviewAvg = ref('—')
const avatarColors = [
  'linear-gradient(135deg, #5968D8, #8794F5)',
  'linear-gradient(135deg, #E17662, #F5AA89)',
  'linear-gradient(135deg, #2F9B82, #72C7A8)',
  'linear-gradient(135deg, #C78934, #E5BA6D)',
  'linear-gradient(135deg, #7A69C7, #AC99E5)'
]
const coverColors = ['linear-gradient(135deg,#252e55,#5968D8)', 'linear-gradient(135deg,#3b5d69,#2F9B82)', 'linear-gradient(135deg,#613d54,#D86B59)', 'linear-gradient(135deg,#5d4a2d,#C78934)']
const avatarColor = ref(avatarColors[0])
const coverColor = ref(coverColors[0])

const { state: loadState, run: loadRequest } = useRequest(async (id) => {
  const [nextUser, nextPerson, postsResult, demandsResult, reviewsResult, avg, referralsResult] = await Promise.all([
    bridge.community.userInfo(id),
    hasStoredAccessToken() ? bridge.network.person(id).catch(() => null) : Promise.resolve(null),
    bridge.community.posts({ pageSize: 100 }),
    bridge.demand.list({ pageSize: 100 }),
    bridge.review.list({ target_id: id, pageSize: 20 }).catch(() => ({ list: [] })),
    bridge.review.avgRating(id).catch(() => ({ avg: 0 })),
    hasStoredAccessToken() ? bridge.network.referralOptions(id).catch(() => ({ list: [] })) : Promise.resolve({ list: [] })
  ])
  if (!nextUser && !nextPerson) return null
  const merged = {
    ...(nextUser || {}),
    ...(nextPerson || {}),
    nickname: nextPerson?.nickname || nextUser?.nickname || '未命名用户',
    company: nextPerson?.company || nextUser?.company || '媒合智联成员',
    bio: nextPerson?.bio || nextUser?.bio || '正在寻找长期合作伙伴',
    city: nextPerson?.city || nextUser?.city || '',
    title: nextPerson?.title || nextUser?.title || '',
    followers: Number(nextPerson?.followers ?? nextUser?.followers ?? 0),
    posts: Number(nextPerson?.posts ?? nextUser?.posts ?? 0),
    trust: nextPerson?.trust || {},
    verified: Boolean(nextPerson?.trust?.verified || nextPerson?.verified || nextPerson?.kind === 'provider')
  }
  const posts = Array.isArray(nextUser?.userPosts)
    ? nextUser.userPosts
    : (postsResult?.list || []).filter((item) => item.author?.id === id || item.author_id === id)
  const demands = Array.isArray(nextUser?.userDemands)
    ? nextUser.userDemands
    : (demandsResult?.list || []).filter((item) => item.created_by === id)
  return {
    user: merged,
    isFollowing: nextPerson?.followed ?? nextUser?.isFollowing ?? false,
    relationship: nextPerson?.friend_status || nextPerson?.friendStatus || 'none',
    posts,
    demands,
    reviews: reviewsResult?.list || [],
    reviewAvg: Number(avg?.avg || 0) > 0 ? Number(avg.avg).toFixed(1) : '—',
    referralOptions: Array.isArray(referralsResult?.list) ? referralsResult.list : []
  }
})
const { state: followState, run: toggleFollowRequest } = useRequest((id) => bridge.follow.toggle(id))

const relationshipLabel = computed(() => ({
  friends: '发消息',
  pending_outgoing: '申请中',
  pending_incoming: '查看申请',
  none: user.value?.can_message ? '发消息' : '加好友'
}[relationship.value] || (user.value?.can_message ? '发消息' : '加好友')))
const relationshipHint = computed(() => ({
  friends: '你们已经建立联系，可以直接聊项目。',
  pending_outgoing: '好友申请已发出，等对方有空回应。',
  pending_incoming: '对方想和你认识，去关系管理里看看。',
  none: user.value?.connection_status === 'referral'
    ? '共同联系人已完成引荐，现在可以直接沟通具体合作。'
    : '还不认识，先关注或发一条有上下文的申请。'
}[relationship.value] || '先从一个具体项目或共同方向开始聊。'))
const hasPublicTrust = computed(() => Boolean(
  user.value?.trust?.rating || user.value?.trust?.deal_count || user.value?.trust?.response_rate
))

onLoad((query) => {
  userId.value = query?.id || ''
  reload()
})

async function reload() {
  if (!userId.value) return
  try {
    const data = await loadRequest(userId.value)
    if (!data?.user) throw new Error('profile not found')
    user.value = data.user
    isFollowing.value = !!data.isFollowing
    relationship.value = data.relationship || 'none'
    userPosts.value = data.posts || []
    userDemands.value = data.demands || []
    userReviews.value = data.reviews || []
    reviewAvg.value = data.reviewAvg || '—'
    referralOptions.value = data.referralOptions || []
    const colorIndex = userId.value.charCodeAt(userId.value.length - 1) % avatarColors.length
    avatarColor.value = avatarColors[colorIndex]
    coverColor.value = coverColors[colorIndex % coverColors.length]
  } catch {
    toastError('主页加载失败，请稍后重试')
  }
}

function initial(value) { return String(value || '人').slice(0, 1) }
function formatCount(value) {
  const count = Number(value || 0)
  if (count >= 10000) return (count / 10000).toFixed(1).replace('.0', '') + 'w'
  if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(count)
}
function getStars(rating) {
  const score = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))
  return '★'.repeat(score) + '☆'.repeat(5 - score)
}
function postTypeLabel(type) { return ({ collab: '求合作', experience: '经验分享', event: '活动公告', question: '提问', general: '动态' })[type] || '动态' }
function postSummary(item) {
  const text = String(item?.content || '').trim()
  return text.length > 110 ? `${text.slice(0, 110)}…` : text || '这条动态暂时没有文字内容'
}

async function toggleFollow() {
  if (!user.value || followState.value === 'loading' || !(await requirePageLogin(userStore, '登录后才能关注成员'))) return
  try {
    const result = await toggleFollowRequest(userId.value)
    isFollowing.value = !!result?.followed
    user.value.followers = Math.max(0, Number(user.value.followers || 0) + (isFollowing.value ? 1 : -1))
    uni.showToast({ title: isFollowing.value ? '已关注' : '已取消关注', icon: 'none' })
  } catch {
    toastError('关注操作失败，请稍后重试')
  }
}

function handleConnection() {
  if (relationshipLoading.value) return
  if (relationship.value === 'friends' || user.value?.can_message) return goChat()
  if (relationship.value === 'pending_incoming') return goFriends()
  if (relationship.value === 'pending_outgoing') {
    uni.showToast({ title: '申请已发出，等对方回应', icon: 'none' })
    return
  }
  openIntroSheet()
}

function openIntroSheet() {
  introMessage.value = `你好，我在媒合智联看到你的${user.value?.title || '业务方向'}，想就一个具体项目交流一下。`
  showIntroSheet.value = true
}

async function sendFriendRequest() {
  if (!user.value?.can_connect || !(await requirePageLogin(userStore, '登录后才能添加好友'))) return
  relationshipLoading.value = true
  try {
    await bridge.network.sendFriendRequest({
      target_user_id: userId.value,
      message: introMessage.value.trim()
    })
    relationship.value = 'pending_outgoing'
    showIntroSheet.value = false
    uni.showToast({ title: '申请已发出', icon: 'none' })
  } catch {
    toastError('申请发送失败，请稍后重试')
  } finally {
    relationshipLoading.value = false
  }
}

function openReferralSheet() {
  const first = referralOptions.value[0]
  referralConnectorId.value = first?.connector?.id || first?.connector?._id || ''
  referralContext.value = `你好，我正在推进一个具体项目，想请你帮忙介绍我和${user.value?.nickname || '这位伙伴'}认识。我的项目背景是：`
  showReferralSheet.value = true
}

async function sendReferralRequest() {
  if (referralSending.value || !referralConnectorId.value || !referralContext.value.trim()) return
  if (!(await requirePageLogin(userStore, '登录后才能发起引荐申请'))) return
  referralSending.value = true
  try {
    await bridge.network.requestReferral({
      target_user_id: userId.value,
      connector_id: referralConnectorId.value,
      context: referralContext.value.trim()
    })
    showReferralSheet.value = false
    uni.showToast({ title: '引荐申请已发出', icon: 'none' })
  } catch {
    toastError('引荐申请发送失败，请稍后重试')
  } finally {
    referralSending.value = false
  }
}

function goChat() { uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(userId.value)}&name=${encodeURIComponent(user.value?.nickname || '')}` }) }
function goFriends() { uni.navigateTo({ url: '/pages/network/friends' }) }
function goPost(id) { uni.navigateTo({ url: `/pages/community/detail?id=${encodeURIComponent(id)}` }) }
function goDemand(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${encodeURIComponent(id)}` }) }
</script>

<style scoped lang="scss">
.page { min-height: 100vh; padding-bottom: 90rpx; color: #27334f; background: #f5f7fb; box-sizing: border-box; }
.state-page { display: flex; min-height: 100vh; flex-direction: column; align-items: center; justify-content: center; gap: 12rpx; color: #9aa5b6; font-size: 21rpx; }.state-icon { display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; border-radius: 50%; color: #fff; background: #f2a07a; font-size: 34rpx; font-weight: 800; }.state-action { color: #6573dc; font-size: 19rpx; }.loading-dot { width: 38rpx; height: 38rpx; border: 4rpx solid #e3e6f8; border-top-color: #6573dc; border-radius: 50%; animation: spin 1s linear infinite; }
.profile-hero { position: relative; overflow: hidden; padding: 26rpx 24rpx 25rpx; color: #fff; }.profile-hero::after { position: absolute; right: -100rpx; bottom: -165rpx; width: 420rpx; height: 420rpx; border: 1rpx solid rgba(255,255,255,.18); border-radius: 50%; content: ''; box-shadow: 0 0 0 38rpx rgba(255,255,255,.05), 0 0 0 76rpx rgba(255,255,255,.035); }.hero-orb { position: absolute; border-radius: 50%; background: rgba(255,255,255,.08); }.hero-orb-one { top: -90rpx; right: 70rpx; width: 220rpx; height: 220rpx; }.hero-orb-two { right: 310rpx; bottom: 70rpx; width: 60rpx; height: 60rpx; background: rgba(255,187,132,.18); }
.profile-kicker, .profile-main, .profile-actions { position: relative; z-index: 1; }.profile-kicker { display: flex; align-items: center; gap: 9rpx; color: rgba(255,255,255,.7); font: 700 17rpx/1.2 monospace; letter-spacing: .08em; }.verified-badge { padding: 5rpx 8rpx; border-radius: 7rpx; color: #e8fff4; background: rgba(91,207,163,.2); font: 500 15rpx/1.2 sans-serif; letter-spacing: 0; }.profile-main { display: flex; align-items: center; gap: 16rpx; margin-top: 24rpx; }.avatar { display: flex; align-items: center; justify-content: center; width: 116rpx; height: 116rpx; flex: 0 0 auto; border: 4rpx solid rgba(255,255,255,.45); border-radius: 35rpx; color: #fff; box-shadow: 0 12rpx 22rpx rgba(19,28,74,.2); }.avatar text { font-size: 45rpx; font-weight: 800; }.profile-copy { min-width: 0; flex: 1; }.nickname { display: block; overflow: hidden; color: #fff; font-size: 35rpx; font-weight: 780; text-overflow: ellipsis; white-space: nowrap; }.company, .title, .bio { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.company { margin-top: 7rpx; color: rgba(255,255,255,.73); font-size: 20rpx; }.title { margin-top: 8rpx; color: #ffe0c1; font-size: 18rpx; }.bio { margin-top: 8rpx; color: rgba(255,255,255,.6); font-size: 18rpx; }
.profile-actions { display: flex; gap: 10rpx; margin-top: 22rpx; }.follow-action, .connect-action { flex: 1; padding: 13rpx 18rpx; border-radius: 17rpx; font-size: 20rpx; font-weight: 700; text-align: center; }.follow-action { border: 1rpx solid rgba(255,255,255,.72); color: #4964c8; background: #fff; }.follow-action.following { border-color: rgba(255,255,255,.35); color: #e6fff6; background: rgba(77,186,145,.22); }.follow-action.disabled, .connect-action.muted { opacity: .62; }.connect-action { color: #fff; border: 1rpx solid rgba(255,255,255,.25); background: rgba(255,255,255,.12); }.connect-action.muted { color: rgba(255,255,255,.8); }
.profile-stats { position: relative; z-index: 2; display: flex; align-items: center; margin: -18rpx 24rpx 18rpx; padding: 20rpx 14rpx; border: 1rpx solid #e8ebf2; border-radius: 22rpx; background: #fff; box-shadow: 0 12rpx 28rpx rgba(70,87,123,.08); text-align: center; }.profile-stats > view { display: flex; flex: 1; flex-direction: column; }.stat-number { color: #465271; font-size: 31rpx; font-weight: 760; }.stat-label { margin-top: 5rpx; color: #9aa5b6; font-size: 18rpx; }.stat-divider { width: 1rpx; height: 42rpx; flex: 0 0 auto; background: #eef0f4; }
.relationship-note { display: flex; align-items: center; gap: 11rpx; margin: 0 24rpx 20rpx; padding: 15rpx; border: 1rpx solid #e2e6fa; border-radius: 18rpx; background: linear-gradient(135deg,#f4f5ff,#fff); }.note-mark { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; flex: 0 0 auto; border-radius: 15rpx; background: #e8eaff; }.note-mark image { width: 26rpx; height: 26rpx; opacity: .7; }.note-copy { min-width: 0; flex: 1; }.note-title, .note-desc { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.note-title { color: #5968c8; font-size: 19rpx; font-weight: 700; }.note-desc { margin-top: 5rpx; color: #9ba6bd; font-size: 17rpx; }
.referral-card { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; margin: 0 24rpx 20rpx; padding: 16rpx 17rpx; border: 1rpx solid #DED5C4; border-radius: 9rpx; background: #FCFAF6; }.referral-copy { min-width: 0; flex: 1; }.referral-kicker,.referral-title,.referral-desc { display: block; }.referral-kicker { color: #97846A; font: 700 14rpx/1.2 monospace; letter-spacing: .09em; }.referral-title { margin-top: 6rpx; color: #473D32; font-size: 22rpx; font-weight: 720; }.referral-desc { overflow: hidden; margin-top: 5rpx; color: #8B8378; font-size: 16rpx; text-overflow: ellipsis; white-space: nowrap; }.referral-action { padding: 9rpx 11rpx; border: 1rpx solid #69574A; border-radius: 5rpx; color: #69574A; font-size: 18rpx; white-space: nowrap; }
.trust-ledger { margin: 0 24rpx 20rpx; padding: 18rpx; border-top: 1rpx solid rgba(42,37,31,.16); border-bottom: 1rpx solid rgba(42,37,31,.1); background: #FAF8F3; }.trust-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 14rpx; }.trust-kicker,.trust-title { display: block; }.trust-kicker { color: #91897F; font: 700 15rpx/1.2 monospace; letter-spacing: .1em; }.trust-title { margin-top: 6rpx; color: #3F3932; font-size: 26rpx; font-weight: 720; }.trust-state { padding: 5rpx 8rpx; border: 1rpx solid #DDD7CC; border-radius: 4rpx; color: #8A8177; font-size: 16rpx; white-space: nowrap; }.trust-state.verified { border-color: rgba(65,70,60,.24); color: #41463C; background: #EDF0E9; }.trust-grid { display: flex; margin-top: 16rpx; }.trust-item { display: flex; min-width: 0; flex: 1; flex-direction: column; padding: 0 12rpx; border-left: 1rpx solid rgba(42,37,31,.1); }.trust-item:first-child { padding-left: 0; border-left: 0; }.trust-item text:first-child { color: #4A3934; font-size: 29rpx; font-weight: 700; font-variant-numeric: tabular-nums; }.trust-item text:last-child { margin-top: 4rpx; color: #968E84; font-size: 16rpx; }.trust-empty { display: block; margin-top: 14rpx; color: #968E84; font-size: 18rpx; line-height: 1.55; }
.profile-tabs { display: flex; gap: 26rpx; margin: 0 24rpx 17rpx; border-bottom: 1rpx solid #e7ebf2; }.profile-tabs > text { position: relative; padding-bottom: 12rpx; color: #9aa5b6; font-size: 22rpx; }.profile-tabs > text.active { color: #5968d8; font-weight: 750; }.profile-tabs > text.active::after { position: absolute; right: 0; bottom: -1rpx; left: 0; height: 4rpx; border-radius: 3rpx; background: #6573dc; content: ''; }.tab-count { margin-left: 4rpx; color: inherit; font-size: 17rpx; }
.content-section { margin: 0 24rpx; }.section-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 13rpx; }.section-eyebrow { display: block; color: #a0aabd; font: 700 16rpx/1.2 monospace; letter-spacing: .08em; }.section-title { display: block; margin-top: 7rpx; color: #3b4864; font-size: 29rpx; font-weight: 760; }.section-hint { color: #a0aabd; font-size: 17rpx; }.content-list { display: flex; flex-direction: column; gap: 11rpx; }.content-card, .review-card { padding: 17rpx; border: 1rpx solid #e8ebf2; border-radius: 19rpx; background: #fff; }.content-text, .content-title { display: block; color: #4d5972; font-size: 22rpx; line-height: 1.55; }.content-title { font-size: 23rpx; font-weight: 700; }.content-meta { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; margin-top: 13rpx; color: #a0aabd; font-size: 17rpx; }.content-tag { padding: 5rpx 8rpx; border-radius: 7rpx; color: #2f9b82; background: #e8f7f2; font-size: 16rpx; }.content-tag.demand { color: #6573dc; background: #eef0ff; }
.review-card { margin-bottom: 11rpx; }.review-top { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }.reviewer { color: #53607a; font-size: 20rpx; font-weight: 700; }.review-stars { color: #d69738; font-size: 18rpx; letter-spacing: 2rpx; }.review-content { display: block; margin-top: 9rpx; color: #6f7b91; font-size: 19rpx; line-height: 1.55; }.review-tags { display: flex; flex-wrap: wrap; gap: 7rpx; margin-top: 10rpx; }.review-tags text { padding: 5rpx 8rpx; border-radius: 7rpx; color: #2f9b82; background: #e8f7f2; font-size: 15rpx; }
.empty-card { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 230rpx; padding: 30rpx 18rpx; border: 1rpx dashed #dfe4ed; border-radius: 21rpx; color: #9aa5b6; background: rgba(255,255,255,.68); font-size: 20rpx; text-align: center; }.empty-card image { width: 45rpx; height: 45rpx; margin-bottom: 13rpx; opacity: .42; }.empty-hint { margin-top: 7rpx; color: #b0b8c6; font-size: 17rpx; }.profile-footnote { margin: 24rpx; color: #b0b8c6; font-size: 16rpx; line-height: 1.5; text-align: center; }
.intro-mask { position: fixed; z-index: 30; inset: 0; display: flex; align-items: flex-end; background: rgba(31,27,22,.42); }.intro-sheet { width: 100%; padding: 28rpx 24rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 12rpx 12rpx 0 0; background: #FCFBF8; box-sizing: border-box; }.intro-kicker { display: block; color: #8A8177; font: 700 15rpx/1.2 monospace; letter-spacing: .1em; }.intro-title { display: block; margin-top: 8rpx; color: #302B26; font-family: Georgia, 'Times New Roman', serif; font-size: 29rpx; font-weight: 500; }.intro-input { width: 100%; min-height: 132rpx; margin-top: 20rpx; padding: 15rpx; border: 1rpx solid #DAD3C8; border-radius: 5rpx; color: #39342E; background: #FAF8F3; font-size: 21rpx; line-height: 1.55; box-sizing: border-box; }.intro-actions { display: flex; gap: 10rpx; margin-top: 18rpx; }.intro-cancel,.intro-send { flex: 1; padding: 14rpx; border: 1rpx solid #D9D2C8; border-radius: 5rpx; color: #6F675E; font-size: 21rpx; text-align: center; }.intro-send { border-color: #342F29; color: #F8F5EE; background: #342F29; }.intro-send.disabled { opacity: .5; }
.connector-options { display: flex; flex-wrap: wrap; gap: 9rpx; margin-top: 18rpx; }.connector-option { padding: 8rpx 11rpx; border: 1rpx solid #DDD6CB; border-radius: 5rpx; color: #766E65; background: #FAF8F3; font-size: 18rpx; }.connector-option.selected { border-color: #69574A; color: #453B32; background: #F0EAE0; }
@keyframes spin { to { transform: rotate(360deg); } }
/* Overflow guard: public profile data and relationship sheets must respect the narrow shell. */
.page,
.profile-hero,
.profile-main,
.profile-copy,
.profile-actions,
.profile-stats,
.relationship-note,
.referral-card,
.trust-ledger,
.trust-heading,
.profile-tabs,
.content-section,
.section-heading,
.content-card,
.review-card,
.intro-sheet,
.intro-actions { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { overflow-x: hidden; }
.profile-copy,
.note-copy,
.referral-copy,
.section-heading > view:first-child { flex: 1 1 auto; min-width: 0; overflow: hidden; }
.profile-actions { flex-wrap: wrap; }
.follow-action,
.connect-action,
.referral-action,
.trust-state,
.section-hint { flex: 0 0 auto; white-space: nowrap; }
.profile-stats > view:not(.stat-divider),
.trust-item { min-width: 0; overflow: hidden; }
.relationship-note,
.referral-card,
.trust-heading,
.section-heading,
.content-meta,
.review-top,
.intro-actions { gap: 10rpx; }
.nickname,
.company,
.title,
.bio,
.note-title,
.note-desc,
.referral-title,
.referral-desc,
.trust-title,
.section-title,
.content-text,
.content-title,
.reviewer,
.review-content,
.profile-footnote { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.intro-sheet { overflow-x: hidden; }
.profile-stats,
.relationship-note,
.referral-card,
.trust-ledger,
.profile-tabs,
.content-section { width: auto; }

@media (max-width: 420px) {
  .profile-hero { padding-right: 18rpx; padding-left: 18rpx; }
  .profile-actions { gap: 8rpx; }
  .follow-action,
  .connect-action { padding-right: 12rpx; padding-left: 12rpx; }
  .profile-stats,
  .relationship-note,
  .referral-card,
  .trust-ledger,
  .profile-tabs,
  .content-section { margin-right: 18rpx; margin-left: 18rpx; }
  .intro-sheet { padding-right: 18rpx; padding-left: 18rpx; }
}
</style>
