import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

describe('合作生态目录', () => {
  it('前端与 API 使用相同目录，修改响应不会污染后续请求', async () => {
    const frontend = await import('../src/data/cooperation-catalog.js')
    const backend = await import('../../server/utils/cooperation-catalog.js')
    const filter = { category: 'venue', status: 'pending', keyword: '上海' }
    expect(frontend.cooperationSnapshot(filter)).toEqual(backend.cooperationSnapshot(filter))
    const response = frontend.cooperationSnapshot()
    response.list[0].tags.push('不可泄漏')
    response.list[0].title = '不可泄漏'
    expect(backend.cooperationSnapshot().list[0].tags).not.toContain('不可泄漏')
    expect(backend.cooperationSnapshot().list[0].title).toBe('金融俱乐部')
  })
  it('Mock 目录包含首批招募和待定方向，并且状态统计一致', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const result = await bridge.cooperation.catalog()
    expect(result.summary.total).toBeGreaterThan(0)
    expect(result.summary.open).toBeGreaterThan(0)
    expect(result.summary.pending).toBeGreaterThan(0)
    expect(result.list.some((entry) => entry.title === '金融俱乐部' && entry.status === 'open')).toBe(true)
    expect(result.list.some((entry) => entry.title === '上市俱乐部（待定）' && entry.status === 'pending')).toBe(true)
    expect(result.notice).toContain('正式合作')
  })

  it('目录筛选不会丢失合作板块和标签字段', async () => {
    vi.resetModules()
    const { ENV } = await import('@/utils/env')
    ENV.USE_MOCK = true
    const { bridge } = await import('@/api/bridge')
    const result = await bridge.cooperation.catalog({ category: 'venue' })
    expect(result.list.length).toBeGreaterThan(0)
    expect(result.list.every((entry) => entry.category_id === 'venue')).toBe(true)
    expect(result.list.some((entry) => entry.title.includes('静安区地下商城'))).toBe(true)
    expect(result.list.every((entry) => Array.isArray(entry.tags) && Array.isArray(entry.locations))).toBe(true)
  })

  it('首屏只展示正在招募方向，全部模式保留待确认线索', async () => {
    const frontend = await import('../src/data/cooperation-catalog.js')
    const { DEFAULT_COOPERATION_STATUS, filterCooperationEntries, groupCooperationEntries } = await import('@/utils/cooperation-filter')
    const snapshot = frontend.cooperationSnapshot()
    const recruiting = filterCooperationEntries(snapshot.list)
    const all = filterCooperationEntries(snapshot.list, { status: 'all' })
    const capital = filterCooperationEntries(snapshot.list, { category: 'capital' })
    const groups = groupCooperationEntries(snapshot.categories, capital)

    expect(DEFAULT_COOPERATION_STATUS).toBe('open')
    expect(recruiting).toHaveLength(snapshot.summary.open)
    expect(recruiting.every((entry) => entry.status === 'open')).toBe(true)
    expect(all).toHaveLength(snapshot.summary.total)
    expect(all.some((entry) => entry.id === 'project-concert-investment' && entry.status === 'pending')).toBe(true)
    expect(capital.map((entry) => entry.title)).toEqual(['金融俱乐部', '私募机构入驻位置', '投资公司合作'])
    expect(groups).toHaveLength(1)
    expect(groups[0].id).toBe('capital')
    expect(groups[0].items).toEqual(capital)
  })

  it('首页、目录页和发布页形成可达的招募链路', () => {
    const home = readFileSync(resolve(process.cwd(), 'src/pages/index/index.vue'), 'utf8')
    const page = readFileSync(resolve(process.cwd(), 'src/pages/cooperation/index.vue'), 'utf8')
    const publish = readFileSync(resolve(process.cwd(), 'src/pages/demand/publish.vue'), 'utf8')
    const pages = readFileSync(resolve(process.cwd(), 'src/pages.json'), 'utf8')
    expect(home).toContain('class="quick-entry-card quick-entry-cooperation"')
    expect(home).toContain("function goCooperation() { uni.navigateTo({ url: '/pages/cooperation/index' }) }")
    expect(page).toContain('bridge.cooperation.catalog()')
    expect(page).toContain('status_label')
    expect(page).toContain('function goPublish(entry = null)')
    expect(page).toContain('cooperation_prompt')
    expect(publish).toContain('applyCooperationIntent')
    expect(publish).toContain('cooperation_category')
    expect(pages).toContain('pages/cooperation/index')
  })
})
