import { getClientPayments } from '@/features/clients/services/clientPayments';
import { supabase } from '@/lib/supabase';
import type { FinancialMovementWithRelations } from '../types';
import { mapClientPaymentsToFinancialMovements } from '../mappers';

/**
 * Obtiene TODOS los movimientos financieros de una organización.
 * 
 * Por ahora solo trae de client_payments usando el service existente,
 * pero eventualmente agregará datos de material_payments, personnel_payments, etc.
 * 
 * En el futuro esto se reemplazará por una VISTA de base de datos
 * que agregue todas las tablas *_payments automáticamente.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de movimientos financieros unificados
 * @throws {Error} Si falla la query principal
 */
export async function getAllFinancialMovements(
  organizationId: string
): Promise<FinancialMovementWithRelations[]> {
  if (!organizationId) {
    return [];
  }

  // TODO: Por ahora solo traemos client_payments
  // En el futuro, agregar material_payments, personnel_payments, etc.
  // O mejor aún, usar una VISTA de base de datos que agregue todo
  
  try {
    // Get all client payments using the existing CLIENTS module service
    // This follows the Feature-Sliced Design pattern by reusing the service layer
    const clientPayments = await getClientPayments(organizationId);

    // Hydrate project and creator data for each payment
    // TODO: In the future, create a database VIEW that includes these joins automatically
    const paymentsWithRelations = await Promise.all(
      clientPayments.map(async (payment) => {
        // Fetch project data
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name, code, color')
          .eq('id', payment.project_id)
          .single();

        // Fetch creator data
        const { data: creatorData } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', payment.created_by)
          .single();

        return {
          ...payment,
          project: projectData || null,
          creator: creatorData || null,
        };
      })
    );

    const clientMovements = mapClientPaymentsToFinancialMovements(paymentsWithRelations);

    // TODO: Agregar pagos de otros tipos aquí
    // const materialMovements = await getMaterialPayments(organizationId);
    // const personnelMovements = await getPersonnelPayments(organizationId);
    // etc.

    // Combine all movements
    const allMovements = [
      ...clientMovements,
      // ...materialMovements,
      // ...personnelMovements,
      // etc.
    ];

    // Sort by payment date (most recent first)
    allMovements.sort((a, b) => {
      return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
    });

    return allMovements;
  } catch (error) {
    console.error('Error fetching financial movements:', error);
    throw error;
  }
}
