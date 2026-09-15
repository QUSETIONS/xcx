import { describe, expect, it } from 'vitest'
import { LEGAL_DOCUMENTS, LEGAL_DOCUMENT_VERSION } from '@/config/legal'

describe('用户协议与隐私政策', () => {
  it('接入行业服务入驻条款并保持版本一致', () => {
    expect(LEGAL_DOCUMENT_VERSION).toBe('2026-09-14')
    expect(LEGAL_DOCUMENTS.agreement.version).toBe(LEGAL_DOCUMENT_VERSION)
    expect(LEGAL_DOCUMENTS.agreement.title).toContain('行业服务')
    expect(LEGAL_DOCUMENTS.agreement.sections.map((item) => item.body).join('')).toContain('基础背景核验')
    expect(LEGAL_DOCUMENTS.agreement.sections.map((item) => item.body).join('')).toContain('AI 用量')
  })

  it('隐私政策覆盖甲乙方档案、材料、AI 匹配和展示授权', () => {
    const privacy = LEGAL_DOCUMENTS.privacy.sections.map((item) => item.body).join('')
    expect(privacy).toContain('统一社会信用代码')
    expect(privacy).toContain('商业计划书')
    expect(privacy).toContain('AI 辅助整理与匹配')
    expect(privacy).toContain('不会因提交而自动公开')
  })
})
