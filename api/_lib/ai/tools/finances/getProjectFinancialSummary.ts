import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency } from '../../utils/responseFormatter.js';
import { buildMovementQuery, type MovementRow } from './helpers/movementQueryBuilder.js';
import { textIncludes } from '../../utils/textNormalizer.js';

/**
 * Resumen financiero completo de un proyecto (balance, ingresos, egresos)
 * 
 * @param projectName - Nombre del proyecto (fuzzy match)
 * @param organizationId - ID de la organización
 * @param includeBreakdown - Si debe incluir top 3 categorías de gasto
 * @param supabase - Cliente autenticado de Supabase
 * @returns Resumen financiero formateado o error descriptivo
 */
export async function getProjectFinancialSummary(
  projectName: string,
  organizationId: string,
  includeBreakdown: boolean,
  supabase: SupabaseClient
): Promise<string> {
  
  try {
    // Usar query builder con campos específicos:
    // Necesita: currencies, projects, movement_concepts(type+category)
    const { data: allMovements, error } = (await buildMovementQuery(supabase, {
      includeProject: true,
      includeCurrency: true,
      includeConcepts: {
        type: true,
        category: true
      }
    })
      .eq('organization_id', organizationId)) as { data: MovementRow[] | null, error: any };

    if (error) {
      console.error('Error fetching project movements:', error);
      return `Error al buscar movimientos del proyecto: ${error.message}`;
    }

    if (!allMovements || allMovements.length === 0) {
      return `No encontré movimientos en tu organización`;
    }

    // Filtrar por proyecto (insensible a acentos)
    const movements = allMovements.filter(m => 
      textIncludes(m.project_name ?? '', projectName)
    );

    if (movements.length === 0) {
      return `No encontré el proyecto **"${projectName}"** o no tiene movimientos registrados. Es posible que el nombre del proyecto sea diferente o que aún no se hayan ingresado transacciones bajo ese nombre.`;
    }

    // Validar que todas las monedas sean iguales
    const uniqueCurrencies = new Set(
      movements
        .map(m => m.currency_code)
        .filter(code => code != null)
    );

    if (uniqueCurrencies.size > 1) {
      const currencyList = Array.from(uniqueCurrencies).join(', ');
      return `El proyecto tiene movimientos en múltiples monedas (**${currencyList}**). Por favor especifica la moneda o convierte primero`;
    }

    // Calcular totales de ingresos y egresos
    let totalIngresos = 0;
    let totalEgresos = 0;
    const categoriesMap = new Map<string, number>();
    
    for (const movement of movements) {
      const amount = Number(movement.amount || 0);
      const typeName = (movement.type_name ?? '').toLowerCase();
      
      if (typeName === 'ingreso') {
        totalIngresos += amount;
      } else if (typeName === 'egreso') {
        totalEgresos += amount;
        
        // Agrupar por categoría para el breakdown
        if (includeBreakdown && movement.category_name) {
          const category = movement.category_name;
          categoriesMap.set(category, (categoriesMap.get(category) || 0) + amount);
        }
      }
    }
    
    const balance = totalIngresos - totalEgresos;
    const firstMovement = movements[0];
    const symbol = firstMovement.currency_symbol || '$';
    const currencyCode = firstMovement.currency_code || '';
    const actualProjectName = firstMovement.project_name || projectName;
    
    // Formatear valores principales
    const ingresosFormatted = formatCurrency(totalIngresos, symbol);
    const egresosFormatted = formatCurrency(totalEgresos, symbol);
    const balanceFormatted = formatCurrency(Math.abs(balance), symbol);
    
    // Construir respuesta base
    let response = `El proyecto **"${actualProjectName}"** tiene:\n`;
    response += `- Ingresos: **${ingresosFormatted}**\n`;
    response += `- Egresos: **${egresosFormatted}**\n`;
    
    if (balance >= 0) {
      response += `- Balance: **${balanceFormatted}**`;
    } else {
      response += `- Balance: **-${balanceFormatted}** (negativo)`;
    }
    
    // Agregar breakdown si se solicita
    if (includeBreakdown && categoriesMap.size > 0) {
      // Ordenar categorías por monto (mayor a menor) y tomar top 3
      const sortedCategories = Array.from(categoriesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      response += '\n\nPrincipales gastos:';
      sortedCategories.forEach(([category, amount], index) => {
        const categoryFormatted = formatCurrency(amount, symbol);
        response += `\n**${index + 1}.** **${category}**: **${categoryFormatted}**`;
      });
    }
    
    return response;

  } catch (err) {
    console.error('Unexpected error in getProjectFinancialSummary:', err);
    return 'Error inesperado al generar el resumen del proyecto. Por favor intenta nuevamente.';
  }
}
