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
├── vitest.config.js              # 测试配置（@ 别名 + happy-dom 环境）
├── test/
│   ├── setup.js                  # 全局 setup：mock uni 小程序全局对象
│   ├── smart.test.js             # 智能引擎（质量评分/价格建议/推荐）
│   ├── service.test.js           # Mock 服务（购物车/订单/搜索）
│   ├── services-extended.test.js # 服务扩展（会员/积分/认证/关注/优惠券…）
│   ├── util.test.js              # 工具函数（debounce/formatYuan/日期…）
│   ├── usability.test.js         # 可用性（guardClick/feedback/useRequest）
│   ├── integration.test.js       # 集成（交易闭环/下单/推荐/通知）
│   ├── integration-extended.test.js # 集成扩展（会员/签到/认证/关注/收藏/搜索）
│   ├── i18n-accessibility.test.js   # i18n 切换 + 无障碍 + bridge
│   ├── i18n-integrity.test.js    # i18n 完整性护栏（键对等/引用可解析/对象型 key）
│   ├── determinism.test.js       # 种子数据确定性（源码守护 + 固定快照）
│   ├── regression.test.js        # 回归（价格建议区间一致性等）
│   ├── vue-wiring-guard.test.js  # Vue 页面接线静态守卫（生命周期必调用/淡入开关有效/无未定义调用）
│   ├── render-smoke.test.js      # 渲染冒烟（@vue/test-utils 挂载关键列表页，断言非空渲染）
│   └── service-write.test.js     # 写路径覆盖（create/update/状态变更/评论点赞/趋势分支）
└── src/mock/                     # 被测纯逻辑模块
```

## 设计要点

1. **不加载 uni-app 插件**：`vitest.config.js` 故意不引入 `@dcloudio/vite-plugin-uni`，因为它依赖 vuex 等编译期模块，与单元测试无关。测试只针对纯 JS 逻辑。
2. **mock `uni` 全局**：小程序 API（`uni.getStorageSync` 等）在 Node 环境不存在，由 `test/setup.js` 用内存实现注入。
3. **每个用例前重置存储**：`beforeEach(() => globalThis.__resetStore())` 保证用例间隔离（注意：仅重置 storage，模块级内存状态如 points/follow 由 vitest 按测试文件隔离）。
4. **页面级接线用静态守卫补偿**：`vue-wiring-guard.test.js` 直接扫描每个 `<script setup>`，固化三类不变量：(A) 从 vue 导入的生命周期钩子必须被调用；(B) `const animated = ref(...)` 淡入开关必须有效；(C) 不允许调用未定义的裸函数。把曾经溜过 20+ 次提交的"列表整页不可见"类缺陷钉死在接线层。
5. **页面渲染 + 交互冒烟（@vue/test-utils）**：静态守卫只查接线、查不到"渲染/行为是否正确"。`render-smoke.test.js` 用 `@vitejs/plugin-vue`（接入 vitest）+ 一层 uni 内置组件 stub（view/text/image/scroll-view…→ div 透传 `$attrs`，故 `@tap` 经 inheritAttrs 落到 div、可 `.trigger('tap')` 触发）+ mock `@dcloudio/uni-app` 生命周期（onLoad 回调可由 `fireOnLoad(params)` 触发以模拟路由参数），挂起 11 个场景：7 列表页非空渲染、demand/detail 带路由参数渲染详情与 AI 匹配、i18n 切语言响应式重渲染、以及 mall 关键词搜索/服务类型筛选交互（`.trigger('tap')` + `setValue` 驱动 v-model）。接线守卫之上的第二、第三道网；挂载顺带把 mock/util/i18n 覆盖率抬升（见下）。
6. **service 写路径覆盖**：`service-write.test.js` 专门覆盖 create/update/状态变更（成交）、发帖/评论/点赞、趋势 7·30 天分支等变更方法与边界（不存在 id 返回 null/false），把 service.js 的 functions 覆盖从 ~74% 抬到 87%、statements 到 100%。
7. **全页面挂载守卫**：`render-smoke.test.js` 用 `import.meta.glob('/src/pages/**/*.vue')` 自动发现全部 ~39 页，逐个挂载 + 喂路由参数（`fireOnLoad`）+ 装 Pinia，断言无一在 onMounted/onLoad 数据路径抛错。把"进页崩溃"类缺陷覆盖从采样 8 页扩到**全部页面**——正是它发现了 #10/#11 两个渲染崩溃 bug。

## 测试结果

```
Test Files  14 passed (14)
     Tests  316 passed (316)

Coverage（含门禁，见 vitest.config.js thresholds: stmts≥96 / branch≥82 / funcs≥86 / lines≥96）
  All files   99%+ statements | 86%+ branch | 94%+ functions
  i18n        100% statements | locales 100%
  utils       97%+ statements（util/i18n-maps 100%）
  smart.js    95%+ statements | 100% functions
  service.js  100% statements | 87% functions（写路径补齐后）
```

> mock 种子数据用**固定种子 PRNG(mulberry32)** 生成，跨进程完全可复现（`test/determinism.test.js` 守护：源码禁用 `Math.random` + 固定快照）。

> 测试过程中发现并修复的真实 bug：
> 1. `scoreDemandQuality`：未选择报价方式时错误给 10 分预算分 → 修正为 0 分
> 2. `memberService.current()`：无存储时返回 null 导致访问崩溃 → 返回默认 free 套餐
> 3. `favoriteService.toggle()`：取消收藏时未持久化，重启后收藏仍在 → 补上 setStorageSync
> 4. mock `budget_min/budget_max` 独立随机抽取产生 min>max 非法数据 → 改成对区间，`getPriceSuggestion` 区间不再倒置
> 5. `demand/list.vue` 模板引用未定义的 `formatCount/getHeatClass/getHeatLevel` → 补全函数
> 6. `demand/list.vue`：核心"需求"tab 调用 `loadList` 9 次却从未定义 → 进页 `ReferenceError`、列表空白；按 `demandService.list` 真实签名补全 `loadList(reset)`
> 7. **12 个列表页** `const animated = ref(false)` 从未置真 → 列表容器 `opacity:0` 永久不可见（经 20+ 次提交未被发现，因测试从不挂载组件）；统一改 `ref(true)`
> 8. `my-demands / my-leads / my-orders / my-favorites` 与 `admin/product-manage`：`onMounted` 已 import 却未调用 → 进页空白、需手动下拉刷新才出数据；补 `onMounted(loadList)`
> 9. `admin/{demand,lead,order}-manage`：`onMounted` 已 import 但页面用 setup 期同步初始化、实为死导入 → 删除
> 10. `settings/index.vue`：模板用 `t()` 却未从 '@/i18n' 导入 → 进页 `_ctx.t is not a function` 渲染崩溃；补导入（由全页面挂载守卫发现）
> 11. `member/index.vue`：`tiers` 在 onMounted 异步加载，首帧 `currentTier` 为 undefined → `currentTier.color` 渲染崩溃；改 setup 期同步初始化（同上）

## CI

`.github/workflows/ci.yml` 会在 push / PR 到 main 时自动运行测试，并上传覆盖率报告。
