import { CheckCircle, FileText, Columns, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ParsedData, ColumnMapping, TargetField, ValidationError } from '../types';
interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warnings: number;
  errors: number;
  missingRequiredFields: string[];
  unmappedColumns: number[];
}
interface StepSummaryProps {
  parsedData: ParsedData;
  columnMapping: ColumnMapping;
  targetSchema: TargetField[];
  validationSummary: ValidationSummary;
  entityName: string;
  isImporting: boolean;
  importProgress?: number;
  onImport: () => void;
}
export function StepSummary({
  parsedData,
  columnMapping,
  targetSchema,
  validationSummary,
  entityName,
  isImporting,
  importProgress = 0,
  onImport,
}: StepSummaryProps) {
  const mappedColumns = Object.values(columnMapping).filter(Boolean).length;
  const canImport = validationSummary.missingRequiredFields.length === 0 && 
                    validationSummary.errors === 0 &&
                    validationSummary.validRows > 0;
  const getFieldLabel = (fieldName: string): string => {
    const field = targetSchema.find(f => f.field === fieldName);
    return field?.label || fieldName;
  };
  if (isImporting) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium">{importProgress}%</span>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Importando {entityName}...</p>
          <p className="text-muted-foreground">
            {Math.round(parsedData.totalRows * importProgress / 100)} de {parsedData.totalRows} registros
          </p>
        </div>
        <Progress value={importProgress} className="w-64" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card className={cn(
        canImport ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {canImport ? (
              <div className="rounded-full bg-green-500/20 p-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            ) : (
              <div className="rounded-full bg-amber-500/20 p-3">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            )}
            <div>
              <p className="text-lg font-medium">
                {canImport 
                  ? `¡Listo para importar ${validationSummary.validRows} ${entityName}!`
                  : 'Hay problemas que resolver antes de importar'
                }
              </p>
              <p className="text-muted-foreground">
                {canImport 
                  ? 'Revisa el resumen y confirma la importación'
                  : 'Vuelve a los pasos anteriores para corregir los errores'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Archivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium truncate max-w-[200px]">{parsedData.fileName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Formato</span>
              <Badge variant="outline">{parsedData.fileType.toUpperCase()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de filas</span>
              <span className="font-medium">{parsedData.totalRows}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Columnas</span>
              <span className="font-medium">{parsedData.headers.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Columns className="h-5 w-5" />
              Mapeo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Columnas mapeadas</span>
              <Badge variant="default">{mappedColumns} de {parsedData.headers.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Campos del sistema</span>
              <span className="font-medium">{targetSchema.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Campos requeridos</span>
              <span className={cn(
                "font-medium",
                validationSummary.missingRequiredFields.length > 0 && "text-destructive"
              )}>
                {targetSchema.filter(f => f.required).length - validationSummary.missingRequiredFields.length} / {targetSchema.filter(f => f.required).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen de validación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <p className="text-2xl font-bold text-green-500">{validationSummary.validRows}</p>
              <p className="text-sm text-muted-foreground">Válidas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10">
              <p className="text-2xl font-bold text-destructive">{validationSummary.invalidRows}</p>
              <p className="text-sm text-muted-foreground">Con errores</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10">
              <p className="text-2xl font-bold text-amber-500">{validationSummary.warnings}</p>
              <p className="text-sm text-muted-foreground">Advertencias</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{parsedData.totalRows}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          {validationSummary.missingRequiredFields.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm font-medium text-destructive mb-2">
                Campos obligatorios faltantes:
              </p>
              <div className="flex flex-wrap gap-2">
                {validationSummary.missingRequiredFields.map(field => (
                  <Badge key={field} variant="destructive">
                    {getFieldLabel(field)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={onImport}
          disabled={!canImport || isImporting}
          className="min-w-[200px]"
          data-testid="button-confirm-import"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Importar {validationSummary.validRows} {entityName}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
