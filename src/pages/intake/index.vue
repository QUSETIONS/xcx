<template>
  <scroll-view class="page-scroll" scroll-y>
    <view v-if="loading" class="page-state"><view class="state-spinner" /><text>正在读取资料…</text></view>
    <view v-else class="page">
      <view class="hero">
        <text class="eyebrow">MEDIA MATCH / USER INTAKE</text>
        <text class="title">把身份与合作边界<br />说清楚</text>
        <text class="desc">这是媒合智联 App 内置的甲乙方资料入口。先选资金方或项目企业，再填写对应档案；草稿可随时保存并继续编辑，资料不会因提交而自动公开。</text>
        <view class="hero-note"><text class="hero-note-label">提交门槛</text><text class="hero-note-copy">带 * 的 3 项身份信息 + 基础背调授权即可提交</text></view>
      </view>

      <view v-if="profile?.status" class="status-banner" :class="`status-${profile.status}`">
        <view class="status-main"><text class="status-kicker">资料状态</text><text class="status-title">{{ statusLabel(profile.status) }}</text></view>
        <text class="status-copy">{{ statusCopy(profile.status) }}</text>
        <text v-if="profile.review_note" class="status-note">审核说明：{{ profile.review_note }}</text>
      </view>

      <view class="section-block">
          <view class="section-heading"><text class="section-index">01</text><view><text class="section-title">先选择你的融资身份</text><text class="section-desc">甲方是资金方；乙方是有融资或合作需求的项目企业</text></view></view>
        <view class="role-grid">
          <view v-for="item in roleOptions" :key="item.value" class="role-card" :class="{ active: form.role === item.value }" @tap="selectRole(item.value)">
            <view class="role-mark"><image class="role-icon" :src="item.value === 'project' ? '/static/icons/handshake.svg' : '/static/icons/package.svg'" mode="aspectFit" /></view>
            <text class="role-title">{{ item.label }}</text>
            <text class="role-desc">{{ item.desc }}</text>
            <text v-if="form.role === item.value" class="role-selected">已选择</text>
          </view>
        </view>
      </view>

      <template v-if="form.role">
        <view class="section-block">
          <view class="section-heading"><text class="section-index">02</text><view><text class="section-title">联系人信息</text><text class="section-desc">用于联系和去重；带 * 的项目可以先提交，资料不会自动公开</text></view></view>
          <view class="form-card">
            <view class="field"><text class="field-label">对接企业 / 机构 <text class="required">*</text></text><input v-model="form.company_name" class="field-input" maxlength="120" placeholder="请输入企业或机构名称" /></view>
            <view class="field-row">
              <view class="field field-half"><text class="field-label">联系人姓名 <text class="required">*</text></text><input v-model="form.contact_name" class="field-input" maxlength="60" placeholder="怎么称呼" /></view>
              <view class="field field-half"><text class="field-label">职位 / 身份 <text class="required">*</text></text><input v-model="form.contact_title" class="field-input" maxlength="80" placeholder="例如：创始人、投资总监" /></view>
            </view>
            <view class="field-row">
              <view class="field field-half"><view class="field-label-row"><text class="field-label">联系电话</text><text class="field-hint">可选</text></view><input v-model="form.contact_phone" class="field-input" type="number" maxlength="20" placeholder="手机号或座机" /></view>
              <view class="field field-half"><view class="field-label-row"><text class="field-label">联系微信</text><text class="field-hint">可选</text></view><input v-model="form.contact_wechat" class="field-input" maxlength="80" placeholder="微信号" /></view>
            </view>
            <view class="field"><view class="field-label-row"><text class="field-label">所在城市</text><text class="field-hint">可选</text></view><input v-model="form.city" class="field-input" maxlength="40" placeholder="例如：上海" /></view>
            <view class="field"><view class="field-label-row"><text class="field-label">注册地 / 经营地</text><text class="field-hint">可选，用于基础核验</text></view><input v-model="form.registered_location" class="field-input" maxlength="160" placeholder="例如：上海市静安区" /></view>
            <view class="field"><view class="field-label-row"><text class="field-label">统一社会信用代码 / 核验信息</text><text class="field-hint">可选，仅后台可见</text></view><input v-model="form.credential_no" class="field-input" maxlength="80" placeholder="企业填信用代码；个人项目可填核验说明" /></view>
            <view class="field"><view class="field-label-row"><text class="field-label">所属行业</text><text class="field-hint">可选，之后可修改</text></view><view class="chip-wrap"><view v-for="item in industryOptions" :key="item.value" class="choice-chip" :class="{ active: form.primary_industry === item.value }" @tap="form.primary_industry = item.value">{{ item.label }}</view></view></view>
            <view class="field"><view class="field-label-row"><text class="field-label">业务范围</text><text class="field-hint">可选</text></view><input v-model="form.business_scope" class="field-input" maxlength="500" placeholder="用一句话说明你做什么" /></view>
            <view class="field"><view class="field-label-row"><text class="field-label">业务 / 项目介绍</text><text class="field-hint">可选，填得越多越好匹配</text></view><textarea v-model="form.business_intro" class="field-textarea" maxlength="3000" placeholder="想展示什么、需要什么资源，有想法再写，之后也能补充。" /></view>
            <view class="field"><view class="field-label-row"><text class="field-label">期待交流的城市</text><text class="field-hint">可选，可填写多个</text></view><view class="inline-add-row"><input v-model="targetCityDraft" class="field-input inline-input" maxlength="40" placeholder="输入城市后加入" @confirm="addTargetCity" /><view class="inline-add" @tap="addTargetCity">加入</view></view><view v-if="form.target_cities.length" class="tag-wrap"><view v-for="city in form.target_cities" :key="city" class="soft-tag" @tap="removeTargetCity(city)">{{ city }} ×</view></view></view>
          </view>
        </view>

        <view class="section-block supplement-entry">
          <view class="supplement-toggle" @tap="toggleSupplement"><view><text class="section-title">补充匹配信息</text><text class="section-desc">可选，不影响提交；填得越多，平台越容易找到合适的合作方</text></view><text class="supplement-action">{{ supplementExpanded ? '收起' : '展开填写' }} <text>{{ supplementExpanded ? '↑' : '↓' }}</text></text></view>
        </view>

        <template v-if="supplementExpanded">
          <view v-if="form.role === 'project'" class="section-block">
            <view class="section-heading"><text class="section-index">03</text><view><text class="section-title">企业 / 项目资料</text><text class="section-desc">固定区间用于基础门槛和分池；不想填写时可以留空</text></view></view>
            <view class="form-card">
              <view class="field"><view class="field-label-row"><text class="field-label">本轮融资金额</text><text class="field-hint">可选，可后补</text></view><view class="choice-list"><view v-for="item in financingOptions" :key="item.value" class="choice-row" :class="{ active: form.financing_amount_range === item.value }" @tap="form.financing_amount_range = item.value"><text>{{ item.label }}</text><text class="choice-mark">{{ form.financing_amount_range === item.value ? '✓' : '' }}</text></view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">年流水范围</text><text class="field-hint">可选，可暂不披露</text></view><view class="choice-list"><view v-for="item in revenueOptions" :key="item.value" class="choice-row" :class="{ active: form.annual_revenue_range === item.value }" @tap="form.annual_revenue_range = item.value"><text>{{ item.label }}</text><text class="choice-mark">{{ form.annual_revenue_range === item.value ? '✓' : '' }}</text></view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">项目 / 企业阶段</text><text class="field-hint">可选</text></view><view class="chip-wrap"><view v-for="item in stageOptions" :key="item.value" class="choice-chip" :class="{ active: form.project_stage === item.value }" @tap="form.project_stage = item.value">{{ item.label }}</view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">融资用途</text><text class="field-hint">可选</text></view><textarea v-model="form.financing_purpose" class="field-textarea" maxlength="1000" placeholder="例如：研发投入、市场拓展、产能建设或并购整合" /></view>
              <view class="field"><view class="field-label-row"><text class="field-label">可接受成本 / 股权条件</text><text class="field-hint">可选</text></view><input v-model="form.acceptable_terms" class="field-input" maxlength="500" placeholder="例如：可接受的利率、期限或股权稀释范围" /></view>
              <view class="field"><view class="field-label-row"><text class="field-label">期望到款时间</text><text class="field-hint">可选</text></view><input v-model="form.expected_funding_time" class="field-input" maxlength="120" placeholder="例如：3 个月内 / 2026 年第四季度" /></view>
              <view class="field"><view class="field-label-row"><text class="field-label">财务材料</text><text class="field-hint">可填材料名称或受控链接</text></view><textarea v-model="form.financial_materials" class="field-textarea compact-textarea" maxlength="1000" placeholder="请勿填写密码；材料默认仅后台审核可见" /></view>
              <view class="field"><view class="field-label-row"><text class="field-label">商业计划书</text><text class="field-hint">可填材料名称或受控链接</text></view><textarea v-model="form.business_plan_materials" class="field-textarea compact-textarea" maxlength="1000" placeholder="填写已准备的版本或受控访问地址" /></view>
              <view class="field target-field"><view class="field-label-row"><text class="field-label">想交流的企业</text><text class="field-hint">可填写多家，并分别备注</text></view><view v-for="(target, index) in form.target_companies" :key="target.id || index" class="target-card"><view class="target-top"><text class="target-index">企业 {{ index + 1 }}</text><text class="remove-link" @tap="removeTarget(index)">移除</text></view><input v-model="target.company_name" class="field-input" maxlength="120" placeholder="企业名称" /><view class="field-row target-row"><input v-model="target.industry" class="field-input field-half" maxlength="40" placeholder="行业" /><input v-model="target.intent" class="field-input field-half" maxlength="120" placeholder="想交流什么" /></view><textarea v-model="target.note" class="target-note" maxlength="300" placeholder="给这家企业的备注（可选）" /></view><view v-if="form.target_companies.length < 20" class="add-target" @tap="addTarget">＋ 添加一家企业</view></view>
            </view>
          </view>

          <view v-else class="section-block">
            <view class="section-heading"><text class="section-index">03</text><view><text class="section-title">资金方资料</text><text class="section-desc">体量均为可选项；只在你愿意时提供，用于更精准匹配</text></view></view>
            <view class="form-card">
              <view class="field"><view class="field-label-row"><text class="field-label">机构类型</text><text class="field-hint">可选</text></view><view class="chip-wrap"><view v-for="item in institutionTypeOptions" :key="item.value" class="choice-chip" :class="{ active: form.institution_type === item.value }" @tap="form.institution_type = item.value">{{ item.label }}</view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">机构资金规模</text><text class="field-hint">可选，不公开</text></view><view class="choice-list"><view v-for="item in capitalOptions" :key="item.value" class="choice-row" :class="{ active: form.capital_size_range === item.value }" @tap="form.capital_size_range = item.value"><text>{{ item.label }}</text><text class="choice-mark">{{ form.capital_size_range === item.value ? '✓' : '' }}</text></view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">单笔投资区间</text><text class="field-hint">可选</text></view><view class="chip-wrap"><view v-for="item in ticketOptions" :key="item.value" class="choice-chip" :class="{ active: form.investment_ticket_range === item.value }" @tap="form.investment_ticket_range = item.value">{{ item.label }}</view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">偏好投资阶段</text><text class="field-hint">可多选</text></view><view class="chip-wrap"><view v-for="item in investmentStageOptions" :key="item.value" class="choice-chip" :class="{ active: form.investment_stages.includes(item.value) }" @tap="toggleArray('investment_stages', item.value)">{{ item.label }}</view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">投资方向</text><text class="field-hint">可多选，可后补</text></view><view class="chip-wrap"><view v-for="item in directionOptions" :key="item.value" class="choice-chip" :class="{ active: form.investment_directions.includes(item.value) }" @tap="toggleArray('investment_directions', item.value)">{{ item.label }}</view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">计划投入统计口径</text><text class="field-hint">可选</text></view><view class="chip-wrap"><view v-for="item in planPeriodOptions" :key="item.value" class="choice-chip" :class="{ active: form.investment_plan_period === item.value }" @tap="form.investment_plan_period = item.value">{{ item.label }}</view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">计划投入资金范围</text><text class="field-hint">可选，可暂不披露</text></view><view class="choice-list"><view v-for="item in planRangeOptions" :key="item.value" class="choice-row" :class="{ active: form.investment_plan_range === item.value }" @tap="selectPlanRange(item.value)"><text>{{ item.label }}</text><text class="choice-mark">{{ form.investment_plan_range === item.value ? '✓' : '' }}</text></view></view></view>
              <view class="field"><view class="field-label-row"><text class="field-label">成本 / 利率偏好</text><text class="field-hint">可选</text></view><input v-model="form.cost_preference" class="field-input" maxlength="500" placeholder="例如：股权投资、可转债或目标收益要求" /></view>
              <view class="field"><view class="field-label-row"><text class="field-label">牌照与资质材料</text><text class="field-hint">可填材料名称或受控链接</text></view><textarea v-model="form.qualification_materials" class="field-textarea compact-textarea" maxlength="1000" placeholder="例如：基金备案、牌照或机构资质说明" /></view>
              <view class="field"><view class="field-label-row"><text class="field-label">机构介绍与历史案例</text><text class="field-hint">可选</text></view><textarea v-model="form.case_materials" class="field-textarea compact-textarea" maxlength="1000" placeholder="填写代表案例、已投项目或受控材料地址" /></view>
              <view class="field"><view class="field-label-row"><text class="field-label">希望寻找的项目 / 标的备注</text><text class="field-hint">可选</text></view><textarea v-model="form.cooperation_intent" class="field-textarea" maxlength="500" placeholder="例如：关注产业孵化、早中期科技项目或并购整合机会。" /></view>
            </view>
          </view>

          <view class="section-block">
            <view class="section-heading"><text class="section-index">04</text><view><text class="section-title">圈层与合作偏好</text><text class="section-desc">选中后补充城市或资源规模，减少后续反复沟通</text></view></view>
            <view class="form-card">
              <view class="field"><text class="field-label">希望进入或交流的圈层</text><view class="chip-wrap"><view v-for="item in circleOptions" :key="item.value" class="choice-chip" :class="{ active: form.circle_ids.includes(item.value) }" @tap="toggleCircle(item.value)">{{ item.label }}</view></view></view>
              <template v-for="item in circleOptions" :key="`detail-${item.value}`"><view v-if="form.circle_ids.includes(item.value)" class="circle-detail"><view class="circle-detail-title"><text>{{ item.label }}</text><text class="field-hint">补充一项即可</text></view><view class="field-row"><input v-model="form.circle_details[item.value].city" class="field-input field-half" maxlength="40" placeholder="相关城市" /><input v-model="form.circle_details[item.value].count" class="field-input field-half" maxlength="40" placeholder="资源 / 成员数量" /></view><input v-model="form.circle_details[item.value].note" class="field-input" maxlength="300" placeholder="合作备注（可选）" /></view></template>
            </view>
          </view>
        </template>

        <view class="section-block">
          <view class="section-heading"><text class="section-index">05</text><view><text class="section-title">授权与基础门槛</text><text class="section-desc">基础背调是提交必选；展示和匹配意愿由你分别决定</text></view></view>
          <view class="form-card">
            <view class="consent-row" @tap="form.background_consent = !form.background_consent"><view class="check-box" :class="{ checked: form.background_consent }">{{ form.background_consent ? '✓' : '' }}</view><view class="consent-copy"><text class="consent-title">我同意平台对本资料做基础背调 <text class="required">*</text></text><text class="consent-desc">仅核对基本身份、企业公开信息及提交内容的一致性，不等同于投资、融资或合作承诺。</text></view></view>
            <view class="consent-row" @tap="form.matching_opt_in = !form.matching_opt_in"><view class="check-box" :class="{ checked: form.matching_opt_in }">{{ form.matching_opt_in ? '✓' : '' }}</view><view class="consent-copy"><text class="consent-title">希望平台按已填写资料帮我匹配项目 / 合作方</text><text class="consent-desc">勾选后，运营会根据你提供的方向和城市联系你；不勾选也可以先提交并进入平台。</text></view></view>
            <view class="consent-row" @tap="toggleDisplayConsent"><view class="check-box" :class="{ checked: form.display_consent }">{{ form.display_consent ? '✓' : '' }}</view><view class="consent-copy"><text class="consent-title">我授权平台按下方范围展示我的资料摘要</text><text class="consent-desc">不勾选时，仅用于平台内部运营筛选，不对外展示。</text></view></view>
            <view v-if="form.display_consent" class="scope-list"><view v-for="item in scopeOptions" :key="item.value" class="scope-row" :class="{ active: form.display_scope === item.value }" @tap="form.display_scope = item.value"><text class="scope-radio">{{ form.display_scope === item.value ? '●' : '○' }}</text><view><text class="scope-title">{{ item.label }}</text><text class="scope-desc">{{ item.desc }}</text></view></view></view>
          </view>
        </view>

        <text v-if="validationMessage" class="validation-message">{{ validationMessage }}</text>
        <text v-if="autoSaveState" class="autosave-state" :class="`autosave-${autoSaveState}`">{{ autoSaveCopy }}</text>
        <view class="intake-action-bar"><view class="save-button" :class="{ disabled: saving || autoSaving }" @tap="saveDraft">{{ saving || autoSaving ? '保存中…' : '保存草稿' }}</view><view class="submit-button" :class="{ disabled: saving || autoSaving }" @tap="submit">{{ saving ? '提交中…' : (profile?.status === 'approved' ? '重新提交审核' : '提交资料') }}<text> →</text></view></view>
        <text class="bottom-hint">提交后可在这里继续补充资料和查看审核状态；审核说明会保留在本页。</text>

        <view v-if="invite" class="invite-card">
          <view class="invite-head"><view><text class="invite-kicker">LINKER / INVITE</text><text class="invite-title">邀请朋友一起进入内测</text></view><text class="invite-code">{{ invite.code }}</text></view>
          <text class="invite-desc">把这个入口发给项目方、企业或资金机构。对方可自行选择身份并填写自己的资料。</text>
          <view v-if="invite.reward_options?.length" class="invite-reward-copy">先指定你自己要获得的权益；对方注册时再任选自己的权益，双方可以不同。注册成功即分别到账，不以资料审核通过为前提。</view>
          <view v-if="invite.reward_options?.length" class="invite-owner-reward">
            <view class="invite-owner-reward-title"><text>我收到的权益</text><text class="field-hint">仅影响之后的新注册</text></view>
            <view class="invite-owner-reward-options">
              <view v-for="item in invite.reward_options" :key="item.value" class="invite-owner-reward-option" :class="{ active: inviterRewardType === item.value, disabled: inviteRewardSaving }" @tap="setInviteReward(item.value)">
                <text>{{ item.display || item.label }}</text><text>{{ inviterRewardType === item.value ? '✓' : '○' }}</text>
              </view>
            </view>
            <text v-if="inviteRewardSaving" class="invite-reward-saving">保存中…</text>
          </view>
          <view class="invite-rules"><text class="invite-rules-title">邀请规则</text><text>· 每位新用户只能绑定一个邀请码，不能填写自己的邀请码。</text><text>· 你先指定邀请人权益；对方注册时任选受邀人权益，双方可以不同。</text><text>· 每次注册都会锁定当时的两份选择，之后改选不影响已发放奖励。</text><text>· 对方之后从普通入口填写资料，邀请关系也会自动保留。</text></view>
          <view v-if="invite.qr_url" class="invite-qr-row"><image class="invite-qr" :src="invite.qr_url" mode="aspectFit" @tap="previewInviteQr" /><view class="invite-qr-copy"><text class="invite-qr-title">扫码进入注册页</text><text>也可以复制邀请码手动填写</text></view></view>
           <view class="invite-actions"><view class="copy-button" @tap="copyInvite">复制邀请链接</view><view class="copy-code" @tap="copyInviteCode">复制邀请码</view></view>
        </view>
      </template>
    </view>
  </scroll-view>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useUserStore } from '@/stores/user'
import { toastError } from '@/utils/feedback'
import { cloneIntake, emptyIntakeForm, frontValidate, INTAKE_OPTIONS, pruneRoleSpecificFields, REFERRAL_REWARD_OPTIONS, ROLE_OPTIONS, shouldQueueDraftSave, shouldResetPublicIntakeSession, STATUS_LABELS } from '@/utils/intake'
import { clearPublicIntakeSession, hasStoredAccessToken } from '@/utils/session'

useNavTitle('titles.intake', '甲乙方档案')

const userStore = useUserStore()
const roleOptions = ROLE_OPTIONS
const industryOptions = INTAKE_OPTIONS.industries
const institutionTypeOptions = INTAKE_OPTIONS.institutionTypes
const revenueOptions = INTAKE_OPTIONS.revenueRanges
const stageOptions = INTAKE_OPTIONS.projectStages
const financingOptions = INTAKE_OPTIONS.financingAmountRanges
const investmentStageOptions = INTAKE_OPTIONS.investmentStages
const capitalOptions = INTAKE_OPTIONS.capitalRanges
const ticketOptions = INTAKE_OPTIONS.ticketRanges
const planPeriodOptions = INTAKE_OPTIONS.investmentPlanPeriods
const planRangeOptions = INTAKE_OPTIONS.investmentPlanRanges
const directionOptions = INTAKE_OPTIONS.investmentDirections
const circleOptions = INTAKE_OPTIONS.circles
const scopeOptions = INTAKE_OPTIONS.displayScopes
const form = ref(emptyIntakeForm())
const profile = ref(null)
const invite = ref(null)
const loading = ref(true)
const saving = ref(false)
const autoSaving = ref(false)
const autoSaveState = ref('')
const inviteRewardSaving = ref(false)
const validationMessage = ref('')
const targetCityDraft = ref('')
const referralCode = ref('')
const supplementExpanded = ref(false)
const hydrating = ref(true)
let autoSaveTimer = null
let lastSavedFingerprint = ''
const inviterRewardType = computed(() => invite.value?.inviter_reward_type || REFERRAL_REWARD_OPTIONS[0].value)
const autoSaveCopy = computed(() => ({
  pending: profile.value && profile.value.status !== 'draft' ? '内容有修改，保存后会重新进入草稿状态' : '内容有修改，等待自动保存',
  saving: '正在自动保存…',
  saved: '草稿已自动保存',
  failed: '自动保存失败，请点击“保存草稿”重试'
}[autoSaveState.value] || ''))

const statusLabel = (value) => STATUS_LABELS[value] || value || ''
const statusCopy = (value) => ({
  draft: '可以先提交基础身份信息，行业、城市和合作需求随时回来补充。',
  submitted: '资料已经收到，等待运营完成基础核对。',
  reviewing: '运营正在核对资料，请留意消息中心。',
  needs_more: '请按审核说明补充后重新提交。',
  approved: '资料已通过，后续按你授权的范围参与筛选。',
  rejected: '请查看审核说明，调整后可以重新提交。'
}[value] || '')

function ensureCircleDetails() {
  circleOptions.forEach((item) => {
    if (!form.value.circle_details[item.value]) form.value.circle_details[item.value] = { city: '', count: '', note: '' }
  })
}

function hasSupplementalContent(value) {
  return Boolean(value && (
    value.business_scope || value.business_intro || value.annual_revenue_range || value.project_stage ||
    value.financing_amount_range || value.financing_purpose || value.acceptable_terms || value.expected_funding_time ||
    value.financial_materials || value.business_plan_materials || value.institution_type || value.investment_stages?.length ||
    value.cost_preference || value.qualification_materials || value.case_materials ||
    value.capital_size_range || value.investment_ticket_range || value.investment_plan_period ||
    value.investment_plan_range || value.investment_directions?.length || value.cooperation_intent ||
    value.target_companies?.length || value.circle_ids?.length
  ))
}

function applyProfile(nextProfile, nextInvite) {
  hydrating.value = true
  profile.value = cloneIntake(nextProfile)
  invite.value = cloneIntake(nextInvite || nextProfile?.invite || null)
  syncAccountSnapshot(nextProfile)
  if (!nextProfile) {
    const info = userStore.userInfo || {}
    form.value = {
      ...emptyIntakeForm(),
      contact_name: info.nickname || '',
      contact_title: info.title || '',
      contact_phone: info.phone || '',
      company_name: info.company || '',
      city: info.city || '',
      role: info.organization_type === 'capital' ? 'capital' : info.organization_type === 'project' ? 'project' : ''
    }
    ensureCircleDetails()
    supplementExpanded.value = false
    finishHydration()
    return
  }
  form.value = { ...emptyIntakeForm(nextProfile.role || ''), ...cloneIntake(nextProfile) }
  ensureCircleDetails()
  supplementExpanded.value = hasSupplementalContent(nextProfile)
  finishHydration()
}

function formFingerprint() { return JSON.stringify(pruneRoleSpecificFields(form.value)) }

function finishHydration() {
  lastSavedFingerprint = formFingerprint()
  nextTick(() => { hydrating.value = false })
}

function hasDraftContent() {
  return Boolean(form.value.role && (
    String(form.value.company_name || '').trim() || String(form.value.contact_name || '').trim() ||
    String(form.value.contact_title || '').trim() || String(form.value.business_intro || '').trim()
  ))
}

function clearAutoSaveTimer() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = null
}

function applyAutoSaveResponse(result, fingerprint) {
  profile.value = cloneIntake(result?.profile || profile.value)
  invite.value = cloneIntake(result?.invite || result?.profile?.invite || invite.value)
  syncAccountSnapshot(result?.profile)
  lastSavedFingerprint = fingerprint
  validationMessage.value = ''
}

function syncAccountSnapshot(nextProfile) {
  if (!nextProfile || !userStore.userInfo || !usingPrivateSession()) return
  userStore.mergeProfileSnapshot({
    company: nextProfile.company_name || '',
    title: nextProfile.contact_title || '',
    city: nextProfile.city || '',
    organization_type: nextProfile.role
  })
}

function queueFollowupSave(sentFingerprint) {
  const currentFingerprint = formFingerprint()
  const status = profile.value?.status || ''
  if (!shouldQueueDraftSave({ sentFingerprint, currentFingerprint, lastSavedFingerprint, status })) {
    if (currentFingerprint !== lastSavedFingerprint && status && status !== 'draft') autoSaveState.value = 'pending'
    return
  }
  clearAutoSaveTimer()
  autoSaveState.value = 'pending'
  if (hasDraftContent()) autoSaveTimer = setTimeout(autoSaveDraft, 1200)
}

async function autoSaveDraft() {
  autoSaveTimer = null
  if (hydrating.value || loading.value || saving.value || autoSaving.value || !hasDraftContent()) return
  const fingerprint = formFingerprint()
  if (fingerprint === lastSavedFingerprint) return
  // 已提交或已进入审核的资料不会被后台自动降回草稿，用户可明确点击“保存草稿”再修改。
  if (profile.value && profile.value.status !== 'draft') { autoSaveState.value = 'pending'; return }
  autoSaving.value = true
  autoSaveState.value = 'saving'
  const sentFingerprint = fingerprint
  try {
    const result = usingPrivateSession() ? await bridge.intake.save(payload()) : await bridge.intake.publicSave(payload())
    applyAutoSaveResponse(result, fingerprint)
    autoSaveState.value = 'saved'
  } catch {
    autoSaveState.value = 'failed'
  } finally {
    autoSaving.value = false
    queueFollowupSave(sentFingerprint)
  }
}

function usingPrivateSession() {
  return Boolean(userStore.isLoggedIn || hasStoredAccessToken())
}

async function load() {
  loading.value = true
  try {
    const privateSession = usingPrivateSession()
    let result = privateSession ? await bridge.intake.mine() : await bridge.intake.publicMine()
    // 同一设备打开自己的邀请码时，不能把邀请人的公开会话误当成新填写人的资料。
    if (!privateSession && shouldResetPublicIntakeSession(referralCode.value, result?.profile, result?.invite)) {
      clearPublicIntakeSession()
      result = await bridge.intake.publicMine()
    }
    applyProfile(result?.profile, result?.invite)
    if (referralCode.value && !result?.profile) form.value.role = ''
  } catch (error) {
    toastError(error?.message || '内测资料加载失败')
  } finally {
    loading.value = false
  }
}

onLoad((query) => { referralCode.value = String(query?.inviteCode || query?.invite_code || '').trim().toUpperCase() })
onMounted(load)
onUnmounted(clearAutoSaveTimer)
onShareAppMessage(() => ({ title: '注册媒合智联，领取内测权益', path: invite.value?.register_path || invite.value?.path || '/pages/user/login' }))

watch(form, () => {
  if (hydrating.value || loading.value || saving.value || autoSaving.value) return
  const fingerprint = formFingerprint()
  if (fingerprint === lastSavedFingerprint) return
  clearAutoSaveTimer()
  if (!hasDraftContent()) { autoSaveState.value = ''; return }
  autoSaveState.value = 'pending'
  if (!profile.value || profile.value.status === 'draft') autoSaveTimer = setTimeout(autoSaveDraft, 1200)
}, { deep: true })

function selectRole(value) {
  if (form.value.role === value) return
  form.value = pruneRoleSpecificFields({ ...form.value, role: value })
  ensureCircleDetails()
  validationMessage.value = ''
}

function toggleArray(field, value) {
  const values = Array.isArray(form.value[field]) ? [...form.value[field]] : []
  const index = values.indexOf(value)
  if (index > -1) values.splice(index, 1)
  else values.push(value)
  form.value[field] = values
}

function toggleCircle(value) {
  toggleArray('circle_ids', value)
  ensureCircleDetails()
}

function toggleDisplayConsent() {
  form.value.display_consent = !form.value.display_consent
  if (!form.value.display_consent) form.value.display_scope = 'operations'
}

function toggleSupplement() { supplementExpanded.value = !supplementExpanded.value }

function selectPlanRange(value) {
  form.value.investment_plan_range = value
  if (value && !form.value.investment_plan_period) form.value.investment_plan_period = 'year'
}

function addTarget() {
  if (form.value.target_companies.length >= 20) return
  form.value.target_companies.push({ company_name: '', industry: '', intent: '', note: '' })
}

function removeTarget(index) { form.value.target_companies.splice(index, 1) }

function addTargetCity() {
  const city = targetCityDraft.value.trim()
  if (!city || form.value.target_cities.includes(city)) return
  form.value.target_cities.push(city.slice(0, 40))
  targetCityDraft.value = ''
}

function removeTargetCity(city) { form.value.target_cities = form.value.target_cities.filter((item) => item !== city) }

function payload() {
  const value = cloneIntake(form.value)
  if (referralCode.value) value.invite_code = referralCode.value
  return value
}

function applyResponse(result) { applyProfile(result?.profile, result?.invite); validationMessage.value = '' }

async function setInviteReward(value) {
  if (inviteRewardSaving.value || !invite.value?.code || value === inviterRewardType.value) return
  inviteRewardSaving.value = true
  validationMessage.value = ''
  try {
    const result = await bridge.intake.setInviteReward(value)
    applyResponse(result)
    uni.showToast({ title: '邀请权益已保存', icon: 'success' })
  } catch (error) {
    validationMessage.value = error?.message || '邀请权益保存失败，请重试'
  } finally {
    inviteRewardSaving.value = false
  }
}

async function saveDraft() {
  if (saving.value || autoSaving.value) return
  if (!form.value.role) { validationMessage.value = '请选择你的身份后再保存'; return }
  clearAutoSaveTimer()
  saving.value = true
  const sentFingerprint = formFingerprint()
  let hasNewerLocalEdit = false
  try {
    const result = usingPrivateSession() ? await bridge.intake.save(payload()) : await bridge.intake.publicSave(payload())
    hasNewerLocalEdit = formFingerprint() !== sentFingerprint
    if (hasNewerLocalEdit) applyAutoSaveResponse(result, sentFingerprint)
    else applyResponse(result)
    autoSaveState.value = 'saved'
    uni.showToast({ title: '草稿已保存', icon: 'success' })
  } catch (error) {
    validationMessage.value = error?.message || '草稿保存失败，请重试'
  } finally {
    saving.value = false
    if (formFingerprint() !== sentFingerprint) queueFollowupSave(sentFingerprint)
  }
}

async function submit() {
  if (saving.value || autoSaving.value) return
  const message = frontValidate(form.value)
  if (message) { validationMessage.value = message; return }
  clearAutoSaveTimer()
  saving.value = true
  const sentFingerprint = formFingerprint()
  let hasNewerLocalEdit = false
  try {
    const result = usingPrivateSession() ? await bridge.intake.submit(payload()) : await bridge.intake.publicSubmit(payload())
    hasNewerLocalEdit = formFingerprint() !== sentFingerprint
    if (hasNewerLocalEdit) applyAutoSaveResponse(result, sentFingerprint)
    else applyResponse(result)
    autoSaveState.value = hasNewerLocalEdit ? 'pending' : ''
    uni.showToast({ title: '资料已提交，等待审核', icon: 'success' })
  } catch (error) {
    validationMessage.value = error?.message || '资料提交失败，请重试'
  } finally {
    saving.value = false
    if (formFingerprint() !== sentFingerprint) queueFollowupSave(sentFingerprint)
  }
}

function copyInvite() {
  const code = invite.value?.code || ''
  const path = invite.value?.register_path || `/pages/user/login?invite_code=${encodeURIComponent(code)}`
  const value = invite.value?.share_url || invite.value?.register_url || (typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/#${path}`
    : path)
  uni.setClipboardData({ data: value, success: () => uni.showToast({ title: '邀请链接已复制', icon: 'success' }) })
}

function copyInviteCode() {
  if (!invite.value?.code) return
  uni.setClipboardData({ data: invite.value.code, success: () => uni.showToast({ title: '邀请码已复制', icon: 'success' }) })
}

function previewInviteQr() {
  if (!invite.value?.qr_url || typeof uni.previewImage !== 'function') return
  uni.previewImage({ urls: [invite.value.qr_url] })
}

</script>

<style lang="scss" scoped>
.page-scroll { height: 100vh; background: #f7f6f2; }
/* #ifdef H5 */
.page-scroll { height: calc(100vh - 44px); }
/* #endif */
.page { min-height: 100%; padding: 0 36rpx calc(160rpx + env(safe-area-inset-bottom)); box-sizing: border-box; color: #191816; background: #f7f6f2; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: #8a847b; font-size: 22rpx; }
.state-spinner { width: 38rpx; height: 38rpx; border: 3rpx solid #e6e0d5; border-top-color: #5c2828; border-radius: 50%; animation: spin .9s linear infinite; }
.hero { padding: 34rpx 0 40rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .11); }
.eyebrow, .section-index, .invite-kicker { display: block; color: #9a9286; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14rpx; letter-spacing: .13em; }
.title { display: block; margin-top: 22rpx; color: #1c1a17; font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-size: 48rpx; font-weight: 400; line-height: 1.22; letter-spacing: -.04em; }
.desc { display: block; max-width: 660rpx; margin-top: 20rpx; color: #837c72; font-size: 22rpx; line-height: 1.65; }.hero-note { display: flex; gap: 13rpx; align-items: baseline; max-width: 660rpx; margin-top: 22rpx; padding: 13rpx 15rpx; border-left: 4rpx solid #b49460; background: #f1ece3; }.hero-note-label { flex: 0 0 auto; color: #79603f; font-size: 18rpx; }.hero-note-copy { color: #81766a; font-size: 18rpx; line-height: 1.45; }
.status-banner { margin: 26rpx 0 4rpx; padding: 20rpx; border-left: 5rpx solid #5c2828; background: #f0e5df; }.status-banner.status-approved { border-color: #526153; background: #e9eee8; }.status-banner.status-needs_more, .status-banner.status-rejected { border-color: #a66b35; background: #f5eadb; }.status-main { display: flex; align-items: baseline; gap: 14rpx; }.status-kicker { color: #8a847b; font-size: 17rpx; }.status-title { color: #5c2828; font-size: 27rpx; font-weight: 600; }.status-approved .status-title { color: #526153; }.status-copy, .status-note { display: block; margin-top: 7rpx; color: #756d63; font-size: 19rpx; line-height: 1.5; }.status-note { color: #795f43; }
.section-block { padding-top: 44rpx; }.section-heading { display: flex; align-items: flex-start; gap: 16rpx; margin-bottom: 20rpx; }.section-index { flex: 0 0 38rpx; padding-top: 7rpx; color: #b49460; }.section-title { display: block; color: #27231e; font-family: 'Songti SC', 'STSong', serif; font-size: 31rpx; font-weight: 400; }.section-desc { display: block; margin-top: 7rpx; color: #9a9286; font-size: 19rpx; line-height: 1.45; }.supplement-entry { padding-top: 28rpx; }.supplement-toggle { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; padding: 18rpx 20rpx; border: 1rpx solid #ddd4c7; background: #fcfaf5; }.supplement-toggle > view { flex: 1; min-width: 0; }.supplement-action { flex: 0 0 auto; color: #5c2828; font-size: 19rpx; }
.role-grid { display: flex; gap: 14rpx; }.role-card { position: relative; flex: 1; min-width: 0; min-height: 204rpx; padding: 20rpx; border: 1rpx solid rgba(30, 27, 22, .13); background: #fcfaf5; box-sizing: border-box; }.role-card.active { border-color: #5c2828; box-shadow: inset 0 0 0 1rpx #5c2828; }.role-mark { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; background: #f0e5df; }.role-icon { display: block; width: 28rpx; height: 28rpx; opacity: .72; }.role-title { display: block; margin-top: 20rpx; color: #2a2722; font-size: 25rpx; font-weight: 600; }.role-desc { display: block; margin-top: 9rpx; color: #8b8378; font-size: 18rpx; line-height: 1.55; }.role-selected { position: absolute; right: 16rpx; top: 20rpx; color: #5c2828; font-size: 17rpx; }
.form-card { padding: 22rpx 20rpx; border-top: 1rpx solid rgba(30, 27, 22, .12); border-bottom: 1rpx solid rgba(30, 27, 22, .12); background: #fcfaf5; }.field { margin-bottom: 24rpx; }.field:last-child { margin-bottom: 0; }.field-row { display: flex; gap: 14rpx; }.field-half { flex: 1; min-width: 0; }.field-label, .field-hint { display: block; color: #70685e; font-size: 19rpx; }.field-hint { color: #a59d91; font-size: 17rpx; }.required { color: #8d443e; }.field-input, .field-textarea, .target-note { display: block; width: 100%; margin-top: 8rpx; padding: 15rpx 0; border-bottom: 1rpx solid rgba(30, 27, 22, .14); box-sizing: border-box; color: #27231e; background: transparent; font-size: 23rpx; }.field-textarea { min-height: 140rpx; line-height: 1.6; }.field-input::placeholder, .field-textarea::placeholder, .target-note::placeholder { color: #b1aaa0; }.field-label-row, .target-top, .circle-detail-title { display: flex; align-items: center; justify-content: space-between; }.chip-wrap { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 12rpx; }.choice-chip { padding: 10rpx 14rpx; border: 1rpx solid #dfd8cd; color: #80776b; background: #f7f3ec; font-size: 19rpx; }.choice-chip.active { border-color: #5c2828; color: #5c2828; background: #f0e5df; }.choice-list { margin-top: 10rpx; border-top: 1rpx solid rgba(30, 27, 22, .1); }.choice-row { display: flex; align-items: center; justify-content: space-between; padding: 17rpx 4rpx; border-bottom: 1rpx solid rgba(30, 27, 22, .08); color: #726b61; font-size: 21rpx; }.choice-row.active { color: #5c2828; }.choice-mark { color: #5c2828; font-family: Georgia, serif; font-size: 24rpx; }.inline-add-row { display: flex; align-items: center; gap: 14rpx; }.inline-input { flex: 1; min-width: 0; }.inline-add { flex: 0 0 auto; padding: 9rpx 13rpx; border-bottom: 1rpx solid #5c2828; color: #5c2828; font-size: 19rpx; }.tag-wrap { display: flex; flex-wrap: wrap; gap: 9rpx; margin-top: 11rpx; }.soft-tag { padding: 7rpx 11rpx; color: #6a6257; background: #efebe3; font-size: 18rpx; }
.target-field { margin-top: 6rpx; }.target-card { margin-top: 14rpx; padding: 16rpx; border: 1rpx solid #e0d9ce; background: #f8f4ed; }.target-index { color: #5c2828; font-size: 19rpx; }.remove-link { color: #a66b35; font-size: 18rpx; }.target-row { margin-top: 2rpx; }.target-note { min-height: 76rpx; padding-top: 12rpx; border-bottom: 0; font-size: 20rpx; }.add-target { display: block; margin-top: 16rpx; padding: 14rpx; border: 1rpx dashed #cfc6b9; color: #5c2828; font-size: 20rpx; text-align: center; }.circle-detail { margin: -4rpx 0 18rpx; padding: 16rpx; background: #f8f4ed; }.circle-detail-title { color: #5c2828; font-size: 20rpx; }.circle-detail .field-input { font-size: 20rpx; }
.consent-row { display: flex; align-items: flex-start; gap: 13rpx; padding: 17rpx 0; border-bottom: 1rpx solid rgba(30, 27, 22, .08); }.consent-row:last-of-type { border-bottom: 0; }.check-box { flex: 0 0 34rpx; width: 34rpx; height: 34rpx; border: 1rpx solid #bdb4a8; color: #fff; background: transparent; font-size: 24rpx; line-height: 34rpx; text-align: center; }.check-box.checked { border-color: #5c2828; background: #5c2828; }.consent-copy { flex: 1; min-width: 0; }.consent-title, .consent-desc { display: block; }.consent-title { color: #403a33; font-size: 20rpx; line-height: 1.45; }.consent-desc { margin-top: 6rpx; color: #9a9286; font-size: 17rpx; line-height: 1.5; }.scope-list { margin-top: 9rpx; padding-left: 47rpx; }.scope-row { display: flex; gap: 10rpx; padding: 11rpx 0; color: #8a8276; }.scope-radio { flex: 0 0 25rpx; color: #b2a99c; font-family: Georgia, serif; font-size: 22rpx; }.scope-row.active, .scope-row.active .scope-radio { color: #5c2828; }.scope-title, .scope-desc { display: block; }.scope-title { font-size: 19rpx; }.scope-desc { margin-top: 4rpx; font-size: 16rpx; }
.validation-message { display: block; margin-top: 26rpx; padding: 13rpx 15rpx; border-left: 4rpx solid #a66b35; color: #855e36; background: #f5eadb; font-size: 19rpx; line-height: 1.45; }.autosave-state { display: block; margin-top: 22rpx; color: #91887c; font-size: 17rpx; text-align: right; }.autosave-saved { color: #526153; }.autosave-failed { color: #9a4b42; }.intake-action-bar { display: flex; gap: 12rpx; margin-top: 10rpx; }.save-button, .submit-button { flex: 1; padding: 18rpx 12rpx; border: 1rpx solid #bfb5a8; color: #665e54; font-size: 21rpx; text-align: center; }.submit-button { border-color: #5c2828; color: #fff; background: #5c2828; }.save-button.disabled, .submit-button.disabled { opacity: .55; }.bottom-hint { display: block; margin-top: 14rpx; color: #aaa196; font-size: 17rpx; line-height: 1.5; text-align: center; }
.invite-card { margin-top: 48rpx; padding: 22rpx 20rpx; border: 1rpx solid rgba(92, 40, 40, .18); background: #f0e5df; }.invite-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16rpx; }.invite-title { display: block; margin-top: 10rpx; color: #38221f; font-family: 'Songti SC', serif; font-size: 27rpx; }.invite-code { color: #5c2828; font-family: Georgia, serif; font-size: 25rpx; letter-spacing: .08em; }.invite-desc { display: block; margin-top: 13rpx; color: #7f6e65; font-size: 18rpx; line-height: 1.55; }.invite-reward-copy { display: block; margin-top: 10rpx; color: #795f43; font-size: 18rpx; line-height: 1.5; }.invite-owner-reward { margin-top: 14rpx; padding: 14rpx; background: rgba(255, 252, 247, .68); }.invite-owner-reward-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12rpx; color: #5c2828; font-size: 19rpx; }.invite-owner-reward-options { display: flex; flex-wrap: wrap; gap: 9rpx; margin-top: 11rpx; }.invite-owner-reward-option { display: flex; align-items: center; gap: 8rpx; padding: 10rpx 12rpx; border: 1rpx solid #d4b8ad; color: #795f56; background: #fffaf5; font-size: 17rpx; }.invite-owner-reward-option.active { border-color: #5c2828; color: #5c2828; background: #f0e5df; }.invite-owner-reward-option.disabled { opacity: .58; }.invite-reward-saving { display: block; margin-top: 8rpx; color: #9a8075; font-size: 16rpx; }.invite-rules { display: flex; flex-direction: column; gap: 6rpx; margin-top: 13rpx; padding: 12rpx; color: #806f64; background: rgba(255, 252, 247, .52); font-size: 17rpx; line-height: 1.5; }.invite-rules-title { color: #5c2828; font-size: 18rpx; }.invite-qr-row { display: flex; align-items: center; gap: 16rpx; margin-top: 18rpx; padding: 12rpx; background: rgba(255, 252, 247, .62); }.invite-qr { flex: 0 0 168rpx; width: 168rpx; height: 168rpx; background: #fff; }.invite-qr-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 8rpx; color: #8a766b; font-size: 17rpx; line-height: 1.45; }.invite-qr-title { color: #5c2828; font-size: 20rpx; }.invite-actions { display: flex; gap: 10rpx; margin-top: 18rpx; }.copy-button, .copy-code { flex: 1; padding: 12rpx; border: 1rpx solid #b9978e; color: #5c2828; font-size: 18rpx; text-align: center; }.copy-button { color: #fff; background: #5c2828; }
.circle-detail .field-input { min-height: 40rpx; padding-top: 10rpx; padding-bottom: 10rpx; }

/* 档案页的输入区域需要一眼可辨、也要适合手指点击，避免只剩一条低对比度底线。 */
.form-card { padding: 26rpx 24rpx; border: 1rpx solid rgba(30, 27, 22, .13); border-radius: 6rpx; background: #fcfaf5; }
.field { margin-bottom: 26rpx; }
.field-label { color: #625a50; font-size: 20rpx; }
.field-hint { color: #8d8479; font-size: 17rpx; }
.field-input, .field-textarea, .target-note { margin-top: 9rpx; padding: 13rpx 14rpx; border: 1rpx solid #d8d0c4; border-radius: 5rpx; color: #27231e; background: #fffdf8; font-size: 23rpx; line-height: 1.45; }
.field-input { min-height: 72rpx; }
.field-textarea { min-height: 160rpx; }
.field-input:focus, .field-textarea:focus, .target-note:focus { border-color: #8d5b4d; background: #fffefa; }
.field-input::placeholder, .field-textarea::placeholder, .target-note::placeholder { color: #9d958a; }
.choice-list { border: 1rpx solid rgba(30, 27, 22, .12); }
.choice-row { padding-right: 14rpx; padding-left: 14rpx; }
.choice-row:last-child { border-bottom: 0; }
.choice-row.active { background: #f7eee8; }
.inline-add { min-height: 72rpx; padding: 13rpx 18rpx; border: 1rpx solid #8d5b4d; border-radius: 5rpx; background: #f5ebe5; line-height: 44rpx; }
.target-card, .circle-detail { border: 1rpx solid #e4dbcf; border-radius: 5rpx; }
.add-target { min-height: 72rpx; border-color: #b8a898; border-radius: 5rpx; background: #fffaf5; line-height: 42rpx; }
.intake-action-bar { gap: 14rpx; margin-top: 14rpx; }
.save-button, .submit-button { min-height: 76rpx; padding-top: 19rpx; padding-bottom: 19rpx; border-radius: 5rpx; line-height: 36rpx; }
.bottom-hint { color: #8f877d; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 420px) { .page { padding-right: 24rpx; padding-left: 24rpx; }.title { font-size: 42rpx; }.role-card { padding: 15rpx; }.role-title { font-size: 22rpx; }.role-desc { font-size: 17rpx; }.field-row { gap: 10rpx; } }
@media (min-width: 760px) { .page-scroll { background: #eceae5; }.page { width: 100%; max-width: 760px; margin: 0 auto; padding-right: 52px; padding-left: 52px; box-shadow: 0 0 70rpx rgba(42, 36, 29, .08); }.hero, .section-block, .validation-message, .intake-action-bar, .invite-card { max-width: none; margin-right: auto; margin-left: auto; }.role-card { min-height: 180rpx; } }
@media (orientation: landscape) and (min-width: 760px) { .page { max-width: 880px; }.hero { padding-top: 24rpx; padding-bottom: 28rpx; }.section-block { padding-top: 30rpx; } }
@media (max-width: 520px) { .field-row { flex-direction: column; gap: 14rpx; } }
@media (min-width: 760px) { .page { max-width: 960px; padding-right: 64px; padding-left: 64px; } }
@media (orientation: landscape) and (min-width: 760px) { .page { max-width: 1000px; } }
</style>
