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
import { ref, readonly } from 'vue'

export function useRequest(fetcher, options = {}) {
  const { initialData = null, immediate = false, delay = 0 } = options

  const data = ref(initialData)
  const error = ref(null)
  // 'idle' | 'loading' | 'success' | 'error'
  const state = ref('idle')

  async function run(...args) {
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
    loading: readonly(ref(false)), // 兼容字段，实际用 state
    run,
    reset,
    // 便捷布尔
    isLoading: () => state.value === 'loading',
    isError: () => state.value === 'error',
    isSuccess: () => state.value === 'success'
  }
}
