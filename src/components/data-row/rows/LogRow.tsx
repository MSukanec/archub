import React from 'react';
import DataRowCard from '../DataRowCard';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Star, 
  Edit, 
  Trash2,
  TrendingUp,
  Eye,
  AlertTriangle,
  Package,
  StickyNote,
  CheckCircle,
  Camera,
  FileText,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudSnow,
  Wind,
  Thermometer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Interfaces
interface SiteLog {
  id: string;
  log_date: string;
  entry_type: string;
  weather?: string;
  comments?: string;
  is_favorite?: boolean;
  is_public?: boolean;
  creator?: {
    full_name: string;
    avatar_url?: string;
  };
  files?: any[];
  events?: any[];
  attendees?: any[];
  equipment?: any[];
}

interface LogRowProps {
  siteLog: SiteLog;
  onClick?: (siteLog: SiteLog) => void;
  onEdit?: (siteLog: SiteLog) => void;
  onDelete?: (siteLog: SiteLog) => void;
  onToggleFavorite?: (siteLogId: string) => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  enableSwipe?: boolean;
  className?: string;
}

// Entry type configurations
const entryTypes = {
  avance_de_obra: { label: 'Avance de Obra', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
  visita_tecnica: { label: 'Visita Técnica', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  problema_detectado: { label: 'Problema', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
  pedido_material: { label: 'Pedido Material', icon: Package, color: 'bg-orange-100 text-orange-800' },
  nota_climatica: { label: 'Nota Climática', icon: StickyNote, color: 'bg-yellow-100 text-yellow-800' },
  decision: { label: 'Decisión', icon: CheckCircle, color: 'bg-purple-100 text-purple-800' },
  inspeccion: { label: 'Inspección', icon: Eye, color: 'bg-indigo-100 text-indigo-800' },
  foto_diaria: { label: 'Foto Diaria', icon: Camera, color: 'bg-gray-100 text-gray-800' },
  registro_general: { label: 'Registro General', icon: FileText, color: 'bg-teal-100 text-teal-800' }
};

const weatherTypes = {
  sunny: { icon: Sun, label: "Soleado" },
  partly_cloudy: { icon: CloudSun, label: "Parcialmente nublado" },
  cloudy: { icon: Cloud, label: "Nublado" },
  rain: { icon: CloudRain, label: "Lluvia" },
  storm: { icon: CloudLightning, label: "Tormenta" },
  drizzle: { icon: CloudDrizzle, label: "Llovizna" },
  snow: { icon: CloudSnow, label: "Nieve" },
  wind: { icon: Wind, label: "Viento" },
  hot: { icon: Thermometer, label: "Caluroso" }
};

// Helper para obtener iniciales
const getInitials = (name: string): string => {
  if (!name) return "U";
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function LogRow({
  siteLog,
  onClick,
  onEdit,
  onDelete,
  onToggleFavorite,
  selected,
  density = 'normal',
  enableSwipe = true,
  className
}: LogRowProps) {
  const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];
  const weatherConfig = weatherTypes[siteLog.weather as keyof typeof weatherTypes];
  
  if (!entryTypeConfig) {
    return null;
  }

  // Obtener avatar y nombre del creador
  const creatorName = siteLog.creator?.full_name || 'Usuario';
  const avatarUrl = siteLog.creator?.avatar_url;
  const avatarFallback = getInitials(creatorName);

  // Contar elementos adjuntos
  const totalFiles = siteLog.files?.length || 0;
  const totalEvents = siteLog.events?.length || 0;
  const totalAttendees = siteLog.attendees?.length || 0;
  const totalEquipment = siteLog.equipment?.length || 0;
  
  const hasAttachments = totalFiles > 0 || totalEvents > 0 || totalAttendees > 0 || totalEquipment > 0;

  // Contenido del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido principal */}
      <div className="flex-1 min-w-0">
        {/* Nombre del creador y tipo de entrada */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm truncate">
            {creatorName}
          </span>
          <Badge variant="secondary" className={`text-xs ${entryTypeConfig.color}`}>
            {entryTypeConfig.label}
          </Badge>
        </div>

        {/* Fecha y clima */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>
            {format(new Date(siteLog.log_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
          </span>
          {weatherConfig && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <weatherConfig.icon className="h-3 w-3" />
                <span>{weatherConfig.label}</span>
              </div>
            </>
          )}
        </div>

        {/* Comentarios (resumido) */}
        {siteLog.comments && (
          <div className="text-xs text-muted-foreground truncate">
            {siteLog.comments.length > 50 
              ? `${siteLog.comments.substring(0, 50)}...`
              : siteLog.comments
            }
          </div>
        )}

        {/* Indicadores de adjuntos */}
        {hasAttachments && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {totalFiles > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {totalFiles}
              </span>
            )}
            {totalEvents > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {totalEvents}
              </span>
            )}
            {totalAttendees > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {totalAttendees}
              </span>
            )}
            {totalEquipment > 0 && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {totalEquipment}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Columna trailing - Estado de favorito */}
      <div className="flex items-center">
        {siteLog.is_favorite && (
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        )}
      </div>
    </>
  );

  // Crear el card base usando DataRowCard
  const logCard = (
    <DataRowCard
      avatarUrl={avatarUrl}
      avatarFallback={avatarFallback}
      selected={selected}
      density={density}
      onClick={onClick ? () => onClick(siteLog) : undefined}
      className={className}
      data-testid={`log-row-${siteLog.id}`}
    >
      {cardContent}
    </DataRowCard>
  );

  return logCard;
}

// Export del tipo para uso externo
export type { SiteLog };