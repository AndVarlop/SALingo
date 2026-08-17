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
        title: 'Dashboard · SALingo',
      },
      {
        path: 'lessons',
        loadComponent: () => import('./features/lessons/lessons').then((m) => m.LessonsComponent),
        title: 'Learn · SALingo',
      },
      {
        path: 'lessons/:id',
        loadComponent: () =>
          import('./features/lessons/lesson-detail/lesson-detail').then((m) => m.LessonDetailComponent),
        title: 'Lesson · SALingo',
      },
      {
        path: 'vocabulary',
        loadComponent: () =>
          import('./features/vocabulary/vocabulary').then((m) => m.VocabularyComponent),
        title: 'Vocabulary · SALingo',
      },
      {
        path: 'grammar',
        loadComponent: () => import('./features/grammar/grammar').then((m) => m.GrammarComponent),
        title: 'Grammar · SALingo',
      },
      {
        path: 'grammar/:id',
        loadComponent: () =>
          import('./features/grammar/grammar-detail/grammar-detail').then((m) => m.GrammarDetailComponent),
        title: 'Grammar · SALingo',
      },
      {
        path: 'listening',
        loadComponent: () =>
          import('./features/listening/listening').then((m) => m.ListeningComponent),
        title: 'Listening · SALingo',
      },
      {
        path: 'speaking',
        loadComponent: () =>
          import('./features/speaking/speaking').then((m) => m.SpeakingComponent),
        title: 'Speaking · SALingo',
      },
      {
        path: 'pronunciation-coach',
        loadComponent: () =>
          import('./features/pronunciation-coach/pronunciation-coach').then(
            (m) => m.PronunciationCoachComponent,
          ),
        title: 'Pronunciation Coach · SALingo',
      },
      {
        path: 'writing',
        loadComponent: () => import('./features/writing/writing').then((m) => m.WritingComponent),
        title: 'Writing · SALingo',
      },
      {
        path: 'review',
        loadComponent: () => import('./features/review/review').then((m) => m.ReviewComponent),
        title: 'Review · SALingo',
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./features/progress/progress').then((m) => m.ProgressComponent),
        title: 'Progress · SALingo',
      },
      {
        path: 'placement-test',
        loadComponent: () =>
          import('./features/placement-test/placement-test').then(
            (m) => m.PlacementTestComponent,
          ),
        title: 'Placement Test · SALingo',
      },
      {
        path: 'ai-tutor',
        loadComponent: () => import('./features/ai-tutor/ai-tutor').then((m) => m.AiTutorComponent),
        title: 'AI Tutor · SALingo',
      },
      {
        path: 'interview-prep',
        loadComponent: () =>
          import('./features/interview-prep/interview-prep').then((m) => m.InterviewPrepComponent),
        title: 'Interview Prep · SALingo',
      },
      {
        path: 'interview-prep/questions',
        loadComponent: () =>
          import('./features/interview-prep/questions/questions').then((m) => m.InterviewQuestionsComponent),
        title: 'Interview Questions · SALingo',
      },
      {
        path: 'interview-prep/questions/:id',
        loadComponent: () =>
          import('./features/interview-prep/questions/question-detail/question-detail').then(
            (m) => m.QuestionDetailComponent,
          ),
        title: 'Interview Question · SALingo',
      },
      {
        path: 'interview-prep/answer-builder/:id',
        loadComponent: () =>
          import('./features/interview-prep/answer-builder/answer-builder').then((m) => m.AnswerBuilderComponent),
        title: 'Answer Builder · SALingo',
      },
      {
        path: 'interview-prep/scenarios',
        loadComponent: () =>
          import('./features/interview-prep/scenarios/scenarios').then((m) => m.InterviewScenariosComponent),
        title: 'Customer Service Scenarios · SALingo',
      },
      {
        path: 'interview-prep/roleplay',
        loadComponent: () => import('./features/interview-prep/roleplay/roleplay').then((m) => m.RoleplayComponent),
        title: 'Roleplay · SALingo',
      },
      {
        path: 'interview-prep/roleplay/:id',
        loadComponent: () =>
          import('./features/interview-prep/roleplay/roleplay-session/roleplay-session').then(
            (m) => m.RoleplaySessionComponent,
          ),
        title: 'Roleplay · SALingo',
      },
      {
        path: 'interview-prep/mock-interview',
        loadComponent: () =>
          import('./features/interview-prep/mock-interview/mock-interview').then((m) => m.MockInterviewComponent),
        title: 'Mock Interview · SALingo',
      },
      {
        path: 'interview-prep/history',
        loadComponent: () =>
          import('./features/interview-prep/history/history').then((m) => m.InterviewHistoryComponent),
        title: 'Interview History · SALingo',
      },
      {
        path: 'interview-prep/plan',
        loadComponent: () =>
          import('./features/interview-prep/preparation-plan/preparation-plan').then(
            (m) => m.PreparationPlanComponent,
          ),
        title: 'Preparation Plan · SALingo',
      },
      {
        path: 'interview-prep/company-prep',
        loadComponent: () =>
          import('./features/interview-prep/company-prep/company-prep').then((m) => m.CompanyPrepComponent),
        title: 'Company Prep · SALingo',
      },
      {
        path: 'interview-prep/tips',
        loadComponent: () => import('./features/interview-prep/tips/tips').then((m) => m.InterviewTipsComponent),
        title: 'Interview Tips · SALingo',
      },
      {
        path: 'interview-prep/vocabulary',
        loadComponent: () =>
          import('./features/interview-prep/vocabulary/vocabulary').then((m) => m.InterviewVocabularyComponent),
        title: 'Call Center English · SALingo',
      },
      {
        path: 'interview-prep/mistakes',
        loadComponent: () =>
          import('./features/interview-prep/mistakes/mistakes').then((m) => m.MistakesComponent),
        title: 'My Mistakes · SALingo',
      },
      {
        path: 'interview-prep/warmup',
        loadComponent: () => import('./features/interview-prep/warmup/warmup').then((m) => m.WarmupComponent),
        title: 'Speaking Warm-up · SALingo',
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
        title: 'Profile · SALingo',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
