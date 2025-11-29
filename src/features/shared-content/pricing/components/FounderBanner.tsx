import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";

export function FounderBanner() {
  return (
    <Card className="border border-accent/20 bg-gradient-to-r from-background via-accent/[0.03] to-background">
      <div className="p-6 flex items-start gap-4">
        <div className="p-2.5 bg-accent/10 rounded-lg flex-shrink-0">
          <Crown className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-[var(--text-default)]">
              Oferta de Lanzamiento: Conviértete en Fundador
            </h3>
            <Badge className="bg-accent text-accent-foreground text-xs">
              Limitado
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Suscripción <strong>ANUAL</strong> incluye beneficios exclusivos de por vida:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
              <span>Badge de "Fundador" en tu perfil</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
              <span>Acceso anticipado a nuevas funcionalidades</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
              <span>Grupo privado de Fundadores</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
              <span>10% descuento en renovaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
              <span>20% descuento en suscripciones a cursos</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
