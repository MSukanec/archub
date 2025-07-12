import React, { useState, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Layout } from '@/components/layout/desktop/Layout';
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { DocumentFolderCard } from '@/components/ui-custom/DocumentFolderCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { useMobile } from '@/hooks/use-mobile';
import { NewDesignDocumentModal } from '@/modals/design/NewDesignDocumentModal';
import { 
  FileText, 
  FolderOpen,
  Calendar,
  Upload,
  History,
  Archive,
  Share2,
  Users
} from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewByPhase, setViewByPhase] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DesignDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DesignDocument | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setActions, setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();

  // Get project and organization IDs
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  // Documents query - gets ALL documents including versions
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['designDocuments', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return [];

      console.log('Fetching design documents for project:', projectId);

      const { data, error } = await supabase
        .from('design_documents')
        .select(`
          *,
          creator:users!design_documents_created_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching design documents:', error);
        throw error;
      }

      console.log('Design documents data received:', data);
      return data as DesignDocument[];
    },
    enabled: !!projectId && !!supabase,
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

  // Group documents by folder - includes all versions
  const groupedDocuments = useMemo(() => {
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
      {/* Feature Introduction */}
      <FeatureIntroduction 
        title="Gestión de Documentación"
        icon={<FileText className="h-6 w-6" />}
        features={[
          {
            icon: <Archive className="h-5 w-5" />,
            title: "Versionado de Archivos",
            description: "Cada carpeta mantiene un historial completo de versiones. Puedes actualizar documentos y acceder a versiones anteriores."
          },
          {
            icon: <FolderOpen className="h-5 w-5" />,
            title: "Organización por Carpetas",
            description: "Organiza tus documentos por carpetas temáticas. Cada carpeta muestra el archivo más reciente con opciones de actualización."
          },
          {
            icon: <Share2 className="h-5 w-5" />,
            title: "Descarga y Exportación",
            description: "Descarga la versión actual o exporta cualquier versión anterior. Historial completo disponible en cada carpeta."
          },
          {
            icon: <Users className="h-5 w-5" />,
            title: "Colaboración del Equipo",
            description: "Rastrea quién subió cada versión y cuándo. Estados de aprobación para control de calidad del proyecto."
          }
        ]}
      />

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
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([folderName, documents]) => (
            <DocumentFolderCard
              key={folderName}
              folder={folderName}
              documents={documents}
              projectId={projectId!}
              organizationId={organizationId!}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
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