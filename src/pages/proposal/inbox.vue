<template>
  <view class="page">
    <view class="header">
      <view><text class="eyebrow">项目合作</text><text class="title">收到的提案</text><text class="subtitle">先看清需求，再决定要不要投入时间报价。</text></view>
      <text class="refresh" @tap="loadInbox">刷新</text>
    </view>

    <view class="summary-row">
      <view class="summary-item"><text>{{ proposalSummary.pending }}</text><label>待报价</label></view>
      <view class="summary-item"><text>{{ proposalSummary.quoted }}</text><label>已报价</label></view>
      <view class="summary-item"><text>{{ proposalSummary.accepted }}</text><label>已选中</label></view>
    </view>

    <scroll-view class="list-scroll" scroll-y refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="refreshInbox">
      <view v-if="loadState === 'loading' && !proposals.length" class="state">正在同步项目提案…</view>
      <view v-else-if="loadState === 'error'" class="state error" @tap="loadInbox">加载失败，点击重试</view>
      <view v-for="item in proposals" :key="item._id" class="proposal-card">
        <view class="card-head">
          <view class="provider-avatar"><text>{{ initial(item.provider?.name) }}</text></view>
          <view class="card-copy"><text class="provider-name">{{ item.provider?.name || '服务团队' }}</text><text class="demand-title">{{ item.demand?.title || item.demand_title }}</text></view>
          <text class="status" :class="`status-${item.status}`">{{ statusLabel(item.status) }}</text>
        </view>
        <view class="match-line"><text>匹配 {{ item.match_percent }}</text><text>方案分 {{ item.proposal_score }}</text><text v-if="item.demand?.region">{{ item.demand.region }}</text></view>
        <view v-if="item.match_reasons?.length" class="reason-row"><text v-for="reason in item.match_reasons.slice(0, 3)" :key="reason">{{ reason }}</text></view>
        <view v-if="item.status === 'quoted'" class="quote-line"><text class="quote-price">¥{{ item.quote_amount || '待沟通' }}</text><text v-if="item.estimated_days">预计 {{ item.estimated_days }} 天</text></view>
        <text v-if="item.provider_message" class="message">{{ item.provider_message }}</text>
        <view v-if="item.milestones?.length" class="milestone-preview">
          <text class="milestone-preview-label">交付节点</text>
          <view v-for="(milestone, index) in item.milestones.slice(0, 3)" :key="`${item._id}-${index}`" class="milestone-preview-item">
            <text>{{ index + 1 }}. {{ milestone.title }}</text>
            <text v-if="milestone.amount">¥{{ milestone.amount }}</text>
          </view>
        </view>
        <view class="card-actions">
          <button v-if="['invited', 'viewed'].includes(item.status)" class="primary-action" @tap="openProposal(item)"><text>{{ item.status === 'invited' ? '查看并报价' : '提交报价' }}</text></button>
          <button v-if="item.status === 'quoted'" class="secondary-action" @tap="openProposal(item)">修改报价</button>
          <button v-if="['invited', 'viewed'].includes(item.status)" class="muted-action" @tap="decline(item)">暂不承接</button>
          <button v-if="item.status === 'accepted'" class="primary-action" @tap="contactRequester(item)">进入对接</button>
        </view>
      </view>
      <view v-if="!proposals.length && loadState !== 'loading'" class="empty"><image class="empty-icon" src="/static/icons/file.svg" mode="aspectFit" /><text>还没有收到项目提案</text><text class="empty-copy">完成团队资料后，需求方更容易找到你。</text></view>
    </scroll-view>

    <view v-if="respondingProposal" class="modal-mask" @tap="closeRespond">
      <view class="modal" @tap.stop>
        <view class="modal-head"><view><text class="modal-title">提交方案报价</text><text class="modal-subtitle">{{ respondingProposal.demand?.title || respondingProposal.demand_title }}</text></view><text class="close" @tap="closeRespond">×</text></view>
        <view class="form-row"><text>报价（元）</text><input v-model="form.quote_amount" type="digit" placeholder="例如 68000" /></view>
        <view class="form-row"><text>预计周期（天）</text><input v-model="form.estimated_days" type="number" placeholder="例如 18" /></view>
        <view class="form-row"><text>方案说明</text><textarea v-model="form.message" maxlength="1000" placeholder="说明你准备怎么做、交付什么，以及需要需求方配合什么。" /></view>
        <view class="milestone-editor">
          <view class="milestone-editor-head"><view><text class="milestone-editor-title">交付里程碑</text><text class="milestone-editor-copy">把报价拆成可检查的阶段，需求方更容易判断。</text></view><text v-if="form.milestones.length < 8" class="add-milestone" @tap="addMilestone">＋ 添加</text></view>
          <view v-for="(milestone, index) in form.milestones" :key="index" class="milestone-edit-row">
            <text class="milestone-index">{{ index + 1 }}</text>
            <input v-model="milestone.title" maxlength="120" placeholder="例如：策略与排期确认" />
            <input v-model="milestone.amount" class="milestone-amount" type="digit" placeholder="金额" />
            <text class="remove-milestone" @tap="removeMilestone(index)">×</text>
          </view>
        </view>
        <button class="submit" :disabled="submitting" @tap="submitQuote"><text>{{ submitting ? '提交中…' : '提交报价方案' }}</text></button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useRequest } from '@/hooks/useRequest'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'

useNavTitle('titles.proposalInbox')

const refreshing = ref(false)
const inbox = ref({ list: [], total: 0, summary: {} })
const respondingProposal = ref(null)
const submitting = ref(false)
const form = ref({ quote_amount: '', estimated_days: '', message: '', milestones: [] })
const userStore = useUserStore()
const { state: loadState, run: loadRequest } = useRequest(async () => bridge.proposal.inbox())
const proposals = computed(() => inbox.value.list || [])
const proposalSummary = computed(() => proposals.value.reduce((summary, item) => {
  if (['invited', 'viewed'].includes(item.status)) summary.pending += 1
  if (item.status === 'quoted') summary.quoted += 1
  if (item.status === 'accepted') summary.accepted += 1
  return summary
}, { pending: 0, quoted: 0, accepted: 0 }))

async function loadInbox() {
  if (!(await requirePageLogin(userStore, '登录后才能查看收到的项目'))) return
  try { inbox.value = await loadRequest() } catch { inbox.value = { list: [], total: 0, summary: {} } }
}

async function refreshInbox() {
  refreshing.value = true
  await loadInbox()
  refreshing.value = false
}

async function openProposal(item) {
  try {
    if (item.status === 'invited') {
      const viewed = await bridge.proposal.view(item._id)
      if (viewed) Object.assign(item, viewed)
    }
    respondingProposal.value = item
    const milestones = Array.isArray(item.milestones) && item.milestones.length
      ? item.milestones.map((milestone) => ({ title: milestone.title || '', amount: milestone.amount ? String(milestone.amount) : '' }))
      : [{ title: '需求范围与执行排期确认', amount: '' }, { title: '核心交付与阶段沟通', amount: '' }, { title: '验收与复盘', amount: '' }]
    form.value = { quote_amount: item.quote_amount ? String(item.quote_amount) : '', estimated_days: item.estimated_days ? String(item.estimated_days) : '', message: item.provider_message || '', milestones }
  } catch (error) { uni.showToast({ title: error?.message || '提案暂时打不开', icon: 'none' }) }
}

function closeRespond() { respondingProposal.value = null }

async function submitQuote() {
  if (submitting.value) return
  if (!(Number(form.value.quote_amount) > 0)) { uni.showToast({ title: '请填写有效报价', icon: 'none' }); return }
  if (!(Number(form.value.estimated_days) > 0)) { uni.showToast({ title: '请填写预计周期', icon: 'none' }); return }
  if (!form.value.message.trim()) { uni.showToast({ title: '请先写几句方案说明', icon: 'none' }); return }
  const milestones = form.value.milestones
    .map((item) => ({ title: String(item.title || '').trim(), amount: Number(item.amount) || 0 }))
    .filter((item) => item.title)
  if (!milestones.length) { uni.showToast({ title: '请至少填写一个交付里程碑', icon: 'none' }); return }
  submitting.value = true
  try {
    const updated = await bridge.proposal.respond(respondingProposal.value._id, { status: 'quoted', quote_amount: Number(form.value.quote_amount), estimated_days: Number(form.value.estimated_days), message: form.value.message.trim(), milestones })
    if (updated) Object.assign(respondingProposal.value, updated)
    closeRespond()
    await loadInbox()
    uni.showToast({ title: '报价方案已提交', icon: 'success' })
  } catch (error) { uni.showToast({ title: error?.message || '提交失败，请稍后再试', icon: 'none' }) } finally { submitting.value = false }
}

function addMilestone() {
  if (form.value.milestones.length >= 8) return
  form.value.milestones.push({ title: '', amount: '' })
}

function removeMilestone(index) {
  if (form.value.milestones.length <= 1) {
    uni.showToast({ title: '至少保留一个交付节点', icon: 'none' })
    return
  }
  form.value.milestones.splice(index, 1)
}

function decline(item) {
  uni.showModal({ title: '暂不承接这个项目？', content: '需求方会看到你暂时无法承接。', success: async ({ confirm }) => {
    if (!confirm) return
    try {
      const updated = await bridge.proposal.respond(item._id, { status: 'declined', message: '当前排期暂时无法承接，感谢邀请。' })
      if (updated) Object.assign(item, updated)
      await loadInbox()
      uni.showToast({ title: '已回复需求方', icon: 'none' })
    } catch (error) { uni.showToast({ title: error?.message || '回复失败', icon: 'none' }) }
  } })
}

function contactRequester(item) {
  const id = item.demand?.requester_id || item.requester_id
  if (id) uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(id)}&name=${encodeURIComponent(item.demand?.company_name || '项目方')}` })
}

function initial(name) { return String(name || '团').trim().slice(0, 1) || '团' }
function statusLabel(status) { return ({ invited: '待查看', viewed: '待报价', quoted: '已报价', accepted: '已选中', declined: '已婉拒', closed: '已关闭', expired: '已过期' })[status] || status }

onMounted(loadInbox)
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; width: 100%; height: 100vh; min-height: 0; overflow-x: hidden; padding-bottom: 40rpx; background: #F5F7FB; color: #303B57; box-sizing: border-box; }
/* #ifdef H5 */
.page { height: calc(100vh - 44px); }
/* #endif */
.header { display: flex; align-items: flex-start; justify-content: space-between; padding: 28rpx 24rpx 20rpx; background: #FFF; }.eyebrow,.title,.subtitle { display: block; }.eyebrow { color: #6573DC; font-size: 19rpx; font-weight: 700; letter-spacing: .08em; }.title { margin-top: 5rpx; color: #303B57; font-size: 38rpx; font-weight: 800; }.subtitle { margin-top: 6rpx; color: #98A4B7; font-size: 21rpx; }.refresh { padding: 8rpx 12rpx; border: 1rpx solid #E2E6F2; border-radius: 10rpx; color: #6573DC; background: #F8F9FF; font-size: 20rpx; }
.summary-row { display: flex; margin: 16rpx 24rpx; padding: 18rpx 10rpx; border: 1rpx solid #E7EBF2; border-radius: 18rpx; background: #FFF; }.summary-item { display: flex; flex: 1; flex-direction: column; align-items: center; border-right: 1rpx solid #EEF0F5; }.summary-item:last-child { border-right: 0; }.summary-item text { color: #5D6BD2; font-size: 32rpx; font-weight: 800; }.summary-item label { margin-top: 4rpx; color: #98A4B7; font-size: 19rpx; }
.list-scroll { flex: 1; min-height: 0; height: auto; padding: 0 24rpx; }.proposal-card { margin-bottom: 14rpx; padding: 18rpx; border: 1rpx solid #E5E9F1; border-radius: 18rpx; background: #FFF; box-shadow: 0 8rpx 20rpx rgba(70,87,123,.035); }.card-head { display: flex; align-items: center; gap: 12rpx; }.provider-avatar { display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; flex: 0 0 58rpx; border-radius: 17rpx; color: #FFF; background: linear-gradient(145deg,#6573DC,#8B91E8); font-size: 24rpx; font-weight: 800; }.card-copy { display: flex; flex: 1; flex-direction: column; min-width: 0; }.provider-name,.demand-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.provider-name { color: #303B57; font-size: 25rpx; font-weight: 750; }.demand-title { margin-top: 4rpx; color: #8D99AC; font-size: 20rpx; }.status { flex: 0 0 auto; padding: 5rpx 8rpx; border-radius: 8rpx; font-size: 18rpx; }.status-invited,.status-viewed { color: #B7791F; background: #FFF5DF; }.status-quoted,.status-accepted { color: #0F8A61; background: #ECF9F3; }.status-declined,.status-closed,.status-expired { color: #8D99AC; background: #F2F4F8; }
.match-line,.quote-line { display: flex; align-items: baseline; gap: 14rpx; margin-top: 14rpx; color: #8D99AC; font-size: 20rpx; }.match-line text:first-child { color: #6573DC; font-weight: 700; }.quote-price { color: #FF6B35; font-size: 30rpx; font-weight: 800; }.reason-row { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 12rpx; }.reason-row text { padding: 5rpx 8rpx; border-radius: 8rpx; color: #5D6BD2; background: #EEF0FF; font-size: 18rpx; }.message { display: block; margin-top: 12rpx; color: #66738A; font-size: 21rpx; line-height: 1.5; }.card-actions { display: flex; gap: 10rpx; margin-top: 15rpx; }.card-actions button { margin: 0; padding: 9rpx 13rpx; border-radius: 10rpx; font-size: 20rpx; line-height: 1.4; }.primary-action { color: #FFF; background: #6573DC; }.secondary-action { border: 1rpx solid #DDE2F4; color: #5D6BD2; background: #F8F9FF; }.muted-action { color: #7E8A9D; background: #F4F5F8; }.state { padding: 60rpx 24rpx; color: #8D99AC; font-size: 23rpx; text-align: center; }.state.error { color: #D87E68; }.empty { display: flex; flex-direction: column; align-items: center; padding: 100rpx 24rpx; color: #8D99AC; font-size: 25rpx; }.empty-icon { font-size: 65rpx; }.empty-copy { margin-top: 8rpx; color: #A0AABD; font-size: 21rpx; }
.modal-mask { position: fixed; z-index: 10; inset: 0; display: flex; align-items: flex-end; background: rgba(29,37,62,.45); }.modal { width: 100%; padding: 28rpx 24rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: #FFF; box-sizing: border-box; }.modal-head { display: flex; align-items: flex-start; justify-content: space-between; }.modal-title,.modal-subtitle { display: block; }.modal-title { color: #303B57; font-size: 31rpx; font-weight: 800; }.modal-subtitle { max-width: 600rpx; margin-top: 5rpx; overflow: hidden; color: #8D99AC; font-size: 20rpx; text-overflow: ellipsis; white-space: nowrap; }.close { color: #8D99AC; font-size: 42rpx; line-height: .7; }.form-row { display: flex; flex-direction: column; gap: 8rpx; margin-top: 18rpx; color: #6E7A90; font-size: 21rpx; }.form-row input,.form-row textarea { width: 100%; padding: 14rpx; border: 1rpx solid #E5E9F1; border-radius: 12rpx; color: #303B57; background: #F8F9FC; font-size: 23rpx; box-sizing: border-box; }.form-row textarea { min-height: 150rpx; line-height: 1.5; }.submit { margin-top: 22rpx; padding: 16rpx; border-radius: 14rpx; color: #FFF; background: linear-gradient(135deg,#6573DC,#7C76D8); font-size: 24rpx; font-weight: 700; }
/* Enterprise workflow pass: proposals read like an operations inbox, not a campaign card. */
.page { color: #1F2329; background: #F5F6F8; }
.header { border-bottom: 1rpx solid #E5E6EB; }
.eyebrow { color: #1677FF; }
.title, .provider-name, .modal-title { color: #1F2329; }
.subtitle, .demand-title, .state, .empty-copy, .modal-subtitle { color: #86909C; }
.refresh { border-color: #D9DDE3; border-radius: 8rpx; color: #0958D9; background: #FFF; }
.summary-row, .proposal-card { border-color: #E5E6EB; border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(31,35,41,.03); }
.summary-item text, .match-line text:first-child, .quote-price { color: #1677FF; }
.provider-avatar { background: #1677FF; border-radius: 10rpx; }
.reason-row text { color: #0958D9; background: #E8F3FF; border-radius: 6rpx; }
.card-actions button { border-radius: 8rpx; }
.primary-action, .submit { color: #FFF; background: #1677FF; }
.secondary-action { border-color: #D9DDE3; color: #646A73; background: #FFF; }
.muted-action { color: #646A73; background: #F2F3F5; }
.modal { border-radius: 16rpx 16rpx 0 0; }
.form-row input, .form-row textarea { border-color: #D9DDE3; border-radius: 8rpx; color: #1F2329; background: #FFF; }
.milestone-preview { margin-top: 14rpx; padding-top: 12rpx; border-top: 1rpx solid #ECE9E2; }
.milestone-preview-label { display: block; margin-bottom: 7rpx; color: #8B8175; font-size: 18rpx; letter-spacing: .08em; }
.milestone-preview-item { display: flex; justify-content: space-between; gap: 16rpx; padding: 6rpx 0; color: #514B44; font-size: 20rpx; }
.milestone-editor { margin-top: 22rpx; padding-top: 20rpx; border-top: 1rpx solid #E8E4DC; }
.milestone-editor-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; margin-bottom: 12rpx; }
.milestone-editor-title, .milestone-editor-copy { display: block; }
.milestone-editor-title { color: #27241F; font-size: 23rpx; font-weight: 700; }
.milestone-editor-copy { margin-top: 4rpx; color: #8B8175; font-size: 18rpx; }
.add-milestone { flex: 0 0 auto; color: #6A3D37; font-size: 20rpx; }
.milestone-edit-row { display: flex; align-items: center; gap: 8rpx; margin-top: 9rpx; }
.milestone-index { display: flex; align-items: center; justify-content: center; width: 32rpx; height: 32rpx; color: #6F675E; background: #F0ECE4; font-size: 17rpx; }
.milestone-edit-row input { min-width: 0; flex: 1; padding: 12rpx; border: 1rpx solid #E2DDD4; border-radius: 6rpx; color: #27241F; background: #FCFBF8; font-size: 20rpx; box-sizing: border-box; }
.milestone-edit-row .milestone-amount { flex: 0 0 130rpx; }
.remove-milestone { padding: 8rpx; color: #A0978C; font-size: 28rpx; }
.empty .empty-icon { width: 65rpx; height: 65rpx; }

/* 提案列表的状态徽标和操作按钮固定占位，标题/说明列允许缩小换行。 */
.header,
.summary-row,
.proposal-card,
.card-head,
.card-copy,
.match-line,
.quote-line,
.milestone-preview-item { min-width: 0; }
.header,
.summary-row { flex: 0 0 auto; }
.header > view:first-child,
.card-copy { flex: 1; min-width: 0; overflow: hidden; }
.refresh,
.provider-avatar,
.status,
.quote-price { flex: 0 0 auto; }
.title,
.subtitle,
.provider-name,
.demand-title,
.message,
.milestone-preview-item > text { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.title,
.subtitle,
.provider-name,
.demand-title,
.milestone-preview-item > text { white-space: nowrap; }
.message { overflow-wrap: anywhere; word-break: break-word; }
.match-line,
.quote-line,
.milestone-preview-item,
.card-actions { flex-wrap: wrap; }
.card-actions button { flex: 0 1 auto; max-width: 100%; white-space: nowrap; }
.modal-mask,
.modal { max-width: 100%; box-sizing: border-box; }
.modal { max-height: 84vh; overflow-y: auto; }

@media (max-width: 360px) {
  .header,
  .summary-row,
  .list-scroll { padding-right: 18rpx; padding-left: 18rpx; }
  .proposal-card { padding-right: 14rpx; padding-left: 14rpx; }
  .card-actions button { padding-right: 10rpx; padding-left: 10rpx; }
}
</style>
