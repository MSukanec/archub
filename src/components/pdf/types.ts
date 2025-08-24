export interface PdfBlockProps<T = any> {
  data?: T;
  config?: Record<string, any>;
}

export interface PdfBlock {
  type: string;
  enabled: boolean;
  data?: any;
  config?: Record<string, any>;
}