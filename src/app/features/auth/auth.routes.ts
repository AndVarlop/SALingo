import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
    title: 'Log in · SALingo',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./register/register').then((m) => m.RegisterComponent),
    title: 'Sign up · SALingo',
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
    title: 'Reset password · SALingo',
  },
  {
    // No guestGuard: the recovery link lands here carrying an active
    // Supabase session, and guestGuard would otherwise redirect that
    // straight to /dashboard before the user could set a new password.
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password').then((m) => m.ResetPasswordComponent),
    title: 'Set new password · SALingo',
  },
];
