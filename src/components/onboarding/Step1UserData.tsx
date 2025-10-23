import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useQuery } from "@tanstack/react-query";
import DatePickerField from "@/components/ui-custom/fields/DatePickerField";
import { Loader2 } from "lucide-react";

interface Step1UserDataProps {
  onFinish?: () => void;
}

interface Country {
  id: string;
  name: string;
  alpha_3: string;
  country_code: string;
}

export function Step1UserData({ onFinish }: Step1UserDataProps = {}) {
  const { formData, updateFormData, goNextStep } = useOnboardingStore();

  // Fetch countries
  const { data: countries, isLoading: loadingCountries } = useQuery<Country[]>({
    queryKey: ['/api/countries'],
  });

  const handleFinish = () => {
    if (formData.first_name && formData.last_name && formData.organization_name) {
      if (onFinish) {
        onFinish();
      } else {
        goNextStep();
      }
    }
  };

  const handleBirthdateChange = (date: Date | undefined) => {
    if (date) {
      updateFormData({ birthdate: date.toISOString().split('T')[0] });
    } else {
      updateFormData({ birthdate: '' });
    }
  };

  const getBirthdateValue = () => {
    if (formData.birthdate) {
      return new Date(formData.birthdate);
    }
    return undefined;
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--main-sidebar-bg)' }}>
      {/* Left Panel - Dark */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative">
        <div className="max-w-md space-y-8 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/ArchubLogo.png" 
              alt="Archub Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold !text-white">
              ¡Estás a un paso de
              <br />
              <span style={{ color: 'var(--accent)' }}>Comenzar!</span>
            </h1>
            <p className="text-base !text-gray-400">
              Completa tu perfil para personalizar tu experiencia en Archub.
              Solo te tomará un momento.
            </p>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 pt-8">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Light */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="w-full flex-1 flex items-stretch p-4 lg:p-6">
          <div className="w-full h-full flex flex-col rounded-3xl px-6 lg:px-16 py-6" style={{ backgroundColor: 'var(--layout-bg)' }}>
            {/* Logo mobile */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 lg:hidden">
                <img 
                  src="/ArchubLogo.png" 
                  alt="Archub Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>

            {/* Form Content - Centered vertically */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md space-y-6">
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
                      <Label htmlFor="first_name" className="text-sm font-medium text-gray-900">
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
                      <Label htmlFor="last_name" className="text-sm font-medium text-gray-900">
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
                      <Label htmlFor="country" className="text-sm font-medium text-gray-900">
                        País
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
                      <Label htmlFor="birthdate" className="text-sm font-medium text-gray-900">
                        Fecha de Nacimiento
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
                    <Label htmlFor="organization_name" className="text-sm font-medium text-gray-900">
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
                    disabled={!formData.first_name || !formData.last_name || !formData.organization_name}
                    className="w-full h-11"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                    data-testid="button-finish-onboarding"
                  >
                    {onFinish ? 'Finalizar configuración' : 'Siguiente'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
