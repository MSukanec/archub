import React, { useState, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Layout } from '@/components/layout/desktop/Layout';
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { useMobile } from '@/hooks/use-mobile';
import { NewDesignDocumentModal } from '@/modals/design/NewDesignDocumentModal';
import { 
  FileText, 
  FolderOpen,
  Calendar,
  Download, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Upload,
  FileImage,
  File,
  FileSpreadsheet
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

export default function DesignDocumentation() {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setActions, setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();
  
  // Modal states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DesignDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DesignDocument | null>(null);
  
  // View state
  const [viewByPhase, setViewByPhase] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Documents query
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['designDocuments', projectId],
    queryFn: async () => {
      console.log('Fetching design documents for project:', projectId);
      
      if (!supabase || !projectId) {
        throw new Error('Supabase client not initialized or no project selected');
      }

      // Get all documents for the project with creator information
      const { data, error } = await supabase
        .from('design_documents')
        .select(`
          *,
          creator:created_by (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching design documents:', error);
        throw error;
      }

      // Filter to get only the latest version of each document (grouped by name + folder + design_phase_id)
      const latestDocuments = new Map<string, DesignDocument>();
      
      if (data) {
        data.forEach((doc: DesignDocument) => {
          const groupKey = `${doc.file_name}-${doc.folder}-${doc.design_phase_id || 'null'}`;
          const existing = latestDocuments.get(groupKey);
          
          if (!existing || doc.version_number > existing.version_number || 
              (doc.version_number === existing.version_number && new Date(doc.created_at) > new Date(existing.created_at))) {
            latestDocuments.set(groupKey, doc);
          }
        });
      }

      const filteredDocuments = Array.from(latestDocuments.values());
      console.log('Design documents data received:', filteredDocuments);
      
      return filteredDocuments;

      console.log('Design documents data received:', data);
      return data as DesignDocument[];
    },
    enabled: !!projectId && !!supabase,
  });

  // Design phases query for grouping
  const { data: designPhases = [] } = useQuery({
    queryKey: ['designProjectPhases', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return [];

      const { data, error } = await supabase
        .from('design_project_phases')
        .select(`
          *,
          design_phases (
            id,
            name
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching design phases:', error);
        return [];
      }

      return data;
    },
    enabled: !!projectId && !!organizationId && !!supabase,
  });

  // Delete mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('design_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designDocuments'] });
      toast({
        title: 'Documento eliminado',
        description: 'El documento ha sido eliminado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el documento.',
        variant: 'destructive',
      });
    },
  });

  // Filter documents based on search
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc =>
      (doc.file_name && doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [documents, searchTerm]);

  // Group documents
  const groupedDocuments = useMemo(() => {
    // Group by folder (phase functionality to be implemented later)
    const groups: Record<string, DesignDocument[]> = {};
    
    filteredDocuments.forEach(doc => {
      if (!groups[doc.folder]) groups[doc.folder] = [];
      groups[doc.folder].push(doc);
    });
    
    return groups;
  }, [filteredDocuments, viewByPhase]);

  // Mobile Action Bar setup
  React.useEffect(() => {
    if (isMobile) {
      setActions({
        slot3: {
          id: 'new-document',
          icon: <Upload className="h-6 w-6" />,
          label: 'Subir',
          onClick: () => setShowDocumentModal(true),
        },
      });
      setShowActionBar(true);
      
      return () => {
        setShowActionBar(false);
      };
    }
  }, [isMobile, setActions, setShowActionBar]);

  // Helper functions
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <FileImage className="h-5 w-5" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5" />;
    if (fileType.includes('dwg') || fileType.includes('autocad')) return <File className="h-5 w-5" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileSpreadsheet className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'en_revision': return 'bg-yellow-100 text-yellow-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprobado': return 'Aprobado';
      case 'en_revision': return 'En Revisión';
      case 'rechazado': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  const handleEdit = (document: DesignDocument) => {
    setEditingDocument(document);
    setShowDocumentModal(true);
  };

  const handleDelete = (document: DesignDocument) => {
    setDocumentToDelete(document);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete.id);
      setDocumentToDelete(null);
    }
  };

  const downloadFile = (document: DesignDocument) => {
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.file_name;
    link.target = '_blank';
    link.click();
  };

  const handleCloseModal = () => {
    setShowDocumentModal(false);
    setEditingDocument(null);
  };

  const headerProps = {
    title: "Documentación",
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    actions: [
      <Button 
        key="upload"
        onClick={() => setShowDocumentModal(true)} 
        size="sm"
        className="h-8 px-3 text-sm font-medium"
      >
        <Upload className="mr-2 h-4 w-4" />
        Subir Documento
      </Button>
    ]
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout headerProps={headerProps}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Error al cargar los documentos</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      {/* View Toggle - only show when documents exist */}
      {documents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <Label htmlFor="view-toggle" className="text-sm font-medium">
              Vista por carpeta
            </Label>
            <Switch
              id="view-toggle"
              checked={viewByPhase}
              onCheckedChange={setViewByPhase}
            />
            <Calendar className="h-4 w-4" />
            <Label htmlFor="view-toggle" className="text-sm font-medium">
              Vista por fase de diseño
            </Label>
          </div>
        </div>
      )}

      {/* Documents */}
      {Object.keys(groupedDocuments).length === 0 ? (
        <CustomEmptyState 
          icon={<FileText className="h-12 w-12" />}
          title="No hay documentos"
          description="Comienza subiendo tu primer documento de diseño"
          action={
            <Button onClick={() => setShowDocumentModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Subir Documento
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDocuments).map(([groupName, docs]) => (
            <div key={groupName}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {viewByPhase ? <Calendar className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
                {groupName}
                <Badge variant="secondary" className="ml-2">
                  {docs.length}
                </Badge>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((document) => (
                  <Card key={document.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getFileIcon(document.file_type)}
                          <div>
                            <CardTitle className="text-sm font-medium truncate">
                              {document.file_name || 'Documento sin nombre'}
                            </CardTitle>
                            {document.version_number > 1 && (
                              <Badge variant="outline" className="text-xs mt-1">
                                v{document.version_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadFile(document)}>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(document)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(document)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {document.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {document.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(document.status)}>
                            {getStatusLabel(document.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{document.version_number}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(document.created_at), 'dd MMM yyyy', { locale: es })}</span>
                          {document.creator && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={document.creator.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {document.creator.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[80px]">{document.creator.full_name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={() => downloadFile(document)}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar "{documentToDelete.file_name || 'este documento'}"? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Document Modal */}
      <NewDesignDocumentModal
        open={showDocumentModal}
        onClose={handleCloseModal}
        editingDocument={editingDocument}
      />
    </Layout>
  );
}