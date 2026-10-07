import { GoogleGenAI } from '@google/genai';
import type { GeminiClient, AnalysisPromptInput } from './aiTypes.js';

export interface GoogleGenAIClientOptions {
  apiKey?: string;
  project?: string;
  location?: string;
  useVertexAI?: boolean;
  model?: string;
}

/**
 * Resolves GoogleGenAI SDK configuration for Vertex AI or Google AI Studio.
 * Follows SRP with <= 25 lines of logic.
 */
export function resolveGenAIOptions(
  apiKeyOrOptions?: string | GoogleGenAIClientOptions,
  customModel?: string
): { client: GoogleGenAI; model: string } {
  const opts = typeof apiKeyOrOptions === 'string'
    ? { apiKey: apiKeyOrOptions, model: customModel, useVertexAI: false }
    : apiKeyOrOptions || {};

  const isVertexAI = opts.useVertexAI ?? (process.env.GOOGLE_GENAI_USE_VERTEXAI !== 'false');
  const model = opts.model || customModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (isVertexAI) {
    const project = opts.project || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'contractreview-v2';
    const location = opts.location || process.env.GOOGLE_CLOUD_LOCATION || 'global';
    return {
      client: new GoogleGenAI({ vertexai: true, project, location }),
      model,
    };
  }

  const key = opts.apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  return {
    client: new GoogleGenAI({ apiKey: key }),
    model,
  };
}

/**
 * Production Gemini AI client wrapping @google/genai SDK.
 * Supports structured text analysis and Structured Output JSON schema.
 */
export class GoogleGenAIClient implements GeminiClient {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKeyOrOptions?: string | GoogleGenAIClientOptions, model?: string) {
    const resolved = resolveGenAIOptions(apiKeyOrOptions, model);
    this.client = resolved.client;
    this.model = resolved.model;
  }

  async generateAnalysis<T>(
    input: AnalysisPromptInput,
    responseSchema: Record<string, unknown>
  ): Promise<T> {
    const contents: Array<Record<string, unknown>> = [];

    let combinedPrompt = input.userPrompt;
    if (input.contractText && input.contractText.trim().length > 0) {
      combinedPrompt = `${input.userPrompt}\n\n--- NỘI DUNG VĂN BẢN HỢP ĐỒNG ---\n${input.contractText.trim()}`;
    }

    contents.push({ text: combinedPrompt });

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: input.systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response text received from Gemini API.');
    }

    return JSON.parse(text) as T;
  }
}
