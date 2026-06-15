/**
 * Vitest 全局 setup
 * 在测试环境 mock uni 全局对象（小程序 API 在 node 环境不存在）
 */
import { vi } from 'vitest'

// 内存存储，模拟 uni.getStorageSync / setStorageSync 等
const _store = {}

const uni = {
  // ===== 同步存储 =====
  getStorageSync(key) {
    return _store[key] !== undefined ? _store[key] : ''
  },
  setStorageSync(key, data) {
    _store[key] = data
  },
  removeStorageSync(key) {
    delete _store[key]
  },
  clearStorageSync() {
    Object.keys(_store).forEach(k => delete _store[k])
  },
  getStorageInfoSync() {
    const keys = Object.keys(_store)
    return {
      keys,
      currentSize: keys.length * 2, // 模拟 KB
      limitSize: 10240
    }
  },

  // ===== Toast / Modal（测试中不报错即可）=====
  showToast: vi.fn(),
  showModal: vi.fn(({ success } = {}) => { if (success) success({ confirm: true }) }),
  showActionSheet: vi.fn(({ success, itemList } = {}) => { if (success) success({ tapIndex: 0 }) }),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  vibrateShort: vi.fn(),

  // ===== 导航（测试中不报错即可）=====
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  navigateBack: vi.fn(),

  // ===== 其他常用 =====
  getSystemInfoSync: vi.fn(() => ({ statusBarHeight: 44, platform: 'devtools' })),
  getAccountInfoSync: vi.fn(() => ({ miniProgram: { envVersion: 'develop' } }))
}

// 注入到全局
globalThis.uni = uni

// 暴露重置方法，每个测试用例前可清空存储
globalThis.__resetStore = () => {
  Object.keys(_store).forEach(k => delete _store[k])
}
