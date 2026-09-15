import { hasStoredAccessToken } from '@/utils/session'

/**
 * 受保护页面的统一登录门槛。
 *
 * 页面可能比 Pinia 持久化恢复更早执行，因此同时检查 store 和持久化 token；
 * 没有会话时先尝试开发环境允许的登录兜底，生产环境则只跳转正式登录页。
 */
export async function requirePageLogin(userStore, message = '请先登录后再继续') {
  if (userStore?.isLoggedIn || hasStoredAccessToken()) return true

  try {
    const ensured = await userStore?.ensureLogin?.()
    if (ensured || userStore?.isLoggedIn || hasStoredAccessToken()) return true
  } catch {
    // 登录失败交给统一的页面提示，不让受保护接口先发起一串 401。
  }

  uni.showToast({ title: message, icon: 'none' })
  setTimeout(() => {
    uni.navigateTo({ url: '/pages/user/login' })
  }, 300)
  return false
}

