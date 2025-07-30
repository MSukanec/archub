import { useState, useEffect } from 'react';
import { Database, ImageIcon, FileText, Users, MapPin, Building2, Globe } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ProjectHeroImage from '@/components/ui-custom/ProjectHeroImage';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ProjectBasicData() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { toast } = useToast();
  
  const organizationId = userData?.preferences?.last_organization_id;
  const projectId = userData?.preferences?.last_project_id;

  // Get project data including image URL
  const { data: projectData } = useQuery({
    queryKey: ['project-data', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('project_data')
        .select('*')
        .eq('project_id', projectId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching project data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!projectId && !!supabase
  });

  // Get actual project info
  const { data: projectInfo } = useQuery({
    queryKey: ['project-info', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (error) {
        console.error('Error fetching project info:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!projectId && !!supabase
  });

  // Form states based on actual database structure
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientName, setClientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [projectImageUrl, setProjectImageUrl] = useState<string | null>(null);

  // Auto-save mutation for project data
  const saveProjectDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!projectId || !supabase) return;

      // Update project name in projects table
      if (dataToSave.name !== undefined) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: dataToSave.name })
          .eq('id', projectId);

        if (projectError) throw projectError;
      }

      // Update project data in project_data table
      const projectDataFields = {
        description: dataToSave.description,
        internal_notes: dataToSave.internal_notes,
        client_name: dataToSave.client_name,
        contact_phone: dataToSave.contact_phone,
        email: dataToSave.email,
        address: dataToSave.address,
        city: dataToSave.city,
        state: dataToSave.state,
        country: dataToSave.country,
        zip_code: dataToSave.zip_code,
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(projectDataFields).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(cleanData).length > 0) {
        const { error } = await supabase
          .from('project_data')
          .upsert({
            project_id: projectId,
            ...cleanData
          });

        if (error) throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios automáticamente",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook with proper configuration
  const { isSaving } = useDebouncedAutoSave({
    data: {
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
    },
    saveFn: async (data) => {
      await saveProjectDataMutation.mutateAsync(data);
      
      // Show success toast
      toast({
        title: "Datos guardados",
        description: "Los cambios se han guardado automáticamente",
      });
      
      // Invalidate queries to refresh data including current user for header updates
      queryClient.invalidateQueries({ queryKey: ['project-info', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] }); // Critical: header uses projects list
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    delay: 750,
    enabled: !!projectId && !!userData?.user?.id
  });

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  // Populate form when data loads
  useEffect(() => {
    if (projectInfo) {
      setProjectName(projectInfo.name || '');
    }
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
      setProjectImageUrl(projectData.project_image_url || null);
    }
  }, [projectInfo, projectData]);

  return (
    <Layout 
      headerProps={{ 
        title: "Datos Básicos"
      }}
    >
      <div className="space-y-6">
        {/* ActionBar - Desktop Only */}
        <ActionBarDesktop 
          title="Datos Básicos"
          icon={<Building2 className="h-5 w-5" />}
          showProjectSelector={false}
          showSearch={false}
          showGrouping={false}
          features={[
            {
              icon: <FileText className="w-4 h-4" />,
              title: "Información completa del proyecto",
              description: "Centraliza toda la información fundamental de tu proyecto en un solo lugar. Desde nombre y descripción hasta fechas importantes, mantén todos los datos organizados y actualizados automáticamente."
            },
            {
              icon: <Users className="w-4 h-4" />,
              title: "Datos del cliente integrados", 
              description: "Almacena la información de contacto del cliente directamente en el proyecto. Teléfonos, emails y datos de contacto siempre disponibles para todo el equipo cuando los necesiten."
            },
            {
              icon: <MapPin className="w-4 h-4" />,
              title: "Ubicación y medidas precisas",
              description: "Define la ubicación exacta de la obra y las superficies del proyecto. Esta información se usa automáticamente en cálculos de presupuestos y planificación de materiales."
            },
            {
              icon: <Globe className="w-4 h-4" />,
              title: "Configuración automática",
              description: "Guarda automáticamente los cambios mientras escribes. Sin necesidad de hacer clic en botones, toda la información se mantiene sincronizada."
            }
          ]}
        />

        {/* FeatureIntroduction - Mobile Only */}
        <FeatureIntroduction
          title="Datos Básicos"
          icon={<Building2 className="w-5 h-5" />}
          features={[
            {
              icon: <FileText className="w-5 h-5" />,
              title: "Información completa del proyecto",
              description: "Centraliza toda la información fundamental de tu proyecto en un solo lugar. Desde nombre y descripción hasta fechas importantes, mantén todos los datos organizados y actualizados automáticamente."
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: "Datos del cliente integrados",
              description: "Almacena la información de contacto del cliente directamente en el proyecto. Teléfonos, emails y datos de contacto siempre disponibles para todo el equipo cuando los necesiten."
            },
            {
              icon: <MapPin className="w-5 h-5" />,
              title: "Ubicación y medidas precisas",
              description: "Define la ubicación exacta de la obra y las superficies del proyecto. Esta información se usa automáticamente en cálculos de presupuestos y planificación de materiales."
            }
          ]}
        />

        {/* Two Column Layout - Section descriptions left, content right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Imagen Principal */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <ImageIcon className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Imagen Principal</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Imagen que representa tu proyecto en tarjetas y vistas principales. Esta imagen aparecerá en el dashboard y listados de proyectos.
              {isSaving && <span className="block text-[var(--accent)] mt-2">Guardando...</span>}
            </p>
          </div>

          {/* Right Column - Imagen Principal Content */}
          <div>
            {projectId && organizationId && (
              <ProjectHeroImage
                projectId={projectId}
                organizationId={organizationId}
                currentImageUrl={projectImageUrl}
                onImageUpdate={setProjectImageUrl}
              />
            )}
          </div>
        </div>

        <hr className="border-t border-[var(--section-divider)] my-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Información Básica */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Información Básica</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Datos fundamentales del proyecto que se usarán en todo el sistema. Estos campos son la base para presupuestos, documentos y comunicaciones.
            </p>
          </div>

          {/* Right Column - Información Básica Content */}
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nombre del Proyecto</Label>
                <Input 
                  id="project-name"
                  placeholder="Ej: Casa Unifamiliar López"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description"
                  placeholder="Descripción general del proyecto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="internal-notes">Notas Internas</Label>
                <Textarea 
                  id="internal-notes"
                  placeholder="Notas internas para el equipo..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-t border-[var(--section-divider)] my-8" />

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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">Teléfono de Contacto</Label>
                <Input 
                  id="contact-phone"
                  placeholder="Ej: +54 11 1234-5678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
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
                />
              </div>
            </div>
          </div>

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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input 
                  id="city"
                  placeholder="Ej: Buenos Aires"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Provincia/Estado</Label>
                <Input 
                  id="state"
                  placeholder="Ej: Buenos Aires"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input 
                  id="country"
                  placeholder="Ej: Argentina"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip-code">Código Postal</Label>
                <Input 
                  id="zip-code"
                  placeholder="Ej: C1043AAX"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}