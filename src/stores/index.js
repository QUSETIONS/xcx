import { createPinia } from 'pinia'
import piniaPluginUnistorage from 'pinia-plugin-unistorage'

const pinia = createPinia()
pinia.use(piniaPluginUnistorage)

export default pinia

// 导出所有 store
export { useUserStore } from './user'
export { useAppStore } from './app'
export { useCartStore } from './cart'
export { useDemandStore } from './demand'