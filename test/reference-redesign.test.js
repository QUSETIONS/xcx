import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AccountAuth from '@/components/AccountAuth.vue'
import MemberPage from '@/pages/member/index.vue'
import InformationPage from '@/pages/information/index.vue'

const mocks = vi.hoisted(() => ({
  register: vi.fn(), requestCode: vi.fn(), preview: vi.fn(), member: vi.fn(), news: vi.fn(), campaigns: vi.fn(),
  user: { userInfo: { usage_credits: 3 }, isLoggedIn: true }
}))
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ ...mocks.user, register: mocks.register }) }))
vi.mock('@/hooks/useNavTitle', () => ({ useNavTitle: () => {} }))
vi.mock('@/utils/require-login', () => ({ requirePageLogin: async () => true }))
vi.mock('@/api/bridge', () => ({ bridge: {
  user: { requestRegisterCode: mocks.requestCode }, intake: { invitePreview: mocks.preview },
  member: { current: mocks.member }, information: { news: mocks.news, activities: mocks.campaigns }
} }))

const wrappers = []
function render(component, props = {}) {
  const wrapper = mount(component, { props })
  wrappers.push(wrapper)
  return wrapper
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.member.mockResolvedValue({ certification_level: 'C', tier: 'pro', name: '优享级', expire: '2999-10-15' })
  mocks.news.mockResolvedValue([])
  mocks.campaigns.mockResolvedValue([])
})
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.useRealTimers() })

describe('参考图改版实际交互', () => {
  it('邀请入口先选择甲乙方，跳转独立页面时保留邀请码', async () => {
    mocks.preview.mockResolvedValue({ reward_options: [] })
    const wrapper = render(AccountAuth, { inviteCode: 'ABC123' })
    await flushPromises()
    expect(wrapper.findAll('.party-choice')).toHaveLength(2)
    expect(wrapper.find('.primary-btn').exists()).toBe(false)
    await wrapper.findAll('.party-choice')[1].trigger('tap')
    expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/user/register-b?invite_code=ABC123' })
  })

  it.each([['capital', '甲方注册', 'demand_owner'], ['project', '乙方注册', 'service_provider']])('%s 注册页面固定身份，验证码和同意门禁有效', async (party, title, workflow) => {
    vi.useFakeTimers()
    mocks.register.mockResolvedValue({})
    const wrapper = render(AccountAuth, { fixedParty: party })
    expect(wrapper.text()).toContain(title)
    expect(wrapper.findAll('.party-choice')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('平台使用方式')
    await wrapper.find('input[placeholder="请输入姓名或常用称呼"]').setValue('测试用户')
    await wrapper.find('input[placeholder="请输入11位手机号"]').setValue('13900000001')
    await wrapper.find('input[placeholder="至少8位，包含字母和数字"]').setValue('TestPass123')
    await wrapper.find('input[placeholder="再输入一次密码"]').setValue('TestPass123')
    await wrapper.find('input[placeholder="所在公司或机构"]').setValue('测试机构')
    await wrapper.find('input[placeholder="例如：市场负责人"]').setValue('负责人')
    await wrapper.find('input[placeholder="例如：上海"]').setValue('上海')
    await wrapper.find('.primary-btn').trigger('tap')
    expect(mocks.register).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请选择你的机构类型')
    // 机构类型与甲乙方身份解耦：乙方也可以选择资金机构。
    await wrapper.findAll('.org-option')[1].trigger('tap')
    await wrapper.find('.primary-btn').trigger('tap')
    expect(mocks.register).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请输入6位短信验证码')
    await wrapper.find('input[placeholder="请输入6位验证码"]').setValue('012345')
    await wrapper.find('.primary-btn').trigger('tap')
    expect(mocks.register).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('请先阅读并同意用户协议和隐私政策')
    await wrapper.find('.consent-row').trigger('tap')
    await wrapper.find('.primary-btn').trigger('tap')
    await flushPromises()
    expect(mocks.register).toHaveBeenCalledWith(expect.objectContaining({ registration_party: workflow, organization_type: 'capital', workflow_role: workflow, code: '012345', agreement_consent: true }))
    await vi.advanceTimersByTimeAsync(300)
    expect(uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/intake/index' })
  })

  it('原专业会员直接对应优享级，旧认证字段不影响权益', async () => {
    const wrapper = render(MemberPage)
    await flushPromises()
    expect(wrapper.findAll('.level-card')).toHaveLength(3)
    expect(wrapper.find('.level-card.current').text()).toContain('优享级')
    expect(wrapper.findAll('.level-card.locked')).toHaveLength(1)
    expect(wrapper.text()).toContain('2999-10-15')
    expect(wrapper.text()).toContain('3 次')
    expect(wrapper.text()).not.toMatch(/OPC|认证|路线图|专家/)
    await wrapper.find('.upgrade-button').trigger('tap')
    expect(uni.showModal).toHaveBeenCalledWith(expect.objectContaining({ title: '了解尊享级', content: expect.stringContaining('暂未开放') }))
  })

  it('过期会员恢复基础级但仍显示邀请余额，不再显示过期等级特权', async () => {
    mocks.member.mockResolvedValue({ tier: 'enterprise', expire: '2020-01-01' })
    const wrapper = render(MemberPage)
    await flushPromises()
    expect(wrapper.find('.level-card.current').text()).toContain('基础级')
    expect(wrapper.text()).toContain('原等级已到期')
    expect(wrapper.text()).toContain('3 次')
  })

  it('快讯失败不会抹掉活动，刷新后可以阅读新闻正文', async () => {
    mocks.news.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([{ id: 'n1', title: '测试快讯', content: '测试正文', source_name: '测试来源', published_at: '2026-09-14T08:00:00Z' }])
    mocks.campaigns.mockResolvedValue([{ id: 'c1', title: '测试活动', type: 'invite' }])
    const wrapper = render(InformationPage)
    await flushPromises()
    expect(wrapper.text()).toContain('快讯暂时加载失败')
    expect(wrapper.text()).toContain('测试活动')
    await wrapper.find('.refresh-button').trigger('tap')
    await flushPromises()
    expect(wrapper.text()).not.toContain('快讯暂时加载失败')
    await wrapper.find('.news-item').trigger('tap')
    expect(wrapper.find('.news-detail').text()).toContain('测试正文')
    await wrapper.find('.close-button').trigger('tap')
    expect(wrapper.find('.news-detail').exists()).toBe(false)
  })
  it('社群活动立即参与直达对应活动，复用已有报名流程', async () => {
    mocks.campaigns.mockResolvedValue([{ id: 'event_1', group_id: 'group_1', title: '社群活动', registration_count: 3 }])
    const wrapper = render(InformationPage)
    await flushPromises()
    expect(wrapper.text()).toContain('已有 3 人报名')
    expect(wrapper.find('.join-button').text()).toBe('立即参与')
    await wrapper.find('.join-button').trigger('tap')
    expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/network/detail?id=group_1&event_id=event_1' })
  })

  it('平台活动点击进入对应活动详情页，不再停留在资讯页弹窗', async () => {
    mocks.campaigns.mockResolvedValue([{ id: 'campaign_1', title: '平台活动', type: 'event', signup_url: 'https://example.com/register' }])
    const wrapper = render(InformationPage)
    await flushPromises()
    await wrapper.find('.join-button').trigger('tap')
    expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/campaign/detail?id=campaign_1' })
    expect(uni.showModal).not.toHaveBeenCalled()
  })
})
