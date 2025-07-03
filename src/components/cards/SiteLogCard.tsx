import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Edit, 
  Trash2, 
  Calendar, 
  MessageSquare, 
  Users, 
  Wrench, 
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Zap,
  Eye,
  EyeOff,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Package,
  Camera,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Entry type configurations
const entryTypes = {
  avance_de_obra: { 
    label: 'Avance de Obra', 
    icon: FileText, 
    color: 'bg-blue-100 text-blue-800 border-blue-200' 
  },
  visita_tecnica: { 
    label: 'Visita Técnica', 
    icon: ClipboardCheck, 
    color: 'bg-green-100 text-green-800 border-green-200' 
  },
  problema_detectado: { 
    label: 'Problema Detectado', 
    icon: AlertTriangle, 
    color: 'bg-red-100 text-red-800 border-red-200' 
  },
  pedido_material: { 
    label: 'Pedido Material', 
    icon: Package, 
    color: 'bg-orange-100 text-orange-800 border-orange-200' 
  },
  nota_climatica: { 
    label: 'Nota Climática', 
    icon: Cloud, 
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200' 
  },
  decision: { 
    label: 'Decisión', 
    icon: ClipboardCheck, 
    color: 'bg-purple-100 text-purple-800 border-purple-200' 
  },
  inspeccion: { 
    label: 'Inspección', 
    icon: Search, 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200' 
  },
  foto_diaria: { 
    label: 'Foto Diaria', 
    icon: Camera, 
    color: 'bg-pink-100 text-pink-800 border-pink-200' 
  },
  registro_general: { 
    label: 'Registro General', 
    icon: FileText, 
    color: 'bg-gray-100 text-gray-800 border-gray-200' 
  }
};

// Weather configurations
const weatherTypes = {
  sunny: { label: 'Soleado', icon: Sun, color: 'text-yellow-500' },
  partly_cloudy: { label: 'Parcialmente Nublado', icon: Cloud, color: 'text-blue-400' },
  cloudy: { label: 'Nublado', icon: Cloud, color: 'text-gray-500' },
  rain: { label: 'Lluvia', icon: CloudRain, color: 'text-blue-600' },
  storm: { label: 'Tormenta', icon: Zap, color: 'text-purple-600' },
  snow: { label: 'Nieve', icon: CloudSnow, color: 'text-blue-200' },
  fog: { label: 'Niebla', icon: Cloud, color: 'text-gray-400' },
  windy: { label: 'Ventoso', icon: Wind, color: 'text-green-500' },
  hail: { label: 'Granizo', icon: CloudSnow, color: 'text-gray-600' },
  none: { label: 'Sin especificar', icon: Cloud, color: 'text-gray-400' }
};

type SiteLogCardProps = {
  siteLog: {
    id: string;
    log_date: string;
    created_at: string;
    entry_type: string;
    weather: string | null;
    comments?: string;
    is_public: boolean;
    is_favorite: boolean;
    status: string;
    creator?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
    events?: Array<{
      id: string;
      event_type: { name: string };
      description: string;
    }>;
    attendees?: Array<{
      id: string;
      contact: { first_name: string; last_name: string };
      attendance_type: string;
    }>;
    equipment?: Array<{
      id: string;
      equipment: { name: string };
      quantity: number;
    }>;
  };
  onEdit?: (siteLog: any) => void;
  onDelete?: (siteLogId: string) => void;
  onToggleFavorite?: (siteLogId: string) => void;
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

// Utility function to truncate text
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const SiteLogCard: React.FC<SiteLogCardProps> = ({ 
  siteLog, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}) => {
  const {
    log_date,
    created_at,
    entry_type,
    weather,
    comments,
    is_public,
    is_favorite,
    status,
    creator,
    events = [],
    attendees = [],
    equipment = []
  } = siteLog;

  const entryTypeConfig = entryTypes[entry_type as keyof typeof entryTypes];
  const weatherConfig = weather ? weatherTypes[weather as keyof typeof weatherTypes] : null;
  
  // Format date and time
  const formattedDate = format(new Date(log_date), 'dd/MM/yyyy', { locale: es });
  const formattedTime = format(new Date(created_at), 'HH:mm', { locale: es });

  return (
    <div className="flex items-center gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 mb-2 transition-colors">
      {/* Left: Entry Type Icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {entryTypeConfig?.icon && (
            <entryTypeConfig.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      </div>

      {/* Center: Entry Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--card-fg)]">
            {entryTypeConfig?.label || 'Entrada'}
          </span>
          {weatherConfig && (
            <div className={`flex items-center gap-1 ${weatherConfig.color}`}>
              <weatherConfig.icon className="h-3 w-3" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{formattedDate} · {formattedTime}</span>
          <span>·</span>
          <span>{creator?.full_name || 'Usuario'}</span>
        </div>
      </div>

      {/* Right: Favorite Button Only */}
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleFavorite?.(siteLog.id)}
          className="h-8 w-8 p-0 hover:bg-transparent group"
        >
          <Star className={`h-4 w-4 transition-colors ${is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground group-hover:text-yellow-500'}`} />
        </Button>
      </div>
    </div>
  );
};

export default SiteLogCard;