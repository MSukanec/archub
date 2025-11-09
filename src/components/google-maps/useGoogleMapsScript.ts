import { useEffect, useState } from 'react';

interface UseGoogleMapsScriptOptions {
  apiKey: string;
  libraries?: string[];
}

export function useGoogleMapsScript({ apiKey, libraries = [] }: UseGoogleMapsScriptOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setLoadError(new Error('Google Maps API key is required'));
      return;
    }

    // Check if script already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is currently loading
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', (e) => setLoadError(e as any));
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    const libraryParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libraryParam}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Global callback for Google Maps API
    (window as any).initGoogleMaps = function() {
      setIsLoaded(true);
      delete (window as any).initGoogleMaps;
    };

    script.addEventListener('error', (e) => {
      setLoadError(new Error('Failed to load Google Maps script'));
    });

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts before script loads
      if (!isLoaded && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey, libraries]);

  return { isLoaded, loadError };
}
