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
import { useDesignDocumentFolders, useCreateDesignDocumentFolder, useDeleteDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups, useDeleteDesignDocumentGroup } from '@/hooks/use-design-document-groups';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { NewDocumentUploadModal } from '@/modals/design/NewDocumentUploadModal';
import { NewDocumentGroupModal } from '@/modals/design/NewDocumentGroupModal';
import { NewDocumentFolderModal } from '@/modals/design/NewDocumentFolderModal';
import { DangerousConfirmationModal } from '@/components/ui-custom/DangerousConfirmationModal';
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
  ChevronDown,
  ChevronUp,
  Home,
  Edit3,
  Trash2,
  Package,
  Pencil
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
  const [subfolderParent, setSubfolderParent] = useState<{id: string; name: string} | null>(null);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [folderToDelete, setFolderToDelete] = useState<any>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{type: 'folder' | 'group'; id: string; name: string} | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
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
  const deleteFolderMutation = useDeleteDesignDocumentFolder();

  // Función para manejar la expansión/contracción del acordeón
  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolderId(expandedFolderId === folderId ? null : folderId);
  };

  // Filter folders based on search - only show parent folders
  const filteredFolders = useMemo(() => {
    return folders.filter(folder =>
      !folder.parent_id && 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [folders, searchTerm]);

  // Function to get subfolders of a parent folder
  const getSubfolders = (parentId: string) => {
    if (!folders) return [];
    return folders.filter(folder => folder.parent_id === parentId);
  };

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

  const handleDeleteFolder = () => {
    if (folderToDelete) {
      deleteFolderMutation.mutate(folderToDelete.id, {
        onSuccess: () => {
          toast({
            title: "Éxito",
            description: "Carpeta eliminada correctamente",
          });
          setFolderToDelete(null);
          setShowDeleteConfirmation(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "No se pudo eliminar la carpeta",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleDeleteGroup = () => {
    if (groupToDelete) {
      deleteGroupMutation.mutate(groupToDelete.id, {
        onSuccess: () => {
          toast({
            title: "Éxito",
            description: `Grupo "${groupToDelete.name}" eliminado correctamente`,
          });
          setGroupToDelete(null);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "No se pudo eliminar el grupo",
            variant: "destructive",
          });
        },
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

  const renderNavigationTree = () => {
    const renderFolder = (folder: any, isSubfolder = false) => (
      <div key={folder.id} className="space-y-2">
        <Card 
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
            selectedItem?.type === 'folder' && selectedItem?.id === folder.id ? 'bg-accent/20' : ''
          }`}
          onClick={() => setSelectedItem({type: 'folder', id: folder.id, name: folder.name})}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className={`${isSubfolder ? 'w-4 h-4' : 'w-5 h-5'} text-accent`} />
                <span className={`${isSubfolder ? 'text-sm' : 'text-base'} font-medium`}>{folder.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubfolderParent({id: folder.id, name: folder.name});
                    setShowFolderModal(true);
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Crear Subcarpeta
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                    setShowFolderModal(true);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderToDelete(folder);
                    setShowDeleteConfirmation(true);
                  }}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Subcarpetas */}
        {getSubfolders(folder.id).length > 0 && (
          <div className="ml-4 space-y-2">
            {getSubfolders(folder.id).map((subfolder) => renderFolder(subfolder, true))}
          </div>
        )}
        
        {/* Grupos dentro de la carpeta */}
        {groups.filter(g => g.folder_id === folder.id).map((group) => (
          <Card 
            key={group.id}
            className={`ml-6 cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedItem?.type === 'group' && selectedItem?.id === group.id ? 'bg-accent/20' : ''
            }`}
            onClick={() => setSelectedItem({type: 'group', id: group.id, name: group.name})}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{group.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                      setShowGroupModal(true);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGroupToDelete(group);
                    }}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );

    return (
      <div className="space-y-2">
        {filteredFolders.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No hay carpetas</p>
            <Button onClick={() => setShowFolderModal(true)} size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              Crear Primera Carpeta
            </Button>
          </div>
        ) : (
          filteredFolders.map((folder) => renderFolder(folder))
        )}
      </div>
    );
  };

  const renderDetailsPanel = () => {
    if (!selectedItem) {
      return (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Selecciona un elemento</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona una carpeta o grupo de la izquierda para ver sus documentos
          </p>
        </div>
      );
    }

    if (selectedItem.type === 'folder') {
      const folderGroups = groups.filter(g => g.folder_id === selectedItem.id);
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
          </div>
          
          {folderGroups.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No hay grupos en esta carpeta</p>
              <Button 
                onClick={() => {
                  setSelectedFolderId(selectedItem.id);
                  setShowGroupModal(true);
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Grupo
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              {folderGroups.map((group) => (
                <DocumentGroupCard 
                  key={group.id}
                  group={group}
                  onEdit={() => {
                    setEditingGroup(group);
                    setShowGroupModal(true);
                  }}
                  onDelete={() => setGroupToDelete(group)}
                  onSelect={() => setSelectedItem({type: 'group', id: group.id, name: group.name})}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (selectedItem.type === 'group') {
      const groupDocuments = documents.filter(d => d.group_id === selectedItem.id);
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
          </div>
          
          {groupDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No hay documentos en este grupo</p>
              <Button 
                onClick={() => {
                  setSelectedGroupId(selectedItem.id);
                  setShowUploadModal(true);
                }}
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Documentos
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              {groupDocuments.map((document) => (
                <Card key={document.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {document.created_at && new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderSingleColumnLayout = () => (
    <div className="space-y-6">
      <FeatureIntroduction
        title="Gestión de Documentos"
        icon={<FileText className="h-5 w-5" />}
        features={[
          {
            icon: <FolderOpen className="h-4 w-4" />,
            title: "Organización jerárquica",
            description: "Carpetas y grupos documentales para estructurar tu proyecto"
          },
          {
            icon: <Upload className="h-4 w-4" />,
            title: "Subida múltiple de archivos",
            description: "Sube varios archivos a la vez con versiones automáticas"
          },
          {
            icon: <Archive className="h-4 w-4" />,
            title: "Control de estados",
            description: "Gestiona la visibilidad y estado de cada documento"
          },
          {
            icon: <History className="h-4 w-4" />,
            title: "Historial completo",
            description: "Mantén un registro de todas las versiones y cambios"
          }
        ]}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">Documentación</h3>
          </div>
          <Button
            onClick={() => setShowFolderModal(true)}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Carpeta
          </Button>
        </div>
        {renderHierarchicalStructure()}
      </div>
    </div>
  );

  const renderHierarchicalStructure = () => {
    const renderDocument = (document: any) => (
      <Card key={document.id} className="ml-8 bg-muted/30">
        <CardHeader className="pb-3 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{document.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {document.file_type}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(document.file_url, '_blank')}
                className="h-6 w-6 p-0"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );

    const renderGroup = (group: any) => {
      const groupDocuments = documents.filter(d => d.group_id === group.id);
      return (
        <div key={group.id} className="space-y-2">
          <Card className="ml-6 bg-muted/20">
            <CardHeader className="pb-2 flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{group.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setShowUploadModal(true);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Subir Documentos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingGroup(group);
                      setShowGroupModal(true);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGroupToDelete(group)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          {/* Documentos del grupo */}
          {groupDocuments.length > 0 && (
            <div className="space-y-2">
              {groupDocuments.map(renderDocument)}
            </div>
          )}
        </div>
      );
    };

    const renderFolder = (folder: any, isSubfolder = false) => {
      const folderGroups = groups.filter(g => g.folder_id === folder.id);
      const isExpanded = expandedFolderId === folder.id;
      
      return (
        <div key={folder.id} className="space-y-2">
          <Card className={`${isSubfolder ? 'bg-muted/10' : ''}`}>
            <CardHeader 
              className="py-4 flex items-center cursor-pointer justify-center"
              onClick={() => toggleFolderExpansion(folder.id)}
            >
              <div className="flex items-center justify-between w-full h-full">
                <div className="flex items-center gap-2">
                  <FolderOpen className={`${isSubfolder ? 'w-4 h-4' : 'w-5 h-5'} text-accent`} />
                  <span className={`${isSubfolder ? 'text-sm' : 'text-base'} font-medium`}>{folder.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubfolderParent({id: folder.id, name: folder.name});
                      setShowFolderModal(true);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFolder(folder);
                      setShowFolderModal(true);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderToDelete(folder);
                      setShowDeleteConfirmation(true);
                    }}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            {/* Contenido expandido */}
            {isExpanded && (
              <>
                <div className="border-t border-border" />
                <CardContent className="pt-4">
                {/* Subcarpetas - se muestran primero */}
                {getSubfolders(folder.id).length > 0 && (
                  <div className="mb-4 space-y-2">
                    {getSubfolders(folder.id).map((subfolder) => renderFolder(subfolder, true))}
                  </div>
                )}
                
                {/* Empty space para subir documentos - disponible para todas las carpetas */}
                <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-muted rounded-lg">
                  <FolderOpen className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Sube documentos a esta carpeta</p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFolderId(folder.id);
                      setShowUploadModal(true);
                    }}
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documentos
                  </Button>
                </div>
                
                {/* Grupos dentro de la carpeta */}
                {folderGroups.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Grupos de revisión</h4>
                    {folderGroups.map(renderGroup)}
                  </div>
                )}
              </CardContent>
              </>
            )}
          </Card>
        </div>
      );
    };

    if (filteredFolders.length === 0) {
      return (
        <CustomEmptyState
          icon={<FolderOpen className="h-12 w-12 text-muted-foreground" />}
          title="No hay carpetas"
          description="Crea tu primera carpeta para organizar documentos"
          action={
            <Button onClick={() => setShowFolderModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Carpeta
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        {filteredFolders.map((folder) => renderFolder(folder))}
      </div>
    );
  };

  const renderTwoColumnLayout = () => (
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Columna Izquierda - Navegación */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Carpetas</h3>
                <Badge variant="secondary">{filteredFolders.length}</Badge>
              </div>
              <Button 
                onClick={() => setShowFolderModal(true)} 
                size="sm"
                variant="outline"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Nueva Carpeta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderNavigationTree()}
          </CardContent>
        </Card>

        {/* Columna Derecha - Detalles */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <h3 className="text-lg font-semibold">Detalles</h3>
          </CardHeader>
          <CardContent>
            {renderDetailsPanel()}
          </CardContent>
        </Card>
      </div>
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
    <Layout headerProps={headerProps} wide={true}>
      {renderSingleColumnLayout()}

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
        onClose={() => {
          setShowFolderModal(false);
          setSubfolderParent(null);
          setEditingFolder(null);
        }}
        parentId={subfolderParent?.id}
        parentName={subfolderParent?.name}
        editingFolder={editingFolder}
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

      {/* Delete Folder Confirmation */}
      <DangerousConfirmationModal
        open={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setFolderToDelete(null);
        }}
        onConfirm={() => handleDeleteFolder()}
        itemName={folderToDelete?.name || ''}
        itemType="carpeta"
        warningMessage="Esta acción eliminará permanentemente la carpeta y todos sus grupos documentales asociados."
      />
    </Layout>
  );
}