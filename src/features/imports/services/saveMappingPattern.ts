import { supabase } from '@/lib/supabase';
/**
 * Saves or updates a single mapping pattern in ia_import_mapping_patterns table.
 * Called when user confirms a mapping to build up memory.
 * 
 * Logic:
 * - If pattern already exists (same org + entity + source_header + target_field):
 *   UPDATE usage_count + 1, last_used_at = now()
 * - If not exists: INSERT new row with usage_count = 1
 * 
 * @param organizationId - ID of the organization
 * @param entity - Entity type being imported (e.g., 'contacts', 'projects')
 * @param sourceHeader - The original column header from the file
 * @param targetField - The target field it was mapped to
 * @throws {Error} If the Supabase query fails
 */
export async function saveMappingPattern(
  organizationId: string,
  entity: string,
  sourceHeader: string,
  targetField: string
): Promise<void> {
  if (!supabase || !organizationId || !entity || !sourceHeader || !targetField) {
    return;
  }
  try {
    const normalizedHeader = sourceHeader.toLowerCase().trim();
    const { data: existing, error: fetchError } = await supabase
      .from('ia_import_mapping_patterns')
      .select('id, usage_count')
      .eq('organization_id', organizationId)
      .eq('entity', entity)
      .eq('source_header', normalizedHeader)
      .eq('target_field', targetField)
      .maybeSingle();
    if (fetchError) {
      throw fetchError;
    }
    if (existing) {
      const { error: updateError } = await supabase
        .from('ia_import_mapping_patterns')
        .update({
          usage_count: existing.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('ia_import_mapping_patterns')
        .insert({
          organization_id: organizationId,
          entity: entity,
          source_header: normalizedHeader,
          target_field: targetField,
          usage_count: 1,
          last_used_at: new Date().toISOString()
        });
      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error saving mapping pattern:', error);
    throw error;
  }
}
/**
 * Batch saves multiple mapping patterns at once.
 * More efficient than calling saveMappingPattern multiple times.
 * 
 * For each mapping:
 * - If pattern exists: UPDATE usage_count + 1, last_used_at = now()
 * - If not exists: INSERT new row
 * 
 * Uses a transaction-like approach where all operations are executed,
 * and errors are collected but don't stop the batch.
 * 
 * @param organizationId - ID of the organization
 * @param entity - Entity type being imported (e.g., 'contacts', 'projects')
 * @param mappings - Array of source-target mapping pairs
 * @throws {Error} If any critical Supabase operation fails
 */
export async function saveMappingPatternsBatch(
  organizationId: string,
  entity: string,
  mappings: Array<{ sourceHeader: string; targetField: string }>
): Promise<void> {
  if (!supabase || !organizationId || !entity || !mappings.length) {
    return;
  }
  try {
    const normalizedMappings = mappings
      .filter(m => m.sourceHeader && m.targetField)
      .map(m => ({
        sourceHeader: m.sourceHeader.toLowerCase().trim(),
        targetField: m.targetField
      }));
    if (normalizedMappings.length === 0) {
      return;
    }
    const normalizedHeaders = normalizedMappings.map(m => m.sourceHeader);
    const { data: existingPatterns, error: fetchError } = await supabase
      .from('ia_import_mapping_patterns')
      .select('id, source_header, target_field, usage_count')
      .eq('organization_id', organizationId)
      .eq('entity', entity)
      .in('source_header', normalizedHeaders);
    if (fetchError) {
      throw fetchError;
    }
    const existingMap = new Map<string, { id: string; usageCount: number }>();
    for (const pattern of existingPatterns || []) {
      const key = `${pattern.source_header}::${pattern.target_field}`;
      existingMap.set(key, {
        id: pattern.id,
        usageCount: pattern.usage_count
      });
    }
    const toInsert: Array<{
      organization_id: string;
      entity: string;
      source_header: string;
      target_field: string;
      usage_count: number;
      last_used_at: string;
    }> = [];
    const toUpdate: Array<{ id: string; usage_count: number; last_used_at: string }> = [];
    const now = new Date().toISOString();
    for (const mapping of normalizedMappings) {
      const key = `${mapping.sourceHeader}::${mapping.targetField}`;
      const existing = existingMap.get(key);
      if (existing) {
        toUpdate.push({
          id: existing.id,
          usage_count: existing.usageCount + 1,
          last_used_at: now
        });
      } else {
        toInsert.push({
          organization_id: organizationId,
          entity: entity,
          source_header: mapping.sourceHeader,
          target_field: mapping.targetField,
          usage_count: 1,
          last_used_at: now
        });
      }
    }
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('ia_import_mapping_patterns')
        .insert(toInsert);
      if (insertError) {
        console.error('Error inserting mapping patterns:', insertError);
      }
    }
    for (const update of toUpdate) {
      const { error: updateError } = await supabase
        .from('ia_import_mapping_patterns')
        .update({
          usage_count: update.usage_count,
          last_used_at: update.last_used_at
        })
        .eq('id', update.id);
      if (updateError) {
        console.error('Error updating mapping pattern:', updateError);
      }
    }
  } catch (error) {
    console.error('Error in batch save mapping patterns:', error);
    throw error;
  }
}
/**
 * Deletes a specific mapping pattern.
 * Useful for cleaning up incorrect or outdated patterns.
 * 
 * @param patternId - ID of the pattern to delete
 * @throws {Error} If the Supabase delete fails
 */
export async function deleteMappingPattern(patternId: string): Promise<void> {
  if (!supabase || !patternId) {
    return;
  }
  try {
    const { error } = await supabase
      .from('ia_import_mapping_patterns')
      .delete()
      .eq('id', patternId);
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting mapping pattern:', error);
    throw error;
  }
}
