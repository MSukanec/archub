/**
 * AI Feature Types
 * 
 * Tipos TypeScript para el feature de IA.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIHistoryResponse {
  messages: ChatMessage[];
}

export interface AIChatRequest {
  message: string;
}

export interface AIChatResponse {
  response: string;
}
