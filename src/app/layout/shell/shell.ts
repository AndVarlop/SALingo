import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav';
import { TopbarComponent } from '../../shared/components/topbar/topbar';
import { MobileMenuComponent } from '../../shared/components/mobile-menu/mobile-menu';
import { ThemeService } from '../../core/services/theme.service';
import { UserStateService } from '../../core/services/user-state.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Wraps every protected route. `authGuard` only runs on navigation, so a
 * session that dies *while the user is sitting on a page* (refresh-token
 * expiry/revocation — Supabase fires SIGNED_OUT automatically when that
 * happens) previously left the shell rendered with stale data and every
 * further Supabase call silently RLS-denied, instead of returning the user
 * to login (spec: security audit §31). This effect is the reactive
 * counterpart to the guard's one-time navigation check.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, BottomNavComponent, TopbarComponent, MobileMenuComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly userState = inject(UserStateService);

  protected readonly isDark = computed(() => this.theme.theme() === 'dark');
  protected readonly mobileMenuOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.ready() && !this.auth.isAuthenticated()) {
        const returnUrl = this.router.url;
        this.router.navigate(['/auth/login'], returnUrl !== '/' ? { queryParams: { returnUrl } } : undefined);
      }
    });
  }

  toggleTheme(): void {
    this.theme.toggle();
  }
}
