import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserStateService } from '../../core/services/user-state.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Router } from '@angular/router';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card';
import { AvatarComponent } from '../../shared/components/avatar/avatar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, StatCardComponent, AvatarComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  protected readonly userState = inject(UserStateService);
  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly settingsForm = this.fb.nonNullable.group({
    dailyGoalMinutes: [this.userState.settings().dailyGoalMinutes],
    notificationsEnabled: [this.userState.settings().notificationsEnabled],
    soundEnabled: [this.userState.settings().soundEnabled],
    difficulty: [this.userState.settings().difficulty],
  });

  protected saveSettings(): void {
    this.userState.updateSettings(this.settingsForm.getRawValue());
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
