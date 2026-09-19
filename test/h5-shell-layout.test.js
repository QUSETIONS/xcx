import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const appRoot = process.cwd()
const h5Index = fs.readFileSync(path.join(appRoot, 'index.html'), 'utf8')
const appStyle = fs.readFileSync(path.join(appRoot, 'src', 'App.vue'), 'utf8')

describe('H5 固定宽屏壳层回归', () => {
  it('画布应使用固定视口高度的内部滚动，不再把 fixed 元素绑到内容总高度', () => {
    expect(h5Index).toContain('--h5-shell-width: min(960px, calc(100vw - 48px))')
    expect(h5Index).toMatch(/#app\s*\{[\s\S]*height:\s*100vh;/)
    expect(h5Index).toMatch(/#app\s*\{[\s\S]*overflow-y:\s*auto;/)
    expect(h5Index).not.toContain('transform: translateZ(0)')
  })

  it('H5 固定导航显式锚定在画布底部，并限定为固定壳层宽度', () => {
    expect(appStyle).toContain('uni-tabbar.uni-tabbar-bottom')
    expect(appStyle).toContain('width: var(--h5-shell-width) !important')
    expect(appStyle).toContain('top: auto !important')
    expect(appStyle).toContain('bottom: 0 !important')
    expect(appStyle).toContain('/* 导航栏必须固定在顶部；之前被误放进底部选择器，滚动后会跑位。 */')
    expect(appStyle).toContain('top: 0 !important')
    expect(appStyle).toContain('transform: translate3d(-50%, 0, 0) !important')
    expect(appStyle).toContain('bottom: 96px !important')
  })

  it('原生标题栏、需求大厅和商城应使用同一张稳定画布', () => {
    expect(appStyle).toContain('原生标题栏也必须和内容壳层同心')
    expect(appStyle).toContain('.uni-page-wrapper')
    const demandPage = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'demand', 'list.vue'), 'utf8')
    const mallPage = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'mall', 'list.vue'), 'utf8')
    expect(demandPage).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(mallPage).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(demandPage).toContain('padding-bottom: calc(130rpx + env(safe-area-inset-bottom))')
    expect(demandPage).toContain('min-width: 126rpx;')
    expect(mallPage).toContain('padding-bottom: calc(130rpx + env(safe-area-inset-bottom))')
    expect(demandPage).not.toContain('height: calc(100vh - 430rpx)')
    expect(mallPage).not.toContain('height: calc(100vh - 500rpx)')
  })

  it('会员等级路线图宽屏三列、窄屏堆叠，现有权益保留且没有付款栏', () => {
    const member = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'member', 'index.vue'), 'utf8')
    const user = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'user', 'index.vue'), 'utf8')
    expect(member).toContain('class="level-roadmap"')
    expect(member).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    expect(member).toContain('grid-template-columns: 1fr;')
    expect(member).toContain('current: currentLevel === level.id')
    expect(member).toContain('locked: level.rank > currentRank')
    expect(member).toContain('我的现有权益')
    expect(member).not.toContain('bridge.member.subscribe')
    expect(user).toContain('border-left: 4rpx solid #b49460')
    expect(user).toContain('.access-copy { min-width: 0;')
  })

  it('高密度内页保护长内容，并让列表使用剩余空间滚动', () => {
    const community = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'community', 'index.vue'), 'utf8')
    const providerManage = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'admin', 'provider-manage.vue'), 'utf8')
    const workspace = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'deals', 'workspace.vue'), 'utf8')
    const demandDetail = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'demand', 'detail.vue'), 'utf8')
    const networkDetail = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'network', 'detail.vue'), 'utf8')
    const friends = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'network', 'friends.vue'), 'utf8')
    const message = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'message', 'index.vue'), 'utf8')
    const myOrders = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'user', 'my-orders.vue'), 'utf8')
    const myLeads = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'user', 'my-leads.vue'), 'utf8')
    const myResources = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'user', 'my-resources.vue'), 'utf8')
    const order = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'order', 'index.vue'), 'utf8')
    const proposal = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'proposal', 'inbox.vue'), 'utf8')
    const post = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'community', 'post.vue'), 'utf8')

    expect(appStyle).toMatch(/html,\s*body,\s*page,[\s\S]*#app\s*\{[\s\S]*overflow-x:\s*hidden;/s)
    expect(appStyle).toMatch(/input, textarea, button\s*\{[^}]*box-sizing:\s*border-box;/s)
    expect(appStyle).toMatch(/image\s*\{[^}]*max-width:\s*100%;/s)
    expect(community).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(community).not.toContain('height: calc(100vh - 450rpx)')
    expect(providerManage).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(providerManage).not.toContain('height: calc(100vh - 220rpx)')
    expect(workspace).toMatch(/\.project-title\s*\{[\s\S]*flex:\s*1;[\s\S]*overflow:\s*hidden;/s)
    expect(workspace).toContain('word-break: break-word;')
    expect(demandDetail).toContain('.proposal-compare-scroll')
    expect(demandDetail).toContain('overflow-x: auto;')
    expect(networkDetail).toContain('max-height: 84vh;')
    expect(friends).toContain('.tab { flex: 0 0 auto; min-width: 126rpx; }')
    expect(message).toContain('.message-content { display: flex; min-height: 0; flex: 1;')
    expect(myOrders).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(myLeads).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(myResources).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(order).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(proposal).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(post).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));')
    expect(post).not.toContain('width: 200rpx; height: 200rpx;')
  })

  it('后台列表和数据大屏应覆盖窄屏布局约束', () => {
    const adminListPages = [
      'banner-manage.vue',
      'category-manage.vue',
      'demand-manage.vue',
      'lead-manage.vue',
      'order-manage.vue',
      'product-manage.vue',
      'resource-manage.vue',
      'user-manage.vue'
    ]

    for (const file of adminListPages) {
      const source = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'admin', file), 'utf8')
      expect(source, file).toMatch(/\.page\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*min-height:\s*0;[^}]*overflow-x:\s*hidden;/s)
      expect(source, file).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    }

    const screen = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'admin', 'screen.vue'), 'utf8')
    expect(screen).toContain('@media (max-width: 420px)')
    expect(screen).toMatch(/\.chart-row\s*\{[^}]*flex-direction:\s*column;/s)
    expect(screen).toMatch(/\.agent-ops-item\s*\{[^}]*width:\s*50%;/s)
  })

  it('交易、关系、群聊和结算页应限制横向内容并允许长文本收缩', () => {
    const guardedPages = [
      'deals/index.vue',
      'network/discover.vue',
      'network/group-chat.vue',
      'mall/detail.vue',
      'mall/order-confirm.vue',
      'points/index.vue'
    ]

    for (const file of guardedPages) {
      const source = fs.readFileSync(path.join(appRoot, 'src', 'pages', file), 'utf8')
      expect(source, file).toContain('overflow-x: hidden;')
      expect(source, file).toContain('max-width: 100%;')
    }

    const deals = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'deals', 'index.vue'), 'utf8')
    const groupChat = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'network', 'group-chat.vue'), 'utf8')
    const mallDetail = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'mall', 'detail.vue'), 'utf8')
    const points = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'points', 'index.vue'), 'utf8')
    expect(deals).toContain('.deal-actions { flex-wrap: wrap; gap: 8rpx; }')
    expect(groupChat).toContain('.bubble { overflow-wrap: anywhere; word-break: break-word; }')
    expect(mallDetail).toContain('.action-bar { overflow-x: hidden; }')
    expect(points).toContain('.day-item { width: auto; flex: 1 1 0; }')
  })

  it('表单、资料、治理和后台编辑页应覆盖横向溢出风险', () => {
    const guardedPages = [
      'legal/index.vue',
      'governance/index.vue',
      'demand/publish.vue',
      '../components/AccountAuth.vue',
      'resource/detail.vue',
      'profile/index.vue',
      'admin/index.vue',
      'admin/product-edit.vue',
      'admin/resource-edit.vue',
      'admin/banner-edit.vue'
    ]

    for (const file of guardedPages) {
      const source = fs.readFileSync(path.join(appRoot, 'src', 'pages', file), 'utf8')
      expect(source, file).toContain('overflow-x: hidden;')
      expect(source, file).toContain('max-width: 100%;')
    }

    const publish = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'demand', 'publish.vue'), 'utf8')
    const profile = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'profile', 'index.vue'), 'utf8')
    const productEdit = fs.readFileSync(path.join(appRoot, 'src', 'pages', 'admin', 'product-edit.vue'), 'utf8')
    expect(publish).toContain('.quote-row,')
    expect(profile).toContain('.profile-stats,')
    expect(profile).toContain('.relationship-note,')
    expect(profile).toContain('width: auto;')
    expect(productEdit).toContain('.two-col { flex-wrap: wrap; }')
  })
})
