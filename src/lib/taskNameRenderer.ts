import { supabase } from './supabase';

/**
 * Renders a task name using the Supabase RPC function with correct parameter order
 * @param paramValues - JSON object containing parameter values
 * @param paramOrder - Array of parameter slugs in order
 * @returns Promise resolving to the rendered task name
 */
export async function renderTaskNameFromParams(
  paramValues: Record<string, any>,
  paramOrder: string[]
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  try {
    // Call RPC function with CORRECT parameter order:
    // First: input_param_values (jsonb)
    // Second: input_param_order (text[])
    const { data, error } = await supabase.rpc('render_task_name_from_param_values', {
      input_param_values: paramValues,  // FIRST parameter (jsonb)
      input_param_order: paramOrder     // SECOND parameter (text[])
    });

    if (error) {
      console.error('Error calling render_task_name_from_param_values:', error);
      throw error;
    }

    return data as string;
  } catch (error) {
    console.error('Failed to render task name from params:', error);
    throw error;
  }
}

/**
 * Renders task name with fallback to local generation if RPC fails
 * @param paramValues - JSON object containing parameter values
 * @param paramOrder - Array of parameter slugs in order
 * @param fallbackGenerator - Function to generate name locally if RPC fails
 * @returns Promise resolving to the rendered task name
 */
export async function renderTaskNameWithFallback(
  paramValues: Record<string, any>,
  paramOrder: string[],
  fallbackGenerator?: () => string
): Promise<string> {
  try {
    return await renderTaskNameFromParams(paramValues, paramOrder);
  } catch (error) {
    console.warn('RPC function failed, using fallback:', error);
    
    if (fallbackGenerator) {
      return fallbackGenerator();
    }
    
    // Default fallback: create a basic name from parameters
    const paramNames = Object.entries(paramValues)
      .map(([key, value]) => value)
      .join(' ');
    
    return paramNames || 'Cómputo sin nombre';
  }
}