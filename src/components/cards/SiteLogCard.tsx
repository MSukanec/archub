import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  Trash2
} from 'lucide-react';

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

interface SiteLogCardProps {
  siteLog: any;
  onEdit: (siteLog: any) => void;
  onDelete: (siteLog: any) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getEntryTypeVariant(entryType: string) {
  return entryTypes[entryType as keyof typeof entryTypes]?.variant || 'default';
}

export default function SiteLogCard({ siteLog, onEdit, onDelete, onToggleFavorite }: SiteLogCardProps) {
  const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];

  if (!entryTypeConfig) {
    return null;
  }

  return (
    <Card 
      className="bg-[var(--card-bg)] border-[var(--card-border)] shadow-sm hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
      onClick={() => onEdit(siteLog)}
    >
      <CardContent className="p-3">
        {/* First Row: Type | Date Time + Action Buttons */}
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[var(--card-fg)] font-medium">
              {entryTypeConfig.label}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-[var(--card-fg)] font-medium">
              {format(new Date(siteLog.log_date), 'dd/MM/yyyy HH:mm', { locale: es })}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(siteLog.id, !siteLog.is_favorite);
              }}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <Star 
                className={`h-3 w-3 transition-colors ${
                  siteLog.is_favorite 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-muted-foreground hover:text-yellow-400'
                }`} 
              />
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

        {/* Second Row: Avatar + Creator */}
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
            {siteLog.creator?.full_name || 'Usuario'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}