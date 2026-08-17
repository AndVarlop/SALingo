import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComingSoonComponent } from '../../shared/components/coming-soon/coming-soon';

@Component({
  selector: 'app-ai-tutor',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon
    icon="🤖"
    title="AI Tutor"
    description="A chat-style tutor for grammar help, conversation practice and corrections. Arriving in Phase 7."
    phaseLabel="Phase 7"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiTutorComponent {}
