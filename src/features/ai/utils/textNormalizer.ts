/**
 * Normaliza texto para búsquedas insensibles a acentos y mayúsculas
 * Convierte a minúsculas y remueve acentos/diacríticos
 * 
 * @example
 * normalizeText("Machónico") // "machonico"
 * normalizeText("Osvaldo Robért") // "osvaldo robert"
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Remueve marcas diacríticas
    .trim();
}

/**
 * Compara dos textos de forma insensible a acentos y mayúsculas
 */
export function textMatches(text1: string, text2: string): boolean {
  return normalizeText(text1) === normalizeText(text2);
}

/**
 * Verifica si un texto contiene otro de forma insensible a acentos y mayúsculas
 */
export function textIncludes(haystack: string, needle: string): boolean {
  return normalizeText(haystack).includes(normalizeText(needle));
}
