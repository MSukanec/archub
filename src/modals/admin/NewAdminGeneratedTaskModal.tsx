import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTaskTemplates, useTaskTemplateParameters, useTaskTemplateParameterOptions } from "@/hooks/use-task-templates";
import { useCreateGeneratedTask } from "@/hooks/use-generated-tasks";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Loader2 } from "lucide-react";

interface GeneratedTask {
  id: string
  code: string
  template_id: string
  param_values: any
  description: string
  created_by: string
  is_public: boolean
  created_at: string
}

interface NewAdminGeneratedTaskModalProps {
  open: boolean
  onClose: () => void
  generatedTask?: GeneratedTask | null
}

const formSchema = z.object({
  template_id: z.string().min(1, "Debe seleccionar una plantilla")
}).catchall(z.any());

export function NewAdminGeneratedTaskModal({ 
  open, 
  onClose, 
  generatedTask 
}: NewAdminGeneratedTaskModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [existingTask, setExistingTask] = useState<any>(null);
  
  const isEditing = !!generatedTask;
  
  const { data: userData } = useCurrentUser();
  const { data: templates, isLoading: templatesLoading } = useTaskTemplates();
  const { data: parameters, isLoading: parametersLoading } = useTaskTemplateParameters(selectedTemplateId || null);
  const createGeneratedTask = useCreateGeneratedTask();

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template_id: "",
      ...paramValues
    },
    mode: "onChange"
  });

  // Watch all form values for real-time preview
  const watchedValues = useWatch({ control: form.control });

  // Reset form when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      const newParamValues: Record<string, any> = {};
      parameters?.forEach(param => {
        if (param.type === 'boolean') {
          newParamValues[param.name] = false;
        } else {
          newParamValues[param.name] = '';
        }
      });
      setParamValues(newParamValues);
      form.reset({
        template_id: selectedTemplateId,
        ...newParamValues
      });
    }
  }, [selectedTemplateId, parameters, form]);

  // Initialize form for editing
  useEffect(() => {
    if (isEditing && generatedTask && open) {
      setSelectedTemplateId(generatedTask.template_id);
      setParamValues(generatedTask.param_values || {});
      form.reset({
        template_id: generatedTask.template_id,
        ...generatedTask.param_values
      });
    } else if (!isEditing && open) {
      setSelectedTemplateId("");
      setParamValues({});
      setExistingTask(null);
      form.reset({
        template_id: ""
      });
    }
  }, [isEditing, generatedTask, open, form]);

  // Generate description from template and parameters
  const generateDescription = (templateNameTemplate: string, paramValues: Record<string, any>) => {
    let description = templateNameTemplate;
    
    // Replace parameter placeholders with actual values
    parameters?.forEach(param => {
      const value = paramValues[param.name];
      if (value !== undefined && value !== '') {
        const placeholder = `{{${param.name}}}`;
        const displayValue = value.toString();
        description = description.replace(new RegExp(placeholder, 'g'), displayValue);
      }
    });
    
    return description;
  };

  const handleSubmit = async (data: any) => {
    if (!userData?.organization?.id) return;
    
    const { template_id, ...params } = data;
    
    // Find the selected template to get its name_template
    const selectedTemplate = templates?.find(t => t.id === template_id);
    const generatedDescription = selectedTemplate?.name_template 
      ? generateDescription(selectedTemplate.name_template, params)
      : "Tarea generada";
    
    try {
      const result = await createGeneratedTask.mutateAsync({
        input_template_id: template_id,
        input_param_values: params,
        input_organization_id: userData.organization.id
      });
      
      if (result.existing_task) {
        setExistingTask(result.existing_task);
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error creating generated task:", error);
    }
  };

  const ParameterField = ({ param }: { param: any }) => {
    const { data: options } = useTaskTemplateParameterOptions(param.type === 'select' ? param.id : null);

    switch (param.type) {
      case 'text':
        return (
          <FormField
            key={param.name}
            control={form.control}
            name={param.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={param.is_required ? "required-asterisk" : ""}>
                  {param.label}
                  {param.unit && <span className="text-xs text-muted-foreground ml-1">({param.unit})</span>}
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'number':
        return (
          <FormField
            key={param.name}
            control={form.control}
            name={param.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={param.is_required ? "required-asterisk" : ""}>
                  {param.label}
                  {param.unit && <span className="text-xs text-muted-foreground ml-1">({param.unit})</span>}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'select':
        return (
          <FormField
            key={param.name}
            control={form.control}
            name={param.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className={param.is_required ? "required-asterisk" : ""}>
                  {param.label}
                  {param.unit && <span className="text-xs text-muted-foreground ml-1">({param.unit})</span>}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options?.map((option: any, index: number) => (
                      <SelectItem key={option.id || `option-${index}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'boolean':
        return (
          <FormField
            key={param.name}
            control={form.control}
            name={param.name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className={param.is_required ? "required-asterisk" : ""}>
                    {param.label}
                  </FormLabel>
                  {param.unit && (
                    <div className="text-xs text-muted-foreground">
                      {param.unit}
                    </div>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );
      
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={isEditing ? "Editar Tarea Generada" : "Nueva Tarea Generada"}
            description={isEditing ? "Modificar tarea generada existente" : "Crear nueva tarea generada basada en plantilla"}
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            {existingTask ? (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Tarea Existente Encontrada
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Código:</span> {existingTask.code}</p>
                    <p><span className="font-medium">Descripción:</span> {existingTask.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required-asterisk">Plantilla de Tarea</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedTemplateId(value);
                          }} 
                          value={field.value}
                          disabled={templatesLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar plantilla..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates?.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedTemplateId && parametersLoading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Cargando parámetros...</span>
                    </div>
                  )}

                  {selectedTemplateId && !parametersLoading && parameters && parameters.length > 0 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-3">Parámetros de la Plantilla</h3>
                        <div className="space-y-4">
                          {parameters.map((param) => (
                            <ParameterField key={`${param.id}-${param.name}`} param={param} />
                          ))}
                        </div>
                      </div>
                      
                      {/* Preview of generated description */}
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-2">Vista previa de la descripción</h3>
                        <div className="p-3 bg-muted/20 rounded border text-sm">
                          {(() => {
                            const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
                            const { template_id, ...params } = watchedValues || {};
                            
                            // Convert boolean values to "Sí"/"No" for display
                            const displayParams = { ...params };
                            Object.keys(displayParams).forEach(key => {
                              const param = parameters?.find(p => p.name === key);
                              if (param?.type === 'boolean') {
                                displayParams[key] = displayParams[key] ? 'Sí' : 'No';
                              }
                            });
                            
                            return selectedTemplate?.name_template 
                              ? generateDescription(selectedTemplate.name_template, displayParams)
                              : "Seleccione los parámetros para ver la vista previa";
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTemplateId && !parametersLoading && parameters && parameters.length === 0 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <div className="p-4 border border-dashed rounded text-center text-sm text-muted-foreground">
                          Esta plantilla no tiene parámetros configurados.
                          <br />
                          La tarea se creará con la información básica de la plantilla.
                        </div>
                      </div>
                      
                      {/* Preview for templates without parameters */}
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-2">Vista previa de la descripción</h3>
                        <div className="p-3 bg-muted/20 rounded border text-sm">
                          {(() => {
                            const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
                            return selectedTemplate?.name_template || selectedTemplate?.name || "Vista previa no disponible";
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            )}
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={existingTask ? onClose : form.handleSubmit(handleSubmit)}
            saveText={existingTask ? "Cerrar" : (isEditing ? "Actualizar Tarea Generada" : "Crear Tarea Generada")}
            saveDisabled={!selectedTemplateId || createGeneratedTask.isPending}
            saveLoading={createGeneratedTask.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}