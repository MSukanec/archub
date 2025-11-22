import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
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
    <section className="relative min-h-[500px] py-16 flex items-center overflow-hidden rounded-xl">
      {/* Background Image with Overlay */}
      {course.cover_url ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-xl"
            style={{ backgroundImage: `url(${course.cover_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/50 dark:from-black/90 dark:via-black/80 dark:to-black/60 rounded-xl" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 rounded-xl" />
      )}

      {/* Content */}
      <div className="w-full px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="max-w-2xl">
          {course.badge_text && (
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium mb-6 bg-primary/90 text-primary-foreground border-0">
              <Award className="w-4 h-4 mr-2 inline" />
              {course.badge_text}
            </Badge>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-white dark:text-white">
            {course.title}
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed mb-8 text-gray-100 dark:text-gray-200">
            {course.short_description}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white">{stats.total_modules} Módulos</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white">{stats.total_lessons} Lecciones</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white">{stats.total_duration_formatted} de Contenido</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto px-8 text-lg shadow-lg hover:shadow-xl">
                Inscribirme Ahora
              </Button>
            </Link>
            {course.price && (
              <div className="flex flex-col justify-center text-left bg-white/10 dark:bg-white/5 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                <span className="text-3xl font-bold text-white">
                  ${course.price}
                </span>
                <span className="text-sm text-gray-200">/ año</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
