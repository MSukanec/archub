import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Clock, CheckCircle, Award, MessageCircle, Shield } from 'lucide-react';
import type { Course } from '@shared/schema';
import type { CourseStats } from '../types';

interface CourseStickyCardProps {
  course: Course;
  stats: CourseStats;
}

export function CourseStickyCard({ course, stats }: CourseStickyCardProps) {
  return (
    <Card className="overflow-hidden shadow-xl border-2" data-testid="card-course-sticky">
      {/* Course Image */}
      {course.cover_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardContent className="p-6 space-y-6">
        {/* Course Title */}
        <div>
          <h3 className="font-bold text-xl" data-testid="text-course-title">
            {course.title}
          </h3>
        </div>

        {/* Price */}
        {course.price && (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary" data-testid="text-course-price">
                ${course.price}
              </span>
              <span className="text-sm text-muted-foreground">/ año</span>
            </div>
          </div>
        )}

        {/* Course Stats */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
            <span data-testid="text-modules">{stats.total_modules} Módulos</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <span data-testid="text-lessons">{stats.total_lessons} Lecciones</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <span data-testid="text-duration">{stats.total_duration_formatted} de Contenido</span>
          </div>
        </div>

        {/* Additional Features */}
        <div className="space-y-2 text-sm border-t pt-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Certificado de Curso</span>
          </div>
          <div className="flex items-start gap-2">
            <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Foro de Consultas Privado</span>
          </div>
          {course.instructor_name && (
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Avalado por {course.instructor_name}</span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <Link href="/register">
            <Button 
              size="lg" 
              className="w-full text-base font-semibold"
              data-testid="button-enroll"
            >
              INSCRIBIRME
            </Button>
          </Link>
          <Link href="/login">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full text-base font-semibold"
              data-testid="button-continue"
            >
              CONTINUAR CURSO
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
