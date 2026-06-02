import type { IssueCandidate } from "../types.js"

export function generateAttemptComment(candidate: IssueCandidate) {
  return `/attempt #${candidate.number}

Plan: I will implement a focused solution for this issue, keep the PR narrowly scoped to the acceptance criteria, and include local verification results. I will avoid unrelated changes and document any assumptions clearly in the PR.`
}

export function generatePrBody(candidate: IssueCandidate) {
  return `## Summary

- Implement a focused fix for ${candidate.repository.fullName}#${candidate.number}.
- Keep the change scoped to the issue requirements.
- Add or update verification coverage where appropriate.

## Verification

- [ ] Run the relevant local tests/build commands
- [ ] Confirm the change matches the issue acceptance criteria

/claim #${candidate.number}`
}

export function generateFollowUpComment(candidate: IssueCandidate, prUrl = "<PR_URL>") {
  return `Hi! I opened a focused PR for this bounty: ${prUrl}

It targets ${candidate.repository.fullName}#${candidate.number} and keeps the implementation scoped to the issue requirements. I included verification notes in the PR body and can adjust anything to better match the project style.`
}

export function renderGeneratedTemplates(candidate: IssueCandidate, prUrl?: string) {
  return [
    "# Generated bounty workflow templates",
    "",
    "## Attempt comment",
    "",
    "```text",
    generateAttemptComment(candidate),
    "```",
    "",
    "## Pull request body",
    "",
    "```md",
    generatePrBody(candidate),
    "```",
    "",
    "## Follow-up comment",
    "",
    "```text",
    generateFollowUpComment(candidate, prUrl),
    "```",
  ].join("\n")
}
