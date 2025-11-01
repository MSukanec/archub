import { Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataRowCard from '../DataRowCard';

interface MarkerRowProps {
  marker: {
    id: string;
    lesson_title: string;
    module_title: string;
    time_sec: number | null;
    body: string;
  };
  onGoToMarker: (markerId: string) => void;
  onDelete: (markerId: string) => void;
}

export default function MarkerRow({ marker, onGoToMarker, onDelete }: MarkerRowProps) {
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DataRowCard
      data-testid={`marker-row-${marker.id}`}
    >
      {/* Layout vertical completo */}
      <div className="w-full space-y-3">
        {/* 1. Nombre de Lección */}
        <p className="font-medium text-sm leading-tight">
          {marker.lesson_title}
        </p>

        {/* 2. Nombre de Módulo */}
        <p className="text-xs text-muted-foreground">
          {marker.module_title}
        </p>

        {/* 3. Tiempo + Texto del marcador */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="font-mono font-medium">{formatTime(marker.time_sec)}</span>
          </div>
          {marker.body && (
            <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
              {marker.body}
            </p>
          )}
        </div>

        {/* 4. Botones: IR + ELIMINAR */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          {/* Botón IR (2/3) */}
          <Button
            variant="default"
            size="sm"
            className="col-span-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onGoToMarker(marker.id);
            }}
            data-testid={`button-go-to-marker-${marker.id}`}
          >
            Ir
          </Button>

          {/* Botón ELIMINAR (1/3) */}
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(marker.id);
            }}
            data-testid={`button-delete-marker-${marker.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DataRowCard>
  );
}
