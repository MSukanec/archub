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

export function toE164(
  raw: string, 
  countryAlpha3?: string, 
  fallbackCode?: string  // Reserved for future use, currently unused
): string {
  const trimmed = raw.trim();
  
  if (!trimmed) {
    return '';
  }

  // Remover espacios, guiones y paréntesis
  const digits = trimmed.replace(/[\s\-()]/g, '');
  
  // Si ya empieza con +, retornar tal cual (ya está en formato E.164)
  if (digits.startsWith('+')) {
    return digits;
  }
  
  // Intentar obtener el código de discado del mapeo
  let dialCode: string | undefined;
  
  if (countryAlpha3) {
    dialCode = DIAL_CODE_MAP[countryAlpha3.toUpperCase()];
    
    if (!dialCode) {
      console.warn(
        `[toE164] Country "${countryAlpha3}" not found in dial code mapping. ` +
        `Phone number cannot be converted to E.164 format. ` +
        `Returning empty string to prevent invalid data.`
      );
      // Return empty string instead of generating invalid E.164 numbers
      // This prevents saving values like "+BGR1234567" to the database
      return '';
    }
  }
  
  // Si tenemos un dialCode del mapeo, concatenar
  if (dialCode) {
    const result = `${dialCode}${digits}`;
    
    // Validar que tenga al menos algunos dígitos después del código de país
    if (result.replace(/\+/g, '').length >= 5) {
      return result;
    }
  }
  
  // Si no hay dialCode o no es válido, retornar vacío
  return '';
}

// Extract phone number without country code for display in PhoneField
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
