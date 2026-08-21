---
name: jira-to-pr
description: >-
  End-to-end ticket workflow for retailer FE: fetch Jira acceptance criteria,
  phase the work, implement with UT and review per phase, open a GitHub PR,
  optionally deploy. Use when starting a KAN-* ticket, implementing a Jira
  issue, or shipping work from ticket to PR.
---

# Jira → PR (retailer FE)

## Workflow

1. **Jira (work)** — Fetch the issue via Atlassian MCP. Restate acceptance criteria. Ask if unclear; never invent scope.
2. **Phase plan** — Break into ordered isolated steps; note UT + negative cases per phase. Follow **phased-delivery**.
3. **GitHub (implementation)** — Branch named with `KAN-*`. For **each phase**: implement → UT (colocated `*.test.tsx`) → focused + **full suite** (`npm test`) → mini-review → only then next phase. Before any commit: secret scan. Before push: **review-before-push** (includes full suite results). Open PR with Jira key in title/body.
4. **Knowledge** — If behavior/runbook changed, update/add markdown (README or `docs/`); call out GitBook sync if that’s how you publish.
5. **Deploy** — Only if user asks; invoke **deploy-frontend** (re-runs review + secret checks).
6. **Close the loop** — Jira comment with PR/deploy links; transition status only when the user wants it moved.

## Per-phase loop (required)

```text
Phase N:
- [ ] Implement only this phase
- [ ] Add/update tests (happy + negative when relevant)
- [ ] Focused vitest + npm test (full suite)
- [ ] Mini-review summary to user
- [ ] Optional: commit this phase alone
```

## Anti-patterns

- One giant implement → one giant test → one giant review.
- Pushing or deploying without review-before-push.
- Skipping Jira fetch when a ticket key is known.
