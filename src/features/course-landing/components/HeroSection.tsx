import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, BookOpen, Award } from 'lucide-react';
import type { Course } from '@shared/schema';
import type { CourseStats } from '../types';

interface HeroSectionProps {
  course: Course;
  stats: CourseStats;
}

export function HeroSection({ course, stats }: HeroSectionProps) {
  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      {course.cover_url ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${course.cover_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/50 dark:from-black/90 dark:via-black/80 dark:to-black/60" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      )}

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {course.badge_text && (
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium mb-6 bg-primary/90 text-primary-foreground border-0">
              <Award className="w-4 h-4 mr-2 inline" />
              {course.badge_text}
            </Badge>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 !text-white">
            {course.title}
          </h1>

          <p className="text-[18px] leading-relaxed mb-8 text-foreground/80">
            {course.short_description}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground/80">{stats.total_modules} Módulos</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground/80">{stats.total_lessons} Lecciones</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Clock className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground/80">{stats.total_duration_formatted} de Contenido</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
