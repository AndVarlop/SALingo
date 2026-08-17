import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MistakeMemoryService } from '../../../core/services/mistake-memory.service';
import { MistakeCategory } from '../../../core/models';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

const CATEGORY_LABEL: Record<MistakeCategory, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  interview: 'Interview',
  speaking: 'Speaking',
  'customer-service': 'Customer Service',
};

const CATEGORY_ICON: Record<MistakeCategory, string> = {
  grammar: '✏️',
  vocabulary: '📖',
  interview: '🎙️',
  speaking: '🎤',
  'customer-service': '📞',
};

@Component({
  selector: 'app-mistakes',
  standalone: true,
  imports: [RouterLink, StatCardComponent, EmptyStateComponent],
  templateUrl: './mistakes.html',
  styleUrl: './mistakes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MistakesComponent {
  protected readonly mistakeMemory = inject(MistakeMemoryService);
  protected readonly categoryLabel = CATEGORY_LABEL;
  protected readonly categoryIcon = CATEGORY_ICON;
  protected readonly categories = Object.keys(CATEGORY_LABEL) as MistakeCategory[];

  protected mistakesFor(category: MistakeCategory) {
    return this.mistakeMemory.byCategory()[category];
  }

  protected markReviewed(id: string): void {
    this.mistakeMemory.markReviewed(id);
  }

  protected daysAgo(iso: string): number {
    return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  }
}
