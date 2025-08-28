import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, FileImage, FileSpreadsheet, File, Eye, Edit, Trash2 } from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type DocumentCardProps = {
  document: {
    id: string;
    name?: string;
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
    return <FileImage className="h-5 w-5 text-[var(--accent)]" />;
  } else if (fileType?.includes('pdf')) {
    return <FileText className="h-5 w-5 text-[var(--accent)]" />;
  } else if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-[var(--accent)]" />;
  } else {
    return <File className="h-5 w-5 text-[var(--accent)]" />;
  }
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



const DocumentCard: React.FC<DocumentCardProps> = ({ document, onView, onEdit, onDelete }) => {
  const {
    file_name,
    created_at,
    creator,
    file_type
  } = document;

  // Format date
  const formattedDate = format(new Date(created_at), 'dd MMM yyyy', { locale: es });

  return (
    <SwipeableCard
      actions={[
        {
          label: "Ver",
          icon: <Eye className="w-4 h-4" />,
          onClick: () => onView?.(document)
        },
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit?.(document)
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          onClick: () => onDelete?.(document)
        }
      ]}
    >
      <div className="flex items-center gap-3 bg-transparent border border-input rounded-lg p-3 mb-2">
        {/* File icon */}
        <div className="shrink-0">
          {getFileIcon(file_type || '')}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Document name (user-defined) */}
          <div className="font-medium text-foreground truncate mb-1">
            {document.name || file_name}
          </div>

          {/* Real file name */}
          <div className="text-xs text-muted-foreground truncate">
            {file_name}
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default DocumentCard;