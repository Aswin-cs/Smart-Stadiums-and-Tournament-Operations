import { getOrganiserPrompt, getFanPrompt } from '@/app/lib/ai-prompts';

describe('ai-prompts', () => {
  it('returns organiser prompt with and without crowdData', () => {
    const promptWithoutData = getOrganiserPrompt();
    expect(promptWithoutData).toContain('You are a helpful Stadium Operations AI Assistant');
    expect(promptWithoutData).not.toContain('Crowd Density');

    const promptWithData = getOrganiserPrompt({ gates: [] });
    expect(promptWithData).toContain('Crowd Density & Gate Status Data');
  });

  it('returns fan prompt with and without data', () => {
    const promptWithoutData = getFanPrompt();
    expect(promptWithoutData).toContain('You are the official AI Assistant for the FIFA World Cup 2026');
    expect(promptWithoutData).not.toContain("User's Current Ticket Info");

    const promptWithData = getFanPrompt({ gate: 'A' }, { scores: [] }, { bus: [] });
    expect(promptWithData).toContain("User's Current Ticket Info");
    expect(promptWithData).toContain('Schedule and Match Scores');
    expect(promptWithData).toContain('Current Transportation Status');
  });
});
