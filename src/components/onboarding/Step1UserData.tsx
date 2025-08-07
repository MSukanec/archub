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
          </div>
        </div>
          Completa tu información personal y preferencias iniciales. Luego puedes cambiarlo.
        </CardDescription>
      </CardHeader>
      
        {/* Nombre */}
            <HelpPopover
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
            <HelpPopover
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
            <HelpPopover
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
            <HelpPopover
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



          <Button 
            onClick={handleNext}
            disabled={!formData.first_name || !formData.last_name || !formData.country || !formData.birthdate}
          >
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}