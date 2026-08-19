/**
 * Only ever navigate to a `returnUrl` that is a same-app relative path.
 * Without this check, a crafted link like
 * `/auth/login?returnUrl=https://evil.example` or `?returnUrl=//evil.example`
 * (protocol-relative) could turn the post-login redirect into an open
 * redirect to an attacker-controlled site — this rejects anything that
 * isn't a single leading `/` followed by a non-slash character.
 */
export function sanitizeReturnUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!/^\/(?!\/)/.test(raw)) return null;
  return raw;
}
