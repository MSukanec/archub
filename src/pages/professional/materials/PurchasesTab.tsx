import { PlanRestricted } from "@/features/users"
import { ShoppingCart } from 'lucide-react'

interface PurchasesTabProps {
  projectId?: string
}

export default function PurchasesTab({ projectId }: PurchasesTabProps) {
  return (
    <PlanRestricted reason="coming_soon">
      <div className="flex flex-col items-center justify-center py-16">
        <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Compras</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Esta funcionalidad estará disponible próximamente. Aquí podrás registrar 
          y gestionar las compras de materiales para tus proyectos.
        </p>
      </div>
    </PlanRestricted>
  )
}
