import http from '@/utils/request'

export const productApi = {
  /** 商品列表 */
  list: (params) => http.get('/product/list', params),
  /** 商品详情 */
  detail: (id) => http.get(`/product/${id}`)
}
