import { useEffect } from 'react';
import { useProjectContext } from '@/stores/projectContext';
import { useNavigationStore } from '@/stores/navigationStore';
import { supabase } from '@/lib/supabase';
import { hexToRgb, hexToHsl, formatHslForCss } from '@/utils/colorUtils';

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

  useEffect(() => {
    const updateAccentColor = async () => {
      // Si no estamos en nivel de proyecto o no hay proyecto seleccionado, usar color por defecto
      if (sidebarLevel !== 'project' || !selectedProjectId) {
        applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb);
        return;
      }

      try {
        // Obtener el color del proyecto desde Supabase
        const { data: project, error } = await supabase
          .from('projects')
          .select('color')
          .eq('id', selectedProjectId)
          .single();

        if (error || !project?.color) {
          // Si hay error o no hay color, usar el por defecto
          applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb);
          return;
        }

        // Convertir el color hex del proyecto a HSL y RGB
        const rgb = hexToRgb(project.color);
        const hsl = hexToHsl(project.color);

        if (!rgb || !hsl) {
          // Si la conversión falla, usar el por defecto
          applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb);
          return;
        }

        // Formatear para CSS
        const hslFormatted = formatHslForCss(hsl.h, hsl.s, hsl.l);
        const rgbFormatted = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

        // Aplicar el color del proyecto
        applyAccentColor(project.color, hslFormatted, rgbFormatted);

      } catch (err) {
        console.error('Error updating accent color:', err);
        // En caso de error, usar el color por defecto
        applyAccentColor(DEFAULT_ACCENT.hex, DEFAULT_ACCENT.hsl, DEFAULT_ACCENT.rgb);
      }
    };

    updateAccentColor();
  }, [selectedProjectId, sidebarLevel]);
}

/**
 * Aplica el color de acento a las variables CSS del documento
 */
function applyAccentColor(hex: string, hsl: string, rgb: string) {
  const root = document.documentElement;
  
  // Actualizar todas las variables CSS relacionadas con accent
  root.style.setProperty('--accent', `hsl(${hsl})`);
  root.style.setProperty('--accent-hsl', hsl);
  root.style.setProperty('--accent-rgb', rgb);
  
  // También actualizar accent-2 (versión alternativa) con una variación
  const hslParts = hsl.split(' ');
  if (hslParts.length === 3) {
    const h = parseInt(hslParts[0]);
    const s = parseInt(hslParts[1]);
    const l = parseInt(hslParts[2]);
    
    // Crear una variación más oscura/saturada para accent-2
    const accent2Hsl = `${(h + 74) % 360} ${Math.min(s - 60, 100)}% ${Math.min(l, 40)}%`;
    root.style.setProperty('--accent-2', `hsl(${accent2Hsl})`);
  }
}
