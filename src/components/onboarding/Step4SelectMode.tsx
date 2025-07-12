import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomRestricted } from "@/components/ui-custom/misc/CustomRestricted";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Building, Package, Hammer, Eye, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { HelpPopover } from "@/components/ui-custom/HelpPopover";
import { useState } from "react";

interface ModeOption {
  type: 'professional' | 'provider' | 'worker' | 'visitor';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const modeOptions: ModeOption[] = [
  {
    type: "professional",
    title: "Profesional",
    description: "Gestiona proyectos completos con equipos, presupuestos, cronogramas y documentación técnica",
    icon: Building,
    color: "bg-[var(--accent)]"
  },
  {
    type: "provider",
    title: "Proveedor de Materiales",
    description: "Administra catálogo de productos, cotizaciones y seguimiento de entregas a obras",
    icon: Package,
    color: "bg-[var(--accent)]"
  },
  {
    type: "worker",
    title: "Mano de Obra",
    description: "Registra avances, reporta incidencias y coordina tareas con el equipo del proyecto",
    icon: Hammer,
    color: "bg-[var(--accent)]"
  },
  {
    type: "visitor",
    title: "Solo Exploración",
    description: "Explora las funcionalidades sin comprometerte con datos de proyectos reales",
    icon: Eye,
    color: "bg-[var(--accent)]"
  }
];

function getHelpDescription(type: string): string {
  switch (type) {
    case 'professional':
      return 'Modo ideal para arquitectos, ingenieros, constructoras y estudios. Incluye gestión completa de proyectos, equipos, presupuestos, cronogramas y documentación técnica profesional. Puedes cambiar el modo después.';
    case 'provider':
      return 'Diseñado para empresas proveedoras de materiales y equipos. Permite gestionar catálogos, enviar cotizaciones, rastrear entregas y coordinar con múltiples obras simultáneamente.';
    case 'worker':
      return 'Perfecto para contratistas, maestros de obra y trabajadores independientes. Facilita el registro de avances, reporte de incidencias y coordinación de tareas dentro del equipo.';
    case 'visitor':
      return 'Explora todas las funcionalidades de Archub sin necesidad de ingresar datos reales de proyectos. Ideal para conocer la plataforma antes de decidirte por un modo específico.';
    default:
      return 'Selecciona el modo que mejor se adapte a tu rol y necesidades profesionales.';
  }
}

interface Step3SelectModeProps {
  isOnboarding?: boolean;
  onFinish?: () => void;
  isLoading?: boolean;
}

export function Step4SelectMode({ isOnboarding = true, onFinish, isLoading = false }: Step3SelectModeProps) {
  const { formData, updateFormData, goPrevStep } = useOnboardingStore();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const handleModeSelect = (modeType: ModeOption['type']) => {
    setSelectedMode(modeType);
    updateFormData({ last_user_type: modeType });
    
    // Usar setTimeout para asegurar que el estado se actualice antes de llamar onFinish
    if (onFinish) {
      setTimeout(() => {
        onFinish();
      }, 300); // Aumentar el delay para asegurar que el estado se actualice
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[var(--card-bg)] border-[var(--card-border)]">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-[var(--accent)] text-white">
            <CheckCircle className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Elegir modo de uso</CardTitle>
        <CardDescription className="text-base">
          Elige cómo planeas usar Archub para personalizar tu experiencia. Luego puedes cambiarlo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modeOptions.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.type;
            const isAvailable = mode.type === 'professional'; // Solo profesional está disponible
            
            const cardContent = (
              <Card
                key={mode.type}
                className={`
                  bg-[var(--card-bg)] border-[var(--card-border)]
                  ${isAvailable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-not-allowed opacity-60'}
                  transition-all duration-300 transform
                  ${isSelected ? 'ring-2 ring-[var(--accent)]' : ''}
                  ${isLoading ? 'opacity-75' : ''}
                `}
                onClick={() => isAvailable && !isLoading && handleModeSelect(mode.type)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${mode.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isLoading && isSelected && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        <span className="text-xs font-medium">Guardando...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {mode.title}
                    </CardTitle>
                    <HelpPopover
                      title={`Modo ${mode.title}`}
                      description={getHelpDescription(mode.type)}
                      primaryActionText="Entendido"
                      placement="top"
                      iconSize={16}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {mode.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );

            if (!isAvailable) {
              return (
                <CustomRestricted key={mode.type} reason="coming_soon">
                  {cardContent}
                </CustomRestricted>
              );
            }

            return cardContent;
          })}
        </div>

        {isOnboarding && (
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline"
              onClick={goPrevStep}
              className="px-8"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}