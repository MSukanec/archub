import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export function FounderBanner() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 rounded-2xl blur-2xl" />
      <Card className="relative border border-accent/30 bg-gradient-to-br from-background via-accent/[0.05] to-background shadow-lg hover:shadow-xl transition-shadow">
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex-shrink-0">
                <Crown className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-[var(--text-default)]">
                    Programa de Fundadores
                  </h3>
                  <Badge className="bg-accent text-accent-foreground text-xs font-semibold">
                    Oferta Limitada
                  </Badge>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Suscripción <strong>ANUAL</strong> con 8 beneficios exclusivos de por vida
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-muted)]">Beneficio Organizacional para todo tu equipo</span>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-[var(--text-muted)]">
                <span>Acceso vitalicio al Curso de </span>
                <Link href="/cursos" className="text-accent hover:underline inline-flex items-center gap-1">
                  Archicad
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-muted)]">Voz y voto directo en el roadmap</span>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-muted)]">Acceso anticipado a nuevas funcionalidades</span>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-muted)]">Comunidad privada en Discord</span>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-muted)]">Insignia de Fundador pública en tu perfil</span>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-muted)]">Incluido en directorio de organizaciones fundadoras</span>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-[var(--text-muted)]">Estatus permanente mientras mantengas tu suscripción</span>
            </div>
          </div>

          <div className="pt-2 border-t border-accent/10">
            <p className="text-xs text-[var(--text-muted)]">
              ¿Preguntas? <Link href="/contact" className="text-accent hover:underline">Contacta con nuestro equipo</Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
