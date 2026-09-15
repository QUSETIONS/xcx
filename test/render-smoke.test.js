/**
 * 渲染冒烟测试 —— 守住"页面整页不可见/空列表"这一已证实会发生的 bug 类
 *
 * 背景：接线守卫（vue-wiring-guard）能抓"生命周期/淡入开关/未定义调用"，
 * 但抓不到"渲染出来是空的"。本套件把关键列表页真正挂起来（按 uni 自定义元素编译），
 * 断言它们渲染出非空内容。这是对 12 页不可见事故的第二道网。
 *
 * 约束：
 * - 用 @vue/test-utils 挂载，uni 内置组件（view/text/image/scroll-view…）按自定义元素处理
 * - mock @dcloudio/uni-app 的页面生命周期（onLoad 等），解耦 uni 运行时
 * - mock 数据同步（未迁移页）/ 经 bridge 带 200ms 延迟（迁移页）；用 fake timers + flushLoads 让异步加载在断言前就绪
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

// 解耦 uni-app 运行时；onLoad 回调被捕获，可用 fireOnLoad(params) 模拟带路由参数的页面加载
const _onLoadCbs = []
vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (cb) => { _onLoadCbs.push(cb) },
  onShow: () => {},
  onHide: () => {},
  onUnload: () => {},
  onReady: () => {},
  onPullDownRefresh: () => {},
  onReachBottom: () => {},
  onShareAppMessage: () => {},
  onShareTimeline: () => {}
}))
const fireOnLoad = (params = {}) => { _onLoadCbs.forEach(cb => cb(params)); _onLoadCbs.length = 0 }

// uni 内置组件在 H5/小程序编译器里是自定义元素；在 happy-dom 中也按自定义元素处理，
// 避免把 view/text/image 等误判为 Vue 组件后产生保留标签告警。block 同样是 uni 运行时标签。
const UNI_CUSTOM_ELEMENTS = new Set([
  'view', 'text', 'image', 'scroll-view', 'swiper', 'swiper-item', 'switch', 'picker',
  'picker-view', 'picker-view-column', 'movable-area', 'movable-view', 'cover-view',
  'cover-image', 'web-view', 'rich-text', 'navigator', 'slider', 'progress', 'icon',
  'map', 'canvas', 'block'
])
const mountPage = (comp, user = {}) => {
  const pinia = createPinia()
  const userStore = useUserStore(pinia)
  userStore.applySession({
    token: 'render-test-token',
    user: { id: 'demo_user_001', nickname: '演示用户', role: 'user', ...user }
  })
  return mount(comp, {
    global: {
      plugins: [pinia],
      config: { compilerOptions: { isCustomElement: (tag) => UNI_CUSTOM_ELEMENTS.has(tag) } }
    }
  })
}

// 迁移页经 bridge 加载有 ~200ms 延迟（setTimeout + Promise 链），部分页面有两段串行加载；
// 用异步版 advanceTimersByTimeAsync 推进计时器并 flush 其间所有微任务（对同步页无害）
const flushLoads = async () => {
  await vi.advanceTimersByTimeAsync(700)
  await nextTick()
}

beforeEach(() => { globalThis.__resetStore(); _onLoadCbs.length = 0; vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('渲染冒烟：关键列表页', () => {
  it('demand/list 渲染出非空需求列表', async () => {
    const DemandList = (await import('@/pages/demand/list.vue')).default
    const wrapper = mountPage(DemandList)
    await flushLoads()
    const items = wrapper.findAll('.demand-item')
    expect(items.length, '需求大厅应渲染出需求卡片').toBeGreaterThan(0)
  })

  it('mall/list 渲染出非空商品列表', async () => {
    const MallList = (await import('@/pages/mall/list.vue')).default
    const wrapper = mountPage(MallList)
    await flushLoads()
    expect(wrapper.findAll('.product-item').length, '商城应渲染出商品卡片').toBeGreaterThan(0)
  })

  it('resource/list 渲染出非空资料列表', async () => {
    const ResourceList = (await import('@/pages/resource/list.vue')).default
    const wrapper = mountPage(ResourceList)
    await flushLoads()
    expect(wrapper.findAll('.resource-item').length, '资料库应渲染出资料卡片').toBeGreaterThan(0)
  })

  it('user/my-demands 渲染出我的需求', async () => {
    const MyDemands = (await import('@/pages/user/my-demands.vue')).default
    const wrapper = mountPage(MyDemands)
    await flushLoads()
    expect(wrapper.findAll('.demand-item').length, '我的需求应非空').toBeGreaterThan(0)
  })

  it('user/my-leads 渲染出我的对接', async () => {
    const MyLeads = (await import('@/pages/user/my-leads.vue')).default
    const wrapper = mountPage(MyLeads)
    await flushLoads()
    expect(wrapper.findAll('.lead-item').length, '我的对接应非空').toBeGreaterThan(0)
  })

  it('user/my-orders 渲染出我的订单', async () => {
    const MyOrders = (await import('@/pages/user/my-orders.vue')).default
    const wrapper = mountPage(MyOrders)
    await flushLoads()
    expect(wrapper.findAll('.order-item').length, '我的订单应非空').toBeGreaterThan(0)
  })

  it('user/my-favorites 渲染出我的收藏', async () => {
    // 收藏是 storage 持久化的，新用户为空（正确行为）；这里先种一条再挂载，验证有数据时的渲染
    const { favoriteService } = await import('@/mock/service')
    favoriteService.toggle({ userId: 'demo_user_001', targetType: 'demand', targetId: 'demand_1' })
    const MyFavorites = (await import('@/pages/user/my-favorites.vue')).default
    const wrapper = mountPage(MyFavorites)
    await flushLoads()
    expect(wrapper.findAll('.fav-item').length, '我的收藏应非空').toBeGreaterThan(0)
  })

  it('demand/detail 带路由参数渲染出详情与匹配服务商', async () => {
    // 详情页靠 onLoad 的 query.id 加载数据；fireOnLoad 模拟进入 ?id=demand_1
    const DemandDetail = (await import('@/pages/demand/detail.vue')).default
    const wrapper = mountPage(DemandDetail)
    fireOnLoad({ id: 'demand_1' })
    await flushLoads()
    expect(wrapper.find('.hero-title').text().length, '详情头部标题应非空').toBeGreaterThan(0)
    expect(wrapper.findAll('.provider-item').length, '匹配服务商应渲染').toBeGreaterThan(0)
    expect(wrapper.findAll('.review-item').length + wrapper.find('.review-empty').exists(), '评价区应渲染（列表或空态）').toBeGreaterThan(0)
  })

  it('乙方进入需求详情时只看项目与需求 Agent，不展示其他服务商目录', async () => {
    const DemandDetail = (await import('@/pages/demand/detail.vue')).default
    const wrapper = mountPage(DemandDetail, { workflow_role: 'service_provider' })
    fireOnLoad({ id: 'demand_1' })
    await flushLoads()
    expect(wrapper.find('.demand-agent-card').exists()).toBe(true)
    expect(wrapper.findAll('.provider-item')).toHaveLength(0)
    expect(wrapper.text()).toContain('询问 Agent')
    expect(wrapper.text()).not.toContain('可进一步了解的合作方')
  })

  it('切换语言后页面文本随之更新（i18n 渲染响应式）', async () => {
    // 验证 t() 在 render 中调用确实是响应式的：切语言 → 页面文本重渲染
    const { setLocale } = await import('@/i18n')
    setLocale('zh-CN')
    const wrapper = mountPage((await import('@/pages/demand/list.vue')).default)
    await flushLoads()
    const zh = wrapper.find('.header-title').text()
    expect(zh.length).toBeGreaterThan(0)
    setLocale('en-US')
    await flushLoads()
    const en = wrapper.find('.header-title').text()
    expect(en, '切到英文后标题文本应变化').not.toBe(zh)
    setLocale('zh-CN') // 还原，避免污染其他用例
  })
})

// 自定义元素原样透传 class / attrs（含 onTap），可用 .trigger('tap') 触发页面处理器。
// input/textarea 使用 happy-dom 原生实现，v-model 经 setValue 正常更新。
describe('交互：筛选 / 搜索路径', () => {
  it('mall/list 搜索无匹配关键词后过滤为空并显示空状态', async () => {
    const MallList = (await import('@/pages/mall/list.vue')).default
    const wrapper = mountPage(MallList)
    await flushLoads()
    expect(wrapper.findAll('.product-item').length, '初始应有商品').toBeGreaterThan(0)
    await wrapper.find('input.search-input').setValue('zzz_no_match_zzz')
    await wrapper.find('.search-btn').trigger('tap') // 触发 doSearch → 客户端关键词过滤
    await flushLoads()
    expect(wrapper.findAll('.product-item').length, '无匹配应过滤为空').toBe(0)
    expect(wrapper.find('.empty').exists(), '应显示空状态').toBe(true)
  })

  it('mall/list 点服务类型筛选后商品类型同质', async () => {
    const MallList = (await import('@/pages/mall/list.vue')).default
    const wrapper = mountPage(MallList)
    await flushLoads()
    const cats = wrapper.findAll('.cat-item')
    expect(cats.length, '应有"全部"+若干类型').toBeGreaterThan(1)
    await cats.at(1).trigger('tap') // 选第一个具体服务类型 → selectType → loadList
    await flushLoads()
    const nodes = wrapper.findAll('.product-item .product-type')
    const types = []
    for (let i = 0; i < nodes.length; i++) types.push(nodes.at(i).text())
    if (types.length) {
      expect(types.every(t => t === types[0]), '筛选后商品服务类型应一致').toBe(true)
    }
  })

  it('intake 自动保存期间继续输入会保留新内容并续存下一版本', async () => {
    const { bridge } = await import('@/api/bridge')
    const mineSpy = vi.spyOn(bridge.intake, 'mine').mockResolvedValue({ profile: null, invite: null })
    let resolveFirstSave
    const saveSpy = vi.spyOn(bridge.intake, 'save')
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirstSave = resolve }))
      .mockResolvedValue({ profile: { id: 'draft-2', role: 'project', status: 'draft' }, invite: null })

    try {
      const IntakePage = (await import('@/pages/intake/index.vue')).default
      const wrapper = mountPage(IntakePage)
      await flushLoads()
      await wrapper.findAll('.role-card').at(1).trigger('tap')
      const inputs = wrapper.findAll('input.field-input')
      await inputs.at(0).setValue('第一版企业名')
      await inputs.at(1).setValue('测试联系人')
      await inputs.at(2).setValue('负责人')

      await vi.advanceTimersByTimeAsync(1200)
      expect(saveSpy).toHaveBeenCalledTimes(1)
      await inputs.at(0).setValue('请求期间的新企业名')
      resolveFirstSave({
        profile: { id: 'draft-1', role: 'project', status: 'draft', company_name: '第一版企业名' },
        invite: null
      })
      await nextTick()
      expect(wrapper.findAll('input.field-input').at(0).element.value).toBe('请求期间的新企业名')

      await vi.advanceTimersByTimeAsync(1200)
      expect(saveSpy).toHaveBeenCalledTimes(2)
      expect(saveSpy.mock.calls[1][0].company_name).toBe('请求期间的新企业名')
      wrapper.unmount()
    } finally {
      mineSpy.mockRestore()
      saveSpy.mockRestore()
    }
  })
})

describe('渲染冒烟：开屏动效', () => {
  it('OpeningRitual 按完整时序保持可见，结束后才淡出并通知页面', async () => {
    const OpeningRitual = (await import('@/components/OpeningRitual.vue')).default
    const wrapper = mount(OpeningRitual)
    await nextTick()

    expect(wrapper.find('.opening-ritual').exists(), '开屏应在首次渲染时存在').toBe(true)
    expect(wrapper.find('.opening-ritual').classes()).toContain('opening-ritual--calibrating')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')

    await vi.advanceTimersByTimeAsync(140)
    expect(wrapper.find('.opening-ritual').classes()).toContain('opening-ritual--drawing')

    await vi.advanceTimersByTimeAsync(380)
    expect(wrapper.find('.opening-ritual').classes()).toContain('opening-ritual--locked')

    await vi.advanceTimersByTimeAsync(460)
    expect(wrapper.find('.opening-ritual').classes()).toContain('opening-ritual--closing')
    expect(wrapper.emitted('complete')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(220)
    expect(wrapper.emitted('complete')).toHaveLength(1)
    wrapper.unmount()
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
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
      await flushLoads()
      expect(wrapper.exists(), `${rel} 应挂载成功`).toBe(true)
    })
  }
})
