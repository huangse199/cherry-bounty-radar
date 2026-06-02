export function analyzeBountySignals(text: string) {
  const signals: string[] = []
  const amounts: Array<{ amount: number; currency: string }> = []

  const patterns: Array<{ regex: RegExp; currency: string; signal: string }> = [
    { regex: /\/bounty\s*\$\s*(\d+(?:\.\d+)?)/gi, currency: "USD", signal: "/bounty $" },
    { regex: /\$\s*(\d+(?:\.\d+)?)\s*bounty/gi, currency: "USD", signal: "dollar bounty" },
    { regex: /bounty[^\n$€£]{0,60}\$\s*(\d+(?:\.\d+)?)/gi, currency: "USD", signal: "bounty amount" },
    { regex: /reward[^\n$€£]{0,60}\$\s*(\d+(?:\.\d+)?)/gi, currency: "USD", signal: "reward amount" },
    { regex: /€\s*(\d+(?:\.\d+)?)/gi, currency: "EUR", signal: "euro amount" },
    { regex: /£\s*(\d+(?:\.\d+)?)/gi, currency: "GBP", signal: "gbp amount" },
  ]

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.regex)) {
      amounts.push({ amount: Number.parseFloat(match[1]), currency: pattern.currency })
      signals.push(pattern.signal)
    }
  }

  if (/algora/i.test(text)) signals.push("algora")
  if (/steps to solve/i.test(text)) signals.push("steps-to-solve")
  if (/\/attempt\s+#?\d+/i.test(text)) signals.push("attempt-flow")
  if (/\/claim\s+#?\d+/i.test(text)) signals.push("claim-flow")
  if (/💎|bounty/i.test(text)) signals.push("bounty-keyword")

  const best = amounts.sort((a, b) => b.amount - a.amount)[0]
  return {
    amount: best?.amount ?? 0,
    currency: best?.currency ?? "USD",
    signals: [...new Set(signals)],
  }
}
