import { useState, useEffect } from 'react';
import { Database, ImageIcon } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HelpPopover } from '@/components/ui-custom/HelpPopover';
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

      // Prepare project_data payload
      const projectDataPayload = { ...dataToSave };
      delete projectDataPayload.name; // Remove name as it goes to projects table

      // Convert empty strings to null for numeric fields
      ['surface_total', 'surface_covered', 'surface_semi'].forEach(field => {
        if (projectDataPayload[field] === '') {
          projectDataPayload[field] = null;
        } else if (projectDataPayload[field] !== undefined) {
          projectDataPayload[field] = parseFloat(projectDataPayload[field]) || null;
        }
      });

      // Update or insert project_data
      const { error: dataError } = await supabase
        .from('project_data')
        .upsert({
          project_id: projectId,
          ...projectDataPayload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' });
      
      if (dataError) throw dataError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-info', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
    }
  });

  // Auto-save hook
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
    saveFn: saveProjectDataMutation.mutateAsync
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Image Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Imagen Principal</h2>
            <HelpPopover content="Sube una imagen representativa de tu proyecto que se mostrará como imagen principal." />
          </div>
          
          {projectId && organizationId && (
            <ProjectHeroImage
              projectId={projectId}
              organizationId={organizationId}
              currentImageUrl={projectImageUrl}
              onImageUpdate={setProjectImageUrl}
            />
          )}
        </div>

        {/* Project Configuration Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Información Básica del Proyecto</h2>
            <HelpPopover content="Configura todos los datos básicos de tu proyecto. Los cambios se guardan automáticamente." />
            {isSaving && <span className="text-xs text-muted-foreground">Guardando...</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="client-name">Cliente</Label>
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

            <div className="space-y-2">
              <Label htmlFor="surface-total">Superficie Total (m²)</Label>
              <Input 
                id="surface-total"
                type="number"
                placeholder="Ej: 250"
                value={surfaceTotal}
                onChange={(e) => setSurfaceTotal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface-covered">Superficie Cubierta (m²)</Label>
              <Input 
                id="surface-covered"
                type="number"
                placeholder="Ej: 200"
                value={surfaceCovered}
                onChange={(e) => setSurfaceCovered(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface-semi">Superficie Semicubierta (m²)</Label>
              <Input 
                id="surface-semi"
                type="number"
                placeholder="Ej: 50"
                value={surfaceSemi}
                onChange={(e) => setSurfaceSemi(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Descripción del Proyecto</Label>
              <Textarea 
                id="description"
                placeholder="Describe brevemente el proyecto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="internal-notes">Notas Internas</Label>
              <Textarea 
                id="internal-notes"
                placeholder="Notas internas para el equipo de trabajo..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}