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

  const isEmpty = computed(() => list.value.length === 0 && !loading.value)

  async function load(reset = false) {
    if (reset) {
      page.value = 1
      noMore.value = false
    }

    if (noMore.value && !reset) return

    loading.value = true
    try {
      const params = { page: page.value, pageSize: defaultPageSize }
      const res = await fetchFn(params)

      if (reset) {
        list.value = res.list || res || []
      } else {
        list.value = [...list.value, ...(res.list || res || [])]
      }

      total.value = res.total || list.value.length
      noMore.value = (res.list || res || []).length < defaultPageSize
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  async function loadMore() {
    if (loading.value || noMore.value) return
    page.value++
    await load(false)
  }

  async function refresh() {
    refreshing.value = true
    await load(true)
  }

  function reset() {
    list.value = []
    page.value = 1
    total.value = 0
    noMore.value = false
  }

  return { list, total, loading, refreshing, noMore, isEmpty, load, loadMore, refresh, reset }
}
