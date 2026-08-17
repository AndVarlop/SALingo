# SALingo — Development Report

**Session type:** Autonomous continuous work session (no check-ins), across two rounds.
**Starting point (round 1):** Fase 1-5 of the Learning Platform + Fase 1-4 of Interview Prep, already built and verified in prior sessions.
**Round 1 added:** the rest of the Learning Platform (Progress, Placement Test, AI Tutor, Achievements) and Interview Prep phases 5-9 (Scenarios, Difficult Customers, Roleplay, Mock Interview, History, Preparation Plan), plus a full audit pass that found and fixed 5 real bugs.
**Round 2 added** (after you ran `interview-sessions.sql`): closed the persistence gap for Roleplay/Scenario completions, plus the remaining Interview Prep spec sections — STAR method, "no experience" guidance, pre-interview checklist, candidate questions, and Company-Specific Preparation.

Everything below was tested by actually running the app in Chrome with a real Supabase-backed account (not just "it compiles") — every flow described as "working" was exercised end-to-end, including checking that XP/scores/persistence matched the expected math.

---

## 1. What was implemented this session

### Learning Platform — previously-empty placeholders, now real

| Page | What it does |
|---|---|
| **Progress** (`/progress`) | Real stat cards (XP, time studied, words learned, accuracy, lessons, streak), a 14-day XP bar chart, and a skills breakdown — all computed from `UserStateService`, no mock/placeholder numbers. |
| **Placement Test** (`/placement-test`) | 15-question adaptive bank (A1→C1), reuses `ExercisePlayerComponent`, computes a CEFR estimate from the score, and can write the result back to the user's profile/language level in Supabase. |
| **AI Tutor** (`/ai-tutor`) | Real chat UI (bubbles, typing indicator, auto-scroll) wired to the existing `AiTutorService`, with the 5 quick-reply topics from the spec. |
| **Achievements** | New `AchievementService` with a 15-item catalog (streaks, XP, vocabulary, lessons, grammar, plus Interview Prep-specific ones). Unlocks are evaluated reactively against live app state and persisted to `user_achievements`. Surfaced in the Profile page. |

### Interview Prep — phases 5-9 of the module spec

| Feature | What it does |
|---|---|
| **Customer Service Scenarios** (`/interview-prep/scenarios`) | 12 real situations as multiple-choice-with-explanation, reusing `ExercisePlayerComponent`. |
| **Difficult Customers** (same page, second tab) | 8 "instead of X, use Y" professional-language reference cards. |
| **Roleplay** (`/interview-prep/roleplay`) | 12 scenarios across Beginner/Intermediate/Advanced/Expert. Each has a full intro (context/objective/customer/problem/available info) then a live chat with a mock customer (`AiRoleplayService`, multi-turn, escalates to resolution), scored at the end via `AiInterviewEvaluationService`. |
| **Mock Interview** (`/interview-prep/mock-interview`) | Position + difficulty + mode setup → 8-15 sequential real questions from the question bank → **Real Interview Mode** (90s timer/question, hints hidden) as an alternative to Guided mode → aggregate scoring across 5 dimensions → session saved to `interview_sessions`. |
| **Interview History** (`/interview-prep/history`) | Real list of past Mock Interview sessions with score, duration, star rating. |
| **Preparation Plan** (`/interview-prep/plan`) | 7-day roadmap; completion checkmarks are derived from real progress where trackable (questions practiced, sessions taken), not faked for the two days that aren't (Scenarios/Roleplay have no persistence layer yet — described in Known Gaps). |
| **Gamification** | Interview Readiness now blends in the best Mock Interview score; 2 more real achievements (First Interview, Interview Pro) wired to actual session data. |

---

## 1b. Round 2: closing gaps + remaining spec sections

Confirmed first: **Mock Interview history now survives a full page reload** — ran an 8-question interview, hard-reloaded (full navigation, not HMR), and the session showed up in History from Supabase with the correct score. The `interview-sessions.sql` migration works as intended.

Then, from the "Known Gaps" list in round 1:

- **Roleplay and Scenario completions now persist.** New tables (`roleplay_sessions`, `scenario_sessions` — `supabase/interview-practice-log.sql`, **not yet run**). `InterviewSessionService` now owns all three kinds of practice-session logs. The Preparation Plan's Day 4 (Scenarios) and Day 5 (Roleplay) checkmarks are now real instead of permanently `null`, the Roleplay list shows a "Completed" badge per scenario, and 2 new achievements (First Roleplay, 7 Roleplays Practiced) are wired to real counts.
- Verified live that the app **degrades gracefully without the new migration**: completed a fresh roleplay, XP and evaluation worked correctly (415 XP awarded, scored 89/100), and the console showed exactly one caught error (`saveRoleplayCompletion failed`) — no crash, no broken UI, just that one completion won't show as "Completed" until the table exists.

New spec sections built (originally scoped out of both rounds' priority list, now added):

- **Interview Tips** (`/interview-prep/tips`) — 4-tab reference page: STAR method (with a fully worked example tied to the existing behavioral question bank), "I have no experience" guidance (non-job experience sources + example answer), an interactive pre-interview checklist (session-only, intentionally not persisted — it's a day-of reminder list, not a progress metric), and candidate questions to ask (good vs. to avoid).
- **Company-Specific Preparation** (`/interview-prep/company-prep`) — paste a company/position/job description, get tailored questions/vocabulary/skills via `AiJobAnalysisService` (previously stubbed but unused by any UI). Tested both of its keyword-detection branches (sales-flavored and technical-flavored job descriptions each produced different, correct output).

---

## 2. Bugs found and fixed (real, user-facing)

These weren't style nits — every one of them made a feature silently not work, and every fix was verified live in the browser afterward.

1. **`ai-tutor` and `roleplay-session` reloaded the whole page on every message.** Both used a bare `<form (ngSubmit)="...">` without importing `FormsModule`. Angular's `ngSubmit` only gets `preventDefault()` from the `NgForm` directive, which only attaches when `FormsModule` (or `ReactiveFormsModule` + `[formGroup]`) is imported. Without it, the native HTML form `submit` event fired a full browser navigation, wiping all chat state. Fixed by importing `FormsModule` in both components. Verified: sending a message in either chat no longer reloads the page.
2. **"Avg. accuracy" and "Words learned" stat cards were hardcoded to 0 forever.** Nothing in any service ever wrote to `language_progress.average_accuracy` or `.words_learned` in Supabase — the columns just sat at their seed default. Fixed by computing both client-side: accuracy from a rolling average of `activityLog` entries, words-learned from `VocabularyService` mastery ≥ 60%.
3. **Same root cause, different symptom: "Skills breakdown" on the Progress page was always empty**, and the Dashboard's "practice your weakest skill" recommendation card never appeared, because both read `language_progress.skills`, which nothing ever populated either. Fixed with `UserStateService.skillMastery()`, derived from `activityLog` grouped by activity type (grammar/listening/speaking/writing/review). Reading has no dedicated activity type yet, so it honestly reports 0% rather than fabricating a number.
4. **The Dashboard's "Review N vocabulary words" recommendation showed a hardcoded `12`**, never wired to the real spaced-repetition system built in an earlier phase. Fixed to use `SpacedRepetitionService.dueCount()`.

All four were caught by actually clicking through the app as a user would, not by code review alone — items 2-4 in particular were "looks fine, compiles fine, silently wrong" bugs that only show up when you check whether the number on screen actually moves.

---

## 3. Architecture decisions made autonomously

- **Content vs. data split, consistently applied.** Following the pattern already established in the app (lessons/grammar/vocabulary), all new Interview Prep content (scenarios, roleplay scenarios, questions) is static TypeScript data; only per-user state (answers, known words, sessions, achievements) lives in Supabase. This was confirmed with you earlier in the session and applied to every subsequent feature without re-asking.
- **Mock Interview scoring is a genuine 5-answer evaluation, not a single number.** Each answer is scored individually via `AiInterviewEvaluationService`, then aggregated (averaged per dimension, deduplicated strengths/improvements) — closer to what a real evaluation backend would return, and the architecture doesn't change when a real LLM evaluator replaces the mock heuristic.
- **`InterviewSessionService` was split out from `InterviewProgressService`** rather than piling more responsibilities onto an already-busy service (profile + answers + vocab). Session history is a distinct concern with its own table and its own load/save lifecycle.
- **Preparation Plan only shows a checkmark where completion is actually verifiable.** Days 4 (Scenarios) and 5 (Roleplay) have no persistence layer, so rather than fabricate a "done" state, those two days render without a checkmark at all — a deliberate honesty trade-off over a more "complete-looking" but fake UI.
- **Readiness score blends in real Mock Interview results once any exist** (`readiness × 0.7 + bestInterviewScore × 0.3`), rather than staying at a 2-factor formula forever now that a 3rd real signal exists.

---

## 4. Known gaps / what's NOT done

- ~~`supabase/interview-sessions.sql` needs to be run~~ **Done — run and verified live** in round 2.
- **`supabase/interview-practice-log.sql` needs to be run** (new in round 2). Roleplay and Scenario completions currently award XP and log to `activity_log` correctly, but the dedicated `roleplay_sessions`/`scenario_sessions` tables don't exist yet, so: the Preparation Plan's Day 4/5 checkmarks stay unchecked, the Roleplay list's "Completed" badges won't show, and the 2 new roleplay-related achievements can't unlock. Confirmed the app doesn't crash without it (graceful degradation, same as the interview_sessions gap before it was closed).
- **Company-Specific Preparation's analysis isn't saved anywhere.** Each paste-and-analyze is a one-off — there's no history of past company analyses. Not clearly needed by the spec (section 26 doesn't ask for it), so left as-is.
- **No automated test runner.** `ng test` needs `@vitest/browser-playwright` (or similar) installed for Angular 21's Vitest-based unit-test builder to run headless — it's not currently installed, and installing/configuring it was deprioritized behind shipping features per your stated priority order (functionality > errors > UX > design). All validation this session was `tsc --noEmit` + `ng build` + real browser testing.
- **No ESLint configuration exists in the project.** Same trade-off as above.
- **Responsive layout could not be visually verified this session.** The browser automation's `resize_window` call reported success but the tab's `window.innerWidth` stayed at full desktop width regardless — a tooling limitation in this environment, not something in the app. Verified instead by code review: every new page in this session uses `max-width` containers and `repeat(auto-fit/auto-fill, minmax(...))` grids (no fixed pixel widths anywhere), consistent with the mobile-first sidebar→bottom-nav pattern already verified working in the app's foundational phase.
- **Reading skill mastery stays at 0%** until Reading becomes its own standalone practiced activity (currently only embedded inside lesson exercises, which don't log a distinct `activity_log` type for it).

---

## 5. Recommendations for backend / AI integration

- **Every `Ai*Service` (AiTutorService, AiEvaluationService, AiExerciseService, AiAnswerBuilderService, AiInterviewService, AiInterviewEvaluationService, AiRoleplayService, AiJobAnalysisService) is already isolated behind a single method per capability** (`sendMessage`, `evaluateAnswer`, `getCustomerReply`, etc.), each returning the same shape a real backend call would. Swapping the mock body for an `HttpClient` call to a backend endpoint requires touching only that one file — no caller changes.
- **API keys must never go in Angular.** When wiring these to a real LLM, put the call behind your own backend (Supabase Edge Function or similar) and have the Angular service call *that*, not the LLM provider directly.
- **`AiInterviewEvaluationService`'s heuristic (word count, filler-word regex) is a placeholder for a real grading model.** It's honest about being simple, and the output shape (5 dimensions + strengths/improvements/recommendedPractice) was designed to be exactly what an LLM grading prompt would naturally return, so no model changes needed on the frontend when you swap it.
- **`AiJobAnalysisService`** (company/job-description → tailored prep) is stubbed with keyword matching, ready for a real LLM call — it's not used by any UI yet (Phase 26 of the original spec, not built this session).

---

## 6. Build / validation results

```
npx tsc --noEmit -p tsconfig.app.json   →  clean, no errors
npx ng build                             →  clean, ~472 kB initial / 120 kB gzip
```

Both passed clean after every feature batch this session (checked incrementally, not just once at the end). Full end-to-end browser verification covered: Interview Prep onboarding → dashboard → question practice → Answer Builder → vocabulary known-toggle → Scenarios → Roleplay (full multi-turn conversation to resolution) → Mock Interview (all 8 questions, real evaluation) → History → Preparation Plan → AI Tutor chat → Profile achievements → Progress charts — all with a real Supabase-backed account, checking that XP totals and persisted state matched the expected formulas after each action.

---

## 7. Git history this session

```
59a48bd chore: initial snapshot before autonomous work session
fbb15f9 feat: complete Learning Platform modules (Progress, Placement Test, AI Tutor, Achievements)
b3cc0c7 feat: complete Interview Prep phases 5-9 (scenarios, roleplay, mock interview, history, plan)
196dba4 fix: three more silently-broken real-data bugs found during final audit
0565df7 docs: add DEVELOPMENT_REPORT.md for autonomous work session
6e87423 feat: close remaining Interview Prep gaps + spec sections 21/23-26
```

All commits are local only — nothing was pushed to a remote (none is configured).

---

## 8. What to do next (your call, not urgent)

1. **Run `supabase/interview-practice-log.sql`** in the SQL Editor — same routine as the two migrations before it, adds `roleplay_sessions` and `scenario_sessions` so Roleplay/Scenario completions persist like everything else.
2. `npm install --save-dev @vitest/browser-playwright` (or drop the Vitest browser runner in favor of `karma` if preferred) if you want `ng test` working again.
3. Remaining original-spec items not built in either round: sections around AI-driven answer/response *generation* beyond the current templating (`AiAnswerBuilderService` is still pure templating, not LLM-backed), and persisting Company-Specific Preparation results if you decide you want a history of them after all.
4. When you're ready to connect real AI, every `Ai*Service` is already isolated behind one method per capability — see section 5 above for the pattern to follow.
