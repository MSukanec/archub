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
          onClick: () => onToggleFavorite(siteLog.id, !siteLog.is_favorite)
        },
        {
          label: "Editar",
          onClick: () => onEdit(siteLog)
        },
        {
          label: "Eliminar",
          variant: "destructive" as const,
          onClick: () => onDelete(siteLog)
        }
      ]}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
                {/* Left side: Avatar + Info */}
                    <AvatarImage 
                      src={siteLog.creator?.avatar_url || ''} 
                      alt={siteLog.creator?.full_name || 'Usuario'} 
                    />
                      {getInitials(siteLog.creator?.full_name || 'Usuario')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                      {siteLog.creator?.full_name || 'Usuario'}
                    </div>
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
                  {isExpanded ? (
                  ) : (
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>

          <CollapsibleContent>
                {/* Comments */}
                {siteLog.comments && (
                  <div>
                  </div>
                )}

                {/* Weather */}
                {weatherConfig && (
                  <div>
                    </div>
                  </div>
                )}

                {/* Events */}
                {siteLog.events && siteLog.events.length > 0 && (
                  <div>
                      {siteLog.events.map((event: any, index: number) => (
                            {event.event_type?.name || 'Evento'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personnel */}
                {siteLog.personnel && siteLog.personnel.length > 0 && (
                  <div>
                      {siteLog.personnel.map((attendee: any, index: number) => (
                            {attendee.personnel?.full_name || 'Personal'}
                          </div>
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
                      {siteLog.equipment.map((equipment: any, index: number) => (
                            {equipment.equipment?.name || 'Equipo'}
                          </div>
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
                      {siteLog.files.map((file: any, index: number) => {
                        const imageUrls = siteLog.files.filter((f: any) => f.file_type === 'image').map((f: any) => f.file_url);
                        
                        return file.file_type === 'image' ? (
                          <img 
                            key={index}
                            src={file.file_url} 
                            alt={file.file_name}
                            onClick={() => onImageClick && onImageClick(file.file_url, imageUrls)}
                          />
                        ) : (
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