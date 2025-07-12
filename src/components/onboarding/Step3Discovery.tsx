import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { HelpPopover } from "@/components/ui-custom/HelpPopover";

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
  'Documentación técnica',
  'Presupuestos de obra',
  'Organización de proyectos',
  'Seguimiento de obra',
  'Colaboración con clientes',
  'Capacitación / aprendizaje',
  'Exploración / curiosidad',
  'Otro'
];

// User role options (enum user_role)
const userRoleOptions = [
  'Arquitecto/a',
  'Ingeniero/a',
  'Maestro Mayor de Obras',
  'Estudiante',
  'Estudio de arquitectura',
  'Empresa constructora',
  'Proveedor de materiales',
  'Oficio profesional (instalador, herrero, carpintero, etc.)',
  'Otro'
];

// Team size options (enum team_size)
const teamSizeOptions = [
  'Trabajo solo/a',
  '2–5 personas',
  '6–15 personas',
  'Más de 15 personas'
];

export function Step3Discovery() {
  const { formData, updateFormData, goNextStep, goPrevStep } = useOnboardingStore();
  const { data: userData } = useCurrentUser();
  const [initialized, setInitialized] = useState(false);

  // Load existing user data if available - only once with state control
  useEffect(() => {
    if (userData?.user_data && !initialized) {
      console.log('Step3Discovery - Loading existing data:', {
        discovered_by: userData.user_data.discovered_by,
        main_use: userData.user_data.main_use,
        user_role: userData.user_data.user_role,
        team_size: userData.user_data.team_size
      });
      
      // Update form data with existing values if form is empty
      const updateData: any = {};
      
      if (userData.user_data.discovered_by && !formData.discovered_by) {
        updateData.discovered_by = userData.user_data.discovered_by;
        updateData.discovered_by_other_text = userData.user_data.discovered_by_other_text || '';
      }
      
      if (userData.user_data.main_use && !formData.main_use) {
        updateData.main_use = userData.user_data.main_use;
        updateData.main_use_other = userData.user_data.main_use_other || '';
      }
      
      if (userData.user_data.user_role && !formData.user_role) {
        updateData.user_role = userData.user_data.user_role;
        updateData.user_role_other = userData.user_data.user_role_other || '';
      }
      
      if (userData.user_data.team_size && !formData.team_size) {
        updateData.team_size = userData.user_data.team_size;
      }
      
      // Only update if we have data to update
      if (Object.keys(updateData).length > 0) {
        console.log('Step3Discovery - Updating form with:', updateData);
        updateFormData(updateData);
      }
      
      setInitialized(true);
    }
  }, [userData?.user_data, initialized, formData.discovered_by, formData.main_use, formData.user_role, formData.team_size, updateFormData]);

  const handleFinish = () => {
    if (formData.discovered_by && (formData.discovered_by !== 'Otro' || formData.discovered_by_other_text)) {
      // This should trigger the onboarding completion
      console.log('Step3Discovery - Finishing onboarding, calling goNextStep');
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
          <div className="flex items-center gap-2">
            <Label htmlFor="discovered_by">¿Cómo conociste Archub? *</Label>
            <HelpPopover
              title="Fuente de Descubrimiento"
              description="Conocer cómo nos encontraste nos ayuda a entender qué canales funcionan mejor y donde enfocar nuestros esfuerzos para llegar a más profesionales como tú."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
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
          <div className="flex items-center gap-2">
            <Label htmlFor="main_use">¿Para qué vas a usar principalmente Archub?</Label>
            <HelpPopover
              title="Uso Principal"
              description="Entender tu propósito principal nos permite personalizar las funciones más relevantes para ti y sugerir flujos de trabajo optimizados. Puedes cambiarlo después."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
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
          <div className="flex items-center gap-2">
            <Label htmlFor="user_role">¿Cuál es tu rol profesional?</Label>
            <HelpPopover
              title="Rol Profesional"
              description="Tu rol nos ayuda a mostrar las herramientas más relevantes para tu trabajo y conectarte con funciones específicas de tu profesión. Puedes actualizarlo en cualquier momento."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
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
          <div className="flex items-center gap-2">
            <Label htmlFor="team_size">¿Cuántas personas trabajan con vos?</Label>
            <HelpPopover
              title="Tamaño del Equipo"
              description="El tamaño de tu equipo nos ayuda a configurar permisos apropiados, sugerir planes de colaboración y ajustar funciones grupales según tu escala de trabajo."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
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
            onClick={handleFinish}
            disabled={!formData.discovered_by || (formData.discovered_by === 'Otro' && !formData.discovered_by_other_text)}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-8"
          >
            Finalizar Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}