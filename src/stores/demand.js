import { defineStore } from 'pinia'

export const useDemandStore = defineStore('demand', {
  state: () => ({
    draft: null,
    lastFilters: {}
  }),

  actions: {
    saveDraft(data) {
      this.draft = {
        ...data,
        savedAt: new Date().toISOString()
      }
      uni.showToast({ title: '草稿已保存', icon: 'success' })
    },

    loadDraft() {
      return this.draft
    },

    clearDraft() {
      this.draft = null
    },

    saveFilters(filters) {
      this.lastFilters = filters
    }
  },

  unistorage: true
})
