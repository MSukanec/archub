/**
 * AI Feature - Barrel Export
 * 
 * Feature-Sliced Design para el asistente de IA de Seencel.
 * Incluye chat, orchestrator, tools y componentes de interfaz.
 */

// Components
export { AIPanel } from './components/AIPanel';
export { MessageContent } from './components/MessageContent';

// Hooks
export { useAIHistory } from './hooks/use-ai-history';
export { useAIChat } from './hooks/use-ai-chat';

// Services - API
export { getAIHistory } from './services/getAIHistory';
export { sendAIChatMessage } from './services/sendAIChatMessage';

// Services - Chat Handlers
export { getChatHandler, checkAndIncrementUsageLimit } from './services/chat/chatHandler';
export { getHomeGreetingHandler } from './services/chat/homeGreetingHandler';
export { getHistoryHandler } from './services/chat/historyHandler';

// Services - Orchestrator
export { aiCache } from './services/orchestrator/cache';
export { resolveEntities, invalidateEntityCache, type EntitySearchResult } from './services/orchestrator/entityResolver';
export { 
  expandWithSynonyms, 
  extractKeyTerms, 
  generateEntityVariants,
  financialTermSynonyms,
  abbreviationPatterns,
  regionalVariants,
  EntitySynonymRegistry,
  synonymRegistry
} from './services/orchestrator/entitySynonyms';
export { 
  classifyIntent, 
  suggestToolForIntent, 
  validateIntent 
} from './services/orchestrator/intentClassifier';
export { 
  runAIPipeline,
  enrichSystemPrompt, 
  cacheAIResult, 
  getPipelineMetrics 
} from './services/orchestrator/pipeline';

// Services - Tools (Finance)
export { getCashflowTrend } from './services/tools/finances/getCashflowTrend';
export { getClientCommitments } from './services/tools/finances/getClientCommitments';
export { getContactMovements } from './services/tools/finances/getContactMovements';
export { getDateRangeMovements } from './services/tools/finances/getDateRangeMovements';
export { getOrganizationBalance } from './services/tools/finances/getOrganizationBalance';
export { getProjectFinancialSummary } from './services/tools/finances/getProjectFinancialSummary';
export { getRoleSpending } from './services/tools/finances/getRoleSpending';
export { getTotalPaymentsByContactAndProject } from './services/tools/finances/getTotalPayments';

// Services - Tools (Organization)
export { getOrganizationActivity } from './services/tools/organization/getOrganizationActivity';
export { getOrganizationInfo } from './services/tools/organization/getOrganizationInfo';
export { getOrganizationMembers } from './services/tools/organization/getOrganizationMembers';

// Services - Tools (Projects)
export { getProjectDetails } from './services/tools/projects/getProjectDetails';
export { getProjectsList } from './services/tools/projects/getProjectsList';

// Utils
export { convertCurrency } from './utils/currencyConverter';
export { parseDateExpression, type DateRange } from './utils/dateParser';
export { formatCurrency, formatDateRange, formatMovementCount } from './utils/responseFormatter';
export { normalizeText, textMatches, textIncludes } from './utils/textNormalizer';

// Constants
export { getGreetingSystemPrompt, getChatSystemPrompt, GENERAL_GUIDELINES, SYSTEM_PROMPT } from './constants/systemPrompt';
export { AI_QUERY_KEYS } from './constants';

// Types
export type { ChatMessage, AIHistoryResponse, AIChatRequest, AIChatResponse } from './types';
export type * from './services/orchestrator/types';
