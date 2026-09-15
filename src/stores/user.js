import { defineStore } from 'pinia'
import { bridge } from '@/api/bridge'
import { ENV } from '@/utils/env'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    refreshToken: '',
    refreshExpiresAt: '',
    userInfo: null,
    isAdmin: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userId: (state) => state.userInfo?.id || state.userInfo?.openid,
    nickname: (state) => state.userInfo?.nickname || '未登录用户',
    avatar: (state) => state.userInfo?.avatar_url || ''
  },

  actions: {
    applySession(session = {}) {
      this.token = session.token || ''
      this.refreshToken = session.refresh_token || session.refreshToken || ''
      this.refreshExpiresAt = session.refresh_expires_at || session.refreshExpiresAt || ''
      this.userInfo = session.user || this.userInfo
      this.isAdmin = this.userInfo?.role === 'admin'
      return this.token
    },

    /** Demo 登录（带并发去重：App.onLaunch 与页面 onMounted 可能同时触发） */
    async demoLogin(role = 'user') {
      if (this._loginPromise) return this._loginPromise
      this._loginPromise = (async () => {
        try {
          const res = await bridge.user.demoLogin(role)
          this.applySession(res)
          this.isAdmin = role === 'admin'
          return true
        } finally {
          this._loginPromise = null
        }
      })()
      return this._loginPromise
    },

    /** 微信正式登录：只把 wx.login code 交给服务端换取会话，不在前端保存密钥。 */
    async loginWithWechat(code, profile = {}, consent = {}) {
      if (!code) throw new Error('微信登录凭证为空')
      const res = await bridge.user.login({ code, profile, ...consent })
      this.applySession(res)
      return true
    },

    /** 手机号/密码注册，注册成功后直接建立登录会话。 */
    async register(payload = {}) {
      const res = await bridge.user.register(payload)
      this.applySession(res)
      return res
    },

    /** 手机号/密码登录。 */
    async loginWithPassword(payload = {}) {
      const res = await bridge.user.loginPassword(payload)
      this.applySession(res)
      return res
    },

    /** 更新服务端资料，并同步当前 Pinia 会话中的用户快照。 */
    async updateProfile(payload = {}) {
      const user = await bridge.user.updateProfile(payload)
      if (user) {
        this.userInfo = user
        this.isAdmin = user.role === 'admin'
      }
      return user
    },

    /** 合并由档案接口确认的账号摘要，避免身份切换后其他页面继续读取旧快照。 */
    mergeProfileSnapshot(payload = {}) {
      if (!this.userInfo) return null
      const allowed = ['company', 'title', 'city', 'organization_type']
      const next = {}
      allowed.forEach((field) => {
        if (payload[field] !== undefined) next[field] = payload[field]
      })
      this.userInfo = { ...this.userInfo, ...next }
      return this.userInfo
    },

    /** access token 过期时轮换 refresh token；旧 token 会在服务端立即失效。 */
    async refreshSession() {
      if (!this.refreshToken) return false
      const res = await bridge.user.refresh(this.refreshToken)
      this.applySession(res)
      return true
    },

    /** 确保已登录（页面加载数据前调用，兜底 onLaunch 时序竞争） */
    async ensureLogin() {
      if (this.token) return
      if (!ENV.ALLOW_DEMO_LOGIN) return false
      await this.demoLogin('user')
      return true
    },

    /** 刷新当前账号资料，避免本地持久化的昵称/企业信息长期落后于服务端。 */
    async refreshInfo() {
      // H5 旧版本可能只留下了请求层可读取的存储 token，而 Pinia 尚未完成状态恢复。
      // 本地演示环境下先重新签发一次会话，保证页面状态和请求层使用的是同一个账号。
      if (!this.token) {
        if (!ENV.ALLOW_DEMO_LOGIN) return null
        await this.demoLogin('user')
      }
      const user = await bridge.user.info()
      if (user) {
        this.userInfo = user
        this.isAdmin = user.role === 'admin'
      }
      return user
    },

    /** 登出 */
    logout() {
      const refreshToken = this.refreshToken
      if (refreshToken) bridge.user.logout(refreshToken).catch(() => {})
      this.token = ''
      this.refreshToken = ''
      this.refreshExpiresAt = ''
      this.userInfo = null
      this.isAdmin = false
    },

    /** 切换管理员身份 */
    toggleAdmin() {
      this.isAdmin = !this.isAdmin
    }
  },

  unistorage: true
})
