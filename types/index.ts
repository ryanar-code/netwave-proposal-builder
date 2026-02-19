export interface BriefFormData {
  clientName: string;
  projectType: string;
  deadline: string;
  files: File[];
}

export interface GenerateBriefRequest {
  clientName: string;
  projectType: string;
  deadline: string;
  documents: string[]; // Array of extracted text from uploaded files
}

export interface GeneratedBrief {
  internalBrief?: string;
  statementOfWork?: string;
  timeline?: string;
  kickoffPresentation?: string;
}

export type DocumentType = 'internalBrief' | 'statementOfWork' | 'timeline' | 'kickoffPresentation';

export interface GenerateBriefResponse {
  success: boolean;
  data?: GeneratedBrief;
  error?: string;
}

export const PROJECT_TYPES = [
  'Website',
  'Mobile App',
  'Branding',
  'Marketing Campaign',
  'Product Design',
  'Other'
] as const;

export type ProjectType = typeof PROJECT_TYPES[number];
