/**
 * 统一请求封装
 *
 * 基于 uni.request，提供类似 axios 的 API：
 * - 请求/响应拦截器
 * - Token 自动注入
 * - 错误统一处理
 * - 请求重试（网络错误）
 * - 重复请求去重
 */

import { isDev, baseURL } from '@/config/env'
import { STORAGE_KEYS } from '@/config/constants'

// ========== 默认配置 ==========
const defaults = {
  baseURL,
  timeout: 15000,
  header: {
    'Content-Type': 'application/json'
  }
}

// ========== 拦截器 ==========
const requestInterceptors = []
const responseInterceptors = []

// ========== 请求队列（去重） ==========
// 只复用 GET 请求。POST/PUT/DELETE 即使参数相同也必须各自执行，避免
// 把用户的写操作错误地合并掉。
const pendingRequests = new Map()

function getRequestKey(config) {
  return `${config.method}:${config.url}:${JSON.stringify(config.data || config.params || '')}`
}

function getRetryLimit(config) {
  // 网络错误发生在服务端已经收到写请求之后，客户端无法区分“未送达”与
  // “已落库但响应丢失”。写请求默认不自动重发，避免一条消息、一个订单或
  // 一次关系变更被执行两次；需要重试的幂等写操作可以显式传 retry。
  if (config.retry !== undefined) {
    const configured = Number(config.retry)
    return Number.isFinite(configured) ? Math.max(0, Math.floor(configured)) : 0
  }
  return ['GET', 'HEAD', 'OPTIONS'].includes(String(config.method || 'GET').toUpperCase()) ? 2 : 0
}

// ========== Token ==========
function getToken() {
  try {
    // pinia-plugin-unistorage 按 store id 持久化，useUserStore(id='user') 存于 'user' key
    const stored = uni.getStorageSync('user') || uni.getStorageSync('user_store')
    const store = typeof stored === 'string' ? JSON.parse(stored) : stored
    return store?.token || ''
  } catch {
    return ''
  }
}

function getRefreshToken() {
  try {
    const stored = uni.getStorageSync('user') || uni.getStorageSync('user_store')
    const store = typeof stored === 'string' ? JSON.parse(stored) : stored
    return store?.refreshToken || store?.refresh_token || ''
  } catch {
    return ''
  }
}

function saveRefreshedSession(session = {}) {
  try {
    const stored = uni.getStorageSync('user') || uni.getStorageSync('user_store')
    const store = typeof stored === 'string' ? JSON.parse(stored) : { ...(stored || {}) }
    store.token = session.token || ''
    store.refreshToken = session.refresh_token || ''
    store.refresh_token = session.refresh_token || ''
    store.refreshExpiresAt = session.refresh_expires_at || ''
    if (session.user) store.userInfo = session.user
    uni.setStorageSync('user', store)
    return true
  } catch {
    return false
  }
}

let refreshPromise = null
let authRedirecting = false

function clearExpiredSession() {
  try {
    uni.removeStorageSync('user')
    uni.removeStorageSync('user_store')
  } catch {
    // 清理失败不影响当前请求继续返回 401；下次登录仍会覆盖旧会话。
  }
}

function refreshAccessToken() {
  if (refreshPromise) return refreshPromise
  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.resolve(null)
  refreshPromise = new Promise((resolve) => {
    uni.request({
      url: `${baseURL}/auth/refresh`,
      method: 'POST',
      data: { refresh_token: refreshToken },
      header: { 'Content-Type': 'application/json' },
      timeout: 10000,
      success: (res) => {
        const data = res?.data?.data
        if (res?.statusCode >= 200 && res?.statusCode < 300 && res?.data?.code === 0 && data?.token) {
          saveRefreshedSession(data)
          resolve(data)
        } else resolve(null)
      },
      fail: () => resolve(null)
    })
  }).finally(() => { refreshPromise = null })
  return refreshPromise
}

function createAuthError(hadToken) {
  const error = new Error(hadToken ? '登录已过期，请重新登录' : '请先登录后再继续')
  error.statusCode = 401
  error.hadToken = hadToken
  return error
}

// ========== 核心请求 ==========
function request(config) {
  // 合并配置
  config = {
    ...defaults,
    ...config,
    // 同时兼容 fetch 风格的 headers 与 uni.request 的 header，避免单个
    // bridge 方法传错键后静默丢失幂等/业务请求头。
    header: { ...defaults.header, ...(config.headers || {}), ...(config.header || {}) }
  }

  // 完整 URL
  if (!config._urlResolved && !config.url.startsWith('http')) {
    config.url = config.baseURL + config.url
  }
  config._urlResolved = true

  // 执行请求拦截器
  for (const interceptor of requestInterceptors) {
    config = interceptor(config) || config
  }

  // Token 注入
  const token = getToken()
  if (token) {
    config.header['Authorization'] = `Bearer ${token}`
  }

  const canDedupe = String(config.method || 'GET').toUpperCase() === 'GET' && config.dedupe !== false
  const requestKey = canDedupe ? getRequestKey(config) : ''
  if (requestKey && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)
  }

  const promise = new Promise((resolve, reject) => {
    uni.request({
      url: config.url,
      method: config.method || 'GET',
      data: config.data || config.params,
      header: config.header,
      timeout: config.timeout,

      success: (res) => {
        // 执行响应拦截器
        for (const interceptor of responseInterceptors) {
          res = interceptor(res) || res
        }

        const { statusCode, data } = res

        // HTTP 状态码处理
        if (statusCode >= 200 && statusCode < 300) {
          // 业务状态码
          if (data.code === 0 || data.code === 200 || !data.code) {
            resolve(data.data !== undefined ? data.data : data)
          } else {
            // 业务错误
            const err = new Error(data.message || '请求失败')
            err.code = data.code
            err.data = data
            err.hadToken = Boolean(token)
            handleError(err)
            reject(err)
          }
        } else if (statusCode === 401 && !config._authRetried) {
          refreshAccessToken().then((session) => {
            if (!session) {
              const err = createAuthError(Boolean(token))
              handleError(err)
              reject(err)
              return
            }
            // 当前请求仍在 pendingRequests 中，重试时必须关闭去重，否则会
            // 重新拿到当前 promise，形成自引用等待。
            resolve(request({ ...config, _authRetried: true, _retryCount: 0, dedupe: false }))
          }).catch(() => {
            const err = createAuthError(Boolean(token))
            handleError(err)
            reject(err)
          })
        } else if (statusCode === 401) {
          const err = createAuthError(Boolean(token))
          err.data = data
          handleError(err)
          reject(err)
        } else {
          const err = new Error(`HTTP ${statusCode}`)
          err.statusCode = statusCode
          err.data = data
          err.hadToken = Boolean(token)
          handleError(err)
          reject(err)
        }
      },

      fail: (err) => {
        // 网络错误重试
        if (config._retryCount === undefined) config._retryCount = 0
        const retryLimit = getRetryLimit(config)
        if (config._retryCount < retryLimit) {
          config._retryCount++
          const delay = Math.pow(2, config._retryCount) * 1000
          setTimeout(() => {
            resolve(request({ ...config, dedupe: false }))
          }, delay)
          return
        }

        const error = new Error('网络异常，请检查网络连接')
        error.isNetworkError = true
        handleError(error)
        reject(error)
      }
    })
  })

  if (requestKey) {
    pendingRequests.set(requestKey, promise)
    promise.finally(() => {
      if (pendingRequests.get(requestKey) === promise) pendingRequests.delete(requestKey)
    }).catch(() => {})
  }
  return promise
}

// ========== 错误处理 ==========
function handleError(err) {
  const { statusCode, code } = err

  if (statusCode === 401 || code === 401) {
    // Token 过期：清掉失效会话并只触发一次跳转，避免并发请求连续弹窗/重定向。
    if (err.hadToken) clearExpiredSession()
    if (authRedirecting) return
    authRedirecting = true
    uni.showToast({ title: err.hadToken ? '登录已过期，请重新登录' : '请先登录后再继续', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/user/login' })
      authRedirecting = false
    }, 800)
    return
  }

  if (statusCode === 403 || code === 403) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    return
  }

  if (err.isNetworkError) {
    uni.showToast({ title: '网络异常', icon: 'none' })
    return
  }

  // 其他错误
  if (err.message && !err.message.startsWith('HTTP')) {
    uni.showToast({ title: err.message, icon: 'none' })
  }
}

// ========== 快捷方法 ==========
const http = {
  get(url, params, config = {}) {
    return request({ ...config, method: 'GET', url, params })
  },

  post(url, data, config = {}) {
    return request({ ...config, method: 'POST', url, data })
  },

  put(url, data, config = {}) {
    return request({ ...config, method: 'PUT', url, data })
  },

  delete(url, data, config = {}) {
    return request({ ...config, method: 'DELETE', url, data })
  },

  /**
   * 文件上传
   */
  upload(url, filePath, formData = {}, config = {}) {
    const token = getToken()
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: baseURL + url,
        filePath,
        name: 'file',
        formData,
        header: token ? { 'Authorization': `Bearer ${token}` } : {},
        timeout: Number(config.timeout) || 60000,
        success: (res) => {
          let data
          try { data = JSON.parse(res.data) } catch { data = null }
          if (!data) return reject(new Error('上传服务返回了无效响应'))
          const statusCode = Number(res?.statusCode || 0)
          const apiCode = Number(data?.code || 0)
          if (statusCode === 401 || apiCode === 401) {
            const error = createAuthError(Boolean(token))
            error.statusCode = 401
            error.data = data
            error.hadToken = Boolean(token)
            handleError(error)
            reject(error)
            return
          }
          if (statusCode === 403 || apiCode === 403) {
            const error = new Error(data?.message || '无权限访问')
            error.statusCode = 403
            error.code = 403
            error.data = data
            error.hadToken = Boolean(token)
            handleError(error)
            reject(error)
            return
          }
          if (statusCode < 200 || statusCode >= 300) {
            const error = new Error(data?.message || `HTTP ${statusCode}`)
            error.statusCode = statusCode
            error.data = data
            error.hadToken = Boolean(token)
            handleError(error)
            reject(error)
            return
          }
          if (data.code === 0 || data.code === 200 || !data.code) {
            resolve(data.data !== undefined ? data.data : data)
          } else {
            const error = new Error(data.message || '上传失败')
            error.statusCode = statusCode
            error.code = apiCode
            error.data = data
            handleError(error)
            reject(error)
          }
        },
        fail: (err) => {
          const error = new Error(err?.errMsg || '上传失败')
          error.isNetworkError = true
          handleError(error)
          reject(error)
        }
      })
    })
  },

  /** 添加请求拦截器 */
  useRequestInterceptor(fn) { requestInterceptors.push(fn) },

  /** 添加响应拦截器 */
  useResponseInterceptor(fn) { responseInterceptors.push(fn) }
}

export default http
