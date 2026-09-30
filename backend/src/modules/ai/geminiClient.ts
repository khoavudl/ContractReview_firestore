import { GoogleGenAI } from '@google/genai';
import type { GeminiClient, AnalysisPromptInput } from './aiTypes.js';

/**
 * Production Gemini AI client wrapping @google/genai SDK.
 * Supports Multimodal PDF inline submission and Structured Output schema.
 */
export class GoogleGenAIClient implements GeminiClient {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model = 'gemini-2.5-flash') {
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

    if (input.pdfBuffer && input.pdfBuffer.length > 0) {
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: input.pdfBuffer.toString('base64'),
        },
      });
    }

    contents.push({ text: input.userPrompt });

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
