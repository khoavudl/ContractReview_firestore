import { GoogleGenAI } from '@google/genai';
import type { GeminiClient, AnalysisPromptInput } from './aiTypes.js';

/**
 * Production Gemini AI client wrapping @google/genai SDK.
 * Supports structured text analysis and Structured Output JSON schema.
 */
export class GoogleGenAIClient implements GeminiClient {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model = process.env.GEMINI_MODEL || 'gemini-3.8-flash') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }
    this.client = new GoogleGenAI({ apiKey: key });
    this.model = model;
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
