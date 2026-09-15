import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Agent 渐进式行动界面', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/pages/agent/index.vue'), 'utf8')

  it('信息足够时先显示简短行动提示，详情由用户主动展开', () => {
    expect(source).toContain('class="result-ready-action"')
    expect(source).toContain('查看已整理内容')
    expect(source).toContain('function toggleResultDetails')
    expect(source).toContain('return isResultReady(message) && message?.show_result_card === true')
    expect(source).toContain('function handleResultPrimary(message)')
    expect(source).toContain('function resultMatchCount(result = {})')
    expect(source).toContain("isServiceProvider.value ? `查看 ${count} 个项目` : `查看 ${count} 位合作方`")
  })

  it('首页带入的内容只预填到对话输入框，不会自动发送', () => {
    expect(source).toContain("const prefill = String(query?.prefill || '').trim().slice(0, 500)")
    expect(source).toContain('nextTick(() => focusInput(prefill))')
  })

  it('对话页保留助手身份，并让消息与输入区在窄屏内稳定收缩', () => {
    expect(source).toContain('<text class="agent-session-dot">•</text>')
    expect(source).toContain('.message-row.assistant')
    expect(source).toContain('.agent-page.brief-page .message-row.assistant .message-avatar')
    expect(source).toContain('overflow-wrap: anywhere;')
    expect(source).toContain('min-width: 128rpx;')
    expect(source).toContain('calc(18rpx + env(safe-area-inset-bottom))')
  })

  it('团队结果卡在窄屏下给联系操作完整宽度，并保持按钮文字高对比', () => {
    expect(source).toContain('min-width: 132px;')
    expect(source).toContain('background: #f0e5df;')
    expect(source).toContain('color: #5c2828 !important;')
    expect(source).toContain('@media (max-width: 700px)')
    expect(source).toContain('.agent-page.brief-page .team-contact { width: 100%; min-width: 0; }')
  })

  it('Agent 请求携带稳定幂等键，并在有内测次数时展示扣减后的余额', () => {
    expect(source).toContain('client_message_id: clientMessageId')
    expect(source).toContain('message.result.usage_credit?.consumed')
    expect(source).toContain('message.result.usage_credit.balance')
  })

  it('甲乙方使用独立会话，乙方只展示项目且不出现发布操作', () => {
    expect(source).toContain("workflow_role === 'service_provider'")
    expect(source).toContain('agentConversationStorageKey()')
    expect(source).toContain("`${STORAGE_KEYS.AGENT_CONVERSATION}:${conversationOwnerKey()}:${assistantModeKey.value}`")
    expect(source).toContain('isServiceProvider && message.result.recommendation_ready && message.result.matches?.demands?.length')
    expect(source).toContain('!isServiceProvider && message.result.recommendation_ready && message.result.matches?.teams?.length')
    expect(source).toContain('!isServiceProvider && message.result.recommendation_ready')
    expect(source).toContain("项目预算偏好（选填）")
    expect(source).toContain("补充行业经验、案例资源或希望承接的项目类型")
    expect(source).toContain("可以先去需求广场浏览项目")
  })
})
