import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Camera, Calendar, CalendarIcon, Users, Sun, Cloud, CloudRain, CloudSnow, Eye } from "lucide-react";
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from "@/components/modal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageLightbox, useImageLightbox } from "@/components/shared/viewers/ImageLightbox";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/features/organization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectContext } from "@/stores/projectContext";
import { uploadSiteLogFiles } from "../services/uploadSiteLogFiles";
import { createSiteLog } from "../services/createSiteLog";
import { updateSiteLog } from "../services/updateSiteLog";
import { siteLogSchema, type SiteLogFormData } from "../schemas";
import type { SiteLogFileInput } from "../types";
import { useSiteLogTypes } from "../hooks/use-sitelog-types";
import { useSiteLogFiles } from "../hooks/use-sitelog-files";
import { FileUploader } from "@/components/shared/fields/FileUploader";
import { deleteMediaFileV2 } from "@/features/media/services/deleteMediaFileV2";
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';

interface SiteLogFormProps {
  modalData?: any;
  onClose: () => void;
  mode?: "create" | "edit" | "view";
}

// Subcomponente: Panel de vista
function ViewPanel({ data, siteLogFiles }: { data: any; siteLogFiles: any[] }) {
  const imageUrls = siteLogFiles?.filter((file: any) => 
    file.file_type === 'image' || file.mime_type?.startsWith('image/')
  ).map((file: any) => file.file_url) || [];
  
  const lightbox = useImageLightbox(imageUrls);
  const imageFiles = siteLogFiles?.filter((file: any) => 
    file.file_type === 'image' || file.mime_type?.startsWith('image/')
  ) || [];

  const getInitials = (name: string): string => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const weatherConfig = {
    sunny: { label: "Soleado", icon: Sun, color: "text-yellow-500" },
    partly_cloudy: { label: "Parcialmente nublado", icon: Cloud, color: "text-yellow-400" },
    cloudy: { label: "Nublado", icon: Cloud, color: "text-gray-500" },
    rain: { label: "Lluvia", icon: CloudRain, color: "text-blue-500" },
  } as any;

  const weather = weatherConfig[data?.weather || 'sunny'];
  const WeatherIcon = weather?.icon || Sun;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-accent" />
          {data?.log_date ? format(new Date(data.log_date + 'T00:00:00'), 'dd MMMM yyyy', { locale: es }) : '-'}
        </div>
        
        {data?.creator && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={data.creator.avatar_url} alt={data.creator.full_name} />
              <AvatarFallback className="text-xs">{getInitials(data.creator.full_name)}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">{data.creator.full_name}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Tipo</div>
          <div className="text-sm">{data?.site_log_type?.name || 'Sin especificar'}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Severidad</div>
          <div className="text-sm">
            {data?.severity === 'low' ? 'Baja' : data?.severity === 'medium' ? 'Media' : data?.severity === 'high' ? 'Alta' : 'Crítica'}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Clima</div>
          <div className="flex items-center gap-2">
            <WeatherIcon className="h-4 w-4" />
            <span className="text-sm">{weather?.label || 'Sin especificar'}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Estado</div>
          <div className="text-sm">
            {data?.status === 'pending' ? 'Pendiente' : data?.status === 'review' ? 'En Revisión' : data?.status === 'approved' ? 'Aprobado' : 'Cerrado'}
          </div>
        </div>
      </div>

      {data?.comments && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Comentarios</div>
            <div className="text-sm bg-muted/20 p-3 rounded-md">{data.comments}</div>
          </div>
        </>
      )}

      {imageFiles.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Camera className="h-4 w-4 text-accent" />
              Archivos Multimedia ({imageFiles.length})
            </div>
            <div className="grid grid-cols-3 gap-2">
              {imageFiles.map((file: any, index: number) => (
                <div key={file.id || index} className="aspect-square rounded overflow-hidden border bg-muted/30">
                  <img
                    src={file.file_url}
                    alt={file.file_name || `Imagen ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => {
                      const imageIndex = imageUrls.indexOf(file.file_url);
                      if (imageIndex !== -1) lightbox.openLightbox(imageIndex);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ImageLightbox
        images={imageUrls}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.closeLightbox}
      />
    </div>
  );
}

// Subcomponente: Panel de formulario
function FormPanel({
  form,
  onSubmit,
  isLoading,
  siteLogTypes,
  typesLoading,
  isPro,
  isTeams,
  filesToUpload,
  setFilesToUpload,
  siteLogFiles,
  handleExistingFileDelete,
}: {
  form: ReturnType<typeof useForm<SiteLogFormData>>;
  onSubmit: (data: SiteLogFormData) => void;
  isLoading: boolean;
  siteLogTypes: any[];
  typesLoading: boolean;
  isPro: boolean;
  isTeams: boolean;
  filesToUpload: SiteLogFileInput[];
  setFilesToUpload: (files: SiteLogFileInput[]) => void;
  siteLogFiles: any[];
  handleExistingFileDelete: (fileId: string) => Promise<void>;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <div className="relative">
                          <Input
                            placeholder="Seleccionar fecha"
                            value={dateValue ? format(dateValue, 'dd/MM/yyyy', { locale: es }) : ''}
                            className="pr-10 cursor-pointer"
                            readOnly
                          />
                          <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateValue}
                          onSelect={(date: Date | undefined) => {
                            if (date) field.onChange(date.toISOString().split('T')[0]);
                          }}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
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
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                  disabled={typesLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={typesLoading ? "Cargando..." : "Seleccionar tipo"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {siteLogTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                    <SelectItem value="snow">❄️ Nieve</SelectItem>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Público
                </FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "true")} 
                  value={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar visibilidad" />
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
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || "approved"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
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

        <div className="space-y-2">
          <FormLabel>Fotos y Videos</FormLabel>
          <FileUploader
            mode="multiple"
            accept="media"
            compressOnDrop={true}
            compressionPreset="sitelog-photo"
            existingFiles={siteLogFiles}
            filesToUpload={filesToUpload}
            onFilesChange={setFilesToUpload}
            onExistingFileDelete={handleExistingFileDelete}
            emptyStateTitle="No hay archivos adjuntos"
            emptyStateDescription="Arrastra archivos o haz clic para seleccionar"
            newFileBadgeText="Nuevo"
            maxSize={50 * 1024 * 1024}
          />
        </div>

        <button type="submit" style={{ display: 'none' }} />
      </form>
    </Form>
  );
}

export default function SiteLogForm({ modalData, onClose, mode = "create" }: SiteLogFormProps) {
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { data: members = [] } = useOrganizationMembers(currentOrganizationId || undefined);
  const queryClient = useQueryClient();

  const siteLogId = modalData?.id || modalData?.data?.id;
  const isEditing = mode === "edit" || (mode !== "view" && siteLogId);
  const computedMode = mode === "view" ? "view" : (siteLogId ? "edit" : "create");

  const currentOrganization = currentUser?.organizations?.find(org => org.id === currentOrganizationId);
  const currentPlanName = currentOrganization?.plan?.name?.toLowerCase() || 'free';
  const isPro = currentPlanName === 'pro' || currentPlanName === 'teams' || currentPlanName === 'enterprise';
  const isTeams = currentPlanName === 'teams' || currentPlanName === 'enterprise';

  const { data: siteLogTypes = [], isLoading: typesLoading } = useSiteLogTypes(currentOrganizationId || undefined);
  const { data: siteLogFiles = [], isLoading: filesLoading } = useSiteLogFiles(siteLogId, currentOrganizationId || undefined);

  const [filesToUpload, setFilesToUpload] = useState<SiteLogFileInput[]>([]);

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

  const defaultType = siteLogTypes.find((t: any) => t.is_default) || siteLogTypes[0];

  useEffect(() => {
    if (computedMode !== "create" && defaultType && !form.getValues('entry_type_id')) {
      form.setValue('entry_type_id', defaultType.id);
    }
  }, [defaultType, computedMode, form]);

  useEffect(() => {
    if (modalData && (modalData.id || modalData.data?.id)) {
      form.reset({
        log_date: (modalData.data || modalData).log_date || new Date().toISOString().split('T')[0],
        is_public: (modalData.data || modalData).is_public || false,
        entry_type_id: (modalData.data || modalData).entry_type_id || defaultType?.id || "",
        weather: (modalData.data || modalData).weather || "none",
        severity: (modalData.data || modalData).severity || "low",
        status: (modalData.data || modalData).status || "approved",
        comments: (modalData.data || modalData).comments || ""
      });
    }
  }, [modalData, defaultType, form]);

  const uploadFilesMutation = useMutation({
    mutationFn: async ({ files, siteLogId }: { files: SiteLogFileInput[], siteLogId: string }) => {
      if (!currentOrganizationId || !selectedProjectId) throw new Error('No hay proyecto u organización seleccionada');
      const currentMember = members.find((m: any) => m.user_id === currentUser?.user?.id);
      if (!currentMember) throw new Error('No se encontró el miembro de la organización');
      return await uploadSiteLogFiles(files, siteLogId, selectedProjectId, currentOrganizationId, currentMember.id);
    },
    onSuccess: (compressionStats, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-files', variables.siteLogId] });
      queryClient.invalidateQueries({ queryKey: ['site-logs', selectedProjectId] });
      setFilesToUpload([]);
      toast({ title: "Archivos subidos", description: "Los archivos se han subido correctamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const siteLogMutation = useMutation({
    mutationFn: async (formData: SiteLogFormData) => {
      if (!currentOrganizationId || !selectedProjectId) throw new Error('No hay proyecto u organización seleccionada');
      const currentMember = members.find((m: any) => m.user_id === currentUser?.user?.id);
      if (!currentMember) throw new Error('No se encontró el miembro');

      const entryTypeId = formData.entry_type_id || defaultType?.id;
      if (!entryTypeId) throw new Error('Tipo de bitácora no especificado');

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

      const savedSiteLog = siteLogId
        ? await updateSiteLog(siteLogId, siteLogData)
        : await createSiteLog(siteLogData);

      return savedSiteLog;
    },
    onSuccess: async (savedSiteLog, variables) => {
      // Registrar actividad
      const entryTypeName = siteLogTypes.find((t: any) => t.id === variables.entry_type_id)?.name || 'Bitácora'
      await logActivity({
        organization_id: currentOrganizationId || '',
        user_id: currentUser?.user?.id || '',
        action: siteLogId ? ACTIVITY_ACTIONS.UPDATE_SITE_LOG : ACTIVITY_ACTIONS.CREATE_SITE_LOG,
        target_table: TARGET_TABLES.SITE_LOGS,
        target_id: savedSiteLog.id,
        metadata: { 
          entry_type: entryTypeName,
          comments: variables.comments || '',
          project_id: selectedProjectId || ''
        }
      })

      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      if (filesToUpload.length > 0) {
        try {
          await uploadFilesMutation.mutateAsync({ files: filesToUpload, siteLogId: savedSiteLog.id });
        } catch (error) {
          // No hacer throw
        }
      }
      toast({ title: siteLogId ? "Bitácora actualizada" : "Bitácora creada" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleExistingFileDelete = async (fileId: string) => {
    try {
      const fileToDelete = siteLogFiles.find(f => f.id === fileId);
      if (!fileToDelete) {
        toast({ title: "Error", description: "No se encontró el archivo a eliminar.", variant: "destructive" });
        return;
      }

      const linkId = fileToDelete.link_id;
      if (!linkId) {
        toast({ title: "Error", description: "No se puede eliminar este archivo.", variant: "destructive" });
        return;
      }

      await deleteMediaFileV2(linkId);
      queryClient.invalidateQueries({ queryKey: ['sitelog-files'] });
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      toast({ title: "Archivo eliminado", description: "El archivo se ha eliminado correctamente." });
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo eliminar el archivo.", variant: "destructive" });
    }
  };

  const onSubmit = async (formData: SiteLogFormData) => {
    siteLogMutation.mutate(formData);
  };

  const isLoading = siteLogMutation.isPending;

  if (computedMode === "view") {
    const viewData = modalData?.data || modalData;
    return (
      <ModalLayout onClose={onClose} size="xl">
        <ModalHeader
          title={`Bitácora de ${viewData?.site_log_type?.name || 'Obra'}`}
          description={viewData?.log_date ? format(new Date(viewData.log_date + 'T00:00:00'), 'dd MMMM yyyy', { locale: es }) : 'Sin fecha'}
          icon={Eye}
        />
        <ModalBody>
          <ViewPanel data={viewData} siteLogFiles={siteLogFiles} />
        </ModalBody>
        <ModalFooter leftLabel="Cerrar" onLeftClick={onClose} />
      </ModalLayout>
    );
  }

  return (
    <ModalLayout onClose={onClose} size="xl">
      <ModalHeader
        title={computedMode === "edit" ? "Editar Bitácora de Obra" : "Nueva Bitácora de Obra"}
        description={computedMode === "edit" ? "Actualiza información de la bitácora de obra" : "Crea una nueva entrada en la bitácora de obra"}
        icon={FileText}
      />
      <ModalBody>
        <FormPanel
          form={form}
          onSubmit={onSubmit}
          isLoading={filesLoading}
          siteLogTypes={siteLogTypes}
          typesLoading={typesLoading}
          isPro={isPro}
          isTeams={isTeams}
          filesToUpload={filesToUpload}
          setFilesToUpload={setFilesToUpload}
          siteLogFiles={siteLogFiles}
          handleExistingFileDelete={handleExistingFileDelete}
        />
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText={computedMode === "edit" ? "Actualizar" : "Crear"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isLoading}
      />
    </ModalLayout>
  );
}
