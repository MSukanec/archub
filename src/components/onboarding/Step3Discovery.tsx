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
  'Arquitecto',
  'Ingeniero',
  'Maestro Mayor de Obras',
  'Constructor',
  'Desarrollador inmobiliario',
  'Estudiante',
  'Docente',
  'Investigador',
  'Consultor',
  'Propietario',
  'Inversión inmobiliaria',
  'Otro'
];

// Team size options (enum team_size)
const teamSizeOptions = [
  'Solo yo',
  '2-5 personas',
  '6-15 personas',
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
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = () => {
    if (isFinishing) return; // Prevent multiple executions
    
    if (discoveredBy && (discoveredBy !== 'Otro' || discoveredByOther)) {
      setIsFinishing(true);
      
      // Update store with final values (removed user_role and team_size)
      updateFormData({
        discovered_by: discoveredBy,
        discovered_by_other_text: discoveredByOther,
        main_use: mainUse,
        main_use_other: mainUseOther
      });
      
      console.log('Step3Discovery - Finishing onboarding, calling finish function from parent');
      // Call the finish function passed from parent instead of goNextStep
      if (onFinish) {
        // Use setTimeout to ensure the state update happens before the mutation
        setTimeout(() => {
          onFinish();
        }, 50);
      }
    }
  };

  return (
          </div>
        </div>
          Esta información nos ayuda a personalizar tu experiencia en Archub y mejorar nuestra plataforma.
        </CardDescription>
      </CardHeader>
      
        {/* Fuente de descubrimiento - OBLIGATORIO */}
            <HelpPopover
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
            <Input
              id="discovered_by_other_text"
              placeholder="Escribe aquí..."
              value={discoveredByOther}
              onChange={(e) => setDiscoveredByOther(e.target.value)}
            />
          </div>
        )}

        {/* Uso principal - OPCIONAL */}
            <Label htmlFor="main_use">¿Para qué vas a usar principalmente Archub?</Label>
            <HelpPopover
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
            <Label htmlFor="main_use_other">Especifica tu uso principal</Label>
            <Input
              id="main_use_other"
              placeholder="Escribe aquí..."
              value={mainUseOther}
              onChange={(e) => setMainUseOther(e.target.value)}
            />
          </div>
        )}

        {/* Botones de navegación */}
          <Button
            type="button"
            variant="outline"
            onClick={goPrevStep}
          >
            Volver
          </Button>
          
          <Button 
            onClick={handleFinish}
            disabled={!discoveredBy || (discoveredBy === 'Otro' && !discoveredByOther) || isFinishing}
          >
            {isFinishing ? 'Finalizando...' : 'Finalizar configuración'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}