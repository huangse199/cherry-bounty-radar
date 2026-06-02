import type { IssueCandidate, IssueScore } from "../types.js"
import { daysSince } from "../utils.js"

export function scoreIssue(candidate: IssueCandidate): IssueScore {
  const bounty = scoreBounty(candidate.bountyAmount, candidate.bountySignals)
  const competition = scoreCompetition(candidate.commentsCount, candidate.body)
  const risk = scoreRisk(candidate)
  const freshness = scoreFreshness(candidate.updatedAt, candidate.repository.pushedAt)
  const fit = scoreFit(candidate)
  const total = Math.round(
    bounty * 0.32 + competition * 0.22 + risk * 0.24 + freshness * 0.12 + fit * 0.1,
  )

  return {
    total,
    bounty,
    competition,
    risk,
    freshness,
    fit,
    recommendation: recommendation(total, candidate),
  }
}

function scoreBounty(amount: number, signals: string[]) {
  let score = 15
  if (amount >= 5) score += 20
  if (amount >= 25) score += 20
  if (amount >= 100) score += 15
  if (signals.includes("algora")) score += 15
  if (signals.includes("attempt-flow") || signals.includes("claim-flow")) score += 10
  return clamp(score)
}

function scoreCompetition(comments: number, body: string) {
  const attempts = (body.match(/\/attempt\s+#?\d+/gi) ?? []).length
  let score = 100
  score -= Math.min(45, comments * 2)
  score -= Math.min(30, attempts * 10)
  return clamp(score)
}

function scoreRisk(candidate: IssueCandidate) {
  let score = 100
  for (const flag of candidate.riskFlags) {
    if (flag.level === "high") score -= 45
    if (flag.level === "medium") score -= 18
    if (flag.level === "low") score -= 8
  }
  return clamp(score)
}

function scoreFreshness(issueUpdatedAt?: string, repoPushedAt?: string | null) {
  let score = 100
  const issueDays = daysSince(issueUpdatedAt)
  const repoDays = daysSince(repoPushedAt)
  if (issueDays > 7) score -= 15
  if (issueDays > 30) score -= 20
  if (repoDays > 60) score -= 25
  if (repoDays > 180) score -= 30
  return clamp(score)
}

function scoreFit(candidate: IssueCandidate) {
  const lang = candidate.repository.primaryLanguage?.toLowerCase() ?? ""
  if (["typescript", "javascript", "python"].includes(lang)) return 100
  if (["mdx", "html", "css"].includes(lang)) return 85
  if (["go", "rust"].includes(lang)) return 70
  if (["java", "c++", "c"].includes(lang)) return 55
  return 65
}

function recommendation(total: number, candidate: IssueCandidate): IssueScore["recommendation"] {
  if (candidate.riskFlags.some((flag) => flag.level === "high")) return "skip"
  if (total >= 78) return "strong"
  if (total >= 62) return "good"
  if (total >= 45) return "caution"
  return "skip"
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}
