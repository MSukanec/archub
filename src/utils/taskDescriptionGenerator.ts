/**
 * Utility function to generate task descriptions for preview
 */
export function generatePreviewDescription(
  nameTemplate: string,
  paramValues: Record<string, any>,
  parameters: any[],
  parameterOptions: Record<string, any[]>
): string {
  if (!nameTemplate || !parameters) return nameTemplate;

  let result = nameTemplate;

  // Replace {{parameter}} placeholders
  parameters.forEach(param => {
    const placeholder = `{{${param.name}}}`;
    if (result.includes(placeholder)) {
      const value = paramValues[param.name];
      
      if (value) {
        let replacementText = '';
        
        if (param.type === 'select') {
          // Find the option and use its label
          const options = parameterOptions[param.id] || [];
          const selectedOption = options.find(opt => opt.value === value);
          replacementText = selectedOption?.label || value;
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