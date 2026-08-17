import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'primary' | 'success' | 'warn' | 'danger' | 'neutral';

@Component({
  selector: 'app-badge-chip',
  standalone: true,
  templateUrl: './badge-chip.html',
  styleUrl: './badge-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeChipComponent {
  readonly icon = input<string>('');
  readonly tone = input<BadgeTone>('neutral');
  readonly locked = input<boolean>(false);
}
