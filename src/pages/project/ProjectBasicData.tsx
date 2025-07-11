import { useState, useEffect } from 'react';
import { Database, ImageIcon, FileText, Users, MapPin, Calendar, Ruler } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ProjectHeroImage from '@/components/project/ProjectHeroImage';

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
  const [startDate, setStartDate] = useState('');
  const [estimatedEnd, setEstimatedEnd] = useState('');
  const [surfaceTotal, setSurfaceTotal] = useState('');
  const [surfaceCovered, setSurfaceCovered] = useState('');
  const [surfaceSemi, setSurfaceSemi] = useState('');
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
        start_date: dataToSave.start_date,
        estimated_end: dataToSave.estimated_end,
        surface_total: dataToSave.surface_total ? parseFloat(dataToSave.surface_total) : null,
        surface_covered: dataToSave.surface_covered ? parseFloat(dataToSave.surface_covered) : null,
        surface_semi: dataToSave.surface_semi ? parseFloat(dataToSave.surface_semi) : null,
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
      start_date: startDate || null,
      estimated_end: estimatedEnd || null,
      surface_total: surfaceTotal,
      surface_covered: surfaceCovered,
      surface_semi: surfaceSemi,
    },
    saveFn: async (data) => {
      await saveProjectDataMutation.mutateAsync(data);
      
      // Show success toast
      toast({
        title: "Datos guardados",
        description: "Los cambios se han guardado automáticamente",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['project-info', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
    },
    delay: 750,
    enabled: !!projectId && !!userData?.user?.id
  });

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('data');
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
      setStartDate(projectData.start_date || '');
      setEstimatedEnd(projectData.estimated_end || '');
      setSurfaceTotal(projectData.surface_total?.toString() || '');
      setSurfaceCovered(projectData.surface_covered?.toString() || '');
      setSurfaceSemi(projectData.surface_semi?.toString() || '');
      setProjectImageUrl(projectData.project_image_url || null);
    }
  }, [projectInfo, projectData]);

  return (
    <Layout 
      headerProps={{ 
        title: "Datos Básicos",
        breadcrumb: [
          { label: "Organización", href: "/organization/dashboard" },
          { label: "Proyecto", href: "/project/dashboard" },
          { label: "Datos", href: "/project/basic-data" },
          { label: "Datos Básicos" }
        ]
      }}
    >
      <div className="space-y-6">
        {/* FeatureIntroduction */}
        <FeatureIntroduction
          title="Datos Básicos"
          icon={<Database className="w-5 h-5" />}
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
            },
            {
              icon: <Calendar className="w-5 h-5" />,
              title: "Cronograma y fechas clave",
              description: "Establece fechas de inicio y finalización que se integran con el sistema de planificación. El cronograma se sincroniza automáticamente con tareas y seguimiento de avance del proyecto."
            }
          ]}
        />

        {/* Two Column Layout - Section descriptions left, content right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Imagen Principal */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Imagen Principal</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Imagen que representa tu proyecto en tarjetas y vistas principales. Esta imagen aparecerá en el dashboard y listados de proyectos.
              {isSaving && <span className="block text-[var(--accent)] mt-2">Guardando...</span>}
            </p>
          </div>

          {/* Right Column - Imagen Principal Content */}
          <div className="lg:col-span-8">
            {projectId && organizationId && (
              <ProjectHeroImage
                projectId={projectId}
                organizationId={organizationId}
                currentImageUrl={projectImageUrl}
                onImageUpdate={setProjectImageUrl}
              />
            )}
          </div>

          {/* Left Column - Información Básica */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Información Básica</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Datos fundamentales del proyecto que se usarán en todo el sistema. Estos campos son la base para presupuestos, documentos y comunicaciones.
            </p>
          </div>

          {/* Right Column - Información Básica Content */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="project-name">Nombre del Proyecto</Label>
                <Input 
                  id="project-name"
                  placeholder="Ej: Casa Unifamiliar López"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description"
                  placeholder="Descripción general del proyecto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
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

          {/* Left Column - Información del Cliente */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Información del Cliente</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Datos de contacto del cliente responsable del proyecto. Esta información estará disponible para todo el equipo cuando necesiten comunicarse.
            </p>
          </div>

          {/* Right Column - Información del Cliente Content */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2 md:col-span-2">
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
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Ubicación del Proyecto</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Dirección completa donde se ejecutará la obra. Esta información se usa para logística, entregas y documentación oficial.
            </p>
          </div>

          {/* Right Column - Ubicación Content */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
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

          {/* Left Column - Cronograma */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Cronograma del Proyecto</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Fechas de inicio y finalización que se integran con la planificación de tareas y seguimiento de avance del proyecto.
            </p>
          </div>

          {/* Right Column - Cronograma Content */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Fecha de Inicio</Label>
                <Input 
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated-end">Fecha Estimada de Finalización</Label>
                <Input 
                  id="estimated-end"
                  type="date"
                  value={estimatedEnd}
                  onChange={(e) => setEstimatedEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Left Column - Superficies */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Superficies del Proyecto</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Medidas y superficies que se usan automáticamente en cálculos de presupuestos, cantidad de materiales y planificación de espacios.
            </p>
          </div>

          {/* Right Column - Superficies Content */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surface-total">Superficie Total (m²)</Label>
                <Input 
                  id="surface-total"
                  type="number"
                  placeholder="Ej: 150"
                  value={surfaceTotal}
                  onChange={(e) => setSurfaceTotal(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surface-covered">Superficie Cubierta (m²)</Label>
                <Input 
                  id="surface-covered"
                  type="number"
                  placeholder="Ej: 120"
                  value={surfaceCovered}
                  onChange={(e) => setSurfaceCovered(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surface-semi">Superficie Semicubierta (m²)</Label>
                <Input 
                  id="surface-semi"
                  type="number"
                  placeholder="Ej: 30"
                  value={surfaceSemi}
                  onChange={(e) => setSurfaceSemi(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}