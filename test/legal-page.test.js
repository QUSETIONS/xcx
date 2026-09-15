import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('法律页阅读位置', () => {
  it('从注册页底部进入时强制回到文档开头', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/legal/index.vue'), 'utf8')
    expect(source).toContain(':scroll-top="scrollTop"')
    expect(source).toContain(':scroll-into-view="scrollAnchor"')
    expect(source).toContain('id="legal-document-top"')
    expect(source).toContain('scrollTop.value = 0')
    expect(source).toContain('uni.pageScrollTo({ scrollTop: 0, duration: 0 })')
  })
})
