import { TestBed } from '@angular/core/testing';
import { AiTutorService } from './ai-tutor.service';
import { MistakeMemoryService } from './mistake-memory.service';
import { AiClientService, AiCompleteRequest, AiNotConfiguredError } from './ai-client.service';

function setup(overrides: {
  complete?: (req: AiCompleteRequest) => Promise<string>;
} = {}) {
  const recordAllCalls: unknown[] = [];
  const complete = overrides.complete ?? (async () => 'default fake reply');
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: MistakeMemoryService,
        useValue: { recordAll: (...args: unknown[]) => recordAllCalls.push(args) },
      },
      { provide: AiClientService, useValue: { complete } },
    ],
  });
  return { service: TestBed.inject(AiTutorService), recordAllCalls };
}

describe('AiTutorService.sendMessage — correction topic (rule-based, no AI call)', () => {
  it('points out a real detected mistake instead of always praising the answer', async () => {
    const { service } = setup();
    const reply = await service.sendMessage([], 'I am agree with you', 'correction');
    expect(reply.text).toContain('I agree');
    expect(reply.text).not.toContain("That's a great sentence");
  });

  it('is honest when it finds nothing, instead of fabricating a correction', async () => {
    const { service } = setup();
    const reply = await service.sendMessage([], 'This is a perfectly normal sentence.', 'correction');
    expect(reply.text.toLowerCase()).toContain("didn't catch");
  });

  it('records detected mistakes into My Mistakes with the AI Tutor source', async () => {
    const { service, recordAllCalls } = setup();
    await service.sendMessage([], 'peoples are nice', 'correction');
    expect(recordAllCalls.length).toBe(1);
    expect(recordAllCalls[0]).toEqual([expect.any(Array), 'AI Tutor']);
  });
});

describe('AiTutorService.sendMessage — every other topic (real AI via AiClientService)', () => {
  it('returns the real Claude reply on success', async () => {
    const { service } = setup({ complete: async () => 'Sure, "I have been working" uses present perfect.' });
    const reply = await service.sendMessage([], 'How do I use present perfect?', 'grammar');
    expect(reply.text).toBe('Sure, "I have been working" uses present perfect.');
  });

  it('sends the real conversation history plus the new message to the AI client', async () => {
    let captured: AiCompleteRequest | null = null;
    const { service } = setup({
      complete: async (req) => {
        captured = req;
        return 'ok';
      },
    });
    const history = [
      { id: '1', role: 'assistant' as const, text: 'Hi!', timestamp: '' },
      { id: '2', role: 'user' as const, text: 'I want to practice.', timestamp: '' },
    ];
    await service.sendMessage(history, 'Can we talk about food?', 'conversation');

    expect(captured!.messages).toEqual([
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'I want to practice.' },
      { role: 'user', content: 'Can we talk about food?' },
    ]);
    expect(captured!.system).toContain('conversation partner');
  });

  it('is honest that AI is not configured yet, instead of returning a fabricated reply', async () => {
    const { service } = setup({
      complete: async () => {
        throw new AiNotConfiguredError('not configured');
      },
    });
    const reply = await service.sendMessage([], 'test', 'speaking');
    expect(reply.text.toLowerCase()).toContain("isn't connected");
  });

  it('is honest when the AI request fails for any other reason', async () => {
    const { service } = setup({
      complete: async () => {
        throw new Error('network down');
      },
    });
    const reply = await service.sendMessage([], 'test', 'vocabulary');
    expect(reply.text.toLowerCase()).toContain("couldn't reach");
  });
});

describe('AiTutorService.startTopic', () => {
  it('returns the static topic-intro copy without calling the AI client', async () => {
    const complete = vi.fn();
    const { service } = setup({ complete });
    const reply = await service.startTopic('grammar');
    expect(reply.text).toContain('grammar topic');
    expect(complete).not.toHaveBeenCalled();
  });
});
