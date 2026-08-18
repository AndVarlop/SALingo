import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { LogoComponent } from '../logo/logo';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [LogoComponent],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  readonly xp = input<number>(0);
  readonly streak = input<number>(0);
  readonly avatarEmoji = input<string>('🙂');
  readonly isDark = input<boolean>(false);

  @Output() readonly themeToggle = new EventEmitter<void>();
  @Output() readonly menuOpen = new EventEmitter<void>();
}
