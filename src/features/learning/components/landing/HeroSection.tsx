import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, BookOpen, Award } from 'lucide-react';
import type { Course } from '@shared/schema';
import type { CourseStats } from '../../types';

interface HeroSectionProps {
  course: Course;
  stats: CourseStats;
  isEnrolled?: boolean;
  progressPercentage?: number;
}

export function HeroSection({ course, stats, isEnrolled = false, progressPercentage = 0 }: HeroSectionProps) {
  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image with Parallax (desktop only) */}
      {course.cover_url ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center md:bg-fixed bg-no-repeat motion-reduce:bg-scroll"
            style={{ backgroundImage: `url(${course.cover_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/100 dark:from-black/30 dark:via-black/70 dark:to-black/100" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      )}

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {course.badge_text && (
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium mb-6 bg-accent text-accent-foreground border-0">
              <Award className="w-4 h-4 mr-2 inline" />
              {course.badge_text}
            </Badge>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
            {course.title}
          </h1>

          <p className="text-base sm:text-lg leading-relaxed mb-8 text-gray-200">
            {course.short_description}
          </p>

          {/* Progress Bar - Only show when enrolled */}
          {isEnrolled && (
            <div className="mb-8 max-w-xs space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-200">Progreso</span>
                <span className="font-semibold text-gray-200">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" data-testid="hero-progress-bar" />
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="font-semibold text-gray-200">{stats.total_modules} Módulos</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="font-semibold text-gray-200">{stats.total_lessons} Lecciones</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="font-semibold text-gray-200">{stats.total_duration_formatted} de Contenido</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
