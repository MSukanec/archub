import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/components/save'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Users } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'

interface ProjectClientTabProps {
  projectId?: string;
}

export default function ProjectClientTab({ projectId }: ProjectClientTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Form states - Client
  const [clientName, setClientName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [email, setEmail] = useState('')

  // Get project data for client fields
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

  // Auto-save mutation for project client data
  const saveProjectClientMutation = useMutation({
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
        console.error('Error saving project client data:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Cambios guardados",
        description: "Los datos del cliente se han guardado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error in saveProjectClientMutation:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios del cliente",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook - enabled only when userData is loaded AND project data has been fetched
  const { isSaving } = useDebouncedAutoSave({
    data: {
      client_name: clientName,
      contact_phone: contactPhone,
      email: email
    },
    saveFn: (data) => saveProjectClientMutation.mutateAsync(data),
    delay: 3000,
    enabled: !!userData && projectDataSuccess
  });

  // Load data when project data is fetched
  useEffect(() => {
    if (projectData) {
      setClientName(projectData.client_name || '');
      setContactPhone(projectData.contact_phone || '');
      setEmail(projectData.email || '');
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
        {/* Left Column - Información del Cliente */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información del Cliente</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos de contacto del cliente responsable del proyecto. Esta información estará disponible para todo el equipo cuando necesiten comunicarse.
          </p>
        </div>

        {/* Right Column - Información del Cliente Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nombre del Cliente</Label>
              <Input 
                id="client-name"
                placeholder="Ej: Familia López"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                data-testid="input-client-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Teléfono de Contacto</Label>
              <Input 
                id="contact-phone"
                placeholder="Ej: +54 11 1234-5678"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                data-testid="input-contact-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email de Contacto</Label>
              <Input 
                id="email"
                type="email"
                placeholder="Ej: contacto@cliente.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
