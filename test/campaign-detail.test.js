import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let onLoadCallback
const mocks = vi.hoisted(() => ({ detail: vi.fn() }))

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback) => { onLoadCallback = callback }
}))
vi.mock('@/api/bridge', () => ({
  bridge: { campaign: { detail: mocks.detail } }
}))

import CampaignDetail from '@/pages/campaign/detail.vue'

const compilerOptions = {
  isCustomElement: (tag) => new Set(['view', 'text', 'image', 'button']).has(tag)
}

describe('活动详情页', () => {
  let wrapper

  beforeEach(() => {
    mocks.detail.mockReset()
    mocks.detail.mockResolvedValue({
      id: 'campaign_1',
      title: '半导体产业链调研行',
      description: '围绕产业链项目开展交流。',
      end_text: '2026年9月18日 · 上海',
      city: '上海',
      signup_url: 'https://example.com/register'
    })
    onLoadCallback = null
    wrapper = mount(CampaignDetail, { global: { config: { compilerOptions } } })
  })

  afterEach(() => wrapper.unmount())

  it('从路由 id 加载并展示正确活动内容', async () => {
    await onLoadCallback({ id: 'campaign_1' })
    await flushPromises()
    expect(mocks.detail).toHaveBeenCalledWith('campaign_1')
    expect(wrapper.find('.detail-title').text()).toBe('半导体产业链调研行')
    expect(wrapper.find('.detail-copy').text()).toContain('围绕产业链项目开展交流')
    expect(wrapper.text()).toContain('复制报名链接')
  })

  it('活动不存在时展示明确空态，而不是空白页面', async () => {
    mocks.detail.mockResolvedValue(null)
    await onLoadCallback({ id: 'missing' })
    await flushPromises()
    expect(wrapper.find('.detail-state').text()).toContain('暂未找到这项活动')
  })
})
