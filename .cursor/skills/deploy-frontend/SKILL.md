---
name: deploy-frontend
description: >-
  Builds the retailer Next.js static export and deploys via PR into sibling
  retailer_web_build main (Cloudflare Pages). Use when the user asks to deploy
  the retailer frontend, ship Pages, or update retailer_web_build.
---

# Deploy frontend (retailer → retailer_web_build)

## Preconditions

- User **explicitly** asked to deploy (or push live FE / Pages).
- Working tree in `retailer_ordereasy_njs` is in the intended deploy state.

## Checklist

```text
Deploy progress:
- [ ] Confirm explicit deploy ask
- [ ] npm test green (full suite)
- [ ] npm run build → out/
- [ ] Replace ../retailer_web_build (keep .git)
- [ ] Secret-scan artifact diff
- [ ] review-before-push on retailer_web_build
- [ ] Commit on feature branch (not main)
- [ ] Open PR → main; wait for review
- [ ] Merge only with ≥1 approval
- [ ] Report PR/SHA + Pages implication
```

## Steps

1. **Confirm** the user wants a live Cloudflare Pages deploy from this build.
2. Run **full suite**: `npm test` — block on failure.
3. Build: `npm run build` — expect static export in `out/`.
4. Sync into `../retailer_web_build` (preserve `.git`).
5. In `../retailer_web_build`:
   - Checkout a feature branch (never commit on `main`).
   - Stage, secret-scan, follow **review-before-push**.
   - Commit; push the feature branch; open PR into **`main`**.
   - **Wait** for review time; **merge only with ≥1 approval**. Never push `main` directly. Never force-push.
6. Report: PR URL, merge SHA, Pages implication.

## Do not

- Deploy without an explicit user request.
- Commit/push directly to `main`/`master`.
- Merge without approval.
- Implement app features inside `retailer_web_build`.
