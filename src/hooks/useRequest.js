/**
 * useRequest - 异步数据加载 composable
 * 统一管理 loading / error / data 三态，支持重试
 *
 * 用法：
 *   const { state, data, error, run } = useRequest(async () => api.demand.list())
 *   onMounted(run)
 *   <skeleton v-if="state === 'loading'" />
 *   <error-state v-else-if="state === 'error'" @retry="run" />
 *   <content v-else />
 */
import { computed, ref, readonly } from 'vue'

export function useRequest(fetcher, options = {}) {
  const { initialData = null, immediate = false, delay = 0, dedupe = true } = options

  const data = ref(initialData)
  const error = ref(null)
  // 'idle' | 'loading' | 'success' | 'error'
  const state = ref('idle')
  const loading = computed(() => state.value === 'loading')
  let activeRun = null

  async function run(...args) {
    if (dedupe && activeRun) return activeRun

    const task = (async () => {
    state.value = 'loading'
    error.value = null
    try {
      let result = await fetcher(...args)
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay))
      }
      data.value = result
      state.value = 'success'
      return result
    } catch (e) {
      error.value = e
      state.value = 'error'
      throw e
    }
    })()

    activeRun = task
    try {
      return await task
    } finally {
      if (activeRun === task) activeRun = null
    }
  }

  function reset() {
    state.value = 'idle'
    data.value = initialData
    error.value = null
  }

  if (immediate) run()

  return {
    data,
    error,
    state: readonly(state),
    loading: readonly(loading),
    run,
    reset,
    // 便捷布尔
    isLoading: () => state.value === 'loading',
    isError: () => state.value === 'error',
    isSuccess: () => state.value === 'success'
  }
}
