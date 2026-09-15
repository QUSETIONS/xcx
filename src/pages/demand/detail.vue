<template>
  <view v-if="detailState === 'loading'" class="detail-state"><text>正在加载需求…</text></view>

  <view v-else-if="detailState === 'error'" class="detail-state error-state" @tap="reload">
    <image class="detail-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>需求加载失败，点击重试</text>
  </view>

  <view class="page" v-else-if="demand">
    <!-- 顶部信息 -->
    <view class="hero-card decision-hero">
      <text class="decision-eyebrow">PROJECT BRIEF</text>
      <view class="hero-tags">
        <text class="tag-cat">{{ categoryName(demand.category_id, demand.category_name) }}</text>
        <text class="tag-quote">{{ formatQuote(demand.quote_type) }}</text>
        <text class="tag-status" :class="'status-' + demand.status" v-if="demand.status && demand.status !== 'published'">{{ demandStatusMap[demand.status] || demand.status }}</text>
        <text class="tag-hot" v-if="demand.view_count > 1000">{{ t('demandDetail.hot') }}</text>
      </view>
      <text class="hero-title">{{ demand.title }}</text>
      <view class="hero-company">
        <text class="hero-name">{{ companyName(demand.company_name) }}</text>
        <text class="hero-region">{{ regionName(demand.region) }}</text>
      </view>
    </view>

    <view class="decision-stage-line">
      <view v-for="stage in decisionStages" :key="stage.id" class="decision-stage" :class="{ complete: stage.index < decisionStageIndex, active: stage.index === decisionStageIndex }">
        <text class="decision-stage-index">{{ stage.index + 1 }}</text>
        <view><text>{{ stage.title }}</text><text>{{ stage.copy }}</text></view>
      </view>
    </view>

    <view class="review-notice" v-if="demand.status === 'pending'">
      <text class="review-notice-title">审核中的需求</text>
      <text class="review-notice-text">内容已经提交，审核通过后会在需求大厅展示，并开放对接申请。</text>
    </view>

    <view class="decision-brief">
      <view class="decision-brief-head"><view><text class="card-label">NEED SUMMARY</text><text class="decision-brief-title">先看清这次合作的边界</text></view><text class="decision-brief-state">{{ decisionStageCopy }}</text></view>
      <view class="decision-fact-grid">
        <view><text>预算方式</text><text>{{ budgetLabel(demand) }}</text></view>
        <view><text>合作地区</text><text>{{ regionName(demand.region) || '待沟通' }}</text></view>
        <view><text>有效期至</text><text>{{ formatDate(demand.expire_time) || '长期有效' }}</text></view>
      </view>
      <text class="decision-description">{{ displayDemandDescription(demand) }}</text>
      <view class="decision-evidence">
        <view><text>{{ demand.view_count }}</text><text>{{ t('demandDetail.views') }}</text></view>
        <view><text>{{ demand.lead_count }}</text><text>{{ t('demandDetail.leads') }}</text></view>
        <view><text>{{ demand.favorite_count }}</text><text>{{ t('demandDetail.favorites') }}</text></view>
        <view><text>{{ getHeat() }}%</text><text>{{ t('demandDetail.heatIndex') }}</text></view>
      </view>
    </view>

    <!-- 发布后的需求自动挂载 Agent：乙方可先了解公开上下文，再决定是否申请联系。 -->
    <view v-if="demand.status === 'published'" class="demand-agent-card">
      <view class="demand-agent-card-head">
        <view><text class="demand-agent-kicker">DEMAND AGENT</text><text class="demand-agent-title">先和需求 Agent 交流</text></view>
        <text class="demand-agent-status">在线</text>
      </view>
      <text class="demand-agent-desc">围绕公开的项目背景、合作地区和边界继续提问，甲方的需求上下文会保留在这段对话里。</text>
      <view class="demand-agent-context"><text>公开上下文</text><text>{{ regionName(demand.region) || '目标地区待沟通' }} · {{ categoryName(demand.category_id, demand.category_name) }}</text></view>
      <view class="demand-agent-button" @tap="goDemandAgent">进入需求对话 <text>→</text></view>
    </view>

    <!-- 相似需求 -->
    <view class="card" v-if="similarDemands.length">
      <text class="card-label">{{ t('demandDetail.similar') }}</text>
      <view class="similar-list">
        <view class="similar-item card-press" v-for="item in similarDemands" :key="item._id" @tap="goDetail(item._id)">
          <text class="similar-title">{{ item.title }}</text>
          <text class="similar-company">{{ companyName(item.company_name) }}</text>
        </view>
      </view>
    </view>

    <!-- 匹配到的服务方 -->
    <view class="card provider-directory" v-if="!isServiceProvider && matchedProviders.length">
      <view class="directory-head"><view><text class="card-label">MATCHED PARTNERS</text><text class="directory-title">可进一步了解的合作方</text></view><text>{{ matchedProviders.length }} 个结果</text></view>
      <view class="provider-list">
        <view class="provider-item card-press" v-for="(item, idx) in matchedProviders" :key="item._id" @tap="openProvider(item)">
          <view class="provider-rank">{{ idx + 1 }}</view>
          <view class="provider-info">
            <view class="provider-name-row">
              <text class="provider-name">{{ item.name }}</text>
              <text class="provider-match">{{ item.match_percent }}</text>
            </view>
            <text class="provider-desc">{{ categoryName(item.category_id, item.category_name) }} · {{ item.rating }} 分 · {{ item.deal_count }}{{ t('demandDetail.orderUnit') }}</text>
            <view class="provider-match-reasons" v-if="item.match_reasons && item.match_reasons.length">
              <text class="provider-reason" v-for="(reason, i) in item.match_reasons.slice(0, 3)" :key="i">{{ reason }}</text>
            </view>
            <view class="provider-tags">
              <text class="provider-tag" v-for="(tag, i) in item.tags" :key="i">{{ tag }}</text>
            </view>
            <view class="provider-action"><text>查看服务方主页</text><text>→</text></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 多团队提案比较池：只有需求发布者看到，浏览不会直接记成正式对接 -->
    <view class="card proposal-card" v-if="isDemandOwner && demand.status === 'published'">
      <view class="proposal-header">
        <view>
          <text class="card-label">DECISION DESK</text>
          <text class="proposal-subtitle">先比较已收到的方案，再决定是否建立项目协作。</text>
        </view>
        <text class="proposal-pending">{{ proposalDecisionCopy }}</text>
      </view>
      <view v-if="quotedProposals.length" class="proposal-compare-toggle" @tap="showProposalCompare = !showProposalCompare">
        <view><text class="proposal-compare-kicker">DECISION VIEW</text><text>{{ showProposalCompare ? '收起横向比较' : `横向比较 ${quotedProposals.length} 份已报价方案` }}</text></view>
        <text class="proposal-compare-arrow">{{ showProposalCompare ? '−' : '→' }}</text>
      </view>
      <scroll-view v-if="showProposalCompare" class="proposal-compare-scroll" scroll-x>
        <view class="proposal-compare-table" :style="{ width: `${190 + quotedProposals.length * 250}rpx` }">
          <view class="compare-table-row compare-table-header"><text class="compare-label">比较项</text><view v-for="item in quotedProposals" :key="`head-${item._id}`" class="compare-value compare-team"><text class="compare-team-name">{{ item.provider?.name || '服务团队' }}</text><text>{{ item.proposal_score }} 分</text></view></view>
          <view class="compare-table-row"><text class="compare-label">匹配程度</text><text v-for="item in quotedProposals" :key="`match-${item._id}`" class="compare-value">{{ item.match_percent || '—' }}</text></view>
          <view class="compare-table-row"><text class="compare-label">方案报价</text><text v-for="item in quotedProposals" :key="`quote-${item._id}`" class="compare-value">{{ proposalQuote(item) }}</text></view>
          <view class="compare-table-row"><text class="compare-label">预计周期</text><text v-for="item in quotedProposals" :key="`cycle-${item._id}`" class="compare-value">{{ item.estimated_days ? `${item.estimated_days} 天` : '待沟通' }}</text></view>
          <view class="compare-table-row"><text class="compare-label">信誉与履约</text><text v-for="item in quotedProposals" :key="`trust-${item._id}`" class="compare-value">{{ proposalTrust(item) }}</text></view>
          <view class="compare-table-row"><text class="compare-label">核心交付</text><text v-for="item in quotedProposals" :key="`delivery-${item._id}`" class="compare-value compare-delivery">{{ proposalDelivery(item) }}</text></view>
          <view class="compare-table-row compare-table-action"><text class="compare-label">下一步</text><view v-for="item in quotedProposals" :key="`action-${item._id}`" class="compare-value"><button class="compare-accept" @tap="acceptProposal(item)">选定并进入协作室</button></view></view>
        </view>
      </scroll-view>
      <view v-if="proposalLoading" class="proposal-loading"><text>正在同步提案…</text></view>
      <view v-else-if="proposalPool.list.length" class="proposal-list">
        <view class="proposal-item" v-for="item in proposalPool.list" :key="item._id">
          <view class="proposal-item-head">
            <view class="proposal-provider">
              <view class="proposal-avatar"><text>{{ proposalInitial(item.provider?.name) }}</text></view>
              <view class="proposal-provider-copy"><text class="proposal-provider-name">{{ item.provider?.name || '服务团队' }}</text><text class="proposal-provider-meta">{{ proposalStatusLabel(item.status) }} · 匹配 {{ item.match_percent }}</text></view>
            </view>
            <view class="proposal-score"><text>{{ item.proposal_score }}</text><text>方案分</text></view>
          </view>
          <view class="proposal-reasons"><text v-for="reason in item.proposal_score_reasons?.slice(0, 3)" :key="reason">{{ reason }}</text></view>
          <view v-if="item.status === 'quoted'" class="proposal-quote"><text class="proposal-quote-price">¥{{ item.quote_amount || '待沟通' }}</text><text v-if="item.estimated_days">预计 {{ item.estimated_days }} 天</text></view>
          <text v-if="item.provider_message" class="proposal-message">{{ item.provider_message }}</text>
          <view v-if="item.milestones?.length" class="proposal-milestones">
            <text class="proposal-milestones-label">交付计划</text>
            <view v-for="(milestone, index) in item.milestones" :key="`${item._id}-${index}`" class="proposal-milestone">
              <text><text class="proposal-milestone-index">{{ index + 1 }}</text>{{ milestone.title }}</text>
              <text v-if="milestone.amount" class="proposal-milestone-amount">¥{{ milestone.amount }}</text>
            </view>
          </view>
          <view class="proposal-actions-row">
            <button v-if="item.status === 'quoted'" class="proposal-accept" @tap="acceptProposal(item)">选定并进入协作室</button>
            <button v-if="item.status === 'accepted' && item.deal_id" class="proposal-workspace" @tap="openProposalWorkspace(item)">进入项目协作室</button>
            <button v-if="['invited', 'viewed', 'quoted'].includes(item.status)" class="proposal-close" @tap="closeProposal(item)">暂不考虑</button>
            <text v-if="['invited', 'viewed'].includes(item.status)" class="proposal-waiting">等待团队提交方案</text>
          </view>
        </view>
      </view>
      <view v-else class="proposal-empty"><text>还没有发出邀请，可以先按条件找一轮团队。</text></view>
      <view class="proposal-footer-actions">
        <button class="proposal-invite" :disabled="invitingMatches" @tap="inviteMatches"><text>{{ invitingMatches ? '筛选中…' : '再找一轮团队' }}</text></button>
        <button class="proposal-edit" @tap="goAgentForDemand">重新描述需求</button>
      </view>
    </view>

    <!-- 用户评价 -->
    <view class="card review-section">
      <view class="review-header">
        <text class="card-label">{{ t('demandDetail.reviews') }}</text>
        <view class="review-summary">
          <text class="review-avg">{{ reviewAvg.avg }}</text>
          <text class="review-stars">{{ getStars(reviewAvg.avg) }}</text>
          <text class="review-count">{{ reviewAvg.count }}{{ t('demandDetail.reviewUnit') }}</text>
        </view>
      </view>
      <view class="review-list" v-if="reviews.length">
        <view class="review-item card-press" v-for="item in reviews" :key="item._id">
          <view class="review-top">
            <text class="reviewer-name">{{ item.reviewer?.nickname || t('demandDetail.anonymous') }}</text>
            <text class="review-stars">{{ getStars(item.rating) }}</text>
          </view>
          <text class="review-content">{{ item.content }}</text>
          <view class="review-tags" v-if="item.tags && item.tags.length">
            <text class="review-tag" v-for="(tag, i) in item.tags" :key="i">{{ tag }}</text>
          </view>
          <text class="review-time">{{ formatDate(item.created_at) }}</text>
        </view>
      </view>
      <view v-else class="review-empty"><text>{{ t('demandDetail.noReviews') }}</text></view>
    </view>

    <!-- 底部操作 -->
    <view class="action-bar">
      <view class="action-left">
        <view class="action-btn" @tap="toggleFavorite"><image class="action-icon" src="/static/icons/heart.svg" mode="aspectFit" /><text class="action-text">{{ isFavorited ? '已收藏' : t('demandDetail.favorite') }}</text></view>
        <view class="action-btn" @tap="share"><image class="action-icon" src="/static/icons/handshake.svg" mode="aspectFit" /><text class="action-text">{{ t('demandDetail.share') }}</text></view>
      </view>
      <button v-if="demand.status === 'published'" class="primary-btn" @tap="showLeadModal = true"><text>{{ t('demandDetail.connectNow') }}</text></button>
      <button v-else class="secondary-btn" @tap="goMyDemands"><text>查看我的需求</text></button>
    </view>

    <!-- 对接弹窗 -->
    <view v-if="showLeadModal" class="modal-mask" @tap="showLeadModal = false">
      <view class="modal-panel" @tap.stop>
        <text class="modal-title">{{ t('demandDetail.leadModal.title') }}</text>
        <view class="modal-body">
          <view class="form-row"><text class="form-label">{{ t('demandDetail.leadModal.name') }}</text><input class="form-input" v-model="leadForm.contact_name" :placeholder="t('demandDetail.leadModal.placeholder')" /></view>
          <view class="form-row"><text class="form-label">{{ t('demandDetail.leadModal.phone') }}</text><input class="form-input" type="number" v-model="leadForm.phone" :placeholder="t('demandDetail.leadModal.placeholder')" /></view>
          <view class="form-row"><text class="form-label">{{ t('demandDetail.leadModal.wechat') }}</text><input class="form-input" v-model="leadForm.wechat" :placeholder="t('demandDetail.leadModal.optional')" /></view>
          <view class="form-row"><text class="form-label">{{ t('demandDetail.leadModal.message') }}</text><textarea class="form-area" v-model="leadForm.message" :placeholder="t('demandDetail.leadModal.messagePlaceholder')" /></view>
        </view>
        <button class="primary-btn" @tap="submitLead" :disabled="submitting"><text>{{ submitting ? t('demandDetail.leadModal.submitting') : t('demandDetail.leadModal.submit') }}</text></button>
      </view>
    </view>
  </view>

  <view v-else class="empty"><image class="empty-icon" src="/static/icons/file.svg" mode="aspectFit" /><text>{{ t('demandDetail.notExist') }}</text></view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { quoteLabel, categoryName, regionName, companyName, demandStatusMap } from '@/utils/i18n-maps'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useUserStore } from '@/stores/user'
import { ENV } from '@/utils/env'
import { hasStoredAccessToken } from '@/utils/session'
import { t } from '@/i18n'
useNavTitle('titles.demandDetail')

const userStore = useUserStore()
const demandId = ref('')
const similarDemands = ref([])
const matchedProviders = ref([])
const reviews = ref([])
const reviewAvg = ref({ avg: 0, count: 0 })
const isFavorited = ref(false)
const proposalPool = ref({ list: [], total: 0, summary: { total: 0, pending: 0 } })
const proposalLoading = ref(false)
const invitingMatches = ref(false)
const showProposalCompare = ref(false)
const showLeadModal = ref(false)
const submitting = ref(false)
const leadForm = ref({ contact_name: '', phone: '', wechat: '', message: '' })
const proposalStatusMap = { invited: '已邀约', viewed: '已查看', quoted: '已报价', accepted: '已选中', declined: '已婉拒', closed: '已关闭', expired: '已过期', withdrawn: '已撤回' }

const isServiceProvider = computed(() => userStore.userInfo?.workflow_role === 'service_provider')
const isDemandOwner = computed(() => isOwner(demand.value))
const quotedProposals = computed(() => (proposalPool.value.list || [])
  .filter((item) => item.status === 'quoted')
  .slice()
  .sort((a, b) => Number(b.proposal_score || 0) - Number(a.proposal_score || 0)))
const acceptedProposal = computed(() => (proposalPool.value.list || []).find((item) => item.status === 'accepted') || null)
const demandOwnerDecisionStages = [
  { id: 'brief', index: 0, title: '需求确认', copy: '范围与合作条件明确' },
  { id: 'proposal', index: 1, title: '收集方案', copy: '邀请合适团队提交回应' },
  { id: 'selection', index: 2, title: '选择团队', copy: '并排比较报价与交付' },
  { id: 'workspace', index: 3, title: '项目协作', copy: '进入协作室持续推进' }
]
const serviceProviderDecisionStages = [
  { id: 'brief', index: 0, title: '了解需求', copy: '确认项目范围与公开条件' },
  { id: 'agent', index: 1, title: '询问 Agent', copy: '先确认合作城市与边界' },
  { id: 'contact', index: 2, title: '申请联系', copy: '双方确认是否继续对接' },
  { id: 'workspace', index: 3, title: '推进合作', copy: '进入协作室持续沟通' }
]
const decisionStages = computed(() => isServiceProvider.value ? serviceProviderDecisionStages : demandOwnerDecisionStages)
const decisionStageIndex = computed(() => {
  if (isServiceProvider.value) return demand.value?.status === 'published' ? 1 : 0
  if (acceptedProposal.value) return 3
  if (quotedProposals.value.length) return 2
  if (demand.value?.status === 'published') return 1
  return 0
})
const decisionStageCopy = computed(() => decisionStages[decisionStageIndex.value]?.title || '需求确认')
const proposalDecisionCopy = computed(() => {
  if (acceptedProposal.value) return '已选择团队'
  if (quotedProposals.value.length) return `${quotedProposals.value.length} 份可比较`
  const pending = Number(proposalPool.value.summary?.pending || 0)
  return pending ? `${pending} 个进行中` : '等待回应'
})

function formatQuote(type) { return quoteLabel(type) }
function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}` }
function budgetLabel(item) {
  if (item?.quote_type !== 'self') return formatQuote(item?.quote_type)
  const min = Number(item?.budget_min || 0) / 100
  const max = Number(item?.budget_max || 0) / 100
  if (min && max) return `¥${min.toLocaleString('zh-CN')}–${max.toLocaleString('zh-CN')}`
  return min || max ? `约 ¥${(min || max).toLocaleString('zh-CN')}` : '预算待沟通'
}
function getHeat() { return demand.value ? Math.min(100, Math.round((demand.value.view_count / 3000) * 100)) : 0 }
function getStars(rating) { const r = Math.round(rating); return '★'.repeat(r) + '☆'.repeat(5 - r) }
function displayDemandDescription(item) {
  const description = String(item?.description || '').trim()
  if (!description || description.includes('该项目仅用于演示资源对接流程') || description.includes('包含具体要求、时间节点和交付物标准')) {
    return '详情还没补全，先看看已有信息。'
  }
  return description
}

const { data: demand, state: detailState, run: loadRequest } = useRequest(loadDetail)

async function loadDetail(id) {
  const detail = await bridge.demand.detail(id)
  if (!detail) return null
  bridge.smart.trackBrowse('demand', id, detail)
  const proposalRequest = isOwner(detail) && detail.status === 'published'
    ? bridge.proposal.list(id).catch((error) => { console.warn('[demand-detail] proposal pool unavailable:', error); return null })
    : Promise.resolve(null)
  const currentUserId = getCurrentUserId()
  const favoriteRequest = currentUserId || hasStoredAccessToken()
    ? bridge.favorite.check({ userId: currentUserId, targetType: 'demand', targetId: id }).catch(() => false)
    : Promise.resolve(false)
  const providerRequest = isServiceProvider.value
    ? Promise.resolve([])
    : bridge.match.providers(detail)
  const [favoriteState, all, providers, reviewRes, average, proposals] = await Promise.all([
    favoriteRequest,
    bridge.demand.list({ pageSize: 100 }),
    providerRequest,
    bridge.review.list({ target_id: id, pageSize: 5 }),
    bridge.review.avgRating(id),
    proposalRequest
  ])
  isFavorited.value = favoriteState
  similarDemands.value = all.list
    .filter(d => d._id !== id && d.category_id === detail.category_id)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 3)
  matchedProviders.value = providers
  reviews.value = reviewRes.list
  reviewAvg.value = average
  if (proposals) proposalPool.value = proposals
  return detail
}

function getCurrentUserId() {
  if (userStore.userId) return String(userStore.userId)
  try {
    const stored = uni.getStorageSync('user') || uni.getStorageSync('user_store')
    const state = typeof stored === 'string' ? JSON.parse(stored) : stored
    const id = state?.userInfo?.id || state?.userInfo?.openid || state?.id
    if (id) return String(id)
  } catch {
    // 真实接口会在未登录时返回登录提示；Mock 环境保留本地演示收藏。
  }
  return ENV.USE_MOCK ? 'demo_user_001' : ''
}

function isOwner(item) { return Boolean(item?.created_by && String(item.created_by) === getCurrentUserId()) }
function proposalStatusLabel(status) { return proposalStatusMap[status] || status || '待处理' }
function proposalInitial(name) { return String(name || '团').trim().slice(0, 1) || '团' }
function proposalQuote(item) { return Number(item?.quote_amount) > 0 ? `¥${Number(item.quote_amount).toLocaleString('zh-CN')}` : '待沟通' }
function proposalTrust(item) {
  const trust = Number(item?.proposal_score_breakdown?.trust)
  if (trust > 0) return `${trust} / 100`
  const rating = Number(item?.provider?.rating || 0)
  return rating > 0 ? `${rating.toFixed(1)} 分` : '资料待补充'
}
function proposalDelivery(item) {
  const milestones = Array.isArray(item?.milestones) ? item.milestones : []
  return milestones.length ? milestones.slice(0, 2).map((part) => part.title).filter(Boolean).join('；') || `${milestones.length} 个节点` : '待补充交付节点'
}

function openProvider(item) {
  const userId = String(item?.contact_user_id || item?.provider_user_id || item?._id || item?.id || '').trim()
  if (!userId) {
    uni.showToast({ title: '该服务方暂未开放主页', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/profile/index?id=${encodeURIComponent(userId)}` })
}

async function refreshProposalPool() {
  if (!demandId.value || !isDemandOwner.value || demand.value?.status !== 'published') return
  proposalLoading.value = true
  try { proposalPool.value = await bridge.proposal.list(demandId.value) } catch (error) { console.warn('[demand-detail] refresh proposals failed:', error) } finally { proposalLoading.value = false }
}

async function inviteMatches() {
  if (invitingMatches.value || !demandId.value) return
  invitingMatches.value = true
  try {
    const result = await bridge.proposal.inviteMatches(demandId.value, { limit: 6, message: '已按你的需求筛选，请提交方案、报价和预计周期。' })
    await refreshProposalPool()
    uni.showToast({ title: result.created || result.reopened ? `已邀请 ${result.created + result.reopened} 支团队` : '这些团队已在申请列表里', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || '暂时没有找到合适团队', icon: 'none' })
  } finally { invitingMatches.value = false }
}

function goAgentForDemand() { uni.navigateTo({ url: `/pages/agent/index?demandId=${encodeURIComponent(demandId.value)}` }) }

function goDemandAgent() {
  if (!demandId.value) return
  uni.navigateTo({ url: `/pages/demand-agent/index?id=${encodeURIComponent(demandId.value)}` })
}

function acceptProposal(item) {
  uni.showModal({
    title: '确认选择这支团队？',
    content: '确认后会锁定该方案、生成项目协作室，并关闭其他未选中的提案。',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        const result = await bridge.proposal.decide(item._id, 'accepted')
        await refreshProposalPool()
        const dealId = result?.deal_id || result?.proposal?.deal_id || item.deal_id
        if (!dealId) {
          uni.showToast({ title: '方案已选定，协作室正在建立', icon: 'none' })
          return
        }
        uni.showToast({ title: '协作室已建立', icon: 'success' })
        setTimeout(() => uni.navigateTo({ url: `/pages/deals/workspace?id=${encodeURIComponent(dealId)}&tab=overview` }), 350)
      } catch (error) { uni.showToast({ title: error?.message || '选择失败，请稍后再试', icon: 'none' }) }
    }
  })
}

function openProposalWorkspace(item) {
  const dealId = String(item?.deal_id || '').trim()
  if (!dealId) return
  uni.navigateTo({ url: `/pages/deals/workspace?id=${encodeURIComponent(dealId)}&tab=overview` })
}

function closeProposal(item) {
  uni.showModal({
    title: '暂不考虑这支团队？',
    content: '提案会从当前比较池关闭，之后仍可再次邀约。',
    success: async ({ confirm }) => {
      if (!confirm) return
      try { await bridge.proposal.decide(item._id, 'closed'); await refreshProposalPool(); uni.showToast({ title: '已关闭提案', icon: 'none' }) } catch (error) { uni.showToast({ title: error?.message || '操作失败', icon: 'none' }) }
    }
  })
}

async function reload() {
  if (!demandId.value) return
  await loadRequest(demandId.value)
}

async function toggleFavorite() {
  if (!(await ensureInteractiveSession())) return
  const r = await bridge.favorite.toggle({ userId: getCurrentUserId(), targetType: 'demand', targetId: demandId.value })
  isFavorited.value = r.isFavorited
  uni.showToast({ title: r.isFavorited ? t('demandDetail.favorited') : t('demandDetail.unfavorited'), icon: 'none' })
}

async function ensureInteractiveSession() {
  if (getCurrentUserId() || hasStoredAccessToken()) return true
  const ok = await userStore.ensureLogin()
  if (ok && (getCurrentUserId() || hasStoredAccessToken())) return true
  uni.showToast({ title: '请先登录后再收藏', icon: 'none' })
  setTimeout(() => uni.navigateTo({ url: '/pages/user/login' }), 250)
  return false
}

function share() {
  // #ifdef MP-WEIXIN
  if (typeof uni.showShareMenu === 'function') {
    uni.showShareMenu({ withShareTicket: true })
    uni.showToast({ title: '已开启分享，请点击右上角转发', icon: 'none' })
    return
  }
  // #endif
  uni.showModal({ title: t('demandDetail.shareTitle'), content: t('demandDetail.shareContent'), showCancel: false })
}

onShareAppMessage(() => ({
  title: demand.value?.title || '媒合智联：找到合适的合作伙伴',
  path: `/pages/demand/detail?id=${encodeURIComponent(demandId.value)}`
}))

onShareTimeline(() => ({
  title: demand.value?.title || '媒合智联：找到合适的合作伙伴',
  query: `id=${encodeURIComponent(demandId.value)}`
}))

function goMyDemands() { uni.navigateTo({ url: '/pages/user/my-demands' }) }

async function submitLead() {
  if (!leadForm.value.contact_name.trim() || !leadForm.value.phone.trim()) { uni.showToast({ title: t('demandDetail.fillContact'), icon: 'none' }); return }
  submitting.value = true
  try {
    const result = await bridge.lead.create({ demand_id: demandId.value, ...leadForm.value })
    uni.showToast({ title: t('demandDetail.submitSuccess'), icon: 'success' })
    showLeadModal.value = false
    demand.value.lead_count = Number(demand.value.lead_count || 0) + (result?.idempotent ? 0 : 1)
    leadForm.value = { contact_name: '', phone: '', wechat: '', message: '' }

    // 后端已返回真实需求方，直接进入项目对话；若历史数据没有目标字段，
    // 不猜用户 ID，停留在当前页并让用户从“我的对接”继续跟进。
    const targetUserId = String(result?.target_user_id || '').trim()
    if (targetUserId) {
      setTimeout(() => uni.navigateTo({
        url: `/pages/chat/index?userId=${encodeURIComponent(targetUserId)}&name=${encodeURIComponent(demand.value?.company_name || '需求方')}`
      }), 500)
    }
  } finally { submitting.value = false }
}

function goDetail(id) { uni.redirectTo({ url: `/pages/demand/detail?id=${id}` }) }

onLoad(async (q) => {
  demandId.value = q.id || ''
  if (demandId.value) await loadRequest(demandId.value)
})
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 180rpx; }

.hero-card { background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; }
.hero-tags { display: flex; margin-bottom: 12rpx; }
.tag-cat { font-size: 20rpx; color: #FF9A5C; background: rgba(255,107,53,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.tag-quote { font-size: 20rpx; color: #F472B6; background: rgba(236,72,153,0.15); padding: 4rpx 12rpx; border-radius: 8rpx; }
.tag-status { margin-left: 8rpx; font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.status-pending { color: #B7791F; background: #FFF5DF; }
.status-offline { color: #A0AABD; background: #F2F4F8; }
.tag-hot { font-size: 18rpx; color: #EF4444; }
.hero-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; line-height: 1.4; }
.hero-company { display: flex; justify-content: space-between; }
.hero-name { font-size: 26rpx; color: rgba(0,0,0,0.6); }
.hero-region { font-size: 24rpx; color: rgba(0,0,0,0.5); }

.review-notice { display: flex; flex-direction: column; gap: 8rpx; margin-bottom: 12rpx; padding: 18rpx 20rpx; border: 1rpx solid #F6D98B; border-radius: 16rpx; background: #FFF9E9; }
.review-notice-title { color: #9A6B18; font-size: 25rpx; font-weight: 700; }
.review-notice-text { color: #A47B35; font-size: 22rpx; line-height: 1.45; }

.card { background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 20rpx; padding: 20rpx; margin-bottom: 12rpx; }
.card-label { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.budget-value { font-size: 40rpx; font-weight: bold; color: #FF6B35; }

.stat-row { display: flex; justify-content: space-around; padding-bottom: 16rpx; border-bottom: 1rpx solid rgba(0,0,0,0.06); margin-bottom: 16rpx; }
.stat-box { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.stat-label { font-size: 20rpx; color: rgba(0,0,0,0.5); }
.heat-row { display: flex; align-items: center; }
.heat-label { font-size: 24rpx; color: rgba(0,0,0,0.6); }
.heat-track { flex: 1; height: 8rpx; background: rgba(0,0,0,0.06); border-radius: 4rpx; }
.heat-fill { height: 100%; background: linear-gradient(90deg, #FF6B35, #FF9A5C); border-radius: 4rpx; transition: width 0.6s ease-out; }
.heat-value { font-size: 24rpx; color: #FF6B35; font-weight: bold; }

.desc-text { font-size: 28rpx; color: rgba(0,0,0,0.68); line-height: 1.7; }
.time-row { display: flex; justify-content: space-between; padding: 8rpx 0; }
.time-label { font-size: 24rpx; color: rgba(0,0,0,0.5); }
.time-value { font-size: 24rpx; color: rgba(0,0,0,0.68); }

.similar-list { display: flex; flex-direction: column; }
.similar-item { background: rgba(255,255,255,0.04); border: 1rpx solid rgba(0,0,0,0.06); border-radius: 12rpx; padding: 16rpx; }
.similar-title { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.7); display: block; margin-bottom: 4rpx; }
.similar-company { font-size: 22rpx; color: rgba(0,0,0,0.5); }

/* AI匹配服务商 */
.provider-list { display: flex; flex-direction: column; }
.provider-item { display: flex; margin-bottom: 12rpx; background: #F8F9FC; border-radius: 12rpx; padding: 16rpx; transition: background .18s ease, transform .18s ease; }
.provider-item:active { background: #F0F2FA; transform: scale(.995); }
.provider-rank { width: 40rpx; height: 40rpx; border-radius: 8rpx; background: #FF6B35; color: #fff; font-size: 24rpx; font-weight: bold; display: flex; align-items: center; justify-content: center; margin-right: 12rpx; flex-shrink: 0; }
.provider-info { flex: 1; }
.provider-name-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rpx; }
.provider-name { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.provider-match { font-size: 24rpx; color: #FF6B35; font-weight: bold; }
.provider-desc { font-size: 22rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 8rpx; }
.provider-match-reasons { display: flex; flex-wrap: wrap; margin-bottom: 6rpx; }
.provider-reason { font-size: 19rpx; color: #0F8A61; background: rgba(16,185,129,0.1); padding: 4rpx 10rpx; border-radius: 8rpx; margin-right: 8rpx; margin-bottom: 4rpx; }
.provider-tags { display: flex; flex-wrap: wrap; }
.provider-tag { font-size: 20rpx; color: #6366F1; background: rgba(99,102,241,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 8rpx; margin-bottom: 4rpx; }
.provider-action { display: flex; align-items: center; justify-content: space-between; margin-top: 10rpx; padding-top: 9rpx; border-top: 1rpx solid rgba(99,102,241,.1); color: #5968D8; font-size: 19rpx; }

/* 多团队提案比较池 */
.proposal-card { border-color: #E1E5FA; background: linear-gradient(180deg, #FCFCFF, #FFFFFF); }
.proposal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; }
.proposal-subtitle { display: block; margin-top: -6rpx; color: #8D99AC; font-size: 20rpx; }
.proposal-pending { flex: 0 0 auto; padding: 6rpx 10rpx; border-radius: 10rpx; color: #5D6BD2; background: #EEF0FF; font-size: 19rpx; }
.proposal-compare-toggle { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-top: 18rpx; padding: 15rpx 16rpx; border: 1rpx solid rgba(92,40,40,.16); border-radius: 10rpx; color: #3B322C; background: #FCFBF8; }
.proposal-compare-toggle > view { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 5rpx; font-size: 22rpx; font-weight: 680; }
.proposal-compare-kicker { color: #8A8177; font: 700 15rpx/1.2 monospace; letter-spacing: .11em; }
.proposal-compare-arrow { flex: 0 0 auto; color: #6A3D37; font-size: 30rpx; line-height: 1; }
.proposal-compare-scroll { width: 100%; margin-top: 10rpx; overflow: hidden; border: 1rpx solid rgba(38,35,31,.10); border-radius: 10rpx; background: #FCFBF8; white-space: nowrap; }
.proposal-compare-table { min-width: 100%; }
.compare-table-row { display: flex; min-height: 58rpx; border-top: 1rpx solid rgba(38,35,31,.08); color: #5F584F; font-size: 19rpx; line-height: 1.4; }
.compare-table-row:first-child { border-top: 0; }
.compare-table-header { min-height: 76rpx; color: #25231F; background: #F3F0EA; }
.compare-label { display: flex; width: 190rpx; flex: 0 0 190rpx; align-items: center; padding: 9rpx 13rpx; border-right: 1rpx solid rgba(38,35,31,.08); color: #8A8177; font-size: 18rpx; box-sizing: border-box; }
.compare-table-header .compare-label { color: #69574A; font: 700 15rpx/1.2 monospace; letter-spacing: .08em; }
.compare-value { display: flex; width: 250rpx; flex: 0 0 250rpx; align-items: center; padding: 9rpx 13rpx; border-right: 1rpx solid rgba(38,35,31,.08); box-sizing: border-box; overflow: hidden; white-space: normal; }
.compare-team { flex-direction: column; align-items: flex-start; justify-content: center; gap: 3rpx; color: #8A8177; font-size: 17rpx; }
.compare-team-name { overflow: hidden; width: 100%; color: #25231F; font-size: 21rpx; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.compare-delivery { align-items: flex-start; color: #69574A; font-size: 18rpx; }
.compare-table-action { min-height: 70rpx; background: #FAF9F6; }
.compare-accept { width: 100%; margin: 0; padding: 9rpx 8rpx; border-radius: 6rpx; color: #F7F6F2; background: #5C2828; font-size: 18rpx; line-height: 1.35; }
.proposal-loading,.proposal-empty { padding: 28rpx 0 18rpx; color: #8D99AC; font-size: 23rpx; text-align: center; }
.proposal-item { margin-top: 14rpx; padding: 16rpx; border: 1rpx solid #E7EAF5; border-radius: 16rpx; background: #FFFFFF; }
.proposal-item-head { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.proposal-provider { display: flex; align-items: center; min-width: 0; }
.proposal-avatar { display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; margin-right: 12rpx; border-radius: 17rpx; color: #FFFFFF; background: linear-gradient(145deg, #6573DC, #8B91E8); font-size: 24rpx; font-weight: 800; }
.proposal-provider-copy { display: flex; flex-direction: column; min-width: 0; }
.proposal-provider-name { overflow: hidden; color: #303B57; font-size: 26rpx; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.proposal-provider-meta { margin-top: 4rpx; color: #8D99AC; font-size: 20rpx; }
.proposal-score { display: flex; flex-direction: column; align-items: flex-end; color: #FF6B35; }
.proposal-score text:first-child { font-size: 34rpx; font-weight: 800; line-height: 1; }.proposal-score text:last-child { margin-top: 4rpx; color: #A0AABD; font-size: 17rpx; }
.proposal-reasons { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 12rpx; }.proposal-reasons text { padding: 5rpx 9rpx; border-radius: 8rpx; color: #0F8A61; background: #ECF9F3; font-size: 18rpx; }
.proposal-quote { display: flex; align-items: baseline; gap: 12rpx; margin-top: 12rpx; color: #8D99AC; font-size: 21rpx; }.proposal-quote-price { color: #FF6B35; font-size: 29rpx; font-weight: 800; }
.proposal-message { display: block; margin-top: 10rpx; color: #66738A; font-size: 22rpx; line-height: 1.5; }
.proposal-milestones { margin-top: 14rpx; padding-top: 12rpx; border-top: 1rpx solid rgba(38,35,31,.09); }
.proposal-milestones-label { display: block; margin-bottom: 7rpx; color: #8A8177; font-size: 18rpx; letter-spacing: .08em; }
.proposal-milestone { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; padding: 7rpx 0; color: #4D4841; font-size: 20rpx; }
.proposal-milestone-index { display: inline-flex; align-items: center; justify-content: center; width: 30rpx; height: 30rpx; margin-right: 9rpx; color: #6A3D37; background: #F1EBE3; font-size: 16rpx; }
.proposal-milestone-amount { flex: 0 0 auto; color: #6A3D37; font-variant-numeric: tabular-nums; }
.proposal-actions-row { display: flex; align-items: center; gap: 10rpx; margin-top: 13rpx; }.proposal-actions-row button { margin: 0; padding: 8rpx 12rpx; border-radius: 9rpx; font-size: 20rpx; line-height: 1.4; }.proposal-accept { color: #FFFFFF; background: #6573DC; }.proposal-workspace { color: #F8F5EE; background: #342F29; }.proposal-close { color: #7E8A9D; background: #F4F5F8; }.proposal-waiting { color: #A0AABD; font-size: 19rpx; }
.proposal-footer-actions { display: flex; gap: 10rpx; margin-top: 16rpx; }.proposal-footer-actions button { flex: 1; margin: 0; padding: 13rpx 8rpx; border-radius: 12rpx; font-size: 21rpx; line-height: 1.4; }.proposal-invite { color: #FFFFFF; background: linear-gradient(135deg, #6573DC, #7C76D8); }.proposal-edit { border: 1rpx solid #DDE2F4; color: #5D6BD2; background: #F8F9FF; }

/* 评价 */
.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.review-summary { display: flex; align-items: center; }
.review-avg { font-size: 36rpx; font-weight: bold; color: #FF6B35; margin-right: 8rpx; }
.review-stars { font-size: 20rpx; margin-right: 8rpx; }
.review-count { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.review-list { display: flex; flex-direction: column; }
.review-item { background: #F8F9FC; border-radius: 12rpx; padding: 16rpx; margin-bottom: 12rpx; }
.review-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.reviewer-name { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.review-content { font-size: 26rpx; color: rgba(0,0,0,0.7); line-height: 1.6; display: block; margin-bottom: 8rpx; }
.review-tags { display: flex; flex-wrap: wrap; margin-bottom: 8rpx; }
.review-tag { font-size: 20rpx; color: #10B981; background: rgba(16,185,129,0.1); padding: 4rpx 12rpx; border-radius: 8rpx; margin-right: 8rpx; }
.review-time { font-size: 20rpx; color: rgba(0,0,0,0.35); }
.review-empty { text-align: center; padding: 24rpx; font-size: 26rpx; color: rgba(0,0,0,0.4); }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); }
.action-left { display: flex; }
.action-btn { display: flex; flex-direction: column; align-items: center; margin-right: 24rpx; }
.action-icon { width: 34rpx; height: 34rpx; }
.action-text { font-size: 20rpx; color: rgba(0,0,0,0.5); }
.primary-btn { flex: 1; background: linear-gradient(135deg, #FF6B35, #FF9A5C); color: #FFFFFF; border-radius: 32rpx; padding: 20rpx; font-size: 28rpx; font-weight: bold; border: none; }
.secondary-btn { flex: 1; margin: 0; border: 1rpx solid #D9DDF5; border-radius: 32rpx; padding: 20rpx; color: #5D6BD2; background: #F3F4FF; font-size: 28rpx; font-weight: bold; }

.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1200; display: flex; align-items: flex-end; }
.modal-panel { width: 100%; padding: 32rpx; background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; }
.modal-title { font-size: 32rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 24rpx; }
.modal-body { display: flex; flex-direction: column; margin-bottom: 24rpx; }
.form-row { display: flex; flex-direction: column; margin-bottom: 16rpx; }
.form-label { font-size: 24rpx; color: rgba(0,0,0,0.6); margin-bottom: 8rpx; }
.form-input { height: 72rpx; background: #F5F6FA; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 16rpx; padding: 16rpx; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.form-area { height: 120rpx; background: #F5F6FA; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 16rpx; padding: 16rpx; font-size: 28rpx; color: rgba(0,0,0,0.85); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { width: 80rpx; height: 80rpx; display: block; margin: 0 auto 16rpx; }
.detail-state { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; color: rgba(0,0,0,0.5); font-size: 28rpx; }
.detail-state-icon { display: block; width: 58rpx; height: 58rpx; margin-bottom: 12rpx; }
.error-state { color: #FF6B35; }

/* Enterprise workflow pass: keep the detail page focused on status, facts and next action. */
.page { background: #F5F6F8; color: #1F2329; }
.hero-card, .card { border-color: #E5E6EB; border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(31,35,41,.03); }
.tag-cat, .tag-quote, .provider-tag { color: #0958D9; background: #E8F3FF; border-radius: 6rpx; }
.tag-hot { color: #D4380D; }
.hero-title, .card-label, .provider-name, .similar-title, .reviewer-name { color: #1F2329; }
.hero-name, .hero-region, .provider-desc, .similar-company, .time-label, .review-count { color: #86909C; }
.budget-value, .provider-match, .proposal-score, .proposal-quote-price, .review-avg { color: #1677FF; }
.heat-fill { background: #1677FF; }
.provider-item, .similar-item, .proposal-item, .review-item { border: 1rpx solid #E5E6EB; border-radius: 10rpx; background: #FFF; }
.provider-item:active { background: #F2F8FF; }
.provider-rank, .proposal-avatar { background: #1677FF; border-radius: 8rpx; }
.provider-reason, .proposal-reasons text, .review-tag { color: #087F5B; background: #E8F8F2; border-radius: 6rpx; }
.provider-action { border-top-color: #E5E6EB; color: #0958D9; }
.proposal-card { border-color: #D9E7F7; background: #F7FBFF; }
.proposal-pending { color: #0958D9; background: #E8F3FF; border-radius: 6rpx; }
.proposal-compare-toggle { border-color: #D9DDE3; color: #1F2329; background: #FFF; }
.proposal-compare-kicker, .compare-label { color: #86909C; }
.proposal-compare-arrow { color: #0958D9; }
.proposal-compare-scroll { border-color: #E5E6EB; background: #FFF; }
.compare-table-row { border-color: #E5E6EB; color: #4E5969; }
.compare-table-header { color: #1F2329; background: #F7F8FA; }
.compare-table-header .compare-label { color: #4E5969; }
.compare-label, .compare-value { border-color: #E5E6EB; }
.compare-team { color: #86909C; }
.compare-team-name { color: #1F2329; }
.compare-delivery { color: #4E5969; }
.compare-table-action { background: #F7F8FA; }
.compare-accept { color: #FFF; background: #1677FF; border-radius: 6rpx; }
.proposal-provider-name { color: #1F2329; }
.proposal-accept, .proposal-invite, .primary-btn { color: #FFF; background: #1677FF; border-radius: 8rpx; }
.proposal-close, .proposal-edit, .secondary-btn { border: 1rpx solid #D9DDE3; color: #646A73; background: #FFF; border-radius: 8rpx; }
.action-bar { border-top-color: #E5E6EB; box-shadow: 0 -4rpx 14rpx rgba(31,35,41,.04); }
.action-text { color: #86909C; }
.modal-panel { border-radius: 16rpx 16rpx 0 0; }
.form-input, .form-area { border-color: #D9DDE3; border-radius: 8rpx; background: #FFF; }

/* Decision desk: one readable path from a published need to a working project. */
.page { padding: 22rpx 24rpx 184rpx; background: #F7F6F2; color: #302B26; }
.hero-card, .card { border-color: rgba(42,37,31,.11); border-radius: 7rpx; box-shadow: none; background: #FCFBF8; }
.decision-hero { margin-bottom: 0; padding: 31rpx 24rpx 27rpx; border-bottom: 0; }
.decision-eyebrow { display: block; margin-bottom: 14rpx; color: #8A8177; font: 600 15rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .13em; }
.hero-tags { gap: 8rpx; margin-bottom: 17rpx; }.tag-cat,.tag-quote,.tag-status { margin: 0; padding: 5rpx 9rpx; border-radius: 3rpx; font-size: 17rpx; }.tag-cat { color: #5C2828; background: #F2E8E2; }.tag-quote { color: #69574A; background: #EEEAE2; }.tag-hot { margin-left: auto; color: #8E4C42; font-size: 17rpx; }.hero-title { margin-bottom: 13rpx; color: #2E2924; font-family: Georgia, 'Times New Roman', 'Songti SC', serif; font-size: 42rpx; font-weight: 500; line-height: 1.2; }.hero-name { color: #645C52; font-size: 22rpx; }.hero-region { color: #91897E; font-size: 20rpx; }
.decision-stage-line { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 24rpx; border: 1rpx solid rgba(42,37,31,.11); background: #FCFBF8; }.decision-stage { display: flex; min-width: 0; flex-direction: column; gap: 10rpx; padding: 16rpx 12rpx 17rpx; color: #968E84; }.decision-stage + .decision-stage { border-left: 1rpx solid rgba(42,37,31,.08); }.decision-stage-index { display: flex; width: 24rpx; height: 24rpx; align-items: center; justify-content: center; border: 1rpx solid #C7BFB4; border-radius: 50%; color: #8D847A; font: 500 15rpx/1 Georgia, serif; }.decision-stage view { display: flex; min-width: 0; flex-direction: column; gap: 5rpx; }.decision-stage view text:first-child { overflow: hidden; color: inherit; font-size: 19rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.decision-stage view text + text { min-height: 28rpx; color: #A49C92; font-size: 15rpx; line-height: 1.35; }.decision-stage.complete .decision-stage-index { border-color: #596050; color: #F7F6F2; background: #596050; }.decision-stage.complete view text:first-child { color: #596050; }.decision-stage.active { background: #F1ECE4; }.decision-stage.active .decision-stage-index { border-color: #5C2828; color: #FCFBF8; background: #5C2828; }.decision-stage.active view text:first-child { color: #5C2828; }.decision-stage.active view text + text { color: #71685E; }
.review-notice { margin-bottom: 24rpx; padding: 16rpx 18rpx; border: 1rpx solid #D6C3A1; border-radius: 0; background: #F7F0E1; }.review-notice-title { color: #705A37; font-size: 22rpx; }.review-notice-text { color: #8A7554; font-size: 19rpx; }
.decision-brief { margin-bottom: 34rpx; padding: 25rpx 4rpx 24rpx; border-top: 1rpx solid rgba(42,37,31,.13); border-bottom: 1rpx solid rgba(42,37,31,.13); }.decision-brief-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 18rpx; }.decision-brief-head .card-label { margin: 0; color: #8A8177; font: 600 15rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }.decision-brief-title { display: block; margin-top: 8rpx; color: #39332C; font-family: Georgia, 'Times New Roman', serif; font-size: 29rpx; font-weight: 500; }.decision-brief-state { flex: 0 0 auto; padding: 5rpx 8rpx; border: 1rpx solid #D9CEC1; color: #69574A; font-size: 17rpx; }.decision-fact-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 22rpx; border-top: 1rpx solid rgba(42,37,31,.08); border-bottom: 1rpx solid rgba(42,37,31,.08); }.decision-fact-grid view { display: flex; min-width: 0; flex-direction: column; gap: 6rpx; padding: 14rpx 11rpx; }.decision-fact-grid view + view { border-left: 1rpx solid rgba(42,37,31,.08); }.decision-fact-grid text:first-child { color: #9A9288; font-size: 16rpx; }.decision-fact-grid text + text { overflow: hidden; color: #443D35; font: 500 21rpx/1.25 Georgia, 'Times New Roman', serif; text-overflow: ellipsis; white-space: nowrap; }.decision-description { display: block; margin-top: 20rpx; color: #60584F; font-size: 23rpx; line-height: 1.72; }.decision-evidence { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22rpx; }.decision-evidence view { display: flex; min-width: 0; flex-direction: column; gap: 4rpx; }.decision-evidence text:first-child { color: #5C2828; font: 500 26rpx/1.1 Georgia, 'Times New Roman', serif; font-variant-numeric: tabular-nums; }.decision-evidence text + text { overflow: hidden; color: #938A80; font-size: 16rpx; text-overflow: ellipsis; white-space: nowrap; }
.provider-directory,.proposal-card,.review-section { margin-bottom: 34rpx; padding: 26rpx 4rpx 0; border: 0; border-radius: 0; border-top: 1rpx solid rgba(42,37,31,.13); background: transparent; }.directory-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 18rpx; padding-bottom: 14rpx; }.directory-head .card-label,.proposal-header .card-label { margin: 0; color: #8A8177; font: 600 15rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }.directory-title { display: block; margin-top: 8rpx; color: #39332C; font-family: Georgia, 'Times New Roman', serif; font-size: 29rpx; font-weight: 500; }.directory-head > text { color: #8B8379; font-size: 18rpx; }
.provider-item,.similar-item,.proposal-item,.review-item { border-color: rgba(42,37,31,.10); border-radius: 5rpx; background: #FCFBF8; }.provider-item { margin-bottom: 9rpx; padding: 17rpx; }.provider-item:active { background: #F3EEE6; transform: none; }.provider-rank,.proposal-avatar { border-radius: 3rpx; background: #69574A; }.provider-name,.similar-title,.reviewer-name { color: #3C352E; font-family: Georgia, 'Times New Roman', serif; font-weight: 500; }.provider-match,.proposal-score,.proposal-quote-price,.review-avg { color: #5C2828; }.provider-desc,.similar-company,.review-count { color: #91897E; }.provider-reason,.proposal-reasons text,.review-tag { color: #56624C; background: #E8EEE5; border-radius: 3rpx; }.provider-tag { color: #69574A; background: #EEE9E1; border-radius: 3rpx; }.provider-action { border-top-color: rgba(42,37,31,.09); color: #5C2828; }
.proposal-card { padding-top: 27rpx; }.proposal-header { padding-bottom: 16rpx; }.proposal-subtitle { margin-top: 8rpx; color: #817A70; font-size: 19rpx; line-height: 1.5; }.proposal-pending { padding: 5rpx 8rpx; border: 1rpx solid #D8C9BC; border-radius: 3rpx; color: #5C2828; background: transparent; font-size: 17rpx; }.proposal-compare-toggle { margin-top: 6rpx; border-color: rgba(92,40,40,.22); border-radius: 4rpx; color: #443B32; background: #F6F1E9; }.proposal-compare-kicker,.compare-label { color: #8A8177; }.proposal-compare-arrow { color: #5C2828; }.proposal-compare-scroll { border-color: rgba(42,37,31,.12); border-radius: 4rpx; background: #FCFBF8; }.compare-table-row { border-color: rgba(42,37,31,.09); color: #675F56; }.compare-table-header,.compare-table-action { color: #302B26; background: #F2EEE6; }.compare-table-header .compare-label,.compare-label { color: #786F64; }.compare-label,.compare-value { border-color: rgba(42,37,31,.09); }.compare-team { color: #8A8177; }.compare-team-name { color: #332D27; }.compare-delivery { color: #69574A; }.compare-accept,.proposal-accept,.proposal-invite,.primary-btn { color: #F8F5EE; background: #342F29; border-radius: 4rpx; }.proposal-item { margin-top: 11rpx; padding: 17rpx; }.proposal-provider-name { color: #39332C; }.proposal-avatar { border-radius: 50%; }.proposal-close,.proposal-edit,.secondary-btn { border-color: #D9D1C6; color: #665D52; background: #FAF8F3; border-radius: 4rpx; }.proposal-footer-actions button,.proposal-actions-row button { border-radius: 4rpx; }.proposal-message { color: #716960; }.proposal-milestones { border-top-color: rgba(42,37,31,.09); }.proposal-milestone-index { color: #5C2828; background: #F1E9E3; }
.review-section { padding-bottom: 24rpx; border-bottom: 1rpx solid rgba(42,37,31,.13); }.review-section .card-label { color: #4A433A; font-family: Georgia, 'Times New Roman', serif; font-size: 29rpx; font-weight: 500; }.action-bar { border-top-color: rgba(42,37,31,.12); background: #FCFBF8; box-shadow: 0 -8rpx 24rpx rgba(42,37,31,.05); }.action-text { color: #817A70; }.modal-mask { background: rgba(32,28,24,.45); }.modal-panel { border-radius: 10rpx 10rpx 0 0; background: #FCFBF8; }.form-label { color: #766D62; }.form-input,.form-area { border-color: #DDD5CA; border-radius: 4rpx; background: #FAF8F3; }
@media (max-width: 360px) { .decision-stage-line { grid-template-columns: repeat(2, minmax(0, 1fr)); }.decision-stage:nth-child(3) { border-left: 0; }.decision-stage:nth-child(-n + 2) { border-bottom: 1rpx solid rgba(42,37,31,.08); }.decision-fact-grid { grid-template-columns: 1fr; }.decision-fact-grid view + view { border-top: 1rpx solid rgba(42,37,31,.08); border-left: 0; }.decision-evidence { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14rpx 0; } }

/* Detail safety: long titles, provider names and comparison values must stay
 * inside their columns; the comparison table is intentionally scrollable. */
.page {
  overflow-x: hidden;
  box-sizing: border-box;
}
.hero-card,
.card,
.provider-item,
.proposal-item,
.review-item,
.proposal-header,
.directory-head,
.provider-info,
.provider-name-row,
.proposal-provider,
.proposal-provider-copy,
.proposal-milestone {
  min-width: 0;
}
.hero-tags {
  flex-wrap: wrap;
  gap: 8rpx;
}
.hero-title,
.decision-description,
.provider-desc,
.proposal-message,
.review-content {
  overflow-wrap: anywhere;
  word-break: break-word;
}
.hero-company,
.provider-name-row,
.proposal-header,
.directory-head,
.review-header {
  gap: 12rpx;
}
.hero-name,
.hero-region,
.provider-name,
.provider-match,
.proposal-subtitle,
.proposal-pending,
.directory-head > text,
.proposal-score {
  min-width: 0;
}
.hero-name,
.provider-name,
.proposal-provider-name,
.similar-title,
.reviewer-name {
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
}
.hero-name { flex: 1; white-space: nowrap; }
.hero-region,
.provider-match,
.proposal-pending,
.directory-head > text { flex: 0 0 auto; white-space: nowrap; }
.provider-info,
.proposal-provider-copy { overflow: hidden; }
.provider-name { flex: 1; }
.provider-action { min-width: 0; }
.proposal-compare-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  box-sizing: border-box;
}
.proposal-compare-table { min-width: 100%; }
.compare-label,
.compare-value { overflow-wrap: anywhere; word-break: break-word; }
.proposal-milestone > text:first-child { min-width: 0; flex: 1; overflow-wrap: anywhere; word-break: break-word; }
.proposal-milestone-amount { flex: 0 0 auto; white-space: nowrap; }
.action-bar { box-sizing: border-box; max-width: 100%; }
.action-left { flex: 0 0 auto; }
.action-btn { flex: 0 0 auto; }
.modal-panel { max-width: 100%; box-sizing: border-box; }

@media (max-width: 360px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .decision-stage { padding-right: 8rpx; padding-left: 8rpx; }
  .decision-brief-state { font-size: 15rpx; }
  .action-bar { padding-right: 16rpx; padding-left: 16rpx; }
  .action-btn { margin-right: 14rpx; }
}

/* 需求 Agent 入口：与需求摘要同层级，明确公开上下文和下一步动作。 */
.demand-agent-card { margin: 0 0 34rpx; padding: 24rpx 4rpx; border-top: 1rpx solid rgba(42,37,31,.13); border-bottom: 1rpx solid rgba(42,37,31,.13); background: #FCFBF8; }
.demand-agent-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }
.demand-agent-kicker { display: block; color: #8A8177; font: 600 15rpx/1.2 ui-monospace, monospace; letter-spacing: .12em; }
.demand-agent-title { display: block; margin-top: 9rpx; color: #39332C; font: 500 29rpx/1.25 Georgia, 'Songti SC', serif; }
.demand-agent-status { flex: 0 0 auto; padding: 5rpx 8rpx; color: #56624C; background: #E8EEE5; font-size: 16rpx; }
.demand-agent-desc { display: block; margin-top: 14rpx; color: #716960; font-size: 20rpx; line-height: 1.62; }
.demand-agent-context { display: flex; align-items: center; justify-content: space-between; gap: 14rpx; margin-top: 17rpx; padding: 12rpx; border: 1rpx solid rgba(42,37,31,.09); color: #8A8177; background: #F7F3EC; font-size: 17rpx; }
.demand-agent-context text:last-child { overflow: hidden; color: #5C2828; text-overflow: ellipsis; white-space: nowrap; }
.demand-agent-button { display: flex; align-items: center; justify-content: space-between; margin-top: 16rpx; padding: 14rpx 16rpx; color: #FCFBF8; background: #342F29; font-size: 20rpx; }
.demand-agent-button text { color: #D5B47D; font-size: 25rpx; }
</style>
