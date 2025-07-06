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

  // Form states - Información General
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTypeId, setProjectTypeId] = useState('');
  const [modalityId, setModalityId] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  
  // Form states - Superficies
  const [surfaceTotal, setSurfaceTotal] = useState('');
  const [surfaceCovered, setSurfaceCovered] = useState('');
  const [surfaceSemi, setSurfaceSemi] = useState('');
  
  // Form states - Ubicación
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  
  // Form states - Cliente
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Form states - Cronograma
  const [startDate, setStartDate] = useState('');
  const [estimatedEnd, setEstimatedEnd] = useState('');

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
      // Información General
      setProjectDescription(projectData.description || '');
      setProjectTypeId(projectData.project_type_id || '');
      setModalityId(projectData.modality_id || '');
      setInternalNotes(projectData.internal_notes || '');
      setHeroImageUrl(projectData.hero_image_url || '');
      
      // Superficies
      setSurfaceTotal(projectData.surface_total?.toString() || '');
      setSurfaceCovered(projectData.surface_covered?.toString() || '');
      setSurfaceSemi(projectData.surface_semi?.toString() || '');
      
      // Ubicación
      setAddress(projectData.address || '');
      setCity(projectData.city || '');
      setState(projectData.state || '');
      setCountry(projectData.country || '');
      setZipCode(projectData.zip_code || '');
      setLat(projectData.lat?.toString() || '');
      setLng(projectData.lng?.toString() || '');
      
      // Cliente
      setClientName(projectData.client_name || '');
      setClientEmail(projectData.email || '');
      setContactPhone(projectData.contact_phone || '');
      
      // Cronograma
      setStartDate(projectData.start_date || '');
      setEstimatedEnd(projectData.estimated_end || '');
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
      // Información General
      description: projectDescription,
      project_type_id: projectTypeId || null,
      modality_id: modalityId || null,
      internal_notes: internalNotes,
      hero_image_url: heroImageUrl,
      
      // Superficies
      surface_total: surfaceTotal ? parseFloat(surfaceTotal) : null,
      surface_covered: surfaceCovered ? parseFloat(surfaceCovered) : null,
      surface_semi: surfaceSemi ? parseFloat(surfaceSemi) : null,
      
      // Ubicación
      address: address,
      city: city,
      state: state,
      country: country,
      zip_code: zipCode,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      
      // Cliente
      client_name: clientName,
      email: clientEmail,
      contact_phone: contactPhone,
      
      // Cronograma
      start_date: startDate || null,
      estimated_end: estimatedEnd || null,
    },
    onSave: async (data) => {
      await updateProjectData.mutateAsync(data);
    },
    dependencies: [
      projectDescription, projectTypeId, modalityId, internalNotes, heroImageUrl,
      surfaceTotal, surfaceCovered, surfaceSemi,
      address, city, state, country, zipCode, lat, lng,
      clientName, clientEmail, contactPhone,
      startDate, estimatedEnd
    ],
  });

  const isLoading = projectInfoLoading || projectDataLoading || typesLoading || modalitiesLoading;
  const isSaving = isSavingName || isSavingData;



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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Column - Section Titles */}
            <div className="space-y-16">
              {/* Información General */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="text-lg font-semibold">Información General</h2>
                  <HelpPopover 
                    title="Información General"
                    description="Datos básicos del proyecto: nombre, descripción, tipo, modalidad y notas internas."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Datos básicos y descripción del proyecto
                </p>
              </div>

              {/* Superficies */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="text-lg font-semibold">Superficies</h2>
                  <HelpPopover 
                    title="Superficies del Proyecto"
                    description="Medidas del proyecto: superficie total, cubierta y semicubierta en metros cuadrados."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Medidas y superficies del proyecto
                </p>
              </div>

              {/* Ubicación */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="text-lg font-semibold">Ubicación</h2>
                  <HelpPopover 
                    title="Ubicación del Proyecto"
                    description="Dirección completa, coordenadas geográficas y datos de ubicación del proyecto."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Dirección y coordenadas del proyecto
                </p>
              </div>

              {/* Datos del Cliente */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="text-lg font-semibold">Datos del Cliente</h2>
                  <HelpPopover 
                    title="Información del Cliente"
                    description="Datos de contacto del cliente: nombre, email y teléfono."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Información de contacto del cliente
                </p>
              </div>

              {/* Cronograma */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="text-lg font-semibold">Cronograma</h2>
                  <HelpPopover 
                    title="Fechas del Proyecto"
                    description="Fechas de inicio y finalización estimada del proyecto."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Fechas de inicio y finalización
                </p>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-16">
              {/* Información General Section */}
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
                    rows={3}
                    disabled={updateProjectData.isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-type">Tipo de Proyecto</Label>
                    <Select value={projectTypeId} onValueChange={setProjectTypeId}>
                      <SelectTrigger id="project-type">
                        <SelectValue placeholder="Selecciona el tipo" />
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
                    <Select value={modalityId} onValueChange={setModalityId}>
                      <SelectTrigger id="project-modality">
                        <SelectValue placeholder="Selecciona modalidad" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internal-notes">Notas Internas</Label>
                  <Textarea
                    id="internal-notes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Notas internas del equipo"
                    rows={2}
                    disabled={updateProjectData.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-image">URL de Imagen Principal</Label>
                  <Input
                    id="hero-image"
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    disabled={updateProjectData.isPending}
                  />
                </div>
              </div>

              {/* Superficies Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surface-total">Superficie Total (m²)</Label>
                    <Input
                      id="surface-total"
                      type="number"
                      value={surfaceTotal}
                      onChange={(e) => setSurfaceTotal(e.target.value)}
                      placeholder="0"
                      disabled={updateProjectData.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surface-covered">Superficie Cubierta (m²)</Label>
                    <Input
                      id="surface-covered"
                      type="number"
                      value={surfaceCovered}
                      onChange={(e) => setSurfaceCovered(e.target.value)}
                      placeholder="0"
                      disabled={updateProjectData.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surface-semi">Superficie Semicubierta (m²)</Label>
                    <Input
                      id="surface-semi"
                      type="number"
                      value={surfaceSemi}
                      onChange={(e) => setSurfaceSemi(e.target.value)}
                      placeholder="0"
                      disabled={updateProjectData.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Ubicación Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección completa del proyecto"
                    disabled={updateProjectData.isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ciudad"
                      disabled={updateProjectData.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip-code">Código Postal</Label>
                    <Input
                      id="zip-code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="1234"
                      disabled={updateProjectData.isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">Provincia/Estado</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Provincia o Estado"
                      disabled={updateProjectData.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="País"
                      disabled={updateProjectData.isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitud</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="-34.6037"
                      disabled={updateProjectData.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitud</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="-58.3816"
                      disabled={updateProjectData.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Cliente Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Nombre del Cliente</Label>
                  <Input
                    id="client-name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre completo del cliente"
                    disabled={updateProjectData.isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      disabled={updateProjectData.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Teléfono</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+54 11 1234-5678"
                      disabled={updateProjectData.isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Cronograma Section */}
              <div className="space-y-4">
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
                    <Label htmlFor="estimated-end">Fecha Estimada de Finalización</Label>
                    <Input
                      id="estimated-end"
                      type="date"
                      value={estimatedEnd}
                      onChange={(e) => setEstimatedEnd(e.target.value)}
                      disabled={updateProjectData.isPending}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}