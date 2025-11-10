import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency, formatDateRange, formatMovementCount } from '../../utils/responseFormatter';
import { buildMovementQuery, type MovementRow } from './helpers/movementQueryBuilder';
import { textIncludes } from '../../utils/textNormalizer';

export interface MovementFilters {
  projectNames?: string[];
  categories?: string[];
  wallets?: string[];
  types?: ('Ingreso' | 'Egreso')[];
  roles?: ('partner' | 'subcontractor' | 'personnel' | 'client')[];
}

/**
 * Obtiene movimientos en un rango de fechas con filtros múltiples y capacidad de agrupar resultados.
 * 
 * @param organizationId - ID de la organización
 * @param dateRange - Rango de fechas obligatorio
 * @param supabase - Cliente autenticado de Supabase
 * @param filters - Filtros opcionales (proyectos, categorías, wallets, tipos, roles)
 * @param groupBy - Agrupar por: 'project', 'category', 'wallet', 'type' (opcional)
 * @param currency - Código de moneda para filtrar (opcional)
 * @returns Mensaje con resumen de movimientos o error descriptivo
 */
export async function getDateRangeMovements(
  organizationId: string,
  dateRange: { start: string; end: string },
  supabase: SupabaseClient,
  filters?: MovementFilters,
  groupBy?: 'project' | 'category' | 'wallet' | 'type',
  currency?: string
): Promise<string> {
  
  try {
    // Validar rango de fechas
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'El rango de fechas no es válido. Usa formato YYYY-MM-DD';
    }
    
    if (startDate > endDate) {
      return 'El rango de fechas no es válido. La fecha de inicio debe ser anterior a la fecha de fin';
    }

    // Usar query builder con TODOS los campos (LA MÁS COMPLETA):
    // Necesita: currencies, projects, type+category, wallets, TODOS los roles, indirects, general_costs
    let query = buildMovementQuery(supabase, {
      includeProject: true,
      includeCurrency: true,
      includeWallet: true,
      includeConcepts: {
        type: true,
        category: true
      },
      includeRoles: {
        partner: true,
        subcontract: true,
        personnel: true,
        client: true,
        member: true
      },
      includeIndirect: true,
      includeGeneralCost: true
    })
      .eq('organization_id', organizationId)
      .gte('movement_date', dateRange.start)
      .lte('movement_date', dateRange.end);

    // Si hay moneda específica, filtrar
    if (currency) {
      const currencyUpper = currency.toUpperCase();
      query = query.eq('currency_code', currencyUpper);
    }

    const { data: movements, error } = (await query) as { data: MovementRow[] | null, error: any };

    if (error) {
      return `Error al buscar movimientos: ${error.message}`;
    }

    if (!movements || movements.length === 0) {
      return `No encontré movimientos entre **${formatDateRange(dateRange.start, dateRange.end)}**`;
    }

    // Aplicar filtros opcionales
    let filteredMovements = movements;

    // Filtrar por projectNames (insensible a acentos)
    if (filters?.projectNames && filters.projectNames.length > 0) {
      filteredMovements = filteredMovements.filter(m => {
        return filters.projectNames!.some(p => 
          textIncludes(m.project_name ?? '', p)
        );
      });
    }

    // Filtrar por categories
    if (filters?.categories && filters.categories.length > 0) {
      const categoriesLower = filters.categories.map(c => c.toLowerCase());
      filteredMovements = filteredMovements.filter(m => 
        categoriesLower.includes((m.category_name ?? '').toLowerCase())
      );
    }

    // Filtrar por wallets
    if (filters?.wallets && filters.wallets.length > 0) {
      const walletsLower = filters.wallets.map(w => w.toLowerCase());
      filteredMovements = filteredMovements.filter(m => 
        walletsLower.includes((m.wallet_name ?? '').toLowerCase())
      );
    }

    // Filtrar por types
    if (filters?.types && filters.types.length > 0) {
      filteredMovements = filteredMovements.filter(m => 
        filters.types!.includes(m.type_name as any)
      );
    }

    // Filtrar por roles
    if (filters?.roles && filters.roles.length > 0) {
      filteredMovements = filteredMovements.filter(m => {
        const hasPartner = filters.roles!.includes('partner') && m.partner != null;
        const hasSubcontractor = filters.roles!.includes('subcontractor') && m.subcontract != null;
        const hasPersonnel = filters.roles!.includes('personnel') && m.personnel != null;
        const hasClient = filters.roles!.includes('client') && m.client != null;
        
        return hasPartner || hasSubcontractor || hasPersonnel || hasClient;
      });
    }

    if (filteredMovements.length === 0) {
      return `No encontré movimientos que coincidan con los filtros especificados entre **${formatDateRange(dateRange.start, dateRange.end)}**`;
    }

    // Validar moneda única
    const uniqueCurrencies = new Set(
      filteredMovements
        .map(m => m.currency_code)
        .filter(code => code != null)
    );

    if (uniqueCurrencies.size > 1) {
      const currencyList = Array.from(uniqueCurrencies).join(', ');
      return `Los movimientos filtrados tienen múltiples monedas (**${currencyList}**). Por favor especifica una moneda`;
    }

    const firstMovement = filteredMovements[0];
    const symbol = firstMovement.currency_symbol || '$';
    const currencyCode = firstMovement.currency_code || '';

    // Si hay agrupación
    if (groupBy) {
      const groups = new Map<string, any[]>();
      
      for (const movement of filteredMovements) {
        let groupKey = '';
        
        switch (groupBy) {
          case 'project':
            groupKey = movement.project_name || 'Sin proyecto';
            break;
          case 'category':
            groupKey = movement.category_name || 'Sin categoría';
            break;
          case 'wallet':
            groupKey = movement.wallet_name || 'Sin wallet';
            break;
          case 'type':
            groupKey = movement.type_name || 'Sin tipo';
            break;
        }
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(movement);
      }
      
      // Calcular subtotales por grupo
      const groupSummaries = Array.from(groups.entries()).map(([groupName, groupMovements]) => {
        const total = groupMovements.reduce((sum, m) => sum + Number(m.amount || 0), 0);
        const count = groupMovements.length;
        return { groupName, total, count };
      });
      
      // Ordenar por monto (mayor a menor)
      groupSummaries.sort((a, b) => b.total - a.total);
      
      // Calcular total general y separar por tipo
      const totalGeneral = filteredMovements.reduce((sum, m) => sum + Number(m.amount || 0), 0);
      const totalIngresos = filteredMovements
        .filter(m => (m.type_name ?? '').toLowerCase() === 'ingreso')
        .reduce((sum, m) => sum + Number(m.amount || 0), 0);
      const totalEgresos = filteredMovements
        .filter(m => (m.type_name ?? '').toLowerCase() === 'egreso')
        .reduce((sum, m) => sum + Number(m.amount || 0), 0);
      
      // Construir respuesta
      let response = `Movimientos del **${formatDateRange(dateRange.start, dateRange.end)}**:\n`;
      response += `Total: **${formatCurrency(totalGeneral, symbol, currencyCode)}** (**${formatMovementCount(filteredMovements.length)}**)\n\n`;
      
      const groupByLabel = {
        'project': 'proyecto',
        'category': 'categoría',
        'wallet': 'wallet',
        'type': 'tipo'
      }[groupBy];
      
      response += `Desglose por ${groupByLabel}:\n`;
      groupSummaries.forEach((g, index) => {
        response += `**${index + 1}.** **${g.groupName}**: **${formatCurrency(g.total, symbol, currencyCode)}** (**${g.count}** mov)\n`;
      });
      
      if (totalIngresos > 0 || totalEgresos > 0) {
        response += `\nTipos: Ingresos **${formatCurrency(totalIngresos, symbol, currencyCode)}**, Egresos **${formatCurrency(totalEgresos, symbol, currencyCode)}**`;
      }
      
      return response;
    }

    // Sin agrupación: resumen simple
    const total = filteredMovements.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalIngresos = filteredMovements
      .filter(m => (m.type_name ?? '').toLowerCase() === 'ingreso')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalEgresos = filteredMovements
      .filter(m => (m.type_name ?? '').toLowerCase() === 'egreso')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
    
    let response = `Movimientos del **${formatDateRange(dateRange.start, dateRange.end)}**:\n`;
    response += `Total: **${formatCurrency(total, symbol, currencyCode)}** (**${formatMovementCount(filteredMovements.length)}**)\n\n`;
    
    if (totalIngresos > 0) {
      const countIngresos = filteredMovements.filter(m => (m.type_name ?? '').toLowerCase() === 'ingreso').length;
      response += `- Ingresos: **${formatCurrency(totalIngresos, symbol, currencyCode)}** (**${formatMovementCount(countIngresos)}**)\n`;
    }
    
    if (totalEgresos > 0) {
      const countEgresos = filteredMovements.filter(m => (m.type_name ?? '').toLowerCase() === 'egreso').length;
      response += `- Egresos: **${formatCurrency(totalEgresos, symbol, currencyCode)}** (**${formatMovementCount(countEgresos)}**)`;
    }
    
    return response;

  } catch (err) {
    return 'Error inesperado al buscar movimientos por rango de fechas. Por favor intenta nuevamente.';
  }
}
