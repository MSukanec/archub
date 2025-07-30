import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigationStore } from '@/stores/navigationStore';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout/desktop/Layout';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { DocumentGroupCard } from '@/components/ui-custom/DocumentGroupCard';
import { Table } from '@/components/ui-custom/Table';
import DocumentCard from '@/components/cards/DocumentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { useMobile } from '@/hooks/use-mobile';
import { useDesignDocumentFolders, useCreateDesignDocumentFolder, useDeleteDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups, useDeleteDesignDocumentGroup } from '@/hooks/use-design-document-groups';
import { useDesignDocuments, useDesignDocumentsByFolder } from '@/hooks/use-design-documents';


import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { 
  FileText, 
  FolderOpen,
  Calendar,
  Upload,
  RefreshCw,
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
  ChevronLeft,
  Home,
  Edit3,
  Trash2,
  Package,
  Pencil,
  List,
  Grid,
  Eye,
  Download
} from 'lucide-react';


type ViewMode = 'folders' | 'documents';

interface BreadcrumbItem {
  name: string;
  onClick: () => void;
}

export default function ProjectDocumentation() {
  const { data: userData } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const { openModal } = useGlobalModalStore();


  const isMobile = useMobile();

  const { data: folders, isLoading: foldersLoading } = useDesignDocumentFolders();
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useDesignDocumentGroups(selectedFolderId);
  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useDesignDocuments(selectedGroupId);
  const { data: folderDocuments, isLoading: folderDocumentsLoading } = useDesignDocumentsByFolder(selectedFolderId);

  const { showDeleteConfirmation } = useDeleteConfirmation();

  const createFolderMutation = useCreateDesignDocumentFolder();
  const deleteFolderMutation = useDeleteDesignDocumentFolder();
  const deleteGroupMutation = useDeleteDesignDocumentGroup();

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filtros
  const filteredFolders = useMemo(() => {
    if (!folders) return [];
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [folders, searchTerm]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  useEffect(() => {
    if (setNavigationContext) {
      setNavigationContext('project');
    }
  }, [setNavigationContext]);

  // Mobile action bar
  useEffect(() => {
    if (isMobile) {
      let actions = [];
      
      if (viewMode === 'folders') {
        actions.push({
          icon: FolderPlus,
          label: 'Nueva Carpeta',
          onClick: () => openModal('document-folder', {})
        });
      }
      
      if (selectedFolderId) {
        actions.push({
          icon: Upload,
          label: 'Subir Documentos',
          onClick: () => openModal('document-upload', { defaultFolderId: selectedFolderId })
        });
      }
      
      setActionBarActions(actions);
    }
  }, [isMobile, viewMode, selectedFolderId, openModal, setActionBarActions]);

  const handleFolderClick = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedGroupId('');
    setViewMode('folders');
    setBreadcrumbs([
      { 
        name: folderName, 
        onClick: () => {
          setSelectedFolderId(folderId);
          setSelectedGroupId('');
          setViewMode('folders');
          setBreadcrumbs([{ name: folderName, onClick: () => {} }]);
        } 
      }
    ]);
  };

  const handleGroupClick = (groupId: string, groupName: string) => {
    setSelectedGroupId(groupId);
    setViewMode('documents');
    setBreadcrumbs(prev => [
      ...prev,
      { 
        name: groupName, 
        onClick: () => {
          setSelectedGroupId(groupId);
          setViewMode('documents');
        } 
      }
    ]);
  };

  const handleBackToFolders = () => {
    setSelectedFolderId('');
    setSelectedGroupId('');
    setViewMode('folders');
    setBreadcrumbs([]);
  };

  const handleBackToGroups = () => {
    setSelectedGroupId('');
    setViewMode('folders');
    setBreadcrumbs(prev => prev.slice(0, -1));
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    await showDeleteConfirmation(
      `¿Está seguro que desea eliminar la carpeta "${folderName}"?`,
      'Esta acción no se puede deshacer.',
      folderName,
      async () => {
        await deleteFolderMutation.mutateAsync(folderId);
        toast({
          title: 'Carpeta eliminada',
          description: 'La carpeta ha sido eliminada exitosamente.',
        });
      }
    );
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    await showDeleteConfirmation(
      `¿Está seguro que desea eliminar el grupo "${groupName}"?`,
      'Esta acción no se puede deshacer y eliminará todos los documentos del grupo.',
      groupName,
      async () => {
        await deleteGroupMutation.mutateAsync(groupId);
        toast({
          title: 'Grupo eliminado',
          description: 'El grupo ha sido eliminado exitosamente.',
        });
      }
    );
  };

  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) return null;
    
    return (
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToFolders}
          className="h-8 px-2"
        >
          <Home className="h-4 w-4" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={index}>
            <Button
              variant="ghost"
              size="sm"
              onClick={breadcrumb.onClick}
              className="h-8 px-2"
            >
              {breadcrumb.name}
            </Button>
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderFolderView = () => {
    if (foldersLoading) {
      return <div className="text-center py-8">Cargando carpetas...</div>;
    }

    if (filteredFolders.length === 0) {
      return (
        <EmptyState
          icon={<FolderOpen className="w-12 h-12" />}
          title="No hay carpetas de documentos"
          description="Comienza creando tu primera carpeta para organizar los documentos del proyecto."
        />
      );
    }

    return (
      <div className="grid gap-4">
        {filteredFolders.map((folder) => (
          <Card key={folder.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1" onClick={() => handleFolderClick(folder.id, folder.name)}>
                  <div className="p-2 bg-muted rounded-md">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{folder.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {folder.description || 'Sin descripción'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('document-folder', { folder, isEditing: true });
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id, folder.name);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  };

  const renderGroupsView = () => {
    if (groupsLoading || folderDocumentsLoading) {
      return <div className="text-center py-8">Cargando...</div>;
    }

    // Filter folder documents that don't have a group (group_id is null)
    const documentsWithoutGroup = folderDocuments?.filter(doc => !doc.group_id) || [];

    return (
      <div className="space-y-6">
        {/* Documents without group */}
        {documentsWithoutGroup.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Documentos de la Carpeta</h3>
            <div className="grid gap-4">
              {documentsWithoutGroup.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        )}

        {/* Document groups */}
        {filteredGroups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Grupos de Documentos</h3>
            <div className="grid gap-4">
              {filteredGroups.map((group) => (
                <DocumentGroupCard
                  key={group.id}
                  group={group}
                  onEdit={() => handleGroupClick(group.id, group.name)}
                  onDelete={() => handleDeleteGroup(group.id, group.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no documents or groups */}
        {documentsWithoutGroup.length === 0 && filteredGroups.length === 0 && (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title="No hay documentos en esta carpeta"
            description="Sube documentos para comenzar a organizar el contenido de esta carpeta."
          />
        )}
      </div>
    );
  };

  const renderDocumentsView = () => {
    if (documentsLoading) {
      return <div className="text-center py-8">Cargando documentos...</div>;
    }

    if (filteredDocuments.length === 0) {
      return (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No hay documentos"
          description="Este grupo aún no tiene documentos subidos."
        />
      );
    }

    if (isMobile) {
      return (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      );
    }

    const tableData = filteredDocuments.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.file_type,
      size: doc.file_size,
      creator: doc.creator,
      created_at: doc.created_at,
      status: doc.status,
      version: doc.version,
      original_name: doc.original_name
    }));

    const columns = [
      {
        header: 'Documento',
        accessorKey: 'name',
        cell: ({ row }: any) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{row.original.name}</div>
              <div className="text-sm text-muted-foreground truncate">{row.original.original_name}</div>
            </div>
          </div>
        )
      },
      {
        header: 'Tipo',
        accessorKey: 'type',
        cell: ({ row }: any) => (
          <Badge variant="outline" className="text-xs">
            {row.original.type || 'N/A'}
          </Badge>
        )
      },
      {
        header: 'Tamaño',
        accessorKey: 'size',
        cell: ({ row }: any) => (
          <span className="text-sm text-muted-foreground">
            {row.original.size ? `${(row.original.size / 1024).toFixed(1)} KB` : 'N/A'}
          </span>
        )
      },
      {
        header: 'Creador',
        accessorKey: 'creator',
        cell: ({ row }: any) => {
          const creator = row.original.creator;
          if (!creator) return <span className="text-muted-foreground">N/A</span>;
          
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={creator.avatar_url} />
                <AvatarFallback className="text-xs">
                  {creator.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{creator.full_name || 'Usuario'}</span>
            </div>
          );
        }
      },
      {
        header: 'Fecha',
        accessorKey: 'created_at',
        cell: ({ row }: any) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.created_at), 'dd/MM/yyyy', { locale: es })}
          </span>
        )
      },
      {
        header: 'Estado',
        accessorKey: 'status',
        cell: ({ row }: any) => (
          <Badge variant={
            row.original.status === 'active' ? 'default' : 
            row.original.status === 'archived' ? 'secondary' : 'outline'
          }>
            {row.original.status === 'active' ? 'Activo' : 
             row.original.status === 'archived' ? 'Archivado' : 'Borrador'}
          </Badge>
        )
      },
      {
        header: 'Versión',
        accessorKey: 'version',
        cell: ({ row }: any) => (
          <span className="text-sm font-mono">v{row.original.version}</span>
        )
      }
    ];

    return (
      <Table
        data={tableData}
        columns={columns}
        searchable={false}
        actionButtons={[
          {
            icon: Eye,
            label: 'Ver',
            onClick: (row) => {
              // Implementar vista de documento
              console.log('Ver documento:', row.original);
            }
          },
          {
            icon: Download,
            label: 'Descargar',
            onClick: (row) => {
              // Implementar descarga de documento
              console.log('Descargar documento:', row.original);
            }
          }
        ]}
      />
    );
  };

  const renderMainContent = () => {
    if (!selectedFolderId) {
      return renderFolderView();
    }
    
    if (viewMode === 'folders') {
      return renderGroupsView();
    }
    
    return renderDocumentsView();
  };

  const renderHeaderActions = () => {
    const actions = [];
    
    if (!selectedFolderId) {
      actions.push(
        <Button
          key="new-folder"
          onClick={() => openModal('document-folder', {})}
          className="gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          Nueva Carpeta
        </Button>
      );
    }
    
    if (selectedFolderId) {
      actions.push(
        <Button
          key="upload"
          onClick={() => openModal('document-upload', { 
            defaultFolderId: selectedFolderId,
            defaultGroupId: selectedGroupId 
          })}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Subir Documentos
        </Button>
      );
    }
    
    return actions;
  };

  return (
    <Layout wide={true}>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktop
          title="Documentación del Proyecto"
          icon={<FileText className="w-5 h-5" />}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          primaryActionLabel={selectedFolderId ? "Subir Documentos" : "Nueva Carpeta"}
          onPrimaryActionClick={() => {
            if (selectedFolderId) {
              openModal('document-upload', { 
                defaultFolderId: selectedFolderId,
                defaultGroupId: selectedGroupId 
              });
            } else {
              openModal('document-folder', {});
            }
          }}
          features={[
            {
              icon: <Archive className="w-4 h-4" />,
              title: "Control de versiones de documentos",
              description: "Mantén un historial completo de todas las versiones de tus documentos de diseño con recuperación automática de versiones anteriores."
            },
            {
              icon: <FolderOpen className="w-4 h-4" />,
              title: "Organización jerárquica de carpetas",
              description: "Estructura tus documentos en carpetas organizadas por disciplina, fase del proyecto o cualquier criterio personalizado."
            },
            {
              icon: <Download className="w-4 h-4" />,
              title: "Descarga y exportación masiva",
              description: "Exporta documentos individuales o carpetas completas manteniendo la estructura organizativa original."
            },
            {
              icon: <Users className="w-4 h-4" />,
              title: "Colaboración en equipo en tiempo real",
              description: "Acceso simultáneo del equipo con sincronización automática de cambios y comentarios colaborativos."
            }
          ]}
        />

        {/* Feature Introduction - Mobile Only */}
        <FeatureIntroduction
          title="Documentación"
          icon={<FileText className="w-5 h-5" />}
          features={[
            {
              icon: <Archive className="w-5 h-5" />,
              title: "Control de versiones de documentos",
              description: "Mantén un historial completo de todas las versiones de tus documentos de diseño. Cada actualización se guarda automáticamente, permitiendo recuperar versiones anteriores cuando sea necesario y mantener un registro de la evolución del proyecto."
            },
            {
              icon: <FolderOpen className="w-5 h-5" />,
              title: "Organización jerárquica de carpetas",
              description: "Estructura tus documentos en carpetas y subcarpetas organizadas por disciplina, fase del proyecto o cualquier criterio que necesites. Esta organización facilita la búsqueda y mantiene todo ordenado para el equipo."
            },
            {
              icon: <Download className="w-5 h-5" />,
              title: "Descarga y exportación masiva",
              description: "Exporta documentos individuales o carpetas completas con un solo clic. Perfecto para compartir entregables con clientes, contratistas o autoridades, manteniendo la estructura organizativa original."
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: "Colaboración en equipo en tiempo real",
              description: "Todo el equipo puede acceder, comentar y actualizar documentos simultáneamente. Los cambios se sincronizan automáticamente y cada miembro del equipo mantiene acceso a la información más actualizada del proyecto."
            }
          ]}
          className="md:hidden"
        />

        {/* Breadcrumbs */}
        {renderBreadcrumbs()}

        {/* Search and Navigation - Only when there's content */}
        {((viewMode === 'folders' && (!selectedFolderId ? filteredFolders.length > 0 : filteredGroups.length > 0)) || 
          (viewMode === 'documents' && filteredDocuments.length > 0)) && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {selectedFolderId && (
              <Button
                variant="outline"
                onClick={handleBackToGroups}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Button>
            )}
          </div>
        )}

        {/* Main Content */}
        {renderMainContent()}
      </div>
    </Layout>
  );
}