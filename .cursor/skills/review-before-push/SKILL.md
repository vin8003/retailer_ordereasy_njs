---
name: review-before-push
description: >-
  Pre-push checklist for retailer_ordereasy_njs: summarize commits/diff, secret
  skim, confirm npm test green, call out deploy side effects. Use when about to
  git push, open/update a PR, or when the user asks to push or deploy.
---

# Review before push (retailer FE source)

## When

Before any `git push` (feature branch, PR update) or when the user asks to push/deploy. Also invoked from **deploy-frontend** and **jira-to-pr**.

## Checklist

1. **Range** — `git log` / `git diff` against upstream (or base branch). Summarize commits and notable files.
2. **Secrets** — Skim that diff for `.env*`, credentials, `service_account`, `*.pem`/`*.key`, Bearer tokens, `AKIA…`, `BEGIN … PRIVATE KEY`, accidental key material.
3. **Full suite** — Confirm `npm test` (vitest) was run green; cite command + outcome. If not run yet, run it now; **block push on failure**.
4. **Deploy side effects** — Pushing this source repo alone does **not** ship Pages. Live FE requires **deploy-frontend** → sibling `retailer_web_build` `main`. Call that out if the user might think push = deploy.
5. **Present findings** — Short review to the user; push only after confirmation (or prior explicit push/deploy ask in the same turn).

## Output template

```markdown
## Pre-push review
- **Branch → remote**: …
- **Commits**: …
- **Risk areas**: …
- **Secrets skim**: clean / issues found
- **Tests**: `npm test` — pass/fail
- **Deploy implication**: none (source only) / will trigger Pages if also deploying build repo
- **Ask**: OK to push?
```
