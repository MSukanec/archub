import { Clock, Bookmark, ArrowRight } from 'lucide-react';
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
      {/* Header with Module and Time */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-[var(--card-fg)] font-semibold text-sm truncate">
              {marker.module?.title || 'Sin módulo'}
            </h3>
          </div>
          <p className="text-[var(--muted-fg)] text-xs">
            {marker.lesson?.title || 'Sin lección'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Clock className="w-4 h-4 text-[var(--muted-fg)]" />
          <span className="text-xs font-mono font-medium text-[var(--card-fg)]">
            {formatTime(marker.time_sec)}
          </span>
        </div>
      </div>

      {/* Marker Body */}
      <div className="mb-3">
        {marker.is_pinned && (
          <Badge 
            variant="secondary" 
            className="mb-2"
            style={{ fontSize: '0.7rem' }}
          >
            Fijado
          </Badge>
        )}
        <p className={`text-sm ${marker.body ? 'text-[var(--card-fg)]' : 'text-[var(--muted-fg)] italic'}`}>
          {marker.body || 'Sin descripción'}
        </p>
      </div>

      {/* Action Button */}
      <Button 
        onClick={() => onGoToLesson(marker.lesson_id, marker.time_sec)}
        className="w-full gap-2"
        size="sm"
        data-testid={`button-go-to-lesson-${marker.id}`}
      >
        Ir a lección
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MarkerCard;
