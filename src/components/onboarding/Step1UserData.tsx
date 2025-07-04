import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { User, Palette } from "lucide-react";

export function Step1UserData() {
  const { formData, updateFormData, goNextStep } = useOnboardingStore();

  const handleNext = () => {
    if (formData.first_name && formData.last_name) {
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
          Completa tu información personal y preferencias iniciales
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre *</Label>
            <Input
              id="first_name"
              placeholder="Tu nombre"
              value={formData.first_name}
              onChange={(e) => updateFormData({ first_name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last_name">Apellido *</Label>
            <Input
              id="last_name"
              placeholder="Tu apellido"
              value={formData.last_name}
              onChange={(e) => updateFormData({ last_name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Tema de la aplicación</Label>
          <Select
            value={formData.theme}
            onValueChange={(value: 'light' | 'dark') => updateFormData({ theme: value })}
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

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleNext}
            disabled={!formData.first_name || !formData.last_name}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-8"
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}