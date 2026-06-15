# 测试说明

本项目使用 [Vitest](https://vitest.dev/) 进行单元测试，参考 Vite / Vue 3 社区主流方案。

## 快速开始

```bash
# 运行所有测试（单次）
npm test

# 监听模式（开发时自动重跑）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 目录结构

```
app/
├── vitest.config.js      # 测试配置（@ 别名 + happy-dom 环境）
├── test/
│   ├── setup.js          # 全局 setup：mock uni 小程序全局对象
│   ├── smart.test.js     # 智能引擎测试（质量评分/价格建议/推荐）
│   └── service.test.js   # Mock 服务测试（购物车/订单/搜索）
└── src/mock/             # 被测纯逻辑模块
```

## 设计要点

1. **不加载 uni-app 插件**：`vitest.config.js` 故意不引入 `@dcloudio/vite-plugin-uni`，因为它依赖 vuex 等编译期模块，与单元测试无关。测试只针对纯 JS 逻辑。
2. **mock `uni` 全局**：小程序 API（`uni.getStorageSync` 等）在 Node 环境不存在，由 `test/setup.js` 用内存实现注入。
3. **每个用例前重置存储**：`beforeEach(() => globalThis.__resetStore())` 保证用例间隔离。

## 测试结果

```
Test Files  2 passed (2)
     Tests  35 passed (35)

Coverage
  smart.js    90.23% statements | 100% functions
  service.js  73.46% statements
```

> 测试过程中发现并修复了 `scoreDemandQuality` 的一个真实 bug：未选择报价方式时错误地给 10 分预算分，已修正为 0 分并提示用户选择。

## CI

`.github/workflows/ci.yml` 会在 push / PR 到 main 时自动运行测试，并上传覆盖率报告。
