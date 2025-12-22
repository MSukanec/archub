import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContentHeaderProps {
  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  totalDurationMin?: number;
  variant?: 'inline' | 'sidebar';
}

export function ContentHeader({ 
  totalModules, 
  totalLessons, 
  completedLessons,
  totalDurationMin = 0,
  variant = 'inline'
}: ContentHeaderProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const remainingLessons = totalLessons - completedLessons;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (variant === 'inline') {
    return (
      <div className="mb-8 lg:hidden">
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

  return (
    <div className="hidden lg:block sticky top-6">
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Estructura del curso</h2>
            <p className="text-sm text-muted-foreground">Tu progreso actual</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso general</span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-positive"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold text-primary">{totalModules}</div>
              <div className="text-xs text-muted-foreground">Módulos</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold text-primary">{totalLessons}</div>
              <div className="text-xs text-muted-foreground">Lecciones</div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-3 text-sm">
              <Target className="h-4 w-4 text-positive" />
              <span className="text-muted-foreground">Completadas:</span>
              <span className="font-medium ml-auto">{completedLessons} lecciones</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Restantes:</span>
              <span className="font-medium ml-auto">{remainingLessons} lecciones</span>
            </div>
            {totalDurationMin > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duración total:</span>
                <span className="font-medium ml-auto">{formatDuration(totalDurationMin)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
