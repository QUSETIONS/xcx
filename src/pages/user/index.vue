<template>
  <view v-if="loadState === 'loading'" class="page-state">
    <view class="state-spinner" /><text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
    <view class="page-state-icon">!</view><text>{{ t('common.loadFailed') }}</text><text class="page-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="page account-page" :style="a11yStyle">
    <view class="header">
      <view>
        <text class="account-index">ACCOUNT / PROFILE</text>
        <text class="page-kicker">我的档案</text>
        <text class="page-title">{{ userInfo.nickname || t('user.defaultNickname') }}</text>
        <text class="page-subtitle">{{ userInfo.company || '先补全资料，再开始匹配' }}</text>
      </view>
      <view class="avatar-box"><text>{{ userInitial }}</text></view>
    </view>

    <view class="identity-summary">
      <view class="identity-summary-main">
        <text class="identity-summary-label">当前工作身份</text>
        <text class="identity-summary-title">{{ workflowRoleLabel }}</text>
        <text class="identity-summary-desc">{{ organizationTypeLabel }} · {{ userInfo.title || '职位待补充' }} · {{ userInfo.city || '城市待补充' }}</text>
      </view>
      <text class="identity-summary-action" @tap="goProfile">编辑 ›</text>
    </view>

    <view class="profile-completion card-press" @tap="goProfile">
      <view class="completion-ring"><text>{{ profileCompletion }}%</text></view>
      <view class="completion-copy"><text class="completion-title">把资料补完整，匹配会更准</text><text class="completion-desc">{{ profileCompletion >= 100 ? '档案已具备基础匹配条件' : '补充公司、职位、城市和身份信息' }}</text></view>
      <text class="completion-arrow">›</text>
    </view>

    <view class="access-card card-press" @tap="goMember">
      <view class="access-card-top"><text class="access-kicker">MEMBERSHIP / ACCESS</text><text class="access-arrow">↗</text></view>
      <view class="access-card-main"><text class="access-tier">{{ memberTierLabel }}</text><text class="access-copy">{{ accessCopy }}</text></view>
      <view class="access-card-stats">
        <view><text>{{ credit.score || 0 }}</text><text>信用分</text></view>
        <view><text>{{ userInfo.usage_credits || 0 }}</text><text>AI 次数</text></view>
        <view><text>{{ credit.level || '基础' }}</text><text>当前等级</text></view>
      </view>
    </view>

    <view class="intake-entry card-press" @tap="goIntake">
      <view class="entry-mark">IN</view>
      <view class="entry-copy"><text class="entry-title">{{ intakeProfile ? '继续完善内测档案' : '填写内测档案' }}</text><text class="entry-desc">{{ intakeStatusText }}</text></view>
      <text class="entry-action">{{ intakeProfile ? '查看' : '开始' }} ›</text>
    </view>

    <view class="work-entry network-entry card-press" @tap="goNetwork">
      <view class="work-entry-icon"><image src="/static/icons/users.svg" mode="aspectFit" /></view>
      <view class="work-entry-copy"><text class="work-entry-title">人脉圈</text><text class="work-entry-desc">按城市和身份找到值得交流的人</text></view>
      <text class="work-entry-action">{{ networkJoinedCount }} 个社群 ›</text>
    </view>

    <view class="work-entry provider-entry card-press" @tap="goProviderOnboard">
      <view class="work-entry-icon"><image src="/static/icons/handshake.svg" mode="aspectFit" /></view>
      <view class="work-entry-copy"><text class="work-entry-title">{{ isProvider ? '管理服务方档案' : '成为服务商' }}</text><text class="work-entry-desc">{{ isProvider ? providerStatusText : '提交服务能力，让合适的需求找到你' }}</text></view>
      <text class="work-entry-action">{{ isProvider ? '进入' : '申请' }} ›</text>
    </view>

    <view class="dashboard-entry card-press" @tap="goDashboard">
      <view class="dashboard-copy"><text class="entry-kicker">DATA / DASHBOARD</text><text class="dashboard-title">数据看板</text><text class="dashboard-desc">查看需求、对接和平台使用情况</text></view>
      <image src="/static/icons/dashboard.svg" mode="aspectFit" /><text class="dashboard-arrow">↗</text>
    </view>

    <view v-if="referralRewards.length || Number(userInfo.usage_credits || 0) > 0" class="invite-entry" @tap="goIntake">
      <text class="invite-mark">礼</text><view><text class="invite-title">邀请权益</text><text class="invite-desc">{{ referralRewardText }}</text></view><text class="invite-arrow">›</text>
    </view>

    <view v-if="isAdmin" class="admin-entry" @tap="goAdmin"><text>运营后台</text><text>进入 ›</text></view>
    <view style="height: 130rpx" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useUserStore } from '@/stores/user'
import { t } from '@/i18n'
import { a11yStyle } from '@/utils/accessibility'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useRequest } from '@/hooks/useRequest'
import { toastError } from '@/utils/feedback'

useNavTitle('titles.me')

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo || {})
const isAdmin = computed(() => userStore.isAdmin)
const isProvider = computed(() => userInfo.value.account_type === 'provider' || userInfo.value.role === 'provider' || Boolean(userInfo.value.provider_id))
const workflowRoleLabel = computed(() => userInfo.value.workflow_role === 'service_provider' ? '乙方视角 / 寻找项目' : '甲方视角 / 发布需求')
const organizationTypeLabel = computed(() => userInfo.value.organization_type === 'capital' ? '资金 / 投资机构' : '项目 / 企业方')
const memberTierLabel = computed(() => ({ free: '基础体验', pro: '专业会员', enterprise: '企业会员' }[userInfo.value.member_tier] || '基础体验'))
const accessCopy = computed(() => userInfo.value.workflow_role === 'service_provider' ? '可用 AI 匹配项目并管理接单权限' : '可用 AI 梳理需求并发起合作')
const userInitial = computed(() => String(userInfo.value.nickname || '我').trim().slice(0, 1) || '我')
const profileCompletion = computed(() => {
  const fields = [userInfo.value.nickname, userInfo.value.company, userInfo.value.title, userInfo.value.city, userInfo.value.workflow_role, userInfo.value.organization_type]
  return Math.round(fields.filter((item) => String(item || '').trim()).length / fields.length * 100)
})
const providerStatusText = computed(() => ({ pending: '资料已提交，等待运营审核', verified: '已认证，可接收匹配邀约', rejected: '资料需要补充，点击重新提交' }[userInfo.value.verify_status] || '服务方资料已建立'))
const myDemandsCount = ref(0)
const myLeadsCount = ref(0)
const myFavoritesCount = ref(0)
const credit = ref({ score: 0, level: '', deals: 0, reviews: 0 })
const pointsBalance = ref(0)
const couponCount = ref(0)
const followCount = ref(0)
const networkJoinedCount = ref(0)
const intakeProfile = ref(null)
const referralRewards = ref([])
const referralRewardText = computed(() => {
  const values = referralRewards.value.map((item) => item.display || item.label).filter(Boolean)
  return values.length ? values.join('、') : `内测体验次数 ${Number(userInfo.value.usage_credits || 0)} 次`
})
const intakeStatusText = computed(() => ({
  draft: '草稿已保存，继续补充项目或资金方信息',
  submitted: '资料已提交，等待平台基础审核',
  reviewing: '运营正在审核，结果会在消息中心通知',
  needs_more: '需要补充资料，打开查看审核说明',
  approved: '已通过审核，可按授权范围参与匹配',
  rejected: '资料需要重新整理，打开查看说明'
}[intakeProfile.value?.status] || '按身份填写甲方资金方 / 乙方项目企业档案'))

async function fetchOverview() {
  if (!userStore.token) {
    const ready = await userStore.ensureLogin()
    if (!ready && !userStore.isLoggedIn) {
      uni.reLaunch({ url: '/pages/user/login' })
      return { demands: {}, leads: {}, inbox: {}, favorites: {}, creditScore: {}, points: {}, coupon: 0, follow: 0, network: null, intake: null }
    }
  }
  await userStore.refreshInfo()
  const [demands, leads, inbox, favorites, creditScore, points, coupon, follow, network, intake] = await Promise.all([
    bridge.demand.myDemands(),
    bridge.lead.myLeads(),
    bridge.lead.inbox(),
    bridge.favorite.list(),
    bridge.review.userCreditScore(),
    bridge.points.getInfo(),
    bridge.coupon.available(),
    bridge.follow.count(),
    bridge.network.overview().catch(() => null),
    bridge.intake.mine().catch(() => null)
  ])
  return { demands, leads, inbox, favorites, creditScore, points, coupon, follow, network, intake }
}

const { state: loadState, run: loadRequest } = useRequest(fetchOverview)

async function reload() {
  try {
    const data = await loadRequest()
    myDemandsCount.value = data.demands?.total || 0
    myLeadsCount.value = data.inbox?.total || data.leads?.total || 0
    myFavoritesCount.value = data.favorites?.total || 0
    credit.value = data.creditScore || { score: 0, level: '', deals: 0, reviews: 0 }
    pointsBalance.value = data.points?.balance || 0
    couponCount.value = data.coupon || 0
    followCount.value = data.follow || 0
    networkJoinedCount.value = data.network?.stats?.joined_groups || 0
    intakeProfile.value = data.intake?.profile || null
    referralRewards.value = data.intake?.referral_rewards || []
  } catch (error) {
    toastError(error?.message || t('common.loadFailed'))
  }
}

function goProfile() { uni.navigateTo({ url: '/pages/user/profile' }) }
function goIntake() { uni.navigateTo({ url: '/pages/intake/index' }) }
function goMember() { uni.navigateTo({ url: '/pages/member/index' }) }
function goNetwork() { uni.switchTab({ url: '/pages/network/index' }) }
function goProviderOnboard() { uni.navigateTo({ url: '/pages/provider/onboard' }) }
function goDashboard() { uni.navigateTo({ url: '/pages/dashboard/index' }) }
function goAdmin() { uni.navigateTo({ url: '/pages/admin/index' }) }

onShow(reload)

// 这些状态仍由后端读取，供看板与后续账户子页继续使用，不在“我的”重复堆叠入口。
void myDemandsCount
void myLeadsCount
void myFavoritesCount
void pointsBalance
void couponCount
void followCount
</script>

<style scoped lang="scss">
.page { box-sizing: border-box; min-height: 100vh; padding: 28rpx 36rpx 0; overflow: hidden; color: #25231f; background: #f7f6f2; }
.page-state { display: flex; min-height: 100vh; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: #8a847b; }
.state-spinner { width: 42rpx; height: 42rpx; border: 3rpx solid #e5ded4; border-top-color: #5c2828; border-radius: 50%; animation: spin .9s linear infinite; }
.page-state-icon { display: flex; align-items: center; justify-content: center; width: 68rpx; height: 68rpx; border-radius: 50%; color: #8a5146; background: #f0e5df; font-size: 28rpx; }
.page-state-action { color: #5c2828; }
.header { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 30rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .1); }
.account-index, .page-kicker, .entry-kicker, .access-kicker { display: block; color: #8a847b; font: 500 14rpx/1.2 ui-monospace, monospace; letter-spacing: .12em; }
.page-kicker { margin-top: 20rpx; font-family: inherit; letter-spacing: .04em; }
.page-title { display: block; margin-top: 8rpx; color: #191816; font: 400 44rpx/1.2 'Songti SC', serif; }
.page-subtitle { display: block; margin-top: 8rpx; color: #8a847b; font-size: 19rpx; }
.avatar-box { display: flex; width: 70rpx; height: 70rpx; align-items: center; justify-content: center; border: 1rpx solid rgba(92, 40, 40, .18); border-radius: 4rpx; color: #5c2828; background: #f0e5df; font: 400 28rpx/1 Georgia, serif; }
.identity-summary { display: flex; align-items: flex-end; justify-content: space-between; gap: 18rpx; padding: 30rpx 0 24rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .09); }
.identity-summary-main { min-width: 0; }
.identity-summary-label { display: block; color: #8a847b; font-size: 17rpx; }
.identity-summary-title { display: block; margin-top: 9rpx; color: #25231f; font: 500 27rpx/1.3 'Songti SC', serif; }
.identity-summary-desc { display: block; margin-top: 7rpx; overflow: hidden; color: #8a847b; font-size: 18rpx; text-overflow: ellipsis; white-space: nowrap; }
.identity-summary-action { flex: 0 0 auto; color: #5c2828; font-size: 18rpx; }
.profile-completion { display: flex; align-items: center; gap: 16rpx; padding: 24rpx 0; border-bottom: 1rpx solid rgba(30, 27, 22, .09); }
.completion-ring { display: flex; width: 58rpx; height: 58rpx; flex: 0 0 58rpx; align-items: center; justify-content: center; border: 1rpx solid #b49460; border-radius: 50%; color: #69574a; font: 500 16rpx/1 Georgia, serif; }
.completion-copy { min-width: 0; flex: 1; }
.completion-title, .completion-desc { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.completion-title { color: #3a342e; font-size: 21rpx; }
.completion-desc { margin-top: 6rpx; color: #8a847b; font-size: 17rpx; }
.completion-arrow { color: #5c2828; font-size: 28rpx; }
.access-card { margin: 32rpx 0 0; padding: 24rpx; border: 1rpx solid rgba(180, 148, 96, .28); border-left: 4rpx solid #b49460; border-radius: 6rpx; color: #fcfbf8; background: #25231f; }
.access-card-top, .access-card-main, .access-card-stats { display: flex; align-items: center; justify-content: space-between; }
.access-card-top, .access-card-main, .access-card-stats, .access-card-stats view { min-width: 0; }
.access-kicker { color: rgba(252, 251, 248, .58); }
.access-arrow { color: #d5b47d; font-size: 27rpx; }
.access-card-main { align-items: flex-end; margin-top: 22rpx; gap: 14rpx; }
.access-tier { font: 400 30rpx/1.1 'Songti SC', serif; }
.access-copy { min-width: 0; flex: 1; overflow: hidden; color: rgba(252, 251, 248, .62); font-size: 17rpx; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.access-card-stats { margin-top: 25rpx; padding-top: 17rpx; border-top: 1rpx solid rgba(252, 251, 248, .15); }
.access-card-stats view { display: flex; flex-direction: column; gap: 5rpx; }
.access-card-stats view text:first-child { font: 400 25rpx/1 Georgia, serif; }
.access-card-stats view text:last-child { color: rgba(252, 251, 248, .54); font-size: 16rpx; }
.intake-entry, .work-entry, .dashboard-entry, .invite-entry, .admin-entry { display: flex; align-items: center; gap: 15rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .09); }
.intake-entry { padding: 24rpx 0; }
.entry-mark, .work-entry-icon, .invite-mark { display: flex; width: 54rpx; height: 54rpx; flex: 0 0 54rpx; align-items: center; justify-content: center; border-radius: 4rpx; color: #5c2828; background: #f0eee8; font: 500 17rpx/1 Georgia, serif; }
.entry-copy, .work-entry-copy { min-width: 0; flex: 1; }
.entry-title, .entry-desc, .work-entry-title, .work-entry-desc, .invite-title, .invite-desc { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.entry-title, .work-entry-title, .invite-title { color: #3a342e; font-size: 22rpx; }
.entry-desc, .work-entry-desc, .invite-desc { margin-top: 6rpx; color: #8a847b; font-size: 17rpx; }
.entry-action, .work-entry-action, .invite-arrow { flex: 0 0 auto; color: #5c2828; font-size: 17rpx; }
.work-entry { padding: 22rpx 0; }
.work-entry-icon { background: #f0eee8; }
.work-entry-icon image { width: 30rpx; height: 30rpx; opacity: .65; }
.dashboard-entry { position: relative; padding: 26rpx 0; }
.dashboard-copy { min-width: 0; flex: 1; }
.dashboard-title { display: block; margin-top: 9rpx; color: #25231f; font: 500 29rpx/1.2 'Songti SC', serif; }
.dashboard-desc { display: block; margin-top: 7rpx; color: #8a847b; font-size: 17rpx; }
.dashboard-entry > image { width: 34rpx; height: 34rpx; opacity: .58; }
.dashboard-arrow { color: #5c2828; font-size: 27rpx; }
.invite-entry { padding: 20rpx 0; }
.invite-mark { color: #8a653c; }
.admin-entry { justify-content: space-between; padding: 22rpx 0; color: #8a847b; font-size: 18rpx; }
.admin-entry text:last-child { color: #5c2828; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .state-spinner { animation: none; } }
@media (max-width: 420px) { .page { padding-right: 28rpx; padding-left: 28rpx; }.access-card { padding: 20rpx; }.access-card-main { align-items: flex-start; flex-direction: column; gap: 6rpx; }.access-copy { width: 100%; font-size: 16rpx; text-align: left; }.access-card-stats { margin-top: 18rpx; }.page-title { font-size: 40rpx; } }
</style>
