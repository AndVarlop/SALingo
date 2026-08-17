import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
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
}
