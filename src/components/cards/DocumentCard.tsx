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
  } else if (fileType?.includes('pdf')) {
  } else if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) {
  } else {
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
          onClick: () => onView?.(document)
        },
        {
          label: "Editar",
          onClick: () => onEdit?.(document)
        },
        {
          label: "Eliminar",
          onClick: () => onDelete?.(document)
        }
      ]}
    >
        {/* File icon */}
          {getFileIcon(file_type || '')}
        </div>

        {/* Content */}
          {/* Document name (user-defined) */}
            {document.name || file_name}
          </div>

          {/* Real file name */}
            {file_name}
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default DocumentCard;