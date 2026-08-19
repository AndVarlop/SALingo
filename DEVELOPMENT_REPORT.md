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

## 21. Production deployment prep — Git + Hostinger + salingo.devanvar.com

User decided to pause Claude/AI setup (no Anthropic plan yet — fine, everything already fails honestly instead of breaking) and move to getting SALingo actually published at `https://salingo.devanvar.com`.

**Audit findings**: Angular 21.2, Node 22.20.0/npm 11.6.2 (confirmed via `ng version`), pure client-side SPA — no SSR, no Node server needed on the host. Build output is `dist/lingo-app/browser/` (confirmed by inspecting the real output, not assumed — the new `@angular/build:application` builder nests one level deeper than the classic builder people usually assume). Git was already initialized with `origin` pointing at `github.com/AndVarlop/SALingo`, branch `main`, clean history — nothing to set up there, just verified.

**Security sweep before touching anything**: searched all tracked files for service-role keys, private keys, JWT secrets, DB passwords, `.env` files — none found. The only Supabase key present is the public anon key (`sb_publishable_...`), safe by design and RLS-protected on every table.

**What got built**:
- `.gitignore`: added `.env`/`.env.*`, `supabase/.temp/` (the CLI's local link cache — was showing as untracked after the user ran `supabase link`), key/credential file patterns, logs.
- SEO: real `<title>`/meta description/robots/Open Graph tags in `index.html`, `public/robots.txt`, `public/sitemap.xml` (only the two actually-public routes — `/auth/login`, `/auth/register` — everything else sits behind `authGuard`).
- `public/.htaccess`: forces HTTPS, Angular Router SPA fallback (deep links like `/dashboard` don't 404 on direct load or refresh), long-cache on hashed build assets while forcing `index.html`/`ngsw.json` to always revalidate, gzip. Lives in `public/` so it's copied into every build automatically by Angular's existing asset glob — confirmed by rebuilding and checking it landed in `dist/lingo-app/browser/`.
- `.github/workflows/deploy.yml`: builds/type-checks/lints/tests every push to `main`, deploys to Hostinger over FTP once the (not-yet-set) `FTP_SERVER`/`FTP_USERNAME`/`FTP_PASSWORD` repo secrets exist — skips the upload with a visible warning otherwise, so `main` always shows whether it's deployable even before Hostinger credentials are wired up.
- `DEPLOYMENT.md`: full guide (requirements, build, git workflow, Hostinger FTP setup, domain/SSL, `.htaccess` internals, env var split between public-Angular/GitHub-secrets/Supabase-secrets, Supabase Dashboard changes needed, troubleshooting, git-revert-based rollback).

**Real verification, not assumed**: rebuilt clean and confirmed `.htaccess`/`robots.txt`/`sitemap.xml` actually exist in `dist/lingo-app/browser/`. Served that exact output locally with `serve -s` (same rewrite-to-index.html behavior `.htaccess` implements on Apache) and used `curl` to confirm `/dashboard` and a nested deep link both return `200` (were `404` without the fallback flag — proving it's the fallback doing the work, not assuming it), while `/favicon.ico` still serves as a real file, not swallowed by the catch-all. `tsc`/lint/96 tests/build all clean on every commit in this batch. Pushed to `origin/main` successfully (confirmed via `git fetch` + `git status -sb` showing local and remote in sync).

**Not verified, and cannot be from this environment**: actual DNS resolution/SSL cert status for `salingo.devanvar.com` on Hostinger's side, Hostinger's real FTP hostname/credentials/document-root path, whether `mod_rewrite`/`mod_expires`/`mod_deflate` are enabled on the actual Hostinger Apache instance (standard on shared hosting, but not confirmable without access), and — obviously — the live site itself, since nothing has been uploaded yet.

### Build/verification
`tsc --noEmit` clean, `ng lint` 0 errors, `ng test` 96/96 passing, `ng build` clean (same pre-existing non-blocking budget warning) on every commit. Full details and the exact `curl` evidence are in `DEPLOYMENT.md`.

## 22. Pivot: GitHub Pages instead of Hostinger, domain typo fixed

After §21 was pushed, the user created a `CNAME` file directly via GitHub's web UI (the standard mechanism for GitHub Pages custom domains) and, when asked to confirm, chose GitHub Pages over Hostinger — simpler, free, no FTP credentials, deploys automatically on every push. Also caught and fixed a real domain typo in the process: the correct domain is `salingo.devandvar.com` (not `.devanvar.com` as originally stated) — fixed everywhere (meta tags, `robots.txt`, `sitemap.xml`, `DEPLOYMENT.md`).

**A real bug was found and fixed before it could break the deploy**: the `CNAME` file the user created lived at the repo root, which only matters for GitHub Pages' classic "deploy from a branch" mode. This setup uses the Actions-based deploy (uploads `dist/lingo-app/browser/` as the artifact), so a repo-root `CNAME` never actually reaches the deployed site — confirmed this by rebuilding and checking it was genuinely missing from `dist/lingo-app/browser/`, not assumed. Moved it to `public/CNAME` so Angular's existing asset glob includes it in every build automatically, same as `robots.txt`/`404.html`/etc., and removed the now-redundant repo-root copy.

Replaced `.github/workflows/deploy.yml`'s FTP-based deploy with GitHub's official two-job Pages pattern (build → `tsc`/lint/test/build → upload Pages artifact; deploy → `actions/deploy-pages`) — authenticates via GitHub's own OIDC token, zero secrets to configure, a genuine simplification over the FTP plan.

Angular SPA routing needed a completely different fix on GitHub Pages than Apache's `.htaccess` (left in the repo, harmless/unused, in case of a future self-hosted move) — GitHub Pages has no server-side rewrite capability at all. Implemented the standard [spa-github-pages](https://github.com/rafgraph/spa-github-pages) technique: `public/404.html` (served by GitHub Pages for any unmatched path — a deep link like `/dashboard` on direct load/refresh — encodes the real path into a query string and redirects to the root) plus a matching script in `src/index.html`'s `<head>` that decodes it back via `history.replaceState` before Angular Router boots. Confirmed both files land in a real rebuild of `dist/lingo-app/browser/`. **Honestly flagged as not fully verifiable from this environment**: unlike the Hostinger `.htaccess` plan (which got a real local `curl` test against `serve -s`), this specific redirect trick only round-trips through GitHub Pages' actual 404 handling once genuinely deployed there — there's no accurate way to simulate GitHub Pages' infrastructure locally. `DEPLOYMENT.md` says this explicitly instead of claiming it was verified.

### Build/verification
`tsc --noEmit` clean, `ng lint` 0 errors, `ng test` 96/96 passing, `ng build` clean (same pre-existing non-blocking budget warning) — confirmed on the rebuild after every change in this pivot, including the CNAME relocation. Pushed to `origin/main` successfully.

## ACTION REQUIRED FROM YOU

Everything else is done and pushed. These are the only steps that need you specifically:

1. **Enable GitHub Pages** (one-time): repo → Settings → Pages → **Build and deployment → Source: "GitHub Actions"**. Until this is set, the deploy job in `deploy.yml` will fail even though the build job succeeds — Pages isn't listening for a deployment yet.
2. **DNS**: add a `CNAME` DNS record for the `salingo` subdomain pointing at `AndVarlop.github.io`, wherever `devandvar.com`'s DNS is managed. Cannot be verified or performed from this environment.
3. **Enforce HTTPS**: once DNS propagates and GitHub verifies the domain (can take up to ~24h), go to repo → Settings → Pages and check "Enforce HTTPS" — it's greyed out until then.
4. **Supabase Dashboard** → Authentication → URL Configuration: set Site URL to `https://salingo.devandvar.com` and add it to the Redirect URLs allow-list. Without this, password-reset emails will be rejected even though the app code already sends the right URL.
5. **Test the deep-link fix once actually live**: hard-refresh `https://salingo.devandvar.com/dashboard` directly — this is the one piece of this pivot that could not be verified from this environment (see §22).
6. *(Paused by your choice, not urgent)* When ready to enable real AI: the 3 commands from `supabase/functions/ai-proxy/README.md`.

## 23. RESPONSIVE AUDIT

User asked for a complete mobile/tablet/desktop/ultra-wide audit. **Important limitation, stated honestly rather than glossed over**: this session's browser automation tool (`resize_window`) does not actually change the rendered viewport in this environment — confirmed by testing it repeatedly (375×812, 390×844) and reading back `window.innerWidth`, which stayed at the browser's real window size (~1566px) every time. So this audit is **code-level** (structure, CSS, grep sweeps for known-bad patterns, build/lint/test verification) — not pixel-by-pixel visual confirmation at each of the 12 requested viewport sizes. Anything below marked "verified" was actually checked; nothing is claimed as visually confirmed that wasn't.

**Breakpoints already in use** (found consistent throughout, not something this pass introduced): `640px`, `700px`, `900px` as the main tiers — roughly mobile / tablet / desktop-and-up. Reasonable and consistent; did not introduce more granular breakpoints since nothing found needed them.

**What was already correct** (verified via full-codebase grep sweeps, not assumed):
- Every `width:` declaration in the app already uses `max-width` (flexible), except exactly one real fixed `width: 140px` (a number/select input in Profile — safely narrow, not a real risk).
- No `outline: none` anywhere — focus indicators are intact everywhere (item #26).
- No `:hover`-only reveal of information that would be unreachable on touch (item #11).
- Bottom nav (mobile) already shows a curated 5-item subset (`MOBILE_NAV_ITEMS`), not all 14 sidebar items crammed in — already has `padding-bottom: env(safe-area-inset-bottom)` for notch devices (item #29).
- Forms (Company Prep, auth, etc.) are already single-column — no multi-column desktop layout that could break on mobile (item #13).
- Games/exams (Grammar Battle, Vocabulary Rush, Find the Mistake, Exam Runner) are already button-based, no drag-and-drop, `max-width` containers — already touch-safe by construction (item #15).

**Real bugs found and fixed**:
1. `ai-tutor.scss` and `roleplay-session.scss` chat containers used `height: 100vh`/`70vh` — doesn't account for mobile browser chrome (address bar) or the on-screen keyboard opening, a real bug that can push the message composer off-screen on mobile. Added `100dvh`/`70dvh` overrides (vh kept as a fallback for older browsers).
2. `prefers-reduced-motion` was only respected in 2 of the components using animation — added one global rule in `styles.scss` instead, covering every animation/transition in the app at once (item #28).
3. Added `html, body { overflow-x: hidden; max-width: 100% }` as a page-wide safety net (item #23) — a backstop on top of, not instead of, the per-component sweep that found nothing else wrong.
4. `profile.scss`'s label+input row lacked `flex-wrap`, a real overflow risk on a 320px-wide screen with a longer label.

**Pages/components reviewed this pass**: shell/sidebar/topbar/bottom-nav (navigation), Dashboard, AI Tutor, Roleplay session, Mock Interview, Company Prep, Profile, Auth, and a full-codebase grep sweep (not page-by-page) for fixed widths, `100vh`, `overflow-x`, `outline: none`, hover-only reveals, across every `.scss` file in `src/app`.

**Not done this pass, and why**: a genuine device-by-device/breakpoint-by-breakpoint visual walkthrough of all ~30 routes at all 12 requested viewport sizes — blocked by the `resize_window` tool limitation above, not skipped by choice. The code-level patterns already in place (consistent `max-width` usage, existing breakpoints, curated mobile nav) give reasonable confidence the app already behaves well across sizes, but that's an inference from code review, not a substitute for actually seeing it rendered at 320px/768px/1920px/2560px. **Recommended next step**: open the live site (once deployed) on a real phone/tablet, or use Chrome DevTools' device toolbar directly (Cmd/Ctrl+Shift+M) — both work around this session's automation limitation.

### Build/verification
`tsc --noEmit` clean, `ng lint` 0 errors, `ng test` 96/96 passing, `ng build` clean (same pre-existing non-blocking budget warning).

## 24. SALingo Brand Identity + Full Mobile Navigation

**Logo concept**: two overlapping speech-bubble shapes (conversation — core to both language learning and call-center practice), deliberately not the generic book+flag "school platform" look the user ruled out. One reusable `LogoComponent` (`shared/components/logo`), never duplicated in markup — `variant="full"` (icon+wordmark) / `variant="icon"` (icon only, for the collapsed sidebar), `size="sm"/"md"/"lg"`. Colored via the existing `--color-primary` token (already light/dark-mode-aware), not a new hardcoded hex — one identity, automatically theme-correct everywhere.

**Where it now appears**: sidebar (expanded and collapsed), topbar mobile brand, login, register, forgot-password. Confirmed via a full-codebase grep that zero placeholder brand emoji (🌐) remain anywhere.

**Colors/typography/spacing**: already centralized in `src/styles.scss` as CSS custom properties (`--color-primary`, `--color-surface`, `--radius-md`, etc.) before this session started. Kept the existing token names rather than renaming everything to a `--salingo-*` prefix — a purely cosmetic rename across dozens of files would have added real regression risk for zero functional benefit; the brief itself said "adapta los nombres al sistema real del proyecto."

**Favicon**: added `public/favicon.svg` (same mark) as a second `<link rel="icon">` ahead of the existing `favicon.ico` — modern Chrome/Firefox/Edge prefer SVG favicons automatically when both are present; ICO remains the Safari/legacy fallback. No raster image tooling was available in this session to regenerate the PWA manifest icon PNGs themselves (pre-existing gap from earlier in the project, unrelated to this pass, still open).

**Page titles**: already set per-route via Angular Router's `title:` field (confirmed pre-existing, e.g. "Sign up · SALingo", "Dashboard · SALingo") — no change needed, already correct.

**Mobile navigation — the most emphasized requirement**: new `MobileMenuComponent`, a real full-screen drawer, not a shrunk desktop menu. Grouped **Learn / Practice / Career / Progress / Account** (`NAV_GROUPS` in `nav.constant.ts`), built from routes read directly out of `app.routes.ts` — nothing invented. Opened by a new hamburger button in the topbar (shown only below 900px). A real gap was found and fixed in the process: Grammar Battle, Vocabulary Rush, and Find the Mistake had **no navigation entry anywhere** — only reachable via CTA cards on the Grammar/Vocabulary hub pages — now in the Practice group. Closes on the X button, a backdrop tap, or picking any route.

One real accessibility bug caught by lint (not by review): the backdrop was a `<div>` with a click handler — `@angular-eslint/template/click-events-have-key-events` and `interactive-supports-focus` both flagged it correctly, since a div click handler is invisible to keyboard/screen-reader users. Fixed by making it a real `<button>`.

### Build/verification
`tsc --noEmit` clean, `ng lint` 0 errors (after fixing the backdrop accessibility finding above), `ng test` 96/96 passing, `ng build` clean (same pre-existing budget warning). Live-verified the new logo on `/auth/login` and `/auth/register` (real screenshot + DOM inspection, no console errors). **Not re-verified live**: the authenticated shell (hamburger → drawer open/close/navigate, sidebar logo swap) — the test account's session expired mid-session and this environment has no password to log back in with. Structural correctness (fully typed Angular bindings, compiled clean) plus the same shell's sidebar-collapse feature having been live-verified earlier this session give reasonable confidence, but this is stated honestly as not re-confirmed this pass.

## 25. B2 + C1 + C2 content expansion (Advanced English Learning System)

**Architecture audit first, per the brief's own instruction not to invent new architecture.** Confirmed before writing any content:
- `CefrLevel` enum and `CEFR_LEVEL_ORDER`/`CEFR_LEVEL_LABEL` (`core/models/language.model.ts`) already fully cover B2/C1/C2 — zero model changes needed.
- `ExamRegistryService.buildGrammarExam()` iterates `CEFR_LEVEL_ORDER` dynamically, so new grammar topics at any level surface in the Exam Engine automatically, with no engine code touched.
- Grammar content is mock-data-driven (`mock-grammar.data.ts`), consumed identically by the Grammar hub, Grammar Battle mini-game, and the Exam Engine — one new `GrammarTopic` entry lights up all three.
- `VocabularyService` is Supabase-backed (`vocabulary_words` table), not mock data — new vocabulary needs a SQL migration, not a code change. The table's `level` check constraint already permits `'B2'|'C1'|'C2'`, so no schema migration was needed, only a data-insert one.
- `RoleplayScenario` has no CEFR field — its `Advanced`/`Expert` difficulty tiers are the existing mechanism for expressing higher-complexity call-center scenarios, so B2/C1-equivalent scenarios were authored into those tiers rather than adding a new field.
- `InterviewQuestion` has 3 fixed categories (`'about-you' | 'call-center' | 'behavioral'`), no level field — new advanced questions were authored into the existing `'behavioral'` category, matching the shape of pre-existing questions exactly.

Result: this was a **content-authoring pass on already-adequate infrastructure**, not a rebuild — consistent with the brief's explicit warning against inventing new B2/C1/C2 component classes.

**What was actually built this pass** (first real wave of content, not the full scope of the brief — see Remaining below):
- **15 new grammar topics** in `mock-grammar.data.ts`, each with explanation/examples/common mistakes/2 exercises, XP scaled by level (12/15/18 for B2/C1/C2):
  - B2 (6): mixed conditionals, advanced passive voice, advanced relative clauses, modals of deduction/speculation, future perfect/continuous, wish/if only.
  - C1 (5): inversion for emphasis, cleft sentences, participle clauses, advanced reporting structures, hedging/softening modals.
  - C2 (4): ellipsis and substitution, emphasis and fronting, register shifts, advanced discourse markers.
- **45 new vocabulary rows** in `supabase/vocabulary-b2-c1-c2.sql` (not yet applied — see External Dependencies): 18 B2 (phrasal verbs/collocations: *follow up, get the hang of, bring up, trade-off, bottom-line, burnout*…), 15 C1 (precise register-aware verbs: *assert, undermine, leverage, mitigate, scrutinize, discretion*…), 12 C2 (nuanced idiomatic vocabulary: *circumvent, vindicate, tacit, equivocate, untenable*…) — each with real IPA pronunciation and a workplace/call-center-relevant example sentence, mapped into the existing `VocabularyCategory` set.
- **4 new advanced roleplay scenarios** in `mock-roleplay.data.ts`: a VIP customer escalation, a contract-renegotiation/retention call, a cross-team-conflict escalation, and a customer pressuring for a policy exception — each with a distinct, more sophisticated `customerPersona` and a resolution that requires real judgment, not a scripted response. Feeds directly into `AiRoleplayService` for richer AI-driven conversations once the Edge Function is deployed.
- **5 new advanced interview questions** in `mock-interview-questions.data.ts` (`'behavioral'` category): conflicting priorities, disagreeing with a manager, improving retention (B2), describing a failure and what was learned, handling a policy-exception demand (C1) — each with structure/example-answer/Spanish coaching notes matching the existing question format exactly.

### Build/verification
`npx tsc --noEmit -p tsconfig.json` clean · `ng lint` 0 errors · `ng test --watch=false` 96/96 passing · `ng build` clean (same pre-existing roleplay-session budget warning, unrelated to this pass). Live Chrome verification was not attempted this pass — no working authenticated session was available (same test-account expiry noted in §24), and this pass was pure data-layer content that the existing components already render correctly by construction (verified by the clean build/lint/test cycle, plus the fact that this is the identical `GrammarTopic`/`RoleplayScenario`/`InterviewQuestion` shape already rendered live for A1/A2/B1 earlier in the session).

## 26. B2 + C1 + C2 — Reading, Listening, Writing, Speaking, Final Assessments, Level Unlocking, Recommendations, Placement Test

Second B2/C1/C2 pass, continuing directly from §25 with the rest of the checklist (Reading → Listening → Writing → Speaking → Final Assessments → Placement Test → Level Unlocking → Daily Challenge/Recommendations → Career Path → Interview/Roleplay). Mini-games and a full manual breakpoint audit were **not** attempted this pass — see Remaining below for why and what's recommended instead.

**Architecture reused, nothing duplicated:**
- Added one optional field, `level?: CefrLevel`, to `BaseExercise` (covers Reading/Listening/Speaking) and to `WritingPrompt` — additive, doesn't touch any existing lesson content.
- New shared `LevelFilterComponent` (`shared/components/level-filter`) — one small chip-row component reused across Reading, Listening, Writing and Speaking instead of four bespoke filter UIs.
- `ExamRegistryService`'s existing "add a `build*Exam()` method + a `getExam()` entry" pattern is exactly what the 3 new Final Assessments plug into — zero changes to the exam runner or engine.
- `AiEvaluationService.evaluateWriting` gained an optional `level` param (register/argumentation weighed higher at C1/C2 instead of one flat rubric); a new `evaluateSpeaking` method reuses the identical pattern (deterministic grammar-mistake detection + AI-judged vocabulary/coherence, same honest-failure-state class) for open-ended C1/C2 speaking, rather than inventing a new evaluation architecture.
- `CareerPathService`'s existing real, progress-driven `CareerPathStage[]` model was extended with 3 more stages instead of building a separate B2/C1/C2 page.
- `RecommendationService` (which both Daily Challenge and Career Coach's "what's next" already read from) was extended, not replaced.

**Reading** — new standalone module (`features/reading`), previously Reading only existed embedded inside individual A1/A2/B1 lessons. `mock-reading.data.ts`: 9 passages (3 per level — emails/articles/reports for B2, opinion/analytical pieces for C1, essay-style rhetoric for C2), each with 3 varied questions (main idea, detail, vocab-in-context, inference, author's stance/intention, tone) — reuses the existing `ReadingExercise`/`ExercisePlayerComponent` exactly as A1-B1 content does.

**Listening** — 20 new clips added to the existing `mock-listening.data.ts` (6 B2 workplace/customer-service/interview conversations, 5 C1 podcast/meeting/debate excerpts testing implied meaning and attitude, 4 C2 clips specifically testing irony/sarcasm/rhetorical framing). Real audio: the existing `ListeningExerciseComponent` speaks `audioText` via the actual Web Speech API (`SpeechSynthesisUtterance`) — not a placeholder "Listen to this…" with no audio behind it.

**Writing** — 15 new prompts (complaint/professional emails, reports, opinions for B2; proposals, persuasive/critical-response writing for C1; critical essays, analytical writing for C2) added to `mock-writing.data.ts`. Grading is real AI (`AiEvaluationService`, Claude via the Supabase Edge Function built earlier this session) — currently returns the same honest "not configured" state as every other AI feature until the user deploys the Edge Function; not fabricated.

**Speaking** — two real, level-appropriate modes:
- B2 stays on the existing guided exact-sentence-match engine (6 new exercises, more hints, per the "B2 = more help" progression rule).
- C1/C2 get a **new open-ended mode**: 8 prompts (debate, negotiation, persuasion, abstract discussion, spontaneous critical response) with hints shrinking from C1 to none at C2. Uses the existing `SpeechRecognitionService` for a real transcript (not simulated) and the new `evaluateSpeaking` AI method — genuinely spontaneous production, not another fixed sentence to repeat.

**Final Assessments** — `b2/c1/c2-final-assessment`, one `ExamRegistryService.build*()` method each: real Grammar + Vocabulary + Reading + Listening questions filtered to that level; C1 adds a Professional English section (call-center vocabulary); C2's reading section doubles as Nuance/Register/Inference since those questions already test tone and implied meaning. **Speaking and Writing are deliberately excluded** from the auto-graded exam — they're open-ended and AI-graded in their own modules, and folding them into a multiple-choice exam would have meant either inventing fake MC "writing" questions or silently not grading them, both worse than being explicit about the split.

**Level unlocking** — new `LevelProgressService`: a level is reachable either because the user's placement level already put them there (never locks someone out of where a placement test or manual change put them), or because they passed the previous level's Final Assessment (`ExamEngineService` now logs one extra `final-assessment:<examId>` overall-score entry per attempt, best-of-attempts, for this to read against a 70% threshold). Wired into `LevelFilterComponent` everywhere it's used (🔒 chip, blocked selection with a "Complete X to unlock Y" message, never a dead route) and into Career Path (🔒 badge, no dead CTA).

**Daily Challenge / Recommendation Engine** — `RecommendationService` now also recommends the next reachable-but-unpassed Final Assessment (never for a still-locked level), and weak-tag recommendations handle `listening:`/`reading:` tags with their own message instead of a generic fallback. This surfaced and fixed two real pre-existing gaps: `Skill.Reading` mastery was hardcoded to `0` (no standalone Reading activity existed before this session), and recommendation-type inference guessed from the recommendation's `id` — wrong for anything but grammar — now reads the actual `routerLink`.

**Career Path** — 3 new real stages (B2 Customer Service Specialist → C1 Team Leader/Advanced Customer Service → C2 International Business/Professional Communication), percent/completed driven by the same Final Assessment scores that gate the level, not an invented metric.

**Placement Test** — extended to C2 (3 new questions: ellipsis, fronting, register). More importantly, restructured from one fixed-order list (A1→C1, "hard questions tacked on the end") into two real stages: a calibration round (A2/B1), then a branch to a targeted band (A1 / B2 / C1+C2) based on stage-1 accuracy — a struggling learner never sees C1/C2 content and a strong one isn't padded with A1.

**Interview/Roleplay** — 5 more advanced questions in §25, plus 6 total new roleplay scenarios across §25/§26 (VIP escalation, retention negotiation, cross-team conflict, policy-exception pressure, enterprise contract renegotiation, leading a teammate through a crisis) reaching into C1/C2 leadership/negotiation territory, all on the existing `RoleplayScenario`/`AiRoleplayService` architecture.

### New Supabase migration
`supabase/activity-log-b2-c1-c2.sql` — widens the `activity_log.type` check constraint to allow the 2 new types this pass introduces (`'reading'`, `'final-assessment'`). **Required** before Reading-practice or Final-Assessment activity can persist to Supabase — not yet run by the user (same pattern as `vocabulary-b2-c1-c2.sql`, additive, safe to re-run).

### Build/verification
Every block above was committed separately, each preceded by a clean `npx tsc --noEmit -p tsconfig.json` → `ng lint` (0 errors) → `ng test --watch=false` (96/96 passing throughout, no regressions) → `ng build` (clean, same pre-existing roleplay-session 341-byte budget warning, unrelated to this work). Live Chrome verification was not attempted this pass — no working authenticated session was available (same test-account expiry noted in §24) — so this is stated honestly as structurally verified (typed, linted, built, unit-tested) but not re-confirmed against the running app.

## Completed
- SALingo brand identity, full mobile navigation, full responsive audit, AI backend, GitHub Pages deployment, collapsible sidebar (§20-§24, prior sessions).
- B2/C1/C2 Grammar (15 topics), Vocabulary (45 words, migration pending), Interview (10 questions), Roleplay (6 scenarios) — §25.
- B2/C1/C2 Reading (new module, 9 passages), Listening (20 clips), Writing (15 prompts, level-aware AI grading), Speaking (6 guided + 8 open-ended AI-judged prompts) — §26.
- 3 Final Assessments (Grammar/Vocabulary/Reading/Listening, plus Professional English at C1), real level unlocking wired through every new module and Career Path, B2/C1/C2-aware Daily Challenge and Recommendation Engine, adaptive C2-reaching Placement Test — §26.
- 3 new Career Path stages connecting English progress to real career milestones through C2.

## Remaining
- **Mini-games**: no new B2/C1/C2 game types (Debate Challenge, Word Precision, Nuance Master, Tone Detective, etc.) were built this pass. This was a deliberate scope call, not an oversight: the brief explicitly warns against low-value reskins ("no solo cambiar el título"), and building 8-12 genuinely new interaction types with real scoring in the same pass as everything above would have meant rushing either the games or the higher-priority items (Final Assessment was marked "PRIORIDAD ALTA" in the brief). Recommend a dedicated follow-up pass; `GameEngineService`-style shared scaffolding (score/accuracy/XP/attempts feeding the same Skill Engine every existing mini-game already feeds) is the right reuse target, one config-driven component with different question banks per mode rather than a component per game.
- **Full manual breakpoint audit** (320px→2560px) for the new Reading/Listening/Writing/Speaking/Career-Path/Placement-Test UI — blocked by the same `resize_window` tool limitation noted in §23/§24. All new components reuse the same `.card`, `max-width: 480-560px`, flex-column layout patterns already responsive-audited in §23, so risk is low, but this is not the same as confirming it on a real narrow viewport.
- Live Chrome / authenticated-session verification of everything in §26 (see Build/verification above).
- C2-specific reading/listening content leans on tone/inference/irony as requested, but a native-speaker or CEFR-trained reviewer pass would strengthen confidence that the C1/C2 difficulty gap is calibrated correctly — this was authored carefully but not externally validated against a CEFR rubric.
- PWA manifest icons are still generic Angular CLI placeholders (pre-existing, unrelated to this task).

## Known Issues
- None newly introduced — every change in both B2/C1/C2 passes went through the full `tsc`/lint/test/build cycle clean, and `ng test` stayed at 96/96 passing throughout (no regressions in any existing spec).

## External Dependencies
- GitHub Pages source setting, DNS, Supabase auth redirect URLs (see §22 ACTION REQUIRED — unchanged, still pending on the user's side).
- Anthropic API key / Edge Function deployment (paused by user's choice) — Writing and open-ended Speaking (C1/C2) grading will show honest "AI not configured" states until this is deployed.
- **`supabase/vocabulary-b2-c1-c2.sql`** — must be run in the Supabase SQL Editor (after `vocabulary.sql`) for the 45 B2/C1/C2 vocabulary words to appear. **Confirmed run by the user** after one syntax fix (double-quoted string literals aren't valid in Postgres — corrected to single-quoted with doubled apostrophes).
- **`supabase/activity-log-b2-c1-c2.sql`** (§26) — widens the `activity_log.type` check constraint. **Confirmed run by the user.** Reading-practice and Final-Assessment activity now persist to Supabase.

## 27. Feedback & Correction System — "NO SOLO DECIR QUE ESTÁ MAL"

Audited every place SALingo tells a user they got something wrong (Grammar, Lessons, Listening, Reading, Speaking, Grammar Battle, Vocabulary Rush, Find the Mistake, Writing, open Speaking, Mock Interview, Roleplay, Exams, Placement Test) before writing anything, per the brief's own instruction not to build a duplicate system.

**What already existed and didn't need rebuilding** (confirmed, not assumed, by reading the actual code):
- Writing (`AiEvaluationService.evaluateWriting`) already returns real AI-judged vocabulary/coherence scores plus deterministic grammar-mistake detection (`MistakeDetectionService`) with specific wrong→correct pairs — genuine feedback, not a bare pass/fail.
- Mock Interview (`AiInterviewEvaluationService`) already scores confidence/relevance/structure/professionalism/clarity individually via AI — a real dimension breakdown, matching the brief's §17 ask almost exactly.
- Call-center roleplay (`CallFlowScoringService`) already scores each call-flow step (Greeting/Empathy/Understanding/Solution/Closing/etc.) individually with keyword-based detection — a real per-dimension breakdown, matching §16.
- These three were **not rebuilt** — the gap was elsewhere.

**The actual gap, and what was built:** every *deterministic* exercise type (MultipleChoice, FillBlank, TrueFalse, WordOrder, Translation, Listening, and Reading's nested comprehension questions) only ever highlighted the right/wrong option, with no "why" beyond an occasionally-authored `explanation` string nobody had populated consistently. New centralized **`FeedbackService`** (`core/services/feedback.service.ts`) + **`ExerciseFeedback`** model (`core/models/feedback.model.ts`): given an exercise, the user's answer, and correctness, it always returns a real explanation — the user's answer, the correct one, a plain-language "why", and (when the content has it — e.g. a `GrammarTopic`) the underlying rule, 1-2 examples, and a tip pulled from the topic's real `commonMistakes`. When no authored explanation exists, it falls back to a templated-but-still-concrete message (e.g. Reading/Listening: "what was actually said/written was X, you answered Y") — **never** a bare "wrong".

**Where it's wired in:**
- `ExercisePlayerComponent`'s shared feedback panel — one change here covers Grammar hub, Lessons (A1-B1), Listening, Reading, and guided Speaking all at once, since they all render through it. Grammar Detail also now passes its `GrammarTopic` in, unlocking the topic's real rule/examples/commonMistakes instead of the generic fallback.
- Grammar Battle, Vocabulary Rush, Find the Mistake — the three timed mini-games that previously only flashed "❌ Not quite." now show a compact one-line "why" (topic rule for Grammar Battle, word meaning+example for Vocabulary Rush, mistake category for Find the Mistake). Wrong-answer pacing was slowed (900/800ms → 3200/3000ms) so the explanation is actually readable; correct answers keep the fast, game-like pace — proportional feedback per spec §20.
- Reading's 27 B2/C1/C2 comprehension questions (authored in §26) all received a real `explanation` referencing the specific passage line ("the text says X, therefore Y"), and `ReadingExerciseComponent` now shows Your-answer/Correct-answer/Why for any missed question — the one Reading gap the centralized engine's plumbing doesn't reach automatically (Reading's sub-questions are graded as a batch, not individually, so this was wired directly into the component instead).
- Writing/Speaking AI prompts gained an explicit anti-over-correction instruction (spec §14/§38): a more formal or elegant *alternative* must never be scored as an *error* when what the learner wrote was already correct — framed as an optional suggestion instead.

**Error types implemented:** `grammar | vocabulary | word-order | listening-comprehension | reading-comprehension | correct` — a deliberately smaller set than the brief's full 17-type list (TENSE_ERROR, PREPOSITION_ERROR, ARTICLE_ERROR, etc.), because those finer categories aren't reliably derivable from a fixed multiple-choice option string without real NLP — claiming to detect "preposition error" from `"I'm interested on technology"` being one wrong option among four would be guessing, not diagnosing. The existing free-text mistake detector (`MistakeDetectionService`, used by Writing/Speaking) does have real pattern-matched categories for actual prose; that's the honest place for finer-grained typing to live.

**Fallback behavior:** deterministic exercises (Grammar/Vocabulary/Reading/Listening) never depend on AI at all — `FeedbackService` is pure, synchronous, rule-based, so there is no failure mode to fall back from. Writing/Speaking AI feedback already had (and keeps) its established honest-failure-state pattern (`WritingEvaluationError`, a real error message, never a fabricated score) — unchanged by this pass.

### Build/verification
`npx tsc --noEmit -p tsconfig.json` clean · `ng lint` 0 errors · `ng test --watch=false` 96/96 passing (one pre-existing test's timer assertion updated to match the new, longer wrong-answer pause) · `ng build` clean (same pre-existing roleplay-session budget warning). Live Chrome verification not attempted — same reason as §25/§26 (no active authenticated session this pass).

## Feedback & Correction System — Summary

### Implemented
Centralized `FeedbackService`/`ExerciseFeedback`, wired into `ExercisePlayerComponent` (Grammar/Lessons/Listening/Reading/Speaking), Grammar Battle, Vocabulary Rush, Find the Mistake; real per-question explanations for all 27 B2/C1/C2 Reading questions; Writing/Speaking AI over-correction guardrail.

### Error Types
`grammar`, `vocabulary`, `word-order`, `listening-comprehension`, `reading-comprehension`, `correct` (deterministic exercises) + `grammar`/`vocabulary`/`speaking` (free-text, via the pre-existing `MistakeDetectionService`).

### Feedback Architecture
One shared service + model for every deterministic exercise type, consumed at one central rendering point (`ExercisePlayerComponent`) plus 3 direct call sites for the games that have their own UI. No per-exercise-type duplication.

### Adaptive Feedback
Level-aware AI grading emphasis already existed for Writing/Speaking (§26); unchanged this pass. Deterministic feedback proportionality (short for games, fuller in Grammar/Lessons) implemented via pacing + panel richness, not per-level wording changes.

### Mistake Tracking
Pre-existing `MistakeMemoryService`/My Mistakes feature (built in an earlier session) is unchanged and untouched by this pass — still the system of record for free-text mistakes surfaced by Writing/Speaking/Find the Mistake.

### AI Feedback
Writing and open-ended Speaking (C1/C2) — real Claude-backed scoring via the Supabase Edge Function, honest "not configured"/error states when unavailable, now with an explicit anti-over-correction instruction.

### Fallbacks
Deterministic exercise feedback has no AI dependency, so no fallback path is needed. AI-backed feedback (Writing/Speaking/Interview) keeps its pre-existing typed-error, no-fabricated-score pattern.

### Known Limitations
- No fine-grained error typing (tense/preposition/article/register/etc.) for multiple-choice-style exercises — see rationale above; would require real NLP over free text, not guessing from a fixed option list.
- No repeated-error pattern detection beyond what `MistakeMemoryService` already tracked before this pass ("Practice My Mistakes" micro-remediation flow, §22-§24 of the brief) — not attempted this pass; a real follow-up, not a rebuild, since Mistake Memory already exists to build on.
- Translation exercises still require an exact string match against `acceptedAnswers` (no synonym/paraphrase leniency) — a pre-existing limitation, not introduced or fixed this pass.
- No partial-credit scoring (§19 of the brief) — every deterministic exercise remains binary correct/incorrect; `ExerciseFeedback` has room to grow a `partial` case later but none was added without a real per-exercise-type reason to score it as such.

## Completed
- SALingo brand identity, full mobile navigation, full responsive audit, AI backend, GitHub Pages deployment, collapsible sidebar (§20-§24, prior sessions).
- B2/C1/C2 Grammar (15 topics), Vocabulary (45 words), Interview (10 questions), Roleplay (6 scenarios) — §25.
- B2/C1/C2 Reading (new module, 9 passages), Listening (20 clips), Writing (15 prompts, level-aware AI grading), Speaking (6 guided + 8 open-ended AI-judged prompts) — §26.
- 3 Final Assessments, real level unlocking, B2/C1/C2-aware Daily Challenge and Recommendation Engine, adaptive C2-reaching Placement Test, 3 new Career Path stages — §26.
- Centralized Feedback Engine covering Grammar/Lessons/Listening/Reading/Speaking/Grammar Battle/Vocabulary Rush/Find the Mistake, plus real per-question Reading explanations and an AI over-correction guardrail — §27.

## Remaining
- **Mini-games**: no new B2/C1/C2 game types (Debate Challenge, Word Precision, Nuance Master, Tone Detective, etc.) were built. Deliberate scope call — see §26's Remaining for the reasoning; recommend a dedicated follow-up pass.
- **Full manual breakpoint audit** (320px→2560px) — blocked by the `resize_window` tool limitation noted since §23.
- Live Chrome / authenticated-session verification of §25-§27's work (no active session in any of these passes).
- Fine-grained deterministic error typing, "Practice My Mistakes" micro-remediation, translation-exercise synonym leniency, and partial credit — all deferred with rationale in §27's Known Limitations.
- PWA manifest icons are still generic Angular CLI placeholders (pre-existing, unrelated to this task).

## Known Issues
- None newly introduced — every change across §25-§27 went through the full `tsc`/lint/test/build cycle clean, and `ng test` stayed at 96/96 passing throughout (one pre-existing test updated to match a deliberate timing change, not a regression).

## External Dependencies
- GitHub Pages source setting, DNS, Supabase auth redirect URLs (see §22 ACTION REQUIRED — unchanged, still pending on the user's side).
- Anthropic API key / Edge Function deployment (paused by user's choice) — Writing and open-ended Speaking (C1/C2) grading, and the new anti-over-correction instruction, will only take effect once this is deployed.

## Recommended Next Steps
1. Log back into the app and live-verify the new Feedback Engine panels, the Reading/Listening/Writing/Speaking modules, the Final Assessments, and the Career Path lock/unlock UI on a real session.
2. Pick mini-games as the next dedicated pass — it's the largest remaining piece of the B2/C1/C2 brief and deserves its own focused implementation rather than being squeezed in.
3. A "Practice My Mistakes" micro-remediation flow (§22-§24 of the Feedback brief) is a natural next step for the Feedback Engine, building on the existing `MistakeMemoryService` rather than a new system.
4. A genuine breakpoint-by-breakpoint pass (DevTools device toolbar or a real phone) on everything built across §25-§27, once live.
