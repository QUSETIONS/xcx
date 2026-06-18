/**
 * 渲染冒烟测试 —— 守住"页面整页不可见/空列表"这一已证实会发生的 bug 类
 *
 * 背景：接线守卫（vue-wiring-guard）能抓"生命周期/淡入开关/未定义调用"，
 * 但抓不到"渲染出来是空的"。本套件把关键列表页真正挂起来（带 uni 组件 stub），
 * 断言它们渲染出非空内容。这是对 12 页不可见事故的第二道网。
 *
 * 约束：
 * - 用 @vue/test-utils 挂载，uni 内置组件（view/text/image/scroll-view…）stub 为占位元素
 * - mock @dcloudio/uni-app 的页面生命周期（onLoad 等），解耦 uni 运行时
 * - mock 数据是同步的，挂载 + nextTick 后列表即就绪
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

// 解耦 uni-app 运行时（页面经 useNavTitle 引入 onLoad）
vi.mock('@dcloudio/uni-app', () => ({
  onLoad: () => {},
  onShow: () => {},
  onHide: () => {},
  onUnload: () => {},
  onReady: () => {},
  onPullDownRefresh: () => {},
  onReachBottom: () => {}
}))

// uni 内置组件 → 渲染为 div，透传 class 并渲染子节点。
// 用安全组件名 'UniStub' 避免 Vue「保留 HTML 元素名」告警（image/switch 等是 SVG 保留名）。
const uniStub = { name: 'UniStub', inheritAttrs: false, render() { return h('div', this.$attrs, this.$slots.default?.()) } }
const STUB_TAGS = ['view', 'text', 'image', 'scroll-view', 'swiper', 'swiper-item', 'switch', 'picker', 'picker-view', 'picker-view-column', 'movable-area', 'movable-view', 'cover-view', 'cover-image', 'webview']
const stubs = STUB_TAGS.reduce((m, tag) => (m[tag] = uniStub, m), {})

const mountPage = (comp) => mount(comp, { global: { stubs } })

beforeEach(() => { globalThis.__resetStore() })

describe('渲染冒烟：关键列表页', () => {
  it('demand/list 渲染出非空需求列表', async () => {
    const DemandList = (await import('@/pages/demand/list.vue')).default
    const wrapper = mountPage(DemandList)
    await wrapper.vm.$nextTick()
    const items = wrapper.findAll('.demand-item')
    expect(items.length, '需求大厅应渲染出需求卡片').toBeGreaterThan(0)
  })

  it('mall/list 渲染出非空商品列表', async () => {
    const MallList = (await import('@/pages/mall/list.vue')).default
    const wrapper = mountPage(MallList)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.product-item').length, '商城应渲染出商品卡片').toBeGreaterThan(0)
  })

  it('resource/list 渲染出非空资料列表', async () => {
    const ResourceList = (await import('@/pages/resource/list.vue')).default
    const wrapper = mountPage(ResourceList)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.resource-item').length, '资料库应渲染出资料卡片').toBeGreaterThan(0)
  })

  it('user/my-demands 渲染出我的需求', async () => {
    const MyDemands = (await import('@/pages/user/my-demands.vue')).default
    const wrapper = mountPage(MyDemands)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.demand-item').length, '我的需求应非空').toBeGreaterThan(0)
  })

  it('user/my-leads 渲染出我的对接', async () => {
    const MyLeads = (await import('@/pages/user/my-leads.vue')).default
    const wrapper = mountPage(MyLeads)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.lead-item').length, '我的对接应非空').toBeGreaterThan(0)
  })

  it('user/my-orders 渲染出我的订单', async () => {
    const MyOrders = (await import('@/pages/user/my-orders.vue')).default
    const wrapper = mountPage(MyOrders)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.order-item').length, '我的订单应非空').toBeGreaterThan(0)
  })

  it('user/my-favorites 渲染出我的收藏', async () => {
    // 收藏是 storage 持久化的，新用户为空（正确行为）；这里先种一条再挂载，验证有数据时的渲染
    const { favoriteService } = await import('@/mock/service')
    favoriteService.toggle({ userId: 'demo_user_001', targetType: 'demand', targetId: 'demand_1' })
    const MyFavorites = (await import('@/pages/user/my-favorites.vue')).default
    const wrapper = mountPage(MyFavorites)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.fav-item').length, '我的收藏应非空').toBeGreaterThan(0)
  })
})
