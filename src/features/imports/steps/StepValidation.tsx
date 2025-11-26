import { useMemo } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ValidationError, TargetField } from '../types';

interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warnings: number;
  errors: number;
  missingRequiredFields: string[];
  unmappedColumns: number[];
}

interface StepValidationProps {
  errors: ValidationError[];
  summary: ValidationSummary;
  targetSchema: TargetField[];
  onResolveError?: (error: ValidationError) => void;
}

export function StepValidation({
  errors,
  summary,
  targetSchema,
  onResolveError,
}: StepValidationProps) {
  const getFieldLabel = (fieldName: string): string => {
    const field = targetSchema.find(f => f.field === fieldName);
    return field?.label || fieldName;
  };

  const errorsByField = useMemo(() => {
    const grouped: Record<string, ValidationError[]> = {};
    
    for (const error of errors) {
      const key = error.field;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(error);
    }
    
    return grouped;
  }, [errors]);

  const criticalErrors = useMemo(() => {
    return errors.filter(e => e.severity === 'error');
  }, [errors]);

  const warnings = useMemo(() => {
    return errors.filter(e => e.severity === 'warning');
  }, [errors]);

  if (errors.length === 0 && summary.missingRequiredFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-green-500/10 p-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">¡Todos los datos son válidos!</p>
          <p className="text-muted-foreground">
            {summary.totalRows} filas listas para importar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{summary.validRows}</p>
            <p className="text-sm text-muted-foreground">Filas válidas</p>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{summary.invalidRows}</p>
            <p className="text-sm text-muted-foreground">Filas con errores</p>
          </CardContent>
        </Card>
        
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{summary.warnings}</p>
            <p className="text-sm text-muted-foreground">Advertencias</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.totalRows}</p>
            <p className="text-sm text-muted-foreground">Total filas</p>
          </CardContent>
        </Card>
      </div>

      {summary.missingRequiredFields.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <XCircle className="h-5 w-5" />
              Campos obligatorios sin mapear
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.missingRequiredFields.map(field => (
                <Badge key={field} variant="destructive">
                  {getFieldLabel(field)}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Vuelve al paso anterior y asigna estos campos para continuar.
            </p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[350px]">
        <div className="space-y-3 pr-4">
          {Object.entries(errorsByField).map(([field, fieldErrors]) => {
            const fieldLabel = getFieldLabel(field);
            const hasErrors = fieldErrors.some(e => e.severity === 'error');
            const hasWarnings = fieldErrors.some(e => e.severity === 'warning');
            
            const uniqueValues = Array.from(new Set(fieldErrors.map(e => String(e.value)))).slice(0, 5);

            return (
              <Collapsible key={field}>
                <Card className={cn(
                  hasErrors && "border-destructive/30",
                  !hasErrors && hasWarnings && "border-amber-500/30"
                )}>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {hasErrors ? (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          )}
                          <div className="text-left">
                            <p className="font-medium">{fieldLabel}</p>
                            <p className="text-sm text-muted-foreground">
                              {fieldErrors.length} {fieldErrors.length === 1 ? 'fila afectada' : 'filas afectadas'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {hasErrors && (
                              <Badge variant="destructive" className="text-xs">
                                {fieldErrors.filter(e => e.severity === 'error').length} errores
                              </Badge>
                            )}
                            {hasWarnings && (
                              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                                {fieldErrors.filter(e => e.severity === 'warning').length} advertencias
                              </Badge>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-2 pl-8">
                        <p className="text-sm font-medium text-muted-foreground">Valores problemáticos:</p>
                        <div className="flex flex-wrap gap-2">
                          {uniqueValues.map((value, idx) => (
                            <Badge key={idx} variant="outline" className="font-mono text-xs">
                              {value || '(vacío)'}
                            </Badge>
                          ))}
                          {Array.from(new Set(fieldErrors.map(e => String(e.value)))).length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{Array.from(new Set(fieldErrors.map(e => String(e.value)))).length - 5} más
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {hasWarnings && !hasErrors 
                            ? "Podrás asignar estos valores en el siguiente paso"
                            : fieldErrors[0].message
                          }
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
