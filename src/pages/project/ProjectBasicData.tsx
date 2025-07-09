import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';

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

  // Form states (mock data for now)
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectImageUrl, setProjectImageUrl] = useState<string | null>(null);

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('data');
  }, [setSidebarContext]);

  // Initialize with project data
  useEffect(() => {
    if (projectData) {
      setProjectImageUrl(projectData.project_image_url || null);
    }
    
    // Initialize with mock data for other fields
    setProjectName('Casa Familiar Moderna');
    setProjectDescription('Proyecto de vivienda unifamiliar de 150m² con diseño contemporáneo, incluye 3 dormitorios, 2 baños, living-comedor integrado y cocina moderna.');
    setProjectType('residential');
    setProjectStatus('design');
    setProjectLocation('Buenos Aires, Argentina');
    setProjectClient('Familia Rodríguez');
  }, [projectData]);

  const projectTypes = [
    { id: 'residential', name: 'Residencial' },
    { id: 'commercial', name: 'Comercial' },
    { id: 'industrial', name: 'Industrial' },
    { id: 'infrastructure', name: 'Infraestructura' }
  ];

  const projectStatuses = [
    { id: 'planning', name: 'Planificación' },
    { id: 'design', name: 'Diseño' },
    { id: 'construction', name: 'Construcción' },
    { id: 'finishing', name: 'Terminaciones' },
    { id: 'completed', name: 'Completado' }
  ];

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
        {projectId && organizationId && (
          <div className="w-full">
            <ProjectHeroImage
              projectId={projectId}
              organizationId={organizationId}
              currentImageUrl={projectImageUrl}
              onImageUpdate={setProjectImageUrl}
            />
          </div>
        )}

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Datos Básicos</h1>
          <p className="text-sm text-muted-foreground">
            Configura la información básica de tu proyecto, incluyendo descripción, tipo y estado actual.
          </p>
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
                <Label htmlFor="project-type">Tipo de Proyecto</Label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger id="project-type">
                    <SelectValue placeholder="Selecciona el tipo de proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-status">Estado Actual</Label>
                <Select value={projectStatus} onValueChange={setProjectStatus}>
                  <SelectTrigger id="project-status">
                    <SelectValue placeholder="Selecciona el estado actual" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}