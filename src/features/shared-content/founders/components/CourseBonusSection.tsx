import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCourseLanding } from "@/features/learning";
import { Users, BadgeCheck, ArrowRight, Gift, Play } from "lucide-react";

export function CourseBonusSection() {
  const { data } = useCourseLanding('master-archicad');
  
  const coverUrl = data?.course?.cover_url;
  const courseSlug = data?.course?.slug || 'master-archicad';

  return (
    <section
      className="relative py-24 -mx-6 overflow-hidden"
      data-testid="section-course-bonus"
    >
      {coverUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}
      
      {!coverUrl && (
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(220, 40%, 15%) 0%, hsl(200, 50%, 10%) 100%)'
          }}
        />
      )}
      
      <div className="absolute inset-0 bg-black/75" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
              <Gift className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-medium text-white">Bonus de Capacitación Actual</span>
            </div>
          </div>

          <div className="text-center">
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: '#ffffff' }}
            >
              Curso Completo de Archicad
            </h2>
            
            <p 
              className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto"
              style={{ color: '#d0d0d0' }}
            >
              Como miembro fundador, tienes acceso <strong className="text-white">gratuito e incluido</strong> al 
              bonus de capacitación vigente. Actualmente es el curso más completo de Archicad en español, 
              un programa valorado en{' '}
              <span className="text-primary font-bold">USD $169/año</span> que podrás disfrutar 
              sin costo adicional mientras mantengas tu suscripción activa.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-white/90">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">+3.000 estudiantes de habla hispana</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <span className="font-medium">Avalado por Graphisoft Argentina</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 sm:p-8 mb-10 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-white/60 mb-1">Valor del curso</p>
                  <p className="text-2xl font-bold text-white/50 line-through">$169/año</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="text-sm text-primary mb-1">Con tu suscripción</p>
                  <p className="text-2xl font-bold text-primary">GRATIS</p>
                </div>
              </div>
              <p className="text-sm text-white/70">
                Acceso permanente mientras seas miembro fundador. Para todos los miembros de la organización. Sin pagos adicionales, sin renovaciones.
              </p>
            </div>

            <Link href={`/cursos/${courseSlug}`}>
              <Button
                size="lg"
                className="px-8 py-6 text-lg font-medium"
                data-testid="button-course-bonus-cta"
              >
                <Play className="mr-2 h-5 w-5" />
                Ver detalles del curso
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
