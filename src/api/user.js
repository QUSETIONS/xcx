import http from '@/utils/request'

export const userApi = {
  /** 小程序登录 */
  login: (code) => http.post('/user/login', { code }),
  /** 获取用户信息 */
  getInfo: () => http.get('/user/info'),
  /** 更新用户资料 */
  updateProfile: (data) => http.put('/user/profile', data),
  /** Demo 登录 */
  loginAsDemo: (role = 'user') => http.post('/user/demo-login', { role })
}
