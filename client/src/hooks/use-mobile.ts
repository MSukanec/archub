import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el dispositivo es móvil basado en el ancho de la ventana
 * @param breakpoint - El ancho en píxeles por debajo del cual se considera móvil (por defecto 768px)
 * @returns Boolean indicando si es un dispositivo móvil
 */
export function useMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Función para comprobar si el ancho de la ventana es menor que el breakpoint
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Comprobar al inicio
    checkMobile();

    // Agregar listener para el evento de resize
    window.addEventListener('resize', checkMobile);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook para detectar orientación de dispositivos móviles
 * @returns Objeto con propiedades isPortrait y isLandscape
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState({
    isPortrait: true,
    isLandscape: false
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      setOrientation({
        isPortrait,
        isLandscape: !isPortrait
      });
    };

    // Verificar orientación inicial
    handleOrientationChange();

    // Escuchar cambios de orientación
    window.addEventListener('resize', handleOrientationChange);
    
    // Limpiar
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
}