import http from '@/utils/request'

export const orderApi = {
  /** 创建订单 */
  create: (data) => http.post('/order', data),
  /** 我的订单 */
  myOrders: (params) => http.get('/order/my', params),
  /** 订单详情 */
  detail: (id) => http.get(`/order/${id}`),
  /** 更新订单状态 */
  updateStatus: (id, status) => http.put(`/order/${id}/status`, { status })
}
