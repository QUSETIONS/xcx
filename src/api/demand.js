import http from '@/utils/request'

export const demandApi = {
  /** 需求列表 */
  list: (params) => http.get('/demand/list', params),
  /** 需求详情 */
  detail: (id) => http.get(`/demand/${id}`),
  /** 发布需求 */
  create: (data) => http.post('/demand', data),
  /** 我的发布 */
  myDemands: (params) => http.get('/demand/my', params),
  /** 更新状态 */
  updateStatus: (id, status) => http.put(`/demand/${id}/status`, { status })
}
