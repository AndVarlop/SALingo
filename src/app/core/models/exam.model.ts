import { ActivityLogEntry } from './user-progress.model';

/**
 * Generic Exam Engine model. An exam is Sections -> Questions -> (on
 * submit) Evaluation -> per-skill results. Every concrete exam (Grammar
 * Exam, Vocabulary Exam, future Listening/Speaking/Job Readiness exams)
 * is just data built from *existing* content — see ExamRegistryService —
 * so the runner UI and scoring logic never need to know which exam it is.
 */
export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  /** Namespaced skill tag, e.g. "grammar:past-simple" or "vocab:business". Feeds the Skill Engine. */
  skillTag: string;
}

export interface ExamSection {
  id: string;
  title: string;
  questions: ExamQuestion[];
}

export interface ExamDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Which ActivityLogEntry.type these results are recorded under. */
  activityType: ActivityLogEntry['type'];
  sections: ExamSection[];
}

export interface ExamTagBreakdown {
  tag: string;
  correct: number;
  total: number;
  percent: number;
}

export interface ExamSectionResult {
  sectionId: string;
  title: string;
  correct: number;
  total: number;
  percent: number;
}

export interface ExamResult {
  examId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  sectionResults: ExamSectionResult[];
  tagBreakdown: ExamTagBreakdown[];
  weakestTags: ExamTagBreakdown[];
}
