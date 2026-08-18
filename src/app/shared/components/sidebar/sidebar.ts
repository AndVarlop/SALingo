import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_ITEMS } from '../../../core/constants/nav.constant';
import { STORAGE_KEYS } from '../../../core/constants/storage-keys.constant';
import { StorageService } from '../../../core/services/storage.service';
import { LogoComponent } from '../logo/logo';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly storage = inject(StorageService);

  readonly userName = input<string>('');
  readonly streak = input<number>(0);
  readonly navItems = NAV_ITEMS;

  protected readonly collapsed = signal(this.storage.get<boolean>(STORAGE_KEYS.sidebarCollapsed) ?? false);

  protected toggleCollapsed(): void {
    this.collapsed.update((c) => !c);
    this.storage.set(STORAGE_KEYS.sidebarCollapsed, this.collapsed());
  }
}
