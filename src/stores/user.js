import { defineStore } from 'pinia'
import { userService } from '@/mock/service'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
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
    /** Demo 登录 */
    async demoLogin(role = 'user') {
      const res = await userService.demoLogin(role)
      this.token = res.token
      this.userInfo = res.user
      this.isAdmin = role === 'admin'
      return true
    },

    /** 登出 */
    logout() {
      this.token = ''
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