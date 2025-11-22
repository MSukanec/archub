import { CheckCircle } from 'lucide-react';
import type { Course } from '@shared/schema';

interface FeaturesSectionProps {
  course: Course;
}

export function FeaturesSection({ course }: FeaturesSectionProps) {
  if (!course.highlights || course.highlights.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Qué Aprenderás
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Habilidades y conocimientos que adquirirás en este curso
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {course.highlights.map((highlight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="text-base leading-relaxed">{highlight}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
