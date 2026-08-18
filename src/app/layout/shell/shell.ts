import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav';
import { TopbarComponent } from '../../shared/components/topbar/topbar';
import { MobileMenuComponent } from '../../shared/components/mobile-menu/mobile-menu';
import { ThemeService } from '../../core/services/theme.service';
import { UserStateService } from '../../core/services/user-state.service';

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
  protected readonly userState = inject(UserStateService);

  protected readonly isDark = computed(() => this.theme.theme() === 'dark');
  protected readonly mobileMenuOpen = signal(false);

  toggleTheme(): void {
    this.theme.toggle();
  }
}
