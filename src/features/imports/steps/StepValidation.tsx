import { useMemo, useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, ChevronDown, Edit3, Check, X, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ValidationError, TargetField, ParsedData, ColumnMapping } from '../types';
/**
 * Masked Date Input - Format: DD/MM/AAAA
 * Only allows numbers, slashes are fixed
 */
interface MaskedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  autoFocus?: boolean;
  className?: string;
}
function MaskedDateInput({ value, onChange, onSave, onCancel, autoFocus, className }: MaskedDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Convert DD/MM/YYYY to just digits for internal state
  const getDigitsFromValue = (val: string): string => {
    return val.replace(/\D/g, '').slice(0, 8);
  };
  
  // Format digits to DD/MM/YYYY display
  const formatToDisplay = (digits: string): string => {
    if (digits.length === 0) return '';
    
    let result = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) result += '/';
      result += digits[i];
    }
    return result;
  };
  
  const [digits, setDigits] = useState(() => getDigitsFromValue(value));
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Update parent when digits change
  useEffect(() => {
    const formatted = formatToDisplay(digits);
    if (formatted !== value) {
      onChange(formatted);
    }
  }, [digits, onChange, value]);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (e.key === 'Backspace') {
      e.preventDefault();
      setDigits(prev => prev.slice(0, -1));
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
      return;
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }
    
    // Block non-numeric keys (except navigation)
    if (!/^\d$/.test(e.key) && !['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Add digit if under limit
    if (/^\d$/.test(e.key) && digits.length < 8) {
      e.preventDefault();
      setDigits(prev => prev + e.key);
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Extract only digits from pasted or changed content
    const newDigits = e.target.value.replace(/\D/g, '').slice(0, 8);
    setDigits(newDigits);
  };
  
  const displayValue = formatToDisplay(digits);
  const placeholder = 'DD/MM/AAAA'.slice(displayValue.length);
  
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center h-8 px-2 rounded border border-input bg-background font-mono text-sm">
        <span>{displayValue}</span>
        <span className="text-muted-foreground/40">{placeholder}</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
          data-testid="masked-date-input"
        />
      </div>
    </div>
  );
}
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
  // Detectar errores de celdas vacías ORIGINALES en campos editables
  // Esto se basa en parsedData y columnMapping, NO en errors (que cambia con correcciones)
  const originalEmptyCellErrors = useMemo(() => {
    if (!parsedData || !columnMapping) return [];
    
    const emptyErrors: ValidationError[] = [];
    
    for (let rowIndex = 0; rowIndex < parsedData.rows.length; rowIndex++) {
      const row = parsedData.rows[rowIndex];
      
      for (const [colIndexStr, field] of Object.entries(columnMapping)) {
        if (!field) continue;
        
        const colIndex = parseInt(colIndexStr);
        const value = row[colIndex];
        const isEmpty = value === null || value === undefined || String(value).trim() === '';
        
        if (isEmpty) {
          const fieldConfig = targetSchema.find(f => f.field === field);
          const isEditableType = fieldConfig && ['date', 'number', 'currency', 'string'].includes(fieldConfig.type);
          const isRequired = fieldConfig?.required;
          
          if (isEditableType && isRequired) {
            emptyErrors.push({
              row: rowIndex,
              column: field,
              field,
              message: `Campo "${fieldConfig?.label || field}" está vacío`,
              value: null,
              severity: 'error',
            });
          }
        }
      }
    }
    
    return emptyErrors;
  }, [parsedData, columnMapping, targetSchema]);
  // Detectar errores de celdas vacías en campos editables (para contador de errores)
  const emptyCellErrors = useMemo(() => {
    return errors.filter(e => {
      const isEmpty = e.value === null || e.value === undefined || String(e.value).trim() === '';
      const fieldConfig = targetSchema.find(f => f.field === e.field);
      const isEditableType = fieldConfig && ['date', 'number', 'currency', 'string'].includes(fieldConfig.type);
      return isEmpty && isEditableType && e.severity === 'error';
    });
  }, [errors, targetSchema]);
  // Agrupar errores ORIGINALES de celdas vacías por fila (para mostrar en tabla)
  const rowsWithEmptyCells = useMemo(() => {
    const rows: Record<number, ValidationError[]> = {};
    for (const error of originalEmptyCellErrors) {
      if (!rows[error.row]) rows[error.row] = [];
      rows[error.row].push(error);
    }
    return rows;
  }, [originalEmptyCellErrors]);
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
  const formatDisplayValue = (value: unknown, field: string): string => {
    if (value === null || value === undefined) return '';
    const strValue = String(value);
    if (!strValue.trim()) return '';
    
    const fieldConfig = targetSchema.find(f => f.field === field);
    
    if (fieldConfig?.type === 'date') {
      try {
        let dateObj: Date;
        if (value instanceof Date) {
          dateObj = value;
        } else if (typeof value === 'string') {
          dateObj = new Date(value);
          if (!isValid(dateObj)) {
            dateObj = parseISO(value);
          }
        } else {
          return strValue;
        }
        
        if (isValid(dateObj)) {
          return format(dateObj, 'dd/MM/yyyy', { locale: es });
        }
      } catch {
        return strValue;
      }
    }
    
    if (fieldConfig?.type === 'currency'|| fieldConfig?.type === 'number') {
      const num = parseFloat(strValue);
      if (!isNaN(num)) {
        return num.toLocaleString('es-AR');
      }
    }
    
    return strValue;
  };
  const getOriginalValue = (rowIndex: number, colIndex: number): string => {
    if (!parsedData || rowIndex >= parsedData.rows.length) return '';
    const value = parsedData.rows[rowIndex][colIndex];
    if (value === null || value === undefined) return '';
    return String(value);
  };
  const getFormattedOriginalValue = (rowIndex: number, colIndex: number, field: string): string => {
    if (!parsedData || rowIndex >= parsedData.rows.length) return '';
    const value = parsedData.rows[rowIndex][colIndex];
    return formatDisplayValue(value, field);
  };
  const getColumnIndexForField = (field: string): number => {
    if (!columnMapping) return -1;
    for (const [colIndex, mappedField] of Object.entries(columnMapping)) {
      if (mappedField === field) return parseInt(colIndex);
    }
    return -1;
  };
  const originalRowsWithErrors = useMemo(() => {
    const rows = new Set<number>();
    for (const error of originalEmptyCellErrors) {
      rows.add(error.row);
    }
    return Array.from(rows).sort((a, b) => a - b);
  }, [originalEmptyCellErrors]);
  const getOriginalErrorsForRow = (rowIndex: number): ValidationError[] => {
    return originalEmptyCellErrors.filter(e => e.row === rowIndex);
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
      {/* Mostrar mientras haya filas que originalmente tenían errores, aunque ya estén corregidas */}
      {originalRowsWithErrors.length > 0 && parsedData && columnMapping && onCellCorrectionChange && (() => {
        const mappedColumns = Object.entries(columnMapping)
          .filter(([_, field]) => field)
          .map(([colIndex, field]) => ({ colIndex: parseInt(colIndex), field: field! }))
          .sort((a, b) => a.colIndex - b.colIndex);
        
        const errorFields = new Set(originalEmptyCellErrors.map(e => e.field));
        
        // Contar cuántas correcciones se han hecho
        const totalErrorCells = originalEmptyCellErrors.length;
        const correctedCount = originalEmptyCellErrors.filter(e => {
          const key = `${e.row}||${e.field}`;
          return cellCorrections[key];
        }).length;
        const allCorrected = correctedCount === totalErrorCells;
        
        return (
          <Card className={cn(
            "border-blue-500/30 bg-blue-500/5",
            allCorrected && "border-green-500/30 bg-green-500/5"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(
                "flex items-center gap-2 text-base",
                allCorrected ? "text-green-500" : "text-blue-500"
              )}>
                {allCorrected ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Datos completados
                  </>
                ) : (
                  <>
                    <Edit3 className="h-5 w-5" />
                    Completar datos faltantes
                  </>
                )}
                <Badge variant="outline" className={cn(
                  "ml-auto",
                  allCorrected ? "border-green-500/50 text-green-500" : "border-blue-500/50 text-blue-500"
                )}>
                  {correctedCount} / {totalErrorCells}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {allCorrected 
                  ? "Todos los datos faltantes han sido completados. Podés continuar o editar los valores:"
                  : "Algunas filas tienen celdas vacías en campos obligatorios. Hacé clic en las celdas marcadas para completarlas:"
                }
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
                    {originalRowsWithErrors.map((rowIndex) => {
                      const rowErrors = getOriginalErrorsForRow(rowIndex);
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
                            const formattedValue = getFormattedOriginalValue(rowIndex, colIndex, field);
                            
                            if (hasError) {
                              const fieldConfig = targetSchema.find(f => f.field === field);
                              const isDateField = fieldConfig?.type === 'date';
                              
                              if (isEditing) {
                                return (
                                  <TableCell key={field} className="p-1">
                                    <div className="flex items-center gap-1">
                                      {isDateField ? (
                                        <MaskedDateInput
                                          value={editValue}
                                          onChange={setEditValue}
                                          onSave={handleSaveEdit}
                                          onCancel={handleCancelEdit}
                                          autoFocus
                                          className="min-w-[120px]"
                                        />
                                      ) : (
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
                                      )}
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
                                  className="p-1"
                                  data-testid={`cell-${rowIndex}-${field}`}
                                >
                                  <div
                                    onClick={() => handleStartEdit(rowIndex, field)}
                                    className={cn(
                                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all",
                                      "border-2 border-dashed",
                                      correctedValue 
                                        ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20" 
                                        : "border-destructive/50 bg-destructive/5 hover:bg-destructive/10 hover:border-destructive"
                                    )}
                                  >
                                    {correctedValue ? (
                                      <>
                                        <span className="text-green-600 font-medium flex-1">{correctedValue}</span>
                                        <Pencil className="h-3 w-3 text-green-500/60" />
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-destructive/70 text-sm flex-1">Completar</span>
                                        <Pencil className="h-3 w-3 text-destructive/60" />
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              );
                            }
                            
                            return (
                              <TableCell key={field} className="text-muted-foreground">
                                {formattedValue || '-'}
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
                Las celdas en verde ya fueron completadas. Las celdas con borde rojo aún necesitan un valor.
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
                              {uncorrectedErrors.length} {uncorrectedErrors.length === 1 ? 'fila afectada': 'filas afectadas'}
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
                              {value === 'null'|| value === 'undefined'|| value === ''? '(vacío)': value}
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
