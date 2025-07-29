/**
 * Utility function to generate task descriptions for already created tasks
 * This function works with the stored param_values from the database
 */
export async function generateTaskDescription(
  nameTemplate: string,
  paramValues: Record<string, any>,
  parameters: any[] = [],
  parameterOptions: Record<string, any[]> = {}
): Promise<string> {
  if (!nameTemplate) return nameTemplate;

  // Import supabase client for database access
  const { supabase } = await import('@/lib/supabase');
  let result = nameTemplate;

  if (!paramValues || Object.keys(paramValues).length === 0) {
    return result;
  }

  // Get all parameter IDs to fetch their information
  const paramNames = Object.keys(paramValues);
  
  // Fetch parameter information from database
  const { data: parametersData, error } = await supabase
    .from('task_parameters')
    .select('name, type, expression_template')
    .in('name', paramNames);

  if (error) {
    console.error('Error fetching parameters:', error);
    return nameTemplate;
  }

  // For select type parameters, get parameter values
  const selectParamValues = Object.entries(paramValues)
    .filter(([paramName]) => {
      const param = parametersData?.find(p => p.name === paramName);
      return param?.type === 'select';
    })
    .map(([, value]) => value)
    .filter(value => typeof value === 'string'); // Only string values can be found in parameter_values

  let parameterValuesData: any[] = [];
  if (selectParamValues.length > 0) {
    const { data: valuesData, error: valuesError } = await supabase
      .from('task_parameter_options')
      .select('name, label, parameter_id, task_parameters!inner(expression_template)')
      .in('name', selectParamValues);

    if (!valuesError) {
      parameterValuesData = valuesData || [];
    }
  }

  // Replace placeholders AND literal parameter values
  Object.entries(paramValues).forEach(([paramName, paramValue]) => {
    const placeholder = `{{${paramName}}}`;
    const parameter = parametersData?.find(p => p.name === paramName);
    
    if (parameter) {
      let replacementText = '';
      
      if (parameter.type === 'select') {
        // Find the option and use its label with expression_template
        const selectedOption = parameterValuesData.find(pv => pv.name === paramValue);
        if (selectedOption) {
          const optionLabel = selectedOption.label || paramValue;
          const expressionTemplate = selectedOption.task_parameters?.expression_template;
          
          if (expressionTemplate) {
            replacementText = expressionTemplate.replace('{value}', optionLabel);
          } else {
            replacementText = optionLabel;
          }
        } else {
          // Fallback to raw value for select types
          replacementText = String(paramValue);
        }
      } else if (parameter.type === 'boolean') {
        replacementText = paramValue ? 'Sí' : 'No';
      } else {
        // For text, number types, use expression_template if available
        if (parameter.expression_template) {
          replacementText = parameter.expression_template.replace('{value}', String(paramValue));
        } else {
          replacementText = String(paramValue);
        }
      }
      
      // Replace both placeholder and direct parameter value
      if (result.includes(placeholder)) {
        result = result.replace(placeholder, replacementText.trim());
      }
      // Also replace literal parameter values (like "ladrillo-ceramico-121833")
      if (result.includes(String(paramValue))) {
        result = result.replace(String(paramValue), replacementText.trim());
      }
    } else {
      // Fallback if parameter not found - only replace placeholder
      if (result.includes(placeholder)) {
        result = result.replace(placeholder, String(paramValue));
      }
    }
  });

  // Clean up multiple spaces and trim the final result
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Utility function to generate task descriptions for preview
 * Uses expression_template from parameters to format the replacement text
 */
export function generatePreviewDescription(
  nameTemplate: string,
  paramValues: Record<string, any>,
  parameters: any[],
  parameterOptions: Record<string, any[]>
): string {
  if (!nameTemplate || !parameters) return nameTemplate;

  let result = nameTemplate;

  // Replace {{parameter}} placeholders with expression_template formatted values
  (parameters || []).forEach(param => {
    const placeholder = `{{${param.name}}}`;
    if (result.includes(placeholder)) {
      const value = paramValues[param.name];
      
      if (value) {
        let replacementText = '';
        
        if (param.type === 'select') {
          // Find the option and use its label with expression_template
          const options = parameterOptions[param.id] || [];
          const selectedOption = options.find(opt => opt.value === value);
          const optionLabel = selectedOption?.label || value;
          
          // Use expression_template if available (e.g., "de {value}" or "con mortero de asiento de {value}")
          if (param.expression_template) {
            replacementText = param.expression_template.replace('{value}', optionLabel);
          } else {
            replacementText = optionLabel;
          }
        } else if (param.type === 'boolean') {
          replacementText = value ? 'Sí' : 'No';
        } else {
          // For other types (text, number), use expression_template if available
          if (param.expression_template) {
            replacementText = param.expression_template.replace('{value}', String(value));
          } else {
            replacementText = String(value);
          }
        }
        
        result = result.replace(placeholder, replacementText.trim());
      } else {
        // If no value, leave placeholder visible
        result = result.replace(placeholder, `[${param.label}]`);
      }
    }
  });

  // Clean up multiple spaces and trim the final result
  return result.replace(/\s+/g, ' ').trim();
}