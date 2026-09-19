import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  userStore: {
    token: 'test-token',
    isLoggedIn: true,
    isAdmin: false,
    userInfo: { nickname: '测试用户', company: '测试企业', title: '负责人', city: '上海', workflow_role: 'service_provider', organization_type: 'project', usage_credits: 0 },
    ensureLogin: vi.fn().mockResolvedValue(true),
    refreshInfo: vi.fn().mockResolvedValue({}),
    logout: vi.fn()
  }
}))

vi.mock('@dcloudio/uni-app', () => ({ onShow: () => {} }))
vi.mock('@/hooks/useNavTitle', () => ({ useNavTitle: () => {} }))
vi.mock('@/stores/user', () => ({ useUserStore: () => mocks.userStore }))
vi.mock('@/api/bridge', () => ({ bridge: {} }))

import UserPage from '@/pages/user/index.vue'

const compilerOptions = {
  isCustomElement: (tag) => new Set(['view', 'text', 'image']).has(tag)
}

describe('我的页面账户操作', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.__resetStore()
    vi.useFakeTimers()
  })

  it('显示设置和退出登录入口，并清理会话后返回首页', async () => {
    const wrapper = mount(UserPage, { global: { config: { compilerOptions } } })
    expect(wrapper.find('.settings-entry').text()).toContain('设置')
    expect(wrapper.find('.logout-entry').text()).toContain('退出登录')

    uni.setStorageSync('qiye_ku_token', 'test-token')
    await wrapper.find('.logout-entry').trigger('tap')

    expect(mocks.userStore.logout).toHaveBeenCalledTimes(1)
    expect(uni.getStorageSync('qiye_ku_token')).toBe('')
    expect(uni.showToast).toHaveBeenCalledWith({ title: '已退出', icon: 'none' })
    await vi.advanceTimersByTimeAsync(800)
    expect(uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/index/index' })
    wrapper.unmount()
    vi.useRealTimers()
  })
})
