import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Course } from '@shared/schema';

interface CTAFooterProps {
  course: Course;
}

export function CTAFooter({ course }: CTAFooterProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-muted-foreground">
            Únete hoy y transforma tu forma de trabajar
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="px-8 text-lg">
                Inscribirme Ahora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            {course.price && (
              <div className="text-center">
                <p className="text-3xl font-bold">${course.price}</p>
                <p className="text-sm text-muted-foreground">/ año</p>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Acceso inmediato • Sin compromisos • Contenido siempre disponible
          </p>
        </div>
      </div>
    </section>
  );
}
