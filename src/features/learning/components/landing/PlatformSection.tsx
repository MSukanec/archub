import { ExternalLink } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
interface PlatformSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  variant?: 'default'| 'no-container';
}
export function PlatformSection({ 
  title = "CÓMO FUNCIONA LA PLATAFORMA",
  subtitle = "NUESTRA PLATAFORMA",
  variant = 'default'
}: PlatformSectionProps) {
  const content = (
    <div className="space-y-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        variant="dark-bg"
      />
      <div className="space-y-6 text-sm sm:text-lg text-gray-300 leading-relaxed max-w-3xl">
        <p>
          Nuestra plataforma online está diseñada para ofrecerte una experiencia de aprendizaje clara, ordenada y flexible, similar a una estructura de tipo <span className="text-white font-semibold">Netflix</span>. Cada curso está dividido en <span className="text-white font-semibold">módulos temáticos</span>, organizados como temporadas, y dentro de cada módulo vas a encontrar <span className="text-white font-semibold">lecciones en video</span> con explicaciones precisas, contenido descargable y navegación fluida.
        </p>
        <p>
          Trabajamos con{''}
          <a 
            href="https://vimeo.com/es/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-accent font-semibold hover:underline inline-flex items-center gap-1"
          >
            Vimeo Pro
            <ExternalLink className="w-4 h-4" />
          </a>
          , lo que garantiza una reproducción segura, rápida y en alta calidad desde cualquier dispositivo, en cualquier lugar del mundo.
        </p>
        <p>
          El acceso es <span className="text-white font-semibold">100% online, disponible las 24 horas, todos los días</span>. Vas a poder avanzar a tu ritmo, pausar, volver atrás o repasar una clase cuantas veces quieras. ¿Querés ver todo el curso de corrido o retomar desde donde te quedaste? Podés hacerlo sin limitaciones.
        </p>
        <p>
          Además, cada lección cuenta con una breve descripción para que sepas exactamente qué vas a aprender antes de comenzar. Y si te olvidaste cómo funcionaba una herramienta o querés aplicar un concepto en tu proyecto, podés volver a consultar ese video al instante.
        </p>
        <p className="text-white font-semibold text-base sm:text-lg pt-4">
          Aprendé de forma profesional, práctica y organizada. A tus tiempos. A tu ritmo.
        </p>
      </div>
    </div>
  );
  if (variant === 'no-container') {
    return (
      <section 
        className="py-16 sm:py-20"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.9)), url(/seccion-plataforma-1080.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {content}
      </section>
    );
  }
  return (
    <section 
      className="py-16 sm:py-20"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.9)), url(/seccion-plataforma-1080.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-0">
          {content}
          <div className="hidden xl:block" />
        </div>
      </div>
    </section>
  );
}
