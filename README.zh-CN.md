# Cherry Bounty Radar

[English](README.md) | [简体中文](README.zh-CN.md)

Cherry Bounty Radar 是一个面向开发者的 GitHub 赏金 issue 扫描 CLI。它帮助你在大量噪音里筛出更真实、低风险、低竞争、值得尝试的开源赏金任务。

它会扫描 GitHub issue，提取赏金信号，标记风险要求，给候选任务打分，并生成 `/attempt` + `/claim` 工作流模板。

## 为什么做这个工具

开源赏金任务里有很多噪音：

- 假赏金或测试赏金
- 已归档仓库
- 已经发放过奖励的 issue
- 评论和 attempt 很多、竞争激烈的 issue
- 要求公开 system prompt、runtime 信息、钱包信息或社交动作的任务
- 验收标准模糊的任务

Cherry Bounty Radar 的目标是过滤这些噪音，让你把时间花在更可能变成真实 PR reward 的 issue 上。

## 功能

- `scan`：搜索 GitHub 赏金类 issue，并输出 Markdown 报告
- `inspect`：分析单个 issue 的赏金信号、风险标签和评分细节
- `generate`：生成 `/attempt` 评论、PR body、`/claim` 和维护者 follow-up 模板
- `watch`：跟踪某个用户的开放 PR，并检测 claim 信号
- 内置风险规则：prompt 泄露、隐私泄露、公开付款信息、外部申请、归档仓库、已发奖 issue 等

## 安装

```bash
npm install -g cherry-bounty-radar
```

也可以从源码运行：

```bash
git clone https://github.com/huangse199/cherry-bounty-radar.git
cd cherry-bounty-radar
npm install
npm run build
node dist/cli.js --help
```

## GitHub Token

未认证的 GitHub API 请求会受到较低的频率限制。建议设置 token：

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Windows PowerShell：

```powershell
$env:GITHUB_TOKEN="ghp_your_token_here"
```

## 使用方法

### 扫描候选赏金 issue

```bash
cherry-bounty scan --language TypeScript --min-bounty 10 --max-comments 15 --limit 20
```

把 Markdown 报告写入文件：

```bash
cherry-bounty scan --language TypeScript --limit 20 --output bounty-report.md
```

输出结构化 JSON：

```bash
cherry-bounty scan --query 'Algora bounty' --limit 10 --json
```

扫描报告会展示赏金金额、评分、风险标签、attempt 数、claim 数和相关 PR 数。

自定义查询：

```bash
cherry-bounty scan --query '"/bounty $" OR "Algora"' --limit 10
```

### 分析单个 issue

```bash
cherry-bounty inspect https://github.com/tscircuit/docs/issues/601
```

### 生成工作流模板

```bash
cherry-bounty generate https://github.com/tscircuit/docs/issues/601
```

输出包括：

- attempt 评论
- 带 `/claim #...` 的 PR body
- 给维护者的 follow-up 评论

### 跟踪自己的开放 PR

```bash
cherry-bounty watch --user huangse199 --limit 20
```

## 评分模型

每个 issue 会得到 0-100 分，评分来源包括：

- 赏金信号强度
- 竞争程度
- 风险程度
- 新鲜度
- 技术栈匹配度

推荐等级：

- `strong`：值得优先尝试
- `good`：大概率值得尝试
- `caution`：需要人工进一步确认
- `skip`：风险高或投入产出比低

## 风险标签

高风险示例：

- 要求公开 system prompt 或 session initialization context
- 要求公开 home directory、shell path、环境变量或 runtime 细节
- 要求公开 PayPal、钱包地址或付款信息
- 要求外部申请、LinkedIn、follow、star 截图或社交证明
- 要求发布 npm 包或部署生产环境
- 仓库已归档
- issue 已经发放过奖励

中风险示例：

- 评论或 attempt 很多
- 相关 PR 很多
- 赏金很小
- 验收标准模糊
- 加密合约/安全任务，验证成本高

## 开发

```bash
npm install
npm run typecheck
npm test
npm run build
```

## 免责声明

这个工具不能保证你一定获得赏金。开始工作前，请务必阅读 issue、赏金平台规则、仓库贡献指南和 payout eligibility 要求。

不要提交垃圾 PR。不要泄露私人 prompt、token、钱包细节或本地 runtime 信息。
