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
const pendingRequests = new Map()

function getRequestKey(config) {
  return `${config.method}:${config.url}:${JSON.stringify(config.data || config.params || '')}`
}

function addPending(config) {
  const key = getRequestKey(config)
  if (pendingRequests.has(key)) {
    config._retry = true
  }
  pendingRequests.set(key, config)
}

function removePending(config) {
  const key = getRequestKey(config)
  pendingRequests.delete(key)
}

// ========== Token ==========
function getToken() {
  try {
    const store = uni.getStorageSync('user_store')
    return store?.token || ''
  } catch {
    return ''
  }
}

// ========== 核心请求 ==========
function request(config) {
  // 合并配置
  config = {
    ...defaults,
    ...config,
    header: { ...defaults.header, ...config.header }
  }

  // 完整 URL
  if (!config.url.startsWith('http')) {
    config.url = config.baseURL + config.url
  }

  // 执行请求拦截器
  for (const interceptor of requestInterceptors) {
    config = interceptor(config) || config
  }

  // Token 注入
  const token = getToken()
  if (token) {
    config.header['Authorization'] = `Bearer ${token}`
  }

  // 去重
  addPending(config)

  return new Promise((resolve, reject) => {
    uni.request({
      url: config.url,
      method: config.method || 'GET',
      data: config.data || config.params,
      header: config.header,
      timeout: config.timeout,

      success: (res) => {
        removePending(config)

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
            handleError(err)
            reject(err)
          }
        } else {
          const err = new Error(`HTTP ${statusCode}`)
          err.statusCode = statusCode
          err.data = data
          handleError(err)
          reject(err)
        }
      },

      fail: (err) => {
        removePending(config)

        // 网络错误重试
        if (config._retryCount === undefined) config._retryCount = 0
        if (config._retryCount < (config.retry || 2)) {
          config._retryCount++
          const delay = Math.pow(2, config._retryCount) * 1000
          setTimeout(() => {
            resolve(request(config))
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
}

// ========== 错误处理 ==========
function handleError(err) {
  const { statusCode, code } = err

  if (statusCode === 401 || code === 401) {
    // Token 过期
    uni.showToast({ title: '登录已过期', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/user/login' })
    }, 1500)
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

  delete(url, config = {}) {
    return request({ ...config, method: 'DELETE', url })
  },

  /**
   * 文件上传
   */
  upload(url, filePath, formData = {}) {
    const token = getToken()
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: baseURL + url,
        filePath,
        name: 'file',
        formData,
        header: token ? { 'Authorization': `Bearer ${token}` } : {},
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 0 || data.code === 200 || !data.code) {
            resolve(data.data !== undefined ? data.data : data)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        },
        fail: (err) => reject(new Error('上传失败'))
      })
    })
  },

  /** 添加请求拦截器 */
  useRequestInterceptor(fn) { requestInterceptors.push(fn) },

  /** 添加响应拦截器 */
  useResponseInterceptor(fn) { responseInterceptors.push(fn) }
}

export default http
