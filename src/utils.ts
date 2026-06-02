export function parseGithubIssueUrl(url: string) {
  const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)(?:[/?#].*)?$/)
  if (!match) {
    throw new Error(`Invalid GitHub issue URL: ${url}`)
  }

  return {
    owner: match[1],
    repo: match[2],
    issueNumber: Number(match[3]),
  }
}

export function parseGithubPrUrl(url: string) {
  const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:[/?#].*)?$/)
  if (!match) {
    throw new Error(`Invalid GitHub pull request URL: ${url}`)
  }

  return {
    owner: match[1],
    repo: match[2],
    pullNumber: Number(match[3]),
  }
}

export function getGithubToken(explicitToken?: string) {
  return explicitToken || process.env.GITHUB_TOKEN || process.env.GH_TOKEN
}

export function truncate(input: string, max = 180) {
  const normalized = input.replace(/\s+/g, " ").trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max - 1)}…`
}

export function daysSince(date?: string | null) {
  if (!date) return Number.POSITIVE_INFINITY
  const time = new Date(date).getTime()
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY
  return Math.max(0, (Date.now() - time) / (1000 * 60 * 60 * 24))
}
