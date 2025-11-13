/**
 * 🔍 ARCHUB CORE AI - Entity Resolver
 * 
 * Resuelve entidades (proyectos, contactos, etc.) desde texto natural con:
 * - Fuzzy matching (tolerante a typos y acentos)
 * - Sistema de scoring de confianza
 * - Caché inteligente
 * - Soporte de sinónimos y aliases
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Entity, AIContext } from './types.js';
import { textIncludes, normalizeText } from '../utils/textNormalizer.js';
import { generateEntityVariants, synonymRegistry } from './entitySynonyms.js';
import { aiCache } from './cache.js';

export interface EntitySearchResult {
  entity: Entity;
  score: number;
  matchType: 'exact' | 'partial' | 'fuzzy' | 'alias';
  matchedTerm: string;
}

/**
 * Busca proyectos que coincidan con un término
 */
async function searchProjects(
  term: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<EntitySearchResult[]> {
  
  // Intentar caché primero
  const cacheKey = `projects:${organizationId}:${normalizeText(term)}`;
  const cached = aiCache.get<EntitySearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('organization_id', organizationId);
  
  if (error || !projects || projects.length === 0) {
    return [];
  }
  
  const results: EntitySearchResult[] = [];
  const normalizedTerm = normalizeText(term);
  
  for (const project of projects) {
    const projectName = project.name;
    const normalizedName = normalizeText(projectName);
    
    // Score: 1.0 = exact, 0.8 = partial, 0.6 = fuzzy
    let score = 0;
    let matchType: EntitySearchResult['matchType'] = 'fuzzy';
    let matchedTerm = term;
    
    // 1. Exact match (ignorando acentos/mayúsculas)
    if (normalizedName === normalizedTerm) {
      score = 1.0;
      matchType = 'exact';
    }
    // 2. Partial match (el término está contenido en el nombre)
    else if (textIncludes(projectName, term)) {
      score = 0.8;
      matchType = 'partial';
    }
    // 3. Fuzzy match con variantes
    else {
      const variants = generateEntityVariants(projectName);
      const matchingVariant = variants.find(v => textIncludes(v, term));
      
      if (matchingVariant) {
        score = 0.6;
        matchType = 'fuzzy';
      }
    }
    
    if (score > 0) {
      results.push({
        entity: {
          id: project.id,
          name: projectName,
          type: 'project',
          organizationId,
          confidence: score
        },
        score,
        matchType,
        matchedTerm
      });
    }
  }
  
  // Ordenar por score descendente
  results.sort((a, b) => b.score - a.score);
  
  // Cachear resultados
  aiCache.set(cacheKey, results, 30 * 60 * 1000); // 30 minutos
  
  return results;
}

/**
 * Busca contactos que coincidan con un término
 */
async function searchContacts(
  term: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<EntitySearchResult[]> {
  
  const cacheKey = `contacts:${organizationId}:${normalizeText(term)}`;
  const cached = aiCache.get<EntitySearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, full_name, first_name, last_name')
    .eq('organization_id', organizationId);
  
  if (error || !contacts || contacts.length === 0) {
    return [];
  }
  
  const results: EntitySearchResult[] = [];
  const normalizedTerm = normalizeText(term);
  
  for (const contact of contacts) {
    const fullName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    const normalizedName = normalizeText(fullName);
    
    let score = 0;
    let matchType: EntitySearchResult['matchType'] = 'fuzzy';
    
    if (normalizedName === normalizedTerm) {
      score = 1.0;
      matchType = 'exact';
    } else if (textIncludes(fullName, term)) {
      score = 0.8;
      matchType = 'partial';
    } else {
      const variants = generateEntityVariants(fullName);
      const matchingVariant = variants.find(v => textIncludes(v, term));
      
      if (matchingVariant) {
        score = 0.6;
        matchType = 'fuzzy';
      }
    }
    
    if (score > 0) {
      results.push({
        entity: {
          id: contact.id,
          name: fullName,
          type: 'contact',
          organizationId,
          confidence: score
        },
        score,
        matchType,
        matchedTerm: term
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  aiCache.set(cacheKey, results, 30 * 60 * 1000);
  
  return results;
}

/**
 * Busca wallets (billeteras) que coincidan con un término
 */
async function searchWallets(
  term: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<EntitySearchResult[]> {
  
  const cacheKey = `wallets:${organizationId}:${normalizeText(term)}`;
  const cached = aiCache.get<EntitySearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const { data: wallets, error } = await supabase
    .from('wallets')
    .select('id, name')
    .eq('organization_id', organizationId);
  
  if (error || !wallets || wallets.length === 0) {
    return [];
  }
  
  const results: EntitySearchResult[] = [];
  const normalizedTerm = normalizeText(term);
  
  for (const wallet of wallets) {
    const walletName = wallet.name;
    const normalizedName = normalizeText(walletName);
    
    let score = 0;
    let matchType: EntitySearchResult['matchType'] = 'fuzzy';
    
    if (normalizedName === normalizedTerm) {
      score = 1.0;
      matchType = 'exact';
    } else if (textIncludes(walletName, term)) {
      score = 0.8;
      matchType = 'partial';
    }
    
    if (score > 0) {
      results.push({
        entity: {
          id: wallet.id,
          name: walletName,
          type: 'wallet',
          organizationId,
          confidence: score
        },
        score,
        matchType,
        matchedTerm: term
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  aiCache.set(cacheKey, results, 30 * 60 * 1000);
  
  return results;
}

/**
 * Busca categorías que coincidan con un término
 */
async function searchCategories(
  term: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<EntitySearchResult[]> {
  
  const cacheKey = `categories:${organizationId}:${normalizeText(term)}`;
  const cached = aiCache.get<EntitySearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const { data: categories, error } = await supabase
    .from('movement_categories')
    .select('id, name')
    .eq('organization_id', organizationId);
  
  if (error || !categories || categories.length === 0) {
    return [];
  }
  
  const results: EntitySearchResult[] = [];
  const normalizedTerm = normalizeText(term);
  
  for (const category of categories) {
    const categoryName = category.name;
    const normalizedName = normalizeText(categoryName);
    
    let score = 0;
    let matchType: EntitySearchResult['matchType'] = 'fuzzy';
    
    if (normalizedName === normalizedTerm) {
      score = 1.0;
      matchType = 'exact';
    } else if (textIncludes(categoryName, term)) {
      score = 0.8;
      matchType = 'partial';
    }
    
    if (score > 0) {
      results.push({
        entity: {
          id: category.id,
          name: categoryName,
          type: 'category',
          organizationId,
          confidence: score
        },
        score,
        matchType,
        matchedTerm: term
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  aiCache.set(cacheKey, results, 30 * 60 * 1000);
  
  return results;
}

/**
 * Resuelve todas las entidades mencionadas en una pregunta
 * Retorna las entidades encontradas con sus scores de confianza
 */
export async function resolveEntities(
  question: string,
  context: AIContext,
  supabase: SupabaseClient,
  options: {
    types?: Entity['type'][];
    minConfidence?: number;
    maxResults?: number;
  } = {}
): Promise<Entity[]> {
  
  const { types = ['project', 'contact', 'wallet', 'category'], minConfidence = 0.5, maxResults = 5 } = options;
  
  // Extraer posibles nombres de entidades (palabras significativas capitalizadas o en quotes)
  const potentialEntities = extractPotentialEntities(question);
  
  if (potentialEntities.length === 0) {
    return [];
  }
  
  // Buscar en paralelo en todas las fuentes solicitadas
  const searchPromises: Promise<EntitySearchResult[]>[] = [];
  
  for (const term of potentialEntities) {
    // Verificar primero en el synonym registry
    const canonicalTerm = synonymRegistry.resolve(term) || term;
    
    if (types.includes('project')) {
      searchPromises.push(searchProjects(canonicalTerm, context.organizationId, supabase));
    }
    
    if (types.includes('contact')) {
      searchPromises.push(searchContacts(canonicalTerm, context.organizationId, supabase));
    }
    
    if (types.includes('wallet')) {
      searchPromises.push(searchWallets(canonicalTerm, context.organizationId, supabase));
    }
    
    if (types.includes('category')) {
      searchPromises.push(searchCategories(canonicalTerm, context.organizationId, supabase));
    }
  }
  
  const allResults = await Promise.all(searchPromises);
  const flatResults = allResults.flat();
  
  // Filtrar por confianza mínima y eliminar duplicados
  const uniqueResults = new Map<string, EntitySearchResult>();
  
  for (const result of flatResults) {
    if (result.score >= minConfidence) {
      const key = `${result.entity.type}:${result.entity.id}`;
      const existing = uniqueResults.get(key);
      
      // Mantener el resultado con mayor score
      if (!existing || result.score > existing.score) {
        uniqueResults.set(key, result);
      }
    }
  }
  
  // Ordenar por score y limitar resultados
  const sortedResults = Array.from(uniqueResults.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
  
  return sortedResults.map(r => r.entity);
}

/**
 * Extrae términos potencialmente entidades de una pregunta
 * Detecta: palabras capitalizadas, nombres propios, términos entre comillas
 */
function extractPotentialEntities(question: string): string[] {
  const entities: Set<string> = new Set();
  
  // 1. Términos entre comillas
  const quotedMatches = question.match(/"([^"]+)"|'([^']+)'/g);
  if (quotedMatches) {
    quotedMatches.forEach(match => {
      const clean = match.replace(/["']/g, '').trim();
      if (clean.length >= 3) {
        entities.add(clean);
      }
    });
  }
  
  // 2. Secuencias de palabras capitalizadas (nombres propios)
  const capitalizedMatches = question.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)\b/g);
  if (capitalizedMatches) {
    capitalizedMatches.forEach(match => {
      const clean = match.trim();
      if (clean.length >= 3 && !isCommonWord(clean)) {
        entities.add(clean);
      }
    });
  }
  
  // 3. Términos después de preposiciones clave como "en", "de", "para"
  const prepMatches = question.match(/(?:en|de|para|del|al)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ\s]{3,}?)(?:\s|,|\.|\?|$)/gi);
  if (prepMatches) {
    prepMatches.forEach(match => {
      const clean = match.replace(/^(en|de|para|del|al)\s+/i, '').trim();
      if (clean.length >= 3 && !isCommonWord(clean)) {
        entities.add(clean);
      }
    });
  }
  
  return Array.from(entities);
}

/**
 * Verifica si una palabra es demasiado común para ser una entidad
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'Casa', 'Proyecto', 'Obra', 'Edificio', 'Torre', 'Barrio',
    'Norte', 'Sur', 'Este', 'Oeste', 'Centro',
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]);
  
  return commonWords.has(word);
}

/**
 * Invalida caché de entidades para una organización
 * Útil cuando se crean/modifican/eliminan entidades
 */
export function invalidateEntityCache(organizationId: string): void {
  aiCache.invalidatePattern(new RegExp(`(projects|contacts|wallets|categories):${organizationId}:`));
}
