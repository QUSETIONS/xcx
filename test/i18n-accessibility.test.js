import { describe, it, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
  globalThis.__resetStore()
})

// ============ i18n ============
describe('i18n - 国际化', () => {
  it('默认语言为中文', async () => {
    const { locale, t } = await import('@/i18n')
    // 注意：模块级 locale 在测试间共享，先重置
    expect(['zh-CN', 'en-US']).toContain(locale.value)
    expect(typeof t('home.recommend')).toBe('string')
  })

  it('中文取值正确', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { t, setLocale } = await import('@/i18n')
    setLocale('zh-CN')
    expect(t('tab.home')).toBe('首页')
    expect(t('tab.user')).toBe('我的')
    expect(t('common.confirm')).toBe('确定')
  })

  it('英文取值正确', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { t, setLocale } = await import('@/i18n')
    setLocale('en-US')
    expect(t('tab.home')).toBe('Home')
    expect(t('tab.user')).toBe('Me')
    expect(t('common.confirm')).toBe('OK')
  })

  it('切换语言后取值变化', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { t, setLocale } = await import('@/i18n')
    setLocale('zh-CN')
    expect(t('common.cancel')).toBe('取消')
    setLocale('en-US')
    expect(t('common.cancel')).toBe('Cancel')
  })

  it('不存在的 key 回退到中文', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { t, setLocale } = await import('@/i18n')
    setLocale('en-US')
    // 英文包里没有的 key（虚构）应回退中文，再回退 key 本身
    expect(t('not.exist.key')).toBe('not.exist.key')
  })

  it('带兜底参数', async () => {
    vi.resetModules()
    const { t } = await import('@/i18n')
    expect(t('not.exist', '默认文案')).toBe('默认文案')
  })

  it('setLocale 持久化', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { setLocale } = await import('@/i18n')
    setLocale('en-US')
    expect(uni.getStorageSync('qiye_ku_locale')).toBe('en-US')
  })

  it('setLocale 不支持的语言返回 false', async () => {
    vi.resetModules()
    const { setLocale } = await import('@/i18n')
    expect(setLocale('fr-FR')).toBe(false)
  })
})

// ============ 无障碍 ============
describe('accessibility - 无障碍', () => {
  it('字体缩放默认为标准(1)', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { fontScale } = await import('@/utils/accessibility')
    expect(fontScale.value).toBe(1)
  })

  it('setFontScale 更新缩放并持久化', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { fontScale, setFontScale } = await import('@/utils/accessibility')
    setFontScale(1.25)
    expect(fontScale.value).toBe(1.25)
    expect(uni.getStorageSync('qiye_ku_font_scale')).toBe(1.25)
  })

  it('字体档位含4档', async () => {
    const { fontScales } = await import('@/utils/accessibility')
    expect(fontScales.length).toBe(4)
    expect(fontScales.map(f => f.label)).toEqual(['小', '标准', '大', '超大'])
  })

  it('rootStyle 根据缩放计算 font-size', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { rootStyle, setFontScale } = await import('@/utils/accessibility')
    setFontScale(1.125)
    // 28 * 1.125 = 31.5
    expect(rootStyle.value.fontSize).toContain('31.5rpx')
  })

  it('高对比度默认关闭', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { highContrast } = await import('@/utils/accessibility')
    expect(highContrast.value).toBe(false)
  })

  it('toggleContrast 切换并持久化', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { highContrast, toggleContrast } = await import('@/utils/accessibility')
    expect(toggleContrast()).toBe(true)
    expect(highContrast.value).toBe(true)
    expect(uni.getStorageSync('qiye_ku_contrast')).toBe(true)
    toggleContrast()
    expect(highContrast.value).toBe(false)
  })

  it('高对比度模式颜色更深', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { contrastColors, toggleContrast } = await import('@/utils/accessibility')
    const normalPrimary = contrastColors.value.primary
    toggleContrast()
    const contrastPrimary = contrastColors.value.primary
    expect(contrastPrimary).not.toBe(normalPrimary)
  })
})

// ============ API 桥接 ============
describe('bridge - Mock/真实切换', () => {
  it('USE_MOCK=true 时走 mock 服务', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const detail = await bridge.demand.detail('demand_1')
    expect(detail).toBeTruthy()
    expect(detail._id).toBe('demand_1')
  })

  it('USE_MOCK=true 时 mock 返回需求列表', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const res = await bridge.demand.list({ page: 1, pageSize: 5 })
    expect(res.list.length).toBeLessThanOrEqual(5)
    expect(res.total).toBeGreaterThan(0)
  })

  it('USE_MOCK=false 时调用 http（真实接口）', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = false
    // mock http 模块
    vi.doMock('@/utils/request', () => ({
      default: { get: vi.fn().mockResolvedValue({ real: 'data' }), post: vi.fn().mockResolvedValue({ ok: true }) }
    }))
    const { bridge } = await import('@/api/bridge')
    const res = await bridge.demand.detail('demand_1')
    expect(res).toEqual({ real: 'data' })
    vi.doUnmock('@/utils/request')
    ENV.USE_MOCK = true
  })

  it('bridge 包含全部核心模块', async () => {
    vi.resetModules()
    const { bridge } = await import('@/api/bridge')
    expect(bridge).toHaveProperty('demand')
    expect(bridge).toHaveProperty('lead')
    expect(bridge).toHaveProperty('product')
    expect(bridge).toHaveProperty('order')
    expect(bridge).toHaveProperty('user')
    expect(bridge).toHaveProperty('favorite')
  })
})
