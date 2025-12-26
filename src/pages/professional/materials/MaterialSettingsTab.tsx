import { RoleRestricted } from "@/features/users"
import { Settings } from 'lucide-react'

interface MaterialSettingsTabProps {
  projectId?: string
}

export default function MaterialSettingsTab({ projectId }: MaterialSettingsTabProps) {
  return (
    <RoleRestricted requiredRole="admin" hideCompletely showAsPreview>
      <div className="flex flex-col items-center justify-center py-16">
        <Settings className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Ajustes</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Esta funcionalidad estará disponible próximamente. Aquí podrás configurar 
          proveedores, categorías de materiales y otras opciones.
        </p>
      </div>
    </RoleRestricted>
  )
}
