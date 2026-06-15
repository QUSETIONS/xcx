/**
 * API 桥接层：Mock / 真实后端无缝切换
 *
 * 当 ENV.USE_MOCK = true（默认）时，所有接口走本地 mock 服务；
 * 设为 false 后自动走真实 HTTP（utils/request.js）。
 *
 * 业务页面统一通过 bridge 调用，切换后端只需改一处 ENV.USE_MOCK。
 *
 *   import { bridge } from '@/api/bridge'
 *   const list = await bridge.demand.list({ page: 1 })
 */
import { ENV } from '@/utils/env'
import http from '@/utils/request'
import * as mock from '@/mock/service'

const useMock = () => ENV.USE_MOCK

// mock 模拟网络延迟，贴近真实体验
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

function adapt(mockFn, realFn) {
  return async function (...args) {
    if (useMock()) {
      await delay()
      return mockFn(...args)
    }
    return realFn(...args)
  }
}

export const bridge = {
  // 需求
  demand: {
    list: adapt((p) => mock.demandService.list(p), (p) => http.get('/demand/list', p)),
    detail: adapt((id) => mock.demandService.detail(id), (id) => http.get(`/demand/${id}`)),
    create: adapt((d) => mock.demandService.create(d), (d) => http.post('/demand', d)),
    myDemands: adapt(() => mock.demandService.myDemands(), () => http.get('/demand/my'))
  },

  // 对接
  lead: {
    create: adapt((d) => mock.leadService.create(d), (d) => http.post('/lead', d)),
    updateStatus: adapt((id, s) => mock.leadService.updateStatus(id, s), (id, s) => http.put(`/lead/${id}/status`, { status: s }))
  },

  // 服务商品
  product: {
    list: adapt((p) => mock.productService.list(p), (p) => http.get('/product/list', p)),
    detail: adapt((id) => mock.productService.detail(id), (id) => http.get(`/product/${id}`))
  },

  // 订单
  order: {
    create: adapt((d) => mock.orderService.create(d), (d) => http.post('/order', d)),
    myOrders: adapt((p) => mock.orderService.myOrders(p), (p) => http.get('/order/my', p)),
    updateStatus: adapt((id, s) => mock.orderService.updateStatus(id, s), (id, s) => http.put(`/order/${id}/status`, { status: s }))
  },

  // 认证
  user: {
    login: adapt((d) => mock.userService.login(d), (d) => http.post('/auth/login', d)),
    info: adapt(() => mock.userService.getInfo(), () => http.get('/user/info'))
  },

  // 收藏
  favorite: {
    toggle: adapt((d) => mock.favoriteService.toggle(d), (d) => http.post('/favorite/toggle', d)),
    list: adapt((p) => mock.favoriteService.list(p), (p) => http.get('/favorite', p))
  }
}

export default bridge
