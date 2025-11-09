import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/components/save'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'

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

  // Form states - Location
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [zipCode, setZipCode] = useState('')

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

  // Auto-save hook - enabled only when userData is loaded AND project data has been fetched
  const { isSaving } = useDebouncedAutoSave({
    data: {
      address: address,
      city: city,
      state: state,
      country: country,
      zip_code: zipCode
    },
    saveFn: (data) => saveProjectLocationMutation.mutateAsync(data),
    delay: 3000,
    enabled: !!userData && projectDataSuccess
  });

  // Load data when project data is fetched
  useEffect(() => {
    if (projectData) {
      setAddress(projectData.address || '');
      setCity(projectData.city || '');
      setState(projectData.state || '');
      setCountry(projectData.country || '');
      setZipCode(projectData.zip_code || '');
    }
  }, [projectData]);

  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay proyecto activo seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Two Column Layout - Section descriptions left, content right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Ubicación */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Ubicación del Proyecto</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Dirección completa donde se ejecutará la obra. Esta información se usa para logística, entregas y documentación oficial.
          </p>
        </div>

        {/* Right Column - Ubicación Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input 
                id="address"
                placeholder="Ej: Av. Corrientes 1234"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                data-testid="input-address"
              />
            </div>

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
        </div>
      </div>
    </div>
  )
}
