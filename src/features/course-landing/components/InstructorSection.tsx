import { User } from 'lucide-react';
import type { Course } from '@shared/schema';
import { SectionHeader } from './SectionHeader';

interface InstructorSectionProps {
  course: Course;
  title?: string;
  subtitle?: string;
  description?: string;
}

export function InstructorSection({ 
  course, 
  title = "SOBRE EL DOCENTE",
  subtitle = "NUESTRO CURSO",
  description 
}: InstructorSectionProps) {
  if (!course.instructor_name) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid: 3/4 for content, 1/4 empty space for sticky */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Content Area - 3/4 of width */}
          <div className="lg:col-span-3 space-y-12">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              description={description}
            />
            
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
                  <h3 className="text-3xl font-bold tracking-tight">
                    {course.instructor_name}
                  </h3>
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

          {/* Empty Space - 1/4 of width for sticky to pass over */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
