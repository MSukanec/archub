/**
 * AI Feature Constants
 * 
 * Query keys y otras constantes para el feature de IA.
 */
export const AI_QUERY_KEYS = {
  all: ['ai'] as const,
  history: () => [...AI_QUERY_KEYS.all, 'history'] as const,
} as const;
