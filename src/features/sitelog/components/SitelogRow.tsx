import React from 'react';
import DataRowCard from '@/components/shared/DataRowCard';
import { SwipeableCard } from '@/layouts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/date-utils';
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
  attendees?: any[];
}
interface SitelogRowProps {
  siteLog: SiteLog;
  onClick?: (siteLog: SiteLog) => void;
  onEdit?: (siteLog: SiteLog) => void;
  onDelete?: (siteLog: SiteLog) => void;
  onToggleFavorite?: (siteLogId: string) => void;
  selected?: boolean;
  density?: 'compact'| 'normal'| 'comfortable';
  enableSwipe?: boolean;
  className?: string;
}
// Entry type configurations
const entryTypes = {
  avance_de_obra: { label: 'Avance de Obra', icon: TrendingUp, color: 'bg-green-100 text-green-800'},
  visita_tecnica: { label: 'Visita Técnica', icon: Eye, color: 'bg-blue-100 text-blue-800'},
  problema_detectado: { label: 'Problema', icon: AlertTriangle, color: 'bg-red-100 text-red-800'},
  pedido_material: { label: 'Pedido Material', icon: Package, color: 'bg-orange-100 text-orange-800'},
  nota_climatica: { label: 'Nota Climática', icon: StickyNote, color: 'bg-yellow-100 text-yellow-800'},
  decision: { label: 'Decisión', icon: CheckCircle, color: 'bg-purple-100 text-purple-800'},
  inspeccion: { label: 'Inspección', icon: Eye, color: 'bg-indigo-100 text-indigo-800'},
  foto_diaria: { label: 'Foto Diaria', icon: Camera, color: 'bg-gray-100 text-gray-800'},
  registro_general: { label: 'Registro General', icon: FileText, color: 'bg-teal-100 text-teal-800'}
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
    .split('')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
export default function SitelogRow({
  siteLog,
  onClick,
  onEdit,
  onDelete,
  onToggleFavorite,
  selected,
  density = 'normal',
  enableSwipe = true,
  className
}: SitelogRowProps) {
  // Obtener el nombre del tipo desde la relación site_log_type
  const entryTypeName = (siteLog as any).site_log_type?.name || 'Registro General';
  // Ya no usamos un mapeo hardcodeado porque los tipos son configurables
  const entryTypeConfig = { label: entryTypeName, icon: FileText, color: 'bg-teal-100 text-teal-800'};
  const weatherConfig = weatherTypes[siteLog.weather as keyof typeof weatherTypes];
  // Obtener avatar y nombre del creador
  const creatorName = siteLog.creator?.full_name || 'Usuario';
  const avatarUrl = siteLog.creator?.avatar_url;
  const avatarFallback = getInitials(creatorName);
  // Contar elementos adjuntos
  const totalFiles = siteLog.files?.length || 0;
  const totalAttendees = siteLog.attendees?.length || 0;
  
  const hasAttachments = totalFiles > 0 || totalAttendees > 0;
  // Filtrar imágenes y videos de los archivos
  const mediaFiles = siteLog.files?.filter(file => 
    (file.file_type === 'image'|| file.file_type === 'video') || 
    (file.mime_type?.startsWith('image/') || file.mime_type?.startsWith('video/'))
  ) || [];
  // Contenido del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido principal */}
      <div className="flex-1 min-w-0">
        {/* Tipo de entrada en negrita (donde antes estaba el nombre) */}
        <div className="mb-1">
          <span className="font-semibold text-sm">
            {entryTypeConfig.label}
          </span>
        </div>
        {/* Fecha y clima */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>
            {format(parseLocalDate(siteLog.log_date) || new Date(), 'dd/MM/yyyy', { locale: es })}
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
        {/* Mini-galería de thumbnails (hasta 8 media) */}
        {mediaFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {mediaFiles.slice(0, 8).map((file: any, index: number) => (
              <div key={file.id || index} className="relative w-12 h-12 md:w-6 md:h-6 rounded-sm overflow-hidden flex-shrink-0 bg-muted">
                {file.file_type === 'image'|| file.mime_type?.startsWith('image/') ? (
                  <img
                    src={file.file_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : file.file_type === 'video'|| file.mime_type?.startsWith('video/') ? (
                  <>
                    <video
                      src={file.file_url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <svg className="w-2.5 h-2.5 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </>
                ) : null}
              </div>
            ))}
            {mediaFiles.length > 8 && (
              <div className="w-12 h-12 md:w-6 md:h-6 bg-muted rounded-sm flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                +{mediaFiles.length - 8}
              </div>
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
  // Acciones de swipe para móvil
  const swipeActions = enableSwipe ? [
    ...(onToggleFavorite ? [{
      label: siteLog.is_favorite ? 'Quitar favorito': 'Marcar favorito',
      icon: <Star className="h-4 w-4" />,
      variant: 'default'as const,
      onClick: () => onToggleFavorite(siteLog.id)
    }] : []),
    ...(onEdit ? [{
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      variant: 'default'as const,
      onClick: () => onEdit(siteLog)
    }] : []),
    ...(onDelete ? [{
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive'as const,
      onClick: () => onDelete(siteLog)
    }] : [])
  ] : undefined;
  if (enableSwipe && swipeActions && swipeActions.length > 0) {
    return (
      <SwipeableCard
        actions={swipeActions}
        data-testid={`log-row-${siteLog.id}`}
      >
        <DataRowCard
          avatarUrl={avatarUrl}
          avatarFallback={avatarFallback}
          selected={selected}
          density={density}
          onClick={onClick ? () => onClick(siteLog) : undefined}
          className={className}
        >
          {cardContent}
        </DataRowCard>
      </SwipeableCard>
    );
  }
  // Desktop: solo DataRowCard
  return (
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
}
// Export del tipo para uso externo
export type { SiteLog };
