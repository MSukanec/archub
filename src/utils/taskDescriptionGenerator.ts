import { TaskTemplate } from '@/hooks/use-task-templates';
import { TaskTemplateParameter } from '@/hooks/use-task-templates';

export interface TaskParameterValue {
  id: string;
  value: string;
  label: string;
}

export interface ParameterOptions {
  [parameterId: string]: TaskParameterValue[];
}

/**
 * Generates a dynamic task description based on template and parameters
 * @param template - The task template with name_template
 * @param parameters - Array of template parameters with expression_template
 * @param paramValues - Object with parameter values (key: param.name, value: selected option value)
 * @param parameterOptions - Options for each parameter to get labels
 * @returns Generated description string
 */
export function generateTaskDescription(
  template: TaskTemplate | null,
  parameters: TaskTemplateParameter[] | null,
  paramValues: Record<string, any>,
  parameterOptions: ParameterOptions
): string {
  if (!template || !parameters) return '';

  let description = template.name_template || '';
  
  // Sort parameters by position
  const sortedParameters = parameters.sort((a, b) => a.position - b.position);

  // Process each parameter
  sortedParameters.forEach(param => {
    const paramName = param.name;
    if (!paramName) return;

    const rawValue = paramValues[paramName];
    if (!rawValue) return;

    // Find the label for the selected option
    const options = parameterOptions[param.id] || [];
    const selectedOption = options.find(opt => opt.value === rawValue);
    if (!selectedOption?.label) return;

    // Use expression_template and replace {value} with the option label
    const expressionTemplate = param.expression_template || '{value}';
    const fragment = expressionTemplate.replace('{value}', selectedOption.label);

    // Replace placeholder in name_template
    const placeholder = `{{${paramName}}}`;
    description = description.replace(placeholder, fragment);
  });

  // Add final period if not present
  if (description && !description.endsWith('.')) {
    description += '.';
  }

  return description;
}

/**
 * Generates a preview description for real-time updates
 * Same as generateTaskDescription but with explicit typing for preview use
 */
export function generatePreviewDescription(
  template: TaskTemplate | null,
  parameters: TaskTemplateParameter[] | null,
  paramValues: Record<string, any>,
  parameterOptions: ParameterOptions
): string {
  return generateTaskDescription(template, parameters, paramValues, parameterOptions);
}