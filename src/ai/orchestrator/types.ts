/**
 * 🧠 ARCHUB CORE AI - Tipos del Orchestrator
 * 
 * Tipos compartidos para el sistema de orquestación inteligente de IA.
 */

export interface AIContext {
  userId: string;
  organizationId: string;
  sessionId?: string;
  language?: string;
  timezone?: string;
}

export interface Entity {
  id: string;
  name: string;
  type: 'project' | 'contact' | 'subcontractor' | 'member' | 'wallet' | 'category';
  organizationId: string;
  confidence: number; // 0-1
  matchedAlias?: string;
  metadata?: Record<string, any>;
}

export interface Intent {
  type: 'financial_query' | 'project_query' | 'general_query' | 'action_request' | 'unknown';
  subtype?: string; // 'balance', 'expenses', 'cashflow', 'list', etc.
  confidence: number; // 0-1
  entities: Entity[];
  temporalScope?: {
    start?: string;
    end?: string;
    period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  };
  filters?: {
    currency?: string;
    type?: 'Ingreso' | 'Egreso';
    role?: string;
  };
}

export interface PipelineContext {
  originalQuestion: string;
  normalizedQuestion: string;
  aiContext: AIContext;
  intent?: Intent;
  queryPlan?: QueryPlan;
  result?: any;
  error?: string;
  metadata: PipelineMetadata;
}

export interface QueryPlan {
  toolName: string;
  parameters: Record<string, any>;
  confidence: number;
  reasoning?: string;
}

export interface PipelineMetadata {
  startTime: number;
  endTime?: number;
  phase: 'normalizing' | 'resolving_entities' | 'classifying_intent' | 'planning_query' | 'executing' | 'formatting' | 'complete' | 'error';
  timings: {
    normalization?: number;
    entityResolution?: number;
    intentClassification?: number;
    queryPlanning?: number;
    execution?: number;
    formatting?: number;
  };
  cacheHit?: boolean;
  confidence?: number;
  warnings?: string[];
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number; // milliseconds
  hits: number;
}

export interface EntitySynonym {
  canonical: string;
  aliases: string[];
  type?: Entity['type'];
}

export interface IntentPattern {
  type: Intent['type'];
  subtype?: string;
  keywords: string[];
  priority: number;
  requiredEntities?: Entity['type'][];
  suggestedTool?: string;
}

export interface AIResponse {
  answer: string;
  confidence: number;
  metadata: {
    intent: Intent;
    entitiesUsed: Entity[];
    queryTime: number;
    cacheHit: boolean;
    warnings?: string[];
  };
  suggestions?: string[];
}
