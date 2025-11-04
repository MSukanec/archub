import chroma from 'chroma-js';

/**
 * Convierte un color hexadecimal a RGB
 * @param hex - Color en formato hex (#RRGGBB o #RGB)
 * @returns Objeto con valores r, g, b (0-255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remover el # si existe
  const cleanHex = hex.replace('#', '');
  
  // Validar formato
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex) && !/^[0-9A-Fa-f]{3}$/.test(cleanHex)) {
    return null;
  }
  
  // Expandir formato corto (#RGB → #RRGGBB)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Convierte RGB a HSL
 * @param r - Rojo (0-255)
 * @param g - Verde (0-255)
 * @param b - Azul (0-255)
 * @returns Objeto con valores h (0-360), s (0-100), l (0-100)
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convierte un color hexadecimal a HSL
 * @param hex - Color en formato hex (#RRGGBB o #RGB)
 * @returns Objeto con valores h (0-360), s (0-100), l (0-100) o null si el formato es inválido
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

/**
 * Formatea HSL para uso en CSS custom properties
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns String en formato "H S% L%"
 */
export function formatHslForCss(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

/**
 * Calcula el color de hover basado en el color base y el modo del tema
 * @param baseColor - Color en formato hex
 * @param isDark - Si el tema está en modo oscuro
 * @returns Color de hover en formato hex
 */
export function calculateHoverColor(baseColor: string, isDark: boolean): string {
  const color = chroma(baseColor);
  
  // En modo oscuro: hacer el color más brillante
  // En modo claro: hacer el color más oscuro
  return isDark 
    ? color.brighten(0.6).hex() 
    : color.darken(0.4).hex();
}

/**
 * Calcula el color del texto basado en la luminancia del color de fondo
 * @param backgroundColor - Color de fondo en formato hex
 * @returns Color de texto (#000000 o #ffffff) para máximo contraste
 */
export function calculateForegroundColor(backgroundColor: string): string {
  const color = chroma(backgroundColor);
  
  // Si la luminancia es mayor a 0.5, usar texto negro; si no, usar blanco
  return color.luminance() > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Convierte un valor de Hue (tono) a color hexadecimal con saturación y luminosidad fijas
 * Usa valores S=78% y L=55% para obtener colores vibrantes y consistentes tipo "Material You"
 * @param h - Hue (tono) en grados (0-360)
 * @param s - Saturation (saturación) en decimal 0-1, por defecto 0.78
 * @param l - Lightness (luminosidad) en decimal 0-1, por defecto 0.55
 * @returns Color en formato hexadecimal (#RRGGBB)
 */
export function hslToHex(h: number, s = 0.78, l = 0.55): string {
  // Normalizar h a rango 0-360
  h = h % 360;
  if (h < 0) h += 360;
  
  // Usar chroma-js para la conversión
  const color = chroma.hsl(h, s, l);
  return color.hex();
}
