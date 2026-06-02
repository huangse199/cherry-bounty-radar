import type { IssueCandidate, PullRequestStatus } from "../types.js"
import { truncate } from "../utils.js"

export function renderScanMarkdown(candidates: IssueCandidate[]) {
  const lines = ["# Cherry Bounty Radar Report", ""]
  if (candidates.length === 0) {
    lines.push("未找到符合条件的候选 issue。")
    return lines.join("\n")
  }

  candidates.forEach((candidate, index) => {
    lines.push(`## ${index + 1}. ${candidate.repository.fullName}#${candidate.number}`)
    lines.push("")
    lines.push(`- 标题：${candidate.title}`)
    lines.push(`- 链接：${candidate.url}`)
    lines.push(`- 赏金：${candidate.bountyAmount || "未知"} ${candidate.bountyCurrency}`)
    lines.push(`- 分数：${candidate.score.total}/100（${candidate.score.recommendation}）`)
    lines.push(`- 技术栈：${candidate.repository.primaryLanguage ?? "未知"}`)
    lines.push(`- 评论数：${candidate.commentsCount}`)
    lines.push(`- 信号：${candidate.bountySignals.join(", ") || "无"}`)
    lines.push(
      `- 风险：${candidate.riskFlags.map((flag) => `${flag.level}:${flag.message}`).join("；") || "未发现明显风险"}`,
    )
    lines.push(`- 摘要：${truncate(candidate.body || candidate.title, 220)}`)
    lines.push("")
  })

  return lines.join("\n")
}

export function renderInspectMarkdown(candidate: IssueCandidate) {
  return [
    `# ${candidate.repository.fullName}#${candidate.number}`,
    "",
    `## ${candidate.title}`,
    "",
    `- URL: ${candidate.url}`,
    `- Bounty: ${candidate.bountyAmount || "unknown"} ${candidate.bountyCurrency}`,
    `- Score: ${candidate.score.total}/100`,
    `- Recommendation: ${candidate.score.recommendation}`,
    `- Repository archived: ${candidate.repository.isArchived ? "yes" : "no"}`,
    `- Language: ${candidate.repository.primaryLanguage ?? "unknown"}`,
    `- Comments: ${candidate.commentsCount}`,
    `- Signals: ${candidate.bountySignals.join(", ") || "none"}`,
    "",
    "## Risk flags",
    "",
    ...(candidate.riskFlags.length
      ? candidate.riskFlags.map((flag) => `- [${flag.level}] ${flag.code}: ${flag.message}`)
      : ["- 未发现明显风险"]),
    "",
    "## Score breakdown",
    "",
    `- Bounty: ${candidate.score.bounty}`,
    `- Competition: ${candidate.score.competition}`,
    `- Risk: ${candidate.score.risk}`,
    `- Freshness: ${candidate.score.freshness}`,
    `- Fit: ${candidate.score.fit}`,
  ].join("\n")
}

export function renderWatchMarkdown(prs: PullRequestStatus[]) {
  const lines = ["# Pull Request Watch Report", ""]
  if (prs.length === 0) {
    lines.push("没有找到开放 PR。")
    return lines.join("\n")
  }

  for (const pr of prs) {
    lines.push(`## ${pr.repository}#${pr.number}`)
    lines.push(`- 标题：${pr.title}`)
    lines.push(`- URL：${pr.url}`)
    lines.push(`- 状态：${pr.state}`)
    lines.push(`- Merge state：${pr.mergeStateStatus ?? "unknown"}`)
    lines.push(`- Claim：${pr.claimSignals.join(", ") || "未发现"}`)
    lines.push("")
  }

  return lines.join("\n")
}
