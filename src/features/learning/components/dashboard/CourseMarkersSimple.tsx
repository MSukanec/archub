import { Bookmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getCourseMarkersUrl, type MarkerWithLesson } from '../../services/student/getCourseMarkers';
interface CourseMarkersSimpleProps {
  courseId: string;
  activeLessonId: string | null;
  onMarkerClick: (lessonId: string, timeSec: number | null) => void;
}
export function CourseMarkersSimple({ 
  courseId, 
  activeLessonId, 
  onMarkerClick 
}: CourseMarkersSimpleProps) {
  const { data: markers = [], isLoading } = useQuery<MarkerWithLesson[]>({
    queryKey: [getCourseMarkersUrl(courseId)],
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
  });
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }
  if (markers.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No hay marcadores aún</p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {markers.map((marker) => (
        <button
          key={marker.id}
          onClick={() => onMarkerClick(marker.lesson_id, marker.time_sec)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md transition-colors",
            marker.lesson_id === activeLessonId 
              ? "bg-[var(--accent)]/10" 
              : "hover:bg-muted/50"
          )}
          data-testid={`marker-simple-${marker.id}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-xs font-medium truncate",
                marker.lesson_id === activeLessonId 
                  ? "text-[var(--accent)]" 
                  : "text-foreground"
              )}>
                {marker.lesson?.title || 'Lección'}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {marker.module?.title || 'Módulo'}
              </div>
              {marker.body && (
                <div className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                  {marker.body}
                </div>
              )}
            </div>
            <span className={cn(
              "text-[10px] font-mono flex-shrink-0",
              marker.lesson_id === activeLessonId 
                ? "text-[var(--accent)]" 
                : "text-muted-foreground"
            )}>
              {formatTime(marker.time_sec)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
