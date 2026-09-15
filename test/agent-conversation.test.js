import { describe, expect, it } from 'vitest'
import { collapseRetriedFailures, getRetryPayload } from '../src/utils/agent-conversation'

describe('Agent 对话重试', () => {
  it('将旧版连续重复的失败重试折叠为最后一对消息', () => {
    const messages = [
      { id: 'intro', role: 'assistant', intro: true },
      { id: 'u1', role: 'user', content: '寻找进入华东市场的渠道' },
      { id: 'a1', role: 'assistant', error: true },
      { id: 'u2', role: 'user', content: '寻找进入华东市场的渠道' },
      { id: 'a2', role: 'assistant', error: true },
      { id: 'u3', role: 'user', content: '寻找进入华东市场的渠道' },
      { id: 'a3', role: 'assistant', error: true }
    ]

    expect(collapseRetriedFailures(messages).map((message) => message.id)).toEqual(['intro', 'u3', 'a3'])
  })

  it('重试复用失败回复对应的原始输入与附件，不新增用户消息', () => {
    const messages = [
      { id: 'u1', role: 'user', content: '展示文本', requestText: '原始输入', attachments: [{ id: 'file-1' }] },
      { id: 'a1', role: 'assistant', error: true }
    ]

    expect(getRetryPayload(messages, 'a1')).toEqual({
      assistantId: 'a1',
      userIndex: 0,
      text: '原始输入',
      attachments: [{ id: 'file-1' }]
    })
  })
})
