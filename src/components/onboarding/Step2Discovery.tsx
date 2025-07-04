import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Search, ArrowLeft } from "lucide-react";

const discoveryOptions = [
  'YouTube',
  'Instagram', 
  'TikTok',
  'Google',
  'Recomendación',
  'LinkedIn',
  'Twitter/X',
  'Otro'
];

export function Step2Discovery() {
  const { formData, updateFormData, goNextStep, goPrevStep } = useOnboardingStore();

  const handleNext = () => {
    if (formData.discovered_by && (formData.discovered_by !== 'Otro' || formData.discovered_by_other_text)) {
      goNextStep();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-[var(--accent)] text-white">
            <Search className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">¿Cómo conociste Archub?</CardTitle>
        <CardDescription className="text-base">
          Nos ayuda saber cómo llegaste hasta nosotros para mejorar nuestro alcance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="discovered_by">Fuente de descubrimiento *</Label>
          <Select
            value={formData.discovered_by}
            onValueChange={(value) => {
              updateFormData({ discovered_by: value });
              if (value !== 'Otro') {
                updateFormData({ discovered_by_other_text: '' });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {discoveryOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.discovered_by === 'Otro' && (
          <div className="space-y-2">
            <Label htmlFor="discovered_by_other_text">Especifica cómo nos conociste *</Label>
            <Input
              id="discovered_by_other_text"
              placeholder="Escribe aquí..."
              value={formData.discovered_by_other_text}
              onChange={(e) => updateFormData({ discovered_by_other_text: e.target.value })}
            />
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline"
            onClick={goPrevStep}
            className="px-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!formData.discovered_by || (formData.discovered_by === 'Otro' && !formData.discovered_by_other_text)}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-8"
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}