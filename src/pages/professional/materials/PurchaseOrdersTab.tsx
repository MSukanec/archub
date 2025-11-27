import { PlanRestricted } from "@/features/users"
import { ClipboardList } from 'lucide-react'

interface PurchaseOrdersTabProps {
  projectId?: string
}

export default function PurchaseOrdersTab({ projectId }: PurchaseOrdersTabProps) {
  return (
    <PlanRestricted reason="coming_soon">
      <div className="flex flex-col items-center justify-center py-16">
        <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Órdenes de Compra</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Esta funcionalidad estará disponible próximamente. Aquí podrás gestionar 
          órdenes de compra y hacer seguimiento de tus pedidos de materiales.
        </p>
      </div>
    </PlanRestricted>
  )
}
