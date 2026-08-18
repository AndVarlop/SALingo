import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_GROUPS } from '../../../core/constants/nav.constant';
import { LogoComponent } from '../logo/logo';

/**
 * Full-screen mobile navigation drawer — every top-level route grouped
 * logically (Learn/Practice/Career/Progress/Account), not just the 5-item
 * bottom-nav subset. Opened via the topbar's hamburger button on screens
 * <900px. Closes on backdrop click, the X button, or picking a route.
 */
@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './mobile-menu.html',
  styleUrl: './mobile-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileMenuComponent {
  readonly open = input<boolean>(false);
  @Output() readonly closed = new EventEmitter<void>();

  protected readonly groups = NAV_GROUPS;
}
