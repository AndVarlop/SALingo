import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  templateUrl: './progress-ring.html',
  styleUrl: './progress-ring.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRingComponent {
  readonly value = input.required<number>(); // 0-100
  readonly size = input<number>(96);
  readonly strokeWidth = input<number>(9);

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));
  protected readonly radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
  protected readonly offset = computed(
    () => this.circumference() * (1 - this.clamped() / 100),
  );
}
