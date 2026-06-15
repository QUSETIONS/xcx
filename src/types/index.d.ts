/**
 * 全局类型声明
 * 为 mock 服务、智能引擎、工具函数提供 TypeScript 类型支持
 * 使 .js 业务代码也能获得类型提示与检查
 */

// ============ 领域模型 ============

export interface Demand {
  _id: string
  title: string
  company_name: string
  category_id: string
  category_name: string
  region: string
  quote_type: 'self' | 'negotiate' | 'by_daren'
  budget_min?: number
  budget_max?: number
  description?: string
  contact_name?: string
  contact_phone?: string
  view_count: number
  lead_count: number
  status?: 'draft' | 'pending' | 'published' | 'offline'
  publish_time?: string
  created_by?: string
}

export interface Lead {
  _id: string
  demand_id: string
  demand_title: string
  from_user_id?: string
  contact_name: string
  phone: string
  status: 'new' | 'contacted' | 'deal' | 'invalid'
  created_at: string
  updated_at?: string
}

export interface Deal {
  _id: string
  lead_id: string
  demand_id: string
  demand_title: string
  provider_name: string
  provider_phone?: string
  owner_id: string
  status: 'in_progress' | 'completed' | 'cancelled'
  amount: number
  can_review: boolean
  has_review: boolean
  created_at: string
}

export interface Order {
  _id: string
  user_id: string
  items: OrderItem[]
  total_amount?: number
  coupon_id?: string
  points_used?: number
  status: 'created' | 'paid' | 'confirmed' | 'serving' | 'completed' | 'cancelled'
  contact_name?: string
  phone?: string
  remark?: string
  created_at: string
}

export interface OrderItem {
  _id: string
  title: string
  price: number
  quantity: number
  service_type?: string
}

export interface Product {
  _id: string
  title: string
  price: number
  market_price?: number
  service_type: string
  sale_count: number
  is_featured?: boolean
  tags?: string[]
}

export interface Coupon {
  _id: string
  name: string
  amount: number
  minSpend: number
  expire: string
  status: 'available' | 'claimed' | 'used' | 'expired'
  desc: string
}

export interface Notification {
  _id: string
  type: 'system' | 'lead' | 'deal' | 'interact'
  title: string
  desc: string
  time: string
  read: boolean
  link_id?: string
}

export interface Review {
  _id: string
  target_id: string
  reviewer: { id: string; nickname: string }
  rating: number
  content: string
  tags?: string[]
}

export interface PageResult<T> {
  list: T[]
  total: number
}

// ============ 智能引擎 ============

export interface QualityScore {
  scores: {
    title: number
    description: number
    budget: number
    contact: number
    category: number
    region: number
  }
  total: number
  level: '优秀' | '良好' | '一般' | '待完善'
  tips: string[]
}

export interface PriceSuggestion {
  min: number
  max: number
  avg: number
  level: string
  tip: string
}

export interface MemberTier {
  id: string
  name: string
  price: number
  period: string
  original?: number
  color: string
  icon: string
  hot?: boolean
  privileges: string[]
}

// ============ 服务接口签名 ============

export interface DemandService {
  list(params?: any): PageResult<Demand>
  detail(id: string): Demand | null
  create(data: Partial<Demand>): Demand
  update(id: string, data: Partial<Demand>): Demand | null
  myDemands(): PageResult<Demand>
}

export interface CartService {
  add(product: Partial<Product> & { _id: string }): any[]
  updateQty(id: string, quantity: number): any[]
  remove(id: string): any[]
  clear(): void
  list(): any[]
  count(): number
  total(): number
}

export interface OrderService {
  create(data: Partial<Order>): Order
  myOrders(params?: { status?: string }): PageResult<Order>
  detail(id: string): Order | null
  updateStatus(id: string, status: Order['status']): Order | null
}

export interface VerifyService {
  getInfo(): any | null
  status(): 'none' | 'pending' | 'verified' | 'rejected'
  submit(data: any): any
  approve(): any
}

export interface MemberService {
  tiers(): MemberTier[]
  current(): { tier: string; name?: string; expire?: string | null }
  subscribe(tierId: string): { tier: string; name: string; expire: string } | null
}

export interface FavoriteService {
  check(params: { targetType: string; targetId: string }): boolean
  toggle(params: { userId: string; targetType: string; targetId: string }): { isFavorited: boolean }
  list(params?: { type?: string }): PageResult<any>
}

export interface SearchService {
  hotKeywords(): string[]
  history(): string[]
  addHistory(keyword: string): void
  clearHistory(): void
  search(keyword: string): { demands: Demand[]; products: Product[]; posts: any[]; total: number }
}
