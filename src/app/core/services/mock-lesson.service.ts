import { Injectable, computed, inject } from '@angular/core';
import { MOCK_LESSONS } from './mock-data/mock-lesson.data';
import { CefrLevel, Lesson, LessonSummary, LanguageCode } from '../models';
import { UserStateService } from './user-state.service';

/**
 * Serves lesson content. Backed by static mock data today; the shape mirrors
 * what a `GET /lessons` REST endpoint would return, so swapping this for an
 * `HttpClient`-based service later is a drop-in replacement.
 */
@Injectable({ providedIn: 'root' })
export class MockLessonService {
  private readonly userState = inject(UserStateService);

  private readonly allLessons = computed<Lesson[]>(() =>
    MOCK_LESSONS.filter((l) => l.language === this.userState.currentLanguage()),
  );

  getAll(): Lesson[] {
    return this.allLessons();
  }

  getByLevel(level: CefrLevel, language: LanguageCode = this.userState.currentLanguage()): LessonSummary[] {
    return MOCK_LESSONS.filter((l) => l.level === level && l.language === language).sort(
      (a, b) => a.order - b.order,
    );
  }

  getById(id: string): Lesson | undefined {
    return MOCK_LESSONS.find((l) => l.id === id);
  }

  isUnlocked(lesson: LessonSummary): boolean {
    const completed = this.userState.currentLanguageProgress().lessonsCompleted;
    return lesson.requiresLessonIds.every((id) => completed.includes(id));
  }

  /** First incomplete, unlocked lesson — the dashboard's "Continue lesson" pick. */
  getRecommendedLesson(): LessonSummary | undefined {
    const completed = this.userState.currentLanguageProgress().lessonsCompleted;
    return this.allLessons()
      .sort((a, b) => a.order - b.order)
      .find((l) => !completed.includes(l.id) && this.isUnlocked(l));
  }
}
