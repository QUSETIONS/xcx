/**
 * 环境配置
 *
 * 数据源切换（影响所有走 bridge 的页面）：
 *   USE_MOCK = true   → 内存 Mock（前端独立开发，无需后端启动）
 *   USE_MOCK = false  → HTTP 请求 BASE_URL
 *
 * USE_MOCK=false 时 BASE_URL 三选一：
 *   http://localhost:3000/api  → mock-server（70+接口全覆盖，前端联调首选）
 *   /api                       → H5 开发代理到真实后端（JWT+SQLite）
 *   http://localhost:3101/api  → 小程序/原生开发直连真实后端
 *   https://www.mediamatch.cn/api → 生产环境正式服务
 *
 * 注：仅经 bridge 调用的接口受此开关控制；直接 import @/mock 的页面
 *     始终走内存（后续迁移到 bridge 后才走 HTTP）。
 */
import { PRODUCTION_API_BASE_URL } from '@/config/env'

const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
const isH5 = typeof window !== 'undefined'
const isDev = import.meta.env?.DEV === true
// 真实前后端联调默认不再偷偷创建演示会话。
// 如需本地演示，必须显式设置 VITE_ALLOW_DEMO_LOGIN=true，避免后端未启动或
// 演示接口被关闭时，首页把 500 错误误认为是正常的空数据。
const allowDemoLogin = import.meta.env?.VITE_ALLOW_DEMO_LOGIN === 'true'
const configuredBaseURL = import.meta.env?.VITE_API_BASE_URL
  || (typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL : '')

export const ENV = {
  // 测试环境固定走 Mock，实际开发/发布默认走真实后端。
  USE_MOCK: isTest,
  // Demo 登录只在开发构建默认开放；生产构建必须显式接入正式登录。
  ALLOW_DEMO_LOGIN: allowDemoLogin,
  BASE_URL: configuredBaseURL || (isDev
    ? (isH5 ? '/api' : 'http://localhost:3101/api')
    : (isH5 ? '/api' : PRODUCTION_API_BASE_URL)),
  TIMEOUT: 15000,
  VERSION: '1.0.0'
}

// 请求状态码
export const CODE = {
  SUCCESS: 0,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}
