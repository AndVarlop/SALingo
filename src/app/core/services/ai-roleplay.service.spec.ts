import { TestBed } from '@angular/core/testing';
import { AiRoleplayService, RoleplayAiError, RoleplayScenarioContext } from './ai-roleplay.service';
import { AiClientService, AiCompleteRequest, AiNotConfiguredError } from './ai-client.service';

const SCENARIO: RoleplayScenarioContext = {
  customerPersona: 'A frustrated small-business owner',
  problem: 'Charged twice for the same subscription.',
  context: 'Calling in about a billing error.',
  difficulty: 'Intermediate',
  expectedResolution: 'Acknowledge the duplicate charge and process a refund.',
  openingLine: 'Hi, I was charged twice for my subscription.',
};

function setup(complete: (req: AiCompleteRequest) => Promise<string> = async () =>
  JSON.stringify({ text: 'Okay, thanks.', resolved: false }),
) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: AiClientService, useValue: { complete } }],
  });
  return TestBed.inject(AiRoleplayService);
}

describe('AiRoleplayService.getCustomerReply', () => {
  it('returns the scripted opening line unresolved when history is empty, without calling the AI', async () => {
    const complete = vi.fn();
    const service = setup(complete);
    const reply = await service.getCustomerReply(SCENARIO, []);
    expect(reply.text).toBe(SCENARIO.openingLine);
    expect(reply.isResolved).toBe(false);
    expect(complete).not.toHaveBeenCalled();
  });

  it('returns the AI reply and resolution flag once there is real history', async () => {
    const service = setup(async () =>
      JSON.stringify({ text: "I can confirm that and I'll process a refund right away.", resolved: true }),
    );
    const reply = await service.getCustomerReply(SCENARIO, [
      { role: 'customer', text: SCENARIO.openingLine },
      { role: 'agent', text: 'I can confirm the duplicate charge and refund it now.' },
    ]);
    expect(reply.text).toContain('refund');
    expect(reply.isResolved).toBe(true);
  });

  it('maps agent turns to the "user" role and customer turns to "assistant" for the AI call', async () => {
    let captured: AiCompleteRequest | null = null;
    const service = setup(async (req) => {
      captured = req;
      return JSON.stringify({ text: 'ok', resolved: false });
    });
    await service.getCustomerReply(SCENARIO, [
      { role: 'customer', text: 'opening' },
      { role: 'agent', text: 'my response' },
    ]);
    expect(captured!.messages).toEqual([
      { role: 'assistant', content: 'opening' },
      { role: 'user', content: 'my response' },
    ]);
    expect(captured!.system).toContain(SCENARIO.customerPersona);
    expect(captured!.system).toContain(SCENARIO.expectedResolution);
  });

  it('forces resolution once the agent has taken MAX_TURNS_BEFORE_FORCED_RESOLUTION turns, as a safety net', async () => {
    const service = setup(async () => JSON.stringify({ text: 'Still not happy.', resolved: false }));
    const history = [
      { role: 'customer' as const, text: 'opening' },
      ...Array.from({ length: 6 }, (_, i) => [
        { role: 'agent' as const, text: `attempt ${i}` },
        { role: 'customer' as const, text: `reply ${i}` },
      ]).flat(),
      { role: 'agent' as const, text: 'final attempt' },
    ];
    const reply = await service.getCustomerReply(SCENARIO, history);
    expect(reply.isResolved).toBe(true);
  });

  it('is honest when the AI is not configured, instead of fabricating a customer reply', async () => {
    const service = setup(async () => {
      throw new AiNotConfiguredError('nope');
    });
    await expect(
      service.getCustomerReply(SCENARIO, [
        { role: 'customer', text: SCENARIO.openingLine },
        { role: 'agent', text: 'hi' },
      ]),
    ).rejects.toThrow(RoleplayAiError);
  });

  it('is honest when the AI response is not valid JSON', async () => {
    const service = setup(async () => 'not json');
    await expect(
      service.getCustomerReply(SCENARIO, [
        { role: 'customer', text: SCENARIO.openingLine },
        { role: 'agent', text: 'hi' },
      ]),
    ).rejects.toThrow(RoleplayAiError);
  });
});
