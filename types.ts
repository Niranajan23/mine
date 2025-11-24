export type TemplateId = 'classic' | 'modern' | 'dark' | 'corporate';

export interface SlideData {
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
  image?: string; // Base64 data URI
}

export interface PresentationData {
  title: string;
  subtitle?: string;
  slides: SlideData[];
  template?: TemplateId;
  titleImage?: string; // Base64 data URI
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING_PDF = 'PARSING_PDF',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  GENERATING_PPT = 'GENERATING_PPT',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GenerationConfig {
  numSlides: number;
  detailLevel: 'brief' | 'detailed';
  audience: 'academic' | 'general' | 'executive';
  template: TemplateId;
  titleImage?: string;
}