import React, { useState, useMemo, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { Layout } from '@/components/layout/desktop/Layout';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Button } from '@/components/ui/button';

import { Table } from '@/components/ui-custom/Table';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';

import { useDesignDocuments } from '@/hooks/use-design-documents';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { 
  FileText, 
  FolderOpen,
  Upload,
  Archive,
  Plus
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

  const { data: allDocuments, isLoading: documentsLoading } = useDesignDocuments();

  // Filter data based on search term
  const filteredFolders = useMemo(() => {
    if (!folders) return [];
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [folders, searchTerm]);



  // Group documents by folder for DocumentFolderCard
  const documentsByFolder = useMemo(() => {
    if (!allDocuments || !filteredFolders) return {};
    
    const grouped: { [folderId: string]: any[] } = {};
    
    filteredFolders.forEach(folder => {
      grouped[folder.id] = allDocuments.filter(doc => doc.folder_id === folder.id);
    });
    
    return grouped;
  }, [allDocuments, filteredFolders]);





  const headerProps = {
    title: "Documentación",
    actionButton: {
      label: "Nueva Carpeta",
      icon: Plus,
      onClick: () => openModal('document-folder', {})
    }
  };

  // Debug logging
  console.log('DesignDocumentation - Debug data:', {
    foldersLoading,
    documentsLoading,
    folders,
    allDocuments,
    filteredFolders
  });

  if (foldersLoading || documentsLoading) {
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

        {/* Table with TableTopBar - Always show table */}
        <Table
            columns={[
              {
                key: 'type',
                label: 'Tipo',
                sortable: true,
                render: (item: any) => (
                  <div className="flex items-center gap-2">
                    {item.type === 'folder' ? (
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-xs font-medium">
                      Carpeta
                    </span>
                  </div>
                )
              },
              {
                key: 'name',
                label: 'Nombre',
                sortable: true,
                render: (item: any) => (
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.type === 'folder' && (
                      <div className="text-xs text-muted-foreground">
                        {(documentsByFolder[item.id] || []).length} documentos
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'created_at',
                label: 'Fecha de Creación',
                sortable: true,
                render: (item: any) => (
                  <span className="text-sm text-muted-foreground">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('es-AR') : 'N/A'}
                  </span>
                )
              },
              {
                key: 'actions',
                label: 'Acciones',
                render: (item: any) => (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        openModal('document-upload', { defaultFolderId: item.id });
                      }}
                      className="text-xs font-normal"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Edit folder functionality
                        console.log('Edit folder:', item);
                      }}
                      className="text-xs font-normal text-red-600 hover:text-red-700"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                )
              }
            ]}
            data={filteredFolders.map(folder => ({ ...folder, type: 'folder' }))}
            isLoading={foldersLoading || documentsLoading}
            defaultSort={{ key: 'name', direction: 'asc' }}
            topBar={{
              showSearch: true,
              searchValue: searchTerm,
              onSearchChange: setSearchTerm
            }}
            emptyState={
              <EmptyState
                icon={<FolderOpen className="w-12 h-12" />}
                title="No hay carpetas de documentos"
                description="Comienza creando tu primera carpeta para organizar los documentos del proyecto."
                action={
                  <Button 
                    onClick={() => openModal('document-folder', {})}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Carpeta
                  </Button>
                }
              />
            }
          />
      </div>
    </Layout>
  );
}