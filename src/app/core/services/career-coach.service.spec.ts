import { TestBed } from '@angular/core/testing';
import { CareerCoachService } from './career-coach.service';
import { UserStateService } from './user-state.service';
import { VocabularyService } from './vocabulary.service';
import { InterviewSessionService } from './interview-session.service';
import { InterviewProgressService } from './interview-progress.service';
import { RecommendationService } from './recommendation.service';
import { CefrLevel, Skill } from '../models';

/** Builds a CareerCoachService with fully controllable fake dependencies —
 * the Job Ready Score formula and Weakness ranking are the "scoring"/
 * "adaptive learning" logic this test suite exists to protect. */
function setup(overrides: {
  level?: CefrLevel;
  skillMastery?: { skill: Skill; masteryPercent: number }[];
  activityLogLength?: number;
  words?: { masteryPercent: number }[];
  interviewSessionCount?: number;
  interviewAverageScore?: number;
  readinessOverall?: number;
}) {
  const {
    level = CefrLevel.A1,
    skillMastery = [],
    activityLogLength = 0,
    words = [],
    interviewSessionCount = 0,
    interviewAverageScore = 0,
    readinessOverall = 0,
  } = overrides;

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: UserStateService,
        useValue: {
          currentLanguageProgress: () => ({ level }),
          skillMastery: () => skillMastery,
          progress: () => ({ activityLog: Array(activityLogLength).fill({}) }),
        },
      },
      { provide: VocabularyService, useValue: { words: () => words } },
      {
        provide: InterviewSessionService,
        useValue: { sessionCount: () => interviewSessionCount, averageScore: () => interviewAverageScore },
      },
      { provide: InterviewProgressService, useValue: { readiness: () => ({ overall: readinessOverall }) } },
      { provide: RecommendationService, useValue: { recommendations: () => [] } },
    ],
  });

  return TestBed.inject(CareerCoachService);
}

describe('CareerCoachService.jobReadyScore', () => {
  it('reports hasEnoughData: false with a helpful hint when there is too little activity', () => {
    const service = setup({ activityLogLength: 0 });
    const result = service.jobReadyScore();
    expect(result.hasEnoughData).toBe(false);
    expect(result.overall).toBeNull();
    expect(result.missingDataHint).toContain('Not enough data');
  });

  it('never fabricates a dimension that has no underlying data', () => {
    const service = setup({ activityLogLength: 5, level: CefrLevel.A1 });
    const result = service.jobReadyScore();
    // English always has data (CEFR level always exists); speaking/interview/etc do not here.
    expect(result.breakdown.speaking).toBeNull();
    expect(result.breakdown.interview).toBeNull();
  });

  it('computes a weighted overall once enough real dimensions exist', () => {
    const service = setup({
      activityLogLength: 5,
      level: CefrLevel.C2, // english = 100
      skillMastery: [{ skill: Skill.Speaking, masteryPercent: 80 }],
      interviewSessionCount: 3,
      interviewAverageScore: 60,
    });
    const result = service.jobReadyScore();
    expect(result.hasEnoughData).toBe(true);
    expect(result.overall).not.toBeNull();
    // Weighted average of english(100)/speaking(80)/interview(60)/confidence(avg of interview+speaking=70)
    // should land strictly between the lowest and highest contributing dimension.
    expect(result.overall as number).toBeGreaterThan(60);
    expect(result.overall as number).toBeLessThan(100);
  });

  it('is monotonic: a strictly better interview score never lowers the overall score', () => {
    const base = setup({
      activityLogLength: 5,
      level: CefrLevel.B1,
      skillMastery: [{ skill: Skill.Speaking, masteryPercent: 50 }],
      interviewSessionCount: 2,
      interviewAverageScore: 40,
    }).jobReadyScore().overall as number;

    const improved = setup({
      activityLogLength: 5,
      level: CefrLevel.B1,
      skillMastery: [{ skill: Skill.Speaking, masteryPercent: 50 }],
      interviewSessionCount: 2,
      interviewAverageScore: 90,
    }).jobReadyScore().overall as number;

    expect(improved).toBeGreaterThan(base);
  });
});

describe('CareerCoachService.weaknesses', () => {
  it('ranks the lowest-scoring skill first', () => {
    const service = setup({
      skillMastery: [
        { skill: Skill.Speaking, masteryPercent: 40 },
        { skill: Skill.Grammar, masteryPercent: 90 },
      ],
    });
    const weaknesses = service.weaknesses();
    expect(weaknesses[0].label).toBe('Speaking');
  });

  it('excludes skills with zero mastery (no data yet, not a real weakness)', () => {
    const service = setup({
      skillMastery: [
        { skill: Skill.Speaking, masteryPercent: 0 },
        { skill: Skill.Grammar, masteryPercent: 70 },
      ],
    });
    const weaknesses = service.weaknesses();
    expect(weaknesses.some((w) => w.label === 'Speaking')).toBe(false);
  });
});
