import { Injectable, computed, inject } from '@angular/core';
import { UserStateService } from './user-state.service';
import { MockLessonService } from './mock-lesson.service';
import { InterviewProgressService } from './interview-progress.service';
import { InterviewSessionService } from './interview-session.service';
import { CareerCoachService } from './career-coach.service';
import { CareerPathStage } from '../models';

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
    ];
  });

  readonly currentStageIndex = computed(() => {
    const stages = this.stages();
    const firstIncomplete = stages.findIndex((s) => !s.completed);
    return firstIncomplete === -1 ? stages.length - 1 : firstIncomplete;
  });
}
