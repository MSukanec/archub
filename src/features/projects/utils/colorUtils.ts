/**
 * Color Utilities
 * 
 * Utility functions for color manipulation and calculations.
 */
import chroma from 'chroma-js';
/**
 * Calcula el color de texto (negro o blanco) basado en el color de fondo.
 * 
 * Usa el algoritmo de luminancia de chroma-js para determinar si el fondo
 * es claro u oscuro y retorna el color de texto apropiado.
 * 
 * @param backgroundColor - Color de fondo en formato hex (#RRGGBB)
 * @returns Color de texto en formato hex (#000000 o #ffffff)
 */
export function getTextColor(backgroundColor: string): string {
  try {
    const color = chroma(backgroundColor);
    return color.luminance() > 0.5 ? '#000000': '#ffffff';
  } catch {
    return '#ffffff';
  }
}
/**
 * Convierte un color hex a RGB.
 * 
 * @param hex - Color en formato hex (#RRGGBB o RRGGBB)
 * @returns String RGB en formato "r, g, b"
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r}, ${g}, ${b}`;
}
/**
 * Convierte un color hex a HSL.
 * 
 * @param hex - Color en formato hex (#RRGGBB o RRGGBB)
 * @returns String HSL en formato "h s% l%"
 */
export function hexToHsl(hex: string): string {
  try {
    const color = chroma(hex);
    const [h, s, l] = color.hsl();
    return `${Math.round(h || 0)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return '0 0% 0%';
  }
}
/**
 * Formatea HSL para uso en CSS.
 * 
 * @param hsl - String HSL en formato "h s% l%"
 * @returns String HSL formateado para CSS custom properties
 */
export function formatHslForCss(hsl: string): string {
  return hsl;
}
/**
 * Calcula un color de hover más claro o más oscuro.
 * 
 * @param hex - Color base en formato hex
 * @param isDark - Si el tema actual es oscuro
 * @returns Color de hover en formato hex
 */
export function calculateHoverColor(hex: string, isDark: boolean): string {
  try {
    const color = chroma(hex);
    return isDark ? color.brighten(0.5).hex() : color.darken(0.5).hex();
  } catch {
    return hex;
  }
}
/**
 * Calcula el color de foreground (texto) basado en el color de acento.
 * 
 * @param hex - Color de acento en formato hex
 * @param isDark - Si el tema actual es oscuro
 * @returns Color de foreground en formato hex
 */
export function calculateForegroundColor(hex: string, isDark: boolean): string {
  return getTextColor(hex);
}
/**
 * Convierte un valor de Hue (0-360) a hex.
 * 
 * @param hue - Valor de hue entre 0 y 360
 * @returns Color en formato hex
 */
export function hslToHex(hue: number): string {
  try {
    return chroma.hsl(hue, 1, 0.5).hex();
  } catch {
    return '#000000';
  }
}
