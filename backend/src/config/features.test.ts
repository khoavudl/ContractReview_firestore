import { describe, it, expect } from 'vitest';
import { FEATURES } from './features.js';

describe('Backend FEATURES configuration', () => {
  it('has ENABLE_NOTIFICATIONS set to false by default for database cost savings', () => {
    expect(FEATURES.ENABLE_NOTIFICATIONS).toBe(false);
  });

  it('has ENABLE_AI set to false by default for token and API cost savings', () => {
    expect(FEATURES.ENABLE_AI).toBe(false);
  });

  it('has ENABLE_EMAIL set to true to enable automated workflow email delivery', () => {
    expect(FEATURES.ENABLE_EMAIL).toBe(true);
  });
});
