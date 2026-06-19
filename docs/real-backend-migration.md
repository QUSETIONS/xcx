# 接入真实后端 — 迁移指南

## 现状（Stage 1 完成）

真实后端的**可切换接线已打通并验证**：

- `src/api/bridge.js`：补全到**全量服务面**（22 服务 + 5 方法缺口）。每条 `adapt(mockFn, realFn)` 的 `realFn` 即**真实后端需实现的 REST 契约**。
- `src/hooks/index.js`：`useRequest` 已入 barrel（与 `useList` 并列）。
- **3 个前台列表 tab 已迁移**到 `useList + bridge`（异步）：`pages/demand/list.vue`、`pages/mall/list.vue`、`pages/community/index.vue`。
- `test/bridge.test.js`：验证 `USE_MOCK=true` 返回 mock 数据、`USE_MOCK=false`（mock `@/utils/request`）调对端点。
- `USE_MOCK=true` 下全量 325 测试 + 全页面挂载守卫 + 渲染冒烟 + 覆盖率门禁全绿，mp-weixin 构建干净。

**切换真实后端**（后端就绪时）：`src/utils/env.js` 设 `USE_MOCK=false` + 真实 `BASE_URL`，按 `bridge.js` 的端点契约实现服务端即可。这 3 页立即走真实 HTTP。

## 迁移模式（同步 ref → useList/useRequest + bridge）

以 `demand/list` 为模板，每个页面三步：

**1. 改 import**：`@/mock/service` 的直引 → `@/api/bridge` + `@/hooks/useList`（列表）或 `@/hooks/useRequest`（详情/单条）。

**2. 替换状态**：手写的 `list/page/loading/refreshing/noMore` + `loadList/loadMore/onRefresh` → `useList` 一次性返回：
```js
const { list: demandList, loading, refreshing, noMore, load: loadList, loadMore, refresh } = useList(
  (p) => bridge.demand.list({ ...p, /* 页内筛选 */ sort: currentSort.value, keyword: keyword.value }),
  10  // pageSize
)
```
- `onMounted(() => loadList(true))` 触发首载（`loadList` 是 `useList` 的 `load` 别名）。
- 筛选/搜索/排序变化处调 `loadList(true)`（reset 重载）。
- 下拉刷新：`function onRefresh() { refresh() }`。
- 模板里的 `loading/noMore/demandList/refreshing` 绑定**无需改**。

**3. 删旧逻辑**：删手写 `loadList` 函数体、`loadMore`、`page` ref。

> 详情页（`detail`）用 `useRequest`：`const { data, state, run } = useRequest(() => bridge.demand.detail(id))`，在 `onLoad` 拿到 id 后 `run()`，模板按 `state` 三态切骨架/错误/内容。

## 剩余页面清单（Stage 2，按本模式机械化迁移）

Explore 产出的分类（共 39 页，已迁 3）：

- **真·列表（useList，3）**：✅ demand/list、mall/list、community/index。
- **列表型-仅刷新无 loadMore（useList 大 pageSize 或 useRequest，10）**：resource/list、user/{my-demands,my-leads,my-orders,my-favorites}、admin/{demand,lead,order,product}-manage、order/index。
- **详情（useRequest，4）**：demand/detail、mall/detail、resource/detail、community/detail。
- **表单/变更（useRequest + bridge 写，3）**：demand/publish、community/post、mall/order-confirm。
- **聚合/静态（useRequest，19）**：index、user/index、admin/{index,screen}、dashboard、profile、message、deals、search、points、coupon、follow、member、verify、settings、campaign、cart、chat。
- **无数据（1）**：user/login（经 Pinia store 用 userService.demoLogin）。

## 已知 leak（待决策）

`@/mock/smart`（推荐 / 浏览追踪 / 质量&价格评分）是**另一条平行 mock 路径**，被 4 页直引：`index/index`、`demand/detail`、`demand/publish`、`mall/detail`。bridge 当前**不覆盖**它。若要"所有 mock 都可切换"，需单独决定是否把 smart 也纳入 bridge。

## 注意

- **迁移页多出 ~200ms 加载**（bridge mock 分支模拟延迟）——更贴近真实，骨架屏会被真实触发。
- **测试**：渲染冒烟用 `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(300)` flush 异步加载（见 `test/render-smoke.test.js` 的 `flushLoads`）。
- **bridge 契约是占位**：realFn 的 URL/方法在无真实后端时仅靠 mock request 断言，端到端要等后端就绪。
