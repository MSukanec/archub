import { User } from 'lucide-react';
import type { Course } from '@shared/schema';

interface InstructorSectionProps {
  course: Course;
}

export function InstructorSection({ course }: InstructorSectionProps) {
  if (!course.instructor_name) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          {/* Instructor Photo */}
          <div className="flex justify-center lg:justify-start">
            {course.instructor_photo_url ? (
              <img
                src={course.instructor_photo_url}
                alt={course.instructor_name}
                className="w-48 h-48 rounded-full object-cover shadow-xl"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-24 h-24 text-primary/40" />
              </div>
            )}
          </div>

          {/* Instructor Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <p className="text-sm font-semibold text-primary mb-2">Sobre el Docente</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {course.instructor_name}
              </h2>
              {course.instructor_title && (
                <p className="text-lg text-muted-foreground mt-2">
                  {course.instructor_title}
                </p>
              )}
            </div>

            {course.instructor_bio && (
              <div
                className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: course.instructor_bio }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
