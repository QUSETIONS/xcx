import http from '@/utils/request'

export const commonApi = {
  /** 获取分类 */
  categories: (type) => http.get('/common/categories', { type }),
  /** 获取 Banner */
  banners: () => http.get('/common/banners'),
  /** 收藏切换 */
  toggleFavorite: (data) => http.post('/common/favorite/toggle', data),
  /** 收藏列表 */
  favorites: (params) => http.get('/common/favorite/list', params),
  /** 文件上传 */
  upload: (filePath) => http.upload('/common/upload', filePath)
}
