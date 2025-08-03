import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDesignDocumentFolders } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups } from '@/hooks/use-design-document-groups';
import { useDesignDocuments, useDesignDocumentsByFolder } from '@/hooks/use-design-documents';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { 
  FolderOpen,
  FolderClosed,
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  Upload,
  Download,
  MoreVertical,
  Package,
  Circle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface DocumentHierarchyProps {
  className?: string;
}

interface ExpandedState {
  [key: string]: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
    case 'aprobado':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
    case 'rechazado':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
    case 'en_revision':
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
    case 'aprobado':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'failed':
    case 'rechazado':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'running':
    case 'en_revision':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export function DocumentHierarchy({ className }: DocumentHierarchyProps) {
  const [expandedFolders, setExpandedFolders] = useState<ExpandedState>({});
  const [expandedGroups, setExpandedGroups] = useState<ExpandedState>({});
  const { openModal } = useGlobalModalStore();

  const { data: folders, isLoading: foldersLoading } = useDesignDocumentFolders();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  if (foldersLoading) {
    return <div className="text-center py-8">Cargando carpetas...</div>;
  }

  if (!folders || folders.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen className="w-12 h-12" />}
        title="No hay carpetas de documentos"
        description="Comienza creando tu primera carpeta para organizar los documentos del proyecto."
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          isExpanded={expandedFolders[folder.id] || false}
          onToggle={() => toggleFolder(folder.id)}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
        />
      ))}
    </div>
  );
}

interface FolderItemProps {
  folder: any;
  isExpanded: boolean;
  onToggle: () => void;
  expandedGroups: ExpandedState;
  onToggleGroup: (groupId: string) => void;
}

function FolderItem({ folder, isExpanded, onToggle, expandedGroups, onToggleGroup }: FolderItemProps) {
  const { data: groups, isLoading: groupsLoading } = useDesignDocumentGroups(folder.id);
  const { data: folderDocuments } = useDesignDocumentsByFolder(folder.id);
  const { openModal } = useGlobalModalStore();

  // Debug logging with userData
  const { data: userData } = useCurrentUser();
  console.log('FolderItem Debug:', {
    folderId: folder.id,
    folderName: folder.name,
    userData: userData,
    projectId: userData?.preferences?.last_project_id,
    organizationId: userData?.preferences?.last_organization_id,
    groups: groups,
    groupsCount: groups?.length || 0,
    folderDocuments: folderDocuments,
    documentsCount: folderDocuments?.length || 0,
    isExpanded,
    groupsLoading
  });

  // Documents that don't belong to any group
  const ungroupedDocuments = folderDocuments?.filter(doc => !doc.group_id) || [];
  
  const totalDocuments = (groups?.reduce((acc, group) => acc + (group.document_count || 0), 0) || 0) + ungroupedDocuments.length;

  return (
    <Card className="w-full">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              {isExpanded ? (
                <FolderOpen className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
              ) : (
                <FolderClosed className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
              )}
              <span className="font-medium">{folder.name}</span>
            </div>

            <Badge variant="outline" className="text-xs">
              {totalDocuments} archivo{totalDocuments !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('document-folder', { 
                parentId: folder.id,
                parentName: folder.name
              })}
              className="h-8 px-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Nueva Subcarpeta
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('document-upload', { 
                defaultFolderId: folder.id 
              })}
              className="h-8 px-2 text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Subir
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          <div className="ml-6 space-y-2">
            {groupsLoading ? (
              <div className="text-sm text-muted-foreground py-2">Cargando entregas...</div>
            ) : (
              <>
                {/* Document Groups (Entregas) */}
                {groups && groups.length > 0 ? (
                  groups.map((group) => (
                    <GroupItem
                      key={group.id}
                      group={group}
                      folderId={folder.id}
                      isExpanded={expandedGroups[group.id] || false}
                      onToggle={() => onToggleGroup(group.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    No hay entregas en esta carpeta
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal('document-group', { 
                          folderId: folder.id 
                        })}
                        className="h-8 px-3 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Crear Primera Entrega
                      </Button>
                    </div>
                  </div>
                )}

                {/* Ungrouped Documents */}
                {ungroupedDocuments.length > 0 && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Documentos sin agrupar</span>
                      <Badge variant="outline" className="text-xs">
                        {ungroupedDocuments.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {ungroupedDocuments.map((doc) => (
                        <DocumentItem key={doc.id} document={doc} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state for folder */}
                {(!groups || groups.length === 0) && ungroupedDocuments.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    Esta carpeta está vacía
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface GroupItemProps {
  group: any;
  folderId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function GroupItem({ group, folderId, isExpanded, onToggle }: GroupItemProps) {
  const { data: documents } = useDesignDocuments(group.id);
  const { openModal } = useGlobalModalStore();
  
  // Debug logging
  console.log('GroupItem Debug:', {
    groupId: group.id,
    groupName: group.name,
    folderId,
    documents: documents,
    documentsCount: documents?.length || 0,
    isExpanded
  });
  
  // Documents for this specific group
  const groupDocuments = documents || [];

  // Simulate deployment status based on document status
  const getDeploymentStatus = () => {
    if (groupDocuments.length === 0) return 'pending';
    const allApproved = groupDocuments.every(doc => doc.status === 'aprobado');
    const anyFailed = groupDocuments.some(doc => doc.status === 'rechazado');
    const anyInReview = groupDocuments.some(doc => doc.status === 'en_revision');
    
    if (allApproved) return 'completed';
    if (anyFailed) return 'failed';
    if (anyInReview) return 'running';
    return 'pending';
  };

  const status = getDeploymentStatus();

  return (
    <div className="border rounded-lg p-3 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-5 w-5 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="text-sm font-medium">{group.name}</span>
          </div>

          <Badge className={`text-xs ${getStatusColor(status)}`}>
            {status === 'completed' ? 'Completado' :
             status === 'failed' ? 'Falló' :
             status === 'running' ? 'En progreso' : 'Pendiente'}
          </Badge>

          <Badge variant="outline" className="text-xs">
            {groupDocuments.length} archivo{groupDocuments.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('document-upload', { 
              defaultFolderId: folderId,
              defaultGroupId: group.id 
            })}
            className="h-7 px-2 text-xs"
          >
            <Upload className="h-3 w-3 mr-1" />
            Subir
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-2 space-y-1">
          {groupDocuments.length > 0 ? (
            groupDocuments.map((doc) => (
              <DocumentItem key={doc.id} document={doc} />
            ))
          ) : (
            <div className="text-xs text-muted-foreground py-2">
              No hay documentos en esta entrega
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DocumentItemProps {
  document: any;
}

function DocumentItem({ document }: DocumentItemProps) {
  const handleDownload = () => {
    if (!document.file_url) return;
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.file_name;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="flex items-center justify-between p-2 rounded border bg-card/50">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
        <span className="text-xs font-medium truncate">{document.file_name}</span>
        <Badge variant="outline" className="text-xs flex-shrink-0">
          v{document.version_number}
        </Badge>
        <Badge className={`text-xs flex-shrink-0 ${getStatusColor(document.status)}`}>
          {document.status === 'aprobado' ? 'Aprobado' :
           document.status === 'rechazado' ? 'Rechazado' :
           document.status === 'en_revision' ? 'En revisión' : 'Pendiente'}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">
          {format(new Date(document.created_at), 'dd MMM', { locale: es })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-6 w-6 p-0"
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}