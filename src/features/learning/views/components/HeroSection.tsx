import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLocation } from 'wouter'

export function HeroSection() {
  const [, navigate] = useLocation()

  return (
    <div 
      className="relative h-[200px] sm:h-[250px] md:h-96 overflow-hidden w-full"
      data-testid="hero-founders-program"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/hero-founders-1080.webp)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/100 dark:from-black/30 dark:via-black/70 dark:to-black/100" />

      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-12">
        <div className="max-w-3xl">
          <div className="mb-3 sm:mb-6">
            <Badge 
              style={{ 
                backgroundColor: 'var(--accent)', 
                color: 'white',
                borderColor: 'var(--accent)'
              }}
              className="text-[9px] sm:text-[10px] md:text-xs font-medium uppercase px-3 sm:px-4 py-1.5 sm:py-2"
              data-testid="badge-coming-soon"
            >
              Próximamente
            </Badge>
          </div>
          
          <h1 
            className="text-lg sm:text-2xl md:text-5xl font-bold mb-2 sm:mb-4 md:mb-6 tracking-tight !text-white line-clamp-2" 
            data-testid="text-hero-title"
          >
            Programa Fundadores
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base max-w-2xl mb-4 sm:mb-8 line-clamp-2 sm:line-clamp-3" style={{ color: 'rgb(200, 200, 200)' }}>
            Únete a los pioneros de Seencel y obtén acceso vitalicio al curso Master ArchiCAD Online, beneficios exclusivos y descuentos permanentes. Una oportunidad única que no volverá a repetirse.
          </p>
          
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() => navigate('/founders')}
              className="group/btn text-xs sm:text-sm md:text-base"
              data-testid="button-founders-info"
            >
              <span>Más Información</span>
              <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
