import { Clock, ArrowRight, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type MarkerCardProps = {
  marker: {
    id: string;
    lesson_id: string;
    body: string;
    time_sec: number | null;
    is_pinned: boolean;
    lesson?: {
      title: string;
    };
    module?: {
      title: string;
    };
  };
  onGoToLesson: (lessonId: string, timeSec: number | null) => void;
};

const MarkerCard: React.FC<MarkerCardProps> = ({ marker, onGoToLesson }) => {
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-4 mb-3 transition-colors">
      {/* Header - Module and Lesson */}
      <div className="mb-3">
        <div className="text-xs text-[var(--muted-fg)] mb-1">
          {marker.module?.title || 'Sin módulo'}
        </div>
        <h3 className="text-[var(--card-fg)] font-semibold text-base">
          {marker.lesson?.title || 'Sin lección'}
        </h3>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-[var(--muted-fg)]" />
        <span className="font-mono text-sm text-[var(--card-fg)] font-medium">
          {formatTime(marker.time_sec)}
        </span>
      </div>

      {/* Marker Text */}
      <div className="mb-3">
        <div className="flex items-start gap-2 mb-2">
          <Bookmark className="h-4 w-4 text-[var(--muted-fg)] mt-0.5 shrink-0" />
          <span className={`text-sm ${marker.body ? 'text-[var(--card-fg)]' : 'text-[var(--muted-fg)] italic'}`}>
            {marker.body || 'Sin descripción'}
          </span>
        </div>
        {marker.is_pinned && (
          <Badge variant="secondary" className="text-xs">
            Fijado
          </Badge>
        )}
      </div>

      {/* Action Button */}
      <Button
        onClick={() => onGoToLesson(marker.lesson_id, marker.time_sec)}
        className="w-full gap-2"
        size="sm"
        data-testid={`button-go-to-lesson-${marker.id}`}
      >
        Ir a lección
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MarkerCard;
