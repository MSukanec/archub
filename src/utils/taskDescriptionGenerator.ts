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
          replacementText = String(value);
        }
        
        result = result.replace(placeholder, replacementText);
      } else {
        // If no value, leave placeholder visible
        result = result.replace(placeholder, `[${param.label}]`);
      }
    }
  });

  return result;
}