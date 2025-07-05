import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useThemeStore } from "@/stores/themeStore";
import { User, Palette } from "lucide-react";
import { HelpPopover } from "@/components/ui-custom/HelpPopover";

export function Step1UserData() {
  const { formData, updateFormData, goNextStep } = useOnboardingStore();
  const { setTheme } = useThemeStore();

  const handleNext = () => {
    if (formData.first_name && formData.last_name && formData.organization_name) {
      goNextStep();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre/s *</Label>
            <Input
              id="first_name"
              placeholder="Tu nombre"
              value={formData.first_name}
              onChange={(e) => updateFormData({ first_name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last_name">Apellido/s *</Label>
            <Input
              id="last_name"
              placeholder="Tu apellido"
              value={formData.last_name}
              onChange={(e) => updateFormData({ last_name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organization_name">Nombre de Organización / Empresa *</Label>
            <Input
              id="organization_name"
              placeholder="Nombre de tu organización"
              value={formData.organization_name}
              onChange={(e) => updateFormData({ organization_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="theme">Tema de la aplicación</Label>
              <HelpPopover
                title="Modo Oscuro"
                description="Activa el modo oscuro para reducir fatiga visual y ahorrar batería. Puedes cambiarlo después desde tu perfil."
                primaryActionText="Entendido"
                secondaryActionText="Más info"
                onSecondaryAction={() => console.log("Más información sobre temas")}
                placement="top"
              />
            </div>
            <Select
              value={formData.theme}
              onValueChange={(value: 'light' | 'dark') => {
                updateFormData({ theme: value });
                setTheme(value === 'dark');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Claro
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Oscuro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleNext}
            disabled={!formData.first_name || !formData.last_name || !formData.organization_name}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-8"
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}