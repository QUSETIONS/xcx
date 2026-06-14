import http from '@/utils/request'

export const leadApi = {
  /** 提交对接 */
  create: (data) => http.post('/lead', data),
  /** 我的对接 */
  myLeads: (params) => http.get('/lead/my', params),
  /** 需求的对接列表（管理员） */
  listByDemand: (demandId) => http.get(`/lead/demand/${demandId}`),
  /** 更新对接状态 */
  updateStatus: (id, status) => http.put(`/lead/${id}/status`, { status })
}
