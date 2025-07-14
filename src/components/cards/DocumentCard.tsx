import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      <div className="flex items-center gap-3">
        {/* Left side - Creator avatar */}
        <div className="shrink-0">
          <Avatar className="w-8 h-8">
            <AvatarImage src={creator?.avatar_url || ""} />
            <AvatarFallback className="text-xs bg-[var(--accent)] text-[var(--accent-foreground)]">
              {getInitials(creator?.full_name || 'U')}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Middle content */}
        <div className="flex-1 min-w-0">
          {/* File name and type */}
          <div className="flex items-center gap-2 mb-1">
            {getFileIcon(file_type || '')}
            <span className="font-medium text-[var(--text-default)] truncate">
              {file_name}
            </span>
          </div>

          {/* Creator and date info */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="truncate">
              {creator?.full_name || 'Usuario'}
            </span>
            <span>•</span>
            <span>
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default DocumentCard;