import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), 'utf8')

describe('注册验证码流程', () => {
  it('注册页展示验证码入口并在提交前校验六位验证码', () => {
    const login = read('src', 'components', 'AccountAuth.vue')
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
    const login = read('src', 'components', 'AccountAuth.vue')
    const bridge = read('src', 'api', 'bridge.js')
    expect(login).toContain('form.invite_code')
    expect(login).toContain('form.reward_type')
    expect(login).toContain('loadInvitePreview')
    expect(login).toContain('邀请人已指定')
    expect(login).toContain('双方可以不同')
    expect(bridge).toContain("/intake/invites/${encodeURIComponent(String(code || '').trim().toUpperCase())}")
  })

  it('甲乙方使用独立路由，复用验证码组件，不再显示第二套身份选择', () => {
    const login = read('src', 'components', 'AccountAuth.vue')
    const pages = JSON.parse(read('src', 'pages.json')).pages.map(page => page.path)
    expect(pages).toContain('pages/user/register-a')
    expect(pages).toContain('pages/user/register-b')
    expect(read('src', 'pages', 'user', 'register-a.vue')).toContain('fixed-party="capital"')
    expect(read('src', 'pages', 'user', 'register-b.vue')).toContain('fixed-party="project"')
    expect(login).not.toContain('平台使用方式')
    expect(login).not.toContain('需求方')
    expect(login).not.toContain('服务方')
    expect(login).toContain('registration_party: registrationRole.value')
    expect(login).toContain("uni.reLaunch({ url: '/pages/intake/index' })")
  })
})
