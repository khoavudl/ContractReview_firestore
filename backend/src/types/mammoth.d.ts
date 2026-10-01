declare module 'mammoth' {
  export interface RawTextResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function extractRawText(input: { buffer: Buffer }): Promise<RawTextResult>;
  export function convertToHtml(input: { buffer: Buffer }): Promise<{ value: string; messages: Array<{ type: string; message: string }> }>;
}
