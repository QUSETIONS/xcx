import { ref } from 'vue'

/**
 * 通用页面 Hook
 * - loading 状态
 * - 下拉刷新
 * - 页面生命周期
 */
export function usePage() {
  const loading = ref(false)
  const refreshing = ref(false)

  function startLoading() { loading.value = true }
  function stopLoading() { loading.value = false }

  async function withLoading(fn) {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  async function withRefresh(fn) {
    refreshing.value = true
    try {
      return await fn()
    } finally {
      refreshing.value = false
    }
  }

  return { loading, refreshing, startLoading, stopLoading, withLoading, withRefresh }
}
