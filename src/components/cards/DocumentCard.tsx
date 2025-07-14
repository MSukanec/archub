import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, FileImage, FileSpreadsheet, File, Eye, Edit, Trash2 } from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type DocumentCardProps = {
  document: {
    id: string;
    file_name: string;
    created_at: string;
    status: string;
    creator?: {
      full_name: string;
      avatar_url?: string;
    };
    group?: {
      name: string;
    };
    folder?: {
      name: string;
    };
    file_type?: string;
    file_size?: number;
  };
  onView?: (document: any) => void;
  onEdit?: (document: any) => void;
  onDelete?: (document: any) => void;
};

// Get file icon based on file type
const getFileIcon = (fileType: string) => {
  if (fileType?.startsWith('image/')) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  } else if (fileType?.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  } else if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  } else {
    return <File className="h-5 w-5 text-gray-500" />;
  }
};

// Get status badge configuration
const getStatusBadge = (status: string) => {
  const statusConfig = {
    pendiente: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', label: 'Pendiente' },
    en_revision: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', label: 'En Revisión' },
    aprobado: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', label: 'Aprobado' },
    rechazado: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', label: 'Rechazado' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
  return <Badge className={config.color}>{config.label}</Badge>;
};

// Utility function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onView, onEdit, onDelete }) => {
  const {
    file_name,
    created_at,
    status,
    creator,
    group,
    folder,
    file_type,
    file_size
  } = document;

  // Format date
  const formattedDate = format(new Date(created_at), 'dd MMM yyyy', { locale: es });

  return (
    <SwipeableCard
      actions={[
        {
          label: "Ver",
          icon: <Eye className="w-4 h-4" />,
          onClick: () => onView?.(document),
          className: "bg-blue-500"
        },
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit?.(document),
          className: "bg-yellow-500"
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          onClick: () => onDelete?.(document),
          className: "bg-red-500"
        }
      ]}
      className="bg-[var(--card-bg)] border border-[var(--card-border)]"
    >
      <div className="flex items-start gap-3 p-4">
        {/* Left side - File icon */}
        <div className="shrink-0 mt-1">
          {getFileIcon(file_type || '')}
        </div>

        {/* Middle content */}
        <div className="flex-1 min-w-0">
          {/* File name */}
          <div className="font-medium text-foreground truncate mb-1">
            {file_name}
          </div>

          {/* Document metadata */}
          <div className="flex items-center gap-2 mb-2">
            {/* Creator avatar and name */}
            <div className="flex items-center gap-2">
              <Avatar className="w-4 h-4">
                <AvatarImage src={creator?.avatar_url || ""} />
                <AvatarFallback className="text-xs">
                  {getInitials(creator?.full_name || 'U')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {creator?.full_name || 'Usuario'}
              </span>
            </div>

            {/* Date */}
            <span className="text-xs text-muted-foreground">
              • {formattedDate}
            </span>
          </div>

          {/* Location info */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {folder && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {folder.name}
              </Badge>
            )}
            {group && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {group.name}
              </Badge>
            )}
          </div>

          {/* File info and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {file_size && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file_size)}
                </span>
              )}
            </div>
            {getStatusBadge(status)}
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default DocumentCard;