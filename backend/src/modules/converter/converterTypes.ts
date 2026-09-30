/**
     * Interface for Docx to Pdf conversion engine (Strategy Pattern).
     * Decouples Storage Trigger logic from specific converter implementations.
     */
    export interface DocxToPdfConverter {
      convert(docxBuffer: Buffer): Promise<Buffer>;
    }

    export interface ParsedVersionPath {
      contractId: string;
      versionFileName: string;
      versionId: string;
    }

    export interface ConversionResult {
      success: boolean;
      contractId: string;
      versionFileName: string;
      previewPdfPath?: string;
      error?: string;
    }
    
