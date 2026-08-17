import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { InterviewQuestionService } from '../../../core/services/interview-question.service';
import { InterviewProgressService } from '../../../core/services/interview-progress.service';
import { CallCenterPhraseCategory } from '../../../core/models';

type VocabCategory = 'Customer Service' | 'Calls' | 'Problem Solving' | 'Sales' | 'All';
type Tab = 'vocabulary' | 'phrases';

const VOCAB_CATEGORIES: VocabCategory[] = ['All', 'Customer Service', 'Calls', 'Problem Solving', 'Sales'];
const PHRASE_CATEGORIES: CallCenterPhraseCategory[] = [
  'Greeting',
  'Verification',
  'Clarification',
  'Hold',
  'Transfer',
  'Closing',
];

@Component({
  selector: 'app-interview-vocabulary',
  standalone: true,
  templateUrl: './vocabulary.html',
  styleUrl: './vocabulary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewVocabularyComponent {
  private readonly questionService = inject(InterviewQuestionService);
  protected readonly progress = inject(InterviewProgressService);

  protected readonly tab = signal<Tab>('vocabulary');
  protected readonly search = signal('');
  protected readonly categoryFilter = signal<VocabCategory>('All');
  protected readonly speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  protected readonly vocabCategories = VOCAB_CATEGORIES;
  protected readonly phraseCategories = PHRASE_CATEGORIES;

  protected readonly filteredWords = computed(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.categoryFilter();
    return this.questionService.vocabulary.filter((w) => {
      if (category !== 'All' && w.category !== category) return false;
      if (term && !w.term.toLowerCase().includes(term) && !w.translation.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  protected phrasesForCategory(category: CallCenterPhraseCategory) {
    return this.questionService.phrases.filter((p) => p.category === category);
  }

  protected play(text: string): void {
    if (!this.speechSupported) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}
