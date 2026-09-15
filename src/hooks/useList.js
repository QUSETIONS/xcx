import { ref, computed } from 'vue'
import { PAGE_SIZE } from '@/config/constants'

/**
 * 通用列表 Hook
 * - 分页加载
 * - 下拉刷新
 * - 搜索/筛选
 * - 加载更多
 */
export function useList(fetchFn, defaultPageSize = PAGE_SIZE) {
  const list = ref([])
  const page = ref(1)
  const total = ref(0)
  const loading = ref(false)
  const refreshing = ref(false)
  const noMore = ref(false)
  const error = ref(null)
  let requestSeq = 0

  const isEmpty = computed(() => list.value.length === 0 && !loading.value)

  async function load(reset = false) {
    if (reset) {
      page.value = 1
      noMore.value = false
      error.value = null
    }

    if (noMore.value && !reset) return null

    const requestId = ++requestSeq
    loading.value = true
    try {
      const params = { page: page.value, pageSize: defaultPageSize }
      const res = await fetchFn(params)
      if (requestId !== requestSeq) return res

      const incoming = Array.isArray(res) ? res : (res?.list || [])

      if (reset) {
        list.value = incoming
      } else {
        list.value = [...list.value, ...incoming]
      }

      total.value = Array.isArray(res) ? list.value.length : (res?.total ?? list.value.length)
      noMore.value = incoming.length < defaultPageSize
      error.value = null
      return res
    } catch (err) {
      if (requestId === requestSeq) error.value = err
      return null
    } finally {
      if (requestId === requestSeq) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  async function loadMore() {
    if (loading.value || noMore.value) return
    page.value++
    const result = await load(false)
    if (result === null && error.value) page.value = Math.max(1, page.value - 1)
  }

  async function refresh() {
    refreshing.value = true
    await load(true)
  }

  function reset() {
    requestSeq++
    list.value = []
    page.value = 1
    total.value = 0
    noMore.value = false
    error.value = null
    loading.value = false
    refreshing.value = false
  }

  return { list, total, loading, refreshing, noMore, error, isEmpty, load, loadMore, refresh, reset, retry: () => load(true) }
}
