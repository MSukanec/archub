import { Sparkles, Clock } from "lucide-react";
export function EssenceSection() {
  return (
    <section className="py-20 -mx-6 border-t" data-testid="section-essence">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              La Esencia
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">
            Una oportunidad única e irrepetible
          </h2>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              El Programa de Miembros Fundadores es una <strong className="text-foreground">oferta de tiempo limitado</strong> diseñada para formar un grupo selecto de usuarios comprometidos que actuarán como asesores estratégicos del producto.
            </p>
            <p>
              Tu feedback directo nos ayudará a <strong className="text-foreground">acelerar el desarrollo</strong> y priorizar las funcionalidades que realmente importan a los profesionales de la construcción.
            </p>
            <p>
              A cambio de tu compromiso, recibirás <strong className="text-foreground">beneficios exclusivos vitalicios</strong> que nunca más estarán disponibles para nuevos usuarios.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 mt-10 text-amber-500">
            <Clock className="h-5 w-5" />
            <span className="font-medium">El programa cerrará pronto</span>
          </div>
        </div>
      </div>
    </section>
  );
}
