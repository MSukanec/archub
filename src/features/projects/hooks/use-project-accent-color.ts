import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { 
  calculateHoverColor, 
  calculateForegroundColor,
} from '../utils/colorUtils';
import { DEFAULT_ACCENT } from '../constants';
/**
 * Hook que actualiza dinámicamente el color de acento (--accent).
 * 
 * NOTA: La funcionalidad de aplicar el color del proyecto a la UI está 
 * temporalmente desactivada. Siempre usa el color por defecto (verde lima).
 * 
 * TODO: Reactivar cuando se defina mejor el sistema de colores por proyecto.
 */
export function useProjectAccentColor() {
  const { isDark } = useThemeStore();
  useEffect(() => {
    // Siempre usar color por defecto - funcionalidad de color por proyecto desactivada
    applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb, isDark);
  }, [isDark]);
}
/**
 * Aplica el color de acento a las variables CSS del documento.
 * Genera una paleta completa de colores derivados para identidad visual del proyecto.
 */
function applyAccentColor(hex: string, hsl: string, rgb: string, isDark: boolean) {
  const root = document.documentElement;
  
  // Calcular variantes automáticamente usando chroma-js
  const hoverColor = calculateHoverColor(hex, isDark);
  const foregroundColor = calculateForegroundColor(hex, isDark);
  
  // Actualizar variables CSS base
  root.style.setProperty('--accent', `hsl(${hsl})`);
  root.style.setProperty('--accent-hsl', hsl);
  root.style.setProperty('--accent-rgb', rgb);
  root.style.setProperty('--accent-hover', hoverColor);
  root.style.setProperty('--accent-foreground', foregroundColor);
  
  // Parsear HSL para generar paleta completa
  const hslParts = hsl.split('');
  if (hslParts.length === 3) {
    const h = parseInt(hslParts[0]);
    const s = parseInt(hslParts[1]);
    const l = parseInt(hslParts[2]);
    
    // === PALETA DE IDENTIDAD VISUAL DEL PROYECTO ===
    
    // 1. Colores primarios/secundarios
    // CRITICAL: Clamp all saturation/lightness to 0-100 range to prevent invalid CSS values
    const accent2Hsl = `${(h + 74) % 360} ${Math.max(0, Math.min(s - 60, 100))}% ${Math.max(0, Math.min(l, 40))}%`;
    root.style.setProperty('--accent-2', `hsl(${accent2Hsl})`);
    
    // 2. Colores para Charts - Paleta armónica de 5 colores
    // Basados en el color del proyecto usando rotación de matiz
    root.style.setProperty('--chart-1', `hsl(${h} ${Math.max(0, Math.min(s, 100))}% ${Math.max(0, Math.min(l, 100))}%)`); // Color base del proyecto
    root.style.setProperty('--chart-2', `hsl(${(h + 30) % 360} ${Math.max(0, Math.min(s - 10, 100))}% ${Math.max(0, Math.min(l + 5, 100))}%)`); // Análogo +30°
    root.style.setProperty('--chart-3', `hsl(${(h + 60) % 360} ${Math.max(0, Math.min(s - 15, 100))}% ${Math.max(0, Math.min(l + 10, 100))}%)`); // Análogo +60°
    root.style.setProperty('--chart-4', `hsl(${(h + 180) % 360} ${Math.max(0, Math.min(s - 20, 100))}% ${Math.max(0, Math.min(l, 100))}%)`); // Complementario
    root.style.setProperty('--chart-5', `hsl(${(h + 240) % 360} ${Math.max(0, Math.min(s - 10, 100))}% ${Math.max(0, Math.min(l + 5, 100))}%)`); // Triádico
    
    // 3. Variaciones de saturación/luminosidad para diferentes usos
    root.style.setProperty('--accent-subtle', `hsl(${h} ${Math.max(0, Math.min(s - 40, 100))}% ${Math.max(0, Math.min(l + 30, 100))}%)`);
    root.style.setProperty('--accent-muted', `hsl(${h} ${Math.max(0, Math.min(s - 50, 100))}% ${Math.max(0, Math.min(l + 35, 100))}%)`);
    root.style.setProperty('--accent-intense', `hsl(${h} ${Math.max(0, Math.min(s + 10, 100))}% ${Math.max(0, Math.min(l - 10, 100))}%)`);
    
    // 4. Backgrounds con tinte del proyecto
    const gradientToLight = `hsl(${h}, ${Math.max(0, Math.min(40, 100))}%, ${Math.max(0, Math.min(94, 100))}%)`;
    root.style.setProperty('--gradient-to-light', gradientToLight);
    
    const gradientToDark = `hsl(${h}, ${Math.max(0, Math.min(30, 100))}%, ${Math.max(0, Math.min(15, 100))}%)`;
    root.style.setProperty('--gradient-to-dark', gradientToDark);
    
    // 5. Bordes con tinte del proyecto
    root.style.setProperty('--border-accent', `hsl(${h} ${Math.max(0, Math.min(s - 30, 100))}% ${Math.max(0, Math.min(l + 25, 100))}%)`);
  }
}
