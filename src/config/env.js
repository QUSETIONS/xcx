/**
 * 环境配置
 */

const accountInfo = (() => {
  try { return uni.getAccountInfoSync() || {} } catch { return {} }
})()

const envVersion = accountInfo.miniProgram?.envVersion

export const isDev = envVersion === 'develop' || process.env.NODE_ENV === 'development'
export const isProd = envVersion === 'release'
export const isH5 = typeof window !== 'undefined'
export const isMP = !isH5

export const baseURL = isDev
  ? 'http://localhost:3000/api'
  : 'https://api.qiyeku.com/api'

export const appVersion = '1.0.0'
