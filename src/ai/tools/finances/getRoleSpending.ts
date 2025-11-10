import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency, formatDateRange } from '../../utils/responseFormatter';
import { buildMovementQuery, type MovementRow } from './helpers/movementQueryBuilder';
import { textIncludes } from '../../utils/textNormalizer';

/**
 * Suma total de gastos por rol específico (subcontratistas, personal, socios)
 * 
 * @param role - Tipo de rol: 'subcontractor', 'personnel', 'partner'
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @param projectName - Nombre del proyecto (opcional, fuzzy match)
 * @param dateRange - Rango de fechas (opcional)
 * @param currency - Código de moneda para filtrar (opcional)
 * @returns Mensaje con el total de gastos o error descriptivo
 */
export async function getRoleSpending(
  role: 'subcontractor' | 'personnel' | 'partner',
  organizationId: string,
  supabase: SupabaseClient,
  projectName?: string,
  dateRange?: { start: string; end: string },
  currency?: string
): Promise<string> {
  
  try {
    // Usar query builder con campos específicos según el rol:
    // Necesita: currencies, projects, movement_date, rol específico (partner, subcontract+contact, o personnel)
    const roles = {
      partner: role === 'partner',
      subcontract: role === 'subcontractor',
      personnel: role === 'personnel',
      client: false,
      member: false
    };

    let query = buildMovementQuery(supabase, {
      includeProject: true,
      includeCurrency: true,
      includeRoles: roles
    }).eq('organization_id', organizationId);

    // Filtrar por rol (campo no null)
    if (role === 'subcontractor') {
      query = query.not('subcontract', 'is', null);
    } else if (role === 'personnel') {
      query = query.not('personnel', 'is', null);
    } else if (role === 'partner') {
      query = query.not('partner', 'is', null);
    }

    // Ejecutar query
    const { data: movements, error } = (await query) as { data: MovementRow[] | null, error: any };

    if (error) {
      return `Error al buscar gastos: ${error.message}`;
    }

    if (!movements || movements.length === 0) {
      const roleNames = {
        subcontractor: 'subcontratistas',
        personnel: 'personal',
        partner: 'socios'
      };
      return `No encontré gastos en **${roleNames[role]}** en tu organización`;
    }

    // Filtrar en JavaScript por proyecto si se especifica (insensible a acentos)
    let filteredMovements = movements;
    if (projectName) {
      filteredMovements = filteredMovements.filter(m => 
        textIncludes(m.project_name ?? '', projectName)
      );
      
      if (filteredMovements.length === 0) {
        const roleNames = {
          subcontractor: 'subcontratistas',
          personnel: 'personal',
          partner: 'socios'
        };
        return `No encontré gastos en **${roleNames[role]}** en el proyecto **"${projectName}"**`;
      }
    }

    // Filtrar por rango de fechas si se especifica
    if (dateRange) {
      filteredMovements = filteredMovements.filter(m => {
        if (!m.movement_date) return false;
        return m.movement_date >= dateRange.start && m.movement_date <= dateRange.end;
      });
      
      if (filteredMovements.length === 0) {
        const roleNames = {
          subcontractor: 'subcontratistas',
          personnel: 'personal',
          partner: 'socios'
        };
        const periodText = `en el período **${formatDateRange(dateRange.start, dateRange.end)}**`;
        const projectText = projectName ? ` en el proyecto **"${projectName}"**` : '';
        return `No encontré gastos en **${roleNames[role]}**${projectText} ${periodText}`;
      }
    }

    // Filtrar por moneda si se especifica
    if (currency) {
      const currencyUpper = currency.toUpperCase();
      filteredMovements = filteredMovements.filter(m => 
        (m.currency_code ?? '').toUpperCase() === currencyUpper
      );
      
      if (filteredMovements.length === 0) {
        return `No encontré gastos en **${currencyUpper}** para este filtro`;
      }
    }

    // Validar que todas las monedas sean iguales
    const uniqueCurrencies = new Set(
      filteredMovements
        .map(m => m.currency_code)
        .filter(code => code != null)
    );

    if (uniqueCurrencies.size > 1) {
      const currencyList = Array.from(uniqueCurrencies).join(', ');
      return `Los movimientos están en múltiples monedas (**${currencyList}**). Por favor especifica la moneda`;
    }

    // Calcular total
    const total = filteredMovements.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const count = filteredMovements.length;
    const firstMovement = filteredMovements[0];
    const symbol = firstMovement.currency_symbol || '$';
    const currencyCode = firstMovement.currency_code || '';
    
    // Formatear total
    const totalFormatted = formatCurrency(total, symbol);
    
    // Agrupar por proyecto para el desglose
    const projectsMap = new Map<string, number>();
    for (const movement of filteredMovements) {
      const project = movement.project_name || 'Sin proyecto';
      projectsMap.set(project, (projectsMap.get(project) || 0) + Number(movement.amount || 0));
    }
    
    // Nombre del rol en español
    const roleNames = {
      subcontractor: 'subcontratistas',
      personnel: 'personal',
      partner: 'socios'
    };
    
    // Construir respuesta
    let response = `Gastaste **${totalFormatted}** en **${roleNames[role]}**`;
    
    // Agregar contexto de período si existe
    if (dateRange) {
      response += ` **${formatDateRange(dateRange.start, dateRange.end)}**`;
    }
    
    response += ` (**${count}** movimiento${count !== 1 ? 's' : ''})`;
    
    // Agregar desglose por proyecto si hay múltiples proyectos
    if (projectsMap.size > 1) {
      const sortedProjects = Array.from(projectsMap.entries())
        .sort((a, b) => b[1] - a[1]);
      
      response += '\nProyectos: ';
      response += sortedProjects
        .map(([project, amount]) => {
          const amountFormatted = formatCurrency(amount, symbol);
          return `**${project}** (**${amountFormatted}**)`;
        })
        .join(', ');
    } else if (projectsMap.size === 1 && !projectName) {
      // Si hay un solo proyecto y no se filtró por proyecto, mencionarlo
      const [project] = Array.from(projectsMap.keys());
      if (project !== 'Sin proyecto') {
        response += `\nProyecto: **${project}**`;
      }
    }
    
    return response;

  } catch (err) {
    return 'Error inesperado al calcular gastos por rol. Por favor intenta nuevamente.';
  }
}
