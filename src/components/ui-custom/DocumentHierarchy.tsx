import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDesignDocumentFolders, useDeleteDesignDocumentFolder } from '@/hooks/use-design-document-folders';

import { useDesignDocuments, useDesignDocumentsByFolder, useDeleteDesignDocument } from '@/hooks/use-design-documents';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
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
  Clock,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentHierarchyProps {
  className?: string;
  onDocumentSelect?: (document: any) => void;
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

export function DocumentHierarchy({ className, onDocumentSelect }: DocumentHierarchyProps) {
  const [expandedFolders, setExpandedFolders] = useState<ExpandedState>({});
  const [expandedGroups, setExpandedGroups] = useState<ExpandedState>({});
  const { openModal } = useGlobalModalStore();

  const { data: folders, isLoading: foldersLoading } = useDesignDocumentFolders();
  const deleteFolderMutation = useDeleteDesignDocumentFolder();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      // Find if this folder is a subfolder by checking if it has a parent_id
      const clickedFolder = folders?.find(f => f.id === folderId);
      const isSubfolder = clickedFolder?.parent_id;
      
      // If clicking the same folder that's already expanded, close it
      if (prev[folderId]) {
        return { ...prev, [folderId]: false };
      }
      
      // If it's a subfolder, just toggle it without affecting other folders
      if (isSubfolder) {
        return { ...prev, [folderId]: true };
      }
      
      // If it's a main folder, close all other main folders but keep subfolders open
      const newState: ExpandedState = { ...prev };
      
      // Close only main folders (those that don't have parent_id)
      const parentFolders = folders?.filter(folder => !folder.parent_id) || [];
      parentFolders.forEach(folder => {
        if (folder.id !== folderId) {
          newState[folder.id] = false;
        }
      });
      
      // Open the clicked folder
      newState[folderId] = true;
      
      return newState;
    });
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
          onDeleteFolder={(folderId) => deleteFolderMutation.mutate(folderId)}
          isDeleting={deleteFolderMutation.isPending}
          onDocumentSelect={onDocumentSelect}
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
  onDeleteFolder: (folderId: string) => void;
  isDeleting: boolean;
  onDocumentSelect?: (document: any) => void;
}

function FolderItemWithSubfolders({ 
  folder, 
  subfolders, 
  isExpanded, 
  onToggle, 
  expandedFolders, 
  expandedGroups, 
  onToggleFolder, 
  onToggleGroup,
  onDeleteFolder,
  isDeleting,
  onDocumentSelect
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
        <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onToggle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </div>

              <div className="flex items-center gap-2 min-w-0">
                {isExpanded ? (
                  <FolderOpen className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                ) : (
                  <FolderClosed className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                )}
                <span className="font-medium truncate">{folder.name}</span>
              </div>

              <Badge variant="outline" className="text-xs flex-shrink-0">
                {totalDocuments}
              </Badge>
            </div>

            {/* Mobile-optimized action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Show only essential actions on mobile, use dropdown for others */}
              <div className="hidden sm:flex items-center gap-2">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openModal('document-folder', { 
                    folderId: folder.id,
                    folderName: folder.name,
                    parentId: folder.parent_id,
                    mode: 'edit'
                  })}
                  className=""
                  title="Editar carpeta"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openModal('delete-confirmation', {
                    mode: 'simple',
                    title: 'Eliminar Carpeta',
                    description: `¿Estás seguro de que quieres eliminar la carpeta "${folder.name}"? Esta acción no se puede deshacer.`,
                    itemName: folder.name,
                    itemType: 'carpeta',
                    destructiveActionText: 'Eliminar Carpeta',
                    onConfirm: () => {
                      onDeleteFolder(folder.id);
                    },
                    isLoading: isDeleting
                  })}
                  className=" text-red-500 hover:text-red-700"
                  title="Eliminar carpeta"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Mobile dropdown menu */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => openModal('document-upload', { defaultFolderId: folder.id })}>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir archivo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openModal('document-folder', { parentId: folder.id, parentName: folder.name })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva subcarpeta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openModal('document-folder', { folderId: folder.id, folderName: folder.name, parentId: folder.parent_id, mode: 'edit' })}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar carpeta
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => openModal('delete-confirmation', {
                        mode: 'simple',
                        title: 'Eliminar Carpeta',
                        description: `¿Estás seguro de que quieres eliminar la carpeta "${folder.name}"? Esta acción no se puede deshacer.`,
                        itemName: folder.name,
                        itemType: 'carpeta',
                        destructiveActionText: 'Eliminar Carpeta',
                        onConfirm: () => { onDeleteFolder(folder.id); },
                        isLoading: isDeleting
                      })}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar carpeta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                          onDeleteFolder={onDeleteFolder}
                          isDeleting={isDeleting}
                          onDocumentSelect={onDocumentSelect}
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
                      onDocumentSelect={onDocumentSelect}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    No hay entregas en esta carpeta
                    <div className="mt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openModal('document-upload', { 
                          defaultFolderId: folder.id 
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
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Documentos sin entrega</h4>
                    <div className="bg-muted/30 rounded-lg border">
                      {ungroupedDocuments.map((document, index) => (
                        <div key={document.id} className={index !== ungroupedDocuments.length - 1 ? "border-b border-border/50" : ""}>
                          <DocumentItem document={document} onDocumentSelect={onDocumentSelect} />
                        </div>
                      ))}
                    </div>
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
  onDeleteFolder: (folderId: string) => void;
  isDeleting: boolean;
  onDocumentSelect?: (document: any) => void;
}

function FolderItem({ folder, isExpanded, onToggle, expandedGroups, onToggleGroup, isSubfolder = false, onDeleteFolder, isDeleting, onDocumentSelect }: FolderItemProps) {
  const { data: groups, isLoading: groupsLoading } = useDesignDocumentGroups(folder.id);
  const { data: folderDocuments } = useDesignDocumentsByFolder(folder.id);
  const { openModal } = useGlobalModalStore();



  // Documents that don't belong to any group
  const ungroupedDocuments = folderDocuments?.filter(doc => !doc.group_id) || [];
  const totalDocuments = (groups?.reduce((acc, group) => acc + (group.document_count || 0), 0) || 0) + ungroupedDocuments.length;

  return (
    <Card className="w-full">
      <CardHeader className="py-3 sm:py-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4" />
              ) : (
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
              )}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
              ) : (
                <FolderClosed className="h-4 w-4 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
              )}
              <span className="text-sm font-medium truncate">{folder.name}</span>
            </div>

            <Badge variant="outline" className="text-xs flex-shrink-0">
              {totalDocuments}
            </Badge>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('document-folder', { 
                  folderId: folder.id,
                  folderName: folder.name,
                  parentId: folder.parent_id,
                  mode: 'edit'
                })}
                className="h-7 w-7 p-0"
                title="Editar subcarpeta"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('delete-confirmation', {
                  mode: 'simple',
                  title: 'Eliminar Subcarpeta',
                  description: `¿Estás seguro de que quieres eliminar la subcarpeta "${folder.name}"? Esta acción no se puede deshacer.`,
                  itemName: folder.name,
                  itemType: 'subcarpeta',
                  destructiveActionText: 'Eliminar Subcarpeta',
                  onConfirm: () => {
                    onDeleteFolder(folder.id);
                  },
                  isLoading: isDeleting
                })}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                title="Eliminar subcarpeta"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Mobile dropdown */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => openModal('document-upload', { defaultFolderId: folder.id })}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir archivo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openModal('document-folder', { parentId: folder.id, parentName: folder.name })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva subcarpeta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openModal('document-folder', { folderId: folder.id, folderName: folder.name, parentId: folder.parent_id, mode: 'edit' })}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar subcarpeta
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => openModal('delete-confirmation', {
                      mode: 'simple',
                      title: 'Eliminar Subcarpeta',
                      description: `¿Estás seguro de que quieres eliminar la subcarpeta "${folder.name}"? Esta acción no se puede deshacer.`,
                      itemName: folder.name,
                      itemType: 'subcarpeta',
                      destructiveActionText: 'Eliminar Subcarpeta',
                      onConfirm: () => { onDeleteFolder(folder.id); },
                      isLoading: isDeleting
                    })}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar subcarpeta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                    onDocumentSelect={onDocumentSelect}
                  />
                ))
              ) : (
                <div className="text-center py-3 text-sm text-muted-foreground">
                  <Package className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  No hay entregas en esta carpeta
                  <div className="mt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openModal('document-upload', { 
                        defaultFolderId: folder.id 
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
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Documentos sin entrega</h4>
                  <div className="bg-muted/30 rounded-lg border">
                    {ungroupedDocuments.map((document, index) => (
                      <div key={document.id} className={index !== ungroupedDocuments.length - 1 ? "border-b border-border/50" : ""}>
                        <DocumentItem document={document} onDocumentSelect={onDocumentSelect} />
                      </div>
                    ))}
                  </div>
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
  onDocumentSelect?: (document: any) => void;
}

function GroupItem({ group, folderId, isExpanded, onToggle, onDocumentSelect }: GroupItemProps) {
  const { data: groupDocuments } = useDesignDocuments(group.id);
  const { openModal } = useGlobalModalStore();

  return (
    <div className="mb-3 border rounded-lg">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full h-auto p-4 sm:p-3 justify-start hover:bg-muted/50"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
          )}
          <Package className="h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="font-medium truncate">{group.name}</span>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {groupDocuments?.length || 0}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="text-xs hidden sm:block">
            <span>Entrega</span>
          </Badge>
        </div>
      </Button>

      {isExpanded && (
        <div className="px-4 sm:px-3 pb-4 sm:pb-3">
          {groupDocuments && groupDocuments.length > 0 ? (
            <div className="bg-muted/30 rounded-lg border">
              {groupDocuments.map((document, index) => (
                <div key={document.id} className={index !== groupDocuments.length - 1 ? "border-b border-border/50" : ""}>
                  <DocumentItem document={document} onDocumentSelect={onDocumentSelect} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-4 text-sm text-muted-foreground">
              <Package className="h-8 w-8 sm:h-6 sm:w-6 mx-auto mb-2 opacity-50" />
              Esta entrega está vacía
              <div className="mt-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal('document-upload', { 
                      defaultFolderId: folderId,
                      defaultGroupId: group.id 
                    });
                  }}
                  className="h-8 px-4 text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Subir archivo
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DocumentItemProps {
  document: any;
  onDocumentSelect?: (document: any) => void;
}

function DocumentItem({ document, onDocumentSelect }: DocumentItemProps) {
  const { openModal } = useGlobalModalStore();
  const deleteDocumentMutation = useDeleteDesignDocument();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobado':
        return <Circle className="h-3 w-3 text-green-500 fill-current" />;
      case 'rechazado':
        return <Circle className="h-3 w-3 text-red-500 fill-current" />;
      case 'en_revision':
        return <Circle className="h-3 w-3 text-blue-500 fill-current" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400 fill-current" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
  };

  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const handleEdit = () => {
    openModal('document-upload', { 
      editingDocument: document,
      defaultFolderId: document.folder_id 
    });
  };

  const handleDelete = () => {
    openModal('delete-confirmation', {
      title: 'Eliminar documento',
      description: `¿Estás seguro de que deseas eliminar el documento "${document.name}"?`,
      destructiveActionText: 'Eliminar',
      onConfirm: async () => {
        try {
          await deleteDocumentMutation.mutateAsync(document.id);
        } catch (error) {
        }
      }
    });
  };

  const handleView = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  return (
    <div className="px-3 py-3 hover:bg-muted/50 rounded-md transition-colors">
      {/* Mobile-first layout: stack content vertically on small screens */}
      <div className="flex items-start gap-3">
        {/* Status dot and file icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusIcon(document.status)}
          <FileText className="h-4 w-4 text-blue-500" />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* File name - always visible and clickable */}
          <div 
            className="font-medium truncate mb-1 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onDocumentSelect?.(document)}
            title="Click para previsualizar"
          >
            {document.name}
          </div>
          
          {/* Secondary info row - responsive layout */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Status text */}
            <span className="flex-shrink-0">
              {document.status === 'aprobado' && 'Aprobado'}
              {document.status === 'rechazado' && 'Rechazado'} 
              {document.status === 'en_revision' && 'En revisión'}
              {!document.status && 'Pendiente'}
            </span>
            
            {/* File size - hide on very small screens */}
            <span className="hidden xs:inline-block flex-shrink-0">
              {formatFileSize(document.file_size)}
            </span>
            
            {/* Date - hide on small screens, show abbreviated on medium */}
            <span className="hidden sm:inline-block flex-shrink-0">
              {formatDate(document.created_at)}
            </span>
          </div>
        </div>
        
        {/* Actions - always visible on the right */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Primary action - Download */}
          <Button 
            variant="ghost" 
            size="sm" 
            className=" hover:bg-blue-50 sm:h-6 sm:w-6"
            onClick={handleDownload}
            title="Descargar archivo"
          >
            <Download className="h-4 w-4 sm:h-3 sm:w-3" />
          </Button>
          
          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className=" hover:bg-gray-50 sm:h-6 sm:w-6"
                title="Más opciones"
              >
                <MoreVertical className="h-4 w-4 sm:h-3 sm:w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" />
                Ver archivo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}