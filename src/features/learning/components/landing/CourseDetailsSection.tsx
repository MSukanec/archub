import { SectionHeader } from './SectionHeader';
interface CourseDetailsSectionProps {
  course?: any;
  title?: string;
  subtitle?: string;
  description?: string;
  variant?: 'default'| 'no-container';
}
export function CourseDetailsSection({ 
  course,
  title = "DETALLES DEL CURSO",
  subtitle = "INFORMACIÓN COMPLETA",
  description = "Todo lo que necesitas saber antes de comenzar",
  variant = 'default'
}: CourseDetailsSectionProps) {
  if (!course) return null;
  const content = (
    <div className="space-y-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        description={description}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background rounded-lg border shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm md:text-base uppercase tracking-wide font-semibold text-accent">
              INFORMACIÓN DEL CURSO
            </p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
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
        <div className="bg-background rounded-lg border shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm md:text-base uppercase tracking-wide font-semibold text-accent">
              ACCESO Y DURACIÓN
            </p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
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
  );
  if (variant === 'no-container') {
    return <section className="py-16 sm:py-20">{content}</section>;
  }
  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-0">
          {content}
          <div className="hidden xl:block" />
        </div>
      </div>
    </section>
  );
}
