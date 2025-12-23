import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSaveEngine } from '@/core/save-engine'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Building2, Navigation, CheckCircle2, AlertCircle } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { GooglePlacesAutocomplete, GoogleMap } from '@/components/shared/integrations/google-maps'

export function OrganizationLocationView() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  
  const organizationId = userData?.organization?.id

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [isHydrated, setIsHydrated] = useState(false);

  const [addressFull, setAddressFull] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  
  const [timezone, setTimezone] = useState('');
  const [locationType, setLocationType] = useState<string>('');
  const [accessibilityNotes, setAccessibilityNotes] = useState('');

  const { data: organizationData, isSuccess: organizationDataSuccess } = useQuery({
    queryKey: ['organization-data', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return null;

      const { data, error } = await supabase
        .from('organization_data')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching organization data:', error);
        throw error;
      }

      return data;
    },
    enabled: !!organizationId && !!supabase
  });

  const { isSaving, hasUnsavedChanges } = useSaveEngine({
    data: {
      address: address,
      city: city,
      state: state,
      country: country,
      postal_code: postalCode,
      address_full: addressFull,
      place_id: placeId,
      lat: lat?.toString() || null,
      lng: lng?.toString() || null,
      timezone: timezone,
      location_type: locationType || null,
      accessibility_notes: accessibilityNotes,
    },
    queryKey: ['organization-data', organizationId],
    saveFn: async (dataToSave) => {
      if (!organizationId || !supabase) return;

      const { data: existingData } = await supabase
        .from('organization_data')
        .select('id')
        .eq('organization_id', organizationId)
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('organization_data')
          .update(dataToSave)
          .eq('organization_id', organizationId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_data')
          .insert({
            organization_id: organizationId,
            ...dataToSave
          });

        if (error) throw error;
      }
    },
    delay: 2000,
    enabled: !!organizationId && !!supabase && isHydrated,
    additionalQueryKeys: [['current-user']],
    showSuccessToast: true,
    successMessage: "Ubicación guardada",
    errorMessage: "No se pudo guardar la ubicación",
  });

  useEffect(() => {
    setIsHydrated(false);
  }, [organizationId]);

  useEffect(() => {
    if (!organizationDataSuccess) {
      return;
    }

    if (organizationData) {
      setAddress(organizationData.address || '');
      setAddressFull(organizationData.address_full || organizationData.address || '');
      setCity(organizationData.city || '');
      setState(organizationData.state || '');
      setCountry(organizationData.country || '');
      setPostalCode(organizationData.postal_code || '');
      setPlaceId(organizationData.place_id || '');
      setLat(organizationData.lat ? parseFloat(organizationData.lat) : null);
      setLng(organizationData.lng ? parseFloat(organizationData.lng) : null);
      setTimezone(organizationData.timezone || '');
      setLocationType(organizationData.location_type || '');
      setAccessibilityNotes(organizationData.accessibility_notes || '');
    }

    setTimeout(() => {
      setIsHydrated(true);
    }, 100);
  }, [organizationData, organizationDataSuccess]);

  const handlePlaceSelected = (place: any) => {
    setAddressFull(place.address_full);
    setAddress(place.address_full);
    setCity(place.city);
    setState(place.state);
    setCountry(place.country);
    setPostalCode(place.postal_code);
    setPlaceId(place.place_id);
    setLat(place.lat);
    setLng(place.lng);
    setTimezone(place.timezone || '');
  };

  const handleLatChange = async (value: string) => {
    const parsed = parseFloat(value);
    const newLat = isNaN(parsed) ? null : parsed;
    setLat(newLat);

    if (newLat !== null && lng !== null && googleMapsApiKey && (window as any).google) {
      await performReverseGeocoding(newLat, lng);
    }
  };

  const handleLngChange = async (value: string) => {
    const parsed = parseFloat(value);
    const newLng = isNaN(parsed) ? null : parsed;
    setLng(newLng);

    if (lat !== null && newLng !== null && googleMapsApiKey && (window as any).google) {
      await performReverseGeocoding(lat, newLng);
    }
  };

  const performReverseGeocoding = async (latitude: number, longitude: number) => {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat: latitude, lng: longitude }
      });

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const newAddress = result.formatted_address;
        
        setAddressFull(newAddress);
        setAddress(newAddress);

        const components = result.address_components;
        let newCity = '';
        let newState = '';
        let newCountry = '';
        let newPostalCode = '';

        components.forEach((component: any) => {
          const types = component.types;
          if (types.includes('locality')) {
            newCity = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            newState = component.long_name;
          } else if (types.includes('country')) {
            newCountry = component.long_name;
          } else if (types.includes('postal_code')) {
            newPostalCode = component.long_name;
          }
        });

        setCity(newCity);
        setState(newState);
        setCountry(newCountry);
        setPostalCode(newPostalCode);
        setPlaceId(result.place_id);
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  };

  const handleMarkerDragEnd = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);

    if (googleMapsApiKey && (window as any).google) {
      await performReverseGeocoding(newLat, newLng);
      toast({
        title: "Ubicación actualizada",
        description: "La dirección se actualizó al mover el pin"
      });
    }
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay organización activa</p>
      </div>
    )
  }

  const hasCoordinates = lat !== null && lng !== null;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold">Búsqueda de Dirección</h2>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Busca una dirección o ingresa las coordenadas manualmente. Todos los campos se sincronizan automáticamente. 
          También puedes arrastrar el pin en el mapa para ajustar la ubicación.
        </p>

        {!googleMapsApiKey && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">API Key de Google Maps no configurada</p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Agrega <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> en tus variables de entorno para habilitar la búsqueda automática.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {googleMapsApiKey ? (
              <GooglePlacesAutocomplete
                apiKey={googleMapsApiKey}
                value={addressFull}
                onChange={setAddressFull}
                onPlaceSelected={handlePlaceSelected}
                label="Buscar dirección en Google Maps"
                placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
              />
            ) : (
              <>
                <Label htmlFor="address-full">Dirección Completa</Label>
                <Input 
                  id="address-full"
                  placeholder="Ej: Av. Corrientes 1234, Buenos Aires, Argentina"
                  value={addressFull}
                  onChange={(e) => setAddressFull(e.target.value)}
                  data-testid="input-address-full"
                />
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="latitude">Latitud (-90 a 90)</Label>
            <Input 
              id="latitude"
              type="number"
              step="0.000001"
              placeholder="Ej: -34.603722"
              value={lat !== null ? lat : ''}
              onChange={(e) => handleLatChange(e.target.value)}
              data-testid="input-latitude"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitud (-180 a 180)</Label>
            <Input 
              id="longitude"
              type="number"
              step="0.000001"
              placeholder="Ej: -58.381592"
              value={lng !== null ? lng : ''}
              onChange={(e) => handleLngChange(e.target.value)}
              data-testid="input-longitude"
            />
          </div>
        </div>

        {hasCoordinates && googleMapsApiKey && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Puedes arrastrar el pin en el mapa para ajustar la ubicación exacta.
            </p>
            <GoogleMap
              apiKey={googleMapsApiKey}
              center={{ lat: lat!, lng: lng! }}
              zoom={16}
              markerTitle={addressFull || 'Ubicación de la organización'}
              className="h-96 w-full rounded-lg border"
              draggable={true}
              onMarkerDragEnd={handleMarkerDragEnd}
            />
            
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 mt-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Ubicación guardada: {lat?.toFixed(6)}, {lng?.toFixed(6)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold">Detalles de Ubicación</h2>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Información específica de la ubicación. 
          Estos campos se completan automáticamente al buscar una dirección, 
          pero puedes editarlos manualmente si es necesario.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input 
              id="city"
              placeholder="Ej: Buenos Aires"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              data-testid="input-city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal-code">Código Postal</Label>
            <Input 
              id="postal-code"
              placeholder="Ej: C1043AAX"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              data-testid="input-postal-code"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">Provincia/Estado</Label>
            <Input 
              id="state"
              placeholder="Ej: Buenos Aires"
              value={state}
              onChange={(e) => setState(e.target.value)}
              data-testid="input-state"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input 
              id="country"
              placeholder="Ej: Argentina"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              data-testid="input-country"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location-type">Tipo de Ubicación</Label>
          <Select value={locationType} onValueChange={setLocationType}>
            <SelectTrigger id="location-type" data-testid="select-location-type">
              <SelectValue placeholder="Seleccionar tipo de ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urban">Urbana</SelectItem>
              <SelectItem value="rural">Rural</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="other">Otra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="accessibility-notes">Notas de Accesibilidad</Label>
            <p className="text-xs text-muted-foreground">
              Información sobre acceso al sitio, estacionamiento, restricciones de horario, etc.
            </p>
          </div>
          <Textarea 
            id="accessibility-notes"
            placeholder="Ej: Acceso por calle lateral, estacionamiento disponible en la esquina, horario de entregas de 8 a 18hs"
            value={accessibilityNotes}
            onChange={(e) => setAccessibilityNotes(e.target.value)}
            rows={3}
            data-testid="textarea-accessibility-notes"
          />
        </div>
      </div>
    </div>
  )
}
