import React, { useState, useMemo, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/desktop/Layout';
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { DocumentGroupCard } from '@/components/ui-custom/DocumentGroupCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { useMobile } from '@/hooks/use-mobile';
import { useDesignDocumentFolders, useCreateDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups, useDeleteDesignDocumentGroup } from '@/hooks/use-design-document-groups';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { NewDocumentUploadModal } from '@/modals/design/NewDocumentUploadModal';
import { NewDocumentGroupModal } from '@/modals/design/NewDocumentGroupModal';
import { NewDocumentFolderModal } from '@/modals/design/NewDocumentFolderModal';
import { 
  FileText, 
  FolderOpen,
  Calendar,
  Upload,
  History,
  Archive,
  Share2,
  Users,
  Plus,
  FolderPlus,
  Search,
  ChevronRight,
  Home
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

type ViewMode = 'folders' | 'groups' | 'documents';

interface BreadcrumbItem {
  name: string;
  onClick: () => void;
}

export default function DesignDocumentation() {
  const { data: userData } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setActions, setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();

  // Get project and organization IDs
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  // Get folders, groups, and documents
  const { data: folders = [] } = useDesignDocumentFolders();
  const { data: groups = [] } = useDesignDocumentGroups(selectedFolderId);
  const { data: documents = [] } = useDesignDocuments(selectedGroupId);
  const createFolderMutation = useCreateDesignDocumentFolder();
  const deleteGroupMutation = useDeleteDesignDocumentGroup();

  // Filter folders based on search
  const filteredFolders = useMemo(() => {
    return folders.filter(folder =>
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [folders, searchTerm]);

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    return groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [groups, searchTerm]);

  // Filter documents based on search
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [documents, searchTerm]);

  // Navigation functions
  const navigateToFolder = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setViewMode('groups');
    setBreadcrumbs([
      {
        name: folderName,
        onClick: () => navigateToFolder(folderId, folderName)
      }
    ]);
  };

  const navigateToGroup = (groupId: string, groupName: string) => {
    setSelectedGroupId(groupId);
    setViewMode('documents');
    setBreadcrumbs(prev => [
      ...prev,
      {
        name: groupName,
        onClick: () => navigateToGroup(groupId, groupName)
      }
    ]);
  };

  const navigateToRoot = () => {
    setViewMode('folders');
    setSelectedFolderId('');
    setSelectedGroupId('');
    setBreadcrumbs([]);
  };



  // Handle group deletion
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await deleteGroupMutation.mutateAsync(groupToDelete.id);
      toast({
        title: "Grupo eliminado",
        description: "El grupo documental ha sido eliminado exitosamente."
      });
      setGroupToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el grupo",
        variant: "destructive"
      });
    }
  };

  // Mobile Action Bar setup
  useEffect(() => {
    if (isMobile) {
      setActions({
        slot3: {
          id: 'upload-document',
          icon: <Upload className="h-6 w-6" />,
          label: 'Subir',
          onClick: () => setShowUploadModal(true),
        },
      });
      setShowActionBar(true);
      
      return () => {
        setShowActionBar(false);
      };
    }
  }, [isMobile, setActions, setShowActionBar]);

  const getHeaderActions = () => {
    const actions = [];
    
    // Secondary action: New Folder (only in folders view)
    if (viewMode === 'folders') {
      actions.push(
        <Button 
          key="new-folder"
          onClick={() => setShowFolderModal(true)} 
          variant="outline"
          size="sm"
          className="h-8 px-3 text-sm font-medium"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nueva Carpeta
        </Button>
      );
    }

    // Primary action: Upload Documents
    actions.push(
      <Button 
        key="upload"
        onClick={() => setShowUploadModal(true)} 
        size="sm"
        className="h-8 px-3 text-sm font-medium"
      >
        <Upload className="h-4 w-4 mr-2" />
        Subir Documentos
      </Button>
    );

    return actions;
  };

  const headerProps = {
    title: "Documentación",
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    actions: getHeaderActions(),
    breadcrumbs: breadcrumbs.length > 0 ? [
      {
        name: "Documentación",
        onClick: navigateToRoot
      },
      ...breadcrumbs
    ] : undefined
  };

  const renderFoldersView = () => (
    <div className="space-y-6">
      <FeatureIntroduction
        title="Gestión de Documentos"
        description="Organiza y gestiona todos los documentos de tu proyecto"
        icon={<FileText className="h-5 w-5" />}
        features={[
          "Organización jerárquica en carpetas y grupos documentales",
          "Subida múltiple de archivos con versiones automáticas",
          "Control de estados y visibilidad de documentos",
          "Historial completo de versiones y cambios"
        ]}
      />

      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Carpetas</h3>
        <Badge variant="secondary">{filteredFolders.length}</Badge>
      </div>

      {filteredFolders.length === 0 ? (
        <CustomEmptyState
          icon={<FolderOpen className="h-12 w-12 text-muted-foreground" />}
          title="No hay carpetas"
          description="Crea tu primera carpeta para organizar documentos"
          action={
            <Button onClick={() => setShowFolderModal(true)} size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              Crear Primera Carpeta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredFolders.map((folder) => (
            <Card key={folder.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent/10">
                      <FolderOpen className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{folder.name}</CardTitle>
                      <CardDescription>
                        {groups.filter(g => g.folder_id === folder.id).length} grupo{groups.filter(g => g.folder_id === folder.id).length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderGroupsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Grupos Documentales</h3>
          <Badge variant="secondary">{filteredGroups.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGroupModal(true)}
          className="h-8 px-3"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Entrega
        </Button>
      </div>

      {filteredGroups.length === 0 ? (
        <CustomEmptyState
          icon={<Archive className="h-12 w-12 text-muted-foreground" />}
          title="No hay grupos documentales"
          description="Crea tu primer grupo para organizar documentos relacionados"
          action={
            <Button onClick={() => setShowGroupModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Grupo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => (
            <DocumentGroupCard
              key={group.id}
              group={group}
              onEdit={(group) => {
                setEditingGroup(group);
                setShowGroupModal(true);
              }}
              onDelete={(group) => setGroupToDelete(group)}
              onViewDocuments={(group) => navigateToGroup(group.id, group.name)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderDocumentsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Documentos</h3>
          <Badge variant="secondary">{filteredDocuments.length}</Badge>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <CustomEmptyState
          icon={<FileText className="h-12 w-12 text-muted-foreground" />}
          title="No hay documentos"
          description="Sube documentos a este grupo para empezar"
          action={
            <Button onClick={() => setShowUploadModal(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Subir Documentos
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{doc.name}</CardTitle>
                      <CardDescription>{doc.file_type}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doc.status}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout headerProps={headerProps}>
      {viewMode === 'folders' && renderFoldersView()}
      {viewMode === 'groups' && renderGroupsView()}
      {viewMode === 'documents' && renderDocumentsView()}

      {/* Upload Modal */}
      <NewDocumentUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        defaultFolderId={selectedFolderId}
        defaultGroupId={selectedGroupId}
      />

      {/* Group Modal */}
      <NewDocumentGroupModal
        open={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setEditingGroup(null);
        }}
        editingGroup={editingGroup}
        defaultFolderId={selectedFolderId}
      />

      {/* Folder Modal */}
      <NewDocumentFolderModal
        open={showFolderModal}
        onClose={() => setShowFolderModal(false)}
      />

      {/* Delete Group Confirmation */}
      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo documental?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El grupo "{groupToDelete?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}