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

  // Filter folders to show only parent folders (no parent_id) and organize hierarchy
  const parentFolders = folders?.filter(folder => !folder.parent_id) || [];
  const subFolders = folders?.filter(folder => folder.parent_id) || [];

  return (
    <div className={`space-y-2 ${className}`}>
      {parentFolders.map((folder) => (
        <FolderItemWithSubfolders
          key={folder.id}
          folder={folder}
          subfolders={subFolders.filter(sub => sub.parent_id === folder.id)}
          isExpanded={expandedFolders[folder.id] || false}
          onToggle={() => toggleFolder(folder.id)}
          expandedFolders={expandedFolders}
          expandedGroups={expandedGroups}
          onToggleFolder={toggleFolder}
          onToggleGroup={toggleGroup}
        />
      ))}
    </div>
  );
}

interface FolderItemWithSubfoldersProps {
  folder: any;
  subfolders: any[];
  isExpanded: boolean;
  onToggle: () => void;
  expandedFolders: ExpandedState;
  expandedGroups: ExpandedState;
  onToggleFolder: (folderId: string) => void;
  onToggleGroup: (groupId: string) => void;
}

function FolderItemWithSubfolders({ 
  folder, 
  subfolders, 
  isExpanded, 
  onToggle, 
  expandedFolders, 
  expandedGroups, 
  onToggleFolder, 
  onToggleGroup 
}: FolderItemWithSubfoldersProps) {
  const { data: groups, isLoading: groupsLoading } = useDesignDocumentGroups(folder.id);
  const { data: folderDocuments } = useDesignDocumentsByFolder(folder.id);
  const { openModal } = useGlobalModalStore();

  // Documents that don't belong to any group
  const ungroupedDocuments = folderDocuments?.filter(doc => !doc.group_id) || [];
  const totalDocuments = (groups?.reduce((acc, group) => acc + (group.document_count || 0), 0) || 0) + ungroupedDocuments.length;

  return (
    <div className="space-y-2">
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
            {groupsLoading ? (
              <div className="text-sm text-muted-foreground py-2">Cargando entregas...</div>
            ) : (
              <>
                {/* Subfolders */}
                {subfolders.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {subfolders.map((subfolder) => (
                      <div key={subfolder.id} className="ml-6">
                        <FolderItem
                          folder={subfolder}
                          isExpanded={expandedFolders[subfolder.id] || false}
                          onToggle={() => onToggleFolder(subfolder.id)}
                          expandedGroups={expandedGroups}
                          onToggleGroup={onToggleGroup}
                          isSubfolder={true}
                        />
                      </div>
                    ))}
                  </div>
                )}

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
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Documentos sin entrega</h4>
                    {ungroupedDocuments.map((document) => (
                      <DocumentItem
                        key={document.id}
                        document={document}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

interface FolderItemProps {
  folder: any;
  isExpanded: boolean;
  onToggle: () => void;
  expandedGroups: ExpandedState;
  onToggleGroup: (groupId: string) => void;
  isSubfolder?: boolean;
}

function FolderItem({ folder, isExpanded, onToggle, expandedGroups, onToggleGroup, isSubfolder = false }: FolderItemProps) {
  const { data: groups, isLoading: groupsLoading } = useDesignDocumentGroups(folder.id);
  const { data: folderDocuments } = useDesignDocumentsByFolder(folder.id);
  const { openModal } = useGlobalModalStore();

  // Documents that don't belong to any group
  const ungroupedDocuments = folderDocuments?.filter(doc => !doc.group_id) || [];
  const totalDocuments = (groups?.reduce((acc, group) => acc + (group.document_count || 0), 0) || 0) + ungroupedDocuments.length;

  return (
    <Card className="w-full">
      <CardHeader className="py-2">
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
                <FolderOpen className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
              ) : (
                <FolderClosed className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
              )}
              <span className="text-sm font-medium">{folder.name}</span>
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
              className="h-7 px-2 text-xs"
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
              className="h-7 px-2 text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Subir
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3">
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
                <div className="text-center py-3 text-sm text-muted-foreground">
                  <Package className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  No hay entregas en esta carpeta
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal('document-group', { 
                        folderId: folder.id 
                      })}
                      className="h-7 px-3 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear Primera Entrega
                    </Button>
                  </div>
                </div>
              )}

              {/* Ungrouped Documents */}
              {ungroupedDocuments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Documentos sin entrega</h4>
                  {ungroupedDocuments.map((document) => (
                    <DocumentItem
                      key={document.id}
                      document={document}
                    />
                  ))}
                </div>
              )}
            </>
          )}
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
  const { data: groupDocuments } = useDesignDocuments(group.id);
  const { openModal } = useGlobalModalStore();

  return (
    <div className="mb-3 border rounded-lg">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full h-auto p-3 justify-start"
      >
        <div className="flex items-center gap-3 flex-1">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Package className="h-4 w-4" />
          <span className="font-medium">{group.name}</span>
          <Badge variant="outline" className="text-xs">
            {groupDocuments?.length || 0} archivo{(groupDocuments?.length || 0) !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(group.status)}>
            {getStatusIcon(group.status)}
            <span className="ml-1">{group.status}</span>
          </Badge>
        </div>
      </Button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {groupDocuments && groupDocuments.length > 0 ? (
            groupDocuments.map((document) => (
              <DocumentItem key={document.id} document={document} />
            ))
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Esta entrega está vacía
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
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-blue-500" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{document.name}</div>
          <div className="text-sm text-muted-foreground">
            {document.file_size && `${(document.file_size / 1024 / 1024).toFixed(1)} MB`}
            {document.created_at && (
              <span className="ml-2">
                {format(new Date(document.created_at), 'dd MMM yyyy', { locale: es })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}