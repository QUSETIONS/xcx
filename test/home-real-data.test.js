import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('首页真实数据接入', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/pages/index/index.vue'), 'utf8')

  it('首页不重复计算标题栏导航高度，宽屏入口不局限于手机画布', () => {
    expect(source).not.toContain('style="height: 128rpx"')
    expect(source).toContain('calc(100vh - 44px - 50px - env(safe-area-inset-bottom))')
    expect(source).toContain('.ai-home-stage { max-width: 680px;')
    expect(source).toContain('.home-hint { max-width: 680px;')
  })

  it('不再保留固定问候、统计和待办文案', () => {
    expect(source).not.toContain('早上好，林先生')
    expect(source).not.toContain('ref(128)')
    expect(source).not.toContain('ref(56)')
    expect(source).not.toContain('比昨天多 12%')
    expect(source).not.toContain('城市低碳生活')
  })

  it('从当前用户、需求、对接收件箱和通知读取首页状态', () => {
    expect(source).toContain('useUserStore')
    expect(source).toMatch(/bridge\.demand\.myDemands\(\s*\{/)
    expect(source).toMatch(/bridge\.lead\.inbox\(\s*\{/)
    expect(source).toContain('bridge.notify.unreadCount()')
    expect(source).toContain('buildHomeTodos')
  })

  it('首页只作为 Agent 的轻量入口，不重复承载整理和推荐结果', () => {
    expect(source).toContain('class="brief-launcher"')
    expect(source).toContain('@tap="focusBriefLauncher"')
    expect(source).toContain('function openBriefConversation')
    expect(source).toContain('?prefill=${encodeURIComponent(text)}')
    expect(source).not.toContain('已找到 {{ agentResult.matches.teams.length }} 支可对接团队')
    expect(source).not.toContain('class="agent-result-card"')
    const script = source.split('<script setup>')[1].split('</script>')[0]
    expect(script).not.toContain('chatStream')
    expect(script).not.toContain('fetchAgentRecommendations')
    expect(script).not.toContain('agent-workspace')
    expect(source).toMatch(/\.quick-entry-network\s*\{[^}]*grid-column:\s*1 \/ -1/s)
    expect(source).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('身份切换时清空复用首页实例中的上一个账号草稿', () => {
    expect(source).toContain("watch(() => userStore.userId, (nextUserId, previousUserId)")
    expect(source).toContain("if (previousUserId && nextUserId !== previousUserId)")
    expect(source).toContain("briefText.value = ''")
  })

  it('需求发布相关草稿和联系方式按账号隔离', () => {
    const publish = readFileSync(resolve(process.cwd(), 'src/pages/demand/publish.vue'), 'utf8')
    expect(publish).toContain('scopedStorageKey(STORAGE_KEYS.DEMAND_DRAFT, userStore.userId)')
    expect(publish).toContain('scopedStorageKey(STORAGE_KEYS.AGENT_DRAFT, userStore.userId)')
    expect(publish).toContain('scopedStorageKey(STORAGE_KEYS.LAST_DEMAND_CONTACT, userStore.userId)')
    expect(publish).not.toContain("getStorageSync(STORAGE_KEYS.DEMAND_DRAFT)")
    expect(publish).not.toContain("getStorageSync('last_demand_contact')")
  })
})
