/**
 * 🎯 ARCHUB CORE AI - Intent Classifier
 * 
 * Clasifica la intención del usuario basándose en:
 * - Keywords y patrones lingüísticos
 * - Entidades detectadas
 * - Contexto temporal y filtros
 * - Metadata de herramientas disponibles
 */

import type { Intent, Entity, IntentPattern } from './types.js';
import { extractKeyTerms, expandWithSynonyms } from './entitySynonyms.js';
import { parseDateExpression } from '../utils/dateParser.js';

/**
 * Patrones de intenciones con keywords asociadas y prioridad
 */
const INTENT_PATTERNS: IntentPattern[] = [
  // Financial queries - Balance
  {
    type: 'financial_query',
    subtype: 'balance',
    keywords: ['balance', 'saldo', 'cuanto tengo', 'situacion', 'estado', 'neto'],
    priority: 10,
    suggestedTool: 'getOrganizationBalance'
  },
  
  // Financial queries - Expenses
  {
    type: 'financial_query',
    subtype: 'expenses',
    keywords: ['gastos', 'egresos', 'gaste', 'pague', 'pago', 'desembolso', 'salidas', 'cuanto gaste'],
    priority: 9,
    suggestedTool: 'getDateRangeMovements'
  },
  
  // Financial queries - Income
  {
    type: 'financial_query',
    subtype: 'income',
    keywords: ['ingresos', 'entradas', 'cobre', 'cobro', 'facture', 'ganancia', 'recibí'],
    priority: 9,
    suggestedTool: 'getDateRangeMovements'
  },
  
  // Financial queries - Contact payments
  {
    type: 'financial_query',
    subtype: 'contact_movements',
    keywords: ['le pague', 'le di', 'pague a', 'movimientos de', 'balance de', 'debe', 'deuda'],
    priority: 8,
    requiredEntities: ['contact'],
    suggestedTool: 'getContactMovements'
  },
  
  // Financial queries - Project summary
  {
    type: 'financial_query',
    subtype: 'project_summary',
    keywords: ['resumen', 'totales', 'cuanto llevo', 'estado del proyecto', 'balance del proyecto'],
    priority: 8,
    requiredEntities: ['project'],
    suggestedTool: 'getProjectFinancialSummary'
  },
  
  // Financial queries - Role spending
  {
    type: 'financial_query',
    subtype: 'role_spending',
    keywords: ['subcontratistas', 'personal', 'empleados', 'socios', 'partners', 'mano de obra'],
    priority: 7,
    suggestedTool: 'getRoleSpending'
  },
  
  // Financial queries - Cashflow trend
  {
    type: 'financial_query',
    subtype: 'cashflow',
    keywords: ['flujo', 'tendencia', 'evolucion', 'historico', 'mensual', 'trimestral'],
    priority: 7,
    suggestedTool: 'getCashflowTrend'
  },
  
  // Project queries - List
  {
    type: 'project_query',
    subtype: 'list',
    keywords: ['proyectos', 'obras', 'lista de proyectos', 'cuantos proyectos', 'que proyectos'],
    priority: 6,
    suggestedTool: 'getProjectsList'
  },
  
  // Project queries - Details
  {
    type: 'project_query',
    subtype: 'details',
    keywords: ['detalles', 'informacion', 'datos', 'descripcion'],
    priority: 5,
    requiredEntities: ['project'],
    suggestedTool: 'getProjectDetails'
  },
  
  // General queries
  {
    type: 'general_query',
    subtype: 'greeting',
    keywords: ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'como estas'],
    priority: 3,
    suggestedTool: undefined
  },
  
  // Action requests
  {
    type: 'action_request',
    subtype: 'create',
    keywords: ['crear', 'agregar', 'añadir', 'nuevo', 'registrar'],
    priority: 4,
    suggestedTool: undefined
  }
];

/**
 * Clasifica la intención de una pregunta
 */
export function classifyIntent(
  question: string,
  entities: Entity[]
): Intent {
  
  // Normalizar y expandir con sinónimos
  const expanded = expandWithSynonyms(question.toLowerCase());
  const keyTerms = extractKeyTerms(expanded);
  
  // Detectar temporal scope
  const temporalScope = detectTemporalScope(question);
  
  // Detectar filtros (currency, type)
  const filters = detectFilters(question);
  
  // Calcular scores para cada patrón
  const scores: Array<{ pattern: IntentPattern; score: number }> = [];
  
  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    
    // Score por keywords encontradas
    const matchedKeywords = pattern.keywords.filter(keyword => {
      const keywordNormalized = keyword.toLowerCase();
      return expanded.includes(keywordNormalized) || keyTerms.some(term => term.includes(keywordNormalized));
    });
    
    score += matchedKeywords.length * pattern.priority;
    
    // Bonus si tiene las entidades requeridas
    if (pattern.requiredEntities && pattern.requiredEntities.length > 0) {
      const hasRequiredEntities = pattern.requiredEntities.every(reqType =>
        entities.some(e => e.type === reqType)
      );
      
      if (hasRequiredEntities) {
        score += 15; // Bonus grande
      } else {
        score -= 10; // Penalty si faltan entidades requeridas
      }
    }
    
    scores.push({ pattern, score });
  }
  
  // Ordenar por score
  scores.sort((a, b) => b.score - a.score);
  
  const bestMatch = scores[0];
  
  // Si el mejor match tiene score muy bajo, clasificar como unknown
  if (!bestMatch || bestMatch.score <= 0) {
    return {
      type: 'unknown',
      confidence: 0,
      entities,
      temporalScope,
      filters
    };
  }
  
  // Calcular confianza (0-1)
  const maxPossibleScore = bestMatch.pattern.priority * bestMatch.pattern.keywords.length + 15;
  const confidence = Math.min(bestMatch.score / maxPossibleScore, 1);
  
  return {
    type: bestMatch.pattern.type,
    subtype: bestMatch.pattern.subtype,
    confidence,
    entities,
    temporalScope,
    filters
  };
}

/**
 * Detecta el scope temporal de una pregunta (hoy, este mes, año, etc.)
 */
function detectTemporalScope(question: string): Intent['temporalScope'] {
  const lowerQuestion = question.toLowerCase();
  
  // Intentar detectar expresiones de fecha con el parser
  const dateRange = parseDateExpression(lowerQuestion);
  
  if (dateRange) {
    return {
      start: dateRange.start,
      end: dateRange.end,
      period: 'custom'
    };
  }
  
  // Detectar períodos comunes
  if (/\bhoy\b|\bdia\b|\bactual\b/.test(lowerQuestion)) {
    return { period: 'today' };
  }
  
  if (/\besta semana\b|\bsemana actual\b/.test(lowerQuestion)) {
    return { period: 'week' };
  }
  
  if (/\beste mes\b|\bmes actual\b/.test(lowerQuestion)) {
    return { period: 'month' };
  }
  
  if (/\beste año\b|\baño actual\b|\bejerciio\b/.test(lowerQuestion)) {
    return { period: 'year' };
  }
  
  return undefined;
}

/**
 * Detecta filtros específicos en la pregunta (moneda, tipo de movimiento)
 */
function detectFilters(question: string): Intent['filters'] {
  const lowerQuestion = question.toLowerCase();
  const filters: Intent['filters'] = {};
  
  // Detectar moneda
  if (/\bpesos\b|\bars\b/.test(lowerQuestion)) {
    filters.currency = 'ARS';
  } else if (/\bdolares\b|\busd\b|\bu\$s\b/.test(lowerQuestion)) {
    filters.currency = 'USD';
  }
  
  // Detectar tipo (ingreso/egreso)
  if (/\begresos\b|\bgastos\b|\bpagos\b|\bsalidas\b/.test(lowerQuestion)) {
    filters.type = 'Egreso';
  } else if (/\bingresos\b|\bentradas\b|\bcobros\b/.test(lowerQuestion)) {
    filters.type = 'Ingreso';
  }
  
  // Detectar rol
  if (/\bsubcontratistas?\b|\bsubcontratas?\b/.test(lowerQuestion)) {
    filters.role = 'subcontractor';
  } else if (/\bpersonal\b|\bempleados?\b|\btrabajadores?\b/.test(lowerQuestion)) {
    filters.role = 'personnel';
  } else if (/\bsocios?\b|\bpartners?\b/.test(lowerQuestion)) {
    filters.role = 'partner';
  }
  
  return filters;
}

/**
 * Obtiene sugerencias de tool basadas en la intención
 */
export function suggestToolForIntent(intent: Intent): string | null {
  const pattern = INTENT_PATTERNS.find(
    p => p.type === intent.type && p.subtype === intent.subtype
  );
  
  return pattern?.suggestedTool || null;
}

/**
 * Valida si una intención tiene suficiente contexto para ejecutarse
 */
export function validateIntent(intent: Intent): {
  valid: boolean;
  missingContext?: string[];
  warnings?: string[];
} {
  
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Validar según tipo
  switch (intent.type) {
    case 'financial_query':
      if (intent.subtype === 'contact_movements' && !intent.entities.some(e => e.type === 'contact')) {
        missing.push('No se detectó un contacto/persona específico');
      }
      
      if (intent.subtype === 'project_summary' && !intent.entities.some(e => e.type === 'project')) {
        missing.push('No se detectó un proyecto específico');
      }
      
      if (intent.confidence < 0.5) {
        warnings.push('La confianza en la interpretación es baja');
      }
      break;
      
    case 'project_query':
      if (intent.subtype === 'details' && !intent.entities.some(e => e.type === 'project')) {
        missing.push('No se especificó qué proyecto consultar');
      }
      break;
      
    case 'unknown':
      missing.push('No se pudo entender la pregunta');
      break;
  }
  
  return {
    valid: missing.length === 0,
    missingContext: missing.length > 0 ? missing : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
