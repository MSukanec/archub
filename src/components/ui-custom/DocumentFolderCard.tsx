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
  if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4" />;
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
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
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sort documents by version number (highest first)
  const sortedDocuments = [...documents].sort((a, b) => b.version_number - a.version_number);
  const latestDocument = sortedDocuments[0];
  const hasVersions = sortedDocuments.length > 1;

  const uploadNewVersionMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      // Calculate next version number
      const nextVersion = Math.max(...documents.map(d => d.version_number)) + 1;
      
      // Upload file to Supabase Storage
      const fileExtension = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('design-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get file URL
      const { data: { publicUrl } } = supabase.storage
        .from('design-documents')
        .getPublicUrl(fileName);

      // Save document metadata
      const { data, error } = await supabase
        .from('design_documents')
        .insert({
          file_name: latestDocument.file_name, // Keep same name
          description: latestDocument.description, // Keep same description
          file_path: fileName,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          version_number: nextVersion,
          project_id: projectId,
          organization_id: organizationId,
          design_phase_id: latestDocument.design_phase_id,
          folder: folder,
          status: 'pendiente',
          visibility: latestDocument.visibility,
          created_by: latestDocument.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-documents'] });
      toast({
        title: "Nueva versión agregada",
        description: `Se ha agregado la versión ${Math.max(...documents.map(d => d.version_number)) + 1} del documento.`,
      });
      setIsUploading(false);
    },
    onError: (error) => {
      console.error('Error uploading new version:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la nueva versión del documento.",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadNewVersionMutation.mutate(file);
    }
    // Reset input
    event.target.value = '';
  };

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
        <div className="border border-[var(--card-border)] rounded-lg p-4 bg-[var(--card-bg)]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {getFileIcon(latestDocument.file_type)}
              <div>
                <h4 className="font-semibold text-foreground">{latestDocument.file_name}</h4>
                {latestDocument.description && (
                  <p className="text-sm text-muted-foreground">{latestDocument.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">v{latestDocument.version_number}</Badge>
                  {getStatusBadge(latestDocument.status)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Update Version Button */}
              <div className="relative">
                <input
                  type="file"
                  id={`upload-${folder}`}
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById(`upload-${folder}`)?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Subiendo...' : 'Actualizar'}
                </Button>
              </div>
              
              {/* Download Button */}
              <Button
                size="sm"
                onClick={() => handleDownload(latestDocument)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>

          {/* Document metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {latestDocument.creator && (
                <>
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={latestDocument.creator.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {latestDocument.creator.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{latestDocument.creator.full_name}</span>
                </>
              )}
            </div>
            <span>{format(new Date(latestDocument.created_at), 'dd MMM yyyy', { locale: es })}</span>
          </div>
        </div>

        {/* Version History - Expandable */}
        {isExpanded && hasVersions && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Versiones Anteriores</h5>
            {sortedDocuments.slice(1).map((document) => (
              <div key={document.id} className="border border-[var(--card-border)] rounded-lg p-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(document.file_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{document.file_name}</span>
                        <Badge variant="secondary" className="text-xs">v{document.version_number}</Badge>
                        {getStatusBadge(document.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{format(new Date(document.created_at), 'dd MMM yyyy', { locale: es })}</span>
                        {document.creator && <span>{document.creator.full_name}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}