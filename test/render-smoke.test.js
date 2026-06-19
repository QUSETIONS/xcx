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
import { createPinia } from 'pinia'

// 解耦 uni-app 运行时；onLoad 回调被捕获，可用 fireOnLoad(params) 模拟带路由参数的页面加载
const _onLoadCbs = []
vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (cb) => { _onLoadCbs.push(cb) },
  onShow: () => {},
  onHide: () => {},
  onUnload: () => {},
  onReady: () => {},
  onPullDownRefresh: () => {},
  onReachBottom: () => {}
}))
const fireOnLoad = (params = {}) => { _onLoadCbs.forEach(cb => cb(params)); _onLoadCbs.length = 0 }

// uni 内置组件 → 渲染为 div，透传 class 并渲染子节点。
// 用安全组件名 'UniStub' 避免 Vue「保留 HTML 元素名」告警（image/switch 等是 SVG 保留名）。
const uniStub = { name: 'UniStub', inheritAttrs: false, render() { return h('div', this.$attrs, this.$slots.default?.()) } }
const STUB_TAGS = ['view', 'text', 'image', 'scroll-view', 'swiper', 'swiper-item', 'switch', 'picker', 'picker-view', 'picker-view-column', 'movable-area', 'movable-view', 'cover-view', 'cover-image', 'web-view', 'rich-text', 'navigator', 'slider', 'progress', 'icon', 'map', 'canvas']
const stubs = STUB_TAGS.reduce((m, tag) => (m[tag] = uniStub, m), {})

const mountPage = (comp) => mount(comp, { global: { stubs, plugins: [createPinia()] } })

beforeEach(() => { globalThis.__resetStore(); _onLoadCbs.length = 0 })

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

  it('demand/detail 带路由参数渲染出详情与 AI 匹配服务商', async () => {
    // 详情页靠 onLoad 的 query.id 加载数据；fireOnLoad 模拟进入 ?id=demand_1
    const DemandDetail = (await import('@/pages/demand/detail.vue')).default
    const wrapper = mountPage(DemandDetail)
    fireOnLoad({ id: 'demand_1' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.hero-title').text().length, '详情头部标题应非空').toBeGreaterThan(0)
    expect(wrapper.findAll('.provider-item').length, 'AI 匹配服务商应渲染').toBeGreaterThan(0)
    expect(wrapper.findAll('.review-item').length + wrapper.find('.review-empty').exists(), '评价区应渲染（列表或空态）').toBeGreaterThan(0)
  })

  it('切换语言后页面文本随之更新（i18n 渲染响应式）', async () => {
    // 验证 t() 在 render 中调用确实是响应式的：切语言 → 页面文本重渲染
    const { setLocale } = await import('@/i18n')
    setLocale('zh-CN')
    const wrapper = mountPage((await import('@/pages/demand/list.vue')).default)
    await wrapper.vm.$nextTick()
    const zh = wrapper.find('.header-title').text()
    expect(zh.length).toBeGreaterThan(0)
    setLocale('en-US')
    await wrapper.vm.$nextTick()
    const en = wrapper.find('.header-title').text()
    expect(en, '切到英文后标题文本应变化').not.toBe(zh)
    setLocale('zh-CN') // 还原，避免污染其他用例
  })
})

// 挂载脚手架把 uni 内置组件 stub 为 div 并透传 $attrs（含 onTap），
// 故 @tap 经 inheritAttrs 落到 div 上，可用 .trigger('tap') 触发页面处理器。
// input/textarea 未 stub（原生），v-model 经 setValue 正常更新。
describe('交互：筛选 / 搜索路径', () => {
  it('mall/list 搜索无匹配关键词后过滤为空并显示空状态', async () => {
    const MallList = (await import('@/pages/mall/list.vue')).default
    const wrapper = mountPage(MallList)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.product-item').length, '初始应有商品').toBeGreaterThan(0)
    await wrapper.find('input.search-input').setValue('zzz_no_match_zzz')
    await wrapper.find('.search-btn').trigger('tap') // 触发 doSearch → 客户端关键词过滤
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.product-item').length, '无匹配应过滤为空').toBe(0)
    expect(wrapper.find('.empty').exists(), '应显示空状态').toBe(true)
  })

  it('mall/list 点服务类型筛选后商品类型同质', async () => {
    const MallList = (await import('@/pages/mall/list.vue')).default
    const wrapper = mountPage(MallList)
    await wrapper.vm.$nextTick()
    const cats = wrapper.findAll('.cat-item')
    expect(cats.length, '应有"全部"+若干类型').toBeGreaterThan(1)
    await cats.at(1).trigger('tap') // 选第一个具体服务类型 → selectType → loadList
    await wrapper.vm.$nextTick()
    const nodes = wrapper.findAll('.product-item .product-type')
    const types = []
    for (let i = 0; i < nodes.length; i++) types.push(nodes.at(i).text())
    if (types.length) {
      expect(types.every(t => t === types[0]), '筛选后商品服务类型应一致').toBe(true)
    }
  })
})

// 全页面挂载守卫：自动发现 src/pages 下所有 .vue，逐个挂载并喂通用路由参数，
// 断言无一在 onMounted/onLoad 数据路径上抛错。这是 demand/list loadList 那类
// "进页即崩"缺陷的可扩展版——从采样 8 页扩到全部 ~46 页。
const pageModules = import.meta.glob('/src/pages/**/*.vue', { eager: true })

describe('渲染冒烟：全页面挂载不抛错', () => {
  expect(Object.keys(pageModules).length, '应发现页面模块').toBeGreaterThan(20)
  for (const [file, mod] of Object.entries(pageModules)) {
    const rel = file.replace('/src/pages/', '').replace(/\.vue$/, '')
    it(`${rel} 挂载与数据加载不抛错`, async () => {
      const wrapper = mountPage(mod.default)        // 触发 onMounted 数据加载
      fireOnLoad({ id: 'demand_1' })                // 喂通用路由参数（详情页用，其余忽略）
      await wrapper.vm.$nextTick()
      expect(wrapper.exists(), `${rel} 应挂载成功`).toBe(true)
    })
  }
})
