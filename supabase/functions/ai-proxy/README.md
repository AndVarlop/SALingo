# ai-proxy — Setup

One-time setup to make AI Tutor (and every future AI feature that reuses
this function) actually call Claude instead of returning canned replies.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) installed
- Logged in: `supabase login`
- Your Anthropic API key (console.anthropic.com → API Keys)

## 1. Link this project (first time only)

```bash
supabase link --project-ref pdsftfylijdhcyvshbpw
```

## 2. Set the secret

**Never paste the key into a file in this repo, into chat, or anywhere
Claude Code can see it.** Run this yourself in your own terminal:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-real-key-here
```

## 3. Deploy the function

```bash
supabase functions deploy ai-proxy
```

That's it — `SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected
automatically by the platform, no need to set those yourself.

## Verifying it worked

Once deployed, AI Tutor's Grammar/Speaking/Vocabulary/Conversation topics
will start returning real Claude replies instead of the old canned text.
If the secret isn't set yet, the app will show an honest
"AI isn't configured yet" message instead of a fake reply — it never
silently falls back to pretending.

## Cost note

Every message sent through AI Tutor calls the Anthropic API and costs
real money (billed to your Anthropic account, not Supabase). There's no
per-user rate limit built in yet beyond `MAX_TOKENS_CEILING` (1024
tokens/reply) and `MAX_MESSAGES` (40 turns/request) in `index.ts` — worth
adding real rate limiting before opening this up beyond testing.
