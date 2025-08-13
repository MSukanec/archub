import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Folder, 
  FolderOpen, 
  ArrowLeft,
  FileText,
  File,
  Image
} from 'lucide-react';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups } from '@/hooks/use-design-document-groups';
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
  
  // Obtener grupos y documentos de la carpeta actual
  const { data: groups } = useDesignDocumentGroups(
    currentLevel.type === 'folder' || currentLevel.type === 'subfolder' ? currentLevel.id : undefined
  );
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

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return FileText;
    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
    return File;
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
    <div className={`space-y-4 ${className}`}>
      {/* Breadcrumb Navigation */}
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

      {/* Content Area */}
      <div className="space-y-3">
        {/* Show root folders */}
        {isRoot && rootFolders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Carpetas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rootFolders.map((folder) => (
                <Card 
                  key={folder.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigateToFolder(folder)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{folder.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(folder.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Show subfolders if any */}
        {!isRoot && subFolders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Subcarpetas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subFolders.map((folder) => (
                <Card 
                  key={folder.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigateToFolder(folder)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/50">
                        <Folder className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{folder.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(folder.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Show groups and documents */}
        {!isRoot && (
          <div className="space-y-4">
            {groups?.map((group) => (
              <div key={group.id} className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {group.name}
                  {group.document_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {group.document_count}
                    </Badge>
                  )}
                </h3>
                
                {/* Documents in this group */}
                {documents?.filter(doc => doc.group_id === group.id).map((document) => {
                  const FileIcon = getFileIcon(document.file_type);
                  return (
                    <Card 
                      key={document.id}
                      className="cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => onDocumentSelect?.(document)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted/50">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{document.file_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(document.file_size)}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(document.status)}`}
                              >
                                {getStatusText(document.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}

            {/* Ungrouped documents */}
            {documents?.filter(doc => !doc.group_id).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Documentos</h3>
                <div className="space-y-2">
                  {documents?.filter(doc => !doc.group_id).map((document) => {
                    const FileIcon = getFileIcon(document.file_type);
                    return (
                      <Card 
                        key={document.id}
                        className="cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => onDocumentSelect?.(document)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/50">
                              <FileIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{document.file_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(document.file_size)}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getStatusColor(document.status)}`}
                                >
                                  {getStatusText(document.status)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
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

        {!isRoot && (!groups || groups.length === 0) && (!documents || documents.length === 0) && (
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
  );
}