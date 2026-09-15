# Agent 验收集

`agent-cases.json` 是 30 条脱敏的企业需求验收样本，检查 Agent 的结构化字段、分类、地区、预算、启动时间和关键词。

真实评测不保存 API 密钥，要求先启动后端并通过服务端环境变量注入 `KIMI_API_KEY`：

```bash
npm run eval:agent -- --limit=5
```

可用环境变量：

- `AGENT_EVAL_BASE_URL`：默认 `http://localhost:3101/api`
- `--limit=N`：只运行前 N 条，适合联调冒烟
- `--delay-ms=N`：请求间隔，默认 250ms
- `--concurrency=N`：并发数 1–4，默认 2
- `--ids=agent_003,agent_006`：只重跑指定样本

脚本会先走 Demo JWT，再调用真实的 `/agent/organize`；密钥不会进入样本文件、脚本或输出。
