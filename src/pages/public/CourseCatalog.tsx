import { MarketingLayout } from '@/layouts';
import { useAllCourses, CourseGrid } from '@/features/learning';
import { BookOpen } from 'lucide-react';

export default function CourseCatalog() {
  const { data: courses, isLoading, error } = useAllCourses();

  if (error) {
    return (
      <MarketingLayout
        headerNavigation={[
          { label: "Cursos", href: "/cursos" },
          { label: "Características", href: "/#features" },
          { label: "Capacidades", href: "/#capabilities" }
        ]}
        seo={{
          title: "Cursos Online | Seencel",
          description: "Explora nuestro catálogo de cursos profesionales. Aprende a tu ritmo con los mejores instructores.",
          keywords: "cursos online, capacitación profesional, cursos archicad",
        }}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Error al cargar cursos</h1>
            <p className="text-muted-foreground">
              Hubo un problema al cargar los cursos. Por favor, intenta de nuevo más tarde.
            </p>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Cursos", href: "/cursos" },
        { label: "Características", href: "/#features" },
        { label: "Capacidades", href: "/#capabilities" }
      ]}
      seo={{
        title: "Cursos Online | Seencel",
        description: "Explora nuestro catálogo de cursos profesionales. Aprende a tu ritmo con los mejores instructores.",
        keywords: "cursos online, capacitación profesional, cursos archicad",
      }}
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-background to-muted/20 py-16 sm:py-20 -mx-6 px-6 mb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Cursos Disponibles
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Explora nuestro catálogo de cursos profesionales. Aprende a tu ritmo con los mejores instructores
              y desarrolla las habilidades que necesitas para destacar en tu carrera.
            </p>

            <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium">Acceso ilimitado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <CourseGrid courses={courses || []} isLoading={isLoading} />
      </section>

      {/* Additional Info Section */}
      {!isLoading && courses && courses.length > 0 && (
        <section className="relative bg-gradient-to-br from-muted/20 to-background py-12 -mx-6 px-6 mt-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <h2 className="text-2xl font-bold">¿Listo para comenzar?</h2>
              <p className="text-muted-foreground">
                Selecciona un curso y comienza tu viaje de aprendizaje hoy mismo.
                Todos nuestros cursos están diseñados para que aprendas a tu propio ritmo.
              </p>
            </div>
          </div>
        </section>
      )}
    </MarketingLayout>
  );
}
