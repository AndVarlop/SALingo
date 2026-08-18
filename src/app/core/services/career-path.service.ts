import { Injectable, computed, inject } from '@angular/core';
import { UserStateService } from './user-state.service';
import { MockLessonService } from './mock-lesson.service';
import { InterviewProgressService } from './interview-progress.service';
import { InterviewSessionService } from './interview-session.service';
import { CareerCoachService } from './career-coach.service';
import { LevelProgressService } from './level-progress.service';
import { CareerPathStage, CefrLevel } from '../models';

const ROLEPLAY_GOAL = 5;
const MOCK_INTERVIEW_GOAL = 3;
const JOB_READY_THRESHOLD = 75;

/**
 * Spec section 27: "ENGLISH -> CALL CENTER ENGLISH -> CUSTOMER SERVICE ->
 * INTERVIEW PREP -> ROLEPLAY -> MOCK INTERVIEW -> JOB READY" as a visual,
 * real-progress career path. Every stage's percent/completed comes from
 * data already tracked elsewhere (lessons, interview vocab/questions,
 * roleplay/interview sessions, Job Ready Score) — no new state, no fake
 * numbers.
 */
@Injectable({ providedIn: 'root' })
export class CareerPathService {
  private readonly userState = inject(UserStateService);
  private readonly lessons = inject(MockLessonService);
  private readonly interviewProgress = inject(InterviewProgressService);
  private readonly interviewSessions = inject(InterviewSessionService);
  private readonly careerCoach = inject(CareerCoachService);
  private readonly levelProgress = inject(LevelProgressService);

  readonly stages = computed<CareerPathStage[]>(() => {
    const completedLessons = this.userState.currentLanguageProgress().lessonsCompleted.length;
    const totalLessons = this.lessons.getAll().length;
    const englishPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const vocabKnown = this.interviewProgress.knownWordCount();
    const vocabTotal = this.interviewProgress.totalVocabulary;
    const callCenterPercent = vocabTotal ? Math.round((vocabKnown / vocabTotal) * 100) : 0;

    const questionsPracticed = this.interviewProgress.practicedCount();
    const questionsTotal = this.interviewProgress.totalQuestions;
    const customerServicePercent = questionsTotal
      ? Math.round((questionsPracticed / questionsTotal) * 100)
      : 0;

    const interviewPrepPercent = this.interviewProgress.readiness().overall;

    const roleplayPercent = Math.min(100, Math.round((this.interviewSessions.roleplayCount() / ROLEPLAY_GOAL) * 100));

    const mockInterviewPercent = Math.min(
      100,
      Math.round((this.interviewSessions.sessionCount() / MOCK_INTERVIEW_GOAL) * 100),
    );

    const jobReady = this.careerCoach.jobReadyScore();
    const jobReadyPercent = jobReady.overall ?? 0;

    return [
      {
        id: 'english',
        label: 'English',
        iconEmoji: '🌱',
        percent: englishPercent,
        completed: englishPercent >= 100,
        requirement: `Complete all ${totalLessons} grammar lessons`,
        routerLink: ['/lessons'],
      },
      {
        id: 'call-center-english',
        label: 'Call Center English',
        iconEmoji: '📖',
        percent: callCenterPercent,
        completed: callCenterPercent >= 100,
        requirement: `Learn all ${vocabTotal} call center words`,
        routerLink: ['/interview-prep/vocabulary'],
      },
      {
        id: 'customer-service',
        label: 'Customer Service',
        iconEmoji: '📞',
        percent: customerServicePercent,
        completed: customerServicePercent >= 100,
        requirement: `Practice all ${questionsTotal} interview questions`,
        routerLink: ['/interview-prep/questions'],
      },
      {
        id: 'interview-prep',
        label: 'Interview Prep',
        iconEmoji: '💬',
        percent: interviewPrepPercent,
        completed: interviewPrepPercent >= 100,
        requirement: 'Reach 100% Interview Readiness',
        routerLink: ['/interview-prep'],
      },
      {
        id: 'roleplay',
        label: 'Roleplay',
        iconEmoji: '🎭',
        percent: roleplayPercent,
        completed: this.interviewSessions.roleplayCount() >= ROLEPLAY_GOAL,
        requirement: `Complete ${ROLEPLAY_GOAL} call simulations`,
        routerLink: ['/interview-prep/roleplay'],
      },
      {
        id: 'mock-interview',
        label: 'Mock Interview',
        iconEmoji: '🎙️',
        percent: mockInterviewPercent,
        completed: this.interviewSessions.sessionCount() >= MOCK_INTERVIEW_GOAL,
        requirement: `Complete ${MOCK_INTERVIEW_GOAL} mock interviews`,
        routerLink: ['/interview-prep/mock-interview'],
      },
      {
        id: 'job-ready',
        label: 'Job Ready',
        iconEmoji: '💼',
        percent: jobReadyPercent,
        completed: jobReadyPercent >= JOB_READY_THRESHOLD,
        requirement: `Reach a ${JOB_READY_THRESHOLD}% Job Ready Score`,
        routerLink: ['/dashboard'],
      },
      ...this.advancedStages(),
    ];
  });

  /**
   * B2/C1/C2, spec §10: English + Career connected progressively past
   * "Job Ready" — Customer Service Specialist → Team Leader / Advanced
   * Customer Service → International Business / Professional
   * Communication. Percent and completed come from the real Final
   * Assessment scores (exam-registry.service.ts / level-progress.service.ts)
   * — the same gate that unlocks the level's practice content, not a
   * separate invented metric.
   */
  private advancedStages(): CareerPathStage[] {
    const b2Locked = this.levelProgress.isLocked(CefrLevel.B2);
    const c1Locked = this.levelProgress.isLocked(CefrLevel.C1);
    const c2Locked = this.levelProgress.isLocked(CefrLevel.C2);

    const b2Score = this.levelProgress.finalAssessmentScore(CefrLevel.B2) ?? 0;
    const c1Score = this.levelProgress.finalAssessmentScore(CefrLevel.C1) ?? 0;
    const c2Score = this.levelProgress.finalAssessmentScore(CefrLevel.C2) ?? 0;

    return [
      {
        id: 'b2-customer-service-specialist',
        label: 'B2 · Customer Service Specialist',
        iconEmoji: '🎧',
        percent: b2Score,
        completed: this.levelProgress.passedFinalAssessment(CefrLevel.B2),
        requirement: b2Locked
          ? this.levelProgress.lockReason(CefrLevel.B2)
          : 'Pass the B2 Final Assessment (Grammar, Vocabulary, Reading, Listening)',
        routerLink: b2Locked ? ['/career-path'] : ['/exam', 'b2-final-assessment'],
        locked: b2Locked,
      },
      {
        id: 'c1-team-leader',
        label: 'C1 · Team Leader / Advanced Customer Service',
        iconEmoji: '🧭',
        percent: c1Score,
        completed: this.levelProgress.passedFinalAssessment(CefrLevel.C1),
        requirement: c1Locked
          ? this.levelProgress.lockReason(CefrLevel.C1)
          : 'Pass the C1 Final Assessment (adds Critical Thinking & Professional English)',
        routerLink: c1Locked ? ['/career-path'] : ['/exam', 'c1-final-assessment'],
        locked: c1Locked,
      },
      {
        id: 'c2-international-business',
        label: 'C2 · International Business / Professional Communication',
        iconEmoji: '🌍',
        percent: c2Score,
        completed: this.levelProgress.passedFinalAssessment(CefrLevel.C2),
        requirement: c2Locked
          ? this.levelProgress.lockReason(CefrLevel.C2)
          : 'Pass the C2 Final Assessment (Nuance, Register & Inference)',
        routerLink: c2Locked ? ['/career-path'] : ['/exam', 'c2-final-assessment'],
        locked: c2Locked,
      },
    ];
  }

  readonly currentStageIndex = computed(() => {
    const stages = this.stages();
    const firstIncomplete = stages.findIndex((s) => !s.completed);
    return firstIncomplete === -1 ? stages.length - 1 : firstIncomplete;
  });
}
