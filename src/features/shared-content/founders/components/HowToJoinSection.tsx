import { CheckCircle, Zap, Clock } from "lucide-react";

export function HowToJoinSection() {
  return (
    <section className="py-20 -mx-6" data-testid="section-how-to-join">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Cómo Unirse
            </h2>
            <p className="text-xl text-muted-foreground">
              El proceso es simple y directo
            </p>
          </div>

          <div className="bg-card rounded-2xl border p-8 sm:p-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Suscripción Anual</h3>
                  <p className="text-muted-foreground">
                    El programa está disponible exclusivamente para usuarios con suscripción anual (Plan Pro o Teams). 
                    Al suscribirte anualmente, automáticamente te conviertes en miembro fundador.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Activación Inmediata</h3>
                  <p className="text-muted-foreground">
                    Una vez completada tu suscripción, todos los beneficios de fundador se activan automáticamente 
                    para ti y para toda tu organización.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Oferta por Tiempo Limitado</h3>
                  <p className="text-muted-foreground">
                    El programa de fundadores cerrará pronto y nunca volverá a abrirse. 
                    Esta es tu única oportunidad de asegurar estos beneficios vitalicios.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
