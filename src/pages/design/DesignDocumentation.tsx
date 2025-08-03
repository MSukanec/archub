import React, { useState, useMemo, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { Layout } from '@/components/layout/desktop/Layout';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { DocumentFolderCard } from '@/components/ui-custom/DocumentFolderCard';
import { DocumentGroupCard } from '@/components/ui-custom/DocumentGroupCard';
import { Button } from '@/components/ui/button';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups } from '@/hooks/use-design-document-groups';
import { useDesignDocuments } from '@/hooks/use-design-documents';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { 
  FileText, 
  FolderOpen,
  Upload,
  Archive,
  Download,
  Users,
  Plus,
  FolderPlus
} from 'lucide-react';

export default function DesignDocumentation() {
  const { data: userData } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();

  // Set sidebar context to design
  useEffect(() => {
    setSidebarContext('design');
  }, [setSidebarContext]);

  // Fetch data
  const { data: folders, isLoading: foldersLoading } = useDesignDocumentFolders();
  const { data: allGroups, isLoading: groupsLoading } = useDesignDocumentGroups();
  const { data: allDocuments, isLoading: documentsLoading } = useDesignDocuments();

  // Filter data based on search term
  const filteredFolders = useMemo(() => {
    if (!folders) return [];
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [folders, searchTerm]);

  const filteredGroups = useMemo(() => {
    if (!allGroups) return [];
    return allGroups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allGroups, searchTerm]);

  // Group documents by folder for DocumentFolderCard
  const documentsByFolder = useMemo(() => {
    if (!allDocuments || !filteredFolders) return {};
    
    const grouped: { [folderId: string]: any[] } = {};
    
    filteredFolders.forEach(folder => {
      grouped[folder.id] = allDocuments.filter(doc => doc.folder_id === folder.id);
    });
    
    return grouped;
  }, [allDocuments, filteredFolders]);

  const handleEditDocument = (document: any) => {
    openModal('document-upload', { 
      defaultFolderId: document.folder_id,
      defaultGroupId: document.group_id,
      editingDocument: document
    });
  };

  const handleDeleteDocument = (document: any) => {
    // TODO: Implement delete functionality
    console.log('Delete document:', document);
  };

  const handleEditGroup = (group: any) => {
    openModal('document-upload', { 
      defaultFolderId: group.folder_id,
      defaultGroupId: group.id,
      editingGroup: group
    });
  };

  const handleDeleteGroup = (group: any) => {
    // TODO: Implement delete functionality
    console.log('Delete group:', group);
  };

  const headerProps = {
    title: "Documentación de Diseño"
  };

  if (foldersLoading || groupsLoading || documentsLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando documentos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktop
          title="Documentación de Diseño"
          icon={<FileText className="w-5 h-5" />}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          primaryActionLabel="Nueva Carpeta"
          onPrimaryActionClick={() => openModal('document-folder', {})}
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
              description: "Exporta documentos individuales o carpetas completas para compartir con clientes, contratistas o miembros del equipo manteniendo la estructura organizativa original."
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: "Colaboración en equipo en tiempo real",
              description: "Todo el equipo puede acceder simultáneamente a los documentos con sincronización automática de cambios y un sistema de comentarios colaborativos que mejora la comunicación."
            }
          ]}
          className="md:hidden"
        />

        {/* Quick Actions - Mobile */}
        <div className="md:hidden flex gap-2">
          <Button 
            onClick={() => openModal('document-folder', {})}
            className="flex-1"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Nueva Carpeta
          </Button>
          <Button 
            variant="outline"
            onClick={() => openModal('document-upload', {})}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir Archivos
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Document Folders Section */}
          {filteredFolders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Carpetas de Documentos</h2>
                <Button 
                  variant="outline"
                  onClick={() => openModal('document-upload', {})}
                  className="hidden md:flex"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Documentos
                </Button>
              </div>
              <div className="grid gap-6">
                {filteredFolders.map((folder) => (
                  <DocumentFolderCard
                    key={folder.id}
                    folder={folder.name}
                    documents={documentsByFolder[folder.id] || []}
                    projectId={userData?.preferences?.last_project_id || ''}
                    organizationId={userData?.preferences?.last_organization_id || ''}
                    onEdit={handleEditDocument}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Document Groups Section */}
          {filteredGroups.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Grupos de Documentos</h2>
              <div className="grid gap-4">
                {filteredGroups.map((group) => (
                  <DocumentGroupCard
                    key={group.id}
                    group={group}
                    onEdit={handleEditGroup}
                    onDelete={handleDeleteGroup}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredFolders.length === 0 && filteredGroups.length === 0 && (
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="No hay documentos de diseño"
              description="Comienza creando tu primera carpeta para organizar los documentos del proyecto de diseño."
            />
          )}
        </div>
      </div>
    </Layout>
  );
}