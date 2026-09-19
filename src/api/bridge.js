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
 * 注：realFn 的 URL/方法 = 真实后端 REST 契约；本地配套后端位于 ../server，
 * USE_MOCK=false 时可直接进行真实 HTTP 联调。生产环境仍需配置正式 BASE_URL、鉴权和 Agent 凭证。
 */
import { ENV } from '@/utils/env'
import { baseURL, isH5 } from '@/config/env'
import http from '@/utils/request'
import * as mock from '@/mock/service'
import { proposalService as proposalMock } from '@/mock/proposal'
import { normalizeAgentResult, normalizeProviderMatches } from '@/api/contracts'
import { normalizeProposal, normalizeProposalAction, normalizeProposalPool } from '@/api/contracts'
import * as smartEngine from '@/utils/smart-engine'
import { getStoredPublicIntakeSession, getStoredSession, hasStoredAccessToken, persistPublicIntakeSession, persistSession } from '@/utils/session'
const useMock = () => ENV.USE_MOCK

// Agent 的请求路由是前端桥接层的本地控制流，不应依赖仓库外的 Web Main。
async function runAgentRequest({ useMock: mockMode = false, mockRequest, realRequest, delay: wait, ensureLogin: login, skipEnsureLogin = false } = {}) {
  if (mockMode) {
    if (typeof wait === 'function') await wait()
    if (typeof mockRequest !== 'function') throw new TypeError('mockRequest is required')
    return mockRequest()
  }
  if (!skipEnsureLogin && typeof login === 'function') await login()
  if (typeof realRequest !== 'function') throw new TypeError('realRequest is required')
  return realRequest()
}

// mock 只保留极短的网络感知，避免本地演示把等待误认为接口卡顿。
const delay = (ms = 80) => new Promise(r => setTimeout(r, ms))

function createClientMessageId(prefix = 'message') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

// 登录就绪 gate：HTTP 模式下首次请求前确保已登录。
// 这里只读写持久化会话，不反向依赖 Pinia user store；响应式状态由 store 自己维护。
let _loginGate = null
function ensureLogin() {
  if (_loginGate) return _loginGate
  _loginGate = Promise.resolve().then(async () => {
    if (hasStoredAccessToken()) return

    // 正式环境未接入微信授权时保持游客态，让公开接口仍可浏览；
    // 需要登录的接口会由后端返回 401，再引导用户进入正式登录页。
    if (!ENV.ALLOW_DEMO_LOGIN) return

    // 不能调用 userStore.demoLogin：它会回到 bridge.user.demoLogin，重新进入本 gate。
    // 这里直接请求认证端点，再同步持久化会话，避免真实模式首请求死锁。
    const result = await http.post('/auth/demo-login', { role: 'user' })
    persistSession(result)
  })
    .catch((e) => {
      _loginGate = null
      console.warn('[bridge] ensureLogin failed', e)
      throw e
    })
  return _loginGate
}

function adapt(mockFn, realFn, options = {}) {
  return async function (...args) {
    if (useMock()) {
      await delay()
      return mockFn(...args)
    }
    if (!options.skipEnsureLogin) await ensureLogin()
    return realFn(...args)
  }
}

function publicIntakeConfig() {
  const token = getStoredPublicIntakeSession()
  return token ? { header: { 'X-Intake-Session': token } } : {}
}

function rememberPublicIntakeSession(result) {
  if (result?.public_token) persistPublicIntakeSession(result.public_token)
  return result
}

async function streamEvents(path, payload, callbacks = {}, normalizeResult = (value) => value) {
  if (!isH5 || typeof fetch !== 'function') {
    return streamEventsByUniRequest(path, payload, callbacks, normalizeResult)
  }
  return streamEventsByFetch(path, payload, callbacks, normalizeResult)
}

async function streamEventsByFetch(path, payload, callbacks = {}, normalizeResult = (value) => value) {
  const token = getStoredSession()?.token || ''
  const response = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload || {})
  }).catch((error) => {
    // 网络中断不等于“流式端点不存在”。请求可能已经在服务端落库，
    // 此时再发一次普通 POST 会把用户消息/客服问题写入两遍。
    const next = error instanceof Error ? error : new Error('流式连接中断')
    next.streamInterrupted = true
    throw next
  })

  if (!response?.ok) {
    const error = new Error(`HTTP ${response?.status || 0}`)
    error.statusCode = Number(response?.status || 0)
    // 旧服务器或未部署流式路由时，回退到普通接口，避免用户卡死在发送状态。
    error.streamUnavailable = error.statusCode === 404 || error.statusCode === 405
    throw error
  }
  if (!response.body || typeof response.body.getReader !== 'function') {
    const error = new Error('当前浏览器不支持流式回复')
    // 服务器已经返回 2xx，不能再用普通 POST 重放同一条写请求。
    error.streamInterrupted = true
    throw error
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let result = null

  const consumeFrame = (frame) => {
    let eventName = 'message'
    const dataLines = []
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim()
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    }
    if (!dataLines.length) return
    let payloadValue = {}
    try { payloadValue = JSON.parse(dataLines.join('\n')) } catch { return }
    if (eventName === 'status') {
      if (payloadValue.status === 'retrying') callbacks.onRetry?.()
      callbacks.onStatus?.(payloadValue.status || '')
    }
    if (eventName === 'delta' && payloadValue.text) callbacks.onDelta?.(String(payloadValue.text))
    if (eventName === 'result') {
      const raw = payloadValue?.data && payloadValue.code !== undefined ? payloadValue.data : payloadValue
      result = normalizeResult(raw)
      callbacks.onResult?.(result)
    }
    if (eventName === 'error') {
      const error = new Error(payloadValue.message || '流式回复失败')
      error.statusCode = Number(payloadValue.status || 500)
      throw error
    }
  }

  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      buffer += decoder.decode(chunk.value, { stream: true })
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() || ''
      frames.forEach(consumeFrame)
    }
    buffer += decoder.decode()
    if (buffer.trim()) consumeFrame(buffer)
  } finally {
    reader.releaseLock?.()
  }

  if (!result) throw new Error('流式回复未返回完整结果')
  return result
}

// 微信小程序没有 Fetch ReadableStream，使用 enableChunked + onChunkReceived
// 读取同一条 SSE；这样编译成小程序后也不会退回“等整段 JSON 返回”。
function streamEventsByUniRequest(path, payload, callbacks = {}, normalizeResult = (value) => value) {
  if (typeof uni === 'undefined' || typeof uni.request !== 'function') return null
  return new Promise((resolve, reject) => {
    const token = getStoredSession()?.token || ''
    const decoder = typeof TextDecoder === 'function' ? new TextDecoder('utf-8') : null
    let buffer = ''
    let result = null
    let settled = false
    let requestTask = null
    let receivedChunkData = false

    const fail = (error) => {
      if (settled) return
      settled = true
      requestTask?.abort?.()
      reject(error)
    }
    const consumeFrame = (frame) => {
      let eventName = 'message'
      const dataLines = []
      for (const line of String(frame || '').split(/\r?\n/)) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      }
      if (!dataLines.length) return
      let payloadValue = {}
      try { payloadValue = JSON.parse(dataLines.join('\n')) } catch { return }
      if (eventName === 'status') {
        if (payloadValue.status === 'retrying') callbacks.onRetry?.()
        callbacks.onStatus?.(payloadValue.status || '')
      }
      if (eventName === 'delta' && payloadValue.text) callbacks.onDelta?.(String(payloadValue.text))
      if (eventName === 'result') {
        const raw = payloadValue?.data && payloadValue.code !== undefined ? payloadValue.data : payloadValue
        result = normalizeResult(raw)
        callbacks.onResult?.(result)
      }
      if (eventName === 'error') {
        const error = new Error(payloadValue.message || '流式回复失败')
        error.statusCode = Number(payloadValue.status || 500)
        throw error
      }
    }
    const consumeChunk = (value, fromChunkEvent = false) => {
      if (settled) return
      try {
        let text = typeof value === 'string' ? value : ''
        if (!text && decoder && value instanceof ArrayBuffer) text = decoder.decode(new Uint8Array(value), { stream: true })
        if (!text && decoder && value?.buffer instanceof ArrayBuffer) {
          const bytes = new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || value.buffer.byteLength)
          text = decoder.decode(bytes, { stream: true })
        }
        if (!text) return
        if (fromChunkEvent) receivedChunkData = true
        buffer += text
        const frames = buffer.split(/\r?\n\r?\n/)
        buffer = frames.pop() || ''
        frames.forEach(consumeFrame)
      } catch (error) {
        fail(error)
      }
    }

    requestTask = uni.request({
      url: `${baseURL}${path}`,
      method: 'POST',
      data: payload || {},
      header: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      timeout: 70000,
      enableChunked: true,
      success: (response) => {
        if (settled) return
        const status = Number(response?.statusCode || 0)
        if (status < 200 || status >= 300) {
          const error = new Error(`HTTP ${status}`)
          error.statusCode = status
          error.streamUnavailable = status === 404 || status === 405
          return fail(error)
        }
        // enableChunked 下 success.data 通常是完整响应，而 onChunkReceived 已经
        // 逐块消费过同一份 SSE。重复消费会让前端看到两次回复、两条 result。
        if (!receivedChunkData && typeof response?.data === 'string') consumeChunk(response.data)
        if (buffer.trim()) {
          try { consumeFrame(buffer) } catch (error) { return fail(error) }
        }
        if (!result) {
          const error = new Error('流式回复未返回完整结果')
          error.streamInterrupted = true
          return fail(error)
        }
        settled = true
        resolve(result)
      },
      fail: (error) => {
        const next = error instanceof Error ? error : new Error(error?.errMsg || '流式连接中断')
        next.streamInterrupted = true
        fail(next)
      }
    })
    requestTask?.onChunkReceived?.((event) => consumeChunk(event?.data, true))
  })
}

async function streamAgentChat(payload, callbacks = {}) {
  return streamEvents('/agent/chat/stream', payload, callbacks, normalizeAgentResult)
}

async function streamCustomerServiceChat(payload, callbacks = {}) {
  return streamEvents('/chat/send/stream', payload, callbacks)
}

async function streamDirectMessage(userId, payload, callbacks = {}) {
  return streamEvents(`/network/direct/${encodeURIComponent(userId)}/messages/stream`, payload, callbacks)
}

async function streamMockAgentChat(payload, callbacks = {}) {
  await delay(40)
  const result = normalizeAgentResult(mock.agentService.chat(payload))
  const reply = String(result.reply || '')
  callbacks.onStatus?.('thinking')
  for (let index = 0; index < reply.length; index += 12) {
    callbacks.onDelta?.(reply.slice(index, index + 12))
    await delay(8)
  }
  callbacks.onResult?.(result)
  return result
}

async function streamMockText(text, callbacks = {}) {
  callbacks.onStatus?.('thinking')
  const value = String(text || '')
  for (let index = 0; index < value.length; index += 12) {
    callbacks.onDelta?.(value.slice(index, index + 12))
    await delay(8)
  }
}

export const bridge = {
  // 需求
  demand: {
    list: adapt((p) => mock.demandService.list(p), (p) => http.get('/demand/list', p)),
    detail: adapt((id) => mock.demandService.detail(id), (id) => http.get(`/demand/${id}`)),
    create: adapt((d) => mock.demandService.create(d), (d) => http.post('/demand', d)),
    update: adapt((id, d) => mock.demandService.update(id, d), (id, d) => http.put(`/demand/${id}`, d)),
    delete: adapt((id) => mock.demandService.delete(id), (id) => http.delete(`/demand/${id}`)),
    myDemands: adapt((p) => mock.demandService.myDemands(p), (p) => http.get('/demand/my', p))
  },

  // 已发布需求的对话 Agent：上下文由服务端从需求公开字段重建，客户端不能自带或覆盖甲方上下文。
  demandAgent: {
    detail: adapt((id) => mock.demandService.agent(id), (id) => http.get(`/demand/${encodeURIComponent(id)}/agent`)),
    history: adapt(
      () => ({ conversation: null, messages: [], result: null }),
      (id) => http.get('/agent/history', { scope: 'demand', scope_id: id })
    ),
    chat: adapt(
      (id, payload) => mock.demandService.agentChat(id, payload),
      (id, payload) => http.post(`/agent/demand/${encodeURIComponent(id)}/chat`, payload, { timeout: 70000, retry: 0 })
    ),
    chatStream: (id, payload, callbacks = {}) => runAgentRequest({
      useMock: useMock(),
      delay,
      ensureLogin,
      mockRequest: async () => {
        const result = normalizeAgentResult(mock.demandService.agentChat(id, payload))
        await streamMockText(result.reply || '', callbacks)
        callbacks.onResult?.(result)
        return result
      },
      realRequest: async () => {
        try {
          const streamed = await streamEvents(`/agent/demand/${encodeURIComponent(id)}/chat/stream`, payload, callbacks, normalizeAgentResult)
          if (streamed) return streamed
        } catch (error) {
          if (!error?.streamUnavailable) throw error
        }
        return http.post(`/agent/demand/${encodeURIComponent(id)}/chat`, payload, { timeout: 70000, retry: 0 }).then(normalizeAgentResult)
      }
    })
  },

  // 对接
  lead: {
    create: adapt((d) => mock.leadService.create(d), (d) => http.post('/lead', d)),
    myLeads: adapt((p) => mock.leadService.myLeads(p), (p) => http.get('/lead/my', p)),
    inbox: adapt((p) => mock.leadService.inbox(p), (p) => http.get('/lead/inbox', p)),
    updateStatus: adapt((id, s) => mock.leadService.updateStatus(id, s), (id, s) => http.put(`/lead/${id}/status`, { status: s }))
  },

  // 多团队提案与报价比较池
  proposal: {
    list: adapt(
      (demandId) => normalizeProposalPool(proposalMock.list(demandId)),
      (demandId) => http.get(`/proposal/demand/${demandId}`).then(normalizeProposalPool)
    ),
    invite: adapt(
      (demandId, payload) => normalizeProposalAction(proposalMock.invite(demandId, payload)),
      (demandId, payload) => http.post(`/proposal/demand/${demandId}/invite`, payload).then(normalizeProposalAction)
    ),
    inviteMatches: adapt(
      (demandId, payload) => normalizeProposalAction(proposalMock.inviteMatches(demandId, payload)),
      (demandId, payload) => http.post(`/proposal/demand/${demandId}/invite-matches`, payload).then(normalizeProposalAction)
    ),
    inbox: adapt(
      () => normalizeProposalPool(proposalMock.inbox()),
      () => http.get('/proposal/inbox').then(normalizeProposalPool)
    ),
    view: adapt(
      (id) => normalizeProposal(proposalMock.view(id)),
      (id) => http.post(`/proposal/${id}/view`).then(normalizeProposal)
    ),
    respond: adapt(
      (id, payload) => normalizeProposal(proposalMock.respond(id, payload)),
      (id, payload) => http.put(`/proposal/${id}/respond`, payload).then(normalizeProposal)
    ),
    decide: adapt(
      (id, decision) => normalizeProposalAction(proposalMock.decide(id, decision)),
      (id, decision) => http.put(`/proposal/${id}/decision`, { decision }).then(normalizeProposalAction)
    )
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
    updateStatus: adapt((id, s) => mock.orderService.updateStatus(id, s), (id, s) => http.put(`/order/${id}/status`, { status: s })),
    pay: adapt((id) => mock.orderService.pay(id), (id) => http.post(`/order/${id}/pay`))
  },

  // 用户/认证
  user: {
    login: adapt((d) => mock.userService.login(d), (d) => http.post('/auth/login', d), { skipEnsureLogin: true }),
    register: adapt((d) => mock.userService.register(d), (d) => http.post('/auth/register', d), { skipEnsureLogin: true }),
    requestRegisterCode: adapt(
      (d) => mock.userService.requestRegisterCode(d),
      (d) => http.post('/auth/register/request-code', d),
      { skipEnsureLogin: true }
    ),
    loginPassword: adapt((d) => mock.userService.loginPassword(d), (d) => http.post('/auth/login-password', d), { skipEnsureLogin: true }),
    requestPasswordResetCode: adapt(
      (d) => mock.userService.requestPasswordResetCode(d),
      (d) => http.post('/auth/password-reset/request-code', d),
      { skipEnsureLogin: true }
    ),
    resetPassword: adapt(
      (d) => mock.userService.resetPassword(d),
      (d) => http.post('/auth/password-reset/confirm', d),
      { skipEnsureLogin: true }
    ),
    requestEmailVerificationCode: adapt(
      (d) => mock.userService.requestEmailVerificationCode(d),
      (d) => http.post('/user/email-verification/request-code', d)
    ),
    confirmEmailVerificationCode: adapt(
      (d) => mock.userService.confirmEmailVerificationCode(d),
      (d) => http.post('/user/email-verification/confirm', d)
    ),
    refresh: adapt((token) => mock.userService.refresh(token), (token) => http.post('/auth/refresh', { refresh_token: token }), { skipEnsureLogin: true }),
    logout: adapt(() => ({ revoked: true }), (token) => http.post('/auth/logout', { refresh_token: token }), { skipEnsureLogin: true }),
    demoLogin: adapt((role) => mock.userService.demoLogin(role), (role) => http.post('/auth/demo-login', { role }), { skipEnsureLogin: true }),
    info: adapt(() => mock.userService.getInfo(), () => http.get('/user/info')),
    updateProfile: adapt((d) => mock.userService.updateProfile(d), (d) => http.put('/user/profile', d)),
    consentStatus: adapt(() => mock.userService.consentStatus(), () => http.get('/user/consent-status')),
    saveConsents: adapt((d) => mock.userService.saveConsents(d), (d) => http.post('/user/consents', d)),
    deleteAccount: adapt(() => mock.userService.deleteAccount(), () => http.delete('/user/account', { confirm: true }))
  },

  // App 内置内测资料：提交后进入后台筛选池，邀请码用于邀请更多项目方/资金方填写。
  intake: {
    options: adapt(() => mock.intakeService.options(), () => http.get('/intake/options', undefined, publicIntakeConfig()), { skipEnsureLogin: true }),
    invitePreview: adapt((code) => mock.intakeService.invitePreview(code), (code) => http.get(`/intake/invites/${encodeURIComponent(String(code || '').trim().toUpperCase())}`, undefined, publicIntakeConfig()), { skipEnsureLogin: true }),
    mine: adapt(() => mock.intakeService.mine(), () => http.get('/intake/mine')),
    save: adapt((payload) => mock.intakeService.save(payload), (payload) => http.put('/intake/mine', payload)),
    submit: adapt((payload) => mock.intakeService.submit(payload), (payload) => http.post('/intake/submit', payload)),
    setInviteReward: adapt((value) => mock.intakeService.setInviteReward(value), (value) => http.put('/intake/invite/reward', { inviter_reward_type: value })),
    status: adapt(() => mock.intakeService.status(), () => http.get('/intake/mine/status')),
    publicMine: adapt(() => mock.intakeService.mine(), () => http.get('/intake/public/mine', undefined, publicIntakeConfig()), { skipEnsureLogin: true }),
    publicSave: adapt((payload) => mock.intakeService.save(payload), async (payload) => rememberPublicIntakeSession(await http.put('/intake/public/mine', payload, publicIntakeConfig())), { skipEnsureLogin: true }),
    publicSubmit: adapt((payload) => mock.intakeService.submit(payload), async (payload) => rememberPublicIntakeSession(await http.post('/intake/public/submit', payload, publicIntakeConfig())), { skipEnsureLogin: true })
  },

  // 服务方入驻与档案（正式账号链路）
  provider: {
    me: adapt(
      async () => ({ provider: null, user: await mock.userService.getInfo(), verification: 'none' }),
      () => http.get('/provider/me')
    ),
    onboard: adapt(
      async (payload) => ({ created: true, provider: { ...payload, _id: 'mock_provider' }, user: { ...(await mock.userService.getInfo()), account_type: 'provider', role: 'provider', verify_status: 'pending' }, verification: 'pending' }),
      (payload) => http.post('/provider/onboard', payload)
    ),
    update: adapt(
      async (payload) => ({ created: false, provider: { ...payload, _id: 'mock_provider' }, user: { ...(await mock.userService.getInfo()), account_type: 'provider', role: 'provider', verify_status: 'pending' }, verification: 'pending' }),
      (payload) => http.put('/provider/me', payload)
    )
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
    overview: adapt(() => mock.resourceService.overview(), () => http.get('/resource/overview')),
    detail: adapt((id) => mock.resourceService.detail(id), (id) => http.get(`/resource/${id}`)),
    my: adapt((p) => mock.resourceService.my(p), (p) => http.get('/resource/my', p)),
    purchase: adapt((id) => mock.resourceService.purchase(id), (id) => http.post(`/resource/${id}/purchase`)),
    download: adapt(
      (id) => mock.resourceService.download(id),
      (id, options = {}) => http.post(`/resource/${id}/download`, undefined, { header: options?.requestKey ? { 'Idempotency-Key': options.requestKey } : {}, retry: 0 })
    )
  },

  // 公开运营位与分类
  banner: {
    list: adapt(() => mock.bannerService.list(), () => http.get('/banner/list'))
  },
  information: {
    news: adapt(() => [], () => http.get('/information/news'), { skipEnsureLogin: true }),
    activities: adapt(() => [], () => http.get('/information/activities'), { skipEnsureLogin: true })
  },
  category: {
    list: adapt((p) => mock.categoryService.list(p), (p) => http.get('/category/list', p))
  },
  config: {
    public: adapt(() => mock.configService.public(), () => http.get('/config/public')),
    legal: adapt(() => mock.configService.legal(), () => http.get('/config/legal'), { skipEnsureLogin: true })
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

  // 人脉圈 / 社群 / 分会
  network: {
    overview: adapt(() => mock.networkService.overview(), () => http.get('/network/overview')),
    people: adapt((p) => mock.networkService.people(p), (p) => http.get('/network/people', p)),
    person: adapt((id) => mock.networkService.person(id), (id) => http.get(`/network/people/${id}`)),
    groups: adapt((p) => mock.networkService.groups(p), (p) => http.get('/network/groups', p)),
    groupDetail: adapt((id) => mock.networkService.groupDetail(id), (id) => http.get(`/network/groups/${id}`)),
    joinGroup: adapt((id, options) => mock.networkService.joinGroup(id, options), (id, options) => http.post(`/network/groups/${id}/join`, options || {})),
    leaveGroup: adapt((id) => mock.networkService.leaveGroup(id), (id) => http.post(`/network/groups/${id}/leave`)),
    createPost: adapt((id, content, postType) => mock.networkService.createPost(id, content, postType), (id, content, postType) => http.post(`/network/groups/${id}/posts`, { content, post_type: postType })),
    likePost: adapt((groupId, postId) => mock.networkService.likePost(groupId, postId), (groupId, postId) => http.post(`/network/groups/${groupId}/posts/${postId}/like`)),
    comments: adapt((groupId, postId) => mock.networkService.comments(groupId, postId), (groupId, postId) => http.get(`/network/groups/${groupId}/posts/${postId}/comments`)),
    createComment: adapt((groupId, postId, content) => mock.networkService.createComment(groupId, postId, content), (groupId, postId, content) => http.post(`/network/groups/${groupId}/posts/${postId}/comments`, { content })),
    acceptAnswer: adapt((groupId, postId, commentId) => mock.networkService.acceptAnswer(groupId, postId, commentId), (groupId, postId, commentId) => http.put(`/network/groups/${groupId}/posts/${postId}/accepted-answer`, { comment_id: commentId })),
    opportunities: adapt((groupId) => mock.networkService.opportunities(groupId), (groupId) => http.get(`/network/groups/${groupId}/opportunities`)),
    createOpportunity: adapt((groupId, data) => mock.networkService.createOpportunity(groupId, data), (groupId, data) => http.post(`/network/groups/${groupId}/opportunities`, data)),
    updateOpportunity: adapt((groupId, opportunityId, data) => mock.networkService.updateOpportunity(groupId, opportunityId, data), (groupId, opportunityId, data) => http.put(`/network/groups/${groupId}/opportunities/${opportunityId}`, data)),
    friends: adapt(() => mock.networkService.friends(), () => http.get('/network/friends')),
    friendRequests: adapt((p) => mock.networkService.friendRequests(p), (p) => http.get('/network/friend-requests', p)),
    sendFriendRequest: adapt((data) => mock.networkService.sendFriendRequest(data), (data) => http.post('/network/friend-requests', data)),
    updateFriendRequest: adapt((id, status) => mock.networkService.updateFriendRequest(id, status), (id, status) => http.put(`/network/friend-requests/${id}`, { status })),
    referralOptions: adapt((targetUserId) => mock.networkService.referralOptions(targetUserId), (targetUserId) => http.get(`/network/referral-options/${targetUserId}`)),
    referrals: adapt((params) => mock.networkService.referrals(params), (params) => http.get('/network/referrals', params)),
    requestReferral: adapt((data) => mock.networkService.requestReferral(data), (data) => http.post('/network/referrals', data)),
    updateReferral: adapt((id, data) => mock.networkService.updateReferral(id, data), (id, data) => http.put(`/network/referrals/${id}`, data)),
    conversations: adapt(() => mock.networkService.conversations(), () => http.get('/network/conversations')),
    directMessages: adapt((userId) => mock.networkService.directMessages(userId), (userId) => http.get(`/network/direct/${userId}/messages`)),
    // AI 团队回复走真实模型，给模型网关预留足够时间，同时关闭普通请求重试，避免重复发送消息。
    sendDirectMessage: adapt(
      (userId, content, attachments = [], clientMessageId = '') => mock.networkService.sendDirectMessage(userId, content, attachments, clientMessageId),
      (userId, content, attachments = [], clientMessageId = '') => http.post(`/network/direct/${userId}/messages`, {
        content,
        attachments,
        client_message_id: clientMessageId || createClientMessageId('direct')
      }, { timeout: 70000, retry: 0 })
    ),
    sendDirectMessageStream: async (userId, content, attachments = [], callbacks = {}, clientMessageId = '') => {
      const requestPayload = {
        content,
        attachments,
        client_message_id: clientMessageId || createClientMessageId('direct')
      }
      if (useMock()) {
        await delay()
        const result = await mock.networkService.sendDirectMessage(userId, content, attachments, requestPayload.client_message_id)
        if (result?.ai_reply?.content) await streamMockText(result.ai_reply.content, callbacks)
        callbacks.onResult?.(result)
        return result
      }
      await ensureLogin()
      try {
        const streamed = await streamDirectMessage(userId, requestPayload, callbacks)
        if (streamed) return streamed
      } catch (error) {
        if (!error?.streamUnavailable) throw error
        console.info('[network] stream endpoint unavailable, using regular response')
      }
      return http.post(`/network/direct/${userId}/messages`, requestPayload, { timeout: 70000, retry: 0 })
    },
    groupMessages: adapt((id) => mock.networkService.groupMessages(id), (id) => http.get(`/network/groups/${id}/messages`)),
    groupMessagesPoll: adapt((id, after, afterId, timeout) => mock.networkService.groupMessagesPoll(id, after, afterId, timeout), (id, after, afterId, timeout) => http.get(`/network/groups/${id}/messages/poll`, { after, after_id: afterId, timeout })),
    sendGroupMessage: adapt(
      (id, content, clientMessageId = '') => mock.networkService.sendGroupMessage(id, content, clientMessageId),
      (id, content, clientMessageId = '') => http.post(`/network/groups/${id}/messages`, {
        content,
        client_message_id: clientMessageId
      }, { retry: 0 })
    ),
    createGroup: adapt((data) => mock.networkService.createGroup(data), (data) => http.post('/network/groups', data)),
    updateGroup: adapt((id, data) => mock.networkService.updateGroup(id, data), (id, data) => http.put(`/network/groups/${id}`, data)),
    createBranch: adapt((id, data) => mock.networkService.createBranch(id, data), (id, data) => http.post(`/network/groups/${id}/branches`, data)),
    updateBranch: adapt((groupId, branchId, data) => mock.networkService.updateBranch(groupId, branchId, data), (groupId, branchId, data) => http.put(`/network/groups/${groupId}/branches/${branchId}`, data)),
    deleteBranch: adapt((groupId, branchId) => mock.networkService.deleteBranch(groupId, branchId), (groupId, branchId) => http.delete(`/network/groups/${groupId}/branches/${branchId}`)),
    events: adapt((id) => mock.networkService.events(id), (id) => http.get(`/network/groups/${id}/events`)),
    createEvent: adapt((groupId, data) => mock.networkService.createEvent(groupId, data), (groupId, data) => http.post(`/network/groups/${groupId}/events`, data)),
    updateEvent: adapt((groupId, eventId, data) => mock.networkService.updateEvent(groupId, eventId, data), (groupId, eventId, data) => http.put(`/network/groups/${groupId}/events/${eventId}`, data)),
    signupEvent: adapt((groupId, eventId) => mock.networkService.signupEvent(groupId, eventId), (groupId, eventId) => http.post(`/network/groups/${groupId}/events/${eventId}/signup`)),
    cancelEventSignup: adapt((groupId, eventId) => mock.networkService.cancelEventSignup(groupId, eventId), (groupId, eventId) => http.delete(`/network/groups/${groupId}/events/${eventId}/signup`)),
    eventSignups: adapt((groupId, eventId) => mock.networkService.eventSignups(groupId, eventId), (groupId, eventId) => http.get(`/network/groups/${groupId}/events/${eventId}/signups`)),
    updateEventCheckin: adapt((groupId, eventId, userId, checkedIn, note) => mock.networkService.updateEventCheckin(groupId, eventId, userId, checkedIn, note), (groupId, eventId, userId, checkedIn, note) => http.put(`/network/groups/${groupId}/events/${eventId}/checkins/${userId}`, { checked_in: checkedIn, note })),
    updateEventRecap: adapt((groupId, eventId, recap) => mock.networkService.updateEventRecap(groupId, eventId, recap), (groupId, eventId, recap) => http.put(`/network/groups/${groupId}/events/${eventId}/recap`, { recap })),
    manageGroup: adapt((id) => mock.networkService.manageGroup(id), (id) => http.get(`/network/groups/${id}/manage`)),
    applications: adapt((id) => mock.networkService.applications(id), (id) => http.get(`/network/groups/${id}/applications`)),
    reviewApplication: adapt((groupId, memberId, status, reviewNote) => mock.networkService.reviewApplication(groupId, memberId, status, reviewNote), (groupId, memberId, status, reviewNote) => http.put(`/network/groups/${groupId}/applications/${memberId}`, { status, review_note: reviewNote })),
    updateMemberRole: adapt((groupId, userId, role) => mock.networkService.updateMemberRole(groupId, userId, role), (groupId, userId, role) => http.put(`/network/groups/${groupId}/members/${userId}/role`, { role })),
    removeMember: adapt((groupId, userId) => mock.networkService.removeMember(groupId, userId), (groupId, userId) => http.delete(`/network/groups/${groupId}/members/${userId}`)),
    transferOwnership: adapt((groupId, userId) => mock.networkService.transferOwnership(groupId, userId), (groupId, userId) => http.post(`/network/groups/${groupId}/transfer-ownership`, { user_id: userId })),
    dissolveGroup: adapt((groupId, reason) => mock.networkService.dissolveGroup(groupId, reason), (groupId, reason) => http.post(`/network/groups/${groupId}/dissolve`, { reason }))
  },

  // 合作生态目录：公开可浏览，点击招募后再进入登录/发布链路。
  cooperation: {
    catalog: adapt(
      (params) => mock.cooperationService.catalog(params),
      (params) => http.get('/cooperation/catalog', params),
      { skipEnsureLogin: true }
    )
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
    providers: adapt(
      (demand) => normalizeProviderMatches(mock.matchService.matchProviders(demand)),
      (demand) => http.post('/match/providers', demand).then(normalizeProviderMatches)
    )
  },

  // Agent 需求整理
  agent: {
    providerProfile: adapt(() => ({ profile_text: '', preferences_text: '', auto_remember: false, version: 0 }), () => http.get('/agent/provider-profile')),
    saveProviderProfile: adapt(() => { throw new Error('能力记忆需连接真实服务使用') }, (payload) => http.put('/agent/provider-profile', payload)),
    organize: (payload) => runAgentRequest({
      useMock: useMock(),
      delay,
      ensureLogin,
      mockRequest: () => normalizeAgentResult(mock.agentService.organize(payload)),
      // Agent 需要等待上游模型生成结构化结果，允许比普通接口更长的响应时间，
      // 同时关闭自动重试，避免一次输入触发多次模型调用。
      realRequest: () => http.post('/agent/organize', payload, { timeout: 70000, retry: 0 }).then(normalizeAgentResult)
    }),
    chat: (payload) => runAgentRequest({
      useMock: useMock(),
      delay,
      ensureLogin,
      mockRequest: () => normalizeAgentResult(mock.agentService.chat(payload)),
      realRequest: () => http.post('/agent/chat', payload, { timeout: 70000, retry: 0 }).then(normalizeAgentResult)
    }),
    chatStream: (payload, callbacks = {}) => runAgentRequest({
      useMock: useMock(),
      delay,
      ensureLogin,
      mockRequest: () => streamMockAgentChat(payload, callbacks),
      realRequest: async () => {
        try {
          const streamed = await streamAgentChat(payload, callbacks)
          if (streamed) return streamed
        } catch (error) {
          if (!error?.streamUnavailable) throw error
          console.info('[agent] stream endpoint unavailable, using regular response')
        }
        const result = await http.post('/agent/chat', payload, { timeout: 70000, retry: 0 })
        return normalizeAgentResult(result)
      }
    }),
    feedback: adapt(
      (payload) => mock.agentService.feedback(payload),
      (payload) => http.post('/agent/feedback', payload)
    ),
    telemetry: adapt(
      (payload) => mock.agentService.telemetry(payload),
      (payload) => http.post('/agent/events', payload)
    ),
    history: adapt(
      () => ({ conversation: null, messages: [], result: null }),
      (payload = {}) => http.get('/agent/history', payload)
    )
  },

  // 需求对话附件。文件本体先落到后端私有存储，Agent 只接收经过服务端确认的附件引用。
  attachments: {
    upload: adapt(
      (filePath, metadata = {}) => ({
        id: `local_attachment_${Date.now()}`,
        name: metadata.name || '本地附件',
        original_name: metadata.name || '本地附件',
        mime_type: metadata.mime_type || 'application/octet-stream',
        kind: metadata.kind === 'image' ? 'image' : 'file',
        size: Number(metadata.size) || 0,
        url: filePath
      }),
      (filePath, metadata = {}) => http.upload('/attachments/upload', filePath, {
        kind: metadata.kind === 'image' ? 'image' : 'file'
      }, { timeout: 70000 })
    )
  },

  // 智能推荐、价格建议与浏览记录
  smart: {
    trackBrowse: smartEngine.trackBrowse,
    getBrowseHistory: smartEngine.getBrowseHistory,
    clearBrowseHistory: smartEngine.clearBrowseHistory,
    scoreDemandQuality: smartEngine.scoreDemandQuality,
    recommendedDemands: adapt(
      (limit) => smartEngine.getRecommendedDemands(limit, (params) => mock.demandService.list(params)),
      (limit) => http.get('/smart/recommended-demands', { limit })
    ),
    recommendedProducts: adapt(
      (limit) => smartEngine.getRecommendedProducts(limit, (params) => mock.productService.list(params)),
      (limit) => http.get('/smart/recommended-products', { limit })
    ),
    priceSuggestion: adapt(
      (categoryId, quoteType) => smartEngine.getPriceSuggestion(categoryId, quoteType, (params) => mock.demandService.list(params)),
      (categoryId, quoteType) => http.get('/smart/price-suggestion', { category_id: categoryId, quote_type: quoteType })
    )
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
    preferences: adapt(() => mock.notifyService.preferences(), () => http.get('/notify/preferences')),
    updatePreferences: adapt((data) => mock.notifyService.updatePreferences(data), (data) => http.put('/notify/preferences', data)),
    subscriptions: adapt((data) => ({ accepted: data?.length || 0, saved: data?.length || 0 }), (data) => http.post('/notify/subscriptions', { subscriptions: data })),
    poll: adapt((since, timeout) => mock.notifyService.poll(since, timeout), (since, timeout) => http.get('/notify/poll', { since, timeout })),
    read: adapt((id) => mock.notifyService.read(id), (id) => http.put(`/notify/${id}/read`)),
    readAll: adapt(() => mock.notifyService.readAll(), () => http.put('/notify/read-all')),
    unreadCount: adapt(() => mock.notifyService.unreadCount(), () => http.get('/notify/unread-count'))
  },

  // 内容治理与用户安全
  governance: {
    reports: adapt(() => mock.governanceService.reports(), () => http.get('/governance/reports')),
    report: adapt((data) => mock.governanceService.report(data), (data) => http.post('/governance/reports', data)),
    appeals: adapt(() => mock.governanceService.appeals(), () => http.get('/governance/appeals')),
    appeal: adapt((data) => mock.governanceService.appeal(data), (data) => http.post('/governance/appeals', data)),
    blocks: adapt(() => mock.governanceService.blocks(), () => http.get('/governance/blocks')),
    block: adapt((userId, reason) => mock.governanceService.block(userId, reason), (userId, reason) => http.post(`/governance/blocks/${userId}`, { reason })),
    unblock: adapt((userId) => mock.governanceService.unblock(userId), (userId) => http.delete(`/governance/blocks/${userId}`)),
    mute: adapt((data) => mock.governanceService.mute(data), (data) => http.post('/governance/mutes', data)),
    unmute: adapt((targetType, targetId) => mock.governanceService.unmute(targetType, targetId), (targetType, targetId) => http.delete(`/governance/mutes/${targetType}/${targetId}`))
  },

  // 成交
  deal: {
    myDeals: adapt(() => mock.dealService.myDeals(), () => http.get('/deal/my')),
    agenda: adapt(() => mock.dealService.agenda(), () => http.get('/deal/agenda')),
    detail: adapt(
      (id) => mock.dealService.detail ? mock.dealService.detail(id) : null,
      (id) => http.get(`/deal/${id}`)
    ),
    workspace: adapt(
      (id) => mock.dealService.workspace ? mock.dealService.workspace(id) : null,
      (id) => http.get(`/deal/${id}/workspace`)
    ),
    updateSettings: adapt(
      (id, data) => mock.dealService.updateSettings ? mock.dealService.updateSettings(id, data) : null,
      (id, data) => http.put(`/deal/${id}/settings`, data)
    ),
    messages: adapt(
      (id, params) => mock.dealService.messages ? mock.dealService.messages(id, params) : { list: [] },
      (id, params) => http.get(`/deal/${id}/messages`, params)
    ),
    sendMessage: adapt(
      (id, data) => mock.dealService.sendMessage ? mock.dealService.sendMessage(id, data) : null,
      (id, data) => http.post(`/deal/${id}/messages`, data)
    ),
    addMember: adapt(
      (id, data) => mock.dealService.addMember ? mock.dealService.addMember(id, data) : null,
      (id, data) => http.post(`/deal/${id}/members`, data)
    ),
    removeMember: adapt(
      (id, memberId) => mock.dealService.removeMember ? mock.dealService.removeMember(id, memberId) : null,
      (id, memberId) => http.delete(`/deal/${id}/members/${memberId}`)
    ),
    addTask: adapt(
      (id, data) => mock.dealService.addTask ? mock.dealService.addTask(id, data) : null,
      (id, data) => http.post(`/deal/${id}/tasks`, data)
    ),
    updateTask: adapt(
      (id, taskId, data) => mock.dealService.updateTask ? mock.dealService.updateTask(id, taskId, data) : null,
      (id, taskId, data) => http.put(`/deal/${id}/tasks/${taskId}`, data)
    ),
    addFile: adapt(
      (id, data) => mock.dealService.addFile ? mock.dealService.addFile(id, data) : null,
      (id, data) => http.post(`/deal/${id}/files`, data)
    ),
    updateFilePermissions: adapt(
      (id, fileId, data) => mock.dealService.updateFilePermissions ? mock.dealService.updateFilePermissions(id, fileId, data) : null,
      (id, fileId, data) => http.put(`/deal/${id}/files/${fileId}/permissions`, data)
    ),
    addMeeting: adapt(
      (id, data) => mock.dealService.addMeeting ? mock.dealService.addMeeting(id, data) : null,
      (id, data) => http.post(`/deal/${id}/meetings`, data)
    ),
    updateMeeting: adapt(
      (id, meetingId, data) => mock.dealService.updateMeeting ? mock.dealService.updateMeeting(id, meetingId, data) : null,
      (id, meetingId, data) => http.put(`/deal/${id}/meetings/${meetingId}`, data)
    ),
    addDeliverable: adapt(
      (id, data) => mock.dealService.addDeliverable ? mock.dealService.addDeliverable(id, data) : null,
      (id, data) => http.post(`/deal/${id}/deliverables`, data)
    ),
    updateDeliverable: adapt(
      (id, deliverableId, data) => mock.dealService.updateDeliverable ? mock.dealService.updateDeliverable(id, deliverableId, data) : null,
      (id, deliverableId, data) => http.put(`/deal/${id}/deliverables/${deliverableId}`, data)
    ),
    addActivity: adapt(
      (id, data) => mock.dealService.addActivity ? mock.dealService.addActivity(id, data) : null,
      (id, data) => http.post(`/deal/${id}/activities`, data)
    ),
    addMilestone: adapt(
      (id, data) => mock.dealService.addMilestone ? mock.dealService.addMilestone(id, data) : null,
      (id, data) => http.post(`/deal/${id}/milestones`, data)
    ),
    updateMilestone: adapt(
      (id, milestoneId, status) => mock.dealService.updateMilestone ? mock.dealService.updateMilestone(id, milestoneId, status) : null,
      (id, milestoneId, status) => http.put(`/deal/${id}/milestones/${milestoneId}`, { status })
    ),
    updateStatus: adapt((id, s) => mock.dealService.updateStatus(id, s), (id, s) => http.put(`/deal/${id}/status`, { status: s })),
    addReview: adapt((id, d) => mock.dealService.addReview(id, d), (id, d) => http.post(`/deal/${id}/review`, d))
  },

  // 搜索
  search: {
    hotKeywords: adapt(() => mock.searchService.hotKeywords(), () => http.get('/search/hot')),
    history: adapt(() => mock.searchService.history(), () => http.get('/search/history')),
    addHistory: adapt((keyword) => mock.searchService.addHistory(keyword), (keyword) => http.post('/search/history', { keyword })),
    clearHistory: adapt(() => mock.searchService.clearHistory(), () => http.delete('/search/history')),
    search: adapt((keyword) => mock.searchService.search(keyword), (keyword) => http.get('/search', { keyword })),
    saved: adapt(() => mock.searchService.saved(), () => http.get('/search/saved')),
    save: adapt((data) => mock.searchService.save(data), (data) => http.post('/search/saved', data)),
    checkSaved: adapt((id) => mock.searchService.checkSaved(id), (id) => http.post(`/search/saved/${id}/check`)),
    removeSaved: adapt((id) => mock.searchService.removeSaved(id), (id) => http.delete(`/search/saved/${id}`))
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
    send: adapt((content, history, attachments = [], clientMessageId = '') => mock.chatService.send(content, history, attachments), (content, history, attachments = [], clientMessageId = '') => http.post('/chat/send', {
      content,
      history,
      attachments,
      client_message_id: clientMessageId || createClientMessageId('chat')
    })),
    sendStream: async (content, history, attachments = [], callbacks = {}, clientMessageId = '') => {
      const requestPayload = {
        content,
        history,
        attachments,
        client_message_id: clientMessageId || createClientMessageId('chat')
      }
      if (useMock()) {
        await delay()
        const result = await mock.chatService.send(content, history, attachments)
        await streamMockText(result?.reply, callbacks)
        callbacks.onResult?.(result)
        return result
      }
      await ensureLogin()
      try {
        const streamed = await streamCustomerServiceChat(requestPayload, callbacks)
        if (streamed) return streamed
      } catch (error) {
        if (!error?.streamUnavailable) throw error
        console.info('[chat] stream endpoint unavailable, using regular response')
      }
      return http.post('/chat/send', requestPayload, { timeout: 70000, retry: 0 })
    },
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
  },

  // 管理后台（需要 admin JWT）
  admin: {
    access: adapt(() => mock.adminService.access(), () => http.get('/admin/access')),
    metrics: adapt((days) => mock.adminService.metrics(days), (days) => http.get('/admin/metrics', { days })),
    intakes: {
      stats: adapt(() => mock.adminService.intakes.stats(), () => http.get('/admin/intakes/stats')),
      list: adapt((params) => mock.adminService.intakes.list(params), (params) => http.get('/admin/intakes', params)),
      detail: adapt((id) => mock.adminService.intakes.detail(id), (id) => http.get(`/admin/intakes/${id}`)),
      review: adapt((id, status, note) => mock.adminService.intakes.review(id, status, note), (id, status, note) => http.put(`/admin/intakes/${id}/review`, { status, note }))
    },
    demands: {
      list: adapt((p) => mock.adminService.demands.list(p), (p) => http.get('/admin/demands', p)),
      updateStatus: adapt((id, status) => mock.adminService.demands.updateStatus(id, status), (id, status) => http.put(`/admin/demands/${id}/status`, { status })),
      updateFlags: adapt((id, flags) => mock.adminService.demands.updateFlags(id, flags), (id, flags) => http.put(`/admin/demands/${id}/flags`, flags)),
      delete: adapt((id) => mock.adminService.demands.delete(id), (id) => http.delete(`/admin/demands/${id}`))
    },
    leads: {
      list: adapt((p) => mock.adminService.leads.list(p), (p) => http.get('/admin/leads', p)),
      updateStatus: adapt((id, status) => mock.adminService.leads.updateStatus(id, status), (id, status) => http.put(`/admin/leads/${id}/status`, { status })),
      updateNote: adapt((id, admin_note) => mock.adminService.leads.updateNote(id, admin_note), (id, admin_note) => http.put(`/admin/leads/${id}/note`, { admin_note }))
    },
    orders: {
      list: adapt((p) => mock.adminService.orders.list(p), (p) => http.get('/admin/orders', p)),
      updateStatus: adapt((id, status) => mock.adminService.orders.updateStatus(id, status), (id, status) => http.put(`/admin/orders/${id}/status`, { status })),
      updateRemark: adapt((id, remark) => mock.adminService.orders.updateRemark(id, remark), (id, remark) => http.put(`/admin/orders/${id}/remark`, { remark }))
    },
    users: {
      list: adapt((p) => mock.adminService.users.list(p), (p) => http.get('/admin/users', p)),
      updateStatus: adapt((id, status) => mock.adminService.users.updateStatus(id, status), (id, status) => http.put(`/admin/users/${id}/status`, { status })),
      updateRole: adapt((id, role) => mock.adminService.users.updateRole(id, role), (id, role) => http.put(`/admin/users/${id}/role`, { role })),
      updateAdminRole: adapt((id, role) => ({ user_id: id, role }), (id, role) => http.put(`/admin/users/${id}/admin-role`, { role }))
    },
    providers: {
      list: adapt((p) => mock.adminService.providers.list(p), (p) => http.get('/admin/providers', p)),
      review: adapt((id, status, note) => mock.adminService.providers.review(id, status, note), (id, status, note) => http.put(`/admin/providers/${id}/verification`, { status, note }))
    },
    products: {
      list: adapt((p) => mock.adminService.products.list(p), (p) => http.get('/admin/products', p)),
      create: adapt((d) => mock.adminService.products.create(d), (d) => http.post('/admin/products', d)),
      update: adapt((id, d) => mock.adminService.products.update(id, d), (id, d) => http.put(`/admin/products/${id}`, d)),
      delete: adapt((id) => mock.adminService.products.delete(id), (id) => http.delete(`/admin/products/${id}`))
    },
    resources: {
      list: adapt((p) => mock.adminService.resources.list(p), (p) => http.get('/admin/resources', p)),
      create: adapt((d) => mock.adminService.resources.create(d), (d) => http.post('/admin/resources', d)),
      update: adapt((id, d) => mock.adminService.resources.update(id, d), (id, d) => http.put(`/admin/resources/${id}`, d)),
      delete: adapt((id) => mock.adminService.resources.delete(id), (id) => http.delete(`/admin/resources/${id}`))
    },
    categories: {
      list: adapt((p) => mock.adminService.categories.list(p), (p) => http.get('/admin/categories', p)),
      create: adapt((d) => mock.adminService.categories.create(d), (d) => http.post('/admin/categories', d)),
      update: adapt((id, d) => mock.adminService.categories.update(id, d), (id, d) => http.put(`/admin/categories/${id}`, d)),
      delete: adapt((id) => mock.adminService.categories.delete(id), (id) => http.delete(`/admin/categories/${id}`))
    },
    banners: {
      list: adapt(() => mock.adminService.banners.list(), () => http.get('/admin/banners')),
      create: adapt((d) => mock.adminService.banners.create(d), (d) => http.post('/admin/banners', d)),
      update: adapt((id, d) => mock.adminService.banners.update(id, d), (id, d) => http.put(`/admin/banners/${id}`, d)),
      delete: adapt((id) => mock.adminService.banners.delete(id), (id) => http.delete(`/admin/banners/${id}`))
    },
    system: {
      get: adapt(() => mock.adminService.system.get(), () => http.get('/admin/system-config')),
      update: adapt((d) => mock.adminService.system.update(d), (d) => http.put('/admin/system-config', d))
    },
    reports: {
      list: adapt((p) => mock.adminService.reports.list(p), (p) => http.get('/admin/reports', p)),
      update: adapt((id, data) => mock.adminService.reports.update(id, data), (id, data) => http.put(`/admin/reports/${id}`, data))
    },
    appeals: {
      list: adapt((p) => mock.adminService.appeals.list(p), (p) => http.get('/admin/appeals', p)),
      update: adapt((id, data) => mock.adminService.appeals.update(id, data), (id, data) => http.put(`/admin/appeals/${id}`, data))
    },
    auditLogs: {
      list: adapt((p) => mock.adminService.auditLogs.list(p), (p) => http.get('/admin/audit-logs', p))
    },
    production: {
      readiness: adapt(() => mock.adminService.production.readiness(), () => http.get('/admin/production-readiness'))
    }
  }
}

// 供小程序端流式回归测试直接验证 chunk/success 双回调语义；不作为业务 API 暴露给页面。
export { streamEventsByUniRequest }

export default bridge
