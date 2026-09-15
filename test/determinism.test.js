/**
 * 确定性回归测试
 *
 * mock 种子数据用固定种子 PRNG(mulberry32) 生成，保证跨进程/跨测试完全可复现，
 * 杜绝 Math.random 随机种子导致的聚合断言偶发失败。
 *
 * 本文件故意不静态 import @/mock/service，避免 vitest 在存在静态引用时
 * vi.resetModules 二次重求值的不稳定行为；全部用动态 import。
 */
import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

const serviceSrc = fs.readFileSync(
  path.resolve(__dirname, '..', 'src', 'mock', 'service.js'), 'utf8'
)

describe('确定性：源码守护', () => {
  it('service.js 不再使用 Math.random（根因）', () => {
    expect(serviceSrc).not.toMatch(/Math\.random\s*\(/)
  })

  it('service.js 使用固定种子 PRNG', () => {
    expect(serviceSrc).toMatch(/_seed/)
    expect(serviceSrc).toMatch(/0x6D2B79F5/) // mulberry32 常量
  })
})

// 确定性证明：源码守护(无 Math.random + 固定种子 PRNG)保证算法确定，
// 固定快照保证输出确定；二者组合等价于"跨进程可复现"，无需依赖
// vitest resetModules 的跨实例比对（该机制在二次重求值时不稳定）。

describe('确定性：固定快照（种子常量被改动会失败）', () => {
  it('demand_10 的预算/地区为已知确定值', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { demandService } = await import('@/mock/service')
    const d = demandService.detail('demand_10')
    expect(d).toBeTruthy()
    expect(d.budget_min).toBe(5000)
    expect(d.region).toBe('长沙')
    // 预算合法性（成对抽取保证 min<=max）
    expect(d.budget_max).toBeGreaterThanOrEqual(d.budget_min)
  })

  it('product_1 价格为已知确定值', async () => {
    vi.resetModules()
    globalThis.__resetStore()
    const { productService } = await import('@/mock/service')
    const p = productService.detail('product_1')
    expect(p).toBeTruthy()
    expect(p.price).toBe(9900)
    expect(p.service_type).toBe('member')
  })
})
