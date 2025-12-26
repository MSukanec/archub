import { useMemo } from 'react';
import { ArrowRight, Check, AlertCircle, HelpCircle, Loader2, Sparkles, FolderKanban, Building2, Info, AlertTriangle, UserCircle, Coins, Wallet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ParsedData, ColumnMapping, TargetField, ProjectContext } from '../types';
interface StepMappingProps {
  parsedData: ParsedData;
  targetSchema: TargetField[];
  columnMapping: ColumnMapping;
  onMappingChange: (columnIndex: number, field: string | null) => void;
  getSuggestions?: (headerIndex: number) => Array<{ field: string; label: string; similarity: number }>;
  aiConfidence?: Record<string, number>;
  isLoadingAI?: boolean;
  /** Contexto de proyecto/organización */
  projectContext?: ProjectContext;
  /** Se detectó columna de proyecto en el archivo */
  hasProjectColumn?: boolean;
  /** Índice de la columna de proyecto detectada */
  projectColumnIndex?: number;
  /** Lista de proyectos disponibles para selección (contexto organización) */
  availableProjects?: Array<{ id: string; name: string }>;
  /** Proyecto seleccionado cuando no hay columna de proyecto */
  selectedProjectId?: string | null;
  /** Callback cuando se selecciona un proyecto */
  onProjectSelect?: (projectId: string) => void;
  /** Hay conflicto: contexto proyecto + columna proyecto sin override */
  hasProjectContextConflict?: boolean;
  /** Callback para cambiar a contexto de organización */
  onSwitchToOrgContext?: () => void;
  /** Se detectó columna de cliente en el archivo */
  hasClientColumn?: boolean;
  /** Índice de la columna de cliente detectada */
  clientColumnIndex?: number;
  /** Lista de clientes disponibles para selección */
  availableClients?: Array<{ id: string; name: string }>;
  /** Cliente seleccionado cuando no hay columna de cliente */
  selectedClientId?: string | null;
  /** Callback cuando se selecciona un cliente */
  onClientSelect?: (clientId: string) => void;
  /** Valores por defecto para campos obligatorios sin columna */
  defaultFieldValues?: Record<string, string>;
  /** Callback cuando se selecciona un valor por defecto */
  onDefaultFieldValueChange?: (fieldName: string, value: string) => void;
}
function getAIBadge(confidence: number) {
  if (confidence >= 0.9) {
    return { label: 'IA', className: 'bg-green-500/10 text-green-600 border-green-500/30'};
  }
  if (confidence >= 0.7) {
    return { label: `IA ${Math.round(confidence * 100)}%`, className: 'bg-blue-500/10 text-blue-600 border-blue-500/30'};
  }
  return { label: 'IA ?', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30'};
}
export function StepMapping({
  parsedData,
  targetSchema,
  columnMapping,
  onMappingChange,
  getSuggestions,
  aiConfidence,
  isLoadingAI,
  projectContext,
  hasProjectColumn,
  projectColumnIndex,
  availableProjects,
  selectedProjectId,
  onProjectSelect,
  hasProjectContextConflict,
  onSwitchToOrgContext,
  hasClientColumn,
  clientColumnIndex,
  availableClients,
  selectedClientId,
  onClientSelect,
  defaultFieldValues,
  onDefaultFieldValueChange,
}: StepMappingProps) {
  const contextName = projectContext?.type === 'project'
    ? projectContext.projectName 
    : projectContext?.type === 'organization'
      ? projectContext.organizationName 
      : undefined;
  const mappedFields = useMemo(() => {
    return new Set(Object.values(columnMapping).filter(Boolean) as string[]);
  }, [columnMapping]);
  const requiredFields = useMemo(() => {
    return targetSchema.filter(f => f.required);
  }, [targetSchema]);
  const missingRequiredFields = useMemo(() => {
    return requiredFields.filter(f => !mappedFields.has(f.field));
  }, [requiredFields, mappedFields]);
  // Campos obligatorios faltantes que tienen opciones de foreign-key disponibles
  const missingRequiredWithOptions = useMemo(() => {
    return missingRequiredFields.filter(f => 
      f.foreignKeyConfig && 
      f.foreignKeyConfig.options && 
      f.foreignKeyConfig.options.length > 0
    );
  }, [missingRequiredFields]);
  // Campos obligatorios faltantes SIN opciones (realmente bloqueantes)
  const missingRequiredWithoutOptions = useMemo(() => {
    return missingRequiredFields.filter(f => {
      // Si tiene foreign-key con opciones, no es bloqueante
      if (f.foreignKeyConfig?.options && f.foreignKeyConfig.options.length > 0) {
        // Pero solo si ya se seleccionó un valor por defecto
        return !defaultFieldValues?.[f.field];
      }
      return true;
    });
  }, [missingRequiredFields, defaultFieldValues]);
  const getMappingStatus = (columnIndex: number): 'mapped'| 'unmapped'| 'required-missing'=> {
    const field = columnMapping[columnIndex];
    if (!field) return 'unmapped';
    
    const targetField = targetSchema.find(f => f.field === field);
    if (targetField?.required) return 'mapped';
    
    return 'mapped';
  };
  const getFieldLabel = (fieldName: string): string => {
    const field = targetSchema.find(f => f.field === fieldName);
    return field?.label || fieldName;
  };
  const getAvailableFields = (currentColumnIndex: number) => {
    return targetSchema.filter(field => {
      if (columnMapping[currentColumnIndex] === field.field) return true;
      return !mappedFields.has(field.field);
    });
  };
  const formatCellValue = (cell: any): string => {
    if (cell === null || cell === undefined) return '-';
    
    if (cell instanceof Date) {
      return isValid(cell) ? format(cell, 'dd/MM/yyyy', { locale: es }) : String(cell);
    }
    
    if (typeof cell === 'number'&& cell > 1000000000 && cell < 2000000000000) {
      const date = new Date(cell);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: es }) : String(cell);
    }
    
    if (typeof cell === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T|$)/;
      if (dateRegex.test(cell)) {
        try {
          const date = new Date(cell);
          return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: es }) : cell;
        } catch {
          return cell;
        }
      }
    }
    
    return String(cell);
  };
  return (
    <div className="space-y-6">
      {/* Contexto de proyecto */}
      {projectContext && (
        <Card className={cn(
          "border-primary/30",
          projectContext.type === 'project'? "bg-primary/5" : "bg-purple-500/5 border-purple-500/30"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {projectContext.type === 'project'? (
                <FolderKanban className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <Building2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium",
                    projectContext.type === 'project'? "text-primary" : "text-purple-500"
                  )}>
                    {projectContext.type === 'project'
                      ? `Importando al proyecto${contextName ? `: ${contextName}` : 'activo'}`
                      : `Importando a nivel organización${contextName ? `: ${contextName}` : ''}`
                    }
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {projectContext.type === 'project'
                    ? 'Todos los registros serán asignados a este proyecto.'
                    : hasProjectColumn
                      ? 'Mapea la columna "Proyecto" al campo correspondiente para asignar cada registro.'
                      : 'Selecciona el proyecto al que se asignarán todos los registros.'
                  }
                </p>
                
                {/* Project selector for organization context without project column */}
                {projectContext.type === 'organization'&& !hasProjectColumn && availableProjects && availableProjects.length > 0 && (
                  <div className="pt-2">
                    <Select
                      value={selectedProjectId || ''}
                      onValueChange={(value) => onProjectSelect?.(value)}
                    >
                      <SelectTrigger 
                        className={cn(
                          "w-full",
                          selectedProjectId && "border-green-500/50"
                        )}
                        data-testid="select-project-for-import"
                      >
                        <SelectValue placeholder="Selecciona el proyecto para estos registros" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <FolderKanban className="h-4 w-4 text-muted-foreground" />
                              <span>{project.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProjectId && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Todos los registros se asignarán a este proyecto
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Alerta BLOQUEANTE si se detectó columna de proyecto en contexto de proyecto */}
      {hasProjectContextConflict && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <p className="font-medium text-destructive">Columna "Proyecto" detectada</p>
                  <p className="text-sm text-destructive/80">
                    Tu archivo tiene una columna de proyecto, pero estás importando a un proyecto específico.
                    Para usar la columna de proyecto del archivo, debes cambiar a contexto de organización.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onSwitchToOrgContext}
                  className="bg-destructive text-white hover:bg-destructive/90"
                  data-testid="button-switch-to-org-context"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Cambiar a contexto de Organización
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Selector de cliente cuando no hay columna de cliente en el archivo */}
      {!hasClientColumn && availableClients && availableClients.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <UserCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-orange-500">
                    Asignación de Cliente
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  No se detectó columna de cliente en el archivo. Selecciona el cliente al que se asignarán todos los registros.
                </p>
                <div className="pt-2">
                  <Select
                    value={selectedClientId || ''}
                    onValueChange={(value) => onClientSelect?.(value)}
                  >
                    <SelectTrigger 
                      className={cn(
                        "w-full",
                        selectedClientId && "border-green-500/50"
                      )}
                      data-testid="select-client-for-import"
                    >
                      <SelectValue placeholder="Selecciona el cliente para estos registros" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span>{client.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedClientId && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Todos los registros se asignarán a este cliente
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {isLoadingAI && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-600">Analizando con IA...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Campos obligatorios faltantes SIN opciones (bloqueantes) */}
      {missingRequiredWithoutOptions.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-amber-500">Campos obligatorios sin asignar</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missingRequiredWithoutOptions.map(field => (
                    <Badge key={field.field} variant="outline" className="border-amber-500/50 text-amber-500">
                      {field.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Selectores para campos obligatorios faltantes CON opciones */}
      {missingRequiredWithOptions.map(field => {
        const selectedValue = defaultFieldValues?.[field.field];
        const options = field.foreignKeyConfig?.options || [];
        const fieldIcon = field.field.includes('currency') ? Coins : 
                         field.field.includes('wallet') ? Wallet : AlertCircle;
        const IconComponent = fieldIcon;
        
        return (
          <Card key={field.field} className={cn(
            "border-blue-500/30",
            selectedValue ? "bg-green-500/5 border-green-500/30" : "bg-blue-500/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <IconComponent className={cn(
                  "h-5 w-5 flex-shrink-0 mt-0.5",
                  selectedValue ? "text-green-500" : "text-blue-500"
                )} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium",
                      selectedValue ? "text-green-500" : "text-blue-500"
                    )}>
                      {selectedValue ? (
                        <>
                          <Check className="h-4 w-4 inline mr-1" />
                          {field.label} asignado
                        </>
                      ) : (
                        `Seleccionar ${field.label}`
                      )}
                    </p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-500">
                      Requerido
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedValue 
                      ? `Todos los registros usarán el valor seleccionado.`
                      : `No se detectó columna de "${field.label}" en el archivo. Selecciona un valor para todos los registros.`
                    }
                  </p>
                  <div className="pt-1">
                    <Select
                      value={selectedValue || ''}
                      onValueChange={(value) => onDefaultFieldValueChange?.(field.field, value)}
                    >
                      <SelectTrigger 
                        className={cn(
                          "w-full",
                          selectedValue && "border-green-500/50"
                        )}
                        data-testid={`select-default-${field.field}`}
                      >
                        <SelectValue placeholder={`Selecciona ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {parsedData.headers.map((header, index) => {
            const status = getMappingStatus(index);
            const mappedField = columnMapping[index];
            const sampleValues = parsedData.rows
              .slice(0, 3)
              .map(row => row[index])
              .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
              .map(v => String(v).substring(0, 30));
            return (
              <Card 
                key={index} 
                className={cn(
                  "transition-colors",
                  status === 'mapped'&& "border-green-500/30 bg-green-500/5",
                  status === 'unmapped'&& "border-muted"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{header}</p>
                        {status === 'mapped'&& (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {status === 'mapped'&& aiConfidence?.[header] !== undefined && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1.5 py-0 flex-shrink-0",
                              getAIBadge(aiConfidence[header]).className
                            )}
                          >
                            {getAIBadge(aiConfidence[header]).label}
                          </Badge>
                        )}
                      </div>
                      {sampleValues.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Ej: {parsedData.rows
                            .slice(0, 3)
                            .map(row => row[index])
                            .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
                            .map(v => formatCellValue(v))
                            .slice(0, 3)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="w-[220px] flex-shrink-0">
                      <Select
                        value={mappedField || 'no-mapping'}
                        onValueChange={(value) => onMappingChange(index, value === 'no-mapping'? null : value)}
                      >
                        <SelectTrigger 
                          className={cn(
                            mappedField && "border-green-500/50"
                          )}
                          data-testid={`select-mapping-${index}`}
                        >
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-mapping">
                            <span className="text-muted-foreground">Sin asignar</span>
                          </SelectItem>
                          {getAvailableFields(index).map(field => (
                            <SelectItem key={field.field} value={field.field}>
                              <div className="flex items-center gap-2">
                                <span>{field.label}</span>
                                {field.required && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    Requerido
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-shrink-0">
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[250px] bg-popover border border-border text-popover-foreground">
                          {mappedField ? (
                            <p>Esta columna se importará como "{getFieldLabel(mappedField)}"</p>
                          ) : (
                            <p>Esta columna no se importará</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{Object.values(columnMapping).filter(Boolean).length} mapeadas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            <span>{parsedData.headers.length - Object.values(columnMapping).filter(Boolean).length} sin asignar</span>
          </div>
        </div>
        <div className="text-sm">
          {targetSchema.length - mappedFields.size} campos disponibles
        </div>
      </div>
    </div>
  );
}
