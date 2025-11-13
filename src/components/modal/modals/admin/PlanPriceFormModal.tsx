/**
 * DEPRECATED: This modal managed plan_prices table which has been removed.
 * Pricing is now managed directly in the plans table (monthly_amount, annual_amount).
 * 
 * This component is no longer used.
 */

interface PlanPriceFormModalProps {
  modalData?: any;
  onClose: () => void;
}

export function PlanPriceFormModal({ onClose }: PlanPriceFormModalProps) {
  return (
    <div className="p-6">
      <p>Este modal ya no está disponible. Los precios se gestionan desde la tabla de Planes.</p>
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}
