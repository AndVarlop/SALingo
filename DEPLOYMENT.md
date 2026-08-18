# SALingo Deployment

Target: **https://salingo.devanvar.com** (subdomain already created in Hostinger, DNS already pointed).

## Requirements

- Node.js **22.x** (built and verified with 22.20.0 — Angular 21 requires 20.19+/22+)
- npm 11.x (bundled with Node 22)
- Angular CLI 21.x (`npx ng version` to confirm; no need to install globally, `npx`/`npm run` use the project's local copy)
- A Supabase project (already exists: `pdsftfylijdhcyvshbpw.supabase.co`)
- Hostinger hosting with FTP access (see "Hostinger configuration" below)

SALingo is a **pure client-side Angular SPA** — no Node.js server-side rendering, no backend server to run on Hostinger. The only server-side piece is the Supabase Edge Function (`supabase/functions/ai-proxy`), which is deployed separately to Supabase, not to Hostinger.

## Local build

```bash
npm install
npm start          # ng serve, http://localhost:4300 or 4200 depending on config
```

## Production build

```bash
npm install
npm run build       # ng build — defaultConfiguration is already "production"
```

Output goes to **`dist/lingo-app/browser/`** — this exact folder (not `dist/lingo-app/`, not `dist/`) is what gets uploaded to Hostinger. Confirmed by inspecting the actual build output, not assumed from angular.json (the new `@angular/build:application` builder nests the browser bundle one level deeper than the classic builder used to).

Before every deploy, verify the build is clean:

```bash
npx tsc --noEmit -p tsconfig.json
npm run lint
npm test -- --watch=false
npm run build
```

## Git workflow

Repo: `https://github.com/AndVarlop/SALingo` (already connected, remote `origin`, branch `main`).

This is a small, single-maintainer project — recommended workflow is **`main` → production** directly, no feature-branch/PR ceremony required. If the project grows a second contributor, switch to feature branches + PRs into `main`, and have `main` auto-deploy on merge (the GitHub Actions workflow already triggers only on `main`).

Standard flow:

```bash
git add -A
git commit -m "..."
git push origin main
```

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds, type-checks, lints, tests, and — once the FTP secrets below are configured — deploys automatically.

## Hostinger configuration

Hostinger's shared/business hosting plans don't run Node.js for arbitrary apps and don't offer native Git-based CI for static sites on most plans — the reliable, universally-supported method is: **build on GitHub Actions, upload the static output over FTP**.

1. In hPanel → **Files → FTP Accounts**, create (or find) an FTP account scoped to the subdomain's document root.
2. Note the FTP hostname, username, password, and the exact server directory for `salingo.devanvar.com` (commonly `/public_html/salingo` or `/domains/salingo.devanvar.com/public_html` — check hPanel, it varies by how the subdomain was created).
3. Add those three (four, including the directory) as **GitHub repository secrets** — see "Environment variables" below.

Once those secrets exist, every push to `main` deploys automatically. Until then, pushes still build/test (so you always know main is deployable) but the upload step is skipped with a visible warning in the Actions log.

### Manual deploy (fallback, no GitHub Actions needed)

```bash
npm run build
```

Then upload the **contents of** `dist/lingo-app/browser/` (not the folder itself) to the subdomain's document root via Hostinger's File Manager or any FTP client (FileZilla, etc.).

## Domain

`salingo.devanvar.com` — already registered/configured in Hostinger per the user. This deployment assumes:
- The subdomain's DNS A/CNAME record already points at Hostinger (not verified from this environment — Hostinger DNS isn't reachable from here).
- The subdomain's document root is where the FTP account in the step above uploads to.

## SSL / HTTPS

Hostinger includes free SSL (Let's Encrypt) on most plans, enabled per-domain/subdomain in hPanel → **SSL**. This needs to be turned on for `salingo.devanvar.com` specifically (subdomains don't automatically inherit the main domain's cert coverage on every plan — check hPanel).

`public/.htaccess` (already in the repo, copied into every build automatically) force-redirects any `http://` request to `https://` with a 301, so once SSL is active, HTTP access becomes impossible by design — no mixed content, no accidental insecure loads.

## Angular SPA routing

Angular Router runs entirely client-side. Without server configuration, a hard refresh or direct link to `/dashboard` returns a 404 from Apache, because no such file exists on disk.

`public/.htaccess` fixes this: real files (`/assets/...`, hashed `.js`/`.css`, `favicon.ico`, `manifest.webmanifest`) are served normally; everything else falls back to `index.html`, letting Angular Router take over and render the right route client-side. Verified by inspecting the actual rewrite rules against the real `dist/lingo-app/browser/` file list — no wildcard grabbing real assets.

**Verified locally** (not just written and assumed): served the real `dist/lingo-app/browser/` output with `npx serve -s -p 8081` (the `-s`/`--single` flag replicates the same rewrite-to-index.html behavior `.htaccess` implements on Apache) and confirmed via `curl`:
- `/dashboard` → `200` (was `404` without `-s`, confirming the fallback is what fixes it)
- `/interview-prep/roleplay/rp-1` (nested deep link) → `200`
- `/favicon.ico` (real file) → `200`, still served directly, not swallowed by the fallback

## .htaccess

Lives at `public/.htaccess` in the repo (not `dist/` directly — `dist/` is never committed). Angular's build copies everything in `public/` into the build output automatically (`angular.json`'s existing asset glob), confirmed by rebuilding and checking `dist/lingo-app/browser/.htaccess` exists after a clean build.

Does four things: forces HTTPS, SPA fallback to `index.html`, long-cache hashed build assets while forcing `index.html`/`ngsw.json` to always revalidate (so a new deploy is picked up immediately, not served stale from browser cache), gzip compression.

## Environment variables

Angular bundles are fully client-visible — **nothing secret can live in `src/environments/`**. The only values there are `supabaseUrl` and `supabaseAnonKey`, both meant to be public (the anon key is safe by Supabase's design, gated by Row Level Security on every table — verified during this session's earlier work). No change needed for production; both environment files already point at the real Supabase project.

**GitHub Actions secrets** (Settings → Secrets and variables → Actions → New repository secret) — needed for the auto-deploy step:

| Secret | Value |
|---|---|
| `FTP_SERVER` | Hostinger FTP hostname (hPanel → FTP Accounts) |
| `FTP_USERNAME` | Hostinger FTP username |
| `FTP_PASSWORD` | Hostinger FTP password |
| `FTP_SERVER_DIR` | *(optional)* target directory; defaults to `/public_html/` if unset — set this explicitly if the subdomain's real document root is different |

None of these exist yet in the repo as of this document — **you** need to add them (see "ACTION REQUIRED" in `DEVELOPMENT_REPORT.md`).

**Supabase secrets** (for the AI backend, separate from Hostinger): `ANTHROPIC_API_KEY`, set via `supabase secrets set` — see `supabase/functions/ai-proxy/README.md`. Deliberately paused per your decision — AI features currently show an honest "not available" state instead of failing or faking a response.

## Supabase configuration

Project: `pdsftfylijdhcyvshbpw.supabase.co`. Auth code already uses `window.location.origin` for redirects (`AuthService.resetPasswordForEmail` → `` `${window.location.origin}/auth/login` ``), so it automatically becomes `https://salingo.devanvar.com/auth/login` in production with **no code change needed**. No OAuth providers are configured in the app, so there's nothing to update there.

**What you must add manually in the Supabase Dashboard** (Authentication → URL Configuration) — this is not something this session can do, no dashboard access:
- **Site URL**: `https://salingo.devanvar.com`
- **Redirect URLs** (allow-list): add `https://salingo.devanvar.com/**` (or explicitly `https://salingo.devanvar.com/auth/login`)

Without this, Supabase will reject the redirect even though the app sends the correct URL — the allow-list is enforced server-side by Supabase, not something the client can bypass.

RLS/Storage policies: unaffected by domain — they're keyed to `auth.uid()`, not origin.

## Authentication redirects / CORS / backend

No hardcoded `localhost`/`127.0.0.1` anywhere in `src/app` (verified via grep across the whole app). No custom backend besides the `ai-proxy` Supabase Edge Function, which already enforces its own CORS headers and doesn't need per-domain configuration — it's called via `supabase.functions.invoke()`, not a raw fetch to a hardcoded origin.

## Deployment process (once secrets are set)

```
git push origin main
  → GitHub Actions: checkout → npm ci → tsc → lint → test → build
  → FTP-Deploy-Action uploads dist/lingo-app/browser/ to Hostinger
  → https://salingo.devanvar.com serves the new build
```

## Troubleshooting

- **Blank page / console errors about a missing script**: usually a stale `index.html` referencing old hashed filenames after a partial/interrupted upload. Re-deploy fully (the FTP action does a full sync, not a diff, when `dangerous-clean-slate` considerations aside — see its docs if partial uploads become a recurring issue).
- **`/dashboard` (or any deep link) 404s on direct load, but works when navigated to from `/`**: `.htaccess` isn't being read — confirm Apache has `mod_rewrite` enabled (standard on Hostinger) and that `.htaccess` actually uploaded (FTP clients sometimes hide dotfiles by default — check "show hidden files").
- **Mixed content warnings**: check `og:url`/`environment.ts` don't have a stray `http://` — both already use `https://` explicitly.
- **Password reset / email links point at the wrong domain**: confirm the Supabase Dashboard's Site URL/Redirect URLs (see above) actually got updated — the code side is already correct.
- **AI features show "not configured"**: expected until the Edge Function is deployed with a real `ANTHROPIC_API_KEY` — see `supabase/functions/ai-proxy/README.md`. This is not a deployment bug.

## Rollback

Since deploys are a straight FTP sync from a git commit's build output, rollback is: check out the previous known-good commit, rebuild, redeploy.

```bash
git log --oneline           # find the last good commit
git checkout <commit-hash>
npm install
npm run build
# upload dist/lingo-app/browser/ manually, or:
git checkout main
git revert <bad-commit>      # preferred over reset — keeps history honest
git push origin main         # re-triggers the normal deploy pipeline
```

`git revert` is preferred over `git reset --hard` for a shared/production branch — it undoes the change with a new commit instead of rewriting history, so nothing already pushed/deployed gets silently erased.
