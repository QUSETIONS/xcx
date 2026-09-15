/**
 * 写路径覆盖 —— 补齐 create / update / 状态变更 / 创建评论等"变更"方法
 *
 * 背景：读路径与读流程覆盖扎实，但 service.js 的写/变更方法（创建需求、更新、
 * 成交状态变更、发帖/评论/点赞、趋势计算）此前多数未测，functions 覆盖偏低。
 * 本套件专门覆盖这些变更路径与边界（不存在 id 返回 null/false 等）。
 *
 * 注意：模块级数组（demandData/dealData/postsData…）在测试文件内共享、跨用例累积，
 * 故更新测试一律先 create 自己的实例再 update，避免污染种子数据。
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { demandService, dealService, communityService, dashboardService, reviewService, followService } from '@/mock/service'

beforeEach(() => { globalThis.__resetStore() })

describe('写路径：demandService', () => {
  it('create 生成 pending 需求、计数归零、入库可被 detail 查到', () => {
    const item = demandService.create({ title: '测试需求', created_by: 'demo_user_001', category_id: 'cat_01' })
    expect(item._id).toBeTruthy()
    expect(item.status).toBe('pending')
    expect(item.view_count).toBe(0)
    expect(item.lead_count).toBe(0)
    expect(item.favorite_count).toBe(0)
    expect(item.publish_time).toBeTruthy()
    expect(demandService.detail(item._id)).toBe(item) // 已 unshift 入库
  })

  it('update 合并字段并重置为 pending；不存在返回 null', () => {
    const item = demandService.create({ title: '原标题', budget_min: 10000 })
    const updated = demandService.update(item._id, { title: '新标题', budget_max: 20000 })
    expect(updated.title).toBe('新标题')
    expect(updated.budget_min).toBe(10000)   // 未传字段保留
    expect(updated.budget_max).toBe(20000)   // 新字段写入
    expect(updated.status).toBe('pending')
    expect(updated.updated_at).toBeTruthy()
    expect(demandService.update('demand_not_exist', {})).toBeNull()
  })
})

describe('写路径：dealService', () => {
  it('updateStatus 更新成交状态；不存在返回 null', () => {
    const deal = dealService.myDeals().list[0]
    expect(deal, '种子应有 demo_user_001 的成交').toBeTruthy()
    const updated = dealService.updateStatus(deal._id, 'completed')
    expect(updated.status).toBe('completed')
    expect(dealService.updateStatus('deal_not_exist', 'x')).toBeNull()
  })

  it('addReview 标记已评、落库评价、返回 success；不存在返回 false', () => {
    const deal = dealService.myDeals().list[0]
    const before = reviewService.list({ target_id: deal.demand_id, pageSize: 100 }).list.length
    const res = dealService.addReview(deal._id, { rating: 5, content: '很满意' })
    expect(res).toEqual({ success: true })
    expect(deal.has_review).toBe(true)
    expect(deal.can_review).toBe(false)
    const after = reviewService.list({ target_id: deal.demand_id, pageSize: 100 }).list.length
    expect(after, '评价应入库').toBe(before + 1)
    expect(dealService.addReview('deal_not_exist', {})).toEqual({ success: false })
  })

  it('项目讨论使用同一幂等键重试时只保留一条消息', () => {
    const deal = dealService.myDeals().list.find((item) => item.status === 'in_progress')
    const first = dealService.sendMessage(deal._id, { content: '项目讨论重试', client_message_id: 'workspace_retry_1' })
    const replay = dealService.sendMessage(deal._id, { content: '项目讨论重试', client_message_id: 'workspace_retry_1' })
    expect(first.message.id).toBe(replay.message.id)
    expect(replay.idempotent).toBe(true)
    expect(dealService.messages(deal._id).list.filter((item) => item.client_message_id === 'workspace_retry_1')).toHaveLength(1)
  })
})

describe('写路径：communityService', () => {
  it('createPost 入库、作者为当前用户、带话题、可被 postDetail 查到', () => {
    const topicId = communityService.topics()[0].id
    const post = communityService.createPost({ content: '测试帖子', topic_id: topicId, images: ['x.png'] })
    expect(post._id).toBeTruthy()
    expect(post.content).toBe('测试帖子')
    expect(post.author.id).toBe('demo_user_001')
    expect(post.images).toEqual(['x.png'])
    expect(post.like_count).toBe(0)
    expect(post.topic.id).toBe(topicId)
    expect(communityService.postDetail(post._id)).toBe(post)
  })

  it('createComment 入库并使帖子评论数 +1', () => {
    const post = communityService.createPost({ content: '待评论' })
    const before = post.comment_count
    const c = communityService.createComment(post._id, '说得好')
    expect(c.post_id).toBe(post._id)
    expect(c.content).toBe('说得好')
    expect(post.comment_count).toBe(before + 1)
    expect(communityService.comments(post._id).some(x => x._id === c._id)).toBe(true)
  })

  it('like 点赞使 like_count+1；不存在返回 liked:false', () => {
    const post = communityService.createPost({ content: '求赞' })
    const before = post.like_count
    const r = communityService.like(post._id)
    expect(r.liked).toBe(true)
    expect(r.count).toBe(before + 1)
    expect(communityService.like('post_not_exist')).toEqual({ liked: false, count: 0 })
  })
})

describe('读路径补：dashboardService.trendChange（7/30 天分支）', () => {
  it('7 天分支返回百分比结构', () => {
    const r = dashboardService.trendChange(7)
    expect(Object.keys(r).sort()).toEqual(['deals', 'leads', 'views'])
    expect(r.views.endsWith('%')).toBe(true)
    expect(r.leads.startsWith('+') && r.leads.endsWith('%')).toBe(true)
    expect(r.deals.startsWith('+') && r.deals.endsWith('%')).toBe(true)
  })

  it('30 天走 else 分支同样返回百分比', () => {
    const r = dashboardService.trendChange(30)
    expect(r.views.endsWith('%')).toBe(true)
  })
})

describe('覆盖剩余分支：posts 排序/过滤、userCreditScore、follow.toggle', () => {
  it('communityService.posts 支持 hot/latest 排序与 topic/hot 过滤', () => {
    const latest = communityService.posts({ pageSize: 50 })
    expect(latest.list.length).toBeGreaterThan(0)
    const hot = communityService.posts({ sort: 'hot', pageSize: 50 })
    expect(hot.total, '同数据集仅排序不同').toBe(latest.total) // 覆盖 sort==='hot' 分支
    const firstTopic = latest.list[0].topic?.id
    if (firstTopic) {
      const byTopic = communityService.posts({ topic_id: firstTopic, pageSize: 50 })
      expect(byTopic.list.every(p => p.topic?.id === firstTopic)).toBe(true) // 覆盖 topic 过滤
    }
    const onlyHot = communityService.posts({ hot: true, pageSize: 50 })
    expect(onlyHot.list.every(p => p.is_hot)).toBe(true) // 覆盖 hot 过滤（空也满足 every）
  })

  it('reviewService.userCreditScore 返回结构', () => {
    const c = reviewService.userCreditScore()
    expect(c.score).toBeGreaterThanOrEqual(75)
    expect(typeof c.level).toBe('string')
    expect(typeof c.deals).toBe('number')
    expect(typeof c.reviews).toBe('number')
  })

  it('followService.toggle 取关/关注/未知用户三分支', () => {
    const before = followService.count()
    const existing = followService.list()[0]
    expect(existing, '种子应有关注数据').toBeTruthy()
    // 取关已关注
    expect(followService.toggle(existing.user.id)).toEqual({ followed: false })
    expect(followService.count()).toBe(before - 1)
    // 再关注回去（该用户在 usersData 中）→ 覆盖关注分支
    expect(followService.toggle(existing.user.id)).toEqual({ followed: true })
    expect(followService.count()).toBe(before)
    // 未知用户
    expect(followService.toggle('user_not_exist')).toEqual({ followed: false })
  })
})
