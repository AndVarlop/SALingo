import { TestBed } from '@angular/core/testing';
import { AiTutorService } from './ai-tutor.service';
import { MistakeMemoryService } from './mistake-memory.service';

describe('AiTutorService.sendMessage — correction topic', () => {
  let service: AiTutorService;
  let recordAllCalls: unknown[];

  beforeEach(() => {
    recordAllCalls = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MistakeMemoryService,
          useValue: { recordAll: (...args: unknown[]) => recordAllCalls.push(args) },
        },
      ],
    });
    service = TestBed.inject(AiTutorService);
  });

  it('points out a real detected mistake instead of always praising the answer', async () => {
    const reply = await service.sendMessage([], 'I am agree with you', 'correction');
    expect(reply.text).toContain('I agree');
    expect(reply.text).not.toContain("That's a great sentence");
  });

  it('is honest when it finds nothing, instead of fabricating a correction', async () => {
    const reply = await service.sendMessage([], 'This is a perfectly normal sentence.', 'correction');
    expect(reply.text.toLowerCase()).toContain("didn't catch");
  });

  it('records detected mistakes into My Mistakes with the AI Tutor source', async () => {
    await service.sendMessage([], 'peoples are nice', 'correction');
    expect(recordAllCalls.length).toBe(1);
    expect(recordAllCalls[0]).toEqual([expect.any(Array), 'AI Tutor']);
  });

  it('falls back to the generic mock reply for non-correction topics', async () => {
    const reply = await service.sendMessage([], 'I am agree with you', 'conversation');
    expect(reply.text).toContain('Got it');
  });
});
