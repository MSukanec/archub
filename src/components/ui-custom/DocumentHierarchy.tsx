import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDesignDocumentFolders, useDeleteDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useDesignDocumentGroups } from '@/hooks/use-design-document-groups';
import { useDesignDocuments, useDesignDocumentsByFolder, useDeleteDesignDocument } from '@/hooks/use-design-documents';
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
}

interface ExpandedState {
  [key: string]: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
    case 'aprobado':
    case 'failed':
    case 'rechazado':
    case 'running':
    case 'en_revision':
    default:
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
  }

  if (!folders || folders.length === 0) {
    return (
      <EmptyState
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
  isDeleting
}: FolderItemWithSubfoldersProps) {
  const { data: groups, isLoading: groupsLoading } = useDesignDocumentGroups(folder.id);
  const { data: folderDocuments } = useDesignDocumentsByFolder(folder.id);
  const { openModal } = useGlobalModalStore();



  // Documents that don't belong to any group
  const ungroupedDocuments = folderDocuments?.filter(doc => !doc.group_id) || [];
  const totalDocuments = (groups?.reduce((acc, group) => acc + (group.document_count || 0), 0) || 0) + ungroupedDocuments.length;

  return (
                {isExpanded ? (
                ) : (
                )}
              </div>

                {isExpanded ? (
                ) : (
                )}
              </div>

                {totalDocuments} archivo{totalDocuments !== 1 ? 's' : ''}
              </Badge>
            </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('document-folder', { 
                  parentId: folder.id,
                  parentName: folder.name
                })}
              >
                Nueva Subcarpeta
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('document-upload', { 
                  defaultFolderId: folder.id 
                })}
              >
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
              >
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
              >
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
            {groupsLoading ? (
            ) : (
              <>
                {/* Subfolders */}
                {subfolders.length > 0 && (
                    {subfolders.map((subfolder) => (
                        <FolderItem
                          folder={subfolder}
                          isExpanded={expandedFolders[subfolder.id] || false}
                          onToggle={() => onToggleFolder(subfolder.id)}
                          expandedGroups={expandedGroups}
                          onToggleGroup={onToggleGroup}
                          isSubfolder={true}
                          onDeleteFolder={onDeleteFolder}
                          isDeleting={isDeleting}
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
                    No hay entregas en esta carpeta
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openModal('document-upload', { 
                          defaultFolderId: folder.id 
                        })}
                      >
                        Crear Primera Entrega
                      </Button>
                    </div>
                  </div>
                )}

                {/* Ungrouped Documents */}
                {ungroupedDocuments.length > 0 && (
                      {ungroupedDocuments.map((document, index) => (
                        <div key={document.id} className={index !== ungroupedDocuments.length - 1 ? "border-b border-border/50" : ""}>
                          <DocumentItem document={document} />
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
}

function FolderItem({ folder, isExpanded, onToggle, expandedGroups, onToggleGroup, isSubfolder = false, onDeleteFolder, isDeleting }: FolderItemProps) {
  const { data: groups, isLoading: groupsLoading } = useDesignDocumentGroups(folder.id);
  const { data: folderDocuments } = useDesignDocumentsByFolder(folder.id);
  const { openModal } = useGlobalModalStore();



  // Documents that don't belong to any group
  const ungroupedDocuments = folderDocuments?.filter(doc => !doc.group_id) || [];
  const totalDocuments = (groups?.reduce((acc, group) => acc + (group.document_count || 0), 0) || 0) + ungroupedDocuments.length;

  return (
              {isExpanded ? (
              ) : (
              )}
            </div>

              {isExpanded ? (
              ) : (
              )}
            </div>

              {totalDocuments} archivo{totalDocuments !== 1 ? 's' : ''}
            </Badge>
          </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('document-folder', { 
                parentId: folder.id,
                parentName: folder.name
              })}
            >
              Nueva Subcarpeta
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal('document-upload', { 
                defaultFolderId: folder.id 
              })}
            >
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
            >
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
            >
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
          {groupsLoading ? (
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
                  No hay entregas en esta carpeta
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openModal('document-upload', { 
                        defaultFolderId: folder.id 
                      })}
                    >
                      Crear Primera Entrega
                    </Button>
                  </div>
                </div>
              )}

              {/* Ungrouped Documents */}
              {ungroupedDocuments.length > 0 && (
                    {ungroupedDocuments.map((document, index) => (
                      <div key={document.id} className={index !== ungroupedDocuments.length - 1 ? "border-b border-border/50" : ""}>
                        <DocumentItem document={document} />
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
}

function GroupItem({ group, folderId, isExpanded, onToggle }: GroupItemProps) {
  const { data: groupDocuments } = useDesignDocuments(group.id);
  const { openModal } = useGlobalModalStore();

  return (
      <Button
        variant="ghost"
        onClick={onToggle}
      >
          {isExpanded ? (
          ) : (
          )}
            {groupDocuments?.length || 0} archivo{(groupDocuments?.length || 0) !== 1 ? 's' : ''}
          </Badge>
        </div>
            <span>Entrega</span>
          </Badge>
        </div>
      </Button>

      {isExpanded && (
          {groupDocuments && groupDocuments.length > 0 ? (
              {groupDocuments.map((document, index) => (
                <div key={document.id} className={index !== groupDocuments.length - 1 ? "border-b border-border/50" : ""}>
                  <DocumentItem document={document} />
                </div>
              ))}
            </div>
          ) : (
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
  const { openModal } = useGlobalModalStore();
  const deleteDocumentMutation = useDeleteDesignDocument();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobado':
      case 'rechazado':
      case 'en_revision':
      default:
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
          console.log('Documento eliminado exitosamente:', document.id);
        } catch (error) {
          console.error('Error al eliminar documento:', error);
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
        {/* Status dot */}
          {getStatusIcon(document.status)}
        </div>
        
        {/* File icon */}
        
        {/* File name */}
          {document.name}
        </div>
      </div>
      
      {/* Status text */}
        {document.status === 'aprobado' && 'Aprobado'}
        {document.status === 'rechazado' && 'Rechazado'}
        {document.status === 'en_revision' && 'En revisión'}
        {!document.status && 'Pendiente'}
      </div>
      
      {/* File size */}
        {formatFileSize(document.file_size)}
      </div>
      
      {/* Date */}
        {formatDate(document.created_at)}
      </div>
      
      {/* Actions */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDownload}
        >
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
            >
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuItem onClick={handleView}>
              Ver archivo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              Editar
            </DropdownMenuItem>
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}