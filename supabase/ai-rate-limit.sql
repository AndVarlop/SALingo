-- =============================================================================
-- SALingo — per-user rate limiting for the ai-proxy Edge Function.
-- Run this in the Supabase SQL Editor. Safe to re-run.
--
-- Deno Edge Functions are stateless and can run as multiple concurrent
-- instances across regions, so an in-memory counter inside the function
-- would not actually limit anything — this table is the real counter,
-- checked/incremented atomically per call via a single upsert.
-- =============================================================================

create table if not exists public.ai_rate_limit (
  user_id uuid not null references auth.users (id) on delete cascade,
  window_start timestamptz not null,
  request_count int not null default 0,
  primary key (user_id, window_start)
);

alter table public.ai_rate_limit enable row level security;

-- Users can read their own counter (so the client could show "X requests
-- left" later if useful) but never write directly — only the Edge Function
-- increments it, using the caller's own JWT, via the RPC below (security
-- definer), not a raw insert/update from the client.
drop policy if exists "ai_rate_limit_read_own" on public.ai_rate_limit;
create policy "ai_rate_limit_read_own" on public.ai_rate_limit
  for select using (auth.uid() = user_id);

-- Atomically increments the current hour's counter for the calling user and
-- returns the new count — a single round-trip, race-safe under concurrent
-- requests (unlike a separate select-then-insert/update from the function).
create or replace function public.increment_ai_rate_limit()
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  bucket timestamptz := date_trunc('hour', now());
  new_count int;
begin
  insert into public.ai_rate_limit (user_id, window_start, request_count)
  values (auth.uid(), bucket, 1)
  on conflict (user_id, window_start)
  do update set request_count = ai_rate_limit.request_count + 1
  returning request_count into new_count;

  return new_count;
end;
$$;

-- Old buckets are never read again after their hour passes; keep the table
-- small. Safe to run manually/on a schedule — not required for correctness.
create or replace function public.prune_ai_rate_limit()
returns void
language sql
security definer set search_path = public
as $$
  delete from public.ai_rate_limit where window_start < now() - interval '24 hours';
$$;
