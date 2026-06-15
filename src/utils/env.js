/**
 * 环境配置
 * 切换 USE_MOCK 控制是否使用 Mock 数据
 * 上线时设为 false 并配置真实 BASE_URL
 */
export const ENV = {
  // 是否使用 Mock 数据（开发阶段）
  USE_MOCK: true,
  // 真实后端地址
  BASE_URL: 'https://api.qiyeku.com/v1',
  // 请求超时（毫秒）
  TIMEOUT: 15000,
  // 应用版本
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
