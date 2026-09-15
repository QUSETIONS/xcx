# 接入真实后端 — 迁移指南

## 现状（Stage 1 完成）

真实后端的**可切换接线已打通并验证**：

- `src/api/bridge.js`：补全到**全量服务面**（22 服务 + 5 方法缺口）。每条 `adapt(mockFn, realFn)` 的 `realFn` 即**真实后端需实现的 REST 契约**。
- `src/hooks/index.js`：`useRequest` 已入 barrel（与 `useList` 并列）。
- **48 个业务页面已迁移**到统一异步数据流：需求、商城、社区、资料库、人脉圈、账户、订单、后台管理等页面均通过 `useList/useRequest + bridge` 访问数据（登录页仍由 Pinia 直接完成登录）。
- `test/bridge.test.js`：验证 `USE_MOCK=true` 返回 mock 数据、`USE_MOCK=false`（mock `@/utils/request`）调对端点。
- `USE_MOCK=true` 下全量 **380 个测试（18 个测试文件）** + 全页面挂载守卫 + 渲染冒烟 + 覆盖率门禁全绿，H5 与 mp-weixin 构建通过。

**切换真实后端**（后端就绪时）：`src/utils/env.js` 设 `USE_MOCK=false` + 真实 `BASE_URL`，按 `bridge.js` 的端点契约实现服务端即可。已迁移页面会立即走真实 HTTP。

**本地真实联调结果（2026-07-18）**：配套 `server/` 使用 `3101` 端口启动后，健康检查、用户/管理员登录、首页与各业务模块读取、后台读取、匹配 POST，以及需求创建→更新→详情→删除写链路均已通过；Agent 在服务端临时注入 Kimi 配置后返回 `source=kimi` 的结构化结果。H5 开发环境通过同源 `/api` 代理到 `3101`，小程序/原生开发环境直连 `http://localhost:3101/api`。Kimi 密钥只放 `server/.env`，不要进入前端包或仓库。

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

## 页面覆盖清单（Stage 2，按本模式机械化迁移）

Explore 产出的分类（原始清单，当前已迁 48 页）：

- **真·列表（useList，4）**：✅ demand/list、mall/list、community/index、resource/list。
- **列表型-仅刷新无 loadMore（useList 大 pageSize 或 useRequest，0）**：✅ 已完成。
- **详情（useRequest，4）**：✅ demand/detail、mall/detail、community/detail、resource/detail。
- **表单/变更（useRequest + bridge 写，3）**：✅ demand/publish、community/post、mall/order-confirm。
- **账户/权益/搜索（useRequest，5）**：✅ search/index、points/index、coupon/index、follow/index、member/index。
- **看板/消息/成交/客服（useRequest，4）**：✅ dashboard/index、message/index、deals/index、chat/index。
- **聚合/静态（useRequest，9）**：✅ index、user/index、admin/{index,screen}、profile、verify、settings、campaign、cart。
- **无数据（1）**：user/login（经 Pinia store 用 userService.demoLogin）。

## Smart 路径（Stage 2 已接入）

原先 `@/mock/smart` 被 4 页直引，造成推荐、浏览追踪和价格建议无法随 `USE_MOCK` 切换。现在页面统一使用 `bridge.smart`：

- `recommendedDemands` / `recommendedProducts`：Mock 使用本地智能引擎，真实模式调用 `/api/smart/recommended-demands` 和 `/api/smart/recommended-products`。
- `priceSuggestion`：Mock 使用本地需求数据，真实模式调用 `/api/smart/price-suggestion`。
- `trackBrowse` / `getBrowseHistory` / `clearBrowseHistory` / `scoreDemandQuality`：保留在前端 bridge 的本地能力，不再由页面直接依赖 Mock 文件。

真实推荐接口只返回公开字段，需求联系方式在推荐结果中会被剥离。

## 注意

- **迁移页多出 ~200ms 加载**（bridge mock 分支模拟延迟）——更贴近真实，骨架屏会被真实触发。
- **测试**：渲染冒烟用 `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(300)` flush 异步加载（见 `test/render-smoke.test.js` 的 `flushLoads`）。
- **真实端到端仍按模块补齐**：bridge 的 URL/方法已有真实后端路由；每完成一个模块需继续补充真实接口联调，避免只停留在契约测试。
