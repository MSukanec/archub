import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCurrency, formatDateRange } from '../../utils/responseFormatter';
import { buildMovementQuery, type MovementRow } from './helpers/movementQueryBuilder';
import { textIncludes } from '../../utils/textNormalizer';

/**
 * Agrupa movimientos por intervalo temporal
 */
function groupByInterval(
  movements: any[],
  interval: 'daily' | 'weekly' | 'monthly'
): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  
  for (const movement of movements) {
    const date = new Date(movement.movement_date);
    let groupKey = '';
    
    switch (interval) {
      case 'daily':
        groupKey = movement.movement_date; // Ya está en formato YYYY-MM-DD
        break;
      case 'weekly': {
        // Calcular el lunes de la semana
        const currentDay = date.getDay();
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(date);
        monday.setDate(date.getDate() - daysFromMonday);
        groupKey = monday.toISOString().split('T')[0];
        break;
      }
      case 'monthly':
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        groupKey = `${year}-${month}`;
        break;
    }
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(movement);
  }
  
  return groups;
}

/**
 * Formatea el nombre del período según el intervalo
 */
function formatPeriodName(periodKey: string, interval: 'daily' | 'weekly' | 'monthly'): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  switch (interval) {
    case 'daily': {
      const date = new Date(periodKey);
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} de ${month} ${year}`;
    }
    case 'weekly': {
      const monday = new Date(periodKey);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startDay = monday.getDate();
      const startMonth = monthNames[monday.getMonth()];
      const endDay = sunday.getDate();
      const endMonth = monthNames[sunday.getMonth()];
      const year = monday.getFullYear();
      
      if (startMonth === endMonth) {
        return `Semana del ${startDay} al ${endDay} de ${startMonth} ${year}`;
      } else {
        return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} ${year}`;
      }
    }
    case 'monthly': {
      const [year, month] = periodKey.split('-');
      const monthIndex = parseInt(month) - 1;
      return `${monthNames[monthIndex]} ${year}`;
    }
  }
}

/**
 * Analiza tendencias de flujo de efectivo a lo largo del tiempo.
 * 
 * @param organizationId - ID de la organización
 * @param supabase - Cliente autenticado de Supabase
 * @param scope - 'organization' o 'project'
 * @param projectName - Nombre del proyecto (obligatorio si scope='project')
 * @param interval - Intervalo de agrupación: 'daily', 'weekly', 'monthly' (default: 'monthly')
 * @param dateRange - Rango de fechas (opcional, si no se especifica usa últimos 3 meses)
 * @param currency - Código de moneda para filtrar (opcional)
 * @returns Análisis de tendencia del flujo de efectivo
 */
export async function getCashflowTrend(
  organizationId: string,
  supabase: SupabaseClient,
  scope: 'organization' | 'project',
  projectName?: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'monthly',
  dateRange?: { start: string; end: string },
  currency?: string
): Promise<string> {
  
  try {
    // Validar scope
    if (scope === 'project' && !projectName) {
      return 'Para analizar un proyecto específico debes proporcionar el nombre del proyecto';
    }

    // Determinar rango de fechas
    let start: string;
    let end: string;
    
    if (dateRange) {
      start = dateRange.start;
      end = dateRange.end;
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'El rango de fechas no es válido. Usa formato YYYY-MM-DD';
      }
      
      if (startDate > endDate) {
        return 'El rango de fechas no es válido. La fecha de inicio debe ser anterior a la fecha de fin';
      }
    } else {
      // Últimos 3 meses por defecto
      const today = new Date();
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      end = today.toISOString().split('T')[0];
      start = threeMonthsAgo.toISOString().split('T')[0];
    }

    // Usar query builder con campos específicos:
    // Necesita: currencies, projects (condicional), type, movement_date
    let query = buildMovementQuery(supabase, {
      includeProject: scope === 'project',
      includeCurrency: true,
      includeConcepts: {
        type: true
      }
    })
      .eq('organization_id', organizationId)
      .gte('movement_date', start)
      .lte('movement_date', end);

    // Filtro de proyecto se hace post-query para manejar acentos

    // Si hay moneda específica, filtrar
    if (currency) {
      const currencyUpper = currency.toUpperCase();
      query = query.eq('currency_code', currencyUpper);
    }

    const { data: allMovements, error } = (await query) as { data: MovementRow[] | null, error: any };

    if (error) {
      console.error('Error fetching movements:', error);
      return `Error al buscar movimientos: ${error.message}`;
    }

    if (!allMovements || allMovements.length === 0) {
      return 'No hay movimientos en el período analizado';
    }

    // Filtrar por proyecto si es necesario (insensible a acentos)
    let movements = allMovements;
    if (scope === 'project' && projectName) {
      movements = allMovements.filter(m => 
        textIncludes(m.project_name ?? '', projectName)
      );
      
      if (movements.length === 0) {
        return `No encontré el proyecto **"${projectName}"** o no tiene movimientos en el período analizado. Es posible que el nombre del proyecto sea diferente.`;
      }
    }

    // Validar moneda única
    const uniqueCurrencies = new Set(
      movements
        .map(m => m.currency_code)
        .filter(code => code != null)
    );

    if (uniqueCurrencies.size > 1) {
      const currencyList = Array.from(uniqueCurrencies).join(', ');
      return `Los movimientos tienen múltiples monedas (**${currencyList}**). Por favor especifica una moneda`;
    }

    const firstMovement = movements[0];
    const symbol = firstMovement.currency_symbol || '$';
    const currencyCode = firstMovement.currency_code || '';

    // Agrupar por intervalo
    const groups = groupByInterval(movements, interval);
    
    // Ordenar períodos cronológicamente
    const sortedPeriods = Array.from(groups.keys()).sort();
    
    if (sortedPeriods.length === 0) {
      return 'No hay datos suficientes para analizar la tendencia';
    }
    
    if (sortedPeriods.length === 1) {
      return 'Necesitas más datos para ver la tendencia. Solo hay movimientos en un período';
    }

    // Calcular datos por período
    interface PeriodData {
      periodKey: string;
      periodName: string;
      ingresos: number;
      egresos: number;
      flujoNeto: number;
      balanceAcumulado: number;
    }
    
    const periodData: PeriodData[] = [];
    let balanceAcumulado = 0;
    
    for (const periodKey of sortedPeriods) {
      const periodMovements = groups.get(periodKey)!;
      
      const ingresos = periodMovements
        .filter(m => (m.type_name ?? '').toLowerCase() === 'ingreso')
        .reduce((sum, m) => sum + Number(m.amount || 0), 0);
      
      const egresos = periodMovements
        .filter(m => (m.type_name ?? '').toLowerCase() === 'egreso')
        .reduce((sum, m) => sum + Number(m.amount || 0), 0);
      
      const flujoNeto = ingresos - egresos;
      balanceAcumulado += flujoNeto;
      
      periodData.push({
        periodKey,
        periodName: formatPeriodName(periodKey, interval),
        ingresos,
        egresos,
        flujoNeto,
        balanceAcumulado
      });
    }

    // Identificar tendencia
    const flujos = periodData.map(p => p.flujoNeto);
    let tendencia = 'Estable';
    
    if (flujos.length >= 2) {
      const primerMitad = flujos.slice(0, Math.floor(flujos.length / 2));
      const segundaMitad = flujos.slice(Math.floor(flujos.length / 2));
      
      const promedioPrimera = primerMitad.reduce((a, b) => a + b, 0) / primerMitad.length;
      const promedioSegunda = segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;
      
      if (promedioSegunda > promedioPrimera * 1.1) {
        tendencia = 'Mejorando (flujo neto creciente)';
      } else if (promedioSegunda < promedioPrimera * 0.9) {
        tendencia = 'Empeorando (flujo neto decreciente)';
      }
    }

    // Calcular promedio
    const promedioFlujo = flujos.reduce((a, b) => a + b, 0) / flujos.length;
    
    // Construir respuesta
    let response = 'Flujo de efectivo';
    if (scope === 'project' && projectName) {
      response += ` - **${firstMovement.project_name || projectName}**`;
    }
    if (!dateRange) {
      response += ' - **Últimos 3 meses**';
    }
    response += ':\n\n';
    
    // Mostrar los últimos 5 períodos (o todos si hay menos)
    const periodsToShow = periodData.slice(-5);
    
    for (const period of periodsToShow) {
      response += `**${period.periodName}**:\n`;
      response += `  Ingresos: **${formatCurrency(period.ingresos, symbol, currencyCode)}**\n`;
      response += `  Egresos: **${formatCurrency(period.egresos, symbol, currencyCode)}**\n`;
      response += `  Flujo neto: **${period.flujoNeto >= 0 ? '+' : ''}${formatCurrency(period.flujoNeto, symbol, currencyCode)}**\n`;
      response += `  Balance acumulado: **${formatCurrency(period.balanceAcumulado, symbol, currencyCode)}**\n\n`;
    }
    
    response += `Tendencia: **${tendencia}**\n`;
    
    const intervalLabel = {
      'daily': 'diario',
      'weekly': 'semanal',
      'monthly': 'mensual'
    }[interval];
    
    response += `Promedio ${intervalLabel}: **${promedioFlujo >= 0 ? '+' : ''}${formatCurrency(promedioFlujo, symbol, currencyCode)}**`;
    
    return response;

  } catch (err) {
    console.error('Unexpected error in getCashflowTrend:', err);
    return 'Error inesperado al analizar el flujo de efectivo. Por favor intenta nuevamente.';
  }
}
