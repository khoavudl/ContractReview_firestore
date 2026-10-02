import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS } from './features';

describe('Frontend FEATURE_FLAGS configuration', () => {
  it('has ENABLE_NOTIFICATIONS set to false by default for DB cost optimization', () => {
    expect(FEATURE_FLAGS.ENABLE_NOTIFICATIONS).toBe(false);
  });

  it('has ENABLE_AI set to false by default for API token cost optimization', () => {
    expect(FEATURE_FLAGS.ENABLE_AI).toBe(false);
  });

  it('has ENABLE_EMAIL set to false by default for SMTP quota optimization', () => {
    expect(FEATURE_FLAGS.ENABLE_EMAIL).toBe(false);
  });
});
