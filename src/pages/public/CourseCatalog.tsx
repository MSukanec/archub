import { MarketingLayout } from '@/layouts';
import { CoursesCatalogContent } from '@/features/shared-content/courses';

export default function CourseCatalog() {
  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Cursos", href: "/cursos" },
        { label: "Fundadores", href: "/founders" },
        { label: "Precios", href: "/precios" },
        { label: "Contacto", href: "/contact" }
      ]}
      seo={{
        title: "Cursos Online | Seencel",
        description: "Explora nuestro catálogo de cursos profesionales. Aprende a tu ritmo con los mejores instructores.",
        keywords: "cursos online, capacitación profesional, cursos archicad",
      }}
    >
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
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <CoursesCatalogContent mode="public" showTabs={true} />
      </section>

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
    </MarketingLayout>
  );
}
