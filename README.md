# Cherry Bounty Radar

[English](README.md) | [简体中文](README.zh-CN.md)

Cherry Bounty Radar is a practical CLI for developers who want to find real, low-risk GitHub bounty issues before wasting time on noisy or unsafe tasks.

It scans GitHub issues, extracts bounty signals, flags risky requirements, scores candidates, and generates `/attempt` + `/claim` workflow templates.

## Why

Open-source bounty hunting has a lot of noise:

- fake or test bounties
- archived repositories
- already rewarded issues
- high-competition issues with many attempts
- tasks that ask for system prompts, runtime metadata, wallet details, or social actions
- vague tasks with no clear acceptance criteria

Cherry Bounty Radar helps filter that noise so you can focus on issues that are more likely to become real PR rewards.

## Features

- `scan`: search GitHub for bounty-like issues and output a Markdown report
- `inspect`: analyze a single issue for bounty signals, risk flags, and score breakdown
- `generate`: create `/attempt`, PR body, `/claim`, and follow-up comment templates
- `watch`: track a user's open PRs and detect claim signals
- built-in risk rules for prompt leaks, privacy leaks, public payment details, external application requirements, archived repos, and already rewarded issues

## Install

```bash
npm install -g cherry-bounty-radar
```

Or run from source:

```bash
git clone https://github.com/huangse199/cherry-bounty-radar.git
cd cherry-bounty-radar
npm install
npm run build
node dist/cli.js --help
```

## GitHub token

Unauthenticated GitHub API requests are rate-limited. For best results, set a token:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

On Windows PowerShell:

```powershell
$env:GITHUB_TOKEN="ghp_your_token_here"
```

## Usage

### Scan for candidates

```bash
cherry-bounty scan --language TypeScript --min-bounty 10 --max-comments 15 --limit 20
```

Write a Markdown report to a file:

```bash
cherry-bounty scan --language TypeScript --limit 20 --output bounty-report.md
```

Output structured JSON:

```bash
cherry-bounty scan --query 'Algora bounty' --limit 10 --json
```

The scan report includes bounty amount, score, risk flags, attempt count, claim count, and related PR count.

Custom query:

```bash
cherry-bounty scan --query '"/bounty $" OR "Algora"' --limit 10
```

### Inspect one issue

```bash
cherry-bounty inspect https://github.com/tscircuit/docs/issues/601
```

### Generate workflow templates

```bash
cherry-bounty generate https://github.com/tscircuit/docs/issues/601
```

Output includes:

- attempt comment
- PR body with `/claim #...`
- maintainer follow-up comment

### Watch your open PRs

```bash
cherry-bounty watch --user huangse199 --limit 20
```

## Scoring model

Each issue gets a 0-100 score from:

- bounty strength
- competition level
- risk profile
- freshness
- tech-stack fit

Recommendations:

- `strong`: worth attempting
- `good`: likely worth attempting
- `caution`: inspect manually before work
- `skip`: high risk or poor ROI

## Risk flags

High-risk examples:

- asks for system prompt or session initialization context
- asks for home directory, shell path, environment variables, or runtime details
- asks for public PayPal/wallet/payment details
- requires external application, LinkedIn/follow/star screenshots, or social proof
- requires publishing to npm or production deployment
- archived repository
- already rewarded issue

Medium-risk examples:

- many comments or attempts
- many related PRs
- very small bounty
- vague acceptance criteria
- crypto contract/security tasks with high verification cost

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Disclaimer

This tool does not guarantee bounty payment. Always read the issue, bounty platform rules, repository contribution guidelines, and payout eligibility requirements before working.

Do not submit spam PRs. Do not leak private prompts, tokens, wallet details, or local runtime information.
