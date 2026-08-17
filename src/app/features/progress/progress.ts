import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComingSoonComponent } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon
    icon="📊"
    title="Progress"
    description="Charts for XP, study time, accuracy and per-skill mastery over time. Arriving in Phase 6."
    phaseLabel="Phase 6"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {}
