import { useEffect, useRef, useState } from 'react';
import { useGoogleMapsScript } from './useGoogleMapsScript';
import { Loader2, AlertCircle } from 'lucide-react';

interface GoogleMapProps {
  apiKey: string;
  center: { lat: number; lng: number };
  zoom?: number;
  markerTitle?: string;
  className?: string;
  draggable?: boolean;
  onMarkerDragEnd?: (lat: number, lng: number) => void;
}

export function GoogleMap({
  apiKey,
  center,
  zoom = 15,
  markerTitle = "Ubicación del proyecto",
  className = "h-64 w-full rounded-lg",
  draggable = false,
  onMarkerDragEnd
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { isLoaded, loadError } = useGoogleMapsScript({ apiKey });
  const [mapError, setMapError] = useState<string | null>(null);

  // Get --accent color from CSS variable
  const getAccentColor = () => {
    if (typeof window === 'undefined') return '#84cc16';
    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent')
      .trim();
    return accentColor || '#84cc16';
  };

  // Create custom marker icon with --accent color
  const createCustomMarkerIcon = () => {
    const accentColor = getAccentColor();
    
    // SVG pin icon with custom color
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 24 36">
        <path fill="${accentColor}" stroke="#000000" stroke-width="1" 
          d="M12 0C7.589 0 4 3.589 4 8c0 7.5 8 20 8 20s8-12.5 8-20c0-4.411-3.589-8-8-8z"/>
        <circle cx="12" cy="8" r="3" fill="#ffffff"/>
      </svg>
    `;
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 48),
      anchor: new google.maps.Point(16, 48)
    };
  };

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Add marker with custom icon
      const marker = new google.maps.Marker({
        position: center,
        map,
        title: markerTitle,
        animation: google.maps.Animation.DROP,
        draggable: draggable,
        icon: createCustomMarkerIcon()
      });

      markerRef.current = marker;

      // Add drag end listener if callback provided
      if (draggable && onMarkerDragEnd) {
        marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            onMarkerDragEnd(lat, lng);
          }
        });
      }

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="p-2">
          <h3 class="font-semibold">${markerTitle}</h3>
          <p class="text-sm text-muted-foreground">
            Lat: ${center.lat.toFixed(6)}, Lng: ${center.lng.toFixed(6)}
          </p>
          ${draggable ? '<p class="text-xs text-muted-foreground mt-1">Arrastra el pin para mover la ubicación</p>' : ''}
        </div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setMapError('Error al cargar el mapa');
    }
  }, [isLoaded, apiKey, markerTitle, draggable]);

  // Update map center and marker when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    mapInstanceRef.current.setCenter(center);
    markerRef.current.setPosition(center);
  }, [center]);

  if (loadError || mapError) {
    return (
      <div className={`${className} border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/30`}>
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {loadError ? 'Error cargando Google Maps' : mapError}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/30`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)] mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="h-full w-full rounded-lg" />
    </div>
  );
}
