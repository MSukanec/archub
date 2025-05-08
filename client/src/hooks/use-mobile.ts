import { useState, useEffect } from "react";

/**
 * Hook personalizado para detectar si el dispositivo es móvil
 * basado en el ancho de la pantalla
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Agregar evento de escucha para detectar cambios de tamaño
    window.addEventListener('resize', handleResize);
    
    // Comprobar al inicio
    handleResize();

    // Limpiar
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
}