import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { hexToRgb, hexToHsl, formatHslForCss, calculateHoverColor, calculateForegroundColor } from '@/utils/colorUtils';

// Color por defecto (verde lima de Archub)
const DEFAULT_ACCENT = {
  hex: '#84cc16',
  hsl: '76 100% 40%',
  rgb: '132, 204, 22'
};

/**
 * Hook que actualiza dinámicamente el color de acento (--accent) 
 * basado en el color del proyecto activo.
 * 
 * Comportamiento:
 * - Cuando hay un proyecto seleccionado en nivel 'project': usa el color del proyecto
 * - Cuando está en nivel 'organization' o 'general': usa el color por defecto (verde lima)
 * - Actualiza automáticamente cuando cambia el proyecto
 */
export function useProjectAccentColor() {
  const { selectedProjectId } = useProjectContext();
  const { sidebarLevel } = useNavigationStore();
  const { isDark } = useThemeStore();

  // Use React Query to fetch project color data (will auto-update when invalidated)
  const { data: projectColor } = useQuery({
    queryKey: ['project-color', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId || !supabase) return null;

      const { data, error } = await supabase
        .from('projects')
        .select('color, use_custom_color, custom_color_h, custom_color_hex')
        .eq('id', selectedProjectId)
        .single();

      if (error) return null;
      return data;
    },
    enabled: sidebarLevel === 'project' && !!selectedProjectId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  useEffect(() => {
    const updateAccentColor = async () => {
      // Si no estamos en nivel de proyecto o no hay proyecto seleccionado, usar color por defecto
      if (sidebarLevel !== 'project' || !selectedProjectId) {
        applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb, isDark);
        return;
      }

      if (!projectColor) {
        // Si no hay datos del proyecto, usar el por defecto
        applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb, isDark);
        return;
      }

      try {
        // Determinar qué color usar basado en use_custom_color
        let projectColorHex: string | null = null;

        if (projectColor.use_custom_color) {
          // Usar color personalizado
          if (projectColor.custom_color_hex) {
            // Si hay hex guardado, usarlo
            projectColorHex = projectColor.custom_color_hex;
          } else if (projectColor.custom_color_h !== null && projectColor.custom_color_h !== undefined) {
            // Si solo hay hue, convertirlo a hex
            const { hslToHex } = await import('@/utils/colorUtils');
            projectColorHex = hslToHex(projectColor.custom_color_h);
          }
        } else {
          // Usar color de la paleta predefinida
          projectColorHex = projectColor.color;
        }

        if (!projectColorHex) {
          // Si no hay color definido, usar el por defecto
          applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb, isDark);
          return;
        }

        // Convertir el color hex del proyecto a HSL y RGB
        const rgb = hexToRgb(projectColorHex);
        const hsl = hexToHsl(projectColorHex);

        if (!rgb || !hsl) {
          // Si la conversión falla, usar el por defecto
          applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb, isDark);
          return;
        }

        // Formatear para CSS
        const hslFormatted = formatHslForCss(hsl.h, hsl.s, hsl.l);
        const rgbFormatted = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

        // Aplicar el color del proyecto
        applyAccentColor(projectColorHex, hslFormatted, rgbFormatted, isDark);

      } catch (err) {
        console.error('Error updating accent color:', err);
        // En caso de error, usar el color por defecto
        applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb, isDark);
      }
    };

    updateAccentColor();
  }, [selectedProjectId, sidebarLevel, isDark, projectColor]);
}

/**
 * Aplica el color de acento a las variables CSS del documento
 * Genera una paleta completa de colores derivados para identidad visual del proyecto
 */
function applyAccentColor(hex: string, hsl: string, rgb: string, isDark: boolean) {
  const root = document.documentElement;
  
  // Calcular variantes automáticamente usando chroma-js
  const hoverColor = calculateHoverColor(hex, isDark);
  const foregroundColor = calculateForegroundColor(hex);
  
  // Actualizar variables CSS base
  root.style.setProperty('--accent', `hsl(${hsl})`);
  root.style.setProperty('--accent-hsl', hsl);
  root.style.setProperty('--accent-rgb', rgb);
  root.style.setProperty('--accent-hover', hoverColor);
  root.style.setProperty('--accent-foreground', foregroundColor);
  
  // Parsear HSL para generar paleta completa
  const hslParts = hsl.split(' ');
  if (hslParts.length === 3) {
    const h = parseInt(hslParts[0]);
    const s = parseInt(hslParts[1]);
    const l = parseInt(hslParts[2]);
    
    // === PALETA DE IDENTIDAD VISUAL DEL PROYECTO ===
    
    // 1. Colores primarios/secundarios
    const accent2Hsl = `${(h + 74) % 360} ${Math.min(s - 60, 100)}% ${Math.min(l, 40)}%`;
    root.style.setProperty('--accent-2', `hsl(${accent2Hsl})`);
    
    // 2. Colores para Charts - Paleta armónica de 5 colores
    // Basados en el color del proyecto usando rotación de matiz
    root.style.setProperty('--chart-1', `hsl(${h} ${s}% ${l}%)`); // Color base del proyecto
    root.style.setProperty('--chart-2', `hsl(${(h + 30) % 360} ${Math.max(s - 10, 50)}% ${Math.min(l + 5, 55)}%)`); // Análogo +30°
    root.style.setProperty('--chart-3', `hsl(${(h + 60) % 360} ${Math.max(s - 15, 45)}% ${Math.min(l + 10, 60)}%)`); // Análogo +60°
    root.style.setProperty('--chart-4', `hsl(${(h + 180) % 360} ${Math.max(s - 20, 40)}% ${l}%)`); // Complementario
    root.style.setProperty('--chart-5', `hsl(${(h + 240) % 360} ${Math.max(s - 10, 50)}% ${Math.min(l + 5, 55)}%)`); // Triádico
    
    // 3. Variaciones de saturación/luminosidad para diferentes usos
    root.style.setProperty('--accent-subtle', `hsl(${h} ${Math.max(s - 40, 20)}% ${Math.min(l + 30, 85)}%)`);
    root.style.setProperty('--accent-muted', `hsl(${h} ${Math.max(s - 50, 15)}% ${Math.min(l + 35, 90)}%)`);
    root.style.setProperty('--accent-intense', `hsl(${h} ${Math.min(s + 10, 100)}% ${Math.max(l - 10, 30)}%)`);
    
    // 4. Backgrounds con tinte del proyecto
    const gradientToLight = `hsl(${h}, 40%, 94%)`;
    root.style.setProperty('--gradient-to-light', gradientToLight);
    
    const gradientToDark = `hsl(${h}, 30%, 15%)`;
    root.style.setProperty('--gradient-to-dark', gradientToDark);
    
    // 5. Bordes con tinte del proyecto
    root.style.setProperty('--border-accent', `hsl(${h} ${Math.max(s - 30, 20)}% ${Math.min(l + 25, 80)}%)`);
  }
}
