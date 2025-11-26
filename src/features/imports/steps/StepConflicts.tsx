import { useState, useMemo } from 'react';
import { AlertTriangle, Check, X, Search, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TargetField, ManualMapping, ValidationError } from '../types';

interface ConflictGroup {
  field: string;
  fieldLabel: string;
  originalValues: string[];
  options: Array<{ label: string; value: string }>;
}

interface StepConflictsProps {
  conflicts: ConflictGroup[];
  manualMappings: ManualMapping;
  onManualMappingChange: (field: string, originalValue: string, mappedValue: string | null) => void;
  targetSchema: TargetField[];
  onCreateNew?: (field: string, name: string, originalValue: string) => void;
}

export function StepConflicts({
  conflicts,
  manualMappings,
  onManualMappingChange,
  targetSchema,
  onCreateNew,
}: StepConflictsProps) {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());

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

  const getResolvedCount = (conflict: ConflictGroup): number => {
    return conflict.originalValues.filter(value => {
      const key = `${conflict.field}_${value}`;
      return manualMappings[key] !== undefined;
    }).length;
  };

  const isFullyResolved = (conflict: ConflictGroup): boolean => {
    return getResolvedCount(conflict) === conflict.originalValues.length;
  };

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-green-500/10 p-4">
          <Check className="h-12 w-12 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">¡Sin conflictos!</p>
          <p className="text-muted-foreground">
            Todos los valores fueron mapeados automáticamente
          </p>
        </div>
      </div>
    );
  }

  const totalConflicts = conflicts.reduce((sum, c) => sum + c.originalValues.length, 0);
  const resolvedConflicts = conflicts.reduce((sum, c) => sum + getResolvedCount(c), 0);

  return (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Valores sin coincidencia automática</p>
                <p className="text-sm text-muted-foreground">
                  Asigna manualmente estos valores a opciones del sistema
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn(
              resolvedConflicts === totalConflicts && "border-green-500/50 text-green-500",
              resolvedConflicts < totalConflicts && "border-amber-500/50 text-amber-500"
            )}>
              {resolvedConflicts} / {totalConflicts} resueltos
            </Badge>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-4">
          {conflicts.map((conflict) => {
            const isExpanded = expandedConflicts.has(conflict.field) || !isFullyResolved(conflict);
            const searchTerm = searchTerms[conflict.field] || '';
            
            const filteredOptions = conflict.options.filter(opt => 
              opt.label.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <Card key={conflict.field} className={cn(
                "transition-colors",
                isFullyResolved(conflict) && "border-green-500/30 bg-green-500/5"
              )}>
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(conflict.field)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                      <div>
                        <CardTitle className="text-base">{conflict.fieldLabel}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {conflict.originalValues.length} valores por asignar
                        </p>
                      </div>
                    </div>
                    <Badge variant={isFullyResolved(conflict) ? "default" : "secondary"}>
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
                  <CardContent className="pt-0 pb-4 space-y-4">
                    {conflict.options.length > 10 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar opciones..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerms(prev => ({ ...prev, [conflict.field]: e.target.value }))}
                          className="pl-9"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {conflict.originalValues.map((originalValue) => {
                        const mappingKey = `${conflict.field}_${originalValue}`;
                        const currentMapping = manualMappings[mappingKey];
                        const isResolved = currentMapping !== undefined;
                        // When mapping is empty string, it means 'skip' was selected
                        const displayValue = currentMapping === '' ? 'skip' : (currentMapping ?? 'unresolved');

                        return (
                          <div 
                            key={originalValue}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border",
                              isResolved && "border-green-500/30 bg-green-500/5",
                              !isResolved && "border-amber-500/30 bg-amber-500/5"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <Badge variant="outline" className="font-mono text-xs">
                                {originalValue}
                              </Badge>
                            </div>

                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                            <div className="w-[200px] flex-shrink-0">
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
                                <SelectTrigger data-testid={`select-conflict-${conflict.field}-${originalValue}`}>
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
                        className="w-full"
                        onClick={() => {
                          const firstUnresolved = conflict.originalValues.find(v => 
                            manualMappings[`${conflict.field}_${v}`] === undefined
                          );
                          if (firstUnresolved) {
                            onCreateNew(conflict.field, firstUnresolved, firstUnresolved);
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear nuevo {conflict.fieldLabel.toLowerCase()}
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
