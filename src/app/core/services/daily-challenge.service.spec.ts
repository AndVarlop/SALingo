import { TestBed } from '@angular/core/testing';
import { DailyChallengeService } from './daily-challenge.service';
import { CareerCoachService } from './career-coach.service';
import { UserStateService } from './user-state.service';
import { StorageService } from './storage.service';
import { RecommendedActivity } from '../models';
import { STORAGE_KEYS } from '../constants/storage-keys.constant';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeRec(id: string, type: RecommendedActivity['type']): RecommendedActivity {
  return {
    id,
    type,
    title: `Do ${id}`,
    reason: 'because reasons',
    iconEmoji: '⭐',
    estimatedMinutes: 5,
    actionLabel: 'Go',
    routerLink: [`/${id}`],
  };
}

/** In-memory fake mirroring StorageService's get/set/remove contract. */
function fakeStorage() {
  const store = new Map<string, unknown>();
  return {
    get: <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: <T>(key: string, value: T) => store.set(key, value),
    remove: (key: string) => store.delete(key),
  };
}

function setup(recommendations: RecommendedActivity[], activityLog: { date: string; type: string }[] = []) {
  const recordActivity = vi.fn();
  const storage = fakeStorage();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: CareerCoachService, useValue: { recommendedActivities: () => recommendations } },
      {
        provide: UserStateService,
        useValue: { progress: () => ({ activityLog }), recordActivity },
      },
      { provide: StorageService, useValue: storage },
    ],
  });
  return { service: TestBed.inject(DailyChallengeService), recordActivity, storage };
}

describe('DailyChallengeService', () => {
  it('takes the top 3 recommendations as challenge items', () => {
    const { service } = setup([
      makeRec('a', 'grammar'),
      makeRec('b', 'review'),
      makeRec('c', 'speaking'),
      makeRec('d', 'listening'), // 4th, should be excluded
    ]);
    expect(service.items().map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('marks an item completed only when a matching-type activity was logged today', () => {
    const { service } = setup(
      [makeRec('a', 'grammar'), makeRec('b', 'review')],
      [{ date: `${todayIso()}T10:00:00.000Z`, type: 'grammar' }],
    );
    const items = service.items();
    expect(items.find((i) => i.id === 'a')?.completedToday).toBe(true);
    expect(items.find((i) => i.id === 'b')?.completedToday).toBe(false);
  });

  it('ignores activity logged on a previous day', () => {
    const { service } = setup(
      [makeRec('a', 'grammar')],
      [{ date: '2020-01-01T10:00:00.000Z', type: 'grammar' }],
    );
    expect(service.items()[0].completedToday).toBe(false);
  });

  it('allCompleted is false when there are no items or not everything is done', () => {
    const { service: empty } = setup([]);
    expect(empty.allCompleted()).toBe(false);

    const { service: partial } = setup(
      [makeRec('a', 'grammar'), makeRec('b', 'review')],
      [{ date: `${todayIso()}T10:00:00.000Z`, type: 'grammar' }],
    );
    expect(partial.allCompleted()).toBe(false);
  });

  it('awards the bonus exactly once when everything is completed today', async () => {
    const today = `${todayIso()}T10:00:00.000Z`;
    const { recordActivity } = setup(
      [makeRec('a', 'grammar'), makeRec('b', 'review')],
      [
        { date: today, type: 'grammar' },
        { date: today, type: 'review' },
      ],
    );

    TestBed.tick(); // effect() only flushes on a tick, not synchronously on injection
    expect(recordActivity).toHaveBeenCalledTimes(1);
    const call = recordActivity.mock.calls[0][0];
    expect(call.xp).toBeGreaterThan(0);
    expect(call.title).toBe('Daily Challenge complete');
  });

  it('does not re-award the bonus if already recorded today (storage guard)', async () => {
    const today = `${todayIso()}T10:00:00.000Z`;
    const storage = fakeStorage();
    storage.set(STORAGE_KEYS.dailyChallengeBonus, { date: todayIso(), awarded: true });
    const recordActivity = vi.fn();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CareerCoachService,
          useValue: { recommendedActivities: () => [makeRec('a', 'grammar')] },
        },
        {
          provide: UserStateService,
          useValue: {
            progress: () => ({ activityLog: [{ date: today, type: 'grammar' }] }),
            recordActivity,
          },
        },
        { provide: StorageService, useValue: storage },
      ],
    });
    TestBed.inject(DailyChallengeService);

    TestBed.tick();
    expect(recordActivity).not.toHaveBeenCalled();
  });
});
