import { useState, useMemo } from 'react';
import { AlertTriangle, Check, X, Search, Plus, ChevronRight, CheckCircle2, ArrowRight, Info, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { TargetField, ManualMapping, ValidationError } from '../types';

interface ConflictGroup {
  field: string;
  fieldLabel: string;
  originalValues: string[];
  options: Array<{ label: string; value: string }>;
}

interface SuccessfulMappingGroup {
  field: string;
  fieldLabel: string;
  mappings: Array<{ originalValue: string; mappedTo: string; mappedLabel: string }>;
  options: Array<{ label: string; value: string }>;
}

interface FieldHelpMessage {
  message: string;
  linkText: string;
  linkPath: string;
}

interface StepConflictsProps {
  conflicts: ConflictGroup[];
  successfulMappings?: SuccessfulMappingGroup[];
  manualMappings: ManualMapping;
  onManualMappingChange: (field: string, originalValue: string, mappedValue: string | null) => void;
  targetSchema: TargetField[];
  onCreateNew?: (field: string, name: string, originalValue: string) => void;
  fieldHelpMessages?: Record<string, FieldHelpMessage>;
  onCloseModal?: () => void;
}

export function StepConflicts({
  conflicts,
  successfulMappings = [],
  manualMappings,
  onManualMappingChange,
  targetSchema,
  onCreateNew,
  fieldHelpMessages = {},
  onCloseModal,
}: StepConflictsProps) {
  const [, navigate] = useLocation();
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [expandedSuccessful, setExpandedSuccessful] = useState<Set<string>>(new Set());

  const handleHelpLinkClick = (path: string) => {
    navigate(path);
    if (onCloseModal) {
      setTimeout(() => onCloseModal(), 0);
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    const field = targetSchema.find(f => f.field === fieldName);
    return field?.label || fieldName;
  };

  const toggleExpanded = (key: string) => {
    setExpandedConflicts(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSuccessfulExpanded = (key: string) => {
    setExpandedSuccessful(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getResolvedCount = (conflict: ConflictGroup): number => {
    return conflict.originalValues.filter(value => {
      const key = `${conflict.field}_${value}`;
      return manualMappings[key] !== undefined;
    }).length;
  };

  const isFullyResolved = (conflict: ConflictGroup): boolean => {
    return getResolvedCount(conflict) === conflict.originalValues.length;
  };

  const totalSuccessfulMappings = successfulMappings.reduce((sum, g) => sum + g.mappings.length, 0);
  const totalConflicts = conflicts.reduce((sum, c) => sum + c.originalValues.length, 0);
  const resolvedConflicts = conflicts.reduce((sum, c) => sum + getResolvedCount(c), 0);

  // If no conflicts and no successful mappings, show empty state
  if (conflicts.length === 0 && successfulMappings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-green-500/10 p-4">
          <Check className="h-12 w-12 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">¡Sin valores de referencia!</p>
          <p className="text-muted-foreground">
            No hay campos de referencia que mapear en esta importación
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Successful Mappings Summary */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Mapeos Exitosos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-300">{totalSuccessfulMappings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conflicts Summary */}
        <Card className={cn(
          "border-amber-500/30 bg-amber-500/5",
          totalConflicts === 0 && "border-green-500/30 bg-green-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {totalConflicts === 0 ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className={cn(
                  "font-medium",
                  totalConflicts === 0 ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
                )}>
                  {totalConflicts === 0 ? "Sin Conflictos" : "Conflictos Pendientes"}
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  totalConflicts === 0 ? "text-green-600 dark:text-green-300" : "text-amber-600 dark:text-amber-300"
                )}>
                  {totalConflicts === 0 ? "0" : `${resolvedConflicts}/${totalConflicts}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-6 pr-4">
          {/* ===== SUCCESSFUL MAPPINGS SECTION ===== */}
          {successfulMappings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <h3 className="font-medium text-green-700 dark:text-green-400">
                  Valores Mapeados Automáticamente
                </h3>
                <Badge variant="success" className="ml-auto">
                  {totalSuccessfulMappings} valores
                </Badge>
              </div>
              
              {successfulMappings.map((group) => {
                const isExpanded = expandedSuccessful.has(group.field);
                const searchTerm = searchTerms[`success_${group.field}`] || '';
                
                const filteredOptions = group.options.filter(opt => 
                  opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                return (
                  <Card key={group.field} className="border-green-500/20 bg-green-500/5">
                    <CardHeader 
                      className="p-3 cursor-pointer hover:bg-green-500/10 transition-colors"
                      onClick={() => toggleSuccessfulExpanded(group.field)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform text-green-600",
                            isExpanded && "rotate-90"
                          )} />
                          <div>
                            <CardTitle className="text-sm font-medium">{group.fieldLabel}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {group.mappings.length} {group.mappings.length === 1 ? 'valor mapeado' : 'valores mapeados'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="success">
                          <Check className="h-3 w-3 mr-1" />
                          Resuelto
                        </Badge>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0 pb-3 px-3 space-y-3">
                        {group.options.length > 10 && (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar opciones..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerms(prev => ({ ...prev, [`success_${group.field}`]: e.target.value }))}
                              className="pl-9 h-8 text-sm"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          {group.mappings.map((mapping, idx) => {
                            const mappingKey = `${group.field}_${mapping.originalValue}`;
                            const currentMapping = manualMappings[mappingKey];
                            // Use manual mapping if set, otherwise use the auto-mapped value
                            const displayValue: string = currentMapping !== undefined 
                              ? (currentMapping === '' ? 'skip' : (currentMapping || mapping.mappedTo))
                              : mapping.mappedTo;

                            return (
                              <div 
                                key={`${mapping.originalValue}-${idx}`}
                                className="flex items-center gap-2 p-2 rounded-lg border border-green-500/30 bg-green-500/5"
                              >
                                <div className="flex-1 min-w-0">
                                  <Badge variant="neutral" className="font-mono text-xs">
                                    {mapping.originalValue}
                                  </Badge>
                                </div>

                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />

                                <div className="w-[180px] flex-shrink-0">
                                  <Select
                                    value={displayValue}
                                    onValueChange={(value) => {
                                      if (value === 'skip') {
                                        onManualMappingChange(group.field, mapping.originalValue, '');
                                      } else {
                                        onManualMappingChange(group.field, mapping.originalValue, value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger 
                                      className="h-8 text-sm border-green-500/30"
                                      data-testid={`select-success-${group.field}-${mapping.originalValue}`}
                                    >
                                      <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="skip">
                                        <span className="text-amber-500">Omitir valor</span>
                                      </SelectItem>
                                      {filteredOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* ===== CONFLICTS SECTION ===== */}
          {conflicts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="font-medium text-amber-700 dark:text-amber-400">
                  Valores Sin Coincidencia (Resolver Manualmente)
                </h3>
                <Badge variant={resolvedConflicts === totalConflicts ? "success" : "warning"} className="ml-auto">
                  {resolvedConflicts} / {totalConflicts} resueltos
                </Badge>
              </div>

              {conflicts.map((conflict) => {
                const isExpanded = expandedConflicts.has(conflict.field) || !isFullyResolved(conflict);
                const searchTerm = searchTerms[conflict.field] || '';
                
                const filteredOptions = conflict.options.filter(opt => 
                  opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                );

                return (
                  <Card key={conflict.field} className={cn(
                    "transition-colors",
                    isFullyResolved(conflict) && "border-green-500/30 bg-green-500/5",
                    !isFullyResolved(conflict) && "border-amber-500/30 bg-amber-500/5"
                  )}>
                    <CardHeader 
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpanded(conflict.field)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                          <div>
                            <CardTitle className="text-sm font-medium">{conflict.fieldLabel}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {conflict.originalValues.length} valores por asignar
                            </p>
                          </div>
                        </div>
                        <Badge variant={isFullyResolved(conflict) ? "success" : "warning"}>
                          {isFullyResolved(conflict) ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Resuelto
                            </>
                          ) : (
                            `${getResolvedCount(conflict)}/${conflict.originalValues.length}`
                          )}
                        </Badge>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0 pb-3 px-3 space-y-3">
                        {conflict.options.length > 10 && (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar opciones..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerms(prev => ({ ...prev, [conflict.field]: e.target.value }))}
                              className="pl-9 h-8 text-sm"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          {conflict.originalValues.map((originalValue) => {
                            const mappingKey = `${conflict.field}_${originalValue}`;
                            const currentMapping = manualMappings[mappingKey];
                            const isResolved = currentMapping !== undefined;
                            const displayValue = currentMapping === '' ? 'skip' : (currentMapping ?? 'unresolved');

                            return (
                              <div 
                                key={originalValue}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg border",
                                  isResolved && "border-green-500/30 bg-green-500/5",
                                  !isResolved && "border-amber-500/30 bg-amber-500/5"
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <Badge variant="neutral" className="font-mono text-xs">
                                    {originalValue}
                                  </Badge>
                                </div>

                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />

                                <div className="w-[180px] flex-shrink-0">
                                  <Select
                                    value={displayValue}
                                    onValueChange={(value) => {
                                      if (value === 'unresolved') {
                                        onManualMappingChange(conflict.field, originalValue, null);
                                      } else if (value === 'skip') {
                                        onManualMappingChange(conflict.field, originalValue, '');
                                      } else {
                                        onManualMappingChange(conflict.field, originalValue, value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger 
                                      className="h-8 text-sm"
                                      data-testid={`select-conflict-${conflict.field}-${originalValue}`}
                                    >
                                      <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unresolved">
                                        <span className="text-muted-foreground">Sin resolver</span>
                                      </SelectItem>
                                      <SelectItem value="skip">
                                        <span className="text-amber-500">Omitir valor</span>
                                      </SelectItem>
                                      {filteredOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {isResolved ? (
                                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {onCreateNew && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-sm"
                            onClick={() => {
                              const firstUnresolved = conflict.originalValues.find(v => 
                                manualMappings[`${conflict.field}_${v}`] === undefined
                              );
                              if (firstUnresolved) {
                                onCreateNew(conflict.field, firstUnresolved, firstUnresolved);
                              }
                            }}
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Crear nuevo {conflict.fieldLabel.toLowerCase()}
                          </Button>
                        )}

                        {/* Field-specific help message */}
                        {fieldHelpMessages[conflict.field] && (
                          <Alert className="mt-3 border-blue-500/30 bg-blue-500/5">
                            <Info className="h-4 w-4 text-blue-500" />
                            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                              {fieldHelpMessages[conflict.field].message}{' '}
                              <button
                                type="button"
                                onClick={() => handleHelpLinkClick(fieldHelpMessages[conflict.field].linkPath)}
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                {fieldHelpMessages[conflict.field].linkText}
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
