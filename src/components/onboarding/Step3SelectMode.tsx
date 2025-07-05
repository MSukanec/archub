import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomRestricted } from "@/components/ui-custom/misc/CustomRestricted";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Building, Package, Hammer, Eye, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
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
    description: "Estudios de arquitectura, constructoras y empresas de construcción",
    icon: Building,
    color: "bg-[var(--accent)]"
  },
  {
    type: "provider",
    title: "Proveedor de Materiales",
    description: "Empresas que suministran materiales y equipos de construcción",
    icon: Package,
    color: "bg-[var(--accent)]"
  },
  {
    type: "worker",
    title: "Mano de Obra",
    description: "Contratistas, maestros de obra y profesionales independientes",
    icon: Hammer,
    color: "bg-[var(--accent)]"
  },
  {
    type: "visitor",
    title: "Solo Exploración",
    description: "Explora las funcionalidades sin compromiso",
    icon: Eye,
    color: "bg-[var(--accent)]"
  }
];

interface Step3SelectModeProps {
  isOnboarding?: boolean;
  onFinish?: () => void;
  isLoading?: boolean;
}

export function Step3SelectMode({ isOnboarding = true, onFinish, isLoading = false }: Step3SelectModeProps) {
  const { formData, updateFormData, goPrevStep } = useOnboardingStore();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const handleModeSelect = (modeType: ModeOption['type']) => {
    setSelectedMode(modeType);
    updateFormData({ last_user_type: modeType });
    
    if (onFinish) {
      onFinish();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
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
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modeOptions.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.type;
            const isAvailable = mode.type === 'professional'; // Solo profesional está disponible
            
            const cardContent = (
              <Card
                key={mode.type}
                className={`
                  ${isAvailable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-not-allowed opacity-60'}
                  transition-all duration-300 transform
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                  ${isLoading ? 'opacity-75' : ''}
                `}
                onClick={() => isAvailable && !isLoading && handleModeSelect(mode.type)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${mode.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {isLoading && isSelected && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-5 w-5 mr-1 animate-spin" />
                        <span className="text-sm font-medium">Guardando...</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                    {mode.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
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