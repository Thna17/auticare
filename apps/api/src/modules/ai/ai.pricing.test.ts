import { describe, expect, it } from 'vitest';
import { estimateSpendUsd } from './ai.pricing.js';

describe('AI spend estimation', () => {
  it('prices known models at their peak rates, so the figure is a ceiling', () => {
    expect(estimateSpendUsd([{ model: 'deepseek-flash', tokensIn: 1_000_000, tokensOut: 0 }])).toBe(
      0.3,
    );
    expect(estimateSpendUsd([{ model: 'deepseek-flash', tokensIn: 0, tokensOut: 1_000_000 }])).toBe(
      1.2,
    );
  });

  it('adds calls up rather than pricing each one separately', () => {
    expect(
      estimateSpendUsd([
        { model: 'deepseek-flash', tokensIn: 500_000, tokensOut: 0 },
        { model: 'deepseek-flash', tokensIn: 500_000, tokensOut: 0 },
      ]),
    ).toBe(0.3);
  });

  it('counts a safety reply as free, because it never reached a provider', () => {
    expect(estimateSpendUsd([{ model: null, tokensIn: null, tokensOut: null }])).toBe(0);
  });

  it('refuses to guess for a model with no price card', () => {
    expect(estimateSpendUsd([{ model: 'unlisted-model', tokensIn: 10, tokensOut: 10 }])).toBeNull();
  });
});
