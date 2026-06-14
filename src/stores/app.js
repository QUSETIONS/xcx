import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    systemInfo: null,
    theme: 'light',
    loading: false,
    toastQueue: []
  }),

  getters: {
    statusBarHeight: (state) => state.systemInfo?.statusBarHeight || 0,
    windowHeight: (state) => state.systemInfo?.windowHeight || 750
  },

  actions: {
    init() {
      this.systemInfo = uni.getSystemInfoSync()
    },

    setLoading(loading) {
      this.loading = loading
    },

    showToast(options) {
      uni.showToast(options)
    }
  },

  unistorage: { paths: ['theme'] }
})
