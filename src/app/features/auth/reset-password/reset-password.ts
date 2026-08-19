import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

/**
 * Completes the "forgot password" flow. Deliberately NOT behind guestGuard
 * (see auth.routes.ts) — the email link lands here carrying Supabase's own
 * short-lived recovery session, and guestGuard would otherwise bounce
 * anyone with an active session (recovery included) straight to /dashboard
 * before they could ever set a new password.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './reset-password.html',
  styleUrl: '../auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly done = signal(false);

  /** True once the initial session check resolves and there's genuinely no session — link expired, already used, or opened directly with no token. */
  protected readonly noRecoverySession = () => this.auth.ready() && !this.auth.isAuthenticated();

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.updatePassword(this.form.getRawValue().password);
      this.done.set(true);
      // Force a fresh login with the new password rather than trusting the
      // one-time recovery session as a standing login.
      await this.auth.logout();
      setTimeout(() => this.router.navigate(['/auth/login']), 2500);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      this.loading.set(false);
    }
  }
}
