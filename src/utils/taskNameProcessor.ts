/**
 * Procesa los nombres de tareas reemplazando los parámetros {{parametro}} 
 * con los valores reales de param_values
 */

interface ParamValues {
  [key: string]: string | number | boolean | null | undefined;
}

// Mapeo de valores de parámetros a textos legibles
const PARAM_VALUE_MAPPINGS: Record<string, Record<string, string>> = {
  // Aditivos
  aditivos: {
    'sin-aditivos': 'sin aditivos',
    'con-aditivos': 'con aditivos',
    'impermeabilizante': 'impermeabilizante',
  },
  
  // Tipos de ladrillo
  'brick-type': {
    'ladrillo-ceramico-181833': 'de 08x18x33',
    'ladrillo-ceramico-121833': 'de 12x18x33', 
    'ladrillo-ceramico-181833-perforado': 'de 18x18x33 perforado',
  },
  
  // Tipos de mortero
  mortar_type: {
    'cemento-albanileria': 'con mortero de cemento de albañilería',
    'cemento-arenoso': 'con mortero cemento arenoso',
    'cemento-cal': 'con mortero de cemento y cal',
    'asiento': 'de asiento',
  },
  
  // Medidas generales
  thickness: {
    '10': '10cm',
    '15': '15cm', 
    '20': '20cm',
    '25': '25cm',
    '30': '30cm',
  }
};

/**
 * Procesa un nombre de tarea reemplazando parámetros {{param}} con valores reales
 */
export function processTaskName(displayName: string, paramValues: ParamValues | null | undefined): string {
  if (!displayName || !paramValues) {
    return displayName || '';
  }

  console.log('Processing task name:', { displayName, paramValues });

  let processedName = displayName;
  
  // Buscar todos los parámetros en formato {{parametro}}
  const paramPattern = /\{\{([^}]+)\}\}/g;
  const matches: RegExpExecArray[] = [];
  let match;
  while ((match = paramPattern.exec(displayName)) !== null) {
    matches.push(match);
  }
  
  for (const match of matches) {
    const fullMatch = match[0]; // {{parametro}}
    const paramKey = match[1]; // parametro
    
    // Obtener el valor del parámetro
    const paramValue = paramValues[paramKey];
    
    if (paramValue !== undefined && paramValue !== null) {
      // Buscar mapeo específico para este parámetro
      const mappings = PARAM_VALUE_MAPPINGS[paramKey];
      let replacementText = '';
      
      if (mappings && mappings[String(paramValue)]) {
        // Usar mapeo específico
        replacementText = mappings[String(paramValue)];
      } else {
        // Usar valor directo, limpiando guiones y convirtiendo a formato legible
        replacementText = String(paramValue)
          .replace(/-/g, ' ')
          .toLowerCase();
      }
      
      processedName = processedName.replace(fullMatch, replacementText);
    } else {
      // Si no hay valor, eliminar el parámetro completo
      processedName = processedName.replace(fullMatch, '');
    }
  }
  
  // Limpiar espacios múltiples y puntos dobles
  processedName = processedName
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/\.\s*\./g, '.') // Múltiples puntos a uno solo
    .trim();
    
  return processedName;
}

/**
 * Agrega mapeos adicionales de parámetros
 */
export function addParamMapping(paramKey: string, mappings: Record<string, string>) {
  PARAM_VALUE_MAPPINGS[paramKey] = {
    ...PARAM_VALUE_MAPPINGS[paramKey],
    ...mappings
  };
}