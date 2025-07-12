import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";
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
  'Constructor/a',
  'Desarrollador inmobiliario',
  'Estudiante',
  'Docente',
  'Investigador/a',
  'Consultor/a',
  'Propietario/a',
  'Inversión inmobiliaria',
  'Otro'
];

// Team size options (enum team_size)
const teamSizeOptions = [
  'Solo yo',
  '2–5 personas',
  '6–15 personas',
  'Más de 15 personas'
];

interface Step3DiscoveryProps {
  onFinish?: () => void;
}

export function Step3Discovery({ onFinish }: Step3DiscoveryProps) {
  const { formData, updateFormData, goPrevStep } = useOnboardingStore();
  const { data: userData } = useCurrentUser();

  // Initialize local state with form data or user data
  const initValue = (field: string) => {
    return formData[field] || userData?.user_data?.[field] || '';
  };

  const [discoveredBy, setDiscoveredBy] = useState(() => initValue('discovered_by'));
  const [discoveredByOther, setDiscoveredByOther] = useState(() => initValue('discovered_by_other_text'));
  const [mainUse, setMainUse] = useState(() => initValue('main_use'));
  const [mainUseOther, setMainUseOther] = useState(() => initValue('main_use_other'));
  const [userRole, setUserRole] = useState(() => initValue('user_role'));
  const [userRoleOther, setUserRoleOther] = useState(() => initValue('user_role_other'));
  const [teamSize, setTeamSize] = useState(() => initValue('team_size'));

  const handleFinish = () => {
    if (discoveredBy && (discoveredBy !== 'Otro' || discoveredByOther)) {
      // Update store with final values
      updateFormData({
        discovered_by: discoveredBy,
        discovered_by_other_text: discoveredByOther,
        main_use: mainUse,
        main_use_other: mainUseOther,
        user_role: userRole,
        user_role_other: userRoleOther,
        team_size: teamSize
      });
      
      console.log('Step3Discovery - Finishing onboarding, calling finish function from parent');
      // Call the finish function passed from parent instead of goNextStep
      if (onFinish) {
        onFinish();
      }
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
            <Label htmlFor="discovered_by">¿Cómo conociste Archub? <span className="text-[var(--accent)]">*</span></Label>
            <HelpPopover
              title="Fuente de Descubrimiento"
              description="Conocer cómo nos encontraste nos ayuda a entender qué canales funcionan mejor y donde enfocar nuestros esfuerzos para llegar a más profesionales como tú."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Select
            value={discoveredBy}
            onValueChange={(value) => {
              setDiscoveredBy(value);
              if (value !== 'Otro') {
                setDiscoveredByOther('');
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
        {discoveredBy === 'Otro' && (
          <div className="space-y-2">
            <Label htmlFor="discovered_by_other_text">Especifica cómo nos conociste <span className="text-[var(--accent)]">*</span></Label>
            <Input
              id="discovered_by_other_text"
              placeholder="Escribe aquí..."
              value={discoveredByOther}
              onChange={(e) => setDiscoveredByOther(e.target.value)}
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
            value={mainUse}
            onValueChange={(value) => {
              setMainUse(value);
              if (value !== 'Otro') {
                setMainUseOther('');
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
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

        {/* Campo adicional si elige "Otro" en uso principal */}
        {mainUse === 'Otro' && (
          <div className="space-y-2">
            <Label htmlFor="main_use_other">Especifica tu uso principal</Label>
            <Input
              id="main_use_other"
              placeholder="Escribe aquí..."
              value={mainUseOther}
              onChange={(e) => setMainUseOther(e.target.value)}
            />
          </div>
        )}

        {/* Rol profesional - OPCIONAL */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="user_role">¿Cuál es tu rol profesional?</Label>
            <HelpPopover
              title="Rol Profesional"
              description="Tu rol nos ayuda a adaptar el contenido, las funciones disponibles y las sugerencias del sistema para que sean más relevantes a tu área profesional."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Select
            value={userRole}
            onValueChange={(value) => {
              setUserRole(value);
              if (value !== 'Otro') {
                setUserRoleOther('');
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
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
        {userRole === 'Otro' && (
          <div className="space-y-2">
            <Label htmlFor="user_role_other">Especifica tu rol profesional</Label>
            <Input
              id="user_role_other"
              placeholder="Escribe aquí..."
              value={userRoleOther}
              onChange={(e) => setUserRoleOther(e.target.value)}
            />
          </div>
        )}

        {/* Tamaño del equipo - OPCIONAL */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="team_size">¿Cuántas personas trabajan en tu equipo/empresa?</Label>
            <HelpPopover
              title="Tamaño del Equipo"
              description="El tamaño de tu equipo nos permite configurar funciones colaborativas apropiadas y sugerir flujos de trabajo que se adapten mejor a tu estructura organizacional."
              primaryActionText="Entendido"
              placement="top"
            />
          </div>
          <Select
            value={teamSize}
            onValueChange={setTeamSize}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
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

        {/* Botones de navegación */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goPrevStep}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          
          <Button 
            onClick={handleFinish}
            disabled={!discoveredBy || (discoveredBy === 'Otro' && !discoveredByOther)}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
          >
            Finalizar configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}