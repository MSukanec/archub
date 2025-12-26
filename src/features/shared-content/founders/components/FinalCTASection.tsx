import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { FoundersSectionProps } from "../types";
export function FinalCTASection({ mode }: FoundersSectionProps) {
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  const ctaHref = mode === 'dashboard'
    ? '/settings/pricing-plan?billing=annual'
    : isAuthenticated 
      ? '/settings/pricing-plan?billing=annual'
      : '/precios';
  const ctaText = mode === 'dashboard'
    ? 'Actualizar a Plan Anual'
    : isAuthenticated 
      ? 'Ver Planes Anuales'
      : 'Suscribirme al Plan Anual';
  return (
    <section
      className="py-20 -mx-6"
      style={{
        background: 'linear-gradient(135deg, hsl(0, 0%, 8%) 0%, hsl(76, 30%, 12%) 50%, hsl(0, 0%, 10%) 100%)'
      }}
      data-testid="section-final-cta"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8"
            style={{ color: '#ffffff'}}
          >
            ¿Listo para ser parte de la historia de Seencel?
          </h2>
          <p
            className="text-lg sm:text-xl mb-12 max-w-2xl mx-auto"
            style={{ color: '#b0b0b0'}}
          >
            Únete hoy al grupo exclusivo de fundadores y asegura beneficios vitalicios 
            mientras ayudas a construir el futuro de la gestión de proyectos de construcción.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ctaHref}>
              <Button
                size="lg"
                className="px-8 py-6 text-lg font-medium"
                data-testid="button-final-cta"
              >
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: '#808080'}}>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Beneficios inmediatos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Estatus vitalicio</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Oferta exclusiva</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
