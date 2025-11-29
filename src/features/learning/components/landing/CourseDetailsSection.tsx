import { SectionHeader } from './SectionHeader';

interface CourseDetailsSectionProps {
  course?: any;
  title?: string;
  subtitle?: string;
  description?: string;
}

export function CourseDetailsSection({ 
  course,
  title = "DETALLES DEL CURSO",
  subtitle = "INFORMACIÓN COMPLETA",
  description = "Todo lo que necesitas saber antes de comenzar"
}: CourseDetailsSectionProps) {
  if (!course) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          <div className="lg:col-span-3 space-y-12">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              description={description}
            />

            {/* 2 Column Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Card - Course Details */}
              <div className="bg-background rounded-lg border shadow-sm p-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs sm:text-base uppercase tracking-wide font-semibold" style={{ color: '#9EFF00' }}>
                    INFORMACIÓN DEL CURSO
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    Detalles Completos
                  </h3>
                </div>

                <ul className="space-y-3 text-sm sm:text-base text-muted-foreground">
                  {course.course_name && (
                    <li className="flex gap-3">
                      <span className="font-semibold text-foreground">NOMBRE:</span>
                      <span>{course.course_name}</span>
                    </li>
                  )}
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">SISTEMA:</span>
                    <span>Online</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">FORMATO:</span>
                    <span>Videos bajo demanda</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">DISPOSITIVOS:</span>
                    <span>PC, Tablet, Móviles</span>
                  </li>
                  {course.instructor_name && (
                    <li className="flex gap-3">
                      <span className="font-semibold text-foreground">DOCENTE:</span>
                      <span>{course.instructor_name}</span>
                    </li>
                  )}
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">CERTIFICADO:</span>
                    <span>De curso realizado</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">REQUISITOS:</span>
                    <span>Sin conocimientos previos requeridos</span>
                  </li>
                </ul>
              </div>

              {/* Right Card - Access Info */}
              <div className="bg-background rounded-lg border shadow-sm p-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs sm:text-base uppercase tracking-wide font-semibold" style={{ color: '#9EFF00' }}>
                    ACCESO Y DURACIÓN
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    Tu Suscripción
                  </h3>
                </div>

                <ul className="space-y-3 text-sm sm:text-base text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">TIPO:</span>
                    <span>Acceso anual ilimitado</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">DURACIÓN:</span>
                    <span>365 días desde la suscripción</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">CARÁCTER:</span>
                    <span>Individual e intransferible</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">ACCESO:</span>
                    <span>100% online, disponible 24/7</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">VELOCIDAD:</span>
                    <span>Aprende a tu ritmo, cuantas veces quieras</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-foreground">CONTENIDO:</span>
                    <span>Descargas, videos, y material complementario</span>
                  </li>
                </ul>
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
