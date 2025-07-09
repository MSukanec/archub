import { useState, useEffect } from 'react';
import { Database, ImageIcon } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpPopover } from '@/components/ui-custom/HelpPopover';
import ProjectHeroImage from '@/components/project/ProjectHeroImage';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function ProjectBasicData() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  
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

  // Set sidebar context and populate form data
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

  // Initialize with real project data
  useEffect(() => {
    if (projectData) {
      setProjectImageUrl(projectData.project_image_url || null);
      setProjectLocation(projectData.address || '');
      setProjectClient(projectData.client_name || '');
      setStartDate(projectData.start_date || '');
      setEndDate(projectData.estimated_end || '');
      setProjectDescription(projectData.description || '');
    }
    
    if (projectInfo) {
      setProjectName(projectInfo.name || '');
    }
  }, [projectData, projectInfo]);



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
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Image Section */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Imagen Principal</h2>
              <HelpPopover 
                title="Imagen Principal del Proyecto"
                description="Sube una imagen representativa de tu proyecto que se mostrará como imagen principal. Esta imagen aparecerá en las tarjetas del proyecto y en la página de información básica. Formatos aceptados: JPG, PNG, WebP con un tamaño máximo de 10MB."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Define la imagen representativa de tu proyecto que se mostrará en tarjetas y reportes
            </p>
          </div>

          {/* Hero Image Component */}
          {projectId && organizationId && (
            <ProjectHeroImage
              projectId={projectId}
              organizationId={organizationId}
              currentImageUrl={projectImageUrl}
              onImageUpdate={setProjectImageUrl}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Titles and Descriptions */}
          <div className="space-y-12">
            {/* Información General Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">Información General</h2>
                <HelpPopover 
                  title="Información General"
                  description="Esta información define las características principales de tu proyecto. El nombre y descripción se utilizan en reportes y documentos, mientras que el tipo y estado ayudan a categorizar y hacer seguimiento del progreso."
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Define las características principales y estado actual de tu proyecto
              </p>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-8">
            {/* Información General */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nombre del Proyecto</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ingresa el nombre del proyecto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Descripción</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe brevemente el proyecto"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-location">Ubicación</Label>
                <Input
                  id="project-location"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                  placeholder="Dirección o ubicación del proyecto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-client">Cliente</Label>
                <Input
                  id="project-client"
                  value={projectClient}
                  onChange={(e) => setProjectClient(e.target.value)}
                  placeholder="Nombre del cliente o contratante"
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
                <Label htmlFor="end-date">Fecha Estimada de Finalización</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}