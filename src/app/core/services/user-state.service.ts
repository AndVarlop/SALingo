import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { xpForNextLevel } from '../constants/xp.constant';
import {
  ActivityLogEntry,
  AppUser,
  CefrLevel,
  DEFAULT_USER_SETTINGS,
  LanguageCode,
  LanguageProgress,
  Skill,
  SkillProgress,
  UserProgress,
  UserSettings,
} from '../models';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const FALLBACK_USER: AppUser = {
  id: '',
  name: '',
  email: '',
  avatarEmoji: '🙂',
  primaryLanguage: 'en',
  level: CefrLevel.A1,
  startedAt: todayIso(),
};

const EMPTY_PROGRESS: UserProgress = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  activityByDate: [],
  activityLog: [],
  languages: { en: undefined, fr: undefined, de: undefined, it: undefined, pt: undefined, es: undefined },
};

/**
 * Single source of truth for "who is the user and how are they doing".
 * Backed by Supabase: loads everything for the signed-in user on login,
 * keeps signals as an in-memory cache the UI reads synchronously, and
 * pushes every mutation back to Postgres (optimistic — the signal updates
 * immediately, the network write happens right after).
 */
@Injectable({ providedIn: 'root' })
export class UserStateService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly user = signal<AppUser>(FALLBACK_USER);
  readonly settings = signal<UserSettings>(DEFAULT_USER_SETTINGS);
  readonly progress = signal<UserProgress>(EMPTY_PROGRESS);

  readonly currentLanguage: Signal<LanguageCode> = computed(() => this.settings().learningLanguage);

  readonly currentLanguageProgress: Signal<LanguageProgress> = computed(() => {
    const progress = this.progress().languages[this.currentLanguage()];
    return progress ?? this.emptyLanguageProgress(this.currentLanguage());
  });

  readonly xp = computed(() => this.currentLanguageProgress().xp);
  readonly xpToNextLevel = computed(() => xpForNextLevel(this.xp()));
  readonly levelProgressPercent = computed(() => {
    const xp = this.xp();
    const prevThreshold = Math.floor(xp / 500) * 500;
    return Math.round(((xp - prevThreshold) / (this.xpToNextLevel() - prevThreshold)) * 100);
  });

  readonly streak = computed(() => this.progress().currentStreak);
  readonly longestStreak = computed(() => this.progress().longestStreak);

  /**
   * Rolling average accuracy from the activity log. Computed here rather than
   * trusting `language_progress.average_accuracy` — nothing keeps that stored
   * column in sync, so it would always read 0.
   */
  readonly averageAccuracy = computed(() => {
    const entries = this.progress().activityLog.filter((e) => e.accuracy !== undefined);
    if (!entries.length) return 0;
    const sum = entries.reduce((total, e) => total + (e.accuracy ?? 0), 0);
    return Math.round(sum / entries.length);
  });

  /**
   * Per-skill mastery derived from the activity log, since nothing writes to
   * `language_progress.skills` either — it would otherwise always be `[]`.
   * Reading has no dedicated activity type yet (it's embedded inside lessons),
   * so it stays 0 until a standalone Reading feature logs its own entries.
   */
  readonly skillMastery = computed<SkillProgress[]>(() => {
    const log = this.progress().activityLog;
    const masteryFor = (types: ActivityLogEntry['type'][]) => {
      const entries = log.filter((e) => types.includes(e.type) && e.accuracy !== undefined);
      if (!entries.length) return 0;
      return Math.round(entries.reduce((sum, e) => sum + (e.accuracy ?? 0), 0) / entries.length);
    };

    return [
      { skill: Skill.Vocabulary, masteryPercent: masteryFor(['review']) },
      { skill: Skill.Grammar, masteryPercent: masteryFor(['grammar', 'lesson']) },
      { skill: Skill.Listening, masteryPercent: masteryFor(['listening']) },
      { skill: Skill.Speaking, masteryPercent: masteryFor(['speaking']) },
      { skill: Skill.Reading, masteryPercent: 0 },
      { skill: Skill.Writing, masteryPercent: masteryFor(['writing']) },
    ];
  });

  readonly todayActivity = computed(() => {
    const today = todayIso();
    return this.progress().activityByDate.find((a) => a.date === today) ?? null;
  });

  readonly todayMinutes = computed(() => this.todayActivity()?.minutesStudied ?? 0);
  readonly dailyGoalMinutes = computed(() => this.settings().dailyGoalMinutes);
  readonly dailyGoalPercent = computed(() =>
    Math.min(100, Math.round((this.todayMinutes() / this.dailyGoalMinutes()) * 100)),
  );

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId) {
        this.loadAll(userId);
      } else if (this.auth.ready()) {
        this.reset();
      }
    });
  }

  updateSettings(patch: Partial<UserSettings>): void {
    this.settings.update((s) => ({ ...s, ...patch }));
    const userId = this.auth.userId();
    if (!userId) return;

    this.supabase
      .from('user_settings')
      .update({
        theme: this.settings().theme,
        daily_goal_minutes: this.settings().dailyGoalMinutes,
        notifications_enabled: this.settings().notificationsEnabled,
        sound_enabled: this.settings().soundEnabled,
        difficulty: this.settings().difficulty,
        learning_language: this.settings().learningLanguage,
      })
      .eq('user_id', userId)
      .then(({ error }) => error && console.error('[UserState] updateSettings failed', error));
  }

  /**
   * Records a chunk of study activity: adds XP/minutes for today, appends an
   * activity-log entry, and rolls the streak forward if this is the first
   * activity of a new day. Called by every feature that grants XP.
   */
  recordActivity(entry: {
    minutes: number;
    xp: number;
    type: ActivityLogEntry['type'];
    title: string;
    accuracy?: number;
  }): void {
    const userId = this.auth.userId();
    const today = todayIso();
    const lang = this.currentLanguage();
    const goal = this.settings().dailyGoalMinutes;

    const prevProgress = this.progress();
    const { currentStreak, longestStreak } = this.nextStreak(prevProgress);
    const prevDay = prevProgress.activityByDate.find((a) => a.date === today);
    const newDay = {
      date: today,
      minutesStudied: (prevDay?.minutesStudied ?? 0) + entry.minutes,
      xpEarned: (prevDay?.xpEarned ?? 0) + entry.xp,
      goalMet: (prevDay?.minutesStudied ?? 0) + entry.minutes >= goal,
    };
    const log: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString(),
      type: entry.type,
      title: entry.title,
      xpEarned: entry.xp,
      accuracy: entry.accuracy,
    };
    const langProgress = prevProgress.languages[lang] ?? this.emptyLanguageProgress(lang);
    const updatedLangProgress: LanguageProgress = {
      ...langProgress,
      xp: langProgress.xp + entry.xp,
      totalStudyMinutes: langProgress.totalStudyMinutes + entry.minutes,
    };

    this.progress.update((progress) => ({
      ...progress,
      activityByDate: [...progress.activityByDate.filter((a) => a.date !== today), newDay],
      activityLog: [log, ...progress.activityLog].slice(0, 50),
      currentStreak,
      longestStreak,
      lastActivityDate: today,
      languages: { ...progress.languages, [lang]: updatedLangProgress },
    }));

    if (!userId) return;

    Promise.all([
      this.supabase
        .from('daily_activity')
        .upsert(
          {
            user_id: userId,
            activity_date: today,
            minutes_studied: newDay.minutesStudied,
            xp_earned: newDay.xpEarned,
            goal_met: newDay.goalMet,
          },
          { onConflict: 'user_id,activity_date' },
        ),
      this.supabase.from('activity_log').insert({
        user_id: userId,
        type: entry.type,
        title: entry.title,
        xp_earned: entry.xp,
        accuracy: entry.accuracy ?? null,
      }),
      this.supabase
        .from('user_streak')
        .update({ current_streak: currentStreak, longest_streak: longestStreak, last_activity_date: today })
        .eq('user_id', userId),
      this.supabase
        .from('language_progress')
        .update({
          xp: updatedLangProgress.xp,
          total_study_minutes: updatedLangProgress.totalStudyMinutes,
        })
        .eq('user_id', userId)
        .eq('language', lang),
    ]).then((results) => {
      const failed = results.find((r) => r.error);
      if (failed?.error) console.error('[UserState] recordActivity failed', failed.error);
    });
  }

  markLessonCompleted(lessonId: string): void {
    const lang = this.currentLanguage();
    const langProgress = this.progress().languages[lang] ?? this.emptyLanguageProgress(lang);
    if (langProgress.lessonsCompleted.includes(lessonId)) return;

    this.progress.update((progress) => ({
      ...progress,
      languages: {
        ...progress.languages,
        [lang]: {
          ...langProgress,
          lessonsCompleted: [...langProgress.lessonsCompleted, lessonId],
        },
      },
    }));

    const userId = this.auth.userId();
    if (!userId) return;

    this.supabase
      .from('lesson_completions')
      .insert({ user_id: userId, lesson_id: lessonId })
      .then(({ error }) => error && console.error('[UserState] markLessonCompleted failed', error));
  }

  /** Sets the user's CEFR level for the current language — e.g. after a placement test. */
  updateLevel(level: CefrLevel): void {
    const lang = this.currentLanguage();
    const langProgress = this.progress().languages[lang] ?? this.emptyLanguageProgress(lang);

    this.progress.update((progress) => ({
      ...progress,
      languages: { ...progress.languages, [lang]: { ...langProgress, level } },
    }));
    this.user.update((u) => ({ ...u, level }));

    const userId = this.auth.userId();
    if (!userId) return;

    Promise.all([
      this.supabase.from('language_progress').update({ level }).eq('user_id', userId).eq('language', lang),
      this.supabase.from('profiles').update({ level }).eq('id', userId),
    ]).then((results) => {
      const failed = results.find((r) => r.error);
      if (failed?.error) console.error('[UserState] updateLevel failed', failed.error);
    });
  }

  /** Loads profile, settings, streak and per-language progress for the signed-in user. */
  private async loadAll(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const [profileRes, settingsRes, streakRes, langRes, completionsRes, activityRes, logRes] =
        await Promise.all([
          this.supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          this.supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
          this.supabase.from('user_streak').select('*').eq('user_id', userId).maybeSingle(),
          this.supabase.from('language_progress').select('*').eq('user_id', userId),
          this.supabase.from('lesson_completions').select('lesson_id,completed_at').eq('user_id', userId),
          this.supabase
            .from('daily_activity')
            .select('*')
            .eq('user_id', userId)
            .order('activity_date', { ascending: false })
            .limit(30),
          this.supabase
            .from('activity_log')
            .select('*')
            .eq('user_id', userId)
            .order('occurred_at', { ascending: false })
            .limit(50),
        ]);

      const profile = profileRes.data;
      const settingsRow = settingsRes.data;
      const streakRow = streakRes.data;

      if (profile) {
        this.user.set({
          id: profile.id,
          name: profile.name,
          email: this.auth.userEmail() ?? '',
          avatarEmoji: profile.avatar_emoji,
          primaryLanguage: profile.primary_language as LanguageCode,
          level: profile.level as CefrLevel,
          startedAt: profile.started_at,
        });
      }

      if (settingsRow) {
        this.settings.set({
          theme: settingsRow.theme as UserSettings['theme'],
          dailyGoalMinutes: settingsRow.daily_goal_minutes,
          notificationsEnabled: settingsRow.notifications_enabled,
          soundEnabled: settingsRow.sound_enabled,
          difficulty: settingsRow.difficulty as UserSettings['difficulty'],
          learningLanguage: settingsRow.learning_language as LanguageCode,
        });
      }

      const lessonsByLanguage = new Map<string, string[]>();
      // lesson ids don't carry a language column here — the static mock
      // lesson catalogue prefixes ids with the language ("en-..."), so we
      // group by that prefix instead of a second join.
      for (const row of completionsRes.data ?? []) {
        const lang = row.lesson_id.split('-')[0];
        const list = lessonsByLanguage.get(lang) ?? [];
        list.push(row.lesson_id);
        lessonsByLanguage.set(lang, list);
      }

      const languages: UserProgress['languages'] = { ...EMPTY_PROGRESS.languages };
      for (const row of langRes.data ?? []) {
        const language = row.language as LanguageCode;
        languages[language] = {
          language,
          level: row.level as CefrLevel,
          xp: row.xp,
          xpToNextLevel: xpForNextLevel(row.xp),
          wordsLearned: row.words_learned,
          totalStudyMinutes: row.total_study_minutes,
          averageAccuracy: row.average_accuracy,
          lessonsCompleted: lessonsByLanguage.get(language) ?? [],
          skills: (row.skills as LanguageProgress['skills']) ?? [],
          levelProgress: (row.level_progress as LanguageProgress['levelProgress']) ?? {
            [CefrLevel.A1]: 0,
            [CefrLevel.A2]: 0,
            [CefrLevel.B1]: 0,
            [CefrLevel.B2]: 0,
            [CefrLevel.C1]: 0,
            [CefrLevel.C2]: 0,
          },
        };
      }

      this.progress.set({
        currentStreak: streakRow?.current_streak ?? 0,
        longestStreak: streakRow?.longest_streak ?? 0,
        lastActivityDate: streakRow?.last_activity_date ?? null,
        activityByDate: (activityRes.data ?? []).map((row) => ({
          date: row.activity_date,
          minutesStudied: row.minutes_studied,
          xpEarned: row.xp_earned,
          goalMet: row.goal_met,
        })),
        activityLog: (logRes.data ?? []).map((row) => ({
          id: row.id,
          date: row.occurred_at,
          type: row.type as ActivityLogEntry['type'],
          title: row.title,
          xpEarned: row.xp_earned,
          accuracy: row.accuracy ?? undefined,
        })),
        languages,
      });
    } catch (err) {
      console.error('[UserState] loadAll failed', err);
    } finally {
      this.loading.set(false);
    }
  }

  private reset(): void {
    this.user.set(FALLBACK_USER);
    this.settings.set(DEFAULT_USER_SETTINGS);
    this.progress.set(EMPTY_PROGRESS);
  }

  private nextStreak(progress: UserProgress): { currentStreak: number; longestStreak: number } {
    const today = todayIso();
    if (progress.lastActivityDate === today) {
      return { currentStreak: progress.currentStreak, longestStreak: progress.longestStreak };
    }
    const wasYesterday = progress.lastActivityDate === yesterdayIso();
    const currentStreak = wasYesterday ? progress.currentStreak + 1 : 1;
    return {
      currentStreak,
      longestStreak: Math.max(progress.longestStreak, currentStreak),
    };
  }

  private emptyLanguageProgress(language: LanguageCode): LanguageProgress {
    return {
      language,
      level: CefrLevel.A1,
      xp: 0,
      xpToNextLevel: 500,
      wordsLearned: 0,
      totalStudyMinutes: 0,
      averageAccuracy: 0,
      lessonsCompleted: [],
      skills: [],
      levelProgress: {
        [CefrLevel.A1]: 0,
        [CefrLevel.A2]: 0,
        [CefrLevel.B1]: 0,
        [CefrLevel.B2]: 0,
        [CefrLevel.C1]: 0,
        [CefrLevel.C2]: 0,
      },
    };
  }
}
