import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Share2, 
  Edit3, 
  Trash2, 
  FileText, 
  Calendar,
  User,
  HardDrive,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DocumentInfoProps {
  document?: any;
  onDownload?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DocumentInfo({ 
  document, 
  onDownload, 
  onShare, 
  onEdit, 
  onDelete 
}: DocumentInfoProps) {
  if (!document) {
    return (
      <Card className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[var(--accent)]" />
            <div className="flex-1">
              <h2 className="text-sm font-medium text-[var(--card-fg)]">Información del Documento</h2>
              <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                Selecciona un documento para ver su información
              </p>
            </div>
          </div>
        </div>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Selecciona un documento para ver su información
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'aprobado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'en_revision': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rechazado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'aprobado': return 'Aprobado';
      case 'pendiente': return 'Pendiente';
      case 'en_revision': return 'En Revisión';
      case 'rechazado': return 'Rechazado';
      default: return 'Sin estado';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-[var(--accent)]" />
          <div className="flex-1">
            <h2 className="text-sm font-medium text-[var(--card-fg)]">Información del Documento</h2>
            <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
              Detalles y propiedades del archivo seleccionado
            </p>
          </div>
        </div>
      </div>
      <CardContent className="flex-1 space-y-4 pt-6">
        {/* Document Name */}
        <div>
          <h3 className="font-medium text-sm mb-1 truncate" title={document.file_name}>
            {document.file_name}
          </h3>
          {document.description && (
            <p className="text-xs text-muted-foreground">
              {document.description}
            </p>
          )}
        </div>

        <Separator />

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Estado:</span>
          <Badge className={`text-xs ${getStatusColor(document.status)}`}>
            {getStatusText(document.status)}
          </Badge>
        </div>

        {/* File Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              Tamaño:
            </span>
            <span className="text-xs">{formatFileSize(document.file_size)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Creado:
            </span>
            <span className="text-xs">
              {format(new Date(document.created_at), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>

          {document.creator && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Creador:
              </span>
              <span className="text-xs truncate max-w-24" title={document.creator.user?.full_name}>
                {document.creator.user?.full_name || 'Usuario'}
              </span>
            </div>
          )}
        </div>

      </CardContent>
      
      {/* Footer with Action Buttons */}
      <div className="px-4 py-3 border-t border-[var(--card-border)]">
        <div className="flex items-center justify-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDownload}
            className="h-8 w-8 p-0"
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onShare}
            className="h-8 w-8 p-0"
            title="Compartir"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onEdit}
            className="h-8 w-8 p-0"
            title="Editar"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}