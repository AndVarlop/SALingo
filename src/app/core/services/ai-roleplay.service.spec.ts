import { AiRoleplayService } from './ai-roleplay.service';

describe('AiRoleplayService.getCustomerReply', () => {
  const service = new AiRoleplayService();
  const base = {
    openingLine: "Hi, I was charged twice for my subscription.",
    expectedResolution: 'Acknowledge the charge and process a refund for the duplicate payment.',
    difficulty: 'Intermediate' as const,
  };

  it('returns the opening line unresolved on turn 0, regardless of agentText', async () => {
    const reply = await service.getCustomerReply({ ...base, turnIndex: 0, agentText: '' });
    expect(reply.text).toBe(base.openingLine);
    expect(reply.isResolved).toBe(false);
  });

  it('does NOT resolve when the agent response ignores the actual problem', async () => {
    const reply = await service.getCustomerReply({
      ...base,
      turnIndex: 2,
      agentText: 'Have you tried turning it off and on again?',
    });
    expect(reply.isResolved).toBe(false);
  });

  it('resolves once the agent response addresses the scenario-specific resolution', async () => {
    const reply = await service.getCustomerReply({
      ...base,
      turnIndex: 2,
      agentText: "I can confirm the duplicate charge and I'll process a refund right away.",
    });
    expect(reply.isResolved).toBe(true);
  });

  it('does not resolve on turn 1 even with a matching answer (too early)', async () => {
    const reply = await service.getCustomerReply({
      ...base,
      turnIndex: 1,
      agentText: "I can confirm the duplicate charge and process a refund.",
    });
    expect(reply.isResolved).toBe(false);
  });

  it('two different scenarios with different expectedResolution produce different acceptance criteria', async () => {
    const billingContext = {
      openingLine: 'x',
      expectedResolution: 'Acknowledge the charge and process a refund for the duplicate payment.',
      difficulty: 'Intermediate' as const,
      turnIndex: 2,
      agentText: 'I can confirm the duplicate charge and process a refund.',
    };
    const technicalContext = {
      ...billingContext,
      expectedResolution: 'Walk the customer through resetting the router and confirm the connection is restored.',
    };

    const billingReply = await service.getCustomerReply(billingContext);
    const technicalReply = await service.getCustomerReply(technicalContext);

    // Same agent text satisfies the billing scenario but not the unrelated technical one —
    // proof the response depends on the scenario, not a fixed script.
    expect(billingReply.isResolved).toBe(true);
    expect(technicalReply.isResolved).toBe(false);
  });

  it('always resolves by turn 4 as a safety net, even without a matching answer', async () => {
    const reply = await service.getCustomerReply({
      ...base,
      turnIndex: 4,
      agentText: 'I am not sure what to tell you.',
    });
    expect(reply.isResolved).toBe(true);
  });

  it('uses a more impatient tone for Expert difficulty when the agent has not resolved it', async () => {
    const reply = await service.getCustomerReply({
      ...base,
      difficulty: 'Expert',
      turnIndex: 1,
      agentText: 'Let me look into that for you.',
    });
    expect(reply.isResolved).toBe(false);
    expect(reply.text.length).toBeGreaterThan(0);
  });
});
