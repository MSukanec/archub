import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/components/save'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Building2, Navigation, CheckCircle2, AlertCircle } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { GooglePlacesAutocomplete, GoogleMap } from '@/components/google-maps'

interface ProjectLocationTabProps {
  projectId?: string;
}

export default function ProjectLocationTab({ projectId }: ProjectLocationTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // API Key from environment variable
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Hydration state - CRITICAL for preventing auto-save on page load
  const [isHydrated, setIsHydrated] = useState(false);

  // Form states - Location
  const [addressFull, setAddressFull] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  
  // Form states - Additional Info
  const [timezone, setTimezone] = useState('');
  const [locationType, setLocationType] = useState<string>(''); // Will be empty or valid enum value
  const [accessibilityNotes, setAccessibilityNotes] = useState('');

  // Get project data for location fields
  const { data: projectData, isSuccess: projectDataSuccess } = useQuery({
    queryKey: ['project-data', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId || !supabase) return null;

      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', activeProjectId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching project data:', error);
        throw error;
      }

      return data;
    },
    enabled: !!activeProjectId && !!supabase
  });

  // Auto-save mutation for project location
  const saveProjectLocationMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!activeProjectId || !supabase) return;

      // Use upsert to avoid race conditions
      const { error } = await supabase
        .from('project_data')
        .upsert({
          project_id: activeProjectId,
          organization_id: organizationId,
          ...dataToSave
        }, {
          onConflict: 'project_id'
        });

      if (error) {
        console.error('Error saving project location:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Cambios guardados",
        description: "La ubicación del proyecto se ha guardado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error in saveProjectLocationMutation:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios de ubicación",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook - enabled ONLY after hydration is complete
  const { isSaving } = useDebouncedAutoSave({
    data: {
      address_full: addressFull,
      address: address,
      city: city,
      state: state,
      country: country,
      zip_code: zipCode,
      place_id: placeId,
      lat: lat,
      lng: lng,
      timezone: timezone,
      // Only include location_type if it's a valid enum value
      ...(locationType && ['urban', 'rural', 'industrial', 'other'].includes(locationType) 
        ? { location_type: locationType } 
        : {}),
      accessibility_notes: accessibilityNotes
    },
    saveFn: (data) => saveProjectLocationMutation.mutateAsync(data),
    delay: 3000,
    enabled: !!userData && isHydrated
  });

  // Reset hydration when project changes
  useEffect(() => {
    setIsHydrated(false);
  }, [activeProjectId]);

  // UNIFIED hydration effect - loads ALL data at once, then marks as hydrated
  useEffect(() => {
    // Only hydrate when query has completed (even if projectData is null)
    if (!projectDataSuccess) {
      return;
    }

    // Load project data (may be null for new projects)
    if (projectData) {
      setAddressFull(projectData.address_full || '');
      setAddress(projectData.address || '');
      setCity(projectData.city || '');
      setState(projectData.state || '');
      setCountry(projectData.country || '');
      setZipCode(projectData.zip_code || '');
      setPlaceId(projectData.place_id || '');
      setLat(projectData.lat ? Number(projectData.lat) : null);
      setLng(projectData.lng ? Number(projectData.lng) : null);
      setTimezone(projectData.timezone || '');
      setLocationType(projectData.location_type || '');
      setAccessibilityNotes(projectData.accessibility_notes || '');
    }

    // Mark as hydrated AFTER all state updates are queued
    setTimeout(() => {
      setIsHydrated(true);
    }, 100);
  }, [projectData, projectDataSuccess]);

  // Handle Google Places selection
  const handlePlaceSelected = (place: any) => {
    setAddressFull(place.address_full);
    setAddress(place.address_full); // Also set main address field
    setCity(place.city);
    setState(place.state);
    setCountry(place.country);
    setZipCode(place.postal_code);
    setPlaceId(place.place_id);
    setLat(place.lat);
    setLng(place.lng);
    setTimezone(place.timezone || '');
  };

  // Handle manual latitude/longitude input with reverse geocoding
  const handleLatChange = async (value: string) => {
    const parsed = parseFloat(value);
    const newLat = isNaN(parsed) ? null : parsed;
    setLat(newLat);

    // If both lat and lng are valid, do reverse geocoding
    if (newLat !== null && lng !== null && googleMapsApiKey && window.google) {
      await performReverseGeocoding(newLat, lng);
    }
  };

  const handleLngChange = async (value: string) => {
    const parsed = parseFloat(value);
    const newLng = isNaN(parsed) ? null : parsed;
    setLng(newLng);

    // If both lat and lng are valid, do reverse geocoding
    if (lat !== null && newLng !== null && googleMapsApiKey && window.google) {
      await performReverseGeocoding(lat, newLng);
    }
  };

  // Reverse geocoding helper function
  const performReverseGeocoding = async (latitude: number, longitude: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat: latitude, lng: longitude }
      });

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const newAddress = result.formatted_address;
        
        setAddressFull(newAddress);
        setAddress(newAddress);

        // Extract address components
        const components = result.address_components;
        let newCity = '';
        let newState = '';
        let newCountry = '';
        let newZipCode = '';

        components.forEach((component) => {
          const types = component.types;
          if (types.includes('locality')) {
            newCity = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            newState = component.long_name;
          } else if (types.includes('country')) {
            newCountry = component.long_name;
          } else if (types.includes('postal_code')) {
            newZipCode = component.long_name;
          }
        });

        setCity(newCity);
        setState(newState);
        setCountry(newCountry);
        setZipCode(newZipCode);
        setPlaceId(result.place_id);
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  };

  // Handle marker drag on map
  const handleMarkerDragEnd = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);

    // Use the helper function for reverse geocoding
    if (googleMapsApiKey && window.google) {
      await performReverseGeocoding(newLat, newLng);
      toast({
        title: "Ubicación actualizada",
        description: "La dirección se actualizó al mover el pin"
      });
    }
  };

  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay proyecto activo seleccionado</p>
      </div>
    )
  }

  const hasCoordinates = lat !== null && lng !== null;

  return (
    <div className="space-y-8">
      {/* Google Places Search + Map Section */}
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

        <div className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="address-full">Dirección Completa</Label>
              <Input 
                id="address-full"
                placeholder="Ej: Av. Corrientes 1234, Buenos Aires, Argentina"
                value={addressFull}
                onChange={(e) => setAddressFull(e.target.value)}
                data-testid="input-address-full"
              />
            </div>
          )}

          {/* Latitude and Longitude inputs inline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitud</Label>
              <Input 
                id="latitude"
                type="number"
                step="0.000001"
                placeholder="Ej: -34.603722"
                value={lat !== null ? lat : ''}
                onChange={(e) => handleLatChange(e.target.value)}
                data-testid="input-latitude"
              />
              <p className="text-xs text-muted-foreground">
                Norte-Sur (-90 a 90)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitud</Label>
              <Input 
                id="longitude"
                type="number"
                step="0.000001"
                placeholder="Ej: -58.381592"
                value={lng !== null ? lng : ''}
                onChange={(e) => handleLngChange(e.target.value)}
                data-testid="input-longitude"
              />
              <p className="text-xs text-muted-foreground">
                Este-Oeste (-180 a 180)
              </p>
            </div>
          </div>

          {/* Coordinates Status Indicator */}
          {hasCoordinates && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <span>Ubicación guardada: {lat?.toFixed(6)}, {lng?.toFixed(6)}</span>
            </div>
          )}
        </div>

        {/* Map - shown right below search */}
        {hasCoordinates && googleMapsApiKey && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Puedes arrastrar el pin en el mapa para ajustar la ubicación exacta.
            </p>
            <GoogleMap
              apiKey={googleMapsApiKey}
              center={{ lat: lat!, lng: lng! }}
              zoom={16}
              markerTitle={addressFull || 'Ubicación del proyecto'}
              className="h-96 w-full rounded-lg border"
              draggable={true}
              onMarkerDragEnd={handleMarkerDragEnd}
            />
          </div>
        )}
      </div>

      {/* Address Details Section */}
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
            <Label htmlFor="zip-code">Código Postal</Label>
            <Input 
              id="zip-code"
              placeholder="Ej: C1043AAX"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              data-testid="input-zip-code"
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
          <Label htmlFor="accessibility-notes">Notas de Accesibilidad</Label>
          <Textarea 
            id="accessibility-notes"
            placeholder="Ej: Acceso por calle lateral, estacionamiento disponible en la esquina, horario de entregas de 8 a 18hs"
            value={accessibilityNotes}
            onChange={(e) => setAccessibilityNotes(e.target.value)}
            rows={3}
            data-testid="textarea-accessibility-notes"
          />
          <p className="text-xs text-muted-foreground">
            Información sobre acceso al sitio, estacionamiento, restricciones de horario, etc.
          </p>
        </div>
      </div>
    </div>
  )
}
