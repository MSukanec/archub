import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useCountries } from "@/hooks/use-countries";
import { User } from "lucide-react";
import { HelpPopover } from "@/components/ui-custom/HelpPopover";

export function Step1UserData() {
  const { formData, updateFormData, goNextStep } = useOnboardingStore();
  const { data: countries } = useCountries();

  const handleNext = () => {
    if (formData.first_name && formData.last_name && formData.country && formData.birthdate) {
      goNextStep();
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
          Completa tu información personal y preferencias iniciales. Luego puedes cambiarlo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
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

        {/* País */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="country">País <span className="text-[var(--accent)]">*</span></Label>
            <HelpPopover
              title="País de Residencia"
              description="Tu país nos ayuda a configurar monedas locales, regulaciones y funcionalidades específicas de tu región."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Select
            value={formData.country}
            onValueChange={(value) => updateFormData({ country: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {countries?.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha de Nacimiento */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="birthdate">Fecha de Nacimiento <span className="text-[var(--accent)]">*</span></Label>
            <HelpPopover
              title="Fecha de Nacimiento"
              description="Tu fecha de nacimiento es privada y se usa únicamente para estadísticas demográficas internas y funcionalidades de edad requerida."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Input
            id="birthdate"
            type="date"
            value={formData.birthdate}
            onChange={(e) => updateFormData({ birthdate: e.target.value })}
          />
        </div>



        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleNext}
            disabled={!formData.first_name || !formData.last_name || !formData.country || !formData.birthdate}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-8"
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}