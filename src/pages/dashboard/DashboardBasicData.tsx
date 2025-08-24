import { Building, Users, MapPin, Phone, Mail, Globe, Calendar, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardBasicDataProps {
  organization: any;
}

export function DashboardBasicData({ organization }: DashboardBasicDataProps) {
  return (
    <div className="space-y-6">
      {/* Organization Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Información de la Organización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="text-sm mt-1">{organization?.name || 'Sin definir'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="text-sm mt-1">{organization?.description || 'Sin descripción'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <div className="mt-1">
                  <Badge variant={organization?.is_system ? "default" : "secondary"}>
                    {organization?.is_system ? 'Organización del Sistema' : 'Organización Regular'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </label>
                <p className="text-sm mt-1">{organization?.email || 'Sin definir'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Teléfono
                </label>
                <p className="text-sm mt-1">{organization?.phone || 'Sin definir'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Sitio Web
                </label>
                <p className="text-sm mt-1">{organization?.website || 'Sin definir'}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Dirección
            </label>
            <p className="text-sm mt-1">{organization?.address || 'Sin definir'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Plan y Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Plan Actual</label>
              <div className="mt-1">
                <Badge variant="outline">
                  {organization?.plan?.name || 'Free'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Fecha de Creación
              </label>
              <p className="text-sm mt-1">
                {organization?.created_at 
                  ? format(new Date(organization.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })
                  : 'Sin definir'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configuración Organizacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm mb-2">Configuración adicional disponible</p>
            <p className="text-xs">
              Aquí podrás configurar preferencias, monedas, billeteras y otras opciones de la organización.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}