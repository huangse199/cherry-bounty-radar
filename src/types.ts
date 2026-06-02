export interface GithubRepositoryRef {
  owner: string
  name: string
  fullName: string
  url: string
  isArchived?: boolean
  isPrivate?: boolean
  primaryLanguage?: string | null
  pushedAt?: string | null
  stars?: number
}

export interface IssueCandidate {
  title: string
  url: string
  number: number
  state: string
  body: string
  commentsCount: number
  labels: string[]
  createdAt?: string
  updatedAt?: string
  author?: string
  repository: GithubRepositoryRef
  bountyAmount: number
  bountyCurrency: string
  bountySignals: string[]
  riskFlags: RiskFlag[]
  score: IssueScore
}

export interface RiskFlag {
  level: "low" | "medium" | "high"
  code: string
  message: string
}

export interface IssueScore {
  total: number
  bounty: number
  competition: number
  risk: number
  freshness: number
  fit: number
  recommendation: "strong" | "good" | "caution" | "skip"
}

export interface ScanOptions {
  query?: string
  language?: string
  minBounty?: number
  maxComments?: number
  limit: number
  includeRisky?: boolean
  token?: string
}

export interface InspectOptions {
  token?: string
}

export interface WatchOptions {
  user: string
  token?: string
  limit: number
}

export interface PullRequestStatus {
  repository: string
  number: number
  title: string
  url: string
  state: string
  mergeStateStatus?: string
  checks: Array<{
    name: string
    status: string
    conclusion?: string
  }>
  claimSignals: string[]
}
