# SALingo Security Audit

Audited 2026-08-19. Architecture confirmed before any change was made: **Supabase Auth + Postgres RLS**, no custom backend of SALingo's own except one Supabase Edge Function (`ai-proxy`) that proxies to Anthropic. This shaped every finding below — most of "authentication," "session management" and "password storage" is Supabase's responsibility, correctly used by the app, not something this app implements itself. Where that's true, it's stated explicitly rather than described as if SALingo built it.

No destructive changes were made. No users or data were deleted or reset. `npm audit` (prod + dev): **0 vulnerabilities**.

## Authentication

Supabase Auth (`AuthService`, `supabase-js`) handles register/login/logout/session entirely — passwords never touch this app's code, hashing is Supabase's (bcrypt, server-side), JWTs are issued/signed/refreshed by Supabase. `AuthService.session` is the single reactive source of truth (`onAuthStateChange`), consumed everywhere via computed signals.

**Fixed this audit:** the password-reset flow was genuinely broken — `requestPasswordReset` sent a recovery email but no page anywhere captured the resulting session to let the user set a new password (dead end after clicking the email link). New `/auth/reset-password` route + `AuthService.updatePassword()` close this. See table below.

## Authorization

No role/admin system exists in SALingo (no admin panel, no elevated-privilege endpoints) — confirmed by search, not assumed. Nothing to audit or harden there; documented as N/A rather than building a roles system the app doesn't need.

Real authorization is **Postgres RLS**, verified table-by-table (below), not Angular route guards — guards are a UX convenience (redirect to login before wasting a render), never the security boundary. Every request a manipulated frontend could send is still subject to the same RLS policy Postgres enforces, because identity comes from `auth.uid()` (derived from the verified JWT), never from a client-supplied `user_id`.

## Session Management

- Session storage: `supabase-js`'s own mechanism (`localStorage`, its default), access + refresh tokens, auto-refresh on. This is a pre-existing Supabase-managed choice, not changed — Supabase's own JS client is the thing reading/writing it, this app's code never touches the raw token.
- **Fixed:** a session dying mid-use (refresh token rejected — Supabase fires `SIGNED_OUT`) previously left the protected shell rendered with stale data instead of returning the user to login. `ShellComponent` now reactively redirects the moment `auth.isAuthenticated()` flips false.
- **Fixed:** `authGuard` now preserves the attempted URL as `returnUrl` (sanitized against open-redirect — see Input Validation) so a deep link isn't lost on a forced login.
- Logout: `UserStateService` already reactively clears all in-memory app state (progress, profile, everything) the instant `auth.userId()` goes null — verified by reading the effect, not assumed. A second user signing in on the same browser/tab never sees the previous user's data.

## Password Security

- Never stored, never logged, never returned by anything in this codebase — Supabase owns storage entirely.
- **Fixed:** registration's password minimum raised 6 → 8 chars, plus a real confirm-password field with cross-field validation (previously missing).
- Login's password field deliberately keeps no client-side minLength — a pre-existing account created under the old 6-char rule must still be able to log in; Supabase is the real check regardless of what the Angular form allows through.
- **Not implemented (infra, not app code):** a common-password/leaked-password check. Supabase Auth has a built-in "Leaked password protection" (HaveIBeenPwned) toggle — a Dashboard setting, not something this app can enable from its own code. See Action Items.

## API Security

The only API surface SALingo itself operates is `ai-proxy`. Audited directly:
- Requires a valid signed-in-user JWT before doing anything (verified server-side via `supabase.auth.getUser()`), returns 401 otherwise — confirmed it cannot be used as an open, unauthenticated, billable proxy.
- **Fixed:** CORS was `Access-Control-Allow-Origin: *`; now an explicit allowlist (production domain + local dev), configurable via an `ALLOWED_ORIGINS` secret.
- **Fixed:** no rate limiting existed. New `supabase/ai-rate-limit.sql` adds a real per-user-per-hour counter (a Postgres RPC — an in-memory counter would be meaningless since Edge Functions run as multiple stateless instances); `ai-proxy` now returns 429 past 40 requests/hour/user. Fails open (logs, doesn't block) if the migration hasn't been applied, so it can't silently break every AI feature the moment it's deployed with the code but not the migration.
- **Fixed:** no cap existed on message/payload size. Now: 8000 chars/message, 4000 chars for the (app-authored, never user-controlled) system prompt.
- Errors returned to the client are already generic/safe (`'AI provider request failed'`, etc.) — the actual Anthropic error text and unexpected-response-shape details go to `console.error` (server-side function logs only, never the client response).

All other "API" access is direct Supabase REST/Auth calls from `supabase-js` — see User Data Isolation for how those are actually secured.

## User Data Isolation (IDOR)

Every user-owned table across all `supabase/*.sql` migrations was cross-referenced for three things: RLS enabled, an owner-scoped policy, and `with check` (not just `using`) so a user can't insert/update a row claiming someone else's `user_id`. Result — **every single one has all three**:

`profiles`, `user_settings`, `user_streak`, `language_progress`, `lesson_completions`, `daily_activity`, `activity_log`, `review_items`, `user_achievements`, `company_prep_analyses`, `interview_tips_checklist`, `grammar_progress`, `roleplay_sessions`, `scenario_sessions`, `interview_profile`, `interview_answers`, `interview_vocab_progress`, `interview_sessions`, `job_outcomes`, `user_mistakes`, `user_word_favorites` — all `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)` (or `= id` for `profiles`).

`vocabulary_words` is the one deliberately public table (shared content, not user data): `for select using (true)`, and explicitly **no** insert/update/delete policy, meaning Postgres denies those outright — content is only ever written from the SQL Editor.

**Conclusion:** an authenticated user changing a `userId` in a request, calling a Supabase table endpoint directly with DevTools, or bypassing Angular entirely cannot read or write another user's `profiles`/`progress`/`mistakes`/`achievements`/`interview history`/`roleplay history`/etc. — the database itself refuses it regardless of what the client sends, because identity is derived from the verified JWT (`auth.uid()`), never a client-supplied value. This was the highest-priority item in the brief (§13/§14) and required no code changes — it was already built correctly, verified rather than assumed.

## Input Validation

- Registration/login/reset forms: Angular Reactive Forms validators (required, email format, minLength, cross-field password match). Client-side only for these — the real validation for anything that matters (email format for delivery, password acceptance) is Supabase Auth server-side, which cannot be bypassed by disabling JS.
- **Fixed (open redirect):** new `sanitizeReturnUrl()` util rejects anything that isn't a same-app relative path (`/foo`, not `https://evil.example` or `//evil.example`) before ever passing a `returnUrl` query param to `router.navigateByUrl()`.
- **Fixed (payload size):** see API Security — `ai-proxy` message/system length caps.
- AI-generated and user-submitted free text (Writing, Roleplay, Interview answers) is never treated as trusted input for anything beyond display.

## XSS

Searched the entire codebase for `innerHTML`, `[innerHTML]`, and `bypassSecurityTrust*` — **zero matches**. Every piece of user-generated or AI-generated content (Writing feedback, Roleplay transcripts, Interview evaluations, chat messages) renders through Angular's default `{{ }}` interpolation, which auto-escapes HTML. There is no HTML-rendering path in this app for untrusted content to exploit. Confirmed by search, not assumed — this is the correct default, not a fix that was needed.

## CORS

`ai-proxy` — see API Security (fixed: allowlist instead of wildcard). No other API surface exists. Supabase's own REST/Auth/Storage endpoints have their own CORS handling, outside this app's control (see Action Items for the Supabase Dashboard's own site-URL/redirect-URL allowlist, which is the actual access-control lever there).

## Security Headers

GitHub Pages (the current host) **cannot serve custom HTTP response headers** — confirmed by checking the live response headers directly (`curl -I`), not assumed. This sets a hard ceiling:

| Header | Status | Why |
|---|---|---|
| `Strict-Transport-Security` | ✅ Already present | Sent automatically by GitHub Pages for a custom domain with "Enforce HTTPS" on — confirmed live (`max-age=31556952`). |
| `Content-Security-Policy` | ✅ Added via `<meta http-equiv>` | The only mechanism available on this host. Scoped to `'self'` + Supabase; `unsafe-inline` needed for the SPA-routing bootstrap script and Angular's runtime-injected component styles. |
| `Referrer-Policy` | ✅ Added via `<meta>` | `strict-origin-when-cross-origin`. |
| `X-Frame-Options` / CSP `frame-ancestors` | ❌ Not settable | Browsers require a real HTTP header for clickjacking protection — `frame-ancestors` in a `<meta>` CSP is explicitly ignored per spec. **Real risk**: SALingo can currently be iframed by any site. See Action Items. |
| `X-Content-Type-Options` | ❌ Not settable | Meta-tag equivalent doesn't exist; browsers only honor this as a real header. |
| `Permissions-Policy` | ❌ Not settable | Same — HTTP-header-only. |

## Secrets

- The Supabase key shipped in `environment.ts` (`sb_publishable_...`) is **not a secret** — it's Supabase's new publishable-key format, explicitly designed to be public in a frontend bundle (equivalent to a Stripe publishable key). Security comes from RLS, not from hiding this value. Confirmed this is the correct, current-generation key format, not a legacy anon key mistakenly treated as safe.
- Searched the entire Angular codebase for `service_role`, `SUPABASE_SERVICE`, private keys, JWT secrets, hardcoded passwords — **zero matches**.
- The one real secret (`ANTHROPIC_API_KEY`) lives only in Supabase Edge Function secrets, never in git, never in the Angular bundle — confirmed by reading `ai-proxy/index.ts` directly.
- `.gitignore` correctly excludes `.env`/`.env.*`; confirmed no `.env` file is tracked in git history for this repo.

## Error Handling

- Supabase Auth errors surfaced to users (`err.message`) are Supabase's own sanitized, end-user-appropriate messages ("Invalid login credentials", "User already registered") — not stack traces, SQL errors, or schema details. Confirmed by reading every `catch` block in the auth components.
- `ai-proxy` never returns provider error text or exception details to the client — only generic messages; the actual detail goes to server-side function logs.
- Angular production builds strip framework dev-mode error verbosity by default (standard CLI production config, unchanged).

## Logging

Searched every `console.log`/`console.error`/`console.warn` call for anything sensitive (password/token/secret/session data) — the only matches were unrelated class-name collisions (`InterviewSessionService`) logging Supabase `PostgrestError` objects, which never contain credentials. No sensitive data is logged anywhere in this app.

## AI Security

- Every AI-backed feature (Writing, Speaking, Roleplay, Interview evaluation) already required a signed-in user before this audit (via `ai-proxy`'s JWT check) — confirmed, not newly added.
- **Fixed this audit**: rate limiting and payload caps (see API Security).
- Prompt injection: system prompts and user content are kept in separate message roles (the standard Anthropic Messages API pattern), which is the correct mitigation available — but no LLM-based feature achieves full immunity to prompt injection. Accepted residual risk, consistent with industry practice; the blast radius is limited to "the AI says something off-topic in a practice exercise," not account/data access, since the AI response never gets execution privileges over anything.
- No user data is sent to the AI provider beyond what's necessary for the specific feature (the prompt/answer/transcript being evaluated) — confirmed by reading each AI-evaluation service; none forward profile data, tokens, or other users' information.

## Rate Limiting

- `ai-proxy`: fixed this audit (see API Security) — a real, code-level, per-user Postgres-backed limit.
- Login/register/forgot-password: **not implemented in app code, and correctly so** — this is a static SPA with no backend request path of its own in front of Supabase Auth, so any client-side counter would be trivially bypassed by clearing storage (the brief explicitly warns against exactly this). Supabase Auth has its own built-in rate limits on these endpoints at the platform level. See Action Items for what's dashboard-configurable.

## Password Reset

Fixed this audit — see Authentication. The reset token itself is entirely Supabase's mechanism (a signed recovery link that establishes a short-lived session); this app never generates, stores, or validates a token directly. After a successful reset, the recovery session is signed out and the user is sent to log in fresh with the new password, rather than treating the one-time recovery session as a standing login.

## Security Testing

Added a focused unit test suite for `sanitizeReturnUrl()` — the one piece of new security-relevant logic this pass introduced that's small, pure, and worth testing in isolation: accepts a real relative path, rejects an absolute cross-host URL, a protocol-relative URL, a path with no leading slash, and a `javascript:` payload (the actual open-redirect/XSS-via-redirect vectors this function exists to close). `AuthService`/guards were not given new unit tests — they're thin wrappers around `supabase-js` with no local business logic to test meaningfully without either mocking the entire Supabase client (low signal) or a real integration environment (not available in this session). RLS policies were verified by direct SQL review (every table, every policy), which is the appropriate verification method for RLS — not something a Jasmine/Vitest unit test can exercise from the Angular side. `npm audit`: 0 vulnerabilities (verified this session).

---

## Findings Table

| Finding | Severity | Status | Solution |
|---|---|---|---|
| Password reset had no completion page — link led nowhere | High | Fixed | New `/auth/reset-password` route + `AuthService.updatePassword()`; guestGuard moved off the recovery route so it's actually reachable |
| Session expiring mid-use left the app looking authenticated while every call failed | Medium | Fixed | `ShellComponent` reactively redirects to login when `isAuthenticated()` flips false |
| No `returnUrl` preserved on forced login redirect | Medium | Fixed | `authGuard` sets `returnUrl`; login navigates there; `sanitizeReturnUrl()` guards against open redirect |
| `ai-proxy` CORS was `Access-Control-Allow-Origin: *` | Medium | Fixed | Origin allowlist via `ALLOWED_ORIGINS` secret |
| No rate limiting on the AI proxy (cost/abuse exposure) | Medium | Fixed | Real per-user-per-hour Postgres counter, 429 past 40 req/hr |
| No payload size cap on AI requests | Low | Fixed | 8000/4000 char caps enforced server-side |
| Register had no confirm-password field; 6-char minimum was weak | Low | Fixed | Confirm-password field + cross-field validator; minimum raised to 8 |
| Login's password field also had a 6-char minLength, risking lockout for legacy accounts | Low | Fixed | Removed client-side minLength on login (Supabase is the real check) |
| `X-Frame-Options`/`frame-ancestors` not set — app can be iframed by any site | Medium | **Accepted (documented)** | Not achievable via `<meta>`; requires a real HTTP header — GitHub Pages cannot serve one. See Action Items. |
| `X-Content-Type-Options`, `Permissions-Policy` not set | Low | **Accepted (documented)** | Same host limitation as above |
| No leaked-password / common-password check on registration | Low | **Accepted (documented)** | Supabase Auth Dashboard has a built-in HaveIBeenPwned toggle — not something app code can enable |
| Login/register/reset rate limiting relies entirely on Supabase's platform defaults | Low | **Accepted (documented)** | No backend of SALingo's own sits in front of Supabase Auth to add a second layer; a client-only counter would be actively worse (false sense of security, trivially bypassed) |
| User Data Isolation (RLS/IDOR) across all 21 user-owned tables | Critical (if it had failed) | **Verified already correct** | No code change needed — every table already has `enable row level security` + an owner-scoped `for all using (...) with check (...)` policy |
| XSS via `innerHTML`/unsanitized content | High (if present) | **Verified: none found** | Zero `innerHTML` usage anywhere; all content renders through Angular's auto-escaping `{{ }}` |
| Hardcoded secrets in the Angular bundle | Critical (if present) | **Verified: none found** | Only the intentionally-public Supabase publishable key ships in the frontend; the real secret (Anthropic key) lives only in Edge Function secrets |
| Roles/admin authorization | N/A | **Not applicable** | No role system or admin panel exists in SALingo; nothing to audit |

## Action Items (infrastructure/hosting, outside this app's code)

1. **Supabase Dashboard → Authentication → URL Configuration**: confirm `https://salingo.devandvar.com/auth/reset-password` is in the allowed Redirect URLs list — the password-reset fix in this audit will not work end-to-end without this, since Supabase rejects `redirectTo` values not on that allowlist. **Action needed from you.**
2. **Supabase Dashboard → Authentication → Policies/Providers**: consider enabling "Leaked password protection" (HaveIBeenPwned check) — a one-click toggle, no code involved.
3. **Supabase Dashboard → Authentication → Rate Limits**: review the default rate limits on sign-up/sign-in/OTP/password-reset for your plan tier; raise or lower per expected traffic.
4. **`supabase/ai-rate-limit.sql`**: needs to be run in the SQL Editor (same pattern as every other migration this project — additive, safe to re-run) before the new rate limiting actually takes effect; until then `ai-proxy` fails open (logs a warning, allows the request).
5. **Clickjacking / missing security headers**: GitHub Pages fundamentally cannot serve custom HTTP headers. Real fix requires either (a) a header-capable edge in front of the custom domain (e.g. a free Cloudflare account with a Transform Rule / Worker purely for response headers, DNS unchanged), or (b) migrating hosts to one that supports a headers config file (Netlify `_headers`, Vercel `vercel.json`, Cloudflare Pages `_headers`) — a real decision with tradeoffs, flagged here rather than silently worked around.
6. **`ALLOWED_ORIGINS` secret**: not yet set on the deployed Edge Function — it currently falls back to the hardcoded default (production domain + localhost:4200), which is correct today but won't self-update if the domain changes. Run `supabase secrets set ALLOWED_ORIGINS=https://salingo.devandvar.com,http://localhost:4200` (or your actual dev port) to make it explicit.
