import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGoogleMapsScript } from './useGoogleMapsScript';

interface PlaceDetails {
  address_full: string;
  place_id: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  timezone?: string;
}

interface GooglePlacesAutocompleteProps {
  apiKey: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: PlaceDetails) => void;
  placeholder?: string;
  label?: string;
}

export function GooglePlacesAutocomplete({
  apiKey,
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Buscar dirección...",
  label
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, loadError } = useGoogleMapsScript({ apiKey, libraries: ['places'] });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      // Initialize Google Places Autocomplete
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: [
          'formatted_address',
          'address_components',
          'geometry',
          'place_id',
          'name'
        ],
        types: ['address']
      });

      autocompleteRef.current = autocomplete;

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          setStatus('error');
          return;
        }

        setStatus('loading');

        // Extract address components
        const components = place.address_components || [];
        const getComponent = (type: string) => {
          const comp = components.find(c => c.types.includes(type));
          return comp?.long_name || '';
        };

        const placeDetails: PlaceDetails = {
          address_full: place.formatted_address || '',
          place_id: place.place_id || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          city: getComponent('locality') || getComponent('administrative_area_level_2'),
          state: getComponent('administrative_area_level_1'),
          country: getComponent('country'),
          postal_code: getComponent('postal_code')
        };

        // Optional: Get timezone using Geocoding API
        if (place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          // Note: Timezone API requires separate API call - can be added if needed
          // For now, we'll leave it empty and can add it later
          placeDetails.timezone = '';
        }

        onChange(placeDetails.address_full);
        onPlaceSelected(placeDetails);
        setStatus('idle');
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setStatus('error');
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange, onPlaceSelected]);

  if (loadError) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Error cargando Google Maps. Verifica tu API key.
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled
        />
      </div>
    );
  }

  const StatusIcon = () => {
    if (!isLoaded) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (status === 'loading') return <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />;
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <MapPin className="h-4 w-4 text-[var(--accent)]" />;
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={!isLoaded ? "Cargando Google Maps..." : placeholder}
          disabled={!isLoaded}
          className="pr-10"
          data-testid="input-google-places-autocomplete"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <StatusIcon />
        </div>
      </div>
      {!isLoaded && !loadError && (
        <p className="text-xs text-muted-foreground">
          Cargando servicio de búsqueda de direcciones...
        </p>
      )}
    </div>
  );
}
