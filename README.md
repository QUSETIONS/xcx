# 媒合智联 MediaMatch · 企业需求、人脉与资源对接平台

> 一个功能完整、工程化的企业服务对接微信小程序，覆盖需求发布、服务交易、社区社交、智能推荐、会员运营、数据中台等完整业务闭环。

基于 **uni-app + Vue 3 + Vite** 构建，支持微信小程序 / H5 多端编译。

---

## ✨ 核心特性

### 业务功能（完整闭环）
- **需求对接**：发布需求 → 服务方浏览 → 提交对接 → 通知 → 接受/拒绝 → 成交 → 评价 → 信用分
- **服务商城**：商品浏览 → 购物车 → 优惠券 + 积分抵扣 → 下单 → 订单全生命周期
- **社区社交**：发帖 / 评论 / 点赞 / 关注 / 用户主页
- **智能引擎**：浏览追踪 → 个性化推荐 → 价格建议 → 需求质量评分
- **会员体系**：三档套餐（普通/专业/企业）+ 权益对比
- **运营中台**：数据看板 + 运营大屏 + 活动/任务营销
- **企业服务**：企业认证流程 + 客服消息 + 消息中心

### 工程化能力
- 🧪 **418 个测试**（单元 + 集成 + 可用性），全部通过
- 🔷 **TypeScript 类型**声明 + typecheck
- 🌍 **国际化 i18n**（中英双语，可切换）
- ♿ **无障碍**（字体缩放 + 高对比度）
- 🔌 **Mock / 真实后端**无缝切换（`ENV.USE_MOCK`）
- ⚡ **性能优化**（分包加载 + 防抖 + 推荐缓存）
- 🛡️ **可用性**（防重复提交 + 触觉反馈 + 统一状态视图）
- 🤖 **CI/CD**（GitHub Actions：typecheck → test → coverage）

---

## 📊 项目规模

| 指标 | 数量 |
|------|------|
| 页面 | 51（主包 34 + 分包 17） |
| 组件 | 6（骨架屏 / 空状态 / 状态视图 / 自定义导航 等） |
| Mock 服务 | 19 个模块（997 行） |
| 测试用例 | 418 个 |
| 代码总量 | 9,400+ 行 |

---

## 🚀 快速开始

### 环境要求
- Node.js ≥ 18
- 微信开发者工具（运行小程序）

### 安装与运行

```bash
# 安装依赖
npm install

# 微信小程序开发模式（编译到 dist/dev/mp-weixin）
npm run dev:mp-weixin

# H5 开发模式
npm run dev:h5
```

H5 默认监听 IPv4/IPv6 双栈，打开 `http://localhost:8080/` 即可预览。

> 用微信开发者工具导入 `dist/dev/mp-weixin` 目录即可预览。

### 构建

```bash
# 构建小程序生产包
npm run build:mp-weixin

# 构建 H5
npm run build:h5
```

---

## 🧪 测试

```bash
npm test              # 运行全部测试
npm run test:watch    # 监听模式
npm run test:coverage # 覆盖率报告
npm run typecheck     # TypeScript 类型检查
```

测试覆盖：
- `smart.test.js` — 智能引擎（推荐/价格/质量评分/缓存）
- `service.test.js` — 核心服务（购物车/订单/搜索）
- `services-extended.test.js` — 扩展服务（收藏/认证/会员/客服/积分/关注）
- `util.test.js` — 工具函数（防抖/节流/格式化）
- `integration.test.js` — **跨服务集成**（交易闭环/下单流程）
- `usability.test.js` — 可用性（防重复/触觉/useRequest）
- `i18n-accessibility.test.js` — 国际化/无障碍/数据联调

> 测试过程中累计发现并修复了 3 个真实 bug（详见 git 历史）。

---

## 🏗️ 项目结构

```
app/
├── src/
│   ├── pages/            # 50 个页面（按模块组织）
│   │   ├── index/        # 首页
│   │   ├── demand/       # 需求（大厅/详情/发布）
│   │   ├── community/    # 社区
│   │   ├── mall/         # 商城
│   │   ├── user/         # 用户中心
│   │   ├── admin/        # 后台管理（分包）
│   │   └── ...
│   ├── components/       # 公共组件（骨架屏/状态视图等）
│   ├── mock/             # Mock 数据服务 + 智能引擎
│   ├── api/              # API 层 + Mock/真实桥接
│   ├── i18n/             # 国际化（中英）
│   ├── hooks/            # 组合式函数（useRequest 等）
│   ├── utils/            # 工具（请求/反馈/无障碍）
│   ├── stores/           # Pinia 状态
│   └── types/            # TypeScript 类型声明
├── test/                 # 418 个测试（21 个测试文件）
├── .github/workflows/    # CI/CD
├── vitest.config.mjs     # 测试配置
└── tsconfig.json         # 类型检查配置
```

---

## 🔌 接入真实后端

开发构建默认连接本地真实后端，测试环境固定使用 Mock。接入其他后端只需配置：

1. 在 `app/.env` 中配置：
   ```dotenv
   VITE_API_BASE_URL=https://your-api.com/api
   VITE_ALLOW_DEMO_LOGIN=false
   ```
2. 业务页改用 `bridge` 调用：
   ```js
   import { bridge } from '@/api/bridge'
   const list = await bridge.demand.list({ page: 1 })
   ```

微信小程序生产构建不能使用相对地址 `/api`，请在构建前设置
`VITE_API_BASE_URL=https://www.mediamatch.cn/api`；H5 同域部署可继续使用 `/api`。

`request.js` 已内置：token 注入、401 过期跳登录、网络重试、请求去重、统一错误提示。

> Demo 登录只在开发演示环境开放。生产构建关闭后，App 不会自动登录，也不会调用 `/auth/demo-login`；正式微信登录会先触发微信隐私授权，并要求用户同意当前版本的用户协议和隐私政策。

---

## 🎯 业务闭环示意

```
需求方                           服务方
  │                               │
  ├─ 发布需求 ──────────────────► 浏览需求
  │                               │
  │   ◄────── 提交对接 + 通知 ────┤
  │                               │
  ├─ 管理对接（接受/拒绝）         │
  │        │                      │
  │   成交记录 + 双向通知          │
  │        │                      │
  ├─ 确认完成 ──► 评价 ──► 信用分  │
```

---

## 🛠️ 技术栈

| 领域 | 技术 |
|------|------|
| 框架 | uni-app + Vue 3 (Composition API) |
| 构建 | Vite 5 |
| 状态 | Pinia |
| 测试 | Vitest + happy-dom |
| 类型 | TypeScript 5 |
| 样式 | Sass / SCSS |
| CI | GitHub Actions |

---

## 📄 License

MIT
