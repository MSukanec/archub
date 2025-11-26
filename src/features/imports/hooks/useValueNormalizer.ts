import { useCallback, useMemo } from 'react';
import { normalizeText, calculateSimilarity, isValidUUID, parseDate, parseNumber } from '../utils/normalize';
import type { TargetField, ManualMapping } from '../types';

interface ValueMapConfig {
  [field: string]: Record<string, string>;
}

interface UseValueNormalizerProps {
  targetSchema: TargetField[];
  valueMapConfig?: ValueMapConfig;
  manualMappings?: ManualMapping;
}

interface NormalizeResult {
  value: any;
  originalValue: any;
  matched: boolean;
  matchType: 'exact' | 'fuzzy' | 'manual' | 'none';
  similarity?: number;
}

interface UseValueNormalizerReturn {
  normalizeValue: (field: string, value: any) => NormalizeResult;
  findBestMatch: (field: string, value: string) => { match: string | null; similarity: number };
  addToValueMap: (field: string, originalValue: string, targetValue: string) => void;
}

export function useValueNormalizer({
  targetSchema,
  valueMapConfig = {},
  manualMappings = {},
}: UseValueNormalizerProps): UseValueNormalizerReturn {

  const fieldTypeMap = useMemo(() => {
    const map: Record<string, TargetField['type']> = {};
    targetSchema.forEach(field => {
      map[field.field] = field.type;
    });
    return map;
  }, [targetSchema]);

  const normalizeValue = useCallback((field: string, value: any): NormalizeResult => {
    if (value === null || value === undefined || value === '' || value === 'Sin asignar' || value === 'empty-placeholder') {
      return { value: null, originalValue: value, matched: false, matchType: 'none' };
    }

    const stringValue = String(value).trim();
    const normalized = normalizeText(stringValue);
    const fieldType = fieldTypeMap[field];

    const mappingKey = `${field}_${stringValue}`;
    if (manualMappings[mappingKey] !== undefined) {
      const mappedValue = manualMappings[mappingKey];
      if (mappedValue === '' || mappedValue === 'empty-placeholder' || mappedValue === null) {
        return { value: null, originalValue: value, matched: true, matchType: 'manual' };
      }
      return { value: mappedValue, originalValue: value, matched: true, matchType: 'manual' };
    }

    const fieldValueMap = valueMapConfig[field];
    if (fieldValueMap) {
      if (fieldValueMap[normalized]) {
        return { value: fieldValueMap[normalized], originalValue: value, matched: true, matchType: 'exact' };
      }

      for (const [key, mappedValue] of Object.entries(fieldValueMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          return { value: mappedValue, originalValue: value, matched: true, matchType: 'fuzzy', similarity: 0.8 };
        }
      }

      let bestMatch: { value: string; similarity: number } | null = null;
      for (const [key, mappedValue] of Object.entries(fieldValueMap)) {
        if (key.length > 3 && normalized.length > 3) {
          const similarity = calculateSimilarity(normalized, key);
          if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.similarity)) {
            bestMatch = { value: mappedValue, similarity };
          }
        }
      }

      if (bestMatch) {
        return { value: bestMatch.value, originalValue: value, matched: true, matchType: 'fuzzy', similarity: bestMatch.similarity };
      }
    }

    if (fieldType === 'foreign-key') {
      if (isValidUUID(stringValue)) {
        return { value: stringValue, originalValue: value, matched: true, matchType: 'exact' };
      }
      return { value: null, originalValue: value, matched: false, matchType: 'none' };
    }

    if (fieldType === 'date') {
      const date = parseDate(stringValue);
      if (date) {
        return { value: date.toISOString().split('T')[0], originalValue: value, matched: true, matchType: 'exact' };
      }
      return { value: null, originalValue: value, matched: false, matchType: 'none' };
    }

    if (fieldType === 'number' || fieldType === 'currency') {
      const num = parseNumber(stringValue);
      if (num !== null) {
        return { value: num, originalValue: value, matched: true, matchType: 'exact' };
      }
      return { value: null, originalValue: value, matched: false, matchType: 'none' };
    }

    if (fieldType === 'boolean') {
      const lower = normalized;
      if (['true', 'si', 'sí', 'yes', '1', 'verdadero', 'activo'].includes(lower)) {
        return { value: true, originalValue: value, matched: true, matchType: 'exact' };
      }
      if (['false', 'no', '0', 'falso', 'inactivo'].includes(lower)) {
        return { value: false, originalValue: value, matched: true, matchType: 'exact' };
      }
      return { value: null, originalValue: value, matched: false, matchType: 'none' };
    }

    return { value: stringValue, originalValue: value, matched: true, matchType: 'exact' };
  }, [fieldTypeMap, valueMapConfig, manualMappings]);

  const findBestMatch = useCallback((field: string, value: string): { match: string | null; similarity: number } => {
    const normalized = normalizeText(value);
    const fieldValueMap = valueMapConfig[field];
    
    if (!fieldValueMap) {
      return { match: null, similarity: 0 };
    }

    let bestMatch: { key: string; value: string; similarity: number } | null = null;

    for (const [key, mappedValue] of Object.entries(fieldValueMap)) {
      if (key === normalized) {
        return { match: mappedValue, similarity: 1 };
      }
      
      const similarity = calculateSimilarity(normalized, key);
      if (similarity > 0.5 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { key, value: mappedValue, similarity };
      }
    }

    return bestMatch ? { match: bestMatch.value, similarity: bestMatch.similarity } : { match: null, similarity: 0 };
  }, [valueMapConfig]);

  const addToValueMap = useCallback((field: string, originalValue: string, targetValue: string) => {
    console.log(`Adding to value map: ${field} -> ${originalValue} = ${targetValue}`);
  }, []);

  return {
    normalizeValue,
    findBestMatch,
    addToValueMap,
  };
}
