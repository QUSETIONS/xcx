import { mount, flushPromises } from '@vue/test-utils'
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import Panel from '@/components/AgentMemoryPanel.vue'
const mocks = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn() }))
vi.mock('@/api/bridge', () => ({ bridge: { agent: { providerProfile: mocks.read, saveProviderProfile: mocks.save } } }))
let wrapper
beforeEach(() => {
  vi.clearAllMocks()
  mocks.read.mockResolvedValue({ profile_text: '服装品牌快闪案例', preferences_text: '只接上海，不接巡展', auto_remember: true, version: 4 })
  mocks.save.mockResolvedValue({ version: 5 })
})
afterEach(() => wrapper?.unmount())
async function open() {
  wrapper = mount(Panel); await flushPromises()
  await wrapper.find('.memory-heading').trigger('tap')
}
it('可查看原话、硬条件及隐私边界，修改带版本保存', async () => {
  await open()
  expect(wrapper.text()).toContain('仅限上海；不接巡展')
  expect(wrapper.text()).toContain('不自动发给甲方')
  await wrapper.findAll('textarea')[0].setValue('工业展览策划')
  await wrapper.findAll('textarea')[1].setValue('只接杭州')
  await wrapper.find('.memory-actions button').trigger('tap'); await flushPromises()
  expect(mocks.save).toHaveBeenCalledWith({ profile_text: '工业展览策划', preferences_text: '只接杭州', auto_remember: true, version: 4 })
})
it('读取失败不提供空白覆盖入口，重试后恢复原档案', async () => {
  mocks.read.mockRejectedValueOnce(new Error('offline'))
  await open()
  expect(wrapper.findAll('textarea')).toHaveLength(0)
  expect(wrapper.text()).toContain('不会用空内容覆盖')
  await wrapper.find('.memory-error button').trigger('tap'); await flushPromises()
  expect(wrapper.findAll('textarea')[0].element.value).toBe('服装品牌快闪案例')
  expect(mocks.save).not.toHaveBeenCalled()
})
it('版本冲突保留未保存编辑；刷新不会偷偷覆盖展开中的编辑', async () => {
  await open()
  await wrapper.findAll('textarea')[0].setValue('未保存的新案例')
  mocks.save.mockRejectedValue(new Error('档案已在其他页面更新，请重新读取后再保存'))
  await wrapper.find('.memory-actions button').trigger('tap'); await flushPromises()
  expect(wrapper.findAll('textarea')[0].element.value).toBe('未保存的新案例')
  await wrapper.vm.refresh()
  expect(mocks.read).toHaveBeenCalledTimes(1)
  expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('重新读取') }))
})
it('清空需确认，并停止自动记忆，保留服务器版本保护', async () => {
  await open()
  uni.showModal.mockImplementationOnce(() => {})
  await wrapper.findAll('.memory-actions button')[1].trigger('tap')
  expect(mocks.save).not.toHaveBeenCalled()
  await uni.showModal.mock.calls.at(-1)[0].success({ confirm: true }); await flushPromises()
  expect(mocks.save).toHaveBeenCalledWith({ profile_text: '', preferences_text: '', auto_remember: false, version: 4 })
})
