import type { SupabaseClient } from '@supabase/supabase-js';
import { buildMovementQuery, type MovementRow } from './helpers/movementQueryBuilder';

/**
 * Calcula el total de pagos realizados a un contacto (en cualquier rol)
 * en un proyecto específico.
 * 
 * @param contactName - Nombre del contacto (puede ser socio, subcontratista, personal, etc.)
 * @param projectName - Nombre del proyecto
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @returns Mensaje con el total pagado o error descriptivo
 */
export async function getTotalPaymentsByContactAndProject(
  contactName: string,
  projectName: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<string> {
  
  try {
    // Usar query builder con SOLO los campos necesarios:
    // Necesita: currencies, projects, TODOS los roles (partner, subcontract+contact, personnel, client, member)
    const { data: movements, error } = (await buildMovementQuery(supabase, {
      includeProject: true,
      includeCurrency: true,
      includeRoles: {
        partner: true,
        subcontract: true,  // Incluye tanto subcontract como subcontract_contact
        personnel: true,
        client: true,
        member: true
      }
    })
      .eq('organization_id', organizationId)
      .ilike('project_name', `%${projectName}%`)) as { data: MovementRow[] | null, error: any };

    if (error) {
      console.error('Error fetching movements:', error);
      return `Error al buscar pagos: ${error.message}`;
    }

    if (!movements || movements.length === 0) {
      return `No encontré movimientos en el proyecto "${projectName}".`;
    }

    // Filtrar en JavaScript para evitar problemas con caracteres especiales (', ", %, &, comas, etc.)
    // Buscamos el contacto en cualquiera de las columnas de roles
    const contactNameLower = contactName.toLowerCase();
    const filteredMovements = movements.filter(m => {
      // Normalizar cada valor a string vacío si es null/undefined antes de comparar
      const partner = (m.partner ?? '').toLowerCase();
      const subcontract = (m.subcontract ?? '').toLowerCase(); // Nombre del subcontrato
      const subcontractContact = (m.subcontract_contact ?? '').toLowerCase(); // Nombre del subcontratista
      const personnel = (m.personnel ?? '').toLowerCase();
      const client = (m.client ?? '').toLowerCase();
      const member = (m.member ?? '').toLowerCase();
      
      return (
        partner.includes(contactNameLower) ||
        subcontract.includes(contactNameLower) ||
        subcontractContact.includes(contactNameLower) ||
        personnel.includes(contactNameLower) ||
        client.includes(contactNameLower) ||
        member.includes(contactNameLower)
      );
    });

    if (filteredMovements.length === 0) {
      return `No encontré pagos a "${contactName}" en el proyecto "${projectName}". Puede que el nombre no coincida exactamente o que no haya movimientos registrados.`;
    }

    // Verificar si hay múltiples monedas antes de sumar
    const uniqueCurrencies = new Set(
      filteredMovements
        .map(m => m.currency_code)
        .filter(code => code != null)
    );

    if (uniqueCurrencies.size > 1) {
      const currencyList = Array.from(uniqueCurrencies).join(', ');
      return `Ese contacto tiene pagos en múltiples monedas (${currencyList}). Por favor especifica la moneda.`;
    }

    // Sumar todos los montos (ya validamos que son de la misma moneda)
    const total = filteredMovements.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    
    // Obtener info del primer movimiento filtrado para contexto
    const firstMovement = filteredMovements[0];
    const currency = firstMovement.currency_symbol || '$';
    const actualProjectName = firstMovement.project_name || projectName;
    
    // Determinar el nombre exacto del contacto (cuál columna matcheó)
    // Priorizar el nombre del contacto (subcontract_contact) sobre el nombre del subcontrato
    const matchedName = 
      (firstMovement.partner ?? '').toLowerCase().includes(contactNameLower) ? firstMovement.partner :
      (firstMovement.subcontract_contact ?? '').toLowerCase().includes(contactNameLower) ? firstMovement.subcontract_contact :
      (firstMovement.subcontract ?? '').toLowerCase().includes(contactNameLower) ? firstMovement.subcontract :
      (firstMovement.personnel ?? '').toLowerCase().includes(contactNameLower) ? firstMovement.personnel :
      (firstMovement.client ?? '').toLowerCase().includes(contactNameLower) ? firstMovement.client :
      (firstMovement.member ?? '').toLowerCase().includes(contactNameLower) ? firstMovement.member :
      contactName;

    // Formatear el total
    const formattedTotal = total.toLocaleString('es-AR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });

    return `Le pagaste ${currency}${formattedTotal} a ${matchedName} en el proyecto "${actualProjectName}" (${filteredMovements.length} movimiento${filteredMovements.length > 1 ? 's' : ''})`;

  } catch (err) {
    console.error('Unexpected error in getTotalPaymentsByContactAndProject:', err);
    return `Error inesperado al buscar pagos. Por favor intenta nuevamente.`;
  }
}
