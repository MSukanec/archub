import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Plus, Trash2, Calendar, CalendarIcon, Cloud, Users, Wrench, Camera, ArrowLeft, X } from "lucide-react";
import { FormModalLayout } from "@/components/modal";
import { FormModalHeader } from "@/components/modal";
import { FormModalFooter } from "@/components/modal";
import { FormSubsectionButton } from "@/components/modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/features/organization";
import { useContacts } from "@/features/contacts";
import { useGlobalModalStore } from "@/components/modal";
import { useModalPanelStore } from "@/components/modal";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useProjectContext } from "@/stores/projectContext";
import { FileUploader } from "@/components/shared/fields/FileUploader";
import { EmptyState } from "@/components/shared/EmptyState";
import { uploadSiteLogFiles } from "@/features/sitelog/services/uploadSiteLogFiles";
import { createSiteLog } from '../services/createSiteLog';
import { updateSiteLog } from '../services/updateSiteLog';
import { MediaForm } from "./forms/MediaForm";
import { siteLogSchema, type SiteLogFormData } from '../schemas';
import type { SiteLogFileInput } from '../types';
import { useSiteLogTypes } from '../hooks/use-sitelog-types';
import { useSiteLogFiles } from '../hooks/use-sitelog-files';
interface SiteLogModalProps {
  data?: any;
}
export function SiteLogModal({ data }: SiteLogModalProps) {
  const { toast } = useToast();
  const { closeModal } = useGlobalModalStore();
  const { currentPanel, setPanel, currentSubform, setCurrentSubform } = useModalPanelStore();
  const { data: currentUser } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { data: members = [] } = useOrganizationMembers(currentOrganizationId || undefined);
  const { data: contacts = [] } = useContacts(currentOrganizationId || undefined);
  
  // Plan features para restricciones
  const currentOrganization = currentUser?.organizations?.find(org => org.id === currentOrganizationId);
  const currentPlanName = currentOrganization?.plan?.name?.toLowerCase() || 'free';
  const isPro = currentPlanName === 'pro'|| currentPlanName === 'teams'|| currentPlanName === 'enterprise';
  const isTeams = currentPlanName === 'teams'|| currentPlanName === 'enterprise';
  
  // Query para obtener tipos de bitácora
  const { data: siteLogTypes = [], isLoading: typesLoading } = useSiteLogTypes(
    currentOrganizationId || undefined
  );
  
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<SiteLogFileInput[]>([]);
  const [existingSiteLogFiles, setExistingSiteLogFiles] = useState<any[]>([]);
  const queryClient = useQueryClient();
  // Inicializar el panel correcto según si es creación o edición
  useEffect(() => {
    const siteLogId = data?.data?.id || data?.id;
    const isCreating = !siteLogId;
    
    if (isCreating) {
      // Si es creación, abrir en modo edición
      setPanel('edit');
    } else if (data?.isEditing) {
      // Si se pasó isEditing=true, abrir en modo edición
      setPanel('edit');
    } else {
      // Por defecto, abrir en modo visualización
      setPanel('view');
    }
  }, [data, setPanel]);
  // Query para obtener archivos existentes de la bitácora
  const { data: siteLogFiles = [], isLoading: filesLoading } = useSiteLogFiles(
    data?.id || data?.data?.id,
    currentOrganizationId || undefined
  );
  // Mutación para subir archivos de bitácora
  const uploadFilesMutation = useMutation({
    mutationFn: async ({ files, siteLogId }: { files: SiteLogFileInput[], siteLogId: string }) => {
      if (!currentOrganizationId || !selectedProjectId) {
        throw new Error('No hay proyecto u organización seleccionada');
      }
      const currentMember = members.find((m: any) => m.user_id === currentUser?.user?.id);
      if (!currentMember) {
        throw new Error('No se encontró el miembro de la organización para el usuario actual');
      }
      return await uploadSiteLogFiles(
        files,
        siteLogId,
        selectedProjectId,
        currentOrganizationId,
        currentMember.id
      );
    },
    onSuccess: (compressionStats, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-files', variables.siteLogId, currentOrganizationId] });
      queryClient.refetchQueries({ queryKey: ['sitelog-files', variables.siteLogId, currentOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['site-logs', selectedProjectId, currentOrganizationId] });
      queryClient.refetchQueries({ queryKey: ['site-logs', selectedProjectId, currentOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['sitelog-gallery'] });
      queryClient.refetchQueries({ queryKey: ['sitelog-gallery'] });
      setFilesToUpload([]);
      
      // Mostrar toast con stats de compresión si hay
      let description = "Los archivos se han subido correctamente a la bitácora.";
      if (compressionStats && compressionStats.filesCompressed > 0) {
        const originalMB = (compressionStats.totalOriginalSize / 1024 / 1024).toFixed(2);
        const compressedMB = (compressionStats.totalCompressedSize / 1024 / 1024).toFixed(2);
        const reductionPercent = Math.round(
          ((compressionStats.totalOriginalSize - compressionStats.totalCompressedSize) / compressionStats.totalOriginalSize) * 100
        );
        description = `${compressionStats.filesCompressed} imagen(es) optimizada(s): ${originalMB}MB → ${compressedMB}MB (${reductionPercent}% reducción)`;
      }
      
      toast({
        title: "Archivos subidos",
        description
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron subir los archivos.",
        variant: "destructive"
      });
    }
  });
  // Mutación para crear/actualizar bitácoras
  const siteLogMutation = useMutation({
    mutationFn: async (formData: SiteLogFormData) => {
      if (!currentOrganizationId || !selectedProjectId) {
        throw new Error('No hay proyecto u organización seleccionada');
      }
      // Obtener el organization_member.id del usuario actual
      const currentMember = members.find((m: any) => m.user_id === currentUser?.user?.id);
      if (!currentMember) {
        throw new Error('No se encontró el miembro de la organización para el usuario actual');
      }
      // Validar que entry_type_id sea un UUID válido
      const entryTypeId = formData.entry_type_id || defaultType?.id;
      if (!entryTypeId) {
        throw new Error('Tipo de bitácora no especificado');
      }
      const siteLogData = {
        log_date: formData.log_date,
        created_by: currentMember.id,
        entry_type_id: entryTypeId,
        weather: formData.weather || null,
        severity: formData.severity,
        status: formData.status || "approved",
        comments: formData.comments,
        is_public: formData.is_public,
        is_favorite: false,
        project_id: selectedProjectId,
        organization_id: currentOrganizationId
      };
      const siteLogId = data?.data?.id || data?.id;
      const savedSiteLog = siteLogId
        ? await updateSiteLog(siteLogId, siteLogData)
        : await createSiteLog(siteLogData);
      return savedSiteLog;
    },
    onSuccess: async (savedSiteLog) => {
      queryClient.invalidateQueries({ queryKey: ['site-logs', selectedProjectId, currentOrganizationId] });
      
      // Si hay archivos para subir, subirlos después de guardar la bitácora
      if (filesToUpload.length > 0) {
        try {
          await uploadFilesMutation.mutateAsync({ 
            files: filesToUpload, 
            siteLogId: savedSiteLog.id 
          });
        } catch (error) {
          // No hacer throw aquí para no fallar todo el proceso
        }
      }
      
      const siteLogId = data?.data?.id || data?.id;
      toast({
        title: siteLogId ? "Bitácora actualizada" : "Bitácora creada",
        description: siteLogId ? "La bitácora se ha actualizado correctamente." : "La nueva bitácora se ha creado correctamente."
      });
      closeModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al guardar la bitácora.",
        variant: "destructive"
      });
    }
  });
  // Obtener el tipo por defecto - Priorizar is_default=true, si no, tomar el primero
  const defaultType = siteLogTypes.find((t: any) => t.is_default) || siteLogTypes[0];
  
  const form = useForm<SiteLogFormData>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      is_public: false,
      entry_type_id: "",
      weather: "none",
      severity: "low",
      status: "approved",
      comments: ""
    }
  });
  
  // Actualizar entry_type_id cuando se carguen los tipos o cuando se abra el modal
  useEffect(() => {
    const siteLogId = data?.data?.id || data?.id;
    const isCreating = !siteLogId;
    
    if (isCreating && defaultType && !form.getValues('entry_type_id')) {
      form.setValue('entry_type_id', defaultType.id);
    }
  }, [defaultType, data, form]);
  useEffect(() => {
    if (data) {
      // Los datos pueden venir anidados en data.data, normalizar
      const siteLogData = data.data || data;
      
      // Si estamos editando, cargar los datos existentes
      const resetValues = {
        log_date: siteLogData.log_date || new Date().toISOString().split('T')[0],
        is_public: siteLogData.is_public || false,
        entry_type_id: siteLogData.entry_type_id || defaultType?.id || "",
        weather: siteLogData.weather || "none",
        severity: siteLogData.severity || "low",
        status: siteLogData.status || "approved",
        comments: siteLogData.comments || ""
      };
      
      form.reset(resetValues);
      setUploadedFiles(siteLogData.files || []);
    }
  }, [data, form, defaultType]);
  const onSubmit = async (formData: SiteLogFormData) => {
    siteLogMutation.mutate(formData);
  };
  const isLoading = siteLogMutation.isPending;
  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Bitácora de Obra</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {data ? "Visualizar información de la bitácora" : "No hay datos para mostrar"}
        </p>
      </div>
      {data && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Fecha:</label>
            <p className="text-sm text-muted-foreground">{(data.data || data).log_date}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Tipo:</label>
            <p className="text-sm text-muted-foreground">{(data.data || data).entry_type}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Comentarios:</label>
            <p className="text-sm text-muted-foreground">{(data.data || data).comments || "Sin comentarios"}</p>
          </div>
        </div>
      )}
    </div>
  );
  const editPanel = (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        onKeyDown={(e) => {
          if (e.key === 'Enter'&& !e.shiftKey) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
          }
        }}
        className="space-y-6"
      >
        {/* Fila 1: Fecha / Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="log_date"
            render={({ field }) => {
              const dateValue = field.value ? new Date(field.value) : undefined;
              return (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Seleccionar fecha"
                              value={dateValue ? format(dateValue, 'dd/MM/yyyy', { locale: es }) : ''}
                              className="pr-10 cursor-pointer"
                              readOnly
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateValue}
                          onSelect={(date: Date | undefined) => {
                            if (date) {
                              field.onChange(date.toISOString().split('T')[0]);
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="entry_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tipo de Bitácora *
                  {!isPro && (
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-[10px] border-0 text-white" 
                      style={{ backgroundColor: 'hsl(213, 100%, 33%)'}}
                    >
                      PRO
                    </Badge>
                  )}
                </FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                  }} 
                  value={field.value || defaultType?.id || ""}
                  disabled={typesLoading || !isPro}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !isPro ? "Requiere plan PRO" : 
                        typesLoading ? "Cargando..." : 
                        "Seleccionar tipo"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {siteLogTypes.length === 0 && (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No hay tipos de bitácora disponibles
                      </div>
                    )}
                    {siteLogTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Fila 2: Clima / Severidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weather"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condición Climática</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin Especificar</SelectItem>
                    <SelectItem value="sunny">☀️ Soleado</SelectItem>
                    <SelectItem value="partly_cloudy">⛅ Parcialmente Nublado</SelectItem>
                    <SelectItem value="cloudy">☁️ Nublado</SelectItem>
                    <SelectItem value="rain">🌧️ Lluvia</SelectItem>
                    <SelectItem value="storm">⛈️ Tormenta</SelectItem>
                    <SelectItem value="snow">❄️ Nieve</SelectItem>
                    <SelectItem value="fog">🌫️ Niebla</SelectItem>
                    <SelectItem value="windy">💨 Ventoso</SelectItem>
                    <SelectItem value="hail">🧊 Granizo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severidad *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar severidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Fila 3: Público / Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Público
                  {!isTeams && (
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-[10px] border-0 text-white" 
                      style={{ backgroundColor: 'hsl(271, 76%, 53%)'}}
                    >
                      TEAMS
                    </Badge>
                  )}
                </FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "true")} 
                  value={field.value ? "true" : "false"}
                  disabled={!isTeams}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!isTeams ? "Requiere plan TEAMS" : "Seleccionar visibilidad"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Visible por organización y clientes</SelectItem>
                    <SelectItem value="false">Visible solo por la organización</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Estado
                  {!isTeams && (
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-[10px] border-0 text-white" 
                      style={{ backgroundColor: 'hsl(271, 76%, 53%)'}}
                    >
                      TEAMS
                    </Badge>
                  )}
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || "approved"}
                  disabled={!isTeams}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!isTeams ? "Requiere plan TEAMS" : "Seleccionar estado"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="review">En Revisión</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Comentarios */}
        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentarios</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción general de las actividades del día..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Fotos y Videos */}
        <div className="space-y-4">
          <FormSubsectionButton
            icon={<Camera />}
            title="Fotos y Videos"
            description="Adjunta archivos multimedia al registro"
            onClick={() => {
              setCurrentSubform('files');
              setPanel('subform');
            }}
          />
          
          {/* Mini-galería de imágenes y videos */}
          {(() => {
            // Filtrar imágenes y videos de ambas fuentes
            const existingMedia = siteLogFiles.filter(file => file.file_type === 'image'|| file.file_type === 'video');
            const newMedia = filesToUpload.filter(fileInput => {
              const type = fileInput.file.type;
              return type.startsWith('image/') || type.startsWith('video/');
            });
            const totalMedia = existingMedia.length + newMedia.length;
            
            if (totalMedia === 0) return null;
            
            return (
              <div className="grid grid-cols-5 gap-2">
                {/* Media existente */}
                {existingMedia.map((file) => (
                  <div key={`existing-${file.id}`} className="relative aspect-square rounded overflow-hidden bg-muted">
                    {file.file_type === 'image'? (
                      <img
                        src={file.file_url || ''}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : file.file_type === 'video'? (
                      <>
                        <video 
                          src={file.file_url || ''}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                            <svg className="w-5 h-5 text-black fill-current ml-0.5" viewBox="0 0 24 24">
                              <polygon points="5 3 19 12 5 21" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
                
                {/* Media nueva para subir */}
                {newMedia.map((fileInput, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded overflow-hidden bg-muted">
                    {fileInput.file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(fileInput.file)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : fileInput.file.type.startsWith('video/') ? (
                      <>
                        <video 
                          src={URL.createObjectURL(fileInput.file)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                            <svg className="w-5 h-5 text-black fill-current ml-0.5" viewBox="0 0 24 24">
                              <polygon points="5 3 19 12 5 21" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        {/* Botón submit oculto */}
        <button type="submit" style={{ display: 'none'}} />
      </form>
    </Form>
  );
  const mediaSubform = (
    <MediaForm 
      filesToUpload={filesToUpload}
      setFilesToUpload={setFilesToUpload}
      siteLogFiles={siteLogFiles}
    />
  );
  const handleSubmit = () => {
    form.handleSubmit(onSubmit)();
  };
  const handleEditClick = () => {
    setPanel('edit');
  };
  const siteLogId = data?.data?.id || data?.id;
  // Configurar botones del footer según el panel actual
  const getFooterConfig = () => {
    if (currentPanel === 'view') {
      return {
        cancelText: "Cerrar",
        onLeftClick: closeModal,
        submitText: "Editar",
        onSubmit: handleEditClick,
        showLoadingSpinner: false
      };
    } else if (currentPanel === 'subform') {
      // FormModalLayout maneja automáticamente la navegación en subforms
      // Solo necesitamos definir los textos y acciones de los datos
      return {
        cancelText: "Cancelar",
        onLeftClick: closeModal, // ← FormModalLayout lo convertirá a setPanel('edit')
        submitText: "Guardar",
        onSubmit: () => {}, // ← No-op: datos ya están en estado, FormModalLayout vuelve a edit
        showLoadingSpinner: false
      };
    } else {
      // Panel edit: submit real a la BD
      return {
        cancelText: "Cancelar",
        onLeftClick: closeModal,
        submitText: siteLogId ? "Actualizar" : "Crear",
        onSubmit: handleSubmit,
        showLoadingSpinner: isLoading
      };
    }
  };
  const footerConfig = getFooterConfig();
  // Configurar header dinámico según el panel actual
  const getHeaderConfig = () => {
    if (currentPanel === 'subform') {
      // Headers para subforms - el botón de volver se agrega automáticamente por FormModalLayout
      const subformHeaders: Record<string, { icon: any; title: string; description: string }> = {
        'files': {
          icon: Camera,
          title: 'Fotos y Videos',
          description: 'Adjunta archivos multimedia al registro de bitácora'
        }
      };
      const config = subformHeaders[currentSubform || ''];
      if (!config) return null;
      // Ya no necesitamos showBackButton ni onBackClick - FormModalLayout lo agrega automáticamente
      return (
        <FormModalHeader
          icon={config.icon}
          title={config.title}
          description={config.description}
        />
      );
    }
    // Header por defecto para view/edit
    return (
      <FormModalHeader
        icon={FileText}
        title={siteLogId ? "Editar Bitácora" : "Nueva Bitácora"}
        description={siteLogId ? "Actualizar información de la bitácora de obra" : "Crear una nueva entrada en la bitácora de obra"}
      />
    );
  };
  return (
    <FormModalLayout 
      onClose={closeModal}
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={
        currentSubform === 'files'? mediaSubform :
        null
      }
      headerContent={getHeaderConfig()}
      footerContent={
        <FormModalFooter
          cancelText={footerConfig.cancelText}
          onLeftClick={footerConfig.onLeftClick}
          onSubmit={footerConfig.onSubmit}
          showLoadingSpinner={footerConfig.showLoadingSpinner}
          submitText={footerConfig.submitText}
        />
      }
      isEditing={data?.isEditing || false}
    />
  );
}