import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 权限 Hook
 */
export function useAuth() {
  const userStore = useUserStore()

  const isLoggedIn = computed(() => userStore.isLoggedIn)
  const isAdmin = computed(() => userStore.isAdmin)

  /** 检查登录，未登录跳转登录页 */
  function requireLogin() {
    if (!isLoggedIn.value) {
      uni.navigateTo({ url: '/pages/user/login' })
      return false
    }
    return true
  }

  /** 检查管理员权限 */
  function requireAdmin() {
    if (!isAdmin.value) {
      uni.showToast({ title: '需要管理员权限', icon: 'none' })
      return false
    }
    return true
  }

  return { isLoggedIn, isAdmin, requireLogin, requireAdmin }
}
