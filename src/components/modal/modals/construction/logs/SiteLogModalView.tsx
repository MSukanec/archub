import React from 'react'
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/ImageLightbox'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar, 
  User, 
  Users,
  Camera,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Package,
  StickyNote,
  CheckCircle,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudSnow,
  Wind,
  Thermometer
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SiteLogModalViewProps {
  modalData?: {
    viewingSiteLog?: any;
  };
  onClose: () => void;
  onEdit?: (siteLog: any) => void;
  onDelete?: (siteLog: any) => void;
}

// Entry type configurations
const entryTypes = {
  avance_de_obra: { label: 'Avance de Obra', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
  visita_tecnica: { label: 'Visita Técnica', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  problema_detectado: { label: 'Problema Detectado', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
  pedido_material: { label: 'Pedido Material', icon: Package, color: 'bg-orange-100 text-orange-800' },
  nota_climatica: { label: 'Nota Climática', icon: StickyNote, color: 'bg-yellow-100 text-yellow-800' },
  decision: { label: 'Decisión', icon: CheckCircle, color: 'bg-purple-100 text-purple-800' },
  inspeccion: { label: 'Inspección', icon: Eye, color: 'bg-indigo-100 text-indigo-800' },
  foto_diaria: { label: 'Foto Diaria', icon: Camera, color: 'bg-gray-100 text-gray-800' },
};

const weatherTypes = {
  sunny: { icon: Sun, label: "Soleado", color: "text-yellow-500" },
  partly_cloudy: { icon: CloudSun, label: "Parcialmente nublado", color: "text-yellow-400" },
  cloudy: { icon: Cloud, label: "Nublado", color: "text-gray-500" },
  rain: { icon: CloudRain, label: "Lluvia", color: "text-blue-500" },
  storm: { icon: CloudLightning, label: "Tormenta", color: "text-purple-500" },
  drizzle: { icon: CloudDrizzle, label: "Llovizna", color: "text-blue-400" },
  snow: { icon: CloudSnow, label: "Nieve", color: "text-blue-200" },
  wind: { icon: Wind, label: "Viento", color: "text-gray-400" },
  hot: { icon: Thermometer, label: "Caluroso", color: "text-red-500" },
  fog: { icon: Cloud, label: "Niebla", color: "text-gray-400" },
  windy: { icon: Wind, label: "Ventoso", color: "text-gray-500" },
  hail: { icon: CloudSnow, label: "Granizo", color: "text-blue-300" },
  none: { icon: Sun, label: "Sin especificar", color: "text-muted-foreground" }
};

export function SiteLogModalView({ modalData, onClose, onEdit, onDelete }: SiteLogModalViewProps) {
  const siteLog = modalData?.viewingSiteLog
  const { openModal } = useGlobalModalStore()
  
  // Filtrar solo imágenes para el lightbox
  const imageUrls = siteLog?.files?.filter((file: any) => 
    file.file_type === 'image' || file.mime_type?.startsWith('image/')
  ).map((file: any) => file.file_url) || []
  
  const lightbox = useImageLightbox(imageUrls)
  
  if (!siteLog) {
    return null
  }

  // Handler para abrir el modal de edición
  const handleEdit = () => {
    onClose() // Cerrar el modal de vista primero
    openModal('site-log', { data: siteLog, isEditing: true })
  }

  // Helper para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00')
      return format(date, 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es })
    } catch {
      return dateString
    }
  }

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

  const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];
  const weatherConfig = weatherTypes[siteLog.weather as keyof typeof weatherTypes];
  
  // Filtrar solo imágenes de los archivos
  const imageFiles = siteLog.files?.filter((file: any) => 
    file.file_type === 'image' || file.mime_type?.startsWith('image/')
  ) || [];

  const viewPanel = (
    <div className="space-y-6">
      {/* Fecha y creador */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-accent" />
          {formatDate(siteLog.log_date)}
        </div>
        
        {/* Información del creador */}
        {siteLog.creator && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={siteLog.creator.avatar_url} alt={siteLog.creator.full_name} />
              <AvatarFallback className="text-xs">{getInitials(siteLog.creator.full_name)}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              {siteLog.creator.full_name}
            </div>
          </div>
        )}
      </div>
      
      {/* Header con tipo de entrada y clima */}
      <div className="flex items-center justify-between">
        {entryTypeConfig && (
          <div className="flex items-center gap-2">
            <entryTypeConfig.icon className="h-5 w-5" />
            <Badge className={`${entryTypeConfig.color} px-4 py-2 text-base font-medium`}>
              {entryTypeConfig.label}
            </Badge>
          </div>
        )}
        
        {weatherConfig && (
          <div className="flex items-center gap-2 text-sm">
            <weatherConfig.icon className={`h-5 w-5 ${weatherConfig.color}`} />
            <span className="text-muted-foreground">{weatherConfig.label}</span>
          </div>
        )}
      </div>

      <Separator />


      {/* Comentarios */}
      {siteLog.comments && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4 text-accent" />
              Comentarios
            </div>
            <div className="text-sm text-foreground bg-muted/20 p-3 rounded-md">
              {siteLog.comments}
            </div>
          </div>
        </>
      )}

      {/* Galería de imágenes */}
      {imageFiles.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Camera className="h-4 w-4 text-accent" />
              Archivos Multimedia ({imageFiles.length})
            </div>
            <div className="grid grid-cols-3 gap-4">
              {imageFiles.map((file: any, index: number) => (
                <div key={file.id || index} className="aspect-square rounded-lg overflow-hidden border bg-muted/30">
                  <img
                    src={file.file_url}
                    alt={file.file_name || `Imagen ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => {
                      const imageIndex = imageUrls.indexOf(file.file_url)
                      if (imageIndex !== -1) {
                        lightbox.openLightbox(imageIndex)
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Eventos del día */}
      {siteLog.events && siteLog.events.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-accent" />
              Eventos del Día ({siteLog.events.length})
            </div>
            <div className="space-y-3">
              {siteLog.events.map((event: any, index: number) => (
                <div key={event.id || index} className="p-3 bg-muted/20 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">{event.description}</div>
                    <div className="text-xs text-muted-foreground">{event.time}</div>
                  </div>
                  {event.responsible && (
                    <div className="text-xs text-muted-foreground">
                      Responsable: {event.responsible}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Personal asistente */}
      {siteLog.attendees && siteLog.attendees.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4 text-accent" />
              Personal en Obra ({siteLog.attendees.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {siteLog.attendees.map((attendee: any, index: number) => (
                <div key={attendee.id || index} className="flex items-center gap-3 p-3 bg-muted/20 rounded-md">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={attendee.contact?.avatar_url} alt={attendee.contact?.name} />
                    <AvatarFallback>{getInitials(attendee.contact?.name || 'U')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {attendee.contact?.name || 'Sin nombre'}
                    </div>
                    {attendee.contact?.position && (
                      <div className="text-xs text-muted-foreground">
                        {attendee.contact.position}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Equipos utilizados */}
      {siteLog.equipment && siteLog.equipment.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wrench className="h-4 w-4 text-accent" />
              Maquinaria y Equipos ({siteLog.equipment.length})
            </div>
            <div className="space-y-3">
              {siteLog.equipment.map((equipment: any, index: number) => (
                <div key={equipment.id || index} className="p-3 bg-muted/20 rounded-md">
                  <div className="text-sm font-medium">{equipment.name}</div>
                  {equipment.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {equipment.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  )

  const headerContent = (
    <FormModalHeader 
      title="Ver Registro de Bitácora"
      icon={Eye}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cerrar"
      onLeftClick={onClose}
      rightLabel="Editar"
      onRightClick={handleEdit}
    />
  )

  return (
    <>
      <FormModalLayout
        columns={1}
        viewPanel={viewPanel}
        editPanel={null}
        headerContent={headerContent}
        footerContent={footerContent}
        onClose={onClose}
        wide={true}
      />
      
      <ImageLightbox
        images={imageUrls}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.closeLightbox}
      />
    </>
  )
}