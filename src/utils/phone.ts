export function toE164(raw: string, countryCode?: string): string {
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
  
  // Si no empieza con + y tenemos countryCode, concatenar
  if (countryCode) {
    // Asegurar que countryCode empiece con +
    const prefix = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    const result = `${prefix}${digits}`;
    
    // Validar que tenga al menos algunos dígitos después del código de país
    if (result.replace(/\+/g, '').length >= 5) {
      return result;
    }
  }
  
  // Si no hay suficientes dígitos o no hay countryCode, retornar vacío
  return '';
}
