import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), 'utf8')

describe('注册验证码流程', () => {
  it('注册页展示验证码入口并在提交前校验六位验证码', () => {
    const login = read('src', 'pages', 'user', 'login.vue')
    expect(login).toContain('v-if="mode === \'register\'" class="field"')
    expect(login).toContain('@tap="requestRegisterCode"')
    expect(login).toContain("if (!/^\\d{6}$/.test(String(data.code).trim())) return '请输入6位短信验证码'")
    expect(login).toContain('bridge.user.requestRegisterCode({ phone })')
  })

  it('真实桥接层保留注册验证码接口', () => {
    const bridge = read('src', 'api', 'bridge.js')
    expect(bridge).toContain("http.post('/auth/register/request-code', d)")
  })

  it('邀请码注册会先预览权益并要求选择一项', () => {
    const login = read('src', 'pages', 'user', 'login.vue')
    const bridge = read('src', 'api', 'bridge.js')
    expect(login).toContain('form.invite_code')
    expect(login).toContain('form.reward_type')
    expect(login).toContain('loadInvitePreview')
    expect(login).toContain('邀请人已指定')
    expect(login).toContain('双方可以不同')
    expect(bridge).toContain("/intake/invites/${encodeURIComponent(String(code || '').trim().toUpperCase())}")
  })

  it('注册先区分融资甲乙方，工作方式保持独立，成功后进入档案页', () => {
    const login = read('src', 'pages', 'user', 'login.vue')
    expect(login).toContain('甲方 / 资金方')
    expect(login).toContain('乙方 / 项目企业')
    expect(login).toContain('平台使用方式')
    expect(login).toContain("uni.reLaunch({ url: '/pages/intake/index' })")
  })
})
