import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MOCK_ROLEPLAY_SCENARIOS } from '../../../../core/services/mock-data/mock-roleplay.data';
import { AiRoleplayService } from '../../../../core/services/ai-roleplay.service';
import { AiInterviewEvaluationService, InterviewAnswerEvaluation } from '../../../../core/services/ai-interview-evaluation.service';
import { CallFlowScoringService } from '../../../../core/services/call-flow-scoring.service';
import { MistakeDetectionService } from '../../../../core/services/mistake-detection.service';
import { MistakeMemoryService } from '../../../../core/services/mistake-memory.service';
import { UserStateService } from '../../../../core/services/user-state.service';
import { InterviewSessionService } from '../../../../core/services/interview-session.service';
import { XP_RULES } from '../../../../core/constants/xp.constant';
import { CallPerformance } from '../../../../core/models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

interface RoleplayMessage {
  role: 'customer' | 'agent';
  text: string;
}

type Phase = 'intro' | 'chatting' | 'result';

@Component({
  selector: 'app-roleplay-session',
  standalone: true,
  imports: [RouterLink, FormsModule, EmptyStateComponent],
  templateUrl: './roleplay-session.html',
  styleUrl: './roleplay-session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleplaySessionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly aiRoleplay = inject(AiRoleplayService);
  private readonly aiEvaluation = inject(AiInterviewEvaluationService);
  private readonly callFlowScoring = inject(CallFlowScoringService);
  private readonly mistakeDetection = inject(MistakeDetectionService);
  private readonly mistakeMemory = inject(MistakeMemoryService);
  private readonly userState = inject(UserStateService);
  private readonly sessionService = inject(InterviewSessionService);
  private readonly scrollAnchor = viewChild<ElementRef<HTMLDivElement>>('scrollAnchor');

  protected readonly scenario = computed(() =>
    MOCK_ROLEPLAY_SCENARIOS.find((s) => s.id === this.route.snapshot.paramMap.get('id')),
  );

  protected readonly phase = signal<Phase>('intro');
  protected readonly messages = signal<RoleplayMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly thinking = signal(false);
  protected readonly resolved = signal(false);
  protected readonly evaluation = signal<InterviewAnswerEvaluation | null>(null);
  protected readonly callPerformance = signal<CallPerformance | null>(null);

  private turnIndex = 0;

  protected async startRoleplay(): Promise<void> {
    const scenario = this.scenario();
    if (!scenario) return;
    this.phase.set('chatting');
    this.thinking.set(true);
    const reply = await this.aiRoleplay.getCustomerReply({
      openingLine: scenario.openingLine,
      expectedResolution: scenario.expectedResolution,
      difficulty: scenario.difficulty,
      turnIndex: this.turnIndex,
      agentText: '',
    });
    this.turnIndex += 1;
    this.messages.set([{ role: 'customer', text: reply.text }]);
    this.thinking.set(false);
    this.scrollToBottom();
  }

  protected setDraft(value: string): void {
    this.draft.set(value);
  }

  protected async sendReply(): Promise<void> {
    const scenario = this.scenario();
    const text = this.draft().trim();
    if (!scenario || !text || this.thinking() || this.resolved()) return;

    this.messages.update((m) => [...m, { role: 'agent', text }]);
    this.draft.set('');
    this.thinking.set(true);
    this.scrollToBottom();

    const reply = await this.aiRoleplay.getCustomerReply({
      openingLine: scenario.openingLine,
      expectedResolution: scenario.expectedResolution,
      difficulty: scenario.difficulty,
      turnIndex: this.turnIndex,
      agentText: text,
    });
    this.turnIndex += 1;
    this.messages.update((m) => [...m, { role: 'customer', text: reply.text }]);
    this.thinking.set(false);
    this.resolved.set(reply.isResolved);
    this.scrollToBottom();
  }

  protected async finishRoleplay(): Promise<void> {
    const scenario = this.scenario();
    if (!scenario) return;

    const agentText = this.messages()
      .filter((m) => m.role === 'agent')
      .map((m) => m.text)
      .join(' ');

    this.thinking.set(true);
    const result = await this.aiEvaluation.evaluateAnswer(agentText || 'No response given.');
    this.evaluation.set(result);
    this.callPerformance.set(
      this.callFlowScoring.score(agentText, scenario.availableInfo.length > 0),
    );
    const detected = this.mistakeDetection.detect(agentText);
    if (detected.length) await this.mistakeMemory.recordAll(detected, `Roleplay: ${scenario.title}`);
    this.thinking.set(false);
    this.phase.set('result');

    this.userState.recordActivity({
      minutes: 3,
      xp: XP_RULES.lessonCompleteBonus + Math.round(result.overallScore / 10),
      type: 'interview',
      title: `Completed roleplay: ${scenario.title}`,
      accuracy: result.overallScore,
    });
    await this.sessionService.saveRoleplayCompletion(scenario.id, result.overallScore);
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      this.scrollAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }
}
