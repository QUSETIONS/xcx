/**
 * 环境配置
 */

const accountInfo = (() => {
  try { return uni.getAccountInfoSync() || {} } catch { return {} }
})()

const envVersion = accountInfo.miniProgram?.envVersion
// H5 由 Vite 提供 import.meta.env。不要只依赖 process.env：在浏览器构建中它
// 可能是兼容 shim，导致本地 8080 被误判为生产环境、请求落到生产占位域名。
const viteIsDev = import.meta.env?.DEV === true
const nodeEnv = typeof process !== 'undefined' ? process.env?.NODE_ENV : ''

export const isDev = viteIsDev || envVersion === 'develop' || nodeEnv === 'development'
export const isProd = !viteIsDev && envVersion === 'release'
export const isH5 = typeof window !== 'undefined'
export const isMP = !isH5

// 生产小程序必须请求已经备案并接入的正式服务域名；不能再保留历史占位域名。
// H5 同域部署仍使用 /api，避免跨域；小程序没有同源能力，使用该绝对地址。
export const PRODUCTION_API_BASE_URL = 'https://www.mediamatch.cn/api'

// 本地 H5 通过同源 /api 由 Vite 代理到真实后端，避免内置浏览器拦截跨端口请求；
// 小程序/原生端仍直连本地后端。生产环境可通过 VITE_API_BASE_URL 覆盖。
const configuredBaseURL = import.meta.env?.VITE_API_BASE_URL
  || (typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL : '')

const localBaseURL = isH5 ? '/api' : 'http://localhost:3101/api'

// H5 生产包和 API 同域部署时直接走 /api，避免默认落到尚未配置的占位域名。
// 小程序没有同源能力，仍要求构建时通过 VITE_API_BASE_URL 注入公网 API。
export const baseURL = configuredBaseURL || (isDev
  ? localBaseURL
  : (isH5 ? '/api' : PRODUCTION_API_BASE_URL))

export const appVersion = '1.0.0'
