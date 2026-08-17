import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiTutorService } from '../../core/services/ai-tutor.service';
import { AiChatMessage, AiTutorTopic } from '../../core/models';

interface TopicOption {
  topic: AiTutorTopic;
  label: string;
  icon: string;
}

const TOPICS: TopicOption[] = [
  { topic: 'grammar', label: 'Grammar', icon: '✏️' },
  { topic: 'speaking', label: 'Speaking', icon: '🎤' },
  { topic: 'vocabulary', label: 'Vocabulary', icon: '📖' },
  { topic: 'conversation', label: 'Conversation', icon: '💬' },
  { topic: 'correction', label: 'Correct my English', icon: '✅' },
];

@Component({
  selector: 'app-ai-tutor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-tutor.html',
  styleUrl: './ai-tutor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiTutorComponent {
  private readonly aiTutor = inject(AiTutorService);
  private readonly scrollAnchor = viewChild<ElementRef<HTMLDivElement>>('scrollAnchor');

  protected readonly topics = TOPICS;
  protected readonly messages = signal<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! What would you like to practice today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  protected readonly draft = signal('');
  protected readonly thinking = signal(false);

  protected async pickTopic(topic: AiTutorTopic): Promise<void> {
    this.thinking.set(true);
    try {
      const reply = await this.aiTutor.startTopic(topic);
      this.messages.update((m) => [...m, reply]);
      this.scrollToBottom();
    } finally {
      this.thinking.set(false);
    }
  }

  protected setDraft(value: string): void {
    this.draft.set(value);
  }

  protected async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.thinking()) return;

    const userMessage: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    this.messages.update((m) => [...m, userMessage]);
    this.draft.set('');
    this.thinking.set(true);
    this.scrollToBottom();

    try {
      const reply = await this.aiTutor.sendMessage(this.messages(), text);
      this.messages.update((m) => [...m, reply]);
    } finally {
      this.thinking.set(false);
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      this.scrollAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }
}
