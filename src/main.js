import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createUnistorage } from 'pinia-plugin-unistorage'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  // 启用 storage 持久化（stores 里 unistorage:true 才会真正持久化）
  pinia.use(createUnistorage())
  app.use(pinia)
  return { app }
}