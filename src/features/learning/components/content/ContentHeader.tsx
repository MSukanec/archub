import { BookOpen } from 'lucide-react';

interface ContentHeaderProps {
  totalModules: number;
  totalLessons: number;
  completedLessons: number;
}

export function ContentHeader({ totalModules, totalLessons, completedLessons }: ContentHeaderProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Estructura del curso</h2>
          <p className="text-sm text-muted-foreground">
            {totalModules} {totalModules === 1 ? 'módulo' : 'módulos'} · {totalLessons} {totalLessons === 1 ? 'lección' : 'lecciones'}
            {completedLessons > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({progressPercent}% completado)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
