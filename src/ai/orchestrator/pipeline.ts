/**
 * 🧠 ARCHUB CORE AI - Pipeline Orquestador Central
 * 
 * Pipeline de 8 fases que coordina todo el razonamiento de IA:
 * 1. Normalización de input
 * 2. Verificación de caché
 * 3. Resolución de entidades
 * 4. Clasificación de intención
 * 5. Planificación de query
 * 6. Ejecución (delegada a OpenAI function calling)
 * 7. Formateo de respuesta
 * 8. Actualización de caché
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AIContext, PipelineContext, Intent, QueryPlan, AIResponse } from './types';
import { normalizeText } from '../utils/textNormalizer';
import { expandWithSynonyms } from './entitySynonyms';
import { aiCache } from './cache';
import { resolveEntities } from './entityResolver';
import { classifyIntent, suggestToolForIntent, validateIntent } from './intentClassifier';

/**
 * Ejecuta el pipeline completo de razonamiento de IA
 */
export async function runAIPipeline(
  question: string,
  context: AIContext,
  supabase: SupabaseClient
): Promise<PipelineContext> {
  
  const pipelineCtx: PipelineContext = {
    originalQuestion: question,
    normalizedQuestion: '',
    aiContext: context,
    metadata: {
      startTime: Date.now(),
      phase: 'normalizing',
      timings: {},
      warnings: []
    }
  };
  
  try {
    // ========== FASE 1: Normalización ==========
    const normalizeStart = Date.now();
    pipelineCtx.normalizedQuestion = normalizeInput(question);
    pipelineCtx.metadata.timings.normalization = Date.now() - normalizeStart;
    
    // ========== FASE 2: Verificación de Caché ==========
    pipelineCtx.metadata.phase = 'resolving_entities';
    const cached = aiCache.getAIResponse(question, context.organizationId);
    
    if (cached) {
      pipelineCtx.result = cached;
      pipelineCtx.metadata.cacheHit = true;
      pipelineCtx.metadata.phase = 'complete';
      pipelineCtx.metadata.endTime = Date.now();
      return pipelineCtx;
    }
    
    pipelineCtx.metadata.cacheHit = false;
    
    // ========== FASE 3: Resolución de Entidades ==========
    const entitiesStart = Date.now();
    const entities = await resolveEntities(
      pipelineCtx.normalizedQuestion,
      context,
      supabase,
      {
        minConfidence: 0.5,
        maxResults: 5
      }
    );
    pipelineCtx.metadata.timings.entityResolution = Date.now() - entitiesStart;
    
    // ========== FASE 4: Clasificación de Intención ==========
    pipelineCtx.metadata.phase = 'classifying_intent';
    const intentStart = Date.now();
    const intent = classifyIntent(pipelineCtx.normalizedQuestion, entities);
    pipelineCtx.intent = intent;
    pipelineCtx.metadata.timings.intentClassification = Date.now() - intentStart;
    pipelineCtx.metadata.confidence = intent.confidence;
    
    // Validar intención
    const validation = validateIntent(intent);
    if (!validation.valid) {
      pipelineCtx.metadata.warnings = validation.missingContext;
      pipelineCtx.metadata.phase = 'error';
      pipelineCtx.error = validation.missingContext?.join('. ') || 'No se pudo procesar la pregunta';
      pipelineCtx.metadata.endTime = Date.now();
      return pipelineCtx;
    }
    
    if (validation.warnings) {
      pipelineCtx.metadata.warnings = validation.warnings;
    }
    
    // ========== FASE 5: Planificación de Query ==========
    pipelineCtx.metadata.phase = 'planning_query';
    const planStart = Date.now();
    const queryPlan = planQuery(intent);
    pipelineCtx.queryPlan = queryPlan;
    pipelineCtx.metadata.timings.queryPlanning = Date.now() - planStart;
    
    // ========== FASE 6: Ejecución ==========
    // NOTA: La ejecución real se delega a OpenAI function calling en routes/ai.ts
    // Este pipeline retorna el contexto enriquecido para que GPT tome decisiones
    pipelineCtx.metadata.phase = 'executing';
    
    // El pipeline termina aquí y devuelve el contexto
    // GPT recibirá esta información en el system prompt enriquecido
    pipelineCtx.metadata.phase = 'complete';
    pipelineCtx.metadata.endTime = Date.now();
    
    return pipelineCtx;
    
  } catch (error: any) {
    pipelineCtx.metadata.phase = 'error';
    pipelineCtx.error = error.message || 'Error desconocido en el pipeline';
    pipelineCtx.metadata.endTime = Date.now();
    return pipelineCtx;
  }
}

/**
 * Normaliza el input aplicando limpieza y expansión de sinónimos
 */
function normalizeInput(question: string): string {
  // 1. Limpiar espacios extra
  let normalized = question.trim().replace(/\s+/g, ' ');
  
  // 2. Expandir con sinónimos
  normalized = expandWithSynonyms(normalized);
  
  // 3. Normalizar texto (quitar acentos para matching interno)
  // NOTA: Mantenemos el texto original para GPT, solo normalizamos para búsquedas internas
  
  return normalized;
}

/**
 * Planifica qué query ejecutar basándose en la intención
 */
function planQuery(intent: Intent): QueryPlan {
  const toolName = suggestToolForIntent(intent);
  
  if (!toolName) {
    return {
      toolName: 'none',
      parameters: {},
      confidence: 0,
      reasoning: 'No se requiere herramienta específica para esta pregunta'
    };
  }
  
  // Construir parámetros según el tool y la intención
  const parameters: Record<string, any> = {};
  
  // Agregar entidades como parámetros
  const projectEntity = intent.entities.find(e => e.type === 'project');
  const contactEntity = intent.entities.find(e => e.type === 'contact');
  const walletEntity = intent.entities.find(e => e.type === 'wallet');
  const categoryEntity = intent.entities.find(e => e.type === 'category');
  
  if (projectEntity) {
    parameters.projectName = projectEntity.name;
  }
  
  if (contactEntity) {
    parameters.contactName = contactEntity.name;
  }
  
  if (walletEntity) {
    parameters.wallet = walletEntity.name;
  }
  
  if (categoryEntity) {
    parameters.category = categoryEntity.name;
  }
  
  // Agregar filtros detectados
  if (intent.filters) {
    if (intent.filters.currency) {
      parameters.currency = intent.filters.currency;
    }
    
    if (intent.filters.type) {
      parameters.type = intent.filters.type;
    }
    
    if (intent.filters.role) {
      parameters.role = intent.filters.role;
    }
  }
  
  // Agregar temporal scope
  if (intent.temporalScope) {
    if (intent.temporalScope.start && intent.temporalScope.end) {
      parameters.dateRange = {
        start: intent.temporalScope.start,
        end: intent.temporalScope.end
      };
    } else if (intent.temporalScope.period) {
      // Convertir períodos a rangos de fechas
      const range = periodToDateRange(intent.temporalScope.period);
      if (range) {
        parameters.dateRange = range;
      }
    }
  }
  
  return {
    toolName,
    parameters,
    confidence: intent.confidence,
    reasoning: `Intención: ${intent.type}/${intent.subtype} con confianza ${Math.round(intent.confidence * 100)}%`
  };
}

/**
 * Convierte un período (today, week, month, year) a un rango de fechas
 */
function periodToDateRange(period: 'today' | 'week' | 'month' | 'year' | 'custom'): { start: string; end: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
      
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Domingo
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sábado
      
      return {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      };
    }
      
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      return {
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0]
      };
      
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      
      return {
        start: yearStart.toISOString().split('T')[0],
        end: yearEnd.toISOString().split('T')[0]
      };
      
    default:
      return null;
  }
}

/**
 * Genera un system prompt enriquecido con el contexto del pipeline
 */
export function enrichSystemPrompt(basePrompt: string, pipelineCtx: PipelineContext): string {
  if (pipelineCtx.metadata.cacheHit) {
    return basePrompt; // No enriquecer si es caché
  }
  
  let enrichment = '\n\n---\n**Contexto Inteligente Detectado:**\n\n';
  
  // Agregar intención detectada
  if (pipelineCtx.intent) {
    enrichment += `- **Intención:** ${pipelineCtx.intent.type}`;
    if (pipelineCtx.intent.subtype) {
      enrichment += ` (${pipelineCtx.intent.subtype})`;
    }
    enrichment += ` - Confianza: ${Math.round(pipelineCtx.intent.confidence * 100)}%\n`;
  }
  
  // Agregar entidades detectadas
  if (pipelineCtx.intent && pipelineCtx.intent.entities.length > 0) {
    enrichment += `- **Entidades detectadas:**\n`;
    for (const entity of pipelineCtx.intent.entities) {
      enrichment += `  - ${entity.type}: "${entity.name}" (confianza: ${Math.round(entity.confidence * 100)}%)\n`;
    }
  }
  
  // Agregar herramienta sugerida
  if (pipelineCtx.queryPlan && pipelineCtx.queryPlan.toolName !== 'none') {
    enrichment += `- **Herramienta sugerida:** ${pipelineCtx.queryPlan.toolName}\n`;
    
    if (Object.keys(pipelineCtx.queryPlan.parameters).length > 0) {
      enrichment += `- **Parámetros detectados:** ${JSON.stringify(pipelineCtx.queryPlan.parameters, null, 2)}\n`;
    }
  }
  
  // Agregar advertencias
  if (pipelineCtx.metadata.warnings && pipelineCtx.metadata.warnings.length > 0) {
    enrichment += `- **Advertencias:** ${pipelineCtx.metadata.warnings.join(', ')}\n`;
  }
  
  enrichment += '\n**Instrucción:** Usa esta información para elegir la mejor herramienta y parámetros. Si la herramienta sugerida es correcta, úsala con los parámetros detectados.\n';
  
  return basePrompt + enrichment;
}

/**
 * Cachea un resultado de AI después de la ejecución
 */
export function cacheAIResult(
  question: string,
  organizationId: string,
  result: any
): void {
  aiCache.cacheAIResponse(question, organizationId, result);
}

/**
 * Obtiene métricas del pipeline para debugging
 */
export function getPipelineMetrics(pipelineCtx: PipelineContext): {
  totalTime: number;
  phaseBreakdown: Record<string, number>;
  cacheHit: boolean;
  confidence: number;
} {
  const totalTime = pipelineCtx.metadata.endTime
    ? pipelineCtx.metadata.endTime - pipelineCtx.metadata.startTime
    : Date.now() - pipelineCtx.metadata.startTime;
  
  return {
    totalTime,
    phaseBreakdown: pipelineCtx.metadata.timings,
    cacheHit: pipelineCtx.metadata.cacheHit || false,
    confidence: pipelineCtx.metadata.confidence || 0
  };
}
