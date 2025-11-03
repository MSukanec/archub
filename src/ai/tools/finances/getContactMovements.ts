import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency, formatDateRange, formatMovementCount } from '../../utils/responseFormatter';
import { convertCurrency } from '../../utils/currencyConverter';
import { buildMovementQuery, type MovementRow } from './helpers/movementQueryBuilder';

/**
 * Obtiene TODOS los movimientos (ingresos y egresos) de un contacto específico.
 * Generaliza la función getTotalPayments para incluir ingresos y egresos.
 * 
 * @param contactName - Nombre del contacto a buscar
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @param projectName - Nombre del proyecto (opcional)
 * @param dateRange - Rango de fechas (opcional)
 * @param currency - Código de moneda para filtrar (opcional)
 * @param convertTo - Código de moneda a la que convertir (opcional)
 * @returns Mensaje con resumen detallado de movimientos o error descriptivo
 */
export async function getContactMovements(
  contactName: string,
  organizationId: string,
  supabase: SupabaseClient,
  projectName?: string,
  dateRange?: { start: string; end: string },
  currency?: string,
  convertTo?: string
): Promise<string> {
  
  try {
    // Usar query builder con campos específicos:
    // Necesita: currencies (con exchange_rate), projects, type, TODOS los roles, movement_date
    let query = buildMovementQuery(supabase, {
      includeProject: true,
      includeCurrency: true,
      includeConcepts: {
        type: true
      },
      includeRoles: {
        partner: true,
        subcontract: true,
        personnel: true,
        client: true,
        member: true
      }
    });

    query = query.eq('organization_id', organizationId);

    // Si hay proyecto, filtrar por nombre (ilike para partial match)
    if (projectName) {
      query = query.ilike('project_name', `%${projectName}%`);
    }

    // Si hay rango de fechas, filtrar
    if (dateRange) {
      query = query.gte('movement_date', dateRange.start);
      query = query.lte('movement_date', dateRange.end);
    }

    // Si hay moneda específica, filtrar
    if (currency) {
      const currencyUpper = currency.toUpperCase();
      query = query.eq('currency_code', currencyUpper);
    }

    const { data: movements, error } = (await query) as { data: MovementRow[] | null, error: any };

    if (error) {
      console.error('Error fetching movements:', error);
      return `Error al buscar movimientos: ${error.message}`;
    }

    if (!movements || movements.length === 0) {
      return projectName 
        ? `No encontré movimientos en el proyecto **"${projectName}"**`
        : 'No encontré movimientos en tu organización';
    }

    // Filtrar en JavaScript por contactName en CUALQUIER rol
    const contactNameLower = contactName.toLowerCase();
    const filteredMovements = movements.filter(m => {
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
      return `No encontré movimientos de **"${contactName}"**${projectName ? ` en el proyecto **"${projectName}"**` : ''}`;
    }

    // Si hay conversión, convertir todos los montos
    if (convertTo) {
      const convertToUpper = convertTo.toUpperCase();
      
      // Buscar la tasa de cambio de la moneda destino
      const targetCurrencyMovement = filteredMovements.find(m => 
        (m.currency_code ?? '').toUpperCase() === convertToUpper
      );
      
      if (!targetCurrencyMovement) {
        return `No encontré movimientos en **${convertToUpper}** para usar como referencia de conversión`;
      }
      
      const targetRate = Number(targetCurrencyMovement.exchange_rate || 1);
      
      // Separar por tipo y convertir
      let totalIngresos = 0;
      let totalEgresos = 0;
      let countIngresos = 0;
      let countEgresos = 0;
      
      for (const movement of filteredMovements) {
        const amount = Number(movement.amount || 0);
        const fromRate = Number(movement.exchange_rate || 1);
        const convertedAmount = convertCurrency(amount, fromRate, targetRate);
        
        if ((movement.type_name ?? '').toLowerCase() === 'ingreso') {
          totalIngresos += convertedAmount;
          countIngresos++;
        } else if ((movement.type_name ?? '').toLowerCase() === 'egreso') {
          totalEgresos += convertedAmount;
          countEgresos++;
        }
      }
      
      const balance = totalIngresos - totalEgresos;
      const symbol = targetCurrencyMovement.currency_symbol || '$';
      
      const ingresosFormatted = formatCurrency(totalIngresos, symbol, convertToUpper);
      const egresosFormatted = formatCurrency(totalEgresos, symbol, convertToUpper);
      const balanceFormatted = formatCurrency(Math.abs(balance), symbol, convertToUpper);
      
      // Construir respuesta
      let response = `Movimientos de **${contactName}**`;
      if (projectName) {
        response += ` en **${filteredMovements[0].project_name || projectName}**`;
      }
      response += ` (convertido a **${convertToUpper}**):\n`;
      
      if (countIngresos > 0) {
        response += `- Ingresos: **${ingresosFormatted}** (**${formatMovementCount(countIngresos)}**)\n`;
      }
      
      if (countEgresos > 0) {
        response += `- Egresos: **${egresosFormatted}** (**${formatMovementCount(countEgresos)}**)\n`;
      }
      
      response += `- Balance neto: **${balance >= 0 ? '+' : '-'}${balanceFormatted}**`;
      
      if (dateRange) {
        response += `\n\nPeríodo: **${formatDateRange(dateRange.start, dateRange.end)}**`;
      }
      
      return response;
    }

    // Sin conversión: validar moneda única
    const uniqueCurrencies = new Set(
      filteredMovements
        .map(m => m.currency_code)
        .filter(code => code != null)
    );

    if (uniqueCurrencies.size > 1) {
      const currencyList = Array.from(uniqueCurrencies).join(', ');
      return `Ese contacto tiene movimientos en múltiples monedas (**${currencyList}**). Por favor especifica una moneda o usa conversión`;
    }

    // Separar por tipo y sumar
    let totalIngresos = 0;
    let totalEgresos = 0;
    let countIngresos = 0;
    let countEgresos = 0;
    
    for (const movement of filteredMovements) {
      const amount = Number(movement.amount || 0);
      
      if ((movement.type_name ?? '').toLowerCase() === 'ingreso') {
        totalIngresos += amount;
        countIngresos++;
      } else if ((movement.type_name ?? '').toLowerCase() === 'egreso') {
        totalEgresos += amount;
        countEgresos++;
      }
    }
    
    const balance = totalIngresos - totalEgresos;
    const firstMovement = filteredMovements[0];
    const symbol = firstMovement.currency_symbol || '$';
    const currencyCode = firstMovement.currency_code || '';
    
    const ingresosFormatted = formatCurrency(totalIngresos, symbol, currencyCode);
    const egresosFormatted = formatCurrency(totalEgresos, symbol, currencyCode);
    const balanceFormatted = formatCurrency(Math.abs(balance), symbol, currencyCode);
    
    // Construir respuesta
    let response = `Movimientos de **${contactName}**`;
    if (projectName) {
      response += ` en **${firstMovement.project_name || projectName}**`;
    }
    response += ':\n';
    
    if (countIngresos > 0) {
      response += `- Ingresos: **${ingresosFormatted}** (**${formatMovementCount(countIngresos)}**)\n`;
    }
    
    if (countEgresos > 0) {
      response += `- Egresos: **${egresosFormatted}** (**${formatMovementCount(countEgresos)}**)\n`;
    }
    
    if (countIngresos === 0 && countEgresos > 0) {
      response += `- Balance neto: **-${balanceFormatted}** (solo egresos)`;
    } else if (countEgresos === 0 && countIngresos > 0) {
      response += `- Balance neto: **+${balanceFormatted}** (solo ingresos)`;
    } else {
      response += `- Balance neto: **${balance >= 0 ? '+' : '-'}${balanceFormatted}**`;
    }
    
    if (dateRange) {
      response += `\n\nPeríodo: **${formatDateRange(dateRange.start, dateRange.end)}**`;
    }
    
    return response;

  } catch (err) {
    console.error('Unexpected error in getContactMovements:', err);
    return 'Error inesperado al buscar movimientos del contacto. Por favor intenta nuevamente.';
  }
}
