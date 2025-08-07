import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FileText, 
  Camera, 
  Eye, 
  AlertTriangle, 
  Package, 
  StickyNote, 
  CheckCircle, 
  TrendingUp, 
  Flame,
  Star,
  Trash2,
  Edit,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  CloudDrizzle,
  CloudLightning,
  CloudSun,
  Users,
  Search,
  Thermometer
} from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';

// Entry type configurations
const entryTypes = {
  avance_de_obra: { label: 'Avance de Obra', icon: TrendingUp, variant: 'default' as const },
  visita_tecnica: { label: 'Visita Técnica', icon: Eye, variant: 'secondary' as const },
  problema_detectado: { label: 'Problema', icon: AlertTriangle, variant: 'destructive' as const },
  pedido_material: { label: 'Pedido Material', icon: Package, variant: 'outline' as const },
  nota_climatica: { label: 'Nota Climática', icon: StickyNote, variant: 'secondary' as const },
  decision: { label: 'Decisión', icon: CheckCircle, variant: 'default' as const },
  inspeccion: { label: 'Inspección', icon: Eye, variant: 'secondary' as const },
  foto_diaria: { label: 'Foto Diaria', icon: Camera, variant: 'outline' as const },
  registro_general: { label: 'Registro General', icon: FileText, variant: 'default' as const }
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

interface SiteLogCardProps {
  siteLog: any;
  onEdit: (siteLog: any) => void;
  onDelete: (siteLog: any) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onImageClick?: (imageUrl: string, allImages: string[]) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function SiteLogCard({ siteLog, onEdit, onDelete, onToggleFavorite, onImageClick }: SiteLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];
  const weatherConfig = weatherTypes[siteLog.weather as keyof typeof weatherTypes];

  if (!entryTypeConfig) {
    return null;
  }

  return (
    <SwipeableCard
      actions={[
        {
          label: "Favorito",
          icon: <Star className="w-4 h-4" />,
          onClick: () => onToggleFavorite(siteLog.id, !siteLog.is_favorite)
        },
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit(siteLog)
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive" as const,
          onClick: () => onDelete(siteLog)
        }
      ]}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="bg-[var(--card-bg)] border-[var(--card-border)] shadow-sm transition-all">
          <CollapsibleTrigger asChild>
            <CardContent className="p-3 cursor-pointer">
              <div className="flex items-center justify-between">
                {/* Left side: Avatar + Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={siteLog.creator?.avatar_url || ''} 
                      alt={siteLog.creator?.full_name || 'Usuario'} 
                    />
                    <AvatarFallback className="text-xs font-medium">
                      {getInitials(siteLog.creator?.full_name || 'Usuario')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm text-[var(--card-fg)]">
                      {siteLog.creator?.full_name || 'Usuario'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-accent">
                        {entryTypeConfig.label}
                      </span>
                      <span>|</span>
                      <span>
                        {format(new Date(siteLog.log_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Chevron */}
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="border-t border-muted-foreground/20 pt-3 space-y-4">
                {/* Comments */}
                {siteLog.comments && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Comentarios:</h4>
                    <p className="text-sm text-muted-foreground">{siteLog.comments}</p>
                  </div>
                )}

                {/* Weather */}
                {weatherConfig && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Clima:</h4>
                    <div className="flex items-center gap-2">
                      <weatherConfig.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{weatherConfig.label}</span>
                    </div>
                  </div>
                )}

                {/* Events */}
                {siteLog.events && siteLog.events.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Eventos ({siteLog.events.length}):</h4>
                    <div className="space-y-2">
                      {siteLog.events.map((event: any, index: number) => (
                        <div key={index} className="p-2 bg-muted/30 rounded">
                          <div className="font-medium text-xs text-accent mb-1">
                            {event.event_type?.name || 'Evento'}
                          </div>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personnel */}
                {siteLog.personnel && siteLog.personnel.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Asistencias ({siteLog.personnel.length}):</h4>
                    <div className="space-y-2">
                      {siteLog.personnel.map((attendee: any, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 rounded">
                          <div className="font-medium text-xs text-blue-800 mb-1">
                            {attendee.personnel?.full_name || 'Personal'}
                          </div>
                          <div className="text-xs text-blue-600">
                            {attendee.attendance_type || 'Presente'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {siteLog.equipment && siteLog.equipment.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Maquinaria ({siteLog.equipment.length}):</h4>
                    <div className="space-y-2">
                      {siteLog.equipment.map((equipment: any, index: number) => (
                        <div key={index} className="p-2 bg-amber-50 rounded">
                          <div className="font-medium text-xs text-amber-800 mb-1">
                            {equipment.equipment?.name || 'Equipo'}
                          </div>
                          <div className="text-xs text-amber-600">
                            Cantidad: {equipment.quantity || 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {siteLog.files && siteLog.files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Archivos ({siteLog.files.length}):</h4>
                    <div className="flex flex-wrap gap-2">
                      {siteLog.files.map((file: any, index: number) => {
                        const imageUrls = siteLog.files.filter((f: any) => f.file_type === 'image').map((f: any) => f.file_url);
                        
                        return file.file_type === 'image' ? (
                          <img 
                            key={index}
                            src={file.file_url} 
                            alt={file.file_name}
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => onImageClick && onImageClick(file.file_url, imageUrls)}
                          />
                        ) : (
                          <div key={index} className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </SwipeableCard>
  );
}