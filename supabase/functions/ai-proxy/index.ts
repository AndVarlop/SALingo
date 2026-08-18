// Supabase Edge Function (Deno runtime). This is the ONLY place the
// Anthropic API key exists — it lives in Supabase's function secrets
// (`ANTHROPIC_API_KEY`), never in the Angular bundle. Angular calls this
// function via `supabase.functions.invoke('ai-proxy', { body })`, which
// automatically attaches the signed-in user's JWT; this function verifies
// that JWT before ever touching the AI provider, so it can't be used as an
// open (and billable) proxy by anyone who isn't a logged-in SALingo user.
//
// Contract (kept deliberately generic so every AI feature — AI Tutor,
// Roleplay, Mock Interview evaluation, Writing evaluation, Resume
// analysis — can share this one function instead of each getting its own):
//
//   Request  body: { system: string; messages: {role:'user'|'assistant'; content:string}[]; maxTokens?: number }
//   Response body: { text: string }
//   Error    body: { error: string }
//
// Deploy with the Supabase CLI from the project root:
//   supabase functions deploy ai-proxy
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// See supabase/functions/ai-proxy/README.md for the full setup walkthrough.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_MODEL = 'claude-sonnet-5';
const MAX_TOKENS_CEILING = 1024; // hard cap regardless of what the client asks for — cost/abuse guard
const MAX_MESSAGES = 40; // a runaway client shouldn't be able to send an unbounded conversation history

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CompleteRequest {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, error: string): Response {
  return jsonResponse({ error }, status);
}

function isValidRequest(body: unknown): body is CompleteRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (typeof b['system'] !== 'string' || !b['system'].trim()) return false;
  if (!Array.isArray(b['messages']) || b['messages'].length === 0) return false;
  if (b['messages'].length > MAX_MESSAGES) return false;
  return b['messages'].every(
    (m) =>
      m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0,
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  try {
    // 1. Require a real, signed-in SALingo user — never an open proxy.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse(401, 'Missing Authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse(401, 'Invalid or expired session');

    // 2. Validate the request shape before spending anything on it.
    const body = await req.json().catch(() => null);
    if (!isValidRequest(body)) {
      return errorResponse(400, 'Expected { system: string, messages: {role, content}[] }');
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      // Deliberately distinct from a provider error — the caller should
      // show "AI isn't configured yet", not a generic "something broke".
      return errorResponse(503, 'AI backend is not configured (missing ANTHROPIC_API_KEY secret)');
    }

    // 3. Call Claude.
    const maxTokens = Math.min(body.maxTokens ?? 500, MAX_TOKENS_CEILING);
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system: body.system,
        messages: body.messages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[ai-proxy] Anthropic API error', anthropicRes.status, errText);
      return errorResponse(502, 'AI provider request failed');
    }

    const data = await anthropicRes.json();
    const text = data?.content?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) {
      console.error('[ai-proxy] Unexpected Anthropic response shape', JSON.stringify(data));
      return errorResponse(502, 'AI provider returned an empty response');
    }

    return jsonResponse({ text });
  } catch (err) {
    console.error('[ai-proxy] Unexpected error', err);
    return errorResponse(500, 'Internal error');
  }
});
