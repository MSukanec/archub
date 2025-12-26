import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { FoundersSectionProps } from "../types";
export function HeroSection({ mode }: FoundersSectionProps) {
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  const ctaHref = mode === 'dashboard'
    ? '/settings/pricing-plan?billing=annual'
    : isAuthenticated 
      ? '/settings/pricing-plan?billing=annual'
      : '/precios';
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 -mx-6 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/hero-founders-1080.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
      data-testid="section-hero"
    >
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(76, 100%, 40%) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, hsl(76, 80%, 30%) 0%, transparent 50%)`,
            filter: 'blur(80px)'
          }}
        />
      </div>
      <div className="text-center max-w-4xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8">
          <Star className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-medium text-white">El Círculo Exclusivo de Seencel</span>
        </div>
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8"
          style={{
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: '-0.022em'
          }}
        >
          Programa de Miembros Fundadores
        </h1>
        <p
          className="text-lg sm:text-xl mb-12 max-w-3xl mx-auto"
          style={{ color: '#b0b0b0', lineHeight: 1.6 }}
        >
          Únete a los pioneros que están dando forma al futuro de la gestión de la construcción y accede a beneficios vitalicios exclusivos.
        </p>
        <Link href={ctaHref}>
          <Button
            size="lg"
            className="px-8 py-6 text-lg font-medium"
            data-testid="button-hero-cta"
          >
            Quiero ser Fundador
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
