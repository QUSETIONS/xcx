/**
 * API 桥接层：Mock / 真实后端无缝切换
 *
 * 当 ENV.USE_MOCK = true（默认）时，所有接口走本地 mock 服务（带 200ms 模拟延迟）；
 * 设为 false 后自动走真实 HTTP（utils/request.js）。
 *
 * 业务页面统一通过 bridge 调用，切换后端只需改一处 ENV.USE_MOCK。
 *
 *   import { bridge } from '@/api/bridge'
 *   const list = await bridge.demand.list({ page: 1 })
 *
 * 注：realFn 的 URL/方法 = 真实后端需实现的 REST 契约。当前无真实后端，仅在
 * USE_MOCK=false 时由测试 mock @/utils/request 验证调用正确。
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
    update: adapt((id, d) => mock.demandService.update(id, d), (id, d) => http.put(`/demand/${id}`, d)),
    myDemands: adapt((p) => mock.demandService.myDemands(p), (p) => http.get('/demand/my', p))
  },

  // 对接
  lead: {
    create: adapt((d) => mock.leadService.create(d), (d) => http.post('/lead', d)),
    myLeads: adapt((p) => mock.leadService.myLeads(p), (p) => http.get('/lead/my', p)),
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
    detail: adapt((id) => mock.orderService.detail(id), (id) => http.get(`/order/${id}`)),
    updateStatus: adapt((id, s) => mock.orderService.updateStatus(id, s), (id, s) => http.put(`/order/${id}/status`, { status: s }))
  },

  // 用户/认证
  user: {
    login: adapt((d) => mock.userService.login(d), (d) => http.post('/auth/login', d)),
    demoLogin: adapt((role) => mock.userService.demoLogin(role), (role) => http.post('/auth/demo-login', { role })),
    info: adapt(() => mock.userService.getInfo(), () => http.get('/user/info'))
  },

  // 收藏
  favorite: {
    toggle: adapt((d) => mock.favoriteService.toggle(d), (d) => http.post('/favorite/toggle', d)),
    check: adapt((d) => mock.favoriteService.check(d), (d) => http.get('/favorite/check', d)),
    list: adapt((p) => mock.favoriteService.list(p), (p) => http.get('/favorite', p))
  },

  // 购物车（存储态）
  cart: {
    add: adapt((p) => mock.cartService.add(p), (p) => http.post('/cart', p)),
    updateQty: adapt((id, q) => mock.cartService.updateQty(id, q), (id, q) => http.put(`/cart/${id}`, { quantity: q })),
    remove: adapt((id) => mock.cartService.remove(id), (id) => http.delete(`/cart/${id}`)),
    clear: adapt(() => mock.cartService.clear(), () => http.delete('/cart')),
    list: adapt(() => mock.cartService.list(), () => http.get('/cart')),
    count: adapt(() => mock.cartService.count(), () => http.get('/cart/count'))
  },

  // 资料库
  resource: {
    list: adapt((p) => mock.resourceService.list(p), (p) => http.get('/resource/list', p)),
    detail: adapt((id) => mock.resourceService.detail(id), (id) => http.get(`/resource/${id}`))
  },

  // 社区
  community: {
    topics: adapt(() => mock.communityService.topics(), () => http.get('/community/topics')),
    posts: adapt((p) => mock.communityService.posts(p), (p) => http.get('/community/posts', p)),
    postDetail: adapt((id) => mock.communityService.postDetail(id), (id) => http.get(`/community/posts/${id}`)),
    createPost: adapt((d) => mock.communityService.createPost(d), (d) => http.post('/community/posts', d)),
    comments: adapt((postId) => mock.communityService.comments(postId), (postId) => http.get(`/community/posts/${postId}/comments`)),
    createComment: adapt((postId, content) => mock.communityService.createComment(postId, content), (postId, content) => http.post(`/community/posts/${postId}/comments`, { content })),
    like: adapt((postId) => mock.communityService.like(postId), (postId) => http.post(`/community/posts/${postId}/like`)),
    userInfo: adapt((userId) => mock.communityService.userInfo(userId), (userId) => http.get(`/users/${userId}`))
  },

  // 评价
  review: {
    list: adapt((p) => mock.reviewService.list(p), (p) => http.get('/review/list', p)),
    create: adapt((d) => mock.reviewService.create(d), (d) => http.post('/review', d)),
    avgRating: adapt((targetId) => mock.reviewService.avgRating(targetId), (targetId) => http.get('/review/avg', { target_id: targetId })),
    userCreditScore: adapt((userId) => mock.reviewService.userCreditScore(userId), (userId) => http.get('/review/credit', { userId }))
  },

  // AI 匹配
  match: {
    providers: adapt((demand) => mock.matchService.matchProviders(demand), (demand) => http.post('/match/providers', demand))
  },

  // 数据看板
  dashboard: {
    overview: adapt(() => mock.dashboardService.overview(), () => http.get('/dashboard/overview')),
    trend: adapt((days) => mock.dashboardService.trend(days), (days) => http.get('/dashboard/trend', { days })),
    categoryStats: adapt(() => mock.dashboardService.categoryStats(), () => http.get('/dashboard/category-stats')),
    trendChange: adapt((days) => mock.dashboardService.trendChange(days), (days) => http.get('/dashboard/trend-change', { days }))
  },

  // 消息通知
  notify: {
    list: adapt((p) => mock.notifyService.list(p), (p) => http.get('/notify/list', p)),
    read: adapt((id) => mock.notifyService.read(id), (id) => http.put(`/notify/${id}/read`)),
    readAll: adapt(() => mock.notifyService.readAll(), () => http.put('/notify/read-all')),
    unreadCount: adapt(() => mock.notifyService.unreadCount(), () => http.get('/notify/unread-count'))
  },

  // 成交
  deal: {
    myDeals: adapt(() => mock.dealService.myDeals(), () => http.get('/deal/my')),
    updateStatus: adapt((id, s) => mock.dealService.updateStatus(id, s), (id, s) => http.put(`/deal/${id}/status`, { status: s })),
    addReview: adapt((id, d) => mock.dealService.addReview(id, d), (id, d) => http.post(`/deal/${id}/review`, d))
  },

  // 搜索
  search: {
    hotKeywords: adapt(() => mock.searchService.hotKeywords(), () => http.get('/search/hot')),
    history: adapt(() => mock.searchService.history(), () => http.get('/search/history')),
    addHistory: adapt((keyword) => mock.searchService.addHistory(keyword), (keyword) => http.post('/search/history', { keyword })),
    clearHistory: adapt(() => mock.searchService.clearHistory(), () => http.delete('/search/history')),
    search: adapt((keyword) => mock.searchService.search(keyword), (keyword) => http.get('/search', { keyword }))
  },

  // 企业认证（存储态）
  verify: {
    getInfo: adapt(() => mock.verifyService.getInfo(), () => http.get('/verify/info')),
    status: adapt(() => mock.verifyService.status(), () => http.get('/verify/status')),
    submit: adapt((d) => mock.verifyService.submit(d), (d) => http.post('/verify/submit', d)),
    approve: adapt(() => mock.verifyService.approve(), () => http.post('/verify/approve'))
  },

  // 会员（存储态）
  member: {
    tiers: adapt(() => mock.memberService.tiers(), () => http.get('/member/tiers')),
    current: adapt(() => mock.memberService.current(), () => http.get('/member/current')),
    subscribe: adapt((tierId) => mock.memberService.subscribe(tierId), (tierId) => http.post('/member/subscribe', { tierId }))
  },

  // 在线客服（存储态）
  chat: {
    list: adapt(() => mock.chatService.list(), () => http.get('/chat/list')),
    send: adapt((content) => mock.chatService.send(content), (content) => http.post('/chat/send', { content })),
    reply: adapt(() => mock.chatService.reply(), () => http.post('/chat/reply'))
  },

  // 积分（存储态）
  points: {
    getInfo: adapt(() => mock.pointsService.getInfo(), () => http.get('/points/info')),
    checkin: adapt(() => mock.pointsService.checkin(), () => http.post('/points/checkin')),
    history: adapt(() => mock.pointsService.history(), () => http.get('/points/history')),
    rules: adapt(() => mock.pointsService.rules(), () => http.get('/points/rules'))
  },

  // 优惠券
  coupon: {
    list: adapt(() => mock.couponService.list(), () => http.get('/coupon/list')),
    claim: adapt((id) => mock.couponService.claim(id), (id) => http.post(`/coupon/${id}/claim`)),
    available: adapt(() => mock.couponService.available(), () => http.get('/coupon/available'))
  },

  // 关注
  follow: {
    list: adapt(() => mock.followService.list(), () => http.get('/follow/list')),
    count: adapt(() => mock.followService.count(), () => http.get('/follow/count')),
    check: adapt((userId) => mock.followService.check(userId), (userId) => http.get('/follow/check', { userId })),
    toggle: adapt((userId) => mock.followService.toggle(userId), (userId) => http.post('/follow/toggle', { userId }))
  },

  // 活动中心
  campaign: {
    list: adapt(() => mock.campaignService.list(), () => http.get('/campaign/list')),
    detail: adapt((id) => mock.campaignService.detail(id), (id) => http.get(`/campaign/${id}`))
  }
}

export default bridge
