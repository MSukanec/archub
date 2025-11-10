export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

/**
 * Parsea expresiones de fecha en lenguaje natural a rangos de fechas
 * @param expression - Expresión en español (ej: "hoy", "esta semana", "este mes", "último trimestre", etc.)
 * @returns DateRange con fechas en formato YYYY-MM-DD o null si no se puede parsear
 */
export function parseDateExpression(expression: string): DateRange | null {
  const normalizedExpression = expression.toLowerCase().trim();
  const today = new Date();
  
  // Helper para formatear fecha a YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // ISO date: "2024-01-15"
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoDateRegex.test(normalizedExpression)) {
    return {
      start: normalizedExpression,
      end: normalizedExpression
    };
  }

  // Hoy
  if (normalizedExpression === 'hoy' || normalizedExpression === 'today') {
    return {
      start: formatDate(today),
      end: formatDate(today)
    };
  }

  // Ayer
  if (normalizedExpression === 'ayer' || normalizedExpression === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      start: formatDate(yesterday),
      end: formatDate(yesterday)
    };
  }

  // Esta semana (lunes a domingo)
  if (normalizedExpression === 'esta semana' || normalizedExpression === 'this week') {
    const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const monday = new Date(today);
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(today.getDate() - daysFromMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: formatDate(monday),
      end: formatDate(sunday)
    };
  }

  // Semana pasada / última semana
  if (normalizedExpression === 'semana pasada' || normalizedExpression === 'última semana' || normalizedExpression === 'last week') {
    const currentDay = today.getDay();
    const lastMonday = new Date(today);
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    lastMonday.setDate(today.getDate() - daysFromMonday - 7);
    
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    return {
      start: formatDate(lastMonday),
      end: formatDate(lastSunday)
    };
  }

  // Este mes
  if (normalizedExpression === 'este mes' || normalizedExpression === 'this month') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  }

  // Último mes / mes pasado
  if (normalizedExpression === 'último mes' || normalizedExpression === 'mes pasado' || normalizedExpression === 'last month') {
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  }

  // Este año
  if (normalizedExpression === 'este año' || normalizedExpression === 'this year') {
    const firstDay = new Date(today.getFullYear(), 0, 1);
    const lastDay = new Date(today.getFullYear(), 11, 31);
    
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  }

  // Año pasado / último año
  if (normalizedExpression === 'año pasado' || normalizedExpression === 'último año' || normalizedExpression === 'last year') {
    const firstDay = new Date(today.getFullYear() - 1, 0, 1);
    const lastDay = new Date(today.getFullYear() - 1, 11, 31);
    
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  }

  // Último trimestre
  if (normalizedExpression === 'último trimestre' || normalizedExpression === 'trimestre pasado' || normalizedExpression === 'last quarter') {
    const currentMonth = today.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
    const year = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
    
    const firstMonth = lastQuarter * 3;
    const firstDay = new Date(year, firstMonth, 1);
    const lastDay = new Date(year, firstMonth + 3, 0);
    
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  }

  // Este trimestre
  if (normalizedExpression === 'este trimestre' || normalizedExpression === 'this quarter') {
    const currentMonth = today.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    
    const firstMonth = currentQuarter * 3;
    const firstDay = new Date(today.getFullYear(), firstMonth, 1);
    const lastDay = new Date(today.getFullYear(), firstMonth + 3, 0);
    
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  }

  // Último semestre / últimos 6 meses
  if (normalizedExpression === 'último semestre' || normalizedExpression === 'últimos 6 meses' || normalizedExpression === 'last semester') {
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    return {
      start: formatDate(sixMonthsAgo),
      end: formatDate(today)
    };
  }

  // Últimos 30 días
  if (normalizedExpression === 'últimos 30 días' || normalizedExpression === 'último mes' || normalizedExpression === 'last 30 days') {
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      start: formatDate(thirtyDaysAgo),
      end: formatDate(today)
    };
  }

  // Últimos 7 días
  if (normalizedExpression === 'últimos 7 días' || normalizedExpression === 'última semana' || normalizedExpression === 'last 7 days') {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return {
      start: formatDate(sevenDaysAgo),
      end: formatDate(today)
    };
  }

  // No se pudo parsear
  return null;
}
