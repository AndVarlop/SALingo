import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Placeholder for features scheduled in a later build phase (see project
 * roadmap). Keeps every route navigable and visually on-brand instead of
 * showing a blank page while that phase is still in progress.
 */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoonComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly phaseLabel = input<string>('Coming soon');
}
