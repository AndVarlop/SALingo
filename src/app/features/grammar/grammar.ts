import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrammarService } from '../../core/services/grammar.service';
import { CEFR_LEVEL_LABEL, CEFR_LEVEL_ORDER, CefrLevel } from '../../core/models';
import { BadgeChipComponent } from '../../shared/components/badge-chip/badge-chip';

@Component({
  selector: 'app-grammar',
  standalone: true,
  imports: [RouterLink, BadgeChipComponent],
  templateUrl: './grammar.html',
  styleUrl: './grammar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrammarComponent {
  protected readonly grammarService = inject(GrammarService);

  protected readonly levels = CEFR_LEVEL_ORDER;
  protected readonly levelLabel = CEFR_LEVEL_LABEL;

  protected topicsForLevel(level: CefrLevel) {
    return this.grammarService.getByLevel(level);
  }
}
