/**
 * 小程序/H5 共用的会话存储边界。
 *
 * bridge 不能反向依赖 Pinia user store：user store 本身需要调用 bridge，
 * 两边形成循环后，微信小程序分包会出现循环 chunk。这里仅处理持久化会话，
 * 不持有响应式状态；页面状态仍由 Pinia user store 负责。
 */
const USER_STORAGE_KEY = 'user'
const PUBLIC_INTAKE_STORAGE_KEY = 'intake_public_session'

function getStorageValue() {
  try {
    if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') return {}
    const stored = uni.getStorageSync(USER_STORAGE_KEY)
    if (!stored) return {}
    if (typeof stored === 'string') return JSON.parse(stored) || {}
    return stored || {}
  } catch {
    return {}
  }
}

export function getStoredSession() {
  return getStorageValue()
}

export function hasStoredAccessToken() {
  return Boolean(getStorageValue().token)
}

/**
 * 给需要落盘的业务草稿加上账号边界，避免同一设备切换账号后复用上一位用户的数据。
 */
export function scopedStorageKey(baseKey, userId) {
  const owner = String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'guest'
  return `${String(baseKey || '').trim()}:${owner}`
}

export function persistSession(session = {}) {
  try {
    if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return false
    const current = getStorageValue()
    const next = {
      ...current,
      token: session.token || current.token || '',
      refreshToken: session.refresh_token || session.refreshToken || current.refreshToken || '',
      refresh_token: session.refresh_token || session.refreshToken || current.refresh_token || '',
      refreshExpiresAt: session.refresh_expires_at || session.refreshExpiresAt || current.refreshExpiresAt || ''
    }
    if (session.user) next.userInfo = session.user
    uni.setStorageSync(USER_STORAGE_KEY, next)
    return true
  } catch {
    return false
  }
}

/**
 * 公开内测资料入口使用独立的短期会话，不复用正式 JWT。
 * 这样朋友可以直接填写，同时不会因为拿到表单会话而获得 App 其他页面的权限。
 */
export function getStoredPublicIntakeSession() {
  try {
    if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') return ''
    const stored = uni.getStorageSync(PUBLIC_INTAKE_STORAGE_KEY)
    if (typeof stored === 'string') return stored.trim()
    return String(stored?.token || '').trim()
  } catch {
    return ''
  }
}

export function persistPublicIntakeSession(token) {
  try {
    if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return false
    const value = String(token || '').trim()
    if (!value) return false
    uni.setStorageSync(PUBLIC_INTAKE_STORAGE_KEY, value)
    return true
  } catch {
    return false
  }
}

export function clearPublicIntakeSession() {
  try {
    if (typeof uni === 'undefined' || typeof uni.removeStorageSync !== 'function') return false
    uni.removeStorageSync(PUBLIC_INTAKE_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
