import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { CEFR_LEVEL_ORDER, VocabularyCategory } from '../../core/models';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';

type CategoryFilter = VocabularyCategory | 'All';
type LevelFilter = (typeof CEFR_LEVEL_ORDER)[number] | 'All';

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [RouterLink, ProgressBarComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './vocabulary.html',
  styleUrl: './vocabulary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VocabularyComponent {
  private readonly vocabularyService = inject(VocabularyService);

  protected readonly loading = this.vocabularyService.loading;
  protected readonly categories: CategoryFilter[] = ['All', ...this.vocabularyService.categories];
  protected readonly levels: LevelFilter[] = ['All', ...CEFR_LEVEL_ORDER];

  protected readonly search = signal('');
  protected readonly categoryFilter = signal<CategoryFilter>('All');
  protected readonly levelFilter = signal<LevelFilter>('All');
  protected readonly favoritesOnly = signal(false);

  protected readonly filteredWords = computed(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.categoryFilter();
    const level = this.levelFilter();
    const onlyFavorites = this.favoritesOnly();

    return this.vocabularyService.words().filter((w) => {
      if (category !== 'All' && w.category !== category) return false;
      if (level !== 'All' && w.level !== level) return false;
      if (onlyFavorites && !w.isFavorite) return false;
      if (term && !w.term.toLowerCase().includes(term) && !w.translation.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  });

  protected setSearch(value: string): void {
    this.search.set(value);
  }

  protected toggleFavorite(wordId: string, event: Event): void {
    event.stopPropagation();
    this.vocabularyService.toggleFavorite(wordId);
  }
}
