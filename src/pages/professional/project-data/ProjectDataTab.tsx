import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageIcon, FileText, Users, MapPin } from 'lucide-react'
import ImageUploadAndShowField from '@/components/ui-custom/fields/ImageUploadAndShowField'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function ProjectDataTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()
  const { selectedProjectId } = useProjectContext()
  const organizationId = userData?.organization?.id
  const activeProjectId = selectedProjectId

  // Show message if no project is selected
  if (!selectedProjectId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No hay proyecto activo seleccionado
          </h3>
          <p className="text-sm text-muted-foreground">
            Selecciona un proyecto desde la barra lateral para ver los datos básicos.
          </p>
        </div>
      </div>
    )
  }

  // Form states
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [clientName, setClientName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [projectImageUrl, setProjectImageUrl] = useState<string | null>(null)

  // Get project data for BasicData tab
  const { data: projectData } = useQuery({
    queryKey: ['project-data', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', activeProjectId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching project data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!activeProjectId && !!supabase
  });

  // Get actual project info for BasicData tab
  const { data: projectInfo } = useQuery({
    queryKey: ['project-info', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', activeProjectId)
        .single();
        
      if (error) {
        console.error('Error fetching project info:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!activeProjectId && !!supabase
  });

  // Auto-save mutation for project data
  const saveProjectDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!activeProjectId || !supabase) return;

      // Update project name in projects table
      if (dataToSave.name !== undefined) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: dataToSave.name })
          .eq('id', activeProjectId);

        if (projectError) {
          console.error('Error updating project name:', projectError);
          throw projectError;
        }
      }

      // Prepare project_data payload
      const projectDataPayload = { ...dataToSave };
      delete projectDataPayload.name; // Remove name as it goes to projects table

      if (Object.keys(projectDataPayload).length === 0) return;

      // Use upsert to avoid race conditions
      const { error } = await supabase
        .from('project_data')
        .upsert({
          project_id: activeProjectId,
          ...projectDataPayload
        }, {
          onConflict: 'project_id'
        });

      if (error) {
        console.error('Error saving project data:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['project-info', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Datos guardados",
        description: "Los datos del proyecto se han actualizado correctamente."
      });
    },
    onError: (error) => {
      console.error('Error saving project data:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos del proyecto.",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook
  const dataToSave = {
    name: projectName,
    description,
    internal_notes: internalNotes,
    client_name: clientName,
    contact_phone: contactPhone,
    email,
    address,
    city,
    state,
    country,
    zip_code: zipCode,
    image_url: projectImageUrl
  };

  const { isSaving } = useDebouncedAutoSave({
    data: dataToSave,
    saveFn: saveProjectDataMutation.mutateAsync,
    delay: 1000,
    enabled: !!activeProjectId
  });

  // Populate form with existing data
  useEffect(() => {
    if (projectInfo) {
      setProjectName(projectInfo.name || '');
    }
  }, [projectInfo]);

  useEffect(() => {
    if (projectData) {
      setDescription(projectData.description || '');
      setInternalNotes(projectData.internal_notes || '');
      setClientName(projectData.client_name || '');
      setContactPhone(projectData.contact_phone || '');
      setEmail(projectData.email || '');
      setAddress(projectData.address || '');
      setCity(projectData.city || '');
      setState(projectData.state || '');
      setCountry(projectData.country || '');
      setZipCode(projectData.zip_code || '');
      setProjectImageUrl(projectData.image_url || null);
    }
  }, [projectData]);

  return (
    <div className="space-y-8">
      {/* Project Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <FileText className="h-4 w-4" />
          <h3 className="text-sm font-medium">Información del Proyecto</h3>
          {isSaving && (
            <span className="text-xs text-muted-foreground ml-auto">Guardando...</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-xs font-medium">
              Nombre del Proyecto *
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ingresa el nombre del proyecto"
              data-testid="input-project-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-image" className="text-xs font-medium">
              Imagen del Proyecto
            </Label>
            {activeProjectId && organizationId ? (
              <ImageUploadAndShowField
                projectId={activeProjectId}
                organizationId={organizationId}
                currentImageUrl={projectImageUrl}
                onImageUpdate={setProjectImageUrl}
              />
            ) : (
              <div className="flex items-center justify-center h-20 border border-dashed border-border rounded-lg bg-muted/20">
                <span className="text-xs text-muted-foreground">Selecciona un proyecto para subir imágenes</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs font-medium">
            Descripción
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción detallada del proyecto"
            rows={3}
            data-testid="textarea-project-description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internal-notes" className="text-xs font-medium">
            Notas Internas
          </Label>
          <Textarea
            id="internal-notes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Notas para uso interno del equipo"
            rows={3}
            data-testid="textarea-internal-notes"
          />
        </div>
      </div>

      {/* Client Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Users className="h-4 w-4" />
          <h3 className="text-sm font-medium">Información del Cliente</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client-name" className="text-xs font-medium">
              Nombre del Cliente
            </Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre de la empresa o cliente"
              data-testid="input-client-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone" className="text-xs font-medium">
              Teléfono de Contacto
            </Label>
            <Input
              id="contact-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Número de teléfono"
              data-testid="input-contact-phone"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-medium">
            Email de Contacto
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            data-testid="input-email"
          />
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <MapPin className="h-4 w-4" />
          <h3 className="text-sm font-medium">Ubicación del Proyecto</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-xs font-medium">
            Dirección
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Dirección completa del proyecto"
            data-testid="input-address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs font-medium">
              Ciudad
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ciudad"
              data-testid="input-city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-xs font-medium">
              Provincia/Estado
            </Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Provincia o Estado"
              data-testid="input-state"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-xs font-medium">
              País
            </Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="País"
              data-testid="input-country"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip-code" className="text-xs font-medium">
            Código Postal
          </Label>
          <Input
            id="zip-code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Código postal"
            className="w-full md:w-48"
            data-testid="input-zip-code"
          />
        </div>
      </div>
    </div>
  )
}