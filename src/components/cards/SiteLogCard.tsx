import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Star, 
  Edit, 
  Trash2, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  CloudDrizzle, 
  CloudLightning, 
  CloudSun,
  TrendingUp,
  Users,
  AlertTriangle,
  Package,
  CheckCircle,
  Search,
  Camera,
  StickyNote
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Entry types with icons and colors
const entryTypes = {
  avance_de_obra: { icon: TrendingUp, label: "Avance de obra", color: "bg-green-100 text-green-800" },
  visita_tecnica: { icon: Users, label: "Visita técnica", color: "bg-blue-100 text-blue-800" },
  problema_detectado: { icon: AlertTriangle, label: "Problema detectado", color: "bg-red-100 text-red-800" },
  pedido_material: { icon: Package, label: "Pedido material", color: "bg-orange-100 text-orange-800" },
  nota_climatica: { icon: Sun, label: "Nota climática", color: "bg-yellow-100 text-yellow-800" },
  decision: { icon: CheckCircle, label: "Decisión", color: "bg-purple-100 text-purple-800" },
  inspeccion: { icon: Search, label: "Inspección", color: "bg-indigo-100 text-indigo-800" },
  foto_diaria: { icon: Camera, label: "Foto diaria", color: "bg-gray-100 text-gray-800" },
  registro_general: { icon: StickyNote, label: "Registro general", color: "bg-teal-100 text-teal-800" }
};

const weatherTypes = {
  sunny: { icon: Sun, label: "Soleado" },
  partly_cloudy: { icon: CloudSun, label: "Parcialmente nublado" },
  cloudy: { icon: Cloud, label: "Nublado" },
  rain: { icon: CloudRain, label: "Lluvia" },
  storm: { icon: CloudLightning, label: "Tormenta" },
  snow: { icon: CloudSnow, label: "Nieve" },
  fog: { icon: CloudDrizzle, label: "Niebla" },
  windy: { icon: Wind, label: "Ventoso" },
  hail: { icon: CloudSnow, label: "Granizo" }
};

type SiteLogCardProps = {
  siteLog: {
    id: string;
    log_date: string;
    entry_type: string;
    weather?: string;
    comments?: string;
    is_favorite: boolean;
    is_public: boolean;
    creator?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
    events?: any[];
    attendees?: any[];
    equipment?: any[];
  };
  onEdit: (siteLog: any) => void;
  onDelete: (siteLog: any) => void;
  onToggleFavorite: (siteLogId: string) => void;
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

const SiteLogCard: React.FC<SiteLogCardProps> = ({ 
  siteLog, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}) => {
  const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];
  const weatherConfig = siteLog.weather ? weatherTypes[siteLog.weather as keyof typeof weatherTypes] : null;
  const EntryTypeIcon = entryTypeConfig?.icon;

  // Truncate comments to 60 characters for mobile
  const truncatedComments = siteLog.comments 
    ? siteLog.comments.length > 60 
      ? `${siteLog.comments.slice(0, 60)}...`
      : siteLog.comments
    : 'Sin comentarios';

  // Count related items
  const eventsCount = siteLog.events?.length || 0;
  const attendeesCount = siteLog.attendees?.length || 0;
  const equipmentCount = siteLog.equipment?.length || 0;

  return (
    <div className="bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-4 mb-3 transition-colors">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Entry Type Badge */}
          <Badge className={`${entryTypeConfig?.color} text-xs px-2 py-1`}>
            {EntryTypeIcon && <EntryTypeIcon className="w-3 h-3 mr-1" />}
            {entryTypeConfig?.label || 'Sin tipo'}
          </Badge>
          
          {/* Favorite Star */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(siteLog.id);
            }}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <Star className={`h-3 w-3 ${siteLog.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(siteLog);
            }}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <Edit className="h-3 w-3 text-muted-foreground hover:text-blue-500 transition-colors" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(siteLog);
            }}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
          </Button>
        </div>
      </div>

      {/* Content Row */}
      <div className="space-y-2">
        {/* Date and Weather */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[var(--card-fg)] font-medium">
              {format(new Date(siteLog.log_date), 'dd/MM/yyyy HH:mm', { locale: es })}
            </span>
            {weatherConfig && (
              <div className="flex items-center gap-1">
                {React.createElement(weatherConfig.icon, { className: "h-3 w-3 text-muted-foreground" })}
                <span className="text-xs text-muted-foreground">
                  {weatherConfig.label}
                </span>
              </div>
            )}
          </div>
          
          {/* Public/Private indicator */}
          <div className="flex items-center gap-1">
            {siteLog.is_public ? (
              <Badge variant="outline" className="text-xs">Público</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Privado</Badge>
            )}
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage 
              src={siteLog.creator?.avatar_url || ''} 
              alt={siteLog.creator?.full_name || 'Usuario'} 
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
              {getInitials(siteLog.creator?.full_name || 'Usuario')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {siteLog.creator?.full_name || 'Usuario desconocido'}
          </span>
        </div>

        {/* Comments */}
        <div className="text-sm text-[var(--card-fg)]" title={siteLog.comments || 'Sin comentarios'}>
          {truncatedComments}
        </div>

        {/* Related Items Count */}
        {(eventsCount > 0 || attendeesCount > 0 || equipmentCount > 0) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-[var(--card-border)]">
            {eventsCount > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {eventsCount} evento{eventsCount > 1 ? 's' : ''}
              </span>
            )}
            {attendeesCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {attendeesCount} persona{attendeesCount > 1 ? 's' : ''}
              </span>
            )}
            {equipmentCount > 0 && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {equipmentCount} equipo{equipmentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteLogCard;