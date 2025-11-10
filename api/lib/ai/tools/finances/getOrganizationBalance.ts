import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency } from '../../utils/responseFormatter';
import { convertCurrency } from '../../utils/currencyConverter';
import { buildMovementQuery, type MovementRow } from './helpers/movementQueryBuilder';

/**
 * Calcula el balance general de la organización sumando todos los movimientos
 * de tipo ingreso menos egresos.
 * 
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @param currency - Código de moneda para filtrar (opcional)
 * @param convertTo - Código de moneda a la que convertir (opcional)
 * @returns Mensaje con el balance o error descriptivo
 */
export async function getOrganizationBalance(
  organizationId: string,
  supabase: SupabaseClient,
  currency?: string,
  convertTo?: string
): Promise<string> {
  
  try {
    // Usar query builder con campos específicos:
    // Necesita: currencies (con exchange_rate), movement_concepts(type)
    const { data: movements, error } = (await buildMovementQuery(supabase, {
      includeCurrency: true,
      includeConcepts: {
        type: true
      }
    })
      .eq('organization_id', organizationId)) as { data: MovementRow[] | null, error: any };

    if (error) {
      console.error('Error fetching movements:', error);
      return `Error al buscar movimientos: ${error.message}`;
    }

    if (!movements || movements.length === 0) {
      return 'No hay movimientos registrados en tu organización';
    }

    // Filtrar por moneda si se especifica
    let filteredMovements = movements;
    if (currency) {
      const currencyUpper = currency.toUpperCase();
      filteredMovements = movements.filter(m => 
        (m.currency_code ?? '').toUpperCase() === currencyUpper
      );
      
      if (filteredMovements.length === 0) {
        return `No encontré movimientos en **${currencyUpper}** en tu organización`;
      }
    }

    // Si hay conversión, necesitamos obtener todas las monedas con sus tasas
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
      
      // Convertir todos los movimientos a la moneda destino y separar por tipo
      let totalIngresos = 0;
      let totalEgresos = 0;
      
      for (const movement of filteredMovements) {
        const amount = Number(movement.amount || 0);
        const fromRate = Number(movement.exchange_rate || 1);
        const convertedAmount = convertCurrency(amount, fromRate, targetRate);
        
        if ((movement.type_name ?? '').toLowerCase() === 'ingreso') {
          totalIngresos += convertedAmount;
        } else if ((movement.type_name ?? '').toLowerCase() === 'egreso') {
          totalEgresos += convertedAmount;
        }
      }
      
      const balance = totalIngresos - totalEgresos;
      const symbol = targetCurrencyMovement.currency_symbol || '$';
      
      const ingresosFormatted = formatCurrency(totalIngresos, symbol, convertToUpper);
      const egresosFormatted = formatCurrency(totalEgresos, symbol, convertToUpper);
      const balanceFormatted = formatCurrency(Math.abs(balance), symbol, convertToUpper);
      
      if (balance >= 0) {
        return `Balance de tu organización (convertido a **${convertToUpper}**):\n- Ingresos: **${ingresosFormatted}**\n- Egresos: **${egresosFormatted}**\n- Balance: **${balanceFormatted}** (positivo)`;
      } else {
        return `Balance de tu organización (convertido a **${convertToUpper}**):\n- Ingresos: **${ingresosFormatted}**\n- Egresos: **${egresosFormatted}**\n- Balance: **-${balanceFormatted}** (negativo)`;
      }
    }

    // Sin conversión: validar que todos sean de la misma moneda
    const uniqueCurrencies = new Set(
      filteredMovements
        .map(m => m.currency_code)
        .filter(code => code != null)
    );

    if (uniqueCurrencies.size > 1) {
      const currencyList = Array.from(uniqueCurrencies).join(', ');
      return `Tu organización tiene movimientos en múltiples monedas (**${currencyList}**). Especifica la moneda o usa el parámetro de conversión`;
    }

    // Separar por tipo y sumar
    let totalIngresos = 0;
    let totalEgresos = 0;
    
    for (const movement of filteredMovements) {
      const amount = Number(movement.amount || 0);
      
      if ((movement.type_name ?? '').toLowerCase() === 'ingreso') {
        totalIngresos += amount;
      } else if ((movement.type_name ?? '').toLowerCase() === 'egreso') {
        totalEgresos += amount;
      }
    }
    
    const balance = totalIngresos - totalEgresos;
    const firstMovement = filteredMovements[0];
    const symbol = firstMovement.currency_symbol || '$';
    const currencyCode = firstMovement.currency_code || '';
    
    const ingresosFormatted = formatCurrency(totalIngresos, symbol, currencyCode);
    const egresosFormatted = formatCurrency(totalEgresos, symbol, currencyCode);
    const balanceFormatted = formatCurrency(Math.abs(balance), symbol, currencyCode);
    
    if (balance >= 0) {
      return `Balance de tu organización:\n- Ingresos: **${ingresosFormatted}**\n- Egresos: **${egresosFormatted}**\n- Balance: **${balanceFormatted}** (positivo)`;
    } else {
      return `Balance de tu organización:\n- Ingresos: **${ingresosFormatted}**\n- Egresos: **${egresosFormatted}**\n- Balance: **-${balanceFormatted}** (negativo)`;
    }

  } catch (err) {
    console.error('Unexpected error in getOrganizationBalance:', err);
    return 'Error inesperado al calcular el balance. Por favor intenta nuevamente.';
  }
}
