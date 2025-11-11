/**
 * 💡 ARCHUB CORE AI - Sistema de Sinónimos y Aliases
 * 
 * Mapeo de términos, abreviaciones y variantes lingüísticas para mejor resolución de entidades.
 * Este sistema permite que la IA entienda "Macho" = "Machónico", "plata" = "dinero", etc.
 */

import type { EntitySynonym } from './types';

/**
 * Sinónimos de términos financieros comunes
 */
export const financialTermSynonyms: Record<string, string[]> = {
  // Dinero
  'dinero': ['plata', 'pesos', 'dolares', 'guita', 'efectivo', 'cash', 'lana', 'lucas'],
  
  // Gastos
  'gastos': ['egresos', 'salidas', 'pagos', 'desembolsos', 'costos', 'costes'],
  'gastar': ['pagar', 'desembolsar', 'invertir', 'destinar'],
  
  // Ingresos
  'ingresos': ['entradas', 'cobros', 'ganancias', 'recibos'],
  'cobrar': ['recibir', 'ingresar', 'facturar'],
  
  // Balance
  'balance': ['saldo', 'estado', 'situacion', 'resultado', 'neto'],
  
  // Período temporal
  'hoy': ['dia', 'actual'],
  'mes': ['mensual', 'periodo'],
  'año': ['anual', 'ejercicio'],
  
  // Proyectos
  'proyecto': ['obra', 'construccion', 'edificacion', 'trabajo'],
  
  // Personas
  'proveedor': ['contacto', 'tercero', 'externo'],
  'trabajador': ['empleado', 'personal', 'operario', 'obrero'],
  'subcontratista': ['subcontrata', 'tercerizado', 'sub'],
  
  // Categorías
  'materiales': ['material', 'insumos', 'productos'],
  'servicios': ['servicio', 'prestacion'],
  'mano de obra': ['trabajo', 'labor', 'personal']
};

/**
 * Patrones de abreviaciones comunes que la IA debe reconocer
 */
export const abbreviationPatterns: Array<{
  pattern: RegExp;
  expansion: string;
  description: string;
}> = [
  {
    pattern: /\b(dpto|depto)\b/i,
    expansion: 'departamento',
    description: 'Dpto/Depto → Departamento'
  },
  {
    pattern: /\b(prov)\b/i,
    expansion: 'provincia',
    description: 'Prov → Provincia'
  },
  {
    pattern: /\bpj\b/i,
    expansion: 'planta',
    description: 'PJ → Planta Baja'
  },
  {
    pattern: /\b(mat|mater)\b/i,
    expansion: 'materiales',
    description: 'Mat/Mater → Materiales'
  },
  {
    pattern: /\b(m2|m²)\b/i,
    expansion: 'metros cuadrados',
    description: 'M2/M² → Metros cuadrados'
  }
];

/**
 * Variantes lingüísticas regionales (Argentina, España, México, etc.)
 */
export const regionalVariants: Record<string, string[]> = {
  'departamento': ['piso', 'apartamento', 'flat'],
  'albañil': ['constructor', 'maestro', 'oficial'],
  'electricista': ['electrico', 'instalador'],
  'plomero': ['fontanero', 'gasista', 'sanitarista']
};

/**
 * Expande una query aplicando sinónimos conocidos
 * Ejemplo: "cuánta plata gasté" → "cuánto dinero gasté"
 */
export function expandWithSynonyms(text: string): string {
  let expanded = text.toLowerCase();
  
  // Aplicar abreviaciones primero
  for (const abbrev of abbreviationPatterns) {
    expanded = expanded.replace(abbrev.pattern, abbrev.expansion);
  }
  
  // Aplicar sinónimos financieros
  for (const [canonical, synonyms] of Object.entries(financialTermSynonyms)) {
    for (const synonym of synonyms) {
      const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
      expanded = expanded.replace(regex, canonical);
    }
  }
  
  // Aplicar variantes regionales
  for (const [canonical, variants] of Object.entries(regionalVariants)) {
    for (const variant of variants) {
      const regex = new RegExp(`\\b${variant}\\b`, 'gi');
      expanded = expanded.replace(regex, canonical);
    }
  }
  
  return expanded;
}

/**
 * Extrae términos clave de una pregunta
 * Útil para intent classification
 */
export function extractKeyTerms(text: string): string[] {
  const expanded = expandWithSynonyms(text);
  
  // Palabras a ignorar (stop words en español)
  const stopWords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'al', 'a', 'en', 'por', 'para', 'con', 'sin',
    'que', 'cual', 'cuales', 'como', 'cuando', 'donde',
    'me', 'te', 'se', 'nos', 'les',
    'este', 'esta', 'estos', 'estas',
    'es', 'son', 'fue', 'fueron', 'ser', 'estar',
    'he', 'ha', 'han', 'haber', 'tener', 'tengo', 'tiene',
    'mi', 'tu', 'su', 'nuestro', 'vuestro'
  ]);
  
  const words = expanded
    .split(/\s+/)
    .map(w => w.replace(/[^a-záéíóúñü]/gi, ''))
    .filter(w => w.length > 2)
    .filter(w => !stopWords.has(w));
  
  return Array.from(new Set(words)); // eliminar duplicados
}

/**
 * Genera variantes posibles de un nombre de entidad
 * Ejemplo: "Casa Sur Edificio" → ["casa sur", "casa", "edificio casa sur"]
 */
export function generateEntityVariants(name: string): string[] {
  const normalized = name.toLowerCase().trim();
  const variants: Set<string> = new Set([normalized]);
  
  // Agregar nombre completo sin artículos
  const withoutArticles = normalized
    .replace(/^(el|la|los|las|un|una)\s+/i, '');
  variants.add(withoutArticles);
  
  // Agregar primeras palabras significativas
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length >= 2) {
    // Primera + segunda palabra
    variants.add(words.slice(0, 2).join(' '));
  }
  
  if (words.length >= 3) {
    // Primera + segunda + tercera
    variants.add(words.slice(0, 3).join(' '));
  }
  
  // Primera palabra sola (si es suficientemente larga)
  if (words[0] && words[0].length >= 4) {
    variants.add(words[0]);
  }
  
  // Última palabra (si es suficientemente específica)
  if (words.length > 1 && words[words.length - 1].length >= 5) {
    variants.add(words[words.length - 1]);
  }
  
  return Array.from(variants);
}

/**
 * Registra sinónimos de entidades dinámicamente en runtime
 * Esto permite que el sistema aprenda aliases nuevos
 */
export class EntitySynonymRegistry {
  private registry: Map<string, EntitySynonym> = new Map();
  
  /**
   * Registra un sinónimo
   */
  register(synonym: EntitySynonym): void {
    const key = synonym.canonical.toLowerCase();
    this.registry.set(key, synonym);
  }
  
  /**
   * Busca el término canónico para un alias
   */
  resolve(alias: string): string | null {
    const normalized = alias.toLowerCase();
    const values = Array.from(this.registry.values());
    
    for (const synonym of values) {
      if (synonym.canonical.toLowerCase() === normalized) {
        return synonym.canonical;
      }
      
      if (synonym.aliases.some(a => a.toLowerCase() === normalized)) {
        return synonym.canonical;
      }
    }
    
    return null;
  }
  
  /**
   * Obtiene todos los aliases de un término canónico
   */
  getAliases(canonical: string): string[] {
    const key = canonical.toLowerCase();
    const synonym = this.registry.get(key);
    return synonym ? synonym.aliases : [];
  }
  
  /**
   * Limpia el registro
   */
  clear(): void {
    this.registry.clear();
  }
  
  /**
   * Obtiene estadísticas
   */
  getStats(): { total: number; avgAliases: number } {
    const total = this.registry.size;
    const totalAliases = Array.from(this.registry.values())
      .reduce((sum, s) => sum + s.aliases.length, 0);
    
    return {
      total,
      avgAliases: total > 0 ? totalAliases / total : 0
    };
  }
}

// Singleton global
export const synonymRegistry = new EntitySynonymRegistry();
