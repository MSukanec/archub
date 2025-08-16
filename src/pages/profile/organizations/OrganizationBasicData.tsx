import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building } from 'lucide-react'

export function OrganizationBasicData() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Datos Básicos de la Organización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
            <p className="text-muted-foreground">
              Esta sección estará disponible pronto para gestionar los datos básicos de tu organización.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}