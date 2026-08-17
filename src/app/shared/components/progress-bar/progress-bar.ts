import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  readonly value = input.required<number>(); // 0-100
  readonly label = input<string>('');
  readonly color = input<'primary' | 'accent' | 'warn'>('primary');
  readonly showPercent = input<boolean>(false);

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));
}
