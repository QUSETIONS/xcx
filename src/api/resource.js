import http from '@/utils/request'

export const resourceApi = {
  /** 资料列表 */
  list: (params) => http.get('/resource/list', params),
  /** 资料详情 */
  detail: (id) => http.get(`/resource/${id}`)
}
