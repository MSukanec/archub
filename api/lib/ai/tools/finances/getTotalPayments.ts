import type { SupabaseClient } from '@supabase/supabase-js';
import { buildMovementQuery, type MovementRow } from './helpers/movementQueryBuilder.js';
import { textIncludes } from '../../utils/textNormalizer.js';

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
    const { data: allMovements, error } = (await buildMovementQuery(supabase, {
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
      .eq('organization_id', organizationId)) as { data: MovementRow[] | null, error: any };

    if (error) {
      console.error('Error fetching movements:', error);
      return `Error al buscar pagos: ${error.message}`;
    }

    if (!allMovements || allMovements.length === 0) {
      return `No encontré movimientos en tu organización`;
    }

    // Filtrar por proyecto primero (insensible a acentos)
    const movements = allMovements.filter(m => 
      textIncludes(m.project_name ?? '', projectName)
    );

    if (movements.length === 0) {
      return `No encontré movimientos en el proyecto **"${projectName}"**. Es posible que el nombre del proyecto sea diferente o que aún no se hayan ingresado transacciones bajo ese nombre.`;
    }

    // Filtrar por contacto en cualquiera de las columnas de roles (insensible a acentos)
    const filteredMovements = movements.filter(m => {
      return (
        textIncludes(m.partner ?? '', contactName) ||
        textIncludes(m.subcontract ?? '', contactName) ||
        textIncludes(m.subcontract_contact ?? '', contactName) ||
        textIncludes(m.personnel ?? '', contactName) ||
        textIncludes(m.client ?? '', contactName) ||
        textIncludes(m.member ?? '', contactName)
      );
    });

    if (filteredMovements.length === 0) {
      return `No encontré pagos a **"${contactName}"** en el proyecto **"${projectName}"**. Puede que el nombre no coincida exactamente o que no haya movimientos registrados.`;
    }

    // Verificar si hay múltiples monedas antes de sumar
    const uniqueCurrencies = new Set(
      filteredMovements
        .map(m => m.currency_code)
        .filter(code => code != null)
    );

    if (uniqueCurrencies.size > 1) {
      const currencyList = Array.from(uniqueCurrencies).join(', ');
      return `Ese contacto tiene pagos en múltiples monedas (**${currencyList}**). Por favor especifica la moneda.`;
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
      textIncludes(firstMovement.partner ?? '', contactName) ? firstMovement.partner :
      textIncludes(firstMovement.subcontract_contact ?? '', contactName) ? firstMovement.subcontract_contact :
      textIncludes(firstMovement.subcontract ?? '', contactName) ? firstMovement.subcontract :
      textIncludes(firstMovement.personnel ?? '', contactName) ? firstMovement.personnel :
      textIncludes(firstMovement.client ?? '', contactName) ? firstMovement.client :
      textIncludes(firstMovement.member ?? '', contactName) ? firstMovement.member :
      contactName;

    // Formatear el total
    const formattedTotal = total.toLocaleString('es-AR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });

    return `Le pagaste **${currency}${formattedTotal}** a **${matchedName}** en el proyecto **"${actualProjectName}"** (**${filteredMovements.length}** movimiento${filteredMovements.length > 1 ? 's' : ''})`;

  } catch (err) {
    console.error('Unexpected error in getTotalPaymentsByContactAndProject:', err);
    return `Error inesperado al buscar pagos. Por favor intenta nuevamente.`;
  }
}
