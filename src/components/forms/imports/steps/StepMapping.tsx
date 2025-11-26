import { useMemo } from 'react';
import { ArrowRight, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ParsedData, ColumnMapping, TargetField } from '../types';

interface StepMappingProps {
  parsedData: ParsedData;
  targetSchema: TargetField[];
  columnMapping: ColumnMapping;
  onMappingChange: (columnIndex: number, field: string | null) => void;
  getSuggestions?: (headerIndex: number) => Array<{ field: string; label: string; similarity: number }>;
}

export function StepMapping({
  parsedData,
  targetSchema,
  columnMapping,
  onMappingChange,
  getSuggestions,
}: StepMappingProps) {
  const mappedFields = useMemo(() => {
    return new Set(Object.values(columnMapping).filter(Boolean) as string[]);
  }, [columnMapping]);

  const requiredFields = useMemo(() => {
    return targetSchema.filter(f => f.required);
  }, [targetSchema]);

  const missingRequiredFields = useMemo(() => {
    return requiredFields.filter(f => !mappedFields.has(f.field));
  }, [requiredFields, mappedFields]);

  const getMappingStatus = (columnIndex: number): 'mapped' | 'unmapped' | 'required-missing' => {
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

  return (
    <div className="space-y-6">
      {missingRequiredFields.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-amber-500">Campos obligatorios sin asignar</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missingRequiredFields.map(field => (
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
                  status === 'mapped' && "border-green-500/30 bg-green-500/5",
                  status === 'unmapped' && "border-muted"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{header}</p>
                        {status === 'mapped' && (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      {sampleValues.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Ej: {sampleValues.join(', ')}
                        </p>
                      )}
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                    <div className="w-[220px] flex-shrink-0">
                      <Select
                        value={mappedField || 'no-mapping'}
                        onValueChange={(value) => onMappingChange(index, value === 'no-mapping' ? null : value)}
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
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[250px]">
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
