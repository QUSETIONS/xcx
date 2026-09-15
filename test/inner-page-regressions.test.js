import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const appRoot = process.cwd()
const read = (...parts) => fs.readFileSync(path.join(appRoot, ...parts), 'utf8')

describe('内页真实使用回归', () => {
  it('首页开屏只在当前会话首次进入播放，返回首页不重复出现', () => {
    const home = read('src', 'pages', 'index', 'index.vue')
    expect(home).toMatch(/<OpeningRitual v-if="showOpening" @complete="finishOpening" \/>/)
    expect(home).toContain('const showOpening = ref(!readOpeningSeen())')
    expect(home).toContain("const OPENING_SESSION_KEY = 'mediamatch:opening-seen:v2'")
    expect(home).toContain('window.sessionStorage')
    expect(home).not.toContain('__mediamatchOpeningSeen')
    expect(home).not.toContain("import { onShow } from '@dcloudio/uni-app'")
    expect(home).not.toContain('if (!showOpening.value) showOpening.value = true')
  })

  it('首页首次加载显示独立加载态，不用开屏反复遮挡页面', () => {
    const home = read('src', 'pages', 'index', 'index.vue')
    expect(home).toContain('class="home-loading-screen"')
    expect(home).toContain('const homeFirstLoad = ref(true)')
    expect(home).toContain('const showHomeLoader = computed(')
    expect(home).toContain('function blockHomeLoadingScroll(event)')
    expect(home).toContain('@keyframes home-loading-orbit')
  })

  it('开屏是轻量过渡，不得阻塞首屏入口超过约一秒', () => {
    const opening = read('src', 'components', 'OpeningRitual.vue')
    expect(opening).toContain('drawing: 140')
    expect(opening).toContain('locked: 520')
    expect(opening).toContain('complete: 980')
    expect(opening).toContain('exit: 220')
    expect(opening).toContain('later(complete, OPENING_TIMING.complete)')
    expect(opening).not.toContain('later(complete, 4520)')
  })

  it('开屏期间锁住页面滚动，不能被手势或滚轮拖走', () => {
    const opening = read('src', 'components', 'OpeningRitual.vue')
    expect(opening).toContain('lockPageScroll()')
    expect(opening).toContain("element.style.overflow = 'hidden'")
    expect(opening).toContain("element.style.overscrollBehavior = 'none'")
    expect(opening).toContain('touch-action: none;')
    expect(opening).toContain('overscroll-behavior: none;')
    expect(opening).toContain('@touchmove.stop.prevent="blockScroll"')
    expect(opening).toContain('@wheel.stop.prevent="blockScroll"')
  })

  it('需求详情的正文和时间应在白色卡片上保持可读', () => {
    const detail = read('src', 'pages', 'demand', 'detail.vue')
    expect(detail).toMatch(/\.desc-text\s*\{[^}]*color:\s*rgba\(0,0,0,0\.68\)/s)
    expect(detail).toMatch(/\.time-value\s*\{[^}]*color:\s*rgba\(0,0,0,0\.68\)/s)
    expect(detail).not.toMatch(/\.desc-text\s*\{[^}]*rgba\(255,255,255/s)
    expect(detail).not.toMatch(/\.time-value\s*\{[^}]*rgba\(255,255,255/s)
  })

  it('私聊页只在 onLoad 后启动对应接口，避免 H5 生命周期竞态', () => {
    const chat = read('src', 'pages', 'chat', 'index.vue')
    expect(chat).not.toContain('onMounted')
    expect(chat).toMatch(/onLoad\(\s*(?:async\s*)?\(query\)\s*=>\s*\{[\s\S]*if \(directMode\.value\)[\s\S]*else \{\s*reload\(\)\s*\}/)
    expect(chat).toContain("directNeedsConnection.value = Number(error?.code || error?.data?.code) === 403")
    expect(chat).toContain('还没有建立联系')
  })

  it('私聊输入框回车不会把输入事件误当成消息幂等 ID', () => {
    const chat = read('src', 'pages', 'chat', 'index.vue')
    expect(chat).toContain('@confirm="sendFromInput"')
    expect(chat).toMatch(/function sendFromInput\(\)\s*\{\s*send\(\)\s*\}/)
  })

  it('关注按钮保持白底蓝字，客服和私聊发送先回显本地消息', () => {
    const network = read('src', 'pages', 'network', 'index.vue')
    const discover = read('src', 'pages', 'network', 'discover.vue')
    const profile = read('src', 'pages', 'profile', 'index.vue')
    const chat = read('src', 'pages', 'chat', 'index.vue')
    expect(network).toMatch(/\.follow-button\s*\{[^}]*color:\s*#4964C8;[^}]*background:\s*#FFF;/s)
    expect(discover).toMatch(/\.person-action\s*\{[^}]*color:\s*#4964c8;[^}]*background:\s*#fff;/s)
    expect(profile).toMatch(/\.follow-action\s*\{[^}]*color:\s*#4964c8;[^}]*background:\s*#fff;/s)
    expect(chat).toContain('createOptimisticMessage')
    expect(chat).toContain('messages.value = [...messages.value, optimisticMessage]')
    expect(chat).toContain('发送中…')
    expect(chat).toContain('发送失败，点击重试')
    expect(chat).toContain('.msg-item.user .bubble { order: 0; }')
    expect(chat).not.toContain('.msg-item.user .bubble { order: 1; }')
    expect(chat).toContain('{{ avatarLabel(msg) }}')
    expect(chat).toContain('function avatarLabel(message = {})')
  })

  it('需求助手和群聊保持对方左、自己右的消息布局', () => {
    const agent = read('src', 'pages', 'agent', 'index.vue')
    const group = read('src', 'pages', 'network', 'group-chat.vue')
    expect(agent).toContain('<view class="message-avatar" v-if="message.role === \'assistant\'">栖</view>')
    expect(agent).toContain('<view class="message-avatar user-avatar" v-if="message.role === \'user\'">我</view>')
    expect(agent).toContain('.message-row.user .message-avatar { margin-right: 0; margin-left: 12rpx; background: #646A73; }')
    expect(group).toContain('v-if="!message.is_mine" class="avatar"')
    expect(group).toContain('v-if="message.is_mine" class="avatar mine-avatar"')
    expect(group).toContain('.message-row.mine { justify-content: flex-end; }')
  })

  it('需求助手流式片段通过响应式列表更新，不能只修改已插入的普通对象', () => {
    const agent = read('src', 'pages', 'agent', 'index.vue')
    expect(agent).toContain('function patchMessage(id, patch)')
    expect(agent).toMatch(/messages\.value\s*=\s*messages\.value\.map\(\(message\)\s*=>/)
    expect(agent).toContain('patchMessage(assistantMessageId, { content: streamedContent, streaming: true })')
    expect(agent).toContain('patchMessage(messageId, { content, streaming: true })')
    expect(agent).not.toContain('assistantMessage.content += delta')
  })

  it('资料库目录按剩余空间滚动，不使用固定高度挤压不同屏幕', () => {
    const resource = read('src', 'pages', 'resource', 'list.vue')
    expect(resource).toMatch(/\.page\s*\{[^}]*display:\s*flex;[^}]*height:\s*100vh;/s)
    expect(resource).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(resource).not.toContain('height: calc(100vh - 540rpx)')
  })

  it('消息时间线按剩余空间滚动，待办较多时不把底部内容推出视口', () => {
    const message = read('src', 'pages', 'message', 'index.vue')
    expect(message).toMatch(/\.message-content\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*0;[^}]*flex:\s*1;[^}]*flex-direction:\s*column;/s)
    expect(message).toMatch(/\.list-scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
    expect(message).toMatch(/\.list-scroll\.with-actions\s*\{[^}]*min-height:\s*0;[^}]*height:\s*auto;/s)
  })

  it('项目讨论失败重试复用同一幂等键并保留草稿', () => {
    const workspace = read('src', 'pages', 'deals', 'workspace.vue')
    expect(workspace).toContain('const pendingMessageId = ref(\'\')')
    expect(workspace).toContain('function workspaceMessageId(content, attachments)')
    expect(workspace).toContain('messageSendFailed.value = true')
    expect(workspace).toContain('草稿已保留')
    expect(workspace).not.toContain('client_message_id: `workspace_${Date.now()}`')
  })

  it('关系页的未读消息摘要进入消息中心，首页装饰层不允许横向溢出', () => {
    const friends = read('src', 'pages', 'network', 'friends.vue')
    const network = read('src', 'pages', 'network', 'index.vue')
    expect(friends).toContain('@tap="goMessage"')
    expect(friends).toContain("function goMessage() { uni.navigateTo({ url: '/pages/message/index' }) }")
    expect(network).toMatch(/\.hero-card\s*\{[^}]*overflow:\s*hidden;/s)
  })

  it('匹配团队的申请联系不会冒泡到结果卡片，也不会误报负反馈', () => {
    const agent = read('src', 'pages', 'agent', 'index.vue')
    expect(agent).toContain('@tap.stop="handleContactTap($event, team)"')
    expect(agent).toContain("if (action === 'shortlisted' || action === 'not_relevant')")
    expect(agent).not.toContain("if (action !== 'viewed') uni.showToast({ title: action === 'shortlisted' ? '已记住这类结果' : '已减少类似结果'")
  })

  it('需求表单输入框使用统一行高，长文本不会被输入框裁切', () => {
    const publish = read('src', 'pages', 'demand', 'publish.vue')
    expect(publish).toMatch(/\.form-input\s*\{[^}]*height:\s*80rpx;[^}]*padding:\s*14rpx 2rpx 12rpx;[^}]*line-height:\s*1\.45;/s)
    expect(publish).toMatch(/\.budget-input\s*\{[^}]*padding:\s*12rpx;[^}]*line-height:\s*1\.45;/s)
  })

  it('服务方卡片和认识新朋友入口必须进入真实页面', () => {
    const demand = read('src', 'pages', 'demand', 'detail.vue')
    const friends = read('src', 'pages', 'network', 'friends.vue')
    const pages = read('src', 'pages.json')
    expect(demand).toContain('@tap="openProvider(item)"')
    expect(demand).toContain('contact_user_id')
    expect(friends).toContain("/pages/network/discover")
    expect(pages).toContain('pages/network/discover')
    expect(pages).toContain('pages/network/add-friend')
  })

  it('认识新朋友页的卡片操作必须绑定到可达的资料、聊天和加好友页面', () => {
    const discover = read('src', 'pages', 'network', 'discover.vue')
    expect(discover).toContain('@tap="openProfile(person)"')
    expect(discover).toContain('@tap.stop="handleAction(person)"')
    expect(discover).toContain('/pages/profile/index')
    expect(discover).toContain('/pages/chat/index')
    expect(discover).toContain('/pages/network/add-friend')
  })

  it('认识新朋友分页不会重复追加成员，也不会让旧请求覆盖新结果', () => {
    const discover = read('src', 'pages', 'network', 'discover.vue')
    expect(discover).toContain('const reloadSequence = ref(0)')
    expect(discover).toContain('const requestId = ++reloadSequence.value')
    expect(discover).toContain('if (requestId !== reloadSequence.value) return')
    expect(discover).toContain('const existingIds = new Set(people.value.map((item) => String(item?.id || item?._id || \'\')).filter(Boolean))')
    expect(discover).toContain('const uniqueNextList = nextList.filter')
    expect(discover).toContain('people.value = [...people.value, ...uniqueNextList]')
  })

  it('从指定分会发起加入时必须保留用户选中的分会', () => {
    const detail = read('src', 'pages', 'network', 'detail.vue')
    expect(detail).toMatch(/function openJoinSheet\(branchId = ["']{2}\)/)
    expect(detail).toContain('openJoinSheet(branch.id)')
    expect(detail).toMatch(/openJoinSheet\(selectedBranch\.value\?\.id \|\| ["']{2}\)/)
    expect(detail).toContain('!branchIds.includes(selectedBranchId.value)')
  })

  it('H5 资料下载必须带当前会话，不能用丢失 Authorization 的新窗口', () => {
    const resource = read('src', 'pages', 'resource', 'detail.vue')
    expect(resource).toContain('getStoredSession')
    expect(resource).toContain('function restoreStoredSession()')
    expect(resource).toContain('if (restoreStoredSession()) return true')
    expect(resource).toContain('await downloadH5File(url)')
    expect(resource).toContain('Authorization: `Bearer ${token}`')
    expect(resource).toContain('userStore.refreshSession()')
    expect(resource).not.toContain('window.open(url, \'_blank\')')
  })

  it('游客浏览需求大厅不会被个人筛选接口的 401 重定向', () => {
    const demandList = read('src', 'pages', 'demand', 'list.vue')
    expect(demandList).toContain('hasStoredAccessToken')
    expect(demandList).toContain("登录后可保存和管理筛选")
    expect(demandList).toMatch(/async function loadSavedSearches\(\)\s*\{\s*if \(!hasStoredAccessToken\(\)\)/)
  })

  it('公开主页和社区首页不在游客状态调用受保护接口', () => {
    const profile = read('src', 'pages', 'profile', 'index.vue')
    const community = read('src', 'pages', 'community', 'index.vue')
    const post = read('src', 'pages', 'community', 'post.vue')
    expect(profile).toContain('hasStoredAccessToken() ? bridge.network.person(id)')
    expect(profile).toContain("requirePageLogin(userStore, '登录后才能关注成员')")
    expect(profile).toContain("requirePageLogin(userStore, '登录后才能添加好友')")
    expect(community).toMatch(/async function loadUnreadNotifications\(\)\s*\{\s*if \(!hasStoredAccessToken\(\)\) return/)
    expect(community).toContain("requirePageLogin(userStore, '登录后才能点赞动态')")
    expect(post).toContain("requirePageLogin(userStore, '登录后才能发布动态')")
  })

  it('游客打开需求和商城详情不会因收藏检查 401 进入错误态', () => {
    const demand = read('src', 'pages', 'demand', 'detail.vue')
    const mall = read('src', 'pages', 'mall', 'detail.vue')
    expect(demand).toContain("import { hasStoredAccessToken } from '@/utils/session'")
    expect(demand).toMatch(/const currentUserId = getCurrentUserId\(\)[\s\S]*?const favoriteRequest = currentUserId \|\| hasStoredAccessToken\(\)[\s\S]*?Promise\.resolve\(false\)/)
    expect(demand).toContain("bridge.favorite.check({ userId: currentUserId, targetType: 'demand', targetId: id }).catch(() => false)")
    expect(demand).toContain('if (!(await ensureInteractiveSession())) return')
    expect(mall).toContain("import { hasStoredAccessToken } from '@/utils/session'")
    expect(mall).toContain('isFavorited.value = hasInteractiveSession()')
    expect(mall).toContain("bridge.favorite.check({ userId: currentUserId(), targetType: 'product', targetId: id }).catch(() => false)")
    expect(mall).toContain("请先登录后再收藏")
  })

  it('受保护的活动、积分、会员和看板页面先拦截游客，避免并发请求 401', () => {
    const protectedPages = [
      ['campaign', '登录后才能查看活动中心'],
      ['points', '登录后才能查看积分'],
      ['member', '登录后才能查看会员权益'],
      ['dashboard', '登录后才能查看数据看板']
    ]
    const guard = read('src', 'utils', 'require-login.js')
    expect(guard).toContain('hasStoredAccessToken')
    expect(guard).toContain("/pages/user/login")
    for (const [page, message] of protectedPages) {
      const source = read('src', 'pages', page, 'index.vue')
      expect(source).toContain('requirePageLogin')
      expect(source).toContain(`requirePageLogin(userStore, '${message}')`)
      expect(source).toContain('if (!data) return')
    }
  })

  it('受保护的业务内页统一先校验登录，避免游客看到空白页或触发一串 401', () => {
    const protectedPages = [
      [['cart', 'index.vue'], '登录后才能查看购物车'],
      [['coupon', 'index.vue'], '登录后才能查看优惠券'],
      [['message', 'index.vue'], '登录后才能查看消息'],
      [['order', 'index.vue'], '登录后才能查看订单'],
      [['follow', 'index.vue'], '登录后才能查看关注'],
      [['network', 'index.vue'], '登录后才能查看人脉圈'],
      [['network', 'discover.vue'], '登录后才能认识新朋友'],
      [['network', 'friends.vue'], '登录后才能查看好友关系'],
      [['network', 'detail.vue'], '登录后才能查看社群详情'],
      [['network', 'group-chat.vue'], '登录后才能进入群聊'],
      [['chat', 'index.vue'], '登录后才能开始对话'],
      [['verify', 'index.vue'], '登录后才能进行企业认证'],
      [['settings', 'index.vue'], '登录后才能打开设置'],
      [['proposal', 'inbox.vue'], '登录后才能查看收到的项目']
    ]
    for (const [parts, message] of protectedPages) {
      const source = read('src', 'pages', ...parts)
      expect(source).toContain('requirePageLogin')
      expect(source).toContain('requirePageLogin(userStore')
      expect(source).toContain(message)
    }

    for (const [parts, message] of [
      [['user', 'my-orders.vue'], '登录后才能查看订单'],
      [['user', 'my-leads.vue'], '登录后才能查看我的项目'],
      [['user', 'my-favorites.vue'], '登录后才能查看我的收藏']
    ]) {
      const source = read('src', 'pages', ...parts)
      expect(source).toContain('requirePageLogin')
      expect(source).toContain('requirePageLogin(userStore')
      expect(source).toContain(message)
    }
  })

  it('首页不再自行调用 Agent，真实对话页在游客状态先引导登录', () => {
    const agent = read('src', 'pages', 'agent', 'index.vue')
    expect(agent).toContain('请先登录后继续对话')
    expect(agent).toMatch(/if \(!userStore\.isLoggedIn && !hasStoredAccessToken\(\)\)[\s\S]*?return\n\s*\}/)
  })

  it('登录模式切换会清理找回密码的残留字段', () => {
    const login = read('src', 'pages', 'user', 'login.vue')
    expect(login).toContain("const previous = mode.value")
    expect(login).toContain("if (previous === 'reset') form.value.phone = ''")
    expect(login).toContain("form.value.confirmPassword = ''")
  })

  it('资料下载在游客状态先说明登录要求', () => {
    const resource = read('src', 'pages', 'resource', 'detail.vue')
    expect(resource).toContain('hasStoredAccessToken')
    expect(resource).toContain('登录后下载')
    expect(resource).toContain('登录后即可下载这份资料，并保留下载记录。')
  })
})
