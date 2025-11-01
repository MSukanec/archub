import { Heart } from 'lucide-react';
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
  const { toggleFavorite, isLoading, optimisticFavorite } = useLessonFavorite({ 
    lessonId, 
    courseId, 
    currentlyFavorite: isFavorite 
  });

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Usar el estado optimista para feedback instantáneo
  const displayFavorite = optimisticFavorite ?? isFavorite;

  if (variant === 'icon') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite();
        }}
        disabled={isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1.5 transition-all duration-150",
          "hover:ring-2 hover:ring-red-500 hover:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        data-testid={`button-favorite-lesson-${lessonId}`}
        title={displayFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart
          className={cn(
            iconSizes[size],
            "transition-all duration-150",
            displayFavorite 
              ? "fill-red-500 text-red-500" 
              : "text-muted-foreground"
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
      <Heart
        className={cn(
          iconSizes[size],
          "transition-all duration-150",
          displayFavorite 
            ? "fill-red-500 text-red-500" 
            : "text-muted-foreground"
        )}
      />
      {displayFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    </Button>
  );
}
