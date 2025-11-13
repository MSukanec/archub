import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

/**
 * DEPRECATED: This tab managed plan_prices table which has been removed.
 * Pricing is now managed directly in the plans table (monthly_amount, annual_amount).
 * 
 * To edit plan prices, go to the "Planes" tab and edit the plan directly.
 */
const AdminPlanPricesTab = () => {
  return (
    <div className="p-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta pestaña ha sido reemplazada. Los precios de planes ahora se administran 
          directamente en la tabla de Planes (monthly_amount y annual_amount).
          <br /><br />
          Por favor, utiliza la pestaña <strong>"Planes"</strong> para gestionar los precios.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AdminPlanPricesTab;
