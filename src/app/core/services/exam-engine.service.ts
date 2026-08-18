import { Injectable, inject } from '@angular/core';
import { UserStateService } from './user-state.service';
import { XP_RULES } from '../constants/xp.constant';
import { ExamDefinition, ExamResult, ExamTagBreakdown } from '../models';

/**
 * Generic Exam Engine: evaluates answers against any ExamDefinition and
 * records results into the Skill Engine (UserStateService.recordActivity,
 * one entry per skill tag touched — same masteryByTag/weakestSkillTags
 * pipeline every mini-game already feeds). No exam-specific logic lives
 * here; concrete exams are just data (see ExamRegistryService).
 */
@Injectable({ providedIn: 'root' })
export class ExamEngineService {
  private readonly userState = inject(UserStateService);

  evaluate(exam: ExamDefinition, answers: Map<string, number>): ExamResult {
    const questions = exam.sections.flatMap((s) => s.questions);
    let correctCount = 0;

    const tagTotals: Record<string, { correct: number; total: number }> = {};
    for (const q of questions) {
      const correct = answers.get(q.id) === q.correctOptionIndex;
      if (correct) correctCount++;
      const bucket = tagTotals[q.skillTag] ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (correct) bucket.correct += 1;
      tagTotals[q.skillTag] = bucket;
    }

    const tagBreakdown: ExamTagBreakdown[] = Object.entries(tagTotals).map(([tag, t]) => ({
      tag,
      correct: t.correct,
      total: t.total,
      percent: t.total ? Math.round((t.correct / t.total) * 100) : 0,
    }));

    const sectionResults = exam.sections.map((s) => {
      const total = s.questions.length;
      const correct = s.questions.filter((q) => answers.get(q.id) === q.correctOptionIndex).length;
      return {
        sectionId: s.id,
        title: s.title,
        correct,
        total,
        percent: total ? Math.round((correct / total) * 100) : 0,
      };
    });

    return {
      examId: exam.id,
      totalQuestions: questions.length,
      correctCount,
      scorePercent: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
      sectionResults,
      tagBreakdown,
      weakestTags: [...tagBreakdown].sort((a, b) => a.percent - b.percent).slice(0, 5),
    };
  }

  /** Records one activity entry per skill tag touched, so masteryByTag stays granular per topic/category. */
  record(exam: ExamDefinition, result: ExamResult): void {
    for (const tag of result.tagBreakdown) {
      const xp = tag.correct * XP_RULES.correctExercise + (tag.total - tag.correct) * XP_RULES.incorrectExercise;
      this.userState.recordActivity({
        minutes: Math.max(1, Math.round(tag.total / 2)),
        xp,
        type: exam.activityType,
        title: `${exam.title} — ${tag.tag}`,
        accuracy: tag.percent,
        skillTag: tag.tag,
      });
    }

    // Final Assessments also need ONE entry carrying the overall score
    // (not just per-tag breakdowns), since LevelProgressService reads this
    // exact skillTag to decide whether the next level unlocks.
    if (exam.activityType === 'final-assessment') {
      this.userState.recordActivity({
        minutes: 1,
        xp: 0,
        type: exam.activityType,
        title: `${exam.title} — Overall`,
        accuracy: result.scorePercent,
        skillTag: `final-assessment:${exam.id}`,
      });
    }
  }
}
