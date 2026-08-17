import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GrammarBattleComponent } from './grammar-battle';
import { CareerCoachService } from '../../core/services/career-coach.service';
import { UserStateService } from '../../core/services/user-state.service';
import { MOCK_GRAMMAR_TOPICS } from '../../core/services/mock-data/mock-grammar.data';
import { ExerciseType } from '../../core/models';

interface BattleInternals {
  phase: () => 'idle' | 'playing' | 'result';
  currentQuestion: () => { exercise: { correctOptionIndex: number; options: string[] }; topicId: string } | null;
  streak: () => number;
  bestStreak: () => number;
  score: () => number;
  xpEarned: () => number;
  questions: () => unknown[];
  focusTopicLabel: () => string | null;
  start: () => void;
  selectAnswer: (i: number) => void;
}

function setup(weakestSkillTags: { tag: string; label: string; percent: number }[] = []) {
  const recordActivity = vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: CareerCoachService, useValue: { weakestSkillTags: () => weakestSkillTags } },
      { provide: UserStateService, useValue: { recordActivity } },
    ],
  });
  const fixture = TestBed.createComponent(GrammarBattleComponent);
  const component = fixture.componentInstance as unknown as BattleInternals;
  return { component, recordActivity };
}

describe('GrammarBattleComponent', () => {
  it('builds a pool of real multiple-choice questions from MOCK_GRAMMAR_TOPICS', () => {
    const { component } = setup();
    component.start();
    expect(component.phase()).toBe('playing');
    expect(component.questions().length).toBeGreaterThan(0);
    expect(component.questions().length).toBeLessThanOrEqual(10); // MAX_QUESTIONS
  });

  it('prioritizes the weakest grammar tag topic first when the Skill Engine has one', () => {
    const weakTopic = MOCK_GRAMMAR_TOPICS.find((t) =>
      t.exercises.some((e) => e.type === ExerciseType.MultipleChoice),
    )!;
    const { component } = setup([{ tag: `grammar:${weakTopic.id}`, label: 'Weak Topic', percent: 40 }]);

    expect(component.focusTopicLabel()).toBe('Weak Topic');

    component.start();
    const first = component.currentQuestion();
    expect(first?.topicId).toBe(weakTopic.id);
  });

  it('focusTopicLabel is null when there is no weak grammar tag', () => {
    const { component } = setup([{ tag: 'vocab:business', label: 'Business', percent: 40 }]);
    expect(component.focusTopicLabel()).toBeNull();
  });

  it('a correct answer increases score/streak and awards a streak-scaled XP bonus', () => {
    const { component } = setup();
    component.start();
    const q = component.currentQuestion()!;

    component.selectAnswer(q.exercise.correctOptionIndex);

    expect(component.score()).toBe(1);
    expect(component.streak()).toBe(1);
    expect(component.xpEarned()).toBeGreaterThan(0);
  });

  it('a wrong answer resets streak to 0 and does not increase score', () => {
    const { component } = setup();
    component.start();
    const q = component.currentQuestion()!;
    const wrongIndex = q.exercise.options.findIndex((_, i) => i !== q.exercise.correctOptionIndex);

    component.selectAnswer(wrongIndex);

    expect(component.score()).toBe(0);
    expect(component.streak()).toBe(0);
  });

  it('finish() records one activity tagged grammar:<dominant topic>', () => {
    vi.useFakeTimers();
    const { component, recordActivity } = setup();
    component.start();

    for (let i = 0; i < 15; i++) {
      const q = component.currentQuestion();
      if (!q || component.phase() !== 'playing') break;
      component.selectAnswer(q.exercise.correctOptionIndex);
      vi.advanceTimersByTime(900);
    }

    expect(component.phase()).toBe('result');
    expect(recordActivity).toHaveBeenCalledTimes(1);
    const call = recordActivity.mock.calls[0][0];
    expect(call.type).toBe('grammar');
    expect(call.skillTag).toMatch(/^grammar:/);
    vi.useRealTimers();
  });
});
