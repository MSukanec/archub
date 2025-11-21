/**
 * AI Feature - Barrel Export
 * 
 * Feature-Sliced Design para el asistente de IA de Seencel.
 * Solo exports de frontend - el backend está en server/lib/ai/
 */

// Components
export { AIPanel } from './components/AIPanel';
export { MessageContent } from './components/MessageContent';

// Hooks
export { useAIHistory } from './hooks/use-ai-history';
export { useAIChat } from './hooks/use-ai-chat';

// Services - API (Frontend calls to backend)
export { getAIHistory } from './services/getAIHistory';
export { sendAIChatMessage } from './services/sendAIChatMessage';

// Constants
export { AI_QUERY_KEYS } from './constants';

// Utils (browser-safe utilities)
export { convertCurrency } from './utils/currencyConverter';

// Types
export type { ChatMessage, AIHistoryResponse, AIChatRequest, AIChatResponse } from './types';
