import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Search, ArrowLeft } from "lucide-react";

// Discovery source options (enum discovery_source)
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

// Main use options (enum main_use)
const mainUseOptions = [
  'Gestión de proyectos',
  'Control de presupuestos',
  'Seguimiento de obra',
  'Administración de equipos',
  'Documentación técnica',
  'Comercialización',
  'Otro'
];

// User role options (enum user_role)
const userRoleOptions = [
  'Arquitecto/a',
  'Ingeniero/a',
  'Constructor/a',
  'Project Manager',
  'Desarrollador inmobiliario',
  'Inversor',
  'Estudiante',
  'Otro'
];

// Team size options (enum team_size)
const teamSizeOptions = [
  'Solo yo',
  '2-5 personas',
  '6-15 personas',
  '16-50 personas',
  'Más de 50 personas'
];

export function Step2Discovery() {
  const { formData, updateFormData, goNextStep, goPrevStep } = useOnboardingStore();

  const handleNext = () => {
    if (formData.discovered_by && (formData.discovered_by !== 'Otro' || formData.discovered_by_other_text)) {
      goNextStep();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[var(--card-bg)] border-[var(--card-border)]">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-[var(--accent)] text-white">
            <Search className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Queremos conocerte mejor</CardTitle>
        <CardDescription className="text-base">
          Esta información nos ayuda a personalizar tu experiencia en Archub y mejorar nuestra plataforma.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Fuente de descubrimiento - OBLIGATORIO */}
        <div className="space-y-2">
          <Label htmlFor="discovered_by">¿Cómo conociste Archub? *</Label>
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

        {/* Campo adicional si elige "Otro" */}
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

        {/* Uso principal - OPCIONAL */}
        <div className="space-y-2">
          <Label htmlFor="main_use">¿Para qué vas a usar principalmente Archub?</Label>
          <Select
            value={formData.main_use || ''}
            onValueChange={(value) => updateFormData({ main_use: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="¿Para qué vas a usar principalmente Archub?" />
            </SelectTrigger>
            <SelectContent>
              {mainUseOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rol profesional - OPCIONAL */}
        <div className="space-y-2">
          <Label htmlFor="user_role">¿Cuál es tu rol profesional?</Label>
          <Select
            value={formData.user_role || ''}
            onValueChange={(value) => {
              updateFormData({ user_role: value });
              if (value !== 'Otro') {
                updateFormData({ user_role_other: '' });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="¿Cuál es tu rol profesional?" />
            </SelectTrigger>
            <SelectContent>
              {userRoleOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campo adicional si elige "Otro" en rol */}
        {formData.user_role === 'Otro' && (
          <div className="space-y-2">
            <Label htmlFor="user_role_other">Especifica tu rol</Label>
            <Input
              id="user_role_other"
              placeholder="Escribe aquí..."
              value={formData.user_role_other}
              onChange={(e) => updateFormData({ user_role_other: e.target.value })}
            />
          </div>
        )}

        {/* Tamaño de equipo - OPCIONAL */}
        <div className="space-y-2">
          <Label htmlFor="team_size">¿Cuántas personas trabajan con vos?</Label>
          <Select
            value={formData.team_size || ''}
            onValueChange={(value) => updateFormData({ team_size: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="¿Cuántas personas trabajan con vos?" />
            </SelectTrigger>
            <SelectContent>
              {teamSizeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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