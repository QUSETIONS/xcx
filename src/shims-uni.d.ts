/**
 * uni-app 全局对象类型声明
 * 让 TypeScript 识别 uni 全局 API
 */

declare const uni: {
  getStorageSync(key: string): any
  setStorageSync(key: string, data: any): void
  removeStorageSync(key: string): void
  clearStorageSync(): void
  getStorageInfoSync(): { keys: string[]; currentSize: number; limitSize: number }
  showToast(options: { title: string; icon?: 'success' | 'none' | 'error' | 'loading' }): void
  showModal(options: { title?: string; content?: string; showCancel?: boolean; success?: (r: { confirm: boolean; cancel: boolean }) => void }): void
  showLoading(options: { title: string; mask?: boolean }): void
  hideLoading(): void
  navigateTo(options: { url: string }): void
  redirectTo(options: { url: string }): void
  switchTab(options: { url: string }): void
  reLaunch(options: { url: string }): void
  navigateBack(): void
  getSystemInfoSync(): { statusBarHeight: number; platform: string }
}

declare function getCurrentPages(): any[]
