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
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-blue-100 text-blue-800 border-blue-200' 
  },
  visita_tecnica: { 
    label: 'Visita Técnica', 
    icon: <ClipboardCheck className="h-4 w-4" />, 
    color: 'bg-green-100 text-green-800 border-green-200' 
  },
  problema_detectado: { 
    label: 'Problema Detectado', 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: 'bg-red-100 text-red-800 border-red-200' 
  },
  pedido_material: { 
    label: 'Pedido Material', 
    icon: <Package className="h-4 w-4" />, 
    color: 'bg-orange-100 text-orange-800 border-orange-200' 
  },
  nota_climatica: { 
    label: 'Nota Climática', 
    icon: <Cloud className="h-4 w-4" />, 
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200' 
  },
  decision: { 
    label: 'Decisión', 
    icon: <ClipboardCheck className="h-4 w-4" />, 
    color: 'bg-purple-100 text-purple-800 border-purple-200' 
  },
  inspeccion: { 
    label: 'Inspección', 
    icon: <Search className="h-4 w-4" />, 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200' 
  },
  foto_diaria: { 
    label: 'Foto Diaria', 
    icon: <Camera className="h-4 w-4" />, 
    color: 'bg-pink-100 text-pink-800 border-pink-200' 
  },
  registro_general: { 
    label: 'Registro General', 
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-gray-100 text-gray-800 border-gray-200' 
  }
};

// Weather configurations
const weatherTypes = {
  sunny: { label: 'Soleado', icon: <Sun className="h-4 w-4" />, color: 'text-yellow-500' },
  partly_cloudy: { label: 'Parcialmente Nublado', icon: <Cloud className="h-4 w-4" />, color: 'text-blue-400' },
  cloudy: { label: 'Nublado', icon: <Cloud className="h-4 w-4" />, color: 'text-gray-500' },
  rain: { label: 'Lluvia', icon: <CloudRain className="h-4 w-4" />, color: 'text-blue-600' },
  storm: { label: 'Tormenta', icon: <Zap className="h-4 w-4" />, color: 'text-purple-600' },
  snow: { label: 'Nieve', icon: <CloudSnow className="h-4 w-4" />, color: 'text-blue-200' },
  fog: { label: 'Niebla', icon: <Cloud className="h-4 w-4" />, color: 'text-gray-400' },
  windy: { label: 'Ventoso', icon: <Wind className="h-4 w-4" />, color: 'text-green-500' },
  hail: { label: 'Granizo', icon: <CloudSnow className="h-4 w-4" />, color: 'text-gray-600' },
  none: { label: 'Sin especificar', icon: <Cloud className="h-4 w-4" />, color: 'text-gray-400' }
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
  
  // Format date
  const formattedDate = format(new Date(log_date), 'dd MMM yyyy', { locale: es });
  const formattedTime = format(new Date(created_at), 'HH:mm', { locale: es });
  
  // Summary counts
  const eventCount = events.length;
  const attendeeCount = attendees.length;
  const equipmentCount = equipment.length;

  // Truncate comments for display
  const displayComments = comments 
    ? truncateText(comments, 60)
    : 'Sin comentarios';

  return (
    <div className="flex flex-col gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-4 mb-3 transition-colors">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        {/* Left: Avatar + Basic Info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={creator?.avatar_url || ''} 
              alt={creator?.full_name || 'Usuario'} 
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
              {getInitials(creator?.full_name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--card-fg)]">
                {creator?.full_name || 'Usuario'}
              </span>
              <div className="flex items-center gap-1">
                {is_public ? (
                  <Eye className="h-3 w-3 text-green-500" />
                ) : (
                  <EyeOff className="h-3 w-3 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate} · {formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite?.(siteLog.id)}
            className="h-8 w-8 p-0 hover:bg-transparent group"
          >
            <Star className={`h-4 w-4 transition-colors ${is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground group-hover:text-yellow-500'}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(siteLog)}
            className="h-8 w-8 p-0 hover:bg-transparent group"
          >
            <Edit className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(siteLog.id)}
            className="h-8 w-8 p-0 hover:bg-transparent group"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
          </Button>
        </div>
      </div>

      {/* Entry Type & Weather Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={`${entryTypeConfig?.color} text-xs font-medium`}>
          {entryTypeConfig?.icon}
          <span className="ml-1">{entryTypeConfig?.label}</span>
        </Badge>
        
        {weatherConfig && (
          <div className={`flex items-center gap-1 text-xs ${weatherConfig.color}`}>
            {weatherConfig.icon}
            <span>{weatherConfig.label}</span>
          </div>
        )}
      </div>

      {/* Comments */}
      {comments && (
        <div className="text-sm text-[var(--card-fg)] leading-relaxed">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span title={comments}>{displayComments}</span>
          </div>
        </div>
      )}

      {/* Summary Counts */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {eventCount > 0 && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{eventCount} evento{eventCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        {attendeeCount > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{attendeeCount} persona{attendeeCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        {equipmentCount > 0 && (
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            <span>{equipmentCount} equipo{equipmentCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteLogCard;