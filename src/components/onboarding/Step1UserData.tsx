import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { User } from "lucide-react";
import { HelpPopover } from "@/components/ui-custom/HelpPopover";

interface Step1UserDataProps {
  onFinish?: () => void;
}

export function Step1UserData({ onFinish }: Step1UserDataProps = {}) {
  const { formData, updateFormData, goNextStep } = useOnboardingStore();

  const handleFinish = () => {
    if (formData.first_name && formData.last_name && formData.organization_name) {
      if (onFinish) {
        onFinish();
      } else {
        goNextStep();
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[var(--card-bg)] border-[var(--card-border)]">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-[var(--accent)] text-white">
            <User className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Datos básicos</CardTitle>
        <CardDescription className="text-base">
          Completa tu información personal y el nombre de tu organización.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Nombre y Apellido - Inline en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="first_name">Nombre/s <span className="text-[var(--accent)]">*</span></Label>
              <HelpPopover
                title="Nombre Personal"
                description="Usamos tu nombre para personalizar tu experiencia y para que tu equipo pueda identificarte en colaboraciones. Puedes usar uno o varios nombres."
                primaryActionText="Entendido"
                placement="top"
              />
            </div>
            <Input
              id="first_name"
              placeholder="Tu nombre"
              value={formData.first_name}
              onChange={(e) => updateFormData({ first_name: e.target.value })}
            />
          </div>
          
          {/* Apellido */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="last_name">Apellido/s <span className="text-[var(--accent)]">*</span></Label>
              <HelpPopover
                title="Apellido Personal"
                description="Tu apellido completa tu identificación en la plataforma y es útil para reportes oficiales y documentación del proyecto."
                primaryActionText="Entendido"
                placement="top"
              />
            </div>
            <Input
              id="last_name"
              placeholder="Tu apellido"
              value={formData.last_name}
              onChange={(e) => updateFormData({ last_name: e.target.value })}
            />
          </div>
        </div>

        {/* Nombre de Organización */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="organization_name">Nombre de Organización / Empresa <span className="text-[var(--accent)]">*</span></Label>
            <HelpPopover
              title="Organización"
              description="El nombre de tu empresa o estudio será visible en reportes, presupuestos y documentación oficial. Asegúrate de usar el nombre legal completo."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Input
            id="organization_name"
            placeholder="Nombre de tu organización"
            value={formData.organization_name}
            onChange={(e) => updateFormData({ organization_name: e.target.value })}
          />
        </div>



        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleFinish}
            disabled={!formData.first_name || !formData.last_name || !formData.organization_name}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-8"
          >
            {onFinish ? 'Finalizar configuración' : 'Siguiente'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}