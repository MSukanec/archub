import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

import { 
  FolderOpen,
  Download, 
  Upload,
  History,
  MoreVertical,
  FileText,
  FileImage,
  File,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DesignDocument {
  id: string;
  file_name: string;
  description?: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  version_number: number;
  project_id: string;
  organization_id: string;
  design_phase_id?: string;
  folder: string;
  status: string;
  visibility?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  creator?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

interface DocumentFolderCardProps {
  folder: string;
  documents: DesignDocument[];
  projectId: string;
  organizationId: string;
  onEdit?: (document: DesignDocument) => void;
  onDelete?: (document: DesignDocument) => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  } else if (fileType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  } else {
    return <File className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pendiente: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', label: 'Pendiente' },
    en_revision: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: 'En Revisión' },
    aprobado: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Aprobado' },
    rechazado: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', label: 'Rechazado' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
  return <Badge className={config.color}>{config.label}</Badge>;
};

export function DocumentFolderCard({ 
  folder, 
  documents, 
  projectId, 
  organizationId, 
  onEdit, 
  onDelete 
}: DocumentFolderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sort documents by version number (highest first)
  const sortedDocuments = [...documents].sort((a, b) => b.version_number - a.version_number);
  const latestDocument = sortedDocuments[0];
  const hasVersions = sortedDocuments.length > 1;

  const handleDownload = (document: DesignDocument) => {
    const link = document.createElement('a');
    link.href = document.file_url;
    link.download = `${document.file_name}_v${document.version_number}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg font-semibold">{folder}</CardTitle>
            <Badge variant="outline">{documents.length} archivo{documents.length !== 1 ? 's' : ''}</Badge>
          </div>
          
          {hasVersions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Ver Historial
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latest Version - Always Visible */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {getFileIcon(latestDocument.file_type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{latestDocument.file_name}</h4>
                  <Badge variant="default" className="text-xs">v{latestDocument.version_number}</Badge>
                  {getStatusBadge(latestDocument.status)}
                </div>
                
                {latestDocument.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {latestDocument.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{format(new Date(latestDocument.created_at), 'dd MMM yyyy', { locale: es })}</span>
                  {latestDocument.creator && (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={latestDocument.creator.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {latestDocument.creator.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[80px]">{latestDocument.creator.full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Update Version Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUpdateModal(true)}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              
              {/* Download Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(latestDocument)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              
              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(latestDocument)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(latestDocument)}
                    className="text-destructive"
                  >
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Version History - Expandable */}
        {hasVersions && isExpanded && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Versiones anteriores</h5>
            {sortedDocuments.slice(1).map((document) => (
              <div key={document.id} className="p-3 border rounded-lg bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(document.file_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{document.file_name}</span>
                        <Badge variant="outline" className="text-xs">v{document.version_number}</Badge>
                        {getStatusBadge(document.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{format(new Date(document.created_at), 'dd MMM yyyy', { locale: es })}</span>
                        {document.creator && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={document.creator.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {document.creator.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[80px]">{document.creator.full_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(document)}
                    className="ml-2"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Update Version Modal - TO BE IMPLEMENTED */}
    </Card>
  );
}