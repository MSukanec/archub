import { useEffect, useRef, useState } from 'react';
import { useGoogleMapsScript } from './useGoogleMapsScript';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';

interface GoogleMapProps {
  apiKey: string;
  center: { lat: number; lng: number };
  zoom?: number;
  markerTitle?: string;
  className?: string;
}

export function GoogleMap({
  apiKey,
  center,
  zoom = 15,
  markerTitle = "Ubicación del proyecto",
  className = "h-64 w-full rounded-lg"
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { isLoaded, loadError } = useGoogleMapsScript({ apiKey });
  const [mapError, setMapError] = useState<string | null>(null);

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

      // Add marker
      const marker = new google.maps.Marker({
        position: center,
        map,
        title: markerTitle,
        animation: google.maps.Animation.DROP
      });

      markerRef.current = marker;

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="p-2">
          <h3 class="font-semibold">${markerTitle}</h3>
          <p class="text-sm text-muted-foreground">
            Lat: ${center.lat.toFixed(6)}, Lng: ${center.lng.toFixed(6)}
          </p>
        </div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setMapError('Error al cargar el mapa');
    }
  }, [isLoaded, apiKey, markerTitle]);

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
