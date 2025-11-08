import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import DatePickerField from "@/components/ui-custom/fields/DatePickerField";
import { Loader2 } from "lucide-react";
import { useCountries } from "@/hooks/use-countries";

interface Step1UserDataProps {
  onFinish?: () => void;
}

export function Step1UserData({ onFinish }: Step1UserDataProps = {}) {
  const { formData, updateFormData } = useOnboardingStore();

  // Fetch countries - using optimized hook
  const { data: countries, isLoading: loadingCountries } = useCountries();

  const handleFinish = () => {
    if (formData.first_name && formData.last_name && formData.country && formData.birthdate && formData.organization_name && onFinish) {
      onFinish();
    }
  };

  const handleBirthdateChange = (date: Date | undefined) => {
    if (date) {
      // Usar componentes de fecha en lugar de toISOString() para evitar problemas de timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      updateFormData({ birthdate: `${year}-${month}-${day}` });
    } else {
      updateFormData({ birthdate: '' });
    }
  };

  const getBirthdateValue = () => {
    if (formData.birthdate) {
      // Parsear la fecha correctamente manteniendo timezone local
      const [year, month, day] = formData.birthdate.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0, 0);
    }
    return undefined;
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Completa tu perfil</h1>
        <p className="text-gray-600">
          Cuéntanos un poco más sobre ti para comenzar
        </p>
      </div>

      <div className="space-y-4">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-xs font-medium leading-none">
              Nombre/s <span style={{ color: 'var(--accent)' }}>*</span>
            </Label>
            <Input
              id="first_name"
              placeholder="Tu nombre"
              className="h-11 border-gray-300 bg-white text-gray-900"
              value={formData.first_name}
              onChange={(e) => updateFormData({ first_name: e.target.value })}
              data-testid="input-first-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-xs font-medium leading-none">
              Apellido/s <span style={{ color: 'var(--accent)' }}>*</span>
            </Label>
            <Input
              id="last_name"
              placeholder="Tu apellido"
              className="h-11 border-gray-300 bg-white text-gray-900"
              value={formData.last_name}
              onChange={(e) => updateFormData({ last_name: e.target.value })}
              data-testid="input-last-name"
            />
          </div>
        </div>

        {/* País y Fecha de Nacimiento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country" className="text-xs font-medium leading-none">
              País <span style={{ color: 'var(--accent)' }}>*</span>
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => updateFormData({ country: value })}
              disabled={loadingCountries}
            >
              <SelectTrigger 
                id="country" 
                className="h-11 border-gray-300 bg-white text-gray-900"
                data-testid="select-country"
              >
                <SelectValue placeholder={loadingCountries ? "Cargando..." : "Seleccionar país"} />
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
          
          <div className="space-y-2">
            <Label htmlFor="birthdate" className="text-xs font-medium leading-none">
              Fecha de Nacimiento <span style={{ color: 'var(--accent)' }}>*</span>
            </Label>
            <DatePickerField
              value={getBirthdateValue()}
              onChange={handleBirthdateChange}
              placeholder="Seleccionar fecha"
              disableFuture={true}
              className="h-11 border-gray-300 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Nombre de Organización */}
        <div className="space-y-2">
          <Label htmlFor="organization_name" className="text-xs font-medium leading-none">
            Nombre de Organización / Empresa <span style={{ color: 'var(--accent)' }}>*</span>
          </Label>
          <Input
            id="organization_name"
            placeholder="Nombre de tu organización"
            className="h-11 border-gray-300 bg-white text-gray-900"
            value={formData.organization_name}
            onChange={(e) => updateFormData({ organization_name: e.target.value })}
            data-testid="input-organization-name"
          />
        </div>

        <Button 
          onClick={handleFinish}
          disabled={!formData.first_name || !formData.last_name || !formData.country || !formData.birthdate || !formData.organization_name}
          className="w-full h-11"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          data-testid="button-finish-onboarding"
        >
          Finalizar configuración
        </Button>
      </div>
    </div>
  );
}
