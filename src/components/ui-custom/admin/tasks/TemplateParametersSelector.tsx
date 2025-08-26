import React, { useState, useEffect } from 'react'
import { useTaskTemplate } from '@/hooks/use-task-templates'
import { useTaskParametersAdmin } from '@/hooks/use-task-parameters-admin'
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { Label } from '@/components/ui/label'

interface ParameterSelection {
  parameterId: string
  optionId: string
  parameterSlug: string
  parameterLabel: string
  optionName: string
  optionLabel: string
}

interface TemplateParametersSelectorProps {
  templateId: string
  onSelectionChange: (selections: ParameterSelection[]) => void
  onPreviewChange: (preview: string) => void
  initialValues?: Record<string, any> | null
}

export const TemplateParametersSelector: React.FC<TemplateParametersSelectorProps> = ({
  templateId,
  onSelectionChange,
  onPreviewChange,
  initialValues
}) => {
  const [selections, setSelections] = useState<Record<string, string>>({})
  
  // Get the template with its parameters
  const { data: template, isLoading: templateLoading } = useTaskTemplate(templateId)
  
  // Get all parameters with their options
  const { data: parametersWithOptions = [] } = useTaskParametersAdmin()

  // Initialize selections from existing values
  useEffect(() => {
    if (initialValues && typeof initialValues === 'object') {
      setSelections(initialValues)
    }
  }, [initialValues])

  // Update parent when selections change
  useEffect(() => {
    if (!template?.parameters) return

    const parameterSelections: ParameterSelection[] = []
    
    template.parameters.forEach(templateParam => {
      const parameter = parametersWithOptions.find(p => p.id === templateParam.parameter_id)
      const selectedOptionId = selections[parameter?.slug || '']
      
      if (parameter && selectedOptionId) {
        const option = parameter.options.find(o => o.id === selectedOptionId)
        
        if (option) {
          parameterSelections.push({
            parameterId: parameter.id,
            optionId: option.id,
            parameterSlug: parameter.slug,
            parameterLabel: parameter.label,
            optionName: option.name,
            optionLabel: option.label
          })
        }
      }
    })
    
    onSelectionChange(parameterSelections)
    
    // Generate preview using the template's name_expression
    if (template.name_expression && parameterSelections.length > 0) {
      let preview = template.name_expression
      
      parameterSelections.forEach(selection => {
        const placeholder = `{${selection.parameterSlug}}`
        preview = preview.replace(placeholder, selection.optionLabel)
      })
      
      onPreviewChange(preview)
    }
  }, [selections, template, parametersWithOptions, onSelectionChange, onPreviewChange])

  const handleParameterChange = (parameterSlug: string, optionId: string) => {
    setSelections(prev => ({
      ...prev,
      [parameterSlug]: optionId
    }))
  }

  if (templateLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Cargando parámetros de la plantilla...
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-sm text-muted-foreground">
        No se pudo cargar la plantilla seleccionada
      </div>
    )
  }

  if (!template.parameters || template.parameters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Esta plantilla no tiene parámetros configurados
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {template.parameters
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map(templateParam => {
          const parameter = parametersWithOptions.find(p => p.id === templateParam.parameter_id)
          
          if (!parameter) return null
          
          const options = parameter.options.map(option => ({
            value: option.id,
            label: option.label
          }))
          
          return (
            <div key={templateParam.id}>
              <Label htmlFor={`param-${parameter.slug}`}>
                {parameter.label}
                {templateParam.is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <ComboBox
                value={selections[parameter.slug] || ''}
                onValueChange={(value) => handleParameterChange(parameter.slug, value)}
                options={options}
                placeholder={`Seleccionar ${parameter.label.toLowerCase()}...`}
                searchPlaceholder={`Buscar ${parameter.label.toLowerCase()}...`}
                emptyMessage={`No se encontraron opciones para ${parameter.label.toLowerCase()}`}
              />
              {parameter.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {parameter.description}
                </p>
              )}
            </div>
          )
        })}
    </div>
  )
}