export type SummaryLength = 'short' | 'medium' | 'detailed';

export interface SummaryOption {
  id: SummaryLength;
  label: string;
  description: string;
  badge: string;
}

export interface UploadedFileState {
  file: File | null;
  name: string;
  size: string;
}

export interface ExtractPdfResponse {
  success: boolean;
  fileName?: string;
  pageCount?: number;
  characterCount?: number;
  text?: string;
  error?: string;
}

export interface GeminiSummaryData {
  summary: string;
  keyPoints: string[];
  keywords: string[];
  actionItems: string[];
}

export interface SummarizeRequest {
  text: string;
  summaryLevel: SummaryLength;
}

export interface SummarizeResponse {
  success: boolean;
  data?: GeminiSummaryData;
  error?: string;
}
