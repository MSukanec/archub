import { supabase } from '@/lib/supabase';

interface MappingPattern {
  id: string;
  organization_id: string;
  entity: string;
  source_header: string;
  target_field: string;
  usage_count: number;
  last_used_at: string;
}

interface PatternResult {
  targetField: string;
  usageCount: number;
}

/**
 * Gets stored mapping patterns from ia_import_mapping_patterns table.
 * Used to provide instant mapping suggestions based on organization history.
 * 
 * The function queries patterns that match:
 * - The organization ID
 * - The entity type (e.g., 'contacts', 'projects')
 * - Any of the provided source headers
 * 
 * Results are ordered by usage_count (descending) so the most frequently
 * used mappings appear first.
 * 
 * @param organizationId - ID of the organization
 * @param entity - Entity type being imported (e.g., 'contacts', 'projects')
 * @param headers - Array of column headers from the imported file
 * @returns Map from header (lowercase) -> { targetField, usageCount }
 * @throws {Error} If the Supabase query fails
 */
export async function getMappingPatterns(
  organizationId: string,
  entity: string,
  headers: string[]
): Promise<Map<string, PatternResult>> {
  const result = new Map<string, PatternResult>();

  if (!supabase || !organizationId || !entity || !headers.length) {
    return result;
  }

  try {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    const { data, error } = await supabase
      .from('ia_import_mapping_patterns')
      .select('source_header, target_field, usage_count')
      .eq('organization_id', organizationId)
      .eq('entity', entity)
      .in('source_header', normalizedHeaders)
      .order('usage_count', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return result;
    }

    for (const pattern of data) {
      const normalizedHeader = pattern.source_header.toLowerCase().trim();
      
      if (!result.has(normalizedHeader)) {
        result.set(normalizedHeader, {
          targetField: pattern.target_field,
          usageCount: pattern.usage_count
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching mapping patterns:', error);
    throw error;
  }
}

/**
 * Gets all mapping patterns for an organization and entity.
 * Useful for displaying pattern history or analytics.
 * 
 * @param organizationId - ID of the organization
 * @param entity - Entity type (e.g., 'contacts', 'projects')
 * @returns Array of all mapping patterns
 * @throws {Error} If the Supabase query fails
 */
export async function getAllMappingPatterns(
  organizationId: string,
  entity?: string
): Promise<MappingPattern[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  try {
    let query = supabase
      .from('ia_import_mapping_patterns')
      .select('*')
      .eq('organization_id', organizationId)
      .order('usage_count', { ascending: false });

    if (entity) {
      query = query.eq('entity', entity);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all mapping patterns:', error);
    throw error;
  }
}
