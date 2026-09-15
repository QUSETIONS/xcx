import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { derivePoolTags, emptyIntakeForm, frontValidate, INTAKE_OPTIONS, poolLabel, pruneRoleSpecificFields, shouldQueueDraftSave, shouldResetPublicIntakeSession } from '@/utils/intake'

describe('内测资料表单契约', () => {
  it('只填写三项身份信息和背调授权也可以提交', () => {
    const form = {
      ...emptyIntakeForm('project'),
      contact_name: '测试人', contact_title: '负责人', company_name: '测试企业', background_consent: true
    }
    expect(frontValidate(form)).toBe('')
  })

  it('项目方的基础门槛和筛选池字段完整时可以提交', () => {
    const form = {
      ...emptyIntakeForm('project'),
      contact_name: '测试人', contact_title: '负责人', company_name: '测试企业', city: '上海',
      primary_industry: 'ai', business_intro: '这是一段足够长的项目介绍，用于验证表单校验。',
      annual_revenue_range: '10m_50m', project_stage: 'growth', financing_amount_range: '5m_20m', background_consent: true
    }
    expect(frontValidate(form)).toBe('')
    expect(derivePoolTags(form)).toEqual(expect.arrayContaining(['project', 'industry:ai', 'city:上海', 'revenue:10m_50m', 'stage:growth', 'financing:5m_20m']))
  })

  it('资金方的体量和投资方向可以后补', () => {
    const form = {
      ...emptyIntakeForm('capital'),
      contact_name: '测试人', contact_title: '投资总监', company_name: '测试机构', background_consent: true
    }
    expect(frontValidate(form)).toBe('')
  })

  it('切换身份会清除另一身份的隐藏字段', () => {
    const asCapital = pruneRoleSpecificFields({
      ...emptyIntakeForm('capital'),
      annual_revenue_range: '10m_50m', project_stage: 'growth', financing_amount_range: '5m_20m',
      financing_purpose: '扩产', target_companies: [{ company_name: '旧目标企业' }]
    })
    expect(asCapital.annual_revenue_range).toBe('')
    expect(asCapital.project_stage).toBe('')
    expect(asCapital.financing_amount_range).toBe('')
    expect(asCapital.target_companies).toEqual([])

    const asProject = pruneRoleSpecificFields({
      ...emptyIntakeForm('project'),
      institution_type: 'fund', capital_size_range: '200m_1b', investment_ticket_range: '10m_50m',
      investment_directions: ['primary_market'], investment_stages: ['growth'], qualification_materials: '旧材料'
    })
    expect(asProject.institution_type).toBe('')
    expect(asProject.capital_size_range).toBe('')
    expect(asProject.investment_ticket_range).toBe('')
    expect(asProject.investment_directions).toEqual([])
    expect(asProject.investment_stages).toEqual([])
    expect(asProject.qualification_materials).toBe('')
  })

  it('保存进行中的新编辑会排队续存，但失败的同一版本不会无限重试', () => {
    expect(shouldQueueDraftSave({
      sentFingerprint: 'version-1', currentFingerprint: 'version-2', lastSavedFingerprint: 'version-1', status: 'draft'
    })).toBe(true)
    expect(shouldQueueDraftSave({
      sentFingerprint: 'version-2', currentFingerprint: 'version-2', lastSavedFingerprint: 'version-1', status: 'draft'
    })).toBe(false)
    expect(shouldQueueDraftSave({
      sentFingerprint: 'version-1', currentFingerprint: 'version-2', lastSavedFingerprint: 'version-1', status: 'submitted'
    })).toBe(false)
  })

  it('档案保存后可以同步当前账号的身份摘要', () => {
    const store = useUserStore(createPinia())
    store.applySession({ token: 'test-token', user: { id: 'user-1', company: '旧企业', organization_type: 'project' } })
    store.mergeProfileSnapshot({ company: '新机构', title: '投资总监', city: '上海', organization_type: 'capital' })
    expect(store.userInfo).toMatchObject({ company: '新机构', title: '投资总监', city: '上海', organization_type: 'capital' })
  })

  it('固定选项与筛选池标签可读', () => {
    expect(INTAKE_OPTIONS.industries.length).toBeGreaterThan(5)
    expect(INTAKE_OPTIONS.investmentPlanRanges).toEqual(expect.arrayContaining([expect.objectContaining({ value: 'undisclosed' })]))
    expect(poolLabel('revenue:10m_50m')).toContain('1000 万—5000 万')
    expect(poolLabel('plan_period:year')).toContain('今年')
    expect(poolLabel('institution:fund')).toContain('基金')
    expect(poolLabel('investment_stage:pre_ipo')).toContain('Pre-IPO')
  })

  it('圈层补充输入保留可交互高度，补充区和匹配选项存在', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/intake/index.vue'), 'utf8')
    expect(source).toMatch(/\.circle-detail \.field-input\s*\{[^}]*min-height:\s*40rpx/)
    expect(source).toContain('补充匹配信息')
    expect(source).toContain('matching_opt_in')
    expect(source).toContain('bridge.intake.publicMine()')
    expect(source).not.toContain("requirePageLogin(userStore, '登录后才能填写内测资料')")
    expect(source).toContain('复制邀请链接')
    expect(source).toContain('invite.qr_url')
    expect(source).toContain('register_path')
    expect(source).toContain('双方可以不同')
    expect(source).toContain('setInviteReward')
    expect(source).toContain('我收到的权益')
    expect(source).toContain('甲方是资金方')
    expect(source).toContain('乙方是有融资或合作需求的项目企业')
    expect(source).toContain('financing_amount_range')
    expect(source).toContain('investment_stages')
    expect(source).toContain('credential_no')
    expect(source).toContain('每位新用户只能绑定一个邀请码')
    expect(source).toMatch(/max-width:\s*960px/)
    expect(source).not.toMatch(/<text[^>]*class="(?:choice-chip|choice-row|soft-tag|inline-add|add-target|scope-row)/)
    expect(source).toContain('class="intake-action-bar"')
    expect(source).toContain('草稿已自动保存')
    expect(source).toContain('pruneRoleSpecificFields')
    expect(source).toContain('queueFollowupSave')
    expect(source).toContain('mergeProfileSnapshot')
    expect(source).not.toContain('class="action-bar"')
  })

  it('档案页在宽屏不再过窄，窄屏字段改为单列并保留触控高度', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/intake/index.vue'), 'utf8')
    const appSource = fs.readFileSync(path.resolve(process.cwd(), 'src/App.vue'), 'utf8')
    expect(appSource).toContain('--h5-shell-width: min(960px, calc(100vw - 48px))')
    expect(source).toContain('.field-input { min-height: 72rpx; }')
    expect(source).toContain('@media (max-width: 520px) { .field-row { flex-direction: column; gap: 14rpx; } }')
  })

  it('圈层校验只读取仍选中的圈层，展示授权取消后回到内部筛选', () => {
    const form = {
      ...emptyIntakeForm('project'),
      contact_name: '测试人', contact_title: '负责人', company_name: '测试企业', background_consent: true,
      circle_ids: ['park'], circle_details: { finance_club: { city: '上海' }, park: { city: '  ', count: '\t', note: '' } }
    }
    expect(frontValidate(form)).toContain('圈层')
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/intake/index.vue'), 'utf8')
    expect(source).toContain('function toggleDisplayConsent()')
    expect(source).toContain("form.value.display_scope = 'operations'")
  })

  it('打开新的邀请链接时不会复用其他人的公开会话', () => {
    const profile = { id: 'old-profile', invite: { code: 'MMOLD01' } }
    expect(shouldResetPublicIntakeSession('MMNEW01', profile, profile.invite)).toBe(true)
    expect(shouldResetPublicIntakeSession('MMOLD01', profile, profile.invite)).toBe(false)
    expect(shouldResetPublicIntakeSession('MMNEW01', { id: 'draft-profile' }, null)).toBe(true)
    expect(shouldResetPublicIntakeSession('', profile, profile.invite)).toBe(false)
  })
})
