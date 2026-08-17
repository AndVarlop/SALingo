import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
        title: 'Dashboard · Lingo',
      },
      {
        path: 'lessons',
        loadComponent: () => import('./features/lessons/lessons').then((m) => m.LessonsComponent),
        title: 'Learn · Lingo',
      },
      {
        path: 'lessons/:id',
        loadComponent: () =>
          import('./features/lessons/lesson-detail/lesson-detail').then((m) => m.LessonDetailComponent),
        title: 'Lesson · Lingo',
      },
      {
        path: 'vocabulary',
        loadComponent: () =>
          import('./features/vocabulary/vocabulary').then((m) => m.VocabularyComponent),
        title: 'Vocabulary · Lingo',
      },
      {
        path: 'grammar',
        loadComponent: () => import('./features/grammar/grammar').then((m) => m.GrammarComponent),
        title: 'Grammar · Lingo',
      },
      {
        path: 'grammar/:id',
        loadComponent: () =>
          import('./features/grammar/grammar-detail/grammar-detail').then((m) => m.GrammarDetailComponent),
        title: 'Grammar · Lingo',
      },
      {
        path: 'listening',
        loadComponent: () =>
          import('./features/listening/listening').then((m) => m.ListeningComponent),
        title: 'Listening · Lingo',
      },
      {
        path: 'speaking',
        loadComponent: () =>
          import('./features/speaking/speaking').then((m) => m.SpeakingComponent),
        title: 'Speaking · Lingo',
      },
      {
        path: 'writing',
        loadComponent: () => import('./features/writing/writing').then((m) => m.WritingComponent),
        title: 'Writing · Lingo',
      },
      {
        path: 'review',
        loadComponent: () => import('./features/review/review').then((m) => m.ReviewComponent),
        title: 'Review · Lingo',
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./features/progress/progress').then((m) => m.ProgressComponent),
        title: 'Progress · Lingo',
      },
      {
        path: 'placement-test',
        loadComponent: () =>
          import('./features/placement-test/placement-test').then(
            (m) => m.PlacementTestComponent,
          ),
        title: 'Placement Test · Lingo',
      },
      {
        path: 'ai-tutor',
        loadComponent: () => import('./features/ai-tutor/ai-tutor').then((m) => m.AiTutorComponent),
        title: 'AI Tutor · Lingo',
      },
      {
        path: 'interview-prep',
        loadComponent: () =>
          import('./features/interview-prep/interview-prep').then((m) => m.InterviewPrepComponent),
        title: 'Interview Prep · Lingo',
      },
      {
        path: 'interview-prep/questions',
        loadComponent: () =>
          import('./features/interview-prep/questions/questions').then((m) => m.InterviewQuestionsComponent),
        title: 'Interview Questions · Lingo',
      },
      {
        path: 'interview-prep/questions/:id',
        loadComponent: () =>
          import('./features/interview-prep/questions/question-detail/question-detail').then(
            (m) => m.QuestionDetailComponent,
          ),
        title: 'Interview Question · Lingo',
      },
      {
        path: 'interview-prep/answer-builder/:id',
        loadComponent: () =>
          import('./features/interview-prep/answer-builder/answer-builder').then((m) => m.AnswerBuilderComponent),
        title: 'Answer Builder · Lingo',
      },
      {
        path: 'interview-prep/vocabulary',
        loadComponent: () =>
          import('./features/interview-prep/vocabulary/vocabulary').then((m) => m.InterviewVocabularyComponent),
        title: 'Call Center English · Lingo',
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
        title: 'Profile · Lingo',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
