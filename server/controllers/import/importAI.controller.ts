/**
 * Controller for AI-powered import mapping suggestions.
 * Combines memory (ia_import_mapping_patterns) + OpenAI for smart column mapping.
 */
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

function createAuthenticatedClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

interface TargetSchemaField {
  field: string;
  label: string;
  type: string;
  required?: boolean;
  description?: string;
}

interface SuggestMappingRequest {
  headers: string[];
  sampleRows: any[];
  targetSchema: TargetSchemaField[];
  entity: string;
  organizationId?: string;
}

export async function handleSuggestMapping(req: Request, res: Response) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const authenticatedSupabase = createAuthenticatedClient(token);
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { headers, sampleRows, targetSchema, entity, organizationId } = req.body as SuggestMappingRequest;

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return res.status(400).json({ error: "headers is required and must be a non-empty array" });
    }
    if (!targetSchema || !Array.isArray(targetSchema)) {
      return res.status(400).json({ error: "targetSchema is required" });
    }
    if (!entity) {
      return res.status(400).json({ error: "entity is required" });
    }

    const mapping: Record<string, string> = {};
    const confidence: Record<string, number> = {};
    const headersNeedingAI: string[] = [];

    if (organizationId) {
      const { data: patterns } = await authenticatedSupabase
        .from('ia_import_mapping_patterns')
        .select('source_header, target_field, usage_count')
        .eq('organization_id', organizationId)
        .eq('entity', entity)
        .in('source_header', headers.map(h => h.toLowerCase().trim()));

      if (patterns && patterns.length > 0) {
        for (const pattern of patterns) {
          const originalHeader = headers.find(
            h => h.toLowerCase().trim() === pattern.source_header
          );
          if (originalHeader) {
            mapping[originalHeader] = pattern.target_field;
            confidence[originalHeader] = 1.0;
          }
        }
      }
    }

    for (const header of headers) {
      if (!mapping[header]) {
        headersNeedingAI.push(header);
      }
    }

    if (headersNeedingAI.length > 0) {
      try {
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const schemaDescription = targetSchema.map(f => 
          `- ${f.field} (${f.label}): tipo ${f.type}${f.required ? ', requerido' : ''}${f.description ? ` - ${f.description}` : ''}`
        ).join('\n');

        const sampleDataStr = sampleRows.slice(0, 3).map((row, i) => 
          `Fila ${i + 1}: ${JSON.stringify(row)}`
        ).join('\n');

        const prompt = `Eres un asistente de Seencel, una plataforma de gestión de construcción.

Tu tarea: mapear columnas de un archivo de importación a campos de nuestro sistema.

**Columnas del archivo a mapear:**
${headersNeedingAI.map(h => `- "${h}"`).join('\n')}

**Campos disponibles en el sistema (schema):**
${schemaDescription}

**Ejemplos de datos del archivo:**
${sampleDataStr}

**Instrucciones:**
1. Para cada columna del archivo, sugiere qué campo del schema corresponde.
2. Si una columna no tiene equivalente claro, no la incluyas en el mapping.
3. Considera variaciones en español: "Monto" → "amount", "Fecha de Pago" → "payment_date", "$ Cobrado" → "amount", etc.
4. Devuelve SOLO un JSON válido, sin texto adicional.

**Formato de respuesta (JSON estricto):**
{
  "mapping": {
    "NombreColumna": "nombre_campo",
    "OtraColumna": "otro_campo"
  },
  "confidence": {
    "NombreColumna": 0.92,
    "OtraColumna": 0.75
  }
}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const aiResult = JSON.parse(content);
          if (aiResult.mapping) {
            for (const [header, field] of Object.entries(aiResult.mapping)) {
              if (typeof field === 'string' && targetSchema.some(f => f.field === field)) {
                mapping[header] = field;
                confidence[header] = aiResult.confidence?.[header] ?? 0.8;
              }
            }
          }
        }
      } catch (aiError: any) {
        console.error('OpenAI error in suggest-mapping:', aiError.message);
      }
    }

    return res.json({ mapping, confidence });

  } catch (err: any) {
    console.error('Error in suggest-mapping:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleSaveMappings(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const authenticatedSupabase = createAuthenticatedClient(token);
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { organizationId, entity, mappings } = req.body;

    if (!organizationId || !entity || !mappings || !Array.isArray(mappings)) {
      return res.status(400).json({ error: "organizationId, entity, and mappings are required" });
    }

    for (const { sourceHeader, targetField } of mappings) {
      const normalizedHeader = sourceHeader.toLowerCase().trim();

      const { data: existing } = await authenticatedSupabase
        .from('ia_import_mapping_patterns')
        .select('id, usage_count')
        .eq('organization_id', organizationId)
        .eq('entity', entity)
        .eq('source_header', normalizedHeader)
        .single();

      if (existing) {
        await authenticatedSupabase
          .from('ia_import_mapping_patterns')
          .update({
            target_field: targetField,
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await authenticatedSupabase
          .from('ia_import_mapping_patterns')
          .insert({
            organization_id: organizationId,
            entity,
            source_header: normalizedHeader,
            target_field: targetField,
            usage_count: 1
          });
      }
    }

    return res.json({ success: true, savedCount: mappings.length });

  } catch (err: any) {
    console.error('Error in save-mappings:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
