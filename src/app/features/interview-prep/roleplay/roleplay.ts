import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_ROLEPLAY_SCENARIOS } from '../../../core/services/mock-data/mock-roleplay.data';
import { RoleplayDifficulty } from '../../../core/models';

const DIFFICULTIES: RoleplayDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

@Component({
  selector: 'app-roleplay',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './roleplay.html',
  styleUrl: './roleplay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleplayComponent {
  protected readonly difficulties = DIFFICULTIES;
  protected readonly activeDifficulty = signal<RoleplayDifficulty>('Beginner');
  protected readonly scenarios = MOCK_ROLEPLAY_SCENARIOS;

  protected scenariosFor(difficulty: RoleplayDifficulty) {
    return this.scenarios.filter((s) => s.difficulty === difficulty);
  }
}
