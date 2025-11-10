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
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDeleteDesignDocument } from '@/hooks/use-design-documents';

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
  const { openModal } = useGlobalModalStore();
  const deleteDocumentMutation = useDeleteDesignDocument();
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
      case 'aprobado': return 'green';
      case 'pendiente': return 'yellow';
      case 'en_revision': return 'blue';
      case 'rechazado': return 'red';
      default: return 'gray';
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
          <h3 className="font-medium text-sm mb-1" title={document.file_name}>
            {document.file_name}
          </h3>
          {document.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {document.description}
            </p>
          )}
        </div>

        <Separator />

        {/* Document Details - All with same spacing */}
        <div className="space-y-2">
          {/* File Type */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tipo:</span>
            <span className="text-xs">
              {document.file_type || 'Desconocido'}
            </span>
          </div>

          {/* File Name (original) */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Nombre:</span>
            <span className="text-xs flex-1 text-right ml-2" title={document.original_name || document.file_name}>
              {document.original_name || document.file_name}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Estado:</span>
            <span className="text-xs">
              {getStatusText(document.status)}
            </span>
          </div>

          {/* File Size */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tamaño:</span>
            <span className="text-xs">{formatFileSize(document.file_size)}</span>
          </div>

          {/* Created Date */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Creado:</span>
            <span className="text-xs">
              {format(new Date(document.created_at), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>

          {/* Creator */}
          {document.creator && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Creador:</span>
              <span className="text-xs flex-1 text-right ml-2" title={document.creator.user?.full_name}>
                {document.creator.user?.full_name || 'Usuario'}
              </span>
            </div>
          )}

          {/* Version if available */}
          {document.version && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Versión:</span>
              <span className="text-xs">v{document.version}</span>
            </div>
          )}

          {/* Folder path if available */}
          {document.folder && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Carpeta:</span>
              <span className="text-xs flex-1 text-right ml-2" title={document.folder.name}>
                {document.folder.name}
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
            className=""
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onShare}
            className=""
            title="Compartir"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              console.log('Opening document edit modal');
              openModal('document-upload', { 
                mode: 'edit',
                documentId: document.id,
                folderId: document.folder_id 
              });
            }}
            className=""
            title="Editar"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              console.log('Opening delete confirmation modal');
              openModal('delete-confirmation', {
                mode: 'simple',
                title: 'Eliminar documento',
                description: `¿Estás seguro de que quieres eliminar "${document.file_name}"? Esta acción no se puede deshacer.`,
                itemName: document.file_name,
                itemType: 'documento',
                onConfirm: async () => {
                  try {
                    console.log('Deleting document:', document.id);
                    await deleteDocumentMutation.mutateAsync(document.id);
                    console.log('Document deleted successfully');
                  } catch (error) {
                    console.error('Error deleting document:', error);
                  }
                }
              });
            }}
            className=" text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}