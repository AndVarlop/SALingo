# SALingo Deployment

Target: **https://salingo.devandvar.com**, served via **GitHub Pages** (custom domain, configured via `public/CNAME`).

> Earlier revision of this doc targeted Hostinger + FTP. The user switched to GitHub Pages (simpler — no FTP credentials, deploys automatically from `main`, free). The `public/.htaccess` file from that plan is harmless and unused on GitHub Pages (Apache-only); left in place in case of a future self-hosted move.

## Requirements

- Node.js **22.x** (built and verified with 22.20.0 — Angular 21 requires 20.19+/22+)
- npm 11.x (bundled with Node 22)
- Angular CLI 21.x (`npx ng version` to confirm; no need to install globally, `npx`/`npm run` use the project's local copy)
- A Supabase project (already exists: `pdsftfylijdhcyvshbpw.supabase.co`)
- A GitHub repository with **Pages enabled, source = GitHub Actions** (one-time manual setting — see "GitHub Pages configuration" below)

SALingo is a **pure client-side Angular SPA** — no Node.js server-side rendering, nothing to run on the host. The only server-side piece is the Supabase Edge Function (`supabase/functions/ai-proxy`), deployed separately to Supabase, unrelated to where the frontend is hosted.

## Local build

```bash
npm install
npm start          # ng serve
```

## Production build

```bash
npm install
npm run build       # ng build — defaultConfiguration is already "production"
```

Output goes to **`dist/lingo-app/browser/`** — confirmed by inspecting the actual build output, not assumed from `angular.json` (the new `@angular/build:application` builder nests the browser bundle one level deeper than the classic builder). This exact folder is what gets uploaded as the Pages artifact.

Before every deploy, verify the build is clean:

```bash
npx tsc --noEmit -p tsconfig.json
npm run lint
npm test -- --watch=false
npm run build
```

## Git workflow

Repo: `https://github.com/AndVarlop/SALingo` (already connected, remote `origin`, branch `main`).

Small, single-maintainer project — **`main` → production** directly, no feature-branch/PR ceremony required. If a second contributor joins, switch to feature branches + PRs into `main`; the deploy workflow already only triggers on `main`, so that change needs no workflow edits.

```bash
git add -A
git commit -m "..."
git push origin main
```

## GitHub Pages configuration

**One manual step, cannot be done from this environment**: repo → **Settings → Pages → Build and deployment → Source: "GitHub Actions"**. Until this is set, `deploy.yml`'s deploy job will fail even though the build job succeeds (Pages isn't listening for a deployment yet).

Once that's set, every push to `main` triggers `.github/workflows/deploy.yml`, which builds → type-checks → lints → tests → uploads the Pages artifact → deploys. No secrets to configure — `actions/deploy-pages` uses GitHub's built-in `id-token`/`pages` permissions, nothing external.

### Manual deploy (fallback, no Actions needed)

```bash
npm run build
```

Then push the contents of `dist/lingo-app/browser/` to a `gh-pages` branch (or use `npx angular-cli-ghpages --dir=dist/lingo-app/browser` as a one-off) if Pages is ever switched to "Deploy from a branch" instead of "GitHub Actions". Not needed with the current Actions-based setup.

## Domain

`salingo.devandvar.com` — `public/CNAME` tells GitHub Pages which custom domain to serve. It lives in `public/` (not the repo root) specifically because the Actions-based deploy uploads `dist/lingo-app/browser/` as the artifact — a CNAME file sitting only at the repo root is never actually deployed; it has to be part of the built output, same as `404.html`/`robots.txt`/etc. (confirmed by rebuilding and checking `dist/lingo-app/browser/CNAME` exists — an earlier version of this file at the repo root, created via GitHub's web UI, did NOT make it into the deployed artifact and has been removed to avoid the redundant/confusing duplicate).

That alone is not enough — **DNS must point at GitHub Pages**:

- Add a `CNAME` DNS record for the `salingo` subdomain pointing at `AndVarlop.github.io` (GitHub Pages' standard target for a project/user site custom domain), **or**
- If using an apex/naked domain instead of a subdomain, GitHub's A records (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) apply instead — not this case here, since `salingo.devandvar.com` is a subdomain.

This DNS change happens wherever `devandvar.com`'s DNS is managed — cannot be verified or performed from this environment.

## SSL / HTTPS

GitHub Pages provisions a free SSL certificate (via Let's Encrypt) automatically once the custom domain's DNS is correctly pointed and verified — no manual cert management. After DNS propagates, go to repo → Settings → Pages and check **"Enforce HTTPS"** — it's greyed out until GitHub finishes DNS verification and issues the cert, which can take up to ~24h after the DNS record is added.

## Angular SPA routing

GitHub Pages serves static files with no server-side rewrite capability (unlike Apache/Hostinger, which is what `public/.htaccess` was written for). A direct load or refresh of `/dashboard` has no matching file on disk, so GitHub Pages returns its **404 page** instead of `index.html`.

Fixed with the standard [spa-github-pages](https://github.com/rafgraph/spa-github-pages) technique — two new files:
- **`public/404.html`**: GitHub Pages serves this for any unmatched path. It encodes the real path into a query string and redirects to the site root (`pathSegmentsToKeep = 0`, since this is a custom-domain root deployment, not a `/repo-name/` project-page subpath).
- **A script added to `src/index.html`'s `<head>`**: runs before Angular Router boots, decodes that query string back into the real path via `history.replaceState`, so the user lands on the correct route with a clean URL (no `#`/hash routing needed).

Both files are copied into `dist/lingo-app/browser/` automatically by Angular's existing `public/**` asset glob — confirmed present after a rebuild.

**Not yet live-verifiable**: this trick only actually round-trips through GitHub Pages' real 404 handling once deployed there — local static-server testing (which worked for the Hostinger `.htaccess` plan) can't reproduce GitHub Pages' specific 404-then-redirect behavior. Test a hard-refresh on a deep link (e.g. `https://salingo.devandvar.com/dashboard`) once live.

## Environment variables

Angular bundles are fully client-visible — **nothing secret can live in `src/environments/`**. The only values there are `supabaseUrl` and `supabaseAnonKey`, both meant to be public (the anon key is safe by Supabase's design, gated by Row Level Security on every table). No change needed for production.

**GitHub Actions secrets**: none required for this deployment — `actions/deploy-pages` authenticates via GitHub's own OIDC token, not a stored credential.

**Supabase secrets** (for the AI backend, unrelated to hosting): `ANTHROPIC_API_KEY`, set via `supabase secrets set` — see `supabase/functions/ai-proxy/README.md`. Paused per your decision; AI features currently show an honest "not available" state instead of failing or faking a response.

## Supabase configuration

Project: `pdsftfylijdhcyvshbpw.supabase.co`. Auth code already uses `window.location.origin` for redirects (`AuthService.resetPasswordForEmail` → `` `${window.location.origin}/auth/login` ``), so it automatically becomes `https://salingo.devandvar.com/auth/login` in production with **no code change needed**. No OAuth providers configured, so nothing to update there either.

**What you must add manually in the Supabase Dashboard** (Authentication → URL Configuration) — not something this session can do, no dashboard access:
- **Site URL**: `https://salingo.devandvar.com`
- **Redirect URLs** (allow-list): `https://salingo.devandvar.com/**`

Without this, Supabase rejects the redirect even though the app already sends the correct URL.

## Authentication redirects / CORS / backend

No hardcoded `localhost`/`127.0.0.1` anywhere in `src/app` (verified via grep across the whole app). No custom backend besides the `ai-proxy` Supabase Edge Function, called via `supabase.functions.invoke()` — not a raw fetch to a hardcoded origin, so no CORS configuration tied to the frontend's domain is needed there.

## Deployment process

```
git push origin main
  → GitHub Actions: checkout → npm ci → tsc → lint → test → build
  → upload-pages-artifact (dist/lingo-app/browser)
  → deploy-pages
  → https://salingo.devandvar.com serves the new build
```

## Troubleshooting

- **Deploy job fails immediately, build job succeeded**: Pages source isn't set to "GitHub Actions" yet in repo Settings → Pages — see "GitHub Pages configuration" above.
- **`/dashboard` (or any deep link) 404s on direct load/refresh**: confirm `public/404.html` and the matching `index.html` script both made it into the deployed build (check the live page source, and check `dist/lingo-app/browser/404.html` exists after a local build).
- **"Enforce HTTPS" is greyed out / site loads over HTTP only**: DNS hasn't propagated or GitHub hasn't finished cert issuance yet — this can take up to 24h after the DNS record is added; recheck repo Settings → Pages.
- **Password reset / email links point at the wrong domain**: confirm the Supabase Dashboard's Site URL/Redirect URLs were actually updated (see above) — the code side is already correct.
- **AI features show "not configured"**: expected until the Edge Function is deployed with a real `ANTHROPIC_API_KEY` — see `supabase/functions/ai-proxy/README.md`. Not a deployment bug.

## Rollback

Deploys are a straight artifact-from-commit pipeline, so rollback is: revert the bad commit and let the pipeline redeploy.

```bash
git log --oneline           # find the last good commit
git revert <bad-commit>     # new commit that undoes it — keeps history honest
git push origin main        # re-triggers the normal deploy pipeline
```

`git revert` is preferred over `git reset --hard` on a shared/production branch — it undoes the change with a new commit instead of rewriting history, so nothing already pushed/deployed gets silently erased. If a faster rollback is ever needed than waiting for CI, GitHub's Pages deployment history (repo → Environments → github-pages) lets you re-promote a previous successful deployment directly.
