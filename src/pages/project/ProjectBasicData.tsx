import { useState, useEffect } from 'react';
import { Database, Loader2 } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpPopover } from '@/components/ui-custom/HelpPopover';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { 
  useCurrentProjectInfo, 
  useCurrentProjectData, 
  useUpdateProjectName, 
  useUpdateProjectData 
} from '@/hooks/use-project-data';
import { useProjectTypes, useProjectModalities } from '@/hooks/use-project-types';
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave';

export default function ProjectBasicData() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();

  // Real data hooks
  const { data: projectInfo, isLoading: projectInfoLoading } = useCurrentProjectInfo();
  const { data: projectData, isLoading: projectDataLoading } = useCurrentProjectData();
  const { data: projectTypes = [], isLoading: typesLoading } = useProjectTypes();
  const { data: projectModalities = [], isLoading: modalitiesLoading } = useProjectModalities();
  const updateProjectName = useUpdateProjectName();
  const updateProjectData = useUpdateProjectData();

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectModality, setProjectModality] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set sidebar context on component mount
  useEffect(() => {
    setSidebarContext('data');
  }, [setSidebarContext]);

  // Initialize form with real data when loaded
  useEffect(() => {
    if (projectInfo) {
      setProjectName(projectInfo.name || '');
    }
  }, [projectInfo]);

  useEffect(() => {
    if (projectData) {
      setProjectDescription(projectData.description || '');
      setProjectType(projectData.project_type || '');
      setProjectModality(projectData.project_modality || '');
      setProjectStatus(projectData.status || '');
      setProjectLocation(projectData.location || '');
      setProjectClient(projectData.client || '');
      setStartDate(projectData.start_date || '');
      setEndDate(projectData.end_date || '');
    }
  }, [projectData]);

  // Auto-save for project name (separate mutation)
  const { isSaving: isSavingName } = useDebouncedAutoSave({
    data: { name: projectName },
    onSave: async (data) => {
      if (projectInfo?.name !== data.name) {
        await updateProjectName.mutateAsync(data.name);
      }
    },
    dependencies: [projectName],
  });

  // Auto-save for project data
  const { isSaving: isSavingData } = useDebouncedAutoSave({
    data: {
      description: projectDescription,
      project_type: projectType,
      project_modality: projectModality,
      status: projectStatus,
      location: projectLocation,
      client: projectClient,
      start_date: startDate || null,
      end_date: endDate || null,
    },
    onSave: async (data) => {
      await updateProjectData.mutateAsync(data);
    },
    dependencies: [projectDescription, projectType, projectModality, projectStatus, projectLocation, projectClient, startDate, endDate],
  });

  const isLoading = projectInfoLoading || projectDataLoading || typesLoading || modalitiesLoading;
  const isSaving = isSavingName || isSavingData;

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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Datos Básicos</h1>
            {isSaving && (
              <div className="flex items-center gap-1 text-sm text-accent">
                <Loader2 className="h-3 w-3 animate-spin" />
                Guardando...
              </div>
            )}
          </div>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Nombre del Proyecto</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ingresa el nombre del proyecto"
                    disabled={updateProjectName.isPending}
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
                    disabled={updateProjectData.isPending}
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
                  <Label htmlFor="project-modality">Modalidad</Label>
                  <Select value={projectModality} onValueChange={setProjectModality}>
                    <SelectTrigger id="project-modality">
                      <SelectValue placeholder="Selecciona la modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectModalities.map((modality) => (
                        <SelectItem key={modality.id} value={modality.id}>
                          {modality.name}
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
                    disabled={updateProjectData.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-client">Cliente</Label>
                  <Input
                    id="project-client"
                    value={projectClient}
                    onChange={(e) => setProjectClient(e.target.value)}
                    placeholder="Nombre del cliente o contratante"
                    disabled={updateProjectData.isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Fecha de Inicio</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={updateProjectData.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">Fecha de Finalización</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={updateProjectData.isPending}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}