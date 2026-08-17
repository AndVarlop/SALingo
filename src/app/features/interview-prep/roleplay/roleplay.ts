import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_ROLEPLAY_SCENARIOS } from '../../../core/services/mock-data/mock-roleplay.data';
import { InterviewSessionService } from '../../../core/services/interview-session.service';
import { RoleplayDifficulty } from '../../../core/models';
import { BadgeChipComponent } from '../../../shared/components/badge-chip/badge-chip';

const DIFFICULTIES: RoleplayDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

@Component({
  selector: 'app-roleplay',
  standalone: true,
  imports: [RouterLink, BadgeChipComponent],
  templateUrl: './roleplay.html',
  styleUrl: './roleplay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleplayComponent {
  protected readonly sessionService = inject(InterviewSessionService);

  protected readonly difficulties = DIFFICULTIES;
  protected readonly activeDifficulty = signal<RoleplayDifficulty>('Beginner');
  protected readonly scenarios = MOCK_ROLEPLAY_SCENARIOS;

  protected scenariosFor(difficulty: RoleplayDifficulty) {
    return this.scenarios.filter((s) => s.difficulty === difficulty);
  }

  protected isCompleted(scenarioId: string): boolean {
    return this.sessionService.completedRoleplayScenarioIds().has(scenarioId);
  }
}
