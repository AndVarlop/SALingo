import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.readyPromise;
  if (auth.isAuthenticated()) return true;

  // Preserve the deep link so login can send the user back where they meant
  // to go, instead of always dropping them on /dashboard.
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/** Keeps a logged-in user out of the auth screens. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.readyPromise;
  if (!auth.isAuthenticated()) return true;

  router.navigate(['/dashboard']);
  return false;
};
