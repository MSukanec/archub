import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, ArrowRight, Sparkles, Users, Gift } from 'lucide-react';
import type { CoursesMode } from '@/features/shared-content/courses/types';

interface FoundersPromoSectionProps {
  mode?: CoursesMode;
  coursePrice?: number;
}

export function FoundersPromoSection({ mode = 'public', coursePrice }: FoundersPromoSectionProps) {
  const [, navigate] = useLocation();
  const foundersUrl = mode === 'dashboard' ? '/settings/founders' : '/founders';

  return (
    <section className="py-16 sm:py-20" data-testid="section-founders-promo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-0">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/5 via-accent/10 to-accent/5 border border-accent/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative p-8 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl">
                  <Crown className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold">Programa Fundadores</h2>
                    <Badge className="bg-accent text-accent-foreground text-xs font-semibold">
                      Oferta Limitada
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Suscripción anual con beneficios exclusivos de por vida
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Gift className="w-4 h-4 text-accent" />
                    Este curso incluido gratis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Suscríbete a los planes anuales PRO o TEAMS y obtén acceso completo a este curso 
                    sin costo adicional mientras mantengas tu suscripción activa.
                  </p>
                  {coursePrice && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg line-through text-muted-foreground">${coursePrice}/año</span>
                      <ArrowRight className="w-4 h-4 text-accent" />
                      <span className="text-lg font-bold text-accent">GRATIS</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    8 Beneficios exclusivos
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Acceso vitalicio a cursos de capacitación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Beneficio para toda tu organización</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Voz y voto en el roadmap del producto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Comunidad privada y soporte prioritario</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-accent/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Para profesionales y equipos de construcción</span>
                </div>
                
                <div className="flex-1" />
                
                <Button 
                  onClick={() => navigate(foundersUrl)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  data-testid="button-founders-promo"
                >
                  <Crown className="w-4 h-4" />
                  Ver Programa Fundadores
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="hidden xl:block" />
        </div>
      </div>
    </section>
  );
}
