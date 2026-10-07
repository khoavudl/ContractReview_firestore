import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleGenAIClient, resolveGenAIOptions } from './geminiClient.js';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation((config) => ({
      _config: config,
      models: {
        generateContent: vi.fn(),
      },
    })),
  };
});

describe('geminiClient', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_GENAI_USE_VERTEXAI;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GCLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_LOCATION;
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('resolveGenAIOptions', () => {
    it('defaults to Vertex AI in global location with gemini-3.8-flash', () => {
      const resolved = resolveGenAIOptions();
      expect(resolved.model).toBe('gemini-3.8-flash');
      expect((resolved.client as any)._config).toEqual({
        vertexai: true,
        project: 'contractreview-v2',
        location: 'global',
      });
    });

    it('uses custom project, location and model when provided', () => {
      const resolved = resolveGenAIOptions({
        project: 'custom-proj',
        location: 'us-central1',
        model: 'gemini-2.5-pro',
      });
      expect(resolved.model).toBe('gemini-2.5-pro');
      expect((resolved.client as any)._config).toEqual({
        vertexai: true,
        project: 'custom-proj',
        location: 'us-central1',
      });
    });

    it('falls back to API key when useVertexAI is false and apiKey is supplied', () => {
      const resolved = resolveGenAIOptions({
        useVertexAI: false,
        apiKey: 'test-api-key',
      });
      expect((resolved.client as any)._config).toEqual({
        apiKey: 'test-api-key',
      });
    });

    it('falls back to string apiKey argument when useVertexAI is false in env', () => {
      process.env.GOOGLE_GENAI_USE_VERTEXAI = 'false';
      const resolved = resolveGenAIOptions('legacy-api-key', 'gemini-1.5-pro');
      expect(resolved.model).toBe('gemini-1.5-pro');
      expect((resolved.client as any)._config).toEqual({
        apiKey: 'legacy-api-key',
      });
    });

    it('throws error when useVertexAI is false and no API key is provided', () => {
      expect(() =>
        resolveGenAIOptions({ useVertexAI: false })
      ).toThrow('GEMINI_API_KEY is not configured in environment.');
    });
  });

  describe('GoogleGenAIClient', () => {
    it('successfully calls generateContent and parses structured JSON output', async () => {
      const client = new GoogleGenAIClient();
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ summary: 'Thành công' }),
      });
      (client as any).client.models.generateContent = mockGenerateContent;

      const result = await client.generateAnalysis<{ summary: string }>(
        {
          systemInstruction: 'Bạn là chuyên gia.',
          userPrompt: 'Tóm tắt hợp đồng',
          contractText: 'Điều 1: Thanh toán 100tr.',
        },
        { type: 'object' }
      );

      expect(result).toEqual({ summary: 'Thành công' });
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.model).toBe('gemini-3.8-flash');
      expect(callArg.contents[0].text).toContain('Tóm tắt hợp đồng');
      expect(callArg.contents[0].text).toContain('Điều 1: Thanh toán 100tr.');
      expect(callArg.config.systemInstruction).toBe('Bạn là chuyên gia.');
      expect(callArg.config.responseMimeType).toBe('application/json');
    });

    it('throws error when generateContent returns empty text', async () => {
      const client = new GoogleGenAIClient();
      (client as any).client.models.generateContent = vi.fn().mockResolvedValue({
        text: null,
      });

      await expect(
        client.generateAnalysis(
          { systemInstruction: 'Rule', userPrompt: 'Prompt' },
          {}
        )
      ).rejects.toThrow('No response text received from Gemini API.');
    });
  });
});
