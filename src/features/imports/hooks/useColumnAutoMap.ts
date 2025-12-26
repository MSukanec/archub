import { useMemo, useCallback } from 'react';
import { normalizeText, calculateSimilarity } from '../utils/normalize';
import type { TargetField, ColumnMapping } from '../types';
const DEFAULT_SMART_MAPPING: Record<string, string[]> = {
  description: ['descripcion', 'descripción', 'concepto', 'detalle', 'nombre', 'name'],
  amount: ['cantidad', 'monto', 'importe', 'total', 'valor', 'price', 'precio', 'monto pagado', 'montopagado'],
  date: ['fecha', 'date', 'movement_date', 'created_at', 'fechadepago', 'fecha de pago', 'fecha pago', 'payment_date'],
  currency_code: ['moneda', 'currency', 'fiat', 'divisa', 'monedacódigo', 'moneda código', 'currency_code', 'codigo moneda'],
  wallet_name: ['billetera', 'wallet', 'cuenta', 'account', 'medio de pago', 'mediodepago', 'medio pago'],
  client_name: ['cliente', 'client', 'nombre cliente', 'cliente nombre', 'clientenombre', 'client_name', 'nombre del cliente'],
  type_id: ['tipo', 'type', 'categoria_principal'],
  category_id: ['categoria', 'categoría', 'category'],
  subcategory_id: ['subcategoria', 'subcategoría', 'subcategory'],
  exchange_rate: ['cotizacion', 'cotización', 'tasa', 'rate', 'cambio', 'cotizacionfinal', 'cotización final', 'exchange_rate'],
  email: ['correo', 'email', 'mail', 'e-mail'],
  phone: ['telefono', 'teléfono', 'phone', 'celular', 'mobile'],
  address: ['direccion', 'dirección', 'address', 'domicilio'],
  notes: ['notas', 'notes', 'observaciones', 'comentarios'],
  status: ['estado', 'status', 'situacion'],
  code: ['codigo', 'código', 'code', 'sku', 'ref', 'referencia'],
  unit: ['unidad', 'unit', 'medida'],
  quantity: ['cantidad', 'qty', 'quantity', 'unidades'],
};
interface UseColumnAutoMapProps {
  headers: string[];
  targetSchema: TargetField[];
  customMapping?: Record<string, string>;
}
interface UseColumnAutoMapReturn {
  autoMapping: ColumnMapping;
  unmappedHeaders: number[];
  unmappedFields: string[];
  getSuggestions: (headerIndex: number) => Array<{ field: string; label: string; similarity: number }>;
}
export function useColumnAutoMap({
  headers,
  targetSchema,
  customMapping = {},
}: UseColumnAutoMapProps): UseColumnAutoMapReturn {
  
  const smartMapping = useMemo(() => {
    const combined: Record<string, string> = {};
    
    for (const [field, aliases] of Object.entries(DEFAULT_SMART_MAPPING)) {
      for (const alias of aliases) {
        combined[normalizeText(alias)] = field;
      }
    }
    
    for (const [alias, field] of Object.entries(customMapping)) {
      combined[normalizeText(alias)] = field;
    }
    
    return combined;
  }, [customMapping]);
  const autoMapping = useMemo(() => {
    const mapping: ColumnMapping = {};
    const usedFields = new Set<string>();
    
    headers.forEach((header, index) => {
      const normalizedHeader = normalizeText(header);
      
      if (smartMapping[normalizedHeader] && !usedFields.has(smartMapping[normalizedHeader])) {
        const targetField = targetSchema.find(f => f.field === smartMapping[normalizedHeader]);
        if (targetField) {
          mapping[index] = smartMapping[normalizedHeader];
          usedFields.add(smartMapping[normalizedHeader]);
          return;
        }
      }
      
      for (const field of targetSchema) {
        if (usedFields.has(field.field)) continue;
        
        const fieldNormalized = normalizeText(field.field);
        const labelNormalized = normalizeText(field.label);
        
        if (normalizedHeader === fieldNormalized || normalizedHeader === labelNormalized) {
          mapping[index] = field.field;
          usedFields.add(field.field);
          return;
        }
        
        if (normalizedHeader.includes(fieldNormalized) || fieldNormalized.includes(normalizedHeader)) {
          mapping[index] = field.field;
          usedFields.add(field.field);
          return;
        }
      }
      
      let bestMatch: { field: string; similarity: number } | null = null;
      
      for (const field of targetSchema) {
        if (usedFields.has(field.field)) continue;
        
        const fieldSimilarity = calculateSimilarity(normalizedHeader, normalizeText(field.field));
        const labelSimilarity = calculateSimilarity(normalizedHeader, normalizeText(field.label));
        const maxSimilarity = Math.max(fieldSimilarity, labelSimilarity);
        
        if (maxSimilarity > 0.7 && (!bestMatch || maxSimilarity > bestMatch.similarity)) {
          bestMatch = { field: field.field, similarity: maxSimilarity };
        }
      }
      
      if (bestMatch) {
        mapping[index] = bestMatch.field;
        usedFields.add(bestMatch.field);
      }
    });
    
    return mapping;
  }, [headers, targetSchema, smartMapping]);
  const unmappedHeaders = useMemo(() => {
    return headers
      .map((_, index) => index)
      .filter(index => autoMapping[index] === undefined);
  }, [headers, autoMapping]);
  const unmappedFields = useMemo(() => {
    const mappedFields = new Set(Object.values(autoMapping).filter(Boolean));
    return targetSchema
      .filter(field => !mappedFields.has(field.field))
      .map(field => field.field);
  }, [targetSchema, autoMapping]);
  const getSuggestions = useCallback((headerIndex: number): Array<{ field: string; label: string; similarity: number }> => {
    const header = headers[headerIndex];
    if (!header) return [];
    
    const normalizedHeader = normalizeText(header);
    const mappedFields = new Set(Object.values(autoMapping).filter(Boolean));
    
    const suggestions = targetSchema
      .filter(field => !mappedFields.has(field.field) || autoMapping[headerIndex] === field.field)
      .map(field => {
        const fieldSimilarity = calculateSimilarity(normalizedHeader, normalizeText(field.field));
        const labelSimilarity = calculateSimilarity(normalizedHeader, normalizeText(field.label));
        return {
          field: field.field,
          label: field.label,
          similarity: Math.max(fieldSimilarity, labelSimilarity),
        };
      })
      .sort((a, b) => b.similarity - a.similarity);
    
    return suggestions;
  }, [headers, targetSchema, autoMapping]);
  return {
    autoMapping,
    unmappedHeaders,
    unmappedFields,
    getSuggestions,
  };
}
