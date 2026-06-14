import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),

  getters: {
    count: (state) => state.items.length,
    totalAmount: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  actions: {
    add(product) {
      const existing = this.items.find(item => item.id === product.id)
      if (existing) {
        existing.quantity++
      } else {
        this.items.push({
          id: product.id,
          title: product.title,
          price: product.price,
          cover: product.cover_url,
          quantity: 1
        })
      }
      uni.showToast({ title: '已加入', icon: 'success' })
    },

    remove(productId) {
      this.items = this.items.filter(item => item.id !== productId)
    },

    updateQuantity(productId, quantity) {
      const item = this.items.find(i => i.id === productId)
      if (item && quantity > 0) {
        item.quantity = quantity
      }
    },

    clear() {
      this.items = []
    }
  },

  unistorage: true
})
