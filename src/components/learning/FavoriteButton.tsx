import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLessonFavorite } from '@/hooks/use-lesson-favorite';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  lessonId: string;
  courseId: string;
  isFavorite: boolean;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FavoriteButton({ 
  lessonId, 
  courseId, 
  isFavorite, 
  variant = 'icon',
  size = 'md',
  className 
}: FavoriteButtonProps) {
  const { toggleFavorite, isLoading } = useLessonFavorite({ 
    lessonId, 
    courseId, 
    currentlyFavorite: isFavorite 
  });

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite();
        }}
        disabled={isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1.5 transition-colors",
          "hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        data-testid={`button-favorite-lesson-${lessonId}`}
        title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Star
          className={cn(
            iconSizes[size],
            "transition-all",
            isFavorite 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-muted-foreground hover:text-yellow-400"
          )}
        />
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite();
      }}
      disabled={isLoading}
      className={cn("gap-2", className)}
      data-testid={`button-favorite-lesson-${lessonId}`}
    >
      <Star
        className={cn(
          iconSizes[size],
          "transition-all",
          isFavorite 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-muted-foreground"
        )}
      />
      {isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    </Button>
  );
}
