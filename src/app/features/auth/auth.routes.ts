import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
    title: 'Log in · Lingo',
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.RegisterComponent),
    title: 'Sign up · Lingo',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
    title: 'Reset password · Lingo',
  },
];
