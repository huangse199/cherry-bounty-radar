import type { IssueCandidate, RiskFlag } from "../types.js"
import { daysSince } from "../utils.js"

const highRiskPatterns: Array<[string, RegExp, string]> = [
  ["system-prompt-leak", /system prompt|session initialization|initialization context|pre_task_context|session_init/i, "要求公开系统提示或 session 初始化信息"],
  ["private-runtime-leak", /home directory|working directory|shell path|environment variables|full runtime/i, "要求公开本机/runtime 隐私信息"],
  ["public-payment-details", /paypal|wallet address|payment address|payout address/i, "可能要求公开付款或钱包信息"],
  ["external-application", /apply on|application.*drips|linkedin|follow.*linkedin|star.*repo|social screenshot/i, "可能要求外部申请或社交动作"],
  ["publish-required", /npm publish|publish to npm|deploy to production/i, "可能要求发布或生产部署动作"],
]

const mediumRiskPatterns: Array<[string, RegExp, string]> = [
  ["demo-video", /demo video|screen recording/i, "可能需要录制 UI demo"],
  ["ambiguous", /optimize code|critical bugs|improve documentation|future technologies/i, "描述较宽泛，验收标准可能不清晰"],
  ["crypto-contract", /solidity|staking|vault|reentrancy|tx\.origin|cross-chain/i, "涉及加密合约/安全问题，验证成本高"],
]

export function analyzeRisks(candidate: IssueCandidate, text: string): RiskFlag[] {
  const flags: RiskFlag[] = []

  if (candidate.repository.isArchived) {
    flags.push({ level: "high", code: "archived-repo", message: "仓库已归档" })
  }
  if (candidate.repository.isPrivate) {
    flags.push({ level: "high", code: "private-repo", message: "仓库是私有仓库" })
  }
  if (/rewarded/i.test(candidate.labels.join(" ")) || /has been awarded/i.test(text)) {
    flags.push({ level: "high", code: "already-rewarded", message: "疑似已经发放过赏金" })
  }
  if (candidate.commentsCount >= 25) {
    flags.push({ level: "medium", code: "high-comments", message: "评论较多，竞争或噪音较高" })
  }
  if ((text.match(/\/attempt\s+#?\d+/gi) ?? []).length >= 3) {
    flags.push({ level: "medium", code: "many-attempts", message: "已有多个 attempt" })
  }
  if ((text.match(/pull\/(\d+)|PR\s*#?\d+/gi) ?? []).length >= 3) {
    flags.push({ level: "medium", code: "many-prs", message: "已有多个相关 PR" })
  }
  if (candidate.bountyAmount > 0 && candidate.bountyAmount < 5) {
    flags.push({ level: "medium", code: "tiny-bounty", message: "赏金过低，性价比可能不足" })
  }
  if (daysSince(candidate.repository.pushedAt) > 180) {
    flags.push({ level: "medium", code: "inactive-repo", message: "仓库近期不活跃" })
  }

  for (const [code, regex, message] of highRiskPatterns) {
    if (regex.test(text)) flags.push({ level: "high", code, message })
  }
  for (const [code, regex, message] of mediumRiskPatterns) {
    if (regex.test(text)) flags.push({ level: "medium", code, message })
  }

  if (candidate.bountySignals.length === 0 || candidate.bountyAmount === 0) {
    flags.push({ level: "low", code: "weak-bounty-signal", message: "未识别到明确金额，可能不是现金赏金" })
  }

  return dedupeFlags(flags)
}

function dedupeFlags(flags: RiskFlag[]) {
  const seen = new Set<string>()
  return flags.filter((flag) => {
    if (seen.has(flag.code)) return false
    seen.add(flag.code)
    return true
  })
}
