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
    <section className="relative bg-gradient-to-br from-background via-background to-muted/20 py-16 sm:py-24 -mx-6 px-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Course Info */}
          <div className="space-y-6">
            {course.badge_text && (
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Award className="w-4 h-4 mr-2 inline" />
                {course.badge_text}
              </Badge>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              {course.title}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {course.short_description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-semibold">{stats.total_modules} Módulos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold">{stats.total_lessons} Lecciones</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold">{stats.total_duration_formatted} de Contenido</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto px-8 text-lg">
                  Inscribirme Ahora
                </Button>
              </Link>
              {course.price && (
                <div className="flex flex-col justify-center text-center sm:text-left">
                  <span className="text-3xl font-bold">
                    ${course.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/ año</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cover Image */}
          <div className="relative">
            {course.cover_url ? (
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={course.cover_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BookOpen className="w-24 h-24 text-primary/30" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
