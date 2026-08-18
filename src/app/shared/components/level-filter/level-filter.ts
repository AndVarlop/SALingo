import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CEFR_LEVEL_LABEL, CefrLevel } from '../../../core/models';

/**
 * Reusable level-selector chips for standalone skill modules (Reading,
 * Listening, Writing, Speaking) that hold content for several CEFR levels
 * in one flat list. `null` means "All levels".
 */
@Component({
  selector: 'app-level-filter',
  standalone: true,
  templateUrl: './level-filter.html',
  styleUrl: './level-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelFilterComponent {
  readonly levels = input.required<CefrLevel[]>();
  readonly selected = input<CefrLevel | null>(null);
  readonly selectedChange = output<CefrLevel | null>();

  protected readonly label = CEFR_LEVEL_LABEL;

  protected select(level: CefrLevel | null): void {
    this.selectedChange.emit(level);
  }
}
