import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComingSoonComponent } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-placement-test',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon
    icon="🧭"
    title="Placement Test"
    description="Answer a short set of questions to get your estimated CEFR level. Arriving in Phase 6."
    phaseLabel="Phase 6"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacementTestComponent {}
