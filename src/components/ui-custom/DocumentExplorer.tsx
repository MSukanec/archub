import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Folder, 
  ArrowLeft,
  ChevronRight,
  FileText,
  FolderPlus,
  Edit,
  Trash2
} from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';
import { useDesignDocumentsByFolder } from '@/hooks/use-design-documents';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';



interface DocumentExplorerProps {
  className?: string;
  onDocumentSelect?: (document: any) => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'root' | 'folder' | 'subfolder';
}

export function DocumentExplorer({ className, onDocumentSelect }: DocumentExplorerProps) {
  const [navigation, setNavigation] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'Documentos', type: 'root' }
  ]);

  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const currentLevel = navigation[navigation.length - 1];
  const isRoot = currentLevel.type === 'root';
  
  // Obtener carpetas principales solo si estamos en root
  const { data: allFolders } = useDesignDocumentFolders();
  const rootFolders = allFolders?.filter(folder => !folder.parent_id) || [];
  
  // Obtener subcarpetas si estamos en una carpeta
  const subFolders = allFolders?.filter(folder => folder.parent_id === currentLevel.id) || [];
  
  // Obtener documentos de la carpeta actual
  const { data: documents } = useDesignDocumentsByFolder(
    currentLevel.type === 'folder' || currentLevel.type === 'subfolder' ? currentLevel.id : undefined
  );

  const navigateToFolder = (folder: any) => {
    const newItem: BreadcrumbItem = {
      id: folder.id,
      name: folder.name,
      type: folder.parent_id ? 'subfolder' : 'folder'
    };
    setNavigation([...navigation, newItem]);
  };

  const navigateBack = () => {
    if (navigation.length > 1) {
      setNavigation(navigation.slice(0, -1));
    }
  };

  const navigateTo = (index: number) => {
    setNavigation(navigation.slice(0, index + 1));
  };

  // Modal functions
  const { openModal } = useGlobalModalStore();
  
  const openNewFolderModal = () => {
    const parentId = currentLevel.type !== 'root' ? currentLevel.id : undefined;
    const parentName = currentLevel.type !== 'root' ? currentLevel.name : undefined;
    
    openModal('document-folder', {
      parentId,
      parentName
    });
  };
  
  const openEditFolderModal = (folder: any, e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('document-folder', {
      editingFolder: {
        id: folder.id,
        name: folder.name
      }
    });
  };
  
  const openDeleteFolderModal = (folder: any, e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('delete-confirmation', {
      itemType: 'carpeta',
      itemName: folder.name,
      onConfirm: () => {
        // TODO: Implement delete folder logic
      }
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'aprobado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'en_revision': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rechazado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
    <ScrollArea className={`h-full ${className}`}>
      <div className="space-y-4 p-4">
        {/* Header with Navigation and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isRoot && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={navigateBack}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              {navigation.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <span className="text-muted-foreground">/</span>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateTo(index)}
                    className="h-8 px-2 font-medium"
                    disabled={index === navigation.length - 1}
                  >
                    {item.name}
                  </Button>
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Nueva Carpeta Button */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={openNewFolderModal}
            className="h-8 px-3 text-xs"
          >
            <FolderPlus className="h-3 w-3 mr-1" />
            Nueva carpeta
          </Button>
        </div>

        {/* Content Area */}
        <div className="space-y-3">
        {/* Show root folders */}
        {isRoot && rootFolders.length > 0 && (
          <div className="space-y-2">
            <div className="space-y-2">
              {rootFolders.map((folder) => (
                <div 
                  key={folder.id} 
                  className="group flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border border-border/50"
                  onClick={() => navigateToFolder(folder)}
                >
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Folder className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-sm">{folder.name}</h4>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className=" hover:bg-primary/10"
                      onClick={(e) => openEditFolderModal(folder, e)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className=" hover:bg-destructive/10"
                      onClick={(e) => openDeleteFolderModal(folder, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:opacity-50" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show subfolders if any */}
        {!isRoot && subFolders.length > 0 && (
          <div className="space-y-2">
            <div className="space-y-2">
              {subFolders.map((folder) => (
                <div 
                  key={folder.id} 
                  className="group flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border border-border/50"
                  onClick={() => navigateToFolder(folder)}
                >
                  <div className="p-1.5 rounded-lg bg-secondary/50">
                    <Folder className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-sm">{folder.name}</h4>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className=" hover:bg-primary/10"
                      onClick={(e) => openEditFolderModal(folder, e)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className=" hover:bg-destructive/10"
                      onClick={(e) => openDeleteFolderModal(folder, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:opacity-50" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-sm">{folder.name}</h4>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show documents */}
        {!isRoot && documents && documents.length > 0 && (
          <div className="space-y-1">
            {documents.map((document) => (
              <Button
                key={document.id}
                variant="ghost"
                size="sm"
                onClick={() => onDocumentSelect?.(document)}
                className="h-8 px-3 text-xs font-normal flex items-center justify-between w-full text-left"
              >
                <span className="text-sm font-medium truncate flex-1 pr-2 text-left">{document.file_name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {format(new Date(document.created_at), 'dd MMM', { locale: es })}
                </span>
              </Button>
            ))}
          </div>
        )}

        {/* Empty states */}
        {isRoot && rootFolders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay carpetas</h3>
              <p className="text-muted-foreground">
                Crea tu primera carpeta de documentos
              </p>
            </CardContent>
          </Card>
        )}

        {!isRoot && (!documents || documents.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin documentos</h3>
              <p className="text-muted-foreground">
                Esta carpeta no contiene documentos
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </ScrollArea>
  );
}