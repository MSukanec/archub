import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, ChevronDown, Edit3, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ValidationError, TargetField, ParsedData, ColumnMapping } from '../types';

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
  parsedData?: ParsedData | null;
  columnMapping?: ColumnMapping;
  cellCorrections?: Record<string, string>;
  onCellCorrectionChange?: (rowIndex: number, field: string, value: string) => void;
}

export function StepValidation({
  errors,
  summary,
  targetSchema,
  onResolveError,
  parsedData,
  columnMapping,
  cellCorrections = {},
  onCellCorrectionChange,
}: StepValidationProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

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

  // Detectar errores de celdas vacías en campos editables (date, number, currency, string)
  const emptyCellErrors = useMemo(() => {
    return errors.filter(e => {
      const isEmpty = e.value === null || e.value === undefined || String(e.value).trim() === '';
      const fieldConfig = targetSchema.find(f => f.field === e.field);
      const isEditableType = fieldConfig && ['date', 'number', 'currency', 'string'].includes(fieldConfig.type);
      return isEmpty && isEditableType && e.severity === 'error';
    });
  }, [errors, targetSchema]);

  // Agrupar errores de celdas vacías por fila
  const rowsWithEmptyCells = useMemo(() => {
    const rows: Record<number, ValidationError[]> = {};
    for (const error of emptyCellErrors) {
      if (!rows[error.row]) rows[error.row] = [];
      rows[error.row].push(error);
    }
    return rows;
  }, [emptyCellErrors]);

  const hasEditableErrors = Object.keys(rowsWithEmptyCells).length > 0;

  const handleStartEdit = (rowIndex: number, field: string) => {
    // Use || as separator since field names contain underscores
    const key = `${rowIndex}||${field}`;
    const currentValue = cellCorrections[key] || '';
    setEditValue(currentValue);
    setEditingCell({ row: rowIndex, field });
  };

  const handleSaveEdit = () => {
    if (editingCell && onCellCorrectionChange) {
      onCellCorrectionChange(editingCell.row, editingCell.field, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getCorrectedValue = (rowIndex: number, field: string): string | null => {
    // Use || as separator since field names contain underscores
    const key = `${rowIndex}||${field}`;
    return cellCorrections[key] || null;
  };

  const getOriginalValue = (rowIndex: number, colIndex: number): string => {
    if (!parsedData || rowIndex >= parsedData.rows.length) return '';
    const value = parsedData.rows[rowIndex][colIndex];
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const getColumnIndexForField = (field: string): number => {
    if (!columnMapping) return -1;
    for (const [colIndex, mappedField] of Object.entries(columnMapping)) {
      if (mappedField === field) return parseInt(colIndex);
    }
    return -1;
  };

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

      {/* Editor de celdas vacías - muestra todas las columnas para contexto */}
      {hasEditableErrors && parsedData && columnMapping && onCellCorrectionChange && (() => {
        // Obtener todas las columnas mapeadas para mostrar contexto
        const mappedColumns = Object.entries(columnMapping)
          .filter(([_, field]) => field)
          .map(([colIndex, field]) => ({ colIndex: parseInt(colIndex), field: field! }))
          .sort((a, b) => a.colIndex - b.colIndex);
        
        // Obtener los campos que tienen errores para esta fila
        const errorFields = new Set(emptyCellErrors.map(e => e.field));
        
        return (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-500 text-base">
                <Edit3 className="h-5 w-5" />
                Completar datos faltantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Algunas filas tienen celdas vacías en campos obligatorios. Hacé clic en las celdas rojas para completarlas:
              </p>
              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 sticky left-0 bg-background">#</TableHead>
                      {mappedColumns.map(({ field }) => (
                        <TableHead 
                          key={field} 
                          className={cn(
                            errorFields.has(field) && "text-destructive font-medium"
                          )}
                        >
                          {getFieldLabel(field)}
                          {errorFields.has(field) && <span className="ml-1 text-xs">*</span>}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(rowsWithEmptyCells).map(([rowIndexStr, rowErrors]) => {
                      const rowIndex = parseInt(rowIndexStr);
                      const rowErrorFields = new Set(rowErrors.map(e => e.field));
                      
                      return (
                        <TableRow key={rowIndex}>
                          <TableCell className="font-medium text-muted-foreground sticky left-0 bg-background">
                            {rowIndex + 1}
                          </TableCell>
                          {mappedColumns.map(({ colIndex, field }) => {
                            const hasError = rowErrorFields.has(field);
                            const correctedValue = getCorrectedValue(rowIndex, field);
                            const isEditing = editingCell?.row === rowIndex && editingCell?.field === field;
                            const originalValue = getOriginalValue(rowIndex, colIndex);
                            
                            // Si es celda con error, mostrar editor
                            if (hasError) {
                              if (isEditing) {
                                return (
                                  <TableCell key={field} className="p-1">
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-8 text-sm min-w-[100px]"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveEdit();
                                          if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        data-testid={`input-cell-${rowIndex}-${field}`}
                                      />
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-green-500 hover:text-green-600 shrink-0"
                                        onClick={handleSaveEdit}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={handleCancelEdit}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                );
                              }
                              
                              return (
                                <TableCell 
                                  key={field}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    correctedValue 
                                      ? "bg-green-500/10 hover:bg-green-500/20" 
                                      : "bg-destructive/10 hover:bg-destructive/20"
                                  )}
                                  onClick={() => handleStartEdit(rowIndex, field)}
                                  data-testid={`cell-${rowIndex}-${field}`}
                                >
                                  {correctedValue ? (
                                    <span className="text-green-600 font-medium">{correctedValue}</span>
                                  ) : (
                                    <span className="text-destructive/60 italic text-sm">
                                      (vacío)
                                    </span>
                                  )}
                                </TableCell>
                              );
                            }
                            
                            // Celda normal sin error - solo mostrar el valor
                            return (
                              <TableCell key={field} className="text-muted-foreground">
                                {originalValue || '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-3">
                Las celdas en verde ya fueron completadas. Las rojas aún necesitan un valor. Las demás columnas muestran contexto.
              </p>
            </CardContent>
          </Card>
        );
      })()}

      <ScrollArea className="h-[300px]">
        <div className="space-y-3 pr-4">
          {Object.entries(errorsByField).map(([field, fieldErrors]) => {
            const fieldLabel = getFieldLabel(field);
            const hasErrors = fieldErrors.some(e => e.severity === 'error');
            const hasWarnings = fieldErrors.some(e => e.severity === 'warning');
            
            // Filtrar errores que ya fueron corregidos con cellCorrections
            const uncorrectedErrors = fieldErrors.filter(e => {
              // Use || as separator since field names contain underscores
              const key = `${e.row}||${e.field}`;
              return !cellCorrections[key];
            });

            // Si todos los errores de este campo fueron corregidos, no mostrar
            if (uncorrectedErrors.length === 0) return null;
            
            const uniqueValues = Array.from(new Set(uncorrectedErrors.map(e => String(e.value)))).slice(0, 5);

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
                              {uncorrectedErrors.length} {uncorrectedErrors.length === 1 ? 'fila afectada' : 'filas afectadas'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {hasErrors && (
                              <Badge variant="destructive" className="text-xs">
                                {uncorrectedErrors.filter(e => e.severity === 'error').length} errores
                              </Badge>
                            )}
                            {hasWarnings && (
                              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                                {uncorrectedErrors.filter(e => e.severity === 'warning').length} advertencias
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
                              {value === 'null' || value === 'undefined' || value === '' ? '(vacío)' : value}
                            </Badge>
                          ))}
                          {Array.from(new Set(uncorrectedErrors.map(e => String(e.value)))).length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{Array.from(new Set(uncorrectedErrors.map(e => String(e.value)))).length - 5} más
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {hasWarnings && !hasErrors 
                            ? "Podrás asignar estos valores en el siguiente paso"
                            : uncorrectedErrors[0]?.message
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
