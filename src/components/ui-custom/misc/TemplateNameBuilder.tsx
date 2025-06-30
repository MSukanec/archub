import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Type } from "lucide-react";
import { CustomCombobox } from "@/components/ui-custom/misc/CustomCombobox";
import { useActions } from "@/hooks/use-actions";

export interface TaskTemplateParameter {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  unit?: string;
  is_required: boolean;
  position: number;
}

interface TemplateNameBuilderProps {
  value: string;
  onChange: (newValue: string) => void;
  parameters: TaskTemplateParameter[];
  disabled?: boolean;
  placeholder?: string;
}

interface TemplateElement {
  id: string;
  type: 'text' | 'parameter' | 'action' | 'period';
  content: string;
  parameter?: TaskTemplateParameter;
  immutable?: boolean;
}

export function TemplateNameBuilder({ 
  value, 
  onChange, 
  parameters = [], 
  disabled = false,
  placeholder = "Construye tu plantilla de nombre..."
}: TemplateNameBuilderProps) {
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: actions = [] } = useActions();

  // Parse the value string into elements on mount and when value changes
  useEffect(() => {
    if (!value) {
      setElements([]);
      setSelectedAction("");
      return;
    }

    const parsed: TemplateElement[] = [];
    let currentText = "";
    let i = 0;

    // Check if value starts with an action pattern (action " de ")
    const actionPattern = /^(.+?) de /;
    const actionMatch = value.match(actionPattern);
    if (actionMatch) {
      const actionName = actionMatch[1];
      setSelectedAction(actionName);
      
      // Add immutable action element
      parsed.push({
        id: 'action',
        type: 'action',
        content: `${actionName} de `,
        immutable: true
      });
      
      i = actionMatch[0].length; // Skip past the action part
    }

    while (i < value.length) {
      if (value.substr(i, 2) === "{{") {
        // Save any accumulated text
        if (currentText.trim()) {
          parsed.push({
            id: `text-${parsed.length}`,
            type: 'text',
            content: currentText
          });
          currentText = "";
        }

        // Find the closing }}
        const closeIndex = value.indexOf("}}", i + 2);
        if (closeIndex !== -1) {
          const paramName = value.substring(i + 2, closeIndex);
          const parameter = parameters.find(p => p.name === paramName);
          
          parsed.push({
            id: `param-${parsed.length}`,
            type: 'parameter',
            content: paramName,
            parameter
          });
          
          i = closeIndex + 2;
        } else {
          // Malformed parameter, treat as text
          currentText += value[i];
          i++;
        }
      } else {
        currentText += value[i];
        i++;
      }
    }

    // Save any remaining text (except final period)
    if (currentText) {
      let finalText = currentText;
      if (finalText.endsWith('.')) {
        finalText = finalText.slice(0, -1);
        if (finalText.trim()) {
          parsed.push({
            id: `text-${parsed.length}`,
            type: 'text',
            content: finalText
          });
        }
        // Add immutable period element
        parsed.push({
          id: 'period',
          type: 'period',
          content: '.',
          immutable: true
        });
      } else if (finalText.trim()) {
        parsed.push({
          id: `text-${parsed.length}`,
          type: 'text',
          content: finalText
        });
      }
    }

    setElements(parsed);
  }, [value, parameters]);

  // Handle action change
  const handleActionChange = (actionName: string) => {
    setSelectedAction(actionName);
    
    // Filter out existing action element and rebuild with new action
    const elementsWithoutAction = elements.filter(el => el.type !== 'action');
    
    const newElements: TemplateElement[] = [];
    
    // Add new action element if action is selected
    if (actionName) {
      newElements.push({
        id: 'action',
        type: 'action',
        content: `${actionName} de `,
        immutable: true
      });
    }
    
    // Add other elements
    newElements.push(...elementsWithoutAction);
    
    // Ensure period at end if not empty
    const hasPeriod = newElements.some(el => el.type === 'period');
    if (newElements.length > 0 && !hasPeriod) {
      newElements.push({
        id: 'period',
        type: 'period',
        content: '.',
        immutable: true
      });
    }
    
    setElements(newElements);
    onChange(elementsToString(newElements));
  };

  // Convert elements back to string format
  const elementsToString = (elements: TemplateElement[]): string => {
    return elements.map(element => {
      if (element.type === 'parameter') {
        return `{{${element.content}}}`;
      }
      return element.content;
    }).join('');
  };

  // Add a parameter
  const addParameter = (parameter: TaskTemplateParameter) => {
    const newElements = [...elements];
    
    // Add the parameter element
    newElements.push({
      id: `param-${Date.now()}`,
      type: 'parameter',
      content: parameter.name,
      parameter
    });

    setElements(newElements);
    onChange(elementsToString(newElements));
    setIsPopoverOpen(false);
  };

  // Remove an element
  const removeElement = (elementId: string) => {
    const newElements = elements.filter(el => el.id !== elementId);
    setElements(newElements);
    onChange(elementsToString(newElements));
  };

  // Start editing text
  const startEditingText = (elementId: string, currentContent: string) => {
    setEditingText(elementId);
    setEditingValue(currentContent);
  };

  // Save edited text
  const saveEditedText = () => {
    if (editingText) {
      const newElements = elements.map(el => 
        el.id === editingText 
          ? { ...el, content: editingValue }
          : el
      );
      setElements(newElements);
      onChange(elementsToString(newElements));
    }
    setEditingText(null);
    setEditingValue("");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingText(null);
    setEditingValue("");
  };

  // Add text element
  const addTextElement = () => {
    const newElements = [...elements];
    newElements.push({
      id: `text-${Date.now()}`,
      type: 'text',
      content: " texto "
    });
    setElements(newElements);
    onChange(elementsToString(newElements));
  };

  // Handle key press in editing
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditedText();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingText]);

  // Get available parameters (not already used)
  const availableParameters = parameters.filter(param => 
    !elements.some(el => el.type === 'parameter' && el.content === param.name)
  );

  return (
    <div className="space-y-3">
      {/* Action selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Acción de la Plantilla
        </label>
        <CustomCombobox
          value={selectedAction}
          onValueChange={handleActionChange}
          options={actions}
          placeholder="Seleccionar acción..."
          searchPlaceholder="Buscar acción..."
          emptyMessage="No se encontraron acciones."
          allowClear={true}
          clearLabel="Sin acción"
        />
      </div>

      {/* Preview area */}
      <div className="min-h-[80px] p-3 border border-input rounded-md bg-background">
        {elements.length === 0 ? (
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <Type className="h-4 w-4" />
            {placeholder}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            {elements.map((element) => (
              <div key={element.id} className="flex items-center">
                {element.type === 'parameter' ? (
                  <Badge 
                    variant="secondary" 
                    className="flex items-center gap-1 px-2 py-1 bg-accent/20 hover:bg-accent/30 transition-colors"
                  >
                    <span className="text-xs font-medium">
                      {element.parameter?.label || element.content}
                    </span>
                    {!disabled && (
                      <button
                        onClick={() => removeElement(element.id)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ) : (
                  <div className="flex items-center">
                    {editingText === element.id ? (
                      <Input
                        ref={inputRef}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={saveEditedText}
                        onKeyDown={handleKeyPress}
                        className="h-6 text-xs px-1 py-0 min-w-[50px] w-auto"
                        style={{ width: `${Math.max(50, editingValue.length * 8)}px` }}
                      />
                    ) : (
                      <span 
                        className={`text-sm cursor-text hover:bg-muted/50 px-1 py-0.5 rounded transition-colors ${
                          disabled ? 'cursor-default' : 'cursor-pointer'
                        }`}
                        onClick={() => !disabled && startEditingText(element.id, element.content)}
                      >
                        {element.content}
                      </span>
                    )}
                    {!disabled && editingText !== element.id && (
                      <button
                        onClick={() => removeElement(element.id)}
                        className="ml-1 opacity-0 hover:opacity-100 hover:bg-destructive/20 rounded-full p-0.5 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control buttons */}
      {!disabled && (
        <div className="flex gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                disabled={availableParameters.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Insertar Parámetro
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Parámetros disponibles:
                </div>
                {availableParameters.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2">
                    Todos los parámetros ya están en uso
                  </div>
                ) : (
                  availableParameters.map((parameter) => (
                    <button
                      key={parameter.id}
                      onClick={() => addParameter(parameter)}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded transition-colors"
                    >
                      <div className="font-medium">{parameter.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {parameter.type}
                        {parameter.unit && ` (${parameter.unit})`}
                        {parameter.is_required && " • Requerido"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={addTextElement}
          >
            <Type className="h-4 w-4 mr-1" />
            Agregar Texto
          </Button>
        </div>
      )}

      {/* Preview with example values */}
      {elements.length > 0 && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded border">
          <div className="font-medium mb-1">Vista previa con valores de ejemplo:</div>
          <div className="italic">
            {elements.map((element) => {
              if (element.type === 'parameter') {
                // Generate example values based on parameter type
                const getExampleValue = (param: TaskTemplateParameter) => {
                  switch (param.type) {
                    case 'number':
                      return param.unit ? `20 ${param.unit}` : '20';
                    case 'boolean':
                      return 'Sí';
                    case 'select':
                      return 'Opción A';
                    default:
                      return param.label.toLowerCase();
                  }
                };
                
                return element.parameter ? getExampleValue(element.parameter) : element.content;
              }
              return element.content;
            }).join('')}
          </div>
        </div>
      )}
    </div>
  );
}