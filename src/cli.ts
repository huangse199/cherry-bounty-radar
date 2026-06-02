#!/usr/bin/env node
import chalk from "chalk"
import { Command } from "commander"
import { createGithubClient, getIssueCandidate, getUserPullRequests, searchIssues } from "./github/client.js"
import { renderInspectMarkdown, renderScanMarkdown, renderWatchMarkdown } from "./output/markdown.js"
import { renderGeneratedTemplates } from "./templates/bountyTemplates.js"
import { getGithubToken, parseGithubIssueUrl } from "./utils.js"

const program = new Command()

program
  .name("cherry-bounty")
  .description("Find real, low-risk GitHub bounty issues and generate attempt/claim templates.")
  .version("0.1.0")

program
  .command("scan")
  .description("搜索 GitHub 赏金 issue 并输出 Markdown 报告")
  .option("-q, --query <query>", "GitHub search query")
  .option("-l, --language <language>", "按主要语言过滤，例如 TypeScript")
  .option("--min-bounty <amount>", "最低赏金金额", parseNumber)
  .option("--max-comments <count>", "最大评论数", parseNumber)
  .option("--limit <count>", "扫描数量", parseNumber, 20)
  .option("--include-risky", "包含高风险候选", false)
  .option("--token <token>", "GitHub token，也可用 GITHUB_TOKEN/GH_TOKEN")
  .action(async (options) => {
    const octokit = createGithubClient(getGithubToken(options.token))
    const candidates = await searchIssues({
      octokit,
      query: options.query,
      language: options.language,
      minBounty: options.minBounty,
      maxComments: options.maxComments,
      limit: options.limit,
      includeRisky: options.includeRisky,
    })
    console.log(renderScanMarkdown(candidates))
  })

program
  .command("inspect")
  .description("分析单个 GitHub issue 的赏金信号、风险和推荐分")
  .argument("<issue-url>", "GitHub issue URL")
  .option("--token <token>", "GitHub token，也可用 GITHUB_TOKEN/GH_TOKEN")
  .action(async (issueUrl, options) => {
    const { owner, repo, issueNumber } = parseGithubIssueUrl(issueUrl)
    const octokit = createGithubClient(getGithubToken(options.token))
    const candidate = await getIssueCandidate(octokit, owner, repo, issueNumber)
    console.log(renderInspectMarkdown(candidate))
  })

program
  .command("generate")
  .description("为 bounty issue 生成 /attempt、PR body、follow-up 模板")
  .argument("<issue-url>", "GitHub issue URL")
  .option("--pr-url <url>", "已创建 PR 的 URL")
  .option("--token <token>", "GitHub token，也可用 GITHUB_TOKEN/GH_TOKEN")
  .action(async (issueUrl, options) => {
    const { owner, repo, issueNumber } = parseGithubIssueUrl(issueUrl)
    const octokit = createGithubClient(getGithubToken(options.token))
    const candidate = await getIssueCandidate(octokit, owner, repo, issueNumber)
    console.log(renderGeneratedTemplates(candidate, options.prUrl))
  })

program
  .command("watch")
  .description("跟踪指定用户的开放 PR 与 claim 信号")
  .requiredOption("-u, --user <user>", "GitHub 用户名")
  .option("--limit <count>", "最多检查 PR 数", parseNumber, 20)
  .option("--token <token>", "GitHub token，也可用 GITHUB_TOKEN/GH_TOKEN")
  .action(async (options) => {
    const octokit = createGithubClient(getGithubToken(options.token))
    const prs = await getUserPullRequests(octokit, options.user, options.limit)
    console.log(renderWatchMarkdown(prs))
  })

program.configureOutput({
  outputError: (str, write) => write(chalk.red(str)),
})

program.parseAsync(process.argv).catch((error) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)))
  process.exit(1)
})

function parseNumber(value: string) {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) throw new Error(`不是有效数字：${value}`)
  return parsed
}
