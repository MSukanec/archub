// Mapeo completo de códigos alpha-3 a códigos de discado telefónico (E.164)
// Fuente: ITU-T Recommendation E.164
const DIAL_CODE_MAP: Record<string, string> = {
  // Américas
  'ARG': '+54',   // Argentina
  'BOL': '+591',  // Bolivia
  'BRA': '+55',   // Brasil
  'CHL': '+56',   // Chile
  'COL': '+57',   // Colombia
  'CRI': '+506',  // Costa Rica
  'CUB': '+53',   // Cuba
  'DOM': '+1',    // República Dominicana
  'ECU': '+593',  // Ecuador
  'SLV': '+503',  // El Salvador
  'GTM': '+502',  // Guatemala
  'HTI': '+509',  // Haití
  'HND': '+504',  // Honduras
  'JAM': '+1',    // Jamaica
  'MEX': '+52',   // México
  'NIC': '+505',  // Nicaragua
  'PAN': '+507',  // Panamá
  'PRY': '+595',  // Paraguay
  'PER': '+51',   // Perú
  'PRI': '+1',    // Puerto Rico
  'URY': '+598',  // Uruguay
  'VEN': '+58',   // Venezuela
  'USA': '+1',    // Estados Unidos
  'CAN': '+1',    // Canadá
  
  // Europa
  'ESP': '+34',   // España
  'FRA': '+33',   // Francia
  'DEU': '+49',   // Alemania
  'ITA': '+39',   // Italia
  'GBR': '+44',   // Reino Unido
  'PRT': '+351',  // Portugal
  'NLD': '+31',   // Países Bajos
  'BEL': '+32',   // Bélgica
  'CHE': '+41',   // Suiza
  'AUT': '+43',   // Austria
  'POL': '+48',   // Polonia
  'SWE': '+46',   // Suecia
  'NOR': '+47',   // Noruega
  'DNK': '+45',   // Dinamarca
  'FIN': '+358',  // Finlandia
  'IRL': '+353',  // Irlanda
  'GRC': '+30',   // Grecia
  'CZE': '+420',  // República Checa
  'HUN': '+36',   // Hungría
  'ROU': '+40',   // Rumania
  'BGR': '+359',  // Bulgaria
  'HRV': '+385',  // Croacia
  'SVK': '+421',  // Eslovaquia
  'SVN': '+386',  // Eslovenia
  'LTU': '+370',  // Lituania
  'LVA': '+371',  // Letonia
  'EST': '+372',  // Estonia
  'UKR': '+380',  // Ucrania
  'RUS': '+7',    // Rusia
  
  // Asia
  'CHN': '+86',   // China
  'IND': '+91',   // India
  'JPN': '+81',   // Japón
  'KOR': '+82',   // Corea del Sur
  'IDN': '+62',   // Indonesia
  'THA': '+66',   // Tailandia
  'VNM': '+84',   // Vietnam
  'PHL': '+63',   // Filipinas
  'MYS': '+60',   // Malasia
  'SGP': '+65',   // Singapur
  'PAK': '+92',   // Pakistán
  'BGD': '+880',  // Bangladesh
  'ISR': '+972',  // Israel
  'SAU': '+966',  // Arabia Saudita
  'ARE': '+971',  // Emiratos Árabes Unidos
  'TUR': '+90',   // Turquía
  'IRN': '+98',   // Irán
  'IRQ': '+964',  // Irak
  
  // Oceanía
  'AUS': '+61',   // Australia
  'NZL': '+64',   // Nueva Zelanda
  
  // África
  'ZAF': '+27',   // Sudáfrica
  'EGY': '+20',   // Egipto
  'NGA': '+234',  // Nigeria
  'KEN': '+254',  // Kenia
  'MAR': '+212',  // Marruecos
  'DZA': '+213',  // Argelia
  'TUN': '+216',  // Túnez
  'GHA': '+233',  // Ghana
  'ETH': '+251',  // Etiopía
};

// Reglas específicas por país para móviles
// Estas reglas se aplican DESPUÉS de remover el 0 inicial
const MOBILE_RULES: Record<string, { requiresPrefix?: string; removePrefixes?: string[] }> = {
  'ARG': {
    // Argentina: celulares requieren 9 después del código de país
    // Formato local: 0 11 5478-1234 (Buenos Aires) o 0 351 555-1234 (Córdoba)
    // Formato E.164: +54 9 11 54781234 o +54 9 351 5551234
    requiresPrefix: '9'
  },
  'MEX': {
    // México: ya no requiere el 1 en el nuevo formato (2019)
    // Si viene con 1, lo removemos
    removePrefixes: ['1']
  },
  'BRA': {
    // Brasil: celulares tienen 9 como primer dígito del número
    // Ya está incluido en el número local, no hace falta agregarlo
  }
};

/**
 * Convierte un número de teléfono local a formato E.164 internacional
 * 
 * @param raw - Número de teléfono en formato local (ej: "011 5478-1234", "1154781234", etc.)
 * @param countryAlpha3 - Código de país alpha-3 (ej: "ARG", "PER", "USA")
 * @returns Número en formato E.164 (ej: "+5491154781234") o string vacío si no se puede convertir
 * 
 * Ejemplos:
 * - Argentina móvil: "11 5478 1234" -> "+5491154781234" (agrega el 9)
 * - Argentina móvil: "0 11 5478 1234" -> "+5491154781234" (remueve el 0, agrega el 9)
 * - Perú: "987 654 321" -> "+51987654321"
 * - USA: "555 123 4567" -> "+15551234567"
 */
export function toE164(
  raw: string, 
  countryAlpha3?: string
): string {
  const trimmed = raw.trim();
  
  if (!trimmed) {
    return '';
  }

  // Remover espacios, guiones, paréntesis y puntos
  let cleaned = trimmed.replace(/[\s\-().]/g, '');
  
  // Si ya empieza con +, retornar tal cual (ya está en formato E.164)
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Intentar obtener el código de discado del mapeo
  if (!countryAlpha3) {
    return '';
  }

  const dialCode = DIAL_CODE_MAP[countryAlpha3.toUpperCase()];
  
  if (!dialCode) {
      `[toE164] Country "${countryAlpha3}" not found in dial code mapping. ` +
      `Phone number cannot be converted to E.164 format. ` +
      `Returning empty string to prevent invalid data.`
    );
    return '';
  }
  
  // PASO 1: Remover el 0 inicial de marcación nacional (muy común en muchos países)
  // Ejemplos: 
  // - Argentina: "011 5478 1234" -> "11 5478 1234"
  // - Perú: "01 987 654" -> "1 987 654"
  // - España: "612 345 678" (no tiene 0) -> queda igual
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // PASO 2: Aplicar reglas específicas del país para móviles
  const mobileRule = MOBILE_RULES[countryAlpha3.toUpperCase()];
  if (mobileRule) {
    // Remover prefijos si es necesario (ej: México)
    if (mobileRule.removePrefixes) {
      for (const prefix of mobileRule.removePrefixes) {
        if (cleaned.startsWith(prefix)) {
          cleaned = cleaned.substring(prefix.length);
          break;
        }
      }
    }
    
    // Agregar prefijo requerido (ej: el 9 de Argentina)
    if (mobileRule.requiresPrefix) {
      // Solo agregar si no está ya presente
      if (!cleaned.startsWith(mobileRule.requiresPrefix)) {
        cleaned = mobileRule.requiresPrefix + cleaned;
      }
    }
  }
  
  // PASO 3: Construir número E.164
  const result = `${dialCode}${cleaned}`;
  
  // PASO 4: Validación básica de longitud
  // La mayoría de números tienen entre 8-15 dígitos (excluyendo el +)
  const digitCount = result.replace(/\+/g, '').length;
  if (digitCount < 8 || digitCount > 15) {
      `[toE164] Invalid phone number length (${digitCount} digits). ` +
      `Expected 8-15 digits. Input: "${raw}", Output: "${result}"`
    );
    return '';
  }
  
  return result;
}

/**
 * Extrae el número de teléfono sin código de país para mostrarlo en PhoneField
 * 
 * @param e164Phone - Número en formato E.164 (ej: "+5491154781234")
 * @returns Número local sin código de país (ej: "1154781234")
 * 
 * Nota: Esta función NO agrega el 0 de marcación nacional porque no sabemos
 * si el usuario va a copiar/pegar para WhatsApp (no lleva 0) o para llamar localmente (lleva 0).
 * Es más seguro retornar el número tal cual está guardado.
 * 
 * Ejemplos:
 * - "+5491154781234" -> "91154781234" (mantiene el 9)
 * - "+51987654321" -> "987654321"
 * - "+15551234567" -> "5551234567"
 */
export function fromE164(e164Phone: string): string {
  if (!e164Phone) return '';
  
  // Remove all non-digit characters except +
  const cleaned = e164Phone.replace(/[\s\-()]/g, '');
  
  // If it doesn't start with +, return as-is
  if (!cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Remove the + prefix
  const withoutPlus = cleaned.substring(1);
  
  // Try to match against known dial codes from our mapping
  // We need to check from longest to shortest to avoid partial matches
  // e.g., "+880" (Bangladesh) vs "+88" (would match first 2 digits of +880)
  const allDialCodes = Object.values(DIAL_CODE_MAP)
    .map(code => code.replace('+', ''))
    .sort((a, b) => b.length - a.length); // Sort by length descending
  
  for (const dialCode of allDialCodes) {
    if (withoutPlus.startsWith(dialCode)) {
      // Found a match! Return everything after the dial code
      return withoutPlus.substring(dialCode.length);
    }
  }
  
  // If no known dial code matched, try a heuristic approach
  // Most country codes are 1-3 digits, very few are 4 digits
  // We'll try 1, 2, 3 digits and return the first that leaves enough digits for a phone number
  for (let codeLength = 1; codeLength <= 3; codeLength++) {
    const potentialCode = withoutPlus.substring(0, codeLength);
    const potentialNumber = withoutPlus.substring(codeLength);
    
    // A valid phone number should have at least 6 digits
    if (potentialNumber.length >= 6) {
      // Use the shortest code that leaves a valid number
      return potentialNumber;
    }
  }
  
  // If we still can't parse it, return the whole thing without the +
  return withoutPlus;
}

/**
 * Valida si un número de teléfono es válido en formato E.164
 * 
 * @param e164Phone - Número en formato E.164
 * @returns true si el número parece válido, false si no
 */
export function isValidE164(e164Phone: string): boolean {
  if (!e164Phone) return false;
  
  // Debe empezar con +
  if (!e164Phone.startsWith('+')) return false;
  
  // Debe tener solo dígitos después del +
  const digits = e164Phone.substring(1);
  if (!/^\d+$/.test(digits)) return false;
  
  // Debe tener entre 8-15 dígitos (excluyendo el +)
  if (digits.length < 8 || digits.length > 15) return false;
  
  return true;
}

/**
 * Formatea un número E.164 para WhatsApp
 * WhatsApp acepta números con o sin +, pero es más confiable con +
 * 
 * @param e164Phone - Número en formato E.164
 * @returns URL de WhatsApp lista para usar
 * 
 * Ejemplo: "+5491154781234" -> "https://wa.me/5491154781234"
 */
export function formatForWhatsApp(e164Phone: string): string {
  if (!e164Phone) return '';
  
  // WhatsApp acepta el número sin el +
  const phoneNumber = e164Phone.replace('+', '');
  return `https://wa.me/${phoneNumber}`;
}

/**
 * Formatea un número E.164 para mostrar de forma legible
 * 
 * @param e164Phone - Número en formato E.164
 * @param countryAlpha3 - Código de país (opcional, para formato específico del país)
 * @returns Número formateado para lectura humana
 * 
 * Ejemplos:
 * - "+5491154781234" -> "+54 9 11 5478-1234" (Argentina)
 * - "+51987654321" -> "+51 987 654 321" (Perú)
 * - "+15551234567" -> "+1 555-123-4567" (USA)
 */
export function formatE164ForDisplay(e164Phone: string, countryAlpha3?: string): string {
  if (!e164Phone || !e164Phone.startsWith('+')) return e164Phone;
  
  // Por ahora retornamos el formato E.164 básico con espacios
  // En el futuro podemos agregar formatos específicos por país
  const withoutPlus = e164Phone.substring(1);
  
  // Encontrar el código de país
  const allDialCodes = Object.entries(DIAL_CODE_MAP)
    .map(([alpha3, code]) => ({ alpha3, code: code.replace('+', '') }))
    .sort((a, b) => b.code.length - a.code.length);
  
  for (const { alpha3, code } of allDialCodes) {
    if (withoutPlus.startsWith(code)) {
      const localNumber = withoutPlus.substring(code.length);
      
      // Formato básico: +XX XXX XXX XXX
      if (localNumber.length <= 4) {
        return `+${code} ${localNumber}`;
      } else if (localNumber.length <= 7) {
        return `+${code} ${localNumber.substring(0, 3)} ${localNumber.substring(3)}`;
      } else if (localNumber.length <= 10) {
        return `+${code} ${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
      } else {
        return `+${code} ${localNumber.substring(0, 3)} ${localNumber.substring(3, 7)} ${localNumber.substring(7)}`;
      }
    }
  }
  
  return e164Phone;
}
