import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ParsedData } from '../types';

interface StepPreviewProps {
  parsedData: ParsedData | null;
  isLoading: boolean;
  error: string | null;
  onFileSelect: (file: File) => void;
  onReset: () => void;
  maxPreviewRows?: number;
}

export function StepPreview({
  parsedData,
  isLoading,
  error,
  onFileSelect,
  onReset,
  maxPreviewRows = 20,
}: StepPreviewProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const formatCellValue = (cell: any): string => {
    if (cell === null || cell === undefined) return '-';
    
    if (cell instanceof Date) {
      return isValid(cell) ? format(cell, 'dd/MM/yyyy', { locale: es }) : String(cell);
    }
    
    if (typeof cell === 'number' && cell > 1000000000 && cell < 2000000000000) {
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Procesando archivo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <p className="font-medium text-destructive">Error al procesar el archivo</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={onReset}>
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  if (!parsedData) {
    return (
      <div className="space-y-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input {...getInputProps()} data-testid="input-file-upload" />
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="font-medium">
                {isDragActive ? "Suelta el archivo aquí" : "Haz clic o arrastra un archivo"}
              </p>
              <p className="text-sm text-muted-foreground">
                Formatos soportados: .xlsx, .xls, .csv (máximo 50MB)
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50">
          <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            El archivo debe tener una fila de encabezados en la primera línea
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{parsedData.fileName}</p>
            <p className="text-sm text-muted-foreground">
              {parsedData.totalRows} filas • {parsedData.headers.length} columnas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Archivo válido
          </Badge>
          <Button variant="ghost" size="icon" onClick={onReset}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center font-bold">#</TableHead>
                {parsedData.headers.map((header, index) => (
                  <TableHead key={index} className="min-w-[120px] font-semibold">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedData.rows.slice(0, maxPreviewRows).map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="text-center text-muted-foreground font-mono text-xs">
                    {rowIndex + 1}
                  </TableCell>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="max-w-[200px] truncate">
                      {formatCellValue(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {parsedData.totalRows > maxPreviewRows && (
          <div className="p-3 text-center text-sm text-muted-foreground border-t bg-muted/30">
            Mostrando {maxPreviewRows} de {parsedData.totalRows} filas
          </div>
        )}
      </div>
    </div>
  );
}
