/**
 * AI Feature - Barrel Export
 * 
 * Feature-Sliced Design para el asistente de IA de Seencel.
 * Incluye chat, orchestrator, tools y componentes de interfaz.
 */

// Components
export { AIPanel } from './components/AIPanel';
export { MessageContent } from './components/MessageContent';

// Services - Chat Handlers
export { chatHandler } from './services/chat/chatHandler';
export { homeGreetingHandler } from './services/chat/homeGreetingHandler';
export { historyHandler } from './services/chat/historyHandler';

// Services - Orchestrator
export { cache } from './services/orchestrator/cache';
export { entityResolver } from './services/orchestrator/entityResolver';
export { entitySynonyms } from './services/orchestrator/entitySynonyms';
export { intentClassifier } from './services/orchestrator/intentClassifier';
export { pipeline } from './services/orchestrator/pipeline';

// Services - Tools (Finance)
export { getCashflowTrend } from './services/tools/finances/getCashflowTrend';
export { getClientCommitments } from './services/tools/finances/getClientCommitments';
export { getContactMovements } from './services/tools/finances/getContactMovements';
export { getDateRangeMovements } from './services/tools/finances/getDateRangeMovements';
export { getOrganizationBalance } from './services/tools/finances/getOrganizationBalance';
export { getProjectFinancialSummary } from './services/tools/finances/getProjectFinancialSummary';
export { getRoleSpending } from './services/tools/finances/getRoleSpending';
export { getTotalPayments } from './services/tools/finances/getTotalPayments';

// Services - Tools (Organization)
export { getOrganizationActivity } from './services/tools/organization/getOrganizationActivity';
export { getOrganizationInfo } from './services/tools/organization/getOrganizationInfo';
export { getOrganizationMembers } from './services/tools/organization/getOrganizationMembers';

// Services - Tools (Projects)
export { getProjectDetails } from './services/tools/projects/getProjectDetails';
export { getProjectsList } from './services/tools/projects/getProjectsList';

// Utils
export { currencyConverter } from './utils/currencyConverter';
export { dateParser } from './utils/dateParser';
export { responseFormatter } from './utils/responseFormatter';
export { textNormalizer } from './utils/textNormalizer';

// Constants
export { SYSTEM_PROMPT } from './constants/systemPrompt';

// Types
export type * from './services/orchestrator/types';
