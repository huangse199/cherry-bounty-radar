import { Octokit } from "@octokit/rest"
import type { IssueCandidate, PullRequestStatus } from "../types.js"
import { analyzeBountySignals } from "../scoring/bounty.js"
import { analyzeRisks } from "../scoring/riskRules.js"
import { scoreIssue } from "../scoring/scoreIssue.js"

export function createGithubClient(token?: string): Octokit {
  return new Octokit(token ? { auth: token } : {})
}

function repoApiUrlToFullName(repositoryUrl: string) {
  const parts = repositoryUrl.split("/repos/")[1]?.split("/")
  if (!parts || parts.length < 2) return "unknown/unknown"
  return `${parts[0]}/${parts[1]}`
}

function labelNames(labels: unknown[]): string[] {
  return labels
    .map((label) => {
      if (typeof label === "string") return label
      if (label && typeof label === "object" && "name" in label) {
        return String((label as { name?: string }).name ?? "")
      }
      return ""
    })
    .filter(Boolean)
}

export async function searchIssues(params: {
  octokit: Octokit
  query?: string
  language?: string
  limit: number
  minBounty?: number
  maxComments?: number
  includeRisky?: boolean
}) {
  const query = buildSearchQuery(params)
  const response = await params.octokit.search.issuesAndPullRequests({
    q: query,
    per_page: Math.min(params.limit, 100),
    sort: "updated",
    order: "desc",
  })

  const candidates = await Promise.all(
    response.data.items
      .filter((item) => !item.pull_request)
      .slice(0, params.limit)
      .map((item) => hydrateSearchIssue(params.octokit, item as any)),
  )

  return candidates
    .filter((candidate) => candidate.bountyAmount >= (params.minBounty ?? 0))
    .filter(
      (candidate) =>
        params.maxComments === undefined ||
        candidate.commentsCount <= params.maxComments,
    )
    .filter(
      (candidate) =>
        params.includeRisky ||
        !candidate.riskFlags.some((flag) => flag.level === "high"),
    )
    .sort((a, b) => b.score.total - a.score.total)
}

function buildSearchQuery(params: {
  query?: string
  language?: string
  maxComments?: number
}) {
  const base =
    params.query ||
    '"/bounty $" OR "Steps to solve:" OR "Algora" OR "paid issue" OR "Reward:"'
  const parts = [`(${base})`, "type:issue", "state:open", "archived:false"]
  if (params.language) parts.push(`language:${params.language}`)
  if (params.maxComments !== undefined) parts.push(`comments:<=${params.maxComments}`)
  return parts.join(" ")
}

async function hydrateSearchIssue(
  octokit: Octokit,
  item: {
    title: string
    html_url: string
    number: number
    state: string
    body?: string | null
    comments: number
    labels?: unknown[]
    created_at?: string
    updated_at?: string
    user?: { login?: string }
    repository_url: string
  },
): Promise<IssueCandidate> {
  const fullName = repoApiUrlToFullName(item.repository_url)
  const [owner, repo] = fullName.split("/")
  const [repoResponse, commentsResponse] = await Promise.all([
    octokit.repos.get({ owner, repo }),
    item.comments > 0
      ? octokit.issues.listComments({ owner, repo, issue_number: item.number, per_page: 100 })
      : Promise.resolve({ data: [] }),
  ])

  const commentsText = commentsResponse.data
    .map((comment) => comment.body || "")
    .join("\n\n")
  const labels = labelNames(item.labels ?? [])
  const combinedText = [item.title, item.body || "", labels.join(" "), commentsText].join(
    "\n",
  )
  const bounty = analyzeBountySignals(combinedText)
  const repoInfo = repoResponse.data
  const baseCandidate: IssueCandidate = {
    title: item.title,
    url: item.html_url,
    number: item.number,
    state: item.state,
    body: item.body || "",
    commentsCount: item.comments,
    labels,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    author: item.user?.login,
    repository: {
      owner,
      name: repo,
      fullName,
      url: repoInfo.html_url,
      isArchived: repoInfo.archived,
      isPrivate: repoInfo.private,
      primaryLanguage: repoInfo.language,
      pushedAt: repoInfo.pushed_at,
      stars: repoInfo.stargazers_count,
    },
    bountyAmount: bounty.amount,
    bountyCurrency: bounty.currency,
    bountySignals: bounty.signals,
    riskFlags: [],
    score: {
      total: 0,
      bounty: 0,
      competition: 0,
      risk: 0,
      freshness: 0,
      fit: 0,
      recommendation: "skip",
    },
  }

  const risks = analyzeRisks(baseCandidate, combinedText)
  const score = scoreIssue({ ...baseCandidate, riskFlags: risks })
  return { ...baseCandidate, riskFlags: risks, score }
}

export async function getIssueCandidate(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
) {
  const [issueResponse, repoResponse, commentsResponse] = await Promise.all([
    octokit.issues.get({ owner, repo, issue_number: issueNumber }),
    octokit.repos.get({ owner, repo }),
    octokit.issues.listComments({ owner, repo, issue_number: issueNumber, per_page: 100 }),
  ])

  const issue = issueResponse.data
  const commentsText = commentsResponse.data.map((comment) => comment.body || "").join("\n\n")
  const labels = labelNames(issue.labels ?? [])
  const combinedText = [issue.title, issue.body || "", labels.join(" "), commentsText].join("\n")
  const bounty = analyzeBountySignals(combinedText)
  const repoInfo = repoResponse.data

  const baseCandidate: IssueCandidate = {
    title: issue.title,
    url: issue.html_url,
    number: issue.number,
    state: issue.state,
    body: issue.body || "",
    commentsCount: issue.comments,
    labels,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    author: issue.user?.login,
    repository: {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
      url: repoInfo.html_url,
      isArchived: repoInfo.archived,
      isPrivate: repoInfo.private,
      primaryLanguage: repoInfo.language,
      pushedAt: repoInfo.pushed_at,
      stars: repoInfo.stargazers_count,
    },
    bountyAmount: bounty.amount,
    bountyCurrency: bounty.currency,
    bountySignals: bounty.signals,
    riskFlags: [],
    score: {
      total: 0,
      bounty: 0,
      competition: 0,
      risk: 0,
      freshness: 0,
      fit: 0,
      recommendation: "skip",
    },
  }

  const risks = analyzeRisks(baseCandidate, combinedText)
  return { ...baseCandidate, riskFlags: risks, score: scoreIssue({ ...baseCandidate, riskFlags: risks }) }
}

export async function getUserPullRequests(
  octokit: Octokit,
  user: string,
  limit: number,
): Promise<PullRequestStatus[]> {
  const response = await octokit.search.issuesAndPullRequests({
    q: `author:${user} type:pr is:open`,
    sort: "updated",
    order: "desc",
    per_page: Math.min(limit, 100),
  })

  return Promise.all(
    response.data.items.map(async (item) => {
      const fullName = repoApiUrlToFullName(item.repository_url)
      const [owner, repo] = fullName.split("/")
      const pull = await octokit.pulls.get({ owner, repo, pull_number: item.number })
      const body = pull.data.body || ""
      const claimSignals = [...body.matchAll(/\/claim\s+#?\d+/gi)].map((match) => match[0])
      return {
        repository: fullName,
        number: item.number,
        title: item.title,
        url: item.html_url,
        state: item.state,
        mergeStateStatus: pull.data.mergeable_state ?? undefined,
        checks: [],
        claimSignals,
      }
    }),
  )
}
