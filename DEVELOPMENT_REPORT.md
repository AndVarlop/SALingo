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
- ~~`supabase/interview-practice-log.sql` needs to be run~~ **Done — run and verified live** in round 3: completed a fresh roleplay, full-reloaded, and confirmed the "Completed" badge shows on the Roleplay list and Preparation Plan Day 5 is checked off from real Supabase data (3/7 days done).
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

---

## 9. Fase 3 — AI Career & Interview Coach (P0 slice)

Repertoire expansion first: **Listening 5→20, Speaking 4→16, Writing 4→12, Lessons 3→9** (new A1 Pronouns/Articles, A2 Future/Comparatives, B1 Conditionals/Passive Voice — rechained into a linear `order`/`requiresLessonIds` progression). Zero component changes needed since those pages consume their data arrays directly.

Then the P0 "coach" layer — turning existing signals into job-readiness guidance instead of adding new pages:

### New files
- `core/models/career-coach.model.ts` — `JobReadyScore`/`JobReadyBreakdown`, `Weakness`, `RecommendedActivity`, `MistakeRecord` (defined, not yet wired to a UI — see gaps below), `InterviewEvaluation` (full 9-dimension shape per the spec, ready for a real evaluator to populate; `AiInterviewEvaluationService` still only fills a subset), `CandidateProfile`.
- `core/services/career-coach.service.ts` — the engine. Reuses `UserStateService`, `VocabularyService`, `InterviewSessionService`, `InterviewProgressService` and `RecommendationService` rather than duplicating their state.

### Job Ready Score formula
Weighted average of six dimensions, each `null` until real data exists (never fabricated):

| Dimension | Weight | Source |
|---|---|---|
| English | 20% | CEFR level position on the 6-band scale (A1≈17% … C2=100%) |
| Speaking | 20% | `skillMastery()` for Speaking (from activity log accuracy) |
| Interview | 20% | `InterviewSessionService.averageScore()` |
| Customer Service | 15% | `InterviewProgressService.readiness()` (questions practiced + vocab known) |
| Vocabulary | 15% | Average mastery of studied words (`VocabularyService`) |
| Confidence | 10% | Average of Interview + Speaking (no dedicated instrument yet — documented approximation) |

Missing dimensions are excluded and remaining weights renormalized. The score only renders once ≥2 dimensions have data **and** the activity log has ≥3 entries; otherwise the UI shows "Not enough data yet" with a hint of what to do next (dashboard, `jobReadyScore().missingDataHint`).

### Weakness Engine
`careerCoach.weaknesses` ranks the lowest-scoring skills (from `skillMastery()`, excluding ones with no data) plus "Interview Confidence" when an interview average exists, ascending, top 4 — each with a direct practice link. Verified live: correctly surfaced `Interview Confidence 62% → Speaking 75% → Writing 80% → Grammar 92%` for the test account.

### Recommended activities
`careerCoach.recommendedActivities` wraps `RecommendationService.recommendations()` (not duplicated) with estimated minutes, then appends one interview-specific suggestion: "Complete your first Mock Interview" if none exist yet, or "Handle an Angry Customer" (roleplay) if the interview average is below 70%. Dashboard now renders this instead of the old bare recommendation list, plus new "Job Ready Score" and "Your biggest weaknesses" cards — verified live with a real account (screenshot-checked, no console errors).

### Adaptive Mock Interview (rule-based, AI-ready)
`AiInterviewService.pickNextQuestion(pool, previousAnswerText, profile?)` replaces the old "shuffle once and slice" approach. `MockInterviewComponent` now keeps a `remainingPool` signal and asks the picker for one question at a time; the picker scans the previous answer for keywords (sales, no-experience, teamwork, conflict, leadership) and prefers a pool question matching that topic, falling back to random. This is intentionally simple (keyword rules, not an LLM) but the method signature is the one a real adaptive-question backend would implement, so swapping the body later requires no caller changes. Verified live: interview starts, asks question 1/8, accepting an answer mentioning "sales" advances correctly to question 2/8 with no console errors.

### Known gaps in this slice (explicitly deferred, not forgotten)
Per the phased-rollout rule ("don't build everything at once"), P0 items **not yet built**: Call Center Simulator, Pronunciation Coach, Resume Analyzer, Company Preparation 2.0, "Am I Ready?" assessment, My Mistakes (the `MistakeRecord` model exists but nothing writes to it yet — no error-capture hook wired into Mock Interview/Roleplay evaluation), Career Path/Tracks visualization, 24-Hour Interview Mode. These are the next slice — each can reuse `career-coach.service.ts` and the existing session/evaluation services rather than needing new infrastructure.

### Call Center Simulator (evolved from Roleplay, not rebuilt in parallel)
Roleplay already *was* a call simulator in disguise (12 customer-service scenarios, "📞 Answer the call" CTA, live conversation via `AiRoleplayService`) — per the reuse rule this became the base instead of a new parallel module:
- `CallCategory` added to `RoleplayScenario` (Billing/Technical Support/Cancellation/Refund/Sales/Delivery/Account/Angry Customer/Escalation/Retention) — all 12 existing scenarios tagged, plus 2 new ones (`rp-13` Cancellation, `rp-14` Sales inquiry) to cover every category from the spec.
- `CallFlowScoringService` (new, `core/services/call-flow-scoring.service.ts`): keyword-rule scoring of the full agent transcript against the Greeting → Identification → Verification → Understanding → Empathy → Investigation → Solution → Confirmation → Closing checklist. Conditional steps (identification/verification/investigation/confirmation) only count when the scenario has `availableInfo` to look up, so a simple call isn't penalized for skipping a lookup it never needed.
- Roleplay session UI: "📞 INCOMING CALL" framing + category badge on the intro screen, and a "Call performance" breakdown (per-step ✅/➖ + %, plus overall) on the result screen, alongside the existing confidence/professionalism/clarity/relevance scores.
- Verified live end-to-end: started the new Cancellation scenario, held a full conversation using greeting/empathy/confirmation/closing phrases, finished it, and got a real 89% overall Call Performance score with "Verification" correctly flagged as the one skipped step (I never asked for identity info) — no console errors, XP awarded correctly.

### My Mistakes (P1)
- **New migration: `supabase/mistakes.sql`** — needs to be run (same routine as the previous ones). Creates `user_mistakes` (unique per `user_id, wrong_text`, so repeats increment `occurrences` instead of duplicating rows) with the standard owner-only RLS policy.
- `MistakeDetectionService` (new): ~20 regex rules for common Spanish-speaker ESL errors relevant to call-center English ("I have 5 years working" → "...of experience working", "I am agree" → "I agree", "peoples" → "people", "explain me" → "explain to me", etc). Rule-based and explicitly documented as a stand-in for a real grammar-checking model — same output shape either way.
- `MistakeMemoryService` (new): persists detected mistakes, groups by category, and exposes `dueForReview` (not reviewed in 3+ days — a simple staleness check, explicitly *not* the SM-2 algorithm vocabulary uses, since a mistake isn't scheduled the same way a new word is).
- Wired into `finishInterview()` (Mock Interview) and `finishRoleplay()` (Call Simulator) — every completed answer/call is scanned automatically, no extra user action.
- New `/interview-prep/mistakes` page: grouped by category, shows wrong→correct, source, occurrence count, days since last seen, and a "Mark as reviewed" action. Linked from the Interview Prep hub.
- **Verified live end-to-end** (in-memory, before the migration was run — confirms graceful degradation too): completed a Mock Interview repeating "I have 5 years working... I am agree that...", navigated to My Mistakes, saw all 3 mistakes correctly extracted, deduplicated to 3 rows with `occurrences: 8` each (one per question), grouped under Grammar, "Mark as reviewed" updated `lastSeenAt` with no console errors. Also verified the failure path: with the table not yet created, `MistakeMemoryService.load()` catches the error, logs it, and the page still renders its empty state cleanly — no crash.

### Pronunciation Coach (P1)
- `SpeechRecognitionService.listenAndAnalyze()` (new method, additive — the original `listen()`/`scoreTranscript()` used by Speaking exercises are untouched): times the recording and returns `PronunciationResult` — recognition match score, missed words, words-per-minute, duration. Explicitly documented (in code and in the UI) as recognition accuracy + pace, **not** phonetic pronunciation quality — the browser can't judge accent, only whether it understood the words. No invented precision.
- `TextToSpeechService` (new, thin `speechSynthesis` wrapper): "Listen" button plays the correct pronunciation before the user attempts it.
- New `/pronunciation-coach` page + sidebar nav entry: reuses `MOCK_SPEAKING_EXERCISES` content (no new data file) — listen → record → see score/WPM/missed words → next sentence. Falls back gracefully with a visible warning when `SpeechRecognition` isn't supported (still allows Listen via TTS).
- Verified live: page renders, correct sentence (1/16, confirming it reads the already-expanded Speaking set), Listen button fires with no console errors. Actual microphone recording was **not** exercised in this session (no mic in the automated browser environment, and triggering a real permission prompt risked hanging the automation) — worth a manual check in a real browser with a microphone.

### Company Prep 2.0 + Personalized Interview (P1)
- `AiJobAnalysisService.analyze()` return shape expanded per spec §23: `companyProfile`, `technicalVocabulary` + `customerServiceVocabulary` (previously one merged list), `interviewStrategy`, plus the existing `possibleQuestions`/`skillsToHighlight`/`suggestedPreparation`. Keyword detection widened (sales/technical/remote/fast-paced) so the profile text and strategy actually vary with the pasted job description.
- Company Prep UI: added Company Profile, Interview Strategy sections; renamed "Relevant vocabulary" into its two halves.
- **"Start Personalized Interview" now really does something**: navigates to Mock Interview passing the generated questions through Angular Router state (`personalizedQuestions`/`personalizedCompany`/`personalizedPosition`). Mock Interview merges them into its adaptive question pool (same `pickNextQuestion()` picker from the earlier P0 work — no parallel logic) and shows a "🚀 Personalized for {company}" badge on the setup screen.
- Still not persisted: a generated analysis is lost on refresh (pre-existing gap, called out in the original report — still true, not addressed this round).
- Verified live end-to-end: pasted a technical/remote/fast-paced job description for "Acme Support Co.", got a correctly-tailored profile ("technical support / SaaS-style", "Working under pressure" skill chip, remote-focused question), clicked Start Personalized Interview, saw the badge on setup, started the interview and got a real question pulled from the merged pool — no console errors.

### Build/verification
`tsc --noEmit` clean, `ng build` clean (one non-blocking CSS budget warning on `roleplay-session.scss`, 116 bytes over 4kB — cosmetic, not fixed this round). Dashboard, adaptive Mock Interview, Call Center Simulator, My Mistakes, Pronunciation Coach (except live mic capture), and Company Prep 2.0 → Personalized Interview all checked live in Chrome against the real Supabase-backed test account.

**Action needed from you:**
1. Run `supabase/mistakes.sql` in the SQL Editor to persist mistakes across sessions (works today without it, just doesn't survive a reload). **Done — confirmed run and verified live: a Mock Interview's mistakes survived a full page reload.**
2. Manually try Pronunciation Coach's "Record my answer" with an actual microphone — it wasn't exercised by automation this round.

---

## 10. Fase 3 P2 — 24-Hour Interview Mode + Speaking Warm-up

- `PreparationPlanComponent` now branches on `interviewProgress.profile().interviewDate` (already existed from onboarding, just wasn't used for this): if the interview is today or tomorrow, it swaps the 7-day plan for a **condensed same-day intensive plan** — "Tell me about yourself" → "Common questions" → "Call Center Vocabulary" → "Customer Service Roleplay" → "Mock Interview" → **"Review your mistakes"** (reuses the new My Mistakes page) → **"Speaking Warm-up"** (new, below). No new service — pure reuse of `InterviewProgressService`/`InterviewSessionService` already injected into that component.
- New `/interview-prep/warmup` page (spec §20): 5-prompt speaking warm-up (introduce yourself → experience → why this job → a difficult-customer scenario → one random real question pulled from `InterviewQuestionService`). No scoring — it's meant to loosen someone up right before the real thing, not add pressure. Ends with "You're warmed up. Good luck!" and a direct link into Mock Interview. Awards a small XP for showing up.
- Added `InterviewProgressService.updateInterviewDate()` + a "When is your interview?" date field directly on the Preparation Plan page, so this isn't a one-shot onboarding-only value — closes the gap of not being able to set/change it later.
- **Verified live end-to-end**: set the date field to today via the UI, page instantly switched from the 7-day plan to "⏰ My Interview Is Tomorrow" with correct real completion checkmarks (already-completed Mock Interview/Roleplay steps showed ✓), cleared the date back to null afterward to leave the test account clean. Also ran the full 5-step Speaking Warm-up flow end to end, reached the "warmed up" screen. No console errors either time.

### Build/verification
`tsc --noEmit` clean, `ng build` clean (same pre-existing CSS budget warning, unrelated).

## 11. Fase 3 P2 — Career Path

- New `CareerPathService` (spec §27): 7 stages (English → Call Center English → Customer Service → Interview Prep → Roleplay → Mock Interview → Job Ready), each with a real `percent`/`completed` derived from data already tracked elsewhere — lesson completion, interview vocab/question practice counts, `InterviewProgressService.readiness()`, `InterviewSessionService` counts, and `CareerCoachService.jobReadyScore()`. No new state, no invented numbers. Goal thresholds (5 roleplays, 3 mock interviews, 75% Job Ready) are documented constants at the top of the service, easy to retune.
- New `/career-path` page + sidebar nav entry: vertical stepper, current stage highlighted (first incomplete stage), each with a progress bar and a "Continue"/"Review" link into the right feature.
- Verified live: real percentages rendered correctly for the test account (English lesson progress, Mock Interview already ✓ from earlier testing since it had 3+ sessions, Job Ready bar matching the Dashboard's number), no console errors.

### Build/verification
`tsc --noEmit` clean, `ng build` clean (same pre-existing CSS budget warning, unrelated).

## 12. Fase 3 P2 — Career Tracks

- Spec §28: `CAREER_TRACKS` config (`core/services/mock-data/career-tracks.data.ts`) — 6 tracks (Customer Service, Technical Support, Sales, Collections, Chat Support, Back Office), each just a thin config on top of what already exists: an `InterviewPosition` (drives question filtering via the existing `InterviewQuestionService.forPosition()`) and a set of `CallCategory` values (drives roleplay scenario filtering against the existing `MOCK_ROLEPLAY_SCENARIOS`). No parallel content system — adding a 7th track is one array entry.
- `InterviewProgressService.updateTargetPosition()` (new, mirrors `updateInterviewDate`) lets a user change their track after onboarding, not just once during it.
- New `/interview-prep/tracks` page + hub tile: a grid of track cards, each showing real counts (`X questions`, `Y calls`) pulled live from the existing content, "✓ Current track" badge, "Choose this track" writes the position and returns to the Interview Prep hub.
- **Verified live end-to-end**: switched the test account from Customer Service to Technical Support, confirmed the Interview Prep hub badge and readiness numbers recalculated correctly against the new position filter (question counts and progress % changed), then switched back to Customer Service to leave the account clean. No console errors.

### Build/verification
`tsc --noEmit` clean, `ng build` clean (same pre-existing CSS budget warning, unrelated).

## 13. Fase 3 P2 — Gamification 2.0

- 4 new achievements added to the existing `MOCK_ACHIEVEMENTS` catalog (17 → 21), reusing the same evaluate-on-context-change engine — no parallel gamification system: **🔥 7 Interviews** (7 Mock Interviews), **💯 Perfect Interview** (100 on a Mock Interview), **🎤 Speaking Master** (90%+ Speaking mastery, from `skillMastery()`), **💼 Job Ready** (75%+ Job Ready Score, from `CareerCoachService`).
- `AchievementContext` extended with `speakingMasteryPercent` and `jobReadyScore` — both derived from services already injected elsewhere, nothing new tracked.
- Verified live: Profile page achievement count went from 17 to 21 total, all 4 new achievement cards render correctly with the right title/description/lock state, no console errors.

### Build/verification
`tsc --noEmit` clean, `ng build` clean (same pre-existing CSS budget warning, unrelated).

## 14. Fase 3 P2 — Advanced Analytics

- New `AdvancedAnalyticsService` (spec §30): a "this week vs last week" comparison across Study time, XP earned, Speaking accuracy, Interview accuracy, Vocabulary reviews, and Mistakes reviewed. All derived from `activityByDate`/`activityLog` (already loaded) and `MistakeMemoryService` — no snapshots, no new tables. Per the no-fake-data rule, a metric with no matching entries reports `null` and the UI shows "Not enough data yet" instead of a misleading 0% change; a metric with data but no prior week shows "New" instead of a fabricated percentage.
- Progress page: new "Weekly report" card between the XP chart and skills breakdown, with a computed `trendLabel()` (+X%/-X%/New) per metric.
- Verified live: real numbers for the test account (36 min, 725 XP, 75% Speaking, 81% Interview, 0 vocabulary sessions, 3 mistakes reviewed — all correctly labeled "New" since the account has no prior-week baseline yet), no console errors.

### Build/verification
`tsc --noEmit` clean, `ng build` clean (same pre-existing CSS budget warning, unrelated).

**Fase 3 P2 complete (5/5): 24-Hour Interview Mode + Speaking Warm-up, Career Path, Career Tracks, Gamification 2.0, Advanced Analytics.**

## 15. Fase 3 P3 — Tests, ESLint, PWA

- **Tests**: 33 tests across 7 files added, prioritized per the spec (services/scoring/adaptive-learning/interview-logic/spaced-repetition first). `ng test` (Vitest via `@angular/build:unit-test`) already worked with zero extra tooling — the earlier "needs `@vitest/browser-playwright`" note in this report was stale/unnecessary. Not aiming for coverage %, aiming at the logic that's wrong-and-silent if it breaks: the Job Ready Score formula (gating, no-fabrication, weighting, monotonicity), Weakness ranking, Call Flow scoring, Mistake detection, adaptive question picking, and the spaced-repetition interval/difficulty math.
- **ESLint**: `ng add @angular-eslint/schematics`, then fixed all 11 real findings it surfaced (3 ternary-as-statement bugs rewritten as if/else, one genuinely dead const removed, 6 `any` usages in `SpeechRecognitionService` replaced with real minimal types). `ng lint` is 0 errors on a clean run — not just configured, actually clean.
- **PWA**: `ng add @angular/pwa` — service worker (disabled in dev mode, standard Angular default), manifest rebranded to SALingo (name, theme/background colors pulled from the real `--color-primary`/`--color-bg` tokens, not guessed). **Known gap: the app icons are the Angular CLI's generic placeholder icons** (`public/icons/*.png`) — no image-generation tool available in this session to produce real SALingo-branded icons. Swap those 8 PNGs for real branded assets before treating the "Add to Home Screen" experience as finished.
- Not done this round: bundle-size/performance profiling (current initial bundle is ~479kB raw / ~123kB gzip, well under the 500kB budget — no evidence of a real problem to fix, and rule 37 says measure before optimizing prematurely).

### Build/verification
`tsc --noEmit` clean, `ng lint` clean (0 errors), `ng test` 33/33 passing, `ng build` clean (same pre-existing non-blocking CSS budget warning) and confirmed `ngsw-worker.js`/`ngsw.json`/`manifest.webmanifest` present in the build output.

## 16. Full Audit + Top 20 fixes + Skill Engine Phase 1 + Gamification Phase 2

Two documents preceded this round of work: `SALINGO_FULL_AUDIT.md` (a fresh 40-point audit against the actual running app — personas, readiness scores, a prioritized Top 20) and `SALINGO_GAMIFIED_LEARNING_STRATEGY.md` (a product-direction document: SALingo should feel like LEARN → PRACTICE → PLAY → MAKE MISTAKES → LEARN FROM MISTAKES → LEVEL UP, not a traditional LMS, with mini-games/exams feeding one unified Skill Engine → Weakness Detection → Recommendation pipeline). This section covers implementing that direction.

### 16a. Top 20 audit fixes (9 items, non-AI)
Fixed real bugs the audit found, each with its own tsc/lint/test/build/live-verify cycle: Placement Test wasn't linked from anywhere in the nav; Writing's `grammarScore` measured text length instead of grammar (real formula bug); Roleplay's "customer" gave 3 fixed canned replies across all 14 scenarios regardless of what the agent typed (now scored against `expectedResolution` via word-overlap); Job Ready Score was missing a Grammar dimension entirely; Preparation Plan only had a 7-day-out and same-day plan, nothing for 2-5 days out; Answer Builder was hardcoded to one specific question despite every question linking to it; Company Prep analysis and Tips checklist didn't persist across reloads; there was no way to record a real interview/job outcome anywhere in the app; AI Tutor's "correction" mode always said "That's a great sentence!" regardless of input, contradicting its own UI copy — now runs `MistakeDetectionService` for real. New `job_outcomes` table + "My Results" page shipped and its migration was confirmed run and live-verified (a real Supabase insert survived a full page reload).

### 16b. Skill Engine Phase 1 — sub-skill tags
- `ActivityLogEntry` gained an optional `skillTag` (namespaced string like `grammar:past-simple`, `vocab:business`, `customer-service:billing`, `interview:call-center-agent`) — `supabase/skill-tags.sql` adds the matching `activity_log.skill_tag` column. **This migration has not been confirmed run by the user yet** — until it is, per-session skill tags work but don't persist across reloads (local-first optimistic writes still succeed; only the Supabase insert of that one column fails, logged as a console error, never silently swallowed).
- `UserStateService.masteryByTag` — a computed aggregating average accuracy per tag across the activity log.
- `CareerCoachService.weakestSkillTags` — the top 5 lowest-scoring tags, humanized into a readable label (`grammar:past-simple` → "Past Simple"). Empty (never fabricated) when there's no tagged activity yet.
- Wired into the 4 activities that already existed: Grammar topic tests, Vocabulary review sessions, Roleplay calls, Mock Interview.

### 16c. Gamification Phase 2 — three mini-games + a reusable Exam Engine
All three mini-games share one shape (proven out with Grammar Battle, then reused verbatim for the other two): timed rounds, a streak counter with a capped XP bonus, one `recordActivity()` call at session end tagging the dominant skill played, zero new content — every question/round comes from services that already exist.
- **Grammar Battle** (`/grammar-battle`): timed multiple-choice pulled from every grammar topic's existing exercises; opens with the user's weakest grammar tag first if the Skill Engine has detected one.
- **Vocabulary Rush** (`/vocabulary-rush`): timed term→translation matching from `VocabularyService.words()`; guards on having ≥4 words loaded.
- **Find the Mistake** (`/find-the-mistake`): correct-vs-has-a-mistake judgment calls. Added `MISTAKE_EXAMPLE_SENTENCES` to `MistakeDetectionService` (one real sentence per existing rule) so the game's entire question bank comes from the same 20 rules that already power AI Tutor/Writing/Mock Interview corrections — zero new mistake logic. Missed mistakes feed into Mistake Memory like every other surface.
- **Exam Engine** (`core/models/exam.model.ts`, `ExamEngineService`, `ExamRegistryService`, `/exam/:id`): a real reusable engine — `ExamDefinition → ExamSection → ExamQuestion`, evaluated into per-section scores + per-skill-tag breakdown + weakest tags, one activity recorded per skill tag touched (not one blended entry) so results stay as granular as everything else feeding the Skill Engine. Adding a new exam is one `build*Exam()` method in the registry; the runner UI and scoring never change. Two exams shipped from existing content: **Grammar Exam** (one section per CEFR level) and **Vocabulary Exam** (one section per category).

Two real bugs were caught during live verification of the Exam Engine (not in review — both looked fine until actually played end-to-end):
1. Grammar exercise ids (`ex-1`, `ex-2`, …) are reused across every topic, not globally unique. Using them as the answer-Map key made selections collide across topics, silently undercounting the score (a session where every answer was correct scored 8/13 instead of 13/13). Fixed by namespacing ids as `topicId:exerciseId`.
2. A genuine race condition: navigating straight to `/exam/vocabulary-exam` without ever visiting `/vocabulary` first built the exam before `VocabularyService`'s Supabase fetch had loaded any words, permanently landing on "exam not found" — because `VocabularyService.loading` defaulted to `false` (meaning "no fetch has happened", not "data is ready"). Fixed the default (now starts `true`, only flips false once a fetch actually settles — this also fixes a latent flash-of-"No words found" on the Vocabulary hub page itself) and switched the exam runner to load via a reactive `effect()` instead of a one-shot constructor call.

### Build/verification
Every item in 16a/16b/16c went through its own `tsc --noEmit` → `ng lint` → `ng test` → `ng build` → live Chrome verification cycle before being committed; all currently green (`ng test`: 56/56, `ng lint`: 0 errors, `ng build`: clean apart from the pre-existing non-blocking `roleplay-session.scss` budget warning). Live verification used `window.ng.getComponent()` to drive components directly (reading real round/question state rather than blind-clicking), confirming XP header totals, result screens, and Supabase network requests where relevant.

## FINAL STATUS (this session)

**Completed**: Full 40-point product audit (`SALINGO_FULL_AUDIT.md`) and gamification strategy document (`SALINGO_GAMIFIED_LEARNING_STRATEGY.md`, analysis only, no code). 9 Top 20 audit fixes (non-AI). Skill Engine Phase 1 (sub-skill tags, masteryByTag, weakestSkillTags, wired into 4 existing activities). Gamification Phase 2 (3 mini-games + a reusable Exam Engine with 2 exams). 2 real bugs found and fixed via live verification, not assumed-safe from code review alone.

**Remaining (reasonable next P1/P2 work, none externally blocked)**:
- Find the Mistake / Grammar Battle / Vocabulary Rush have no dedicated `.spec.ts` files (verified live instead, consistent with how they were built, but a unit test on the scoring/streak math would still be worth adding).
- More exams could be added to the registry with no engine changes: Listening Exam, Customer Service Exam, Interview Exam, Job Readiness Exam (the strategy doc's full list) — each is one `build*Exam()` method.
- Daily Challenges, Missions, Boss Challenges (strategy doc §15-17) — not started; each needs its own small data model, but can reuse the mini-games/exams above as their underlying activities rather than inventing new content.
- Call Center Simulator evolution (multi-turn scenario trees beyond the current single-resolution Roleplay) and AI Interviewer evolution (resume/job-description-aware interviews) — both explicitly deferred pending the AI backend decision below.

**Known limitations**:
- Find the Mistake / Grammar Battle / Vocabulary Rush lack dedicated unit tests (see above).
- PWA icons are still the Angular CLI placeholders (pre-existing gap, unrelated to this round).

**External dependencies**: Task #63 remains open — whether/which real AI backend (LLM provider, hosting) SALingo should integrate for AI Tutor/Roleplay/Mock Interview/Resume Analysis is an explicit product + credentials decision only the user can make. Every AI-adjacent service in the app already follows the "Angular → documented mock/interface, never an API key in the client" rule so swapping in a real backend later is additive, not a rewrite.

**Recommended next steps**: decide the AI backend question (#63); then either build Daily Challenges/Missions on top of the mini-games/exams that now exist, or keep expanding the Exam Engine's registry (cheapest incremental value, same pattern already proven twice).

## 17. Adaptive Learning Home redesign

Closed out the "biggest remaining piece" noted in the previous FINAL STATUS. The Dashboard is now built around a real "What should I do today?" hero — `recommendedActivities()[0]` (RecommendationService's top pick, which as of the prior commit can point at a specific mini-game when a skill tag is genuinely weak) leads the page instead of being buried in a list further down. Added a compact 3-up "Today's goal / Level progress / Interview readiness" row for an at-a-glance status check, consolidated the now-redundant duplicate recommendation display, and paired up the previously-orphaned "This week" card with "Weaknesses" so nothing sits alone in a half-empty grid row. Zero new/fabricated data — everything comes from `RecommendationService` / `CareerCoachService` which already existed and were already correct; this was a reorganization, not a new data pipeline.

One real type error caught by `tsc` (not by review): binding `jobReadyScore().overall` (typed `number | null`) directly to `ProgressBarComponent`'s required `number` input, inside an `@if` branch that only narrows the type at runtime, not for Angular's template type-checker. Fixed with `?? 0` (the `@if (hasEnoughData)` guard means the fallback is never actually reached).

### Build/verification
`tsc --noEmit` clean, `ng lint` clean (0 errors), `ng test` 56/56 passing, `ng build` clean (same pre-existing non-blocking budget warning). Live-verified: hero showed the real top recommendation for the test account, quick-stats row correct (Interview readiness 60%), remaining recommendations list didn't repeat the hero's item, full Job Ready Score breakdown and Weaknesses rendered with real data, hero's primary CTA navigated correctly end-to-end. No console errors.

## 18. `supabase/skill-tags.sql` migration confirmed run

User confirmed the migration was applied. Live-verified cross-session persistence the same way `job_outcomes` was verified earlier: played a full Grammar Battle round (10/10, `grammar:gr-a1-plural-nouns`), then did a real full browser navigation (not an in-SPA route change) to force `UserStateService` to refetch from Supabase from scratch. `masteryByTag()` came back populated with the real tag data — including the just-played round — and the Dashboard's weak-tag recommendation ("Battle your weak spot: Verb To Be") still resolved correctly against the fresh data. No console errors. `skill_tag` now persists correctly; the Skill Engine's data layer is no longer session-local.

## 19. Everything that was "remaining, non-blocked" — now done

User asked to clear out what was left before tackling the AI backend question. Four items, in order:

- **Unit tests for the 3 mini-games** (Grammar Battle, Vocabulary Rush, Find the Mistake): 16 new tests, the app's first component-level specs (everything before was service specs). `TestBed.createComponent()` + fake providers, protected members accessed via a typed cast interface (documents which internals the test touches instead of scattering `as any`), fake timers for the round-advance `setInterval`/`setTimeout` logic, `provideRouter([])` so `RouterLink` resolves during component creation.
- **Listening, Customer Service and Job Readiness exams**, via the existing `ExamRegistryService` pattern — no engine or runner changes needed. Listening Exam reuses all 20 `MOCK_LISTENING_EXERCISES`; Customer Service Exam generates term→translation questions from the 55-word call-center vocabulary bank, one section per category; Job Readiness Exam mixes 4 real questions from each of Grammar/Vocabulary/Listening/Customer Service into one "how ready am I overall" exam. Deliberately did **not** build a standalone Interview Exam — every existing interview question is open-ended with no correct-answer key, and inventing multiple-choice trivia to fill that gap would have broken the "zero new content" rule every other exam here follows; documented that decision in the registry instead of silently skipping it.
- **Daily Challenge**: a new `DailyChallengeService` presents the top 3 `recommendedActivities()` as a real checklist on the Dashboard, checked off against today's actual activity log, with a one-time XP bonus when all 3 are done (guarded against double-awarding via a date-keyed local flag). Scoped "Daily Challenges **+ Missions**" down to just Daily Challenge: Missions — the strategy doc's "Introduce Yourself → ... → Pass a Job Interview" progression — turned out to already exist as `CareerPathService`/`/career-path`, a 7-stage sequential progression with real completion checks, shipped earlier this session under a different name. Building a second Missions system would have duplicated it; documented the decision instead.

Two real, non-trivial things were caught during this stretch (not assumed away):
1. `tsc` caught a `number | null` bound directly to a required `number` input inside an `@if` branch the template type-checker doesn't narrow — fixed with `?? 0`.
2. `TestBed.tick()` was required to flush `DailyChallengeService`'s `effect()` in tests — confirmed by first watching the "awards the bonus" test genuinely fail (0 calls) before adding the flush, not assumed necessary in advance.

### Build/verification
Every item above went through its own `tsc --noEmit` → `ng lint` → `ng test` → `ng build` → live Chrome verification cycle before being committed. Current state: `ng test` 78/78 passing, `ng lint` 0 errors, `ng build` clean (pre-existing `roleplay-session.scss` budget warning only, unrelated to this work).

## FINAL STATUS (updated)

**Completed, this stretch**: unit tests for all 3 mini-games; Listening/Customer Service/Job Readiness exams (Exam Engine registry now has 5 exams total); Daily Challenge with real completion tracking and a guarded one-time bonus; confirmed `skill-tags.sql` migration persistence live.

**Remaining**: nothing non-AI-blocked and reasonably scoped is left outstanding. What's left is either (a) genuinely AI-dependent (Call Center Simulator's multi-turn scenario trees, AI Interviewer's resume/job-description awareness — both need task #63 resolved first), or (b) small polish items already logged as known limitations below (not re-listed as "remaining" since they're not blocking anything).

**Known limitations**: PWA icons are still Angular CLI placeholders (unrelated pre-existing gap). Daily Challenge's bonus-award guard is per-device (documented tradeoff, not a bug). Job Readiness Exam's `activityType` is one value across 4 real domains (documented simplification — `skillTag`, which drives `masteryByTag`, stays accurate per-question regardless).

**External dependencies**: Task #63 — the AI backend/provider decision — is now the only thing gating further product work. Every AI-adjacent service in the app already follows "Angular → documented mock/interface, never an API key in the client," so this is additive work whenever it's resolved, not a rewrite.

**Recommended next step**: resolve #63.

## 20. Task #63 resolved — AI backend built and wired

User's decisions: Claude API (Anthropic), hosted as a Supabase Edge Function (reuses the existing Supabase project, zero new infra), user has their own API key and configures it themselves (never seen by this session).

**Foundation**: `supabase/functions/ai-proxy` (Deno) — the only place the Anthropic key will ever exist. Generic contract shared by every AI feature (`{system, messages, maxTokens?} -> {text}`) instead of one function per feature. Requires a valid Supabase-authenticated JWT before touching the AI provider. Distinguishes "not configured yet" (503) from "provider failed" (502) so the client can show the right message. `core/services/ai-client.service.ts` is the one place in Angular that calls it. Deploy steps are in `supabase/functions/ai-proxy/README.md` — not yet run by the user as of this entry, so every feature below currently fails honestly rather than working end-to-end; that failure path is exactly what got live-verified for each one.

**Five real AI features wired**, each following the same pattern established with AI Tutor (the first one): a typed error class per service, JSON-structured AI responses with defensive parsing (strips markdown fences, validates shape, never trusts the AI blindly), every failure path logs the real cause via `console.error` and surfaces an honest in-UI message — never a fabricated result — and the user's input/progress is never lost on failure so they can retry:

1. **AI Tutor** — grammar/speaking/vocabulary/conversation topics now call Claude with a topic-specific system prompt and real conversation history; "correction" stays rule-based (free, already honest).
2. **Writing evaluation** — vocabulary/coherence scores and suggestions now come from Claude; grammarScore stays rule-based (grounded in the same mistakes shown in the UI and fed to Mistake Memory).
3. **Roleplay customer AI** — replaced the word-overlap heuristic entirely. Claude plays the customer, conditioned on the scenario's real persona/problem/context/difficulty and the full conversation so far, returning `{text, resolved}` JSON. Opening line stays scripted per scenario. Kept a hard turn-count safety net.
4. **Interview evaluation** — used by both Mock Interview and Roleplay's final scoring. Evaluates a whole session in **one** AI call (`evaluateInterview`), not one call per question — the old per-question-then-average design would have been up to 15 parallel API calls per Mock Interview completion, which is both slow and a real rate-limit risk. `evaluateAnswer` is a single-pair wrapper over the same method for Roleplay.
5. **Company Prep job analysis** — real Claude analysis of the pasted company + job description, replacing keyword-triggered templates. `suggestedPreparation` stays a fixed list of real SALingo feature names (deliberately not AI-generated, to avoid the model hallucinating a feature that doesn't exist).

**Housekeeping found along the way**: `AiExerciseService` was unused anywhere in the app and always returned the literal same hardcoded question while claiming to be "AI-generated" — deleted rather than wired up, since building real AI backing for a dead code path is waste. `AiInterviewService.getNextQuestion` (also unused) and its `MockInterviewQuestionPrompt` type were removed too. `pickNextQuestion` (the one actually used, for adaptive question selection) was deliberately left as a keyword heuristic — it always returns real curated content and was never dishonest, so upgrading it to AI is a future nice-to-have, not a correctness fix.

Every mock/heuristic that got replaced this round was flagged in the original 40-point audit as either measuring the wrong thing (Writing's old grammarScore, already fixed earlier) or producing the same output regardless of real input (Roleplay's 3-phrase script, Job Analysis's keyword templates, Interview Evaluation's word-count-only scoring) — this closes that entire class of finding.

### Build/verification
Each of the 5 features went through its own full cycle: `tsc --noEmit` (both tsconfig.json and tsconfig.spec.json) → `ng lint` → `ng test` → `ng build` → live Chrome verification against the still-undeployed function (proving the honest-failure path actually works, not just assuming it). Current state: `ng test` 96/96 passing, `ng lint` 0 errors, `ng build` clean (same pre-existing non-blocking budget warning).

## FINAL STATUS (updated)

**Completed**: the entire non-AI backlog (see §19) plus the full AI backend (this section) — Edge Function, Angular client, and all 5 real AI feature integrations, each with an honest failure mode verified live.

**Remaining**: two things, both requiring the user's own terminal, not this session:
1. Run the 3 deploy commands in `supabase/functions/ai-proxy/README.md` (`supabase link`, `supabase secrets set ANTHROPIC_API_KEY=...`, `supabase functions deploy ai-proxy`). Until this happens, all 5 AI features correctly show their honest "not available" states instead of working.
2. After deploying: spend a little real time in each of the 5 features to sanity-check Claude's actual output quality/tone now that it's live traffic, not just the failure path — the failure path is thoroughly verified, the happy path has not been (there is no way to verify it without the function actually being deployed).

**Known limitations**: same as §19, plus — no per-user rate limiting beyond the Edge Function's fixed `MAX_TOKENS_CEILING`/`MAX_MESSAGES` caps; worth adding before opening AI features up beyond testing, per the README's cost note. `pickNextQuestion`'s keyword-based adaptive selection was not upgraded to AI (legitimate heuristic, not a correctness issue — see §20).

**External dependencies**: none blocking further work — task #63 is resolved. The only outstanding item is the user completing deployment (item 1 above), which this session cannot do (no Supabase CLI credentials/access).
