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
import { Loader2 } from "lucide-react";
import { useTaskTemplates, useTaskTemplateParameters } from "@/hooks/use-task-templates";
import { useCreateGeneratedTask } from "@/hooks/use-generated-tasks";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUnits } from "@/hooks/use-units";
import { supabase } from "@/lib/supabase";
import { generatePreviewDescription } from "@/utils/taskDescriptionGenerator";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface CreateGeneratedTaskUserModalProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
}

const formSchema = z.object({
  template_id: z.string().min(1, "Debe seleccionar una plantilla"),
  unit_id: z.string().optional()
}).catchall(z.any());

export function CreateGeneratedTaskUserModal({ 
  open, 
  onClose, 
  onTaskCreated 
}: CreateGeneratedTaskUserModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: userData } = useCurrentUser();
  const { data: templates, isLoading: templatesLoading } = useTaskTemplates();
  const { data: units, isLoading: unitsLoading } = useUnits();
  const { data: parameters, isLoading: parametersLoading, refetch: refetchParameters } = useTaskTemplateParameters(selectedTemplateId || null);
  const createGeneratedTask = useCreateGeneratedTask();
  
  // Load parameter options for each parameter
  const [parameterOptions, setParameterOptions] = useState<Record<string, any[]>>({});
  
  // Load options for select type parameters
  useEffect(() => {
    if (parameters?.length) {
      const loadOptions = async () => {
        const optionsMap: Record<string, any[]> = {};
        
        for (const param of parameters) {
          if (param.type === 'select') {
            try {
              if (supabase) {
                const { data: options, error } = await supabase
                  .from('task_parameter_values')
                  .select('name, label')
                  .eq('parameter_id', param.id)
                  .order('name');
                
                if (error) {
                  console.error('Error fetching parameter options:', error);
                  optionsMap[param.id] = [];
                } else {
                  // Transform data to expected format
                  optionsMap[param.id] = (options || []).map(opt => ({
                    value: opt.name,
                    label: opt.label || opt.name
                  }));
                }
              }
            } catch (error) {
              console.error(`Error loading options for parameter ${param.id}:`, error);
              optionsMap[param.id] = [];
            }
          }
        }
        
        setParameterOptions(optionsMap);
      };
      
      loadOptions();
    }
  }, [parameters]);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template_id: "",
      unit_id: "",
      ...paramValues
    },
    mode: "onChange"
  });

  // Watch all form values for real-time preview
  const watchedValues = useWatch({ control: form.control });

  // Reset form when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      // Invalidate and refetch parameters to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters', selectedTemplateId] });
      refetchParameters();
      
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
        unit_id: "",
        ...newParamValues
      });
    }
  }, [selectedTemplateId, parameters, refetchParameters]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTemplateId("");
      setParamValues({});
      form.reset({
        template_id: "",
        unit_id: ""
      });
      // Invalidate queries for fresh data
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['task-template-parameters'] });
    }
  }, [open]);

  const handleSubmit = async (data: any) => {
    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información de la organización",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    const { template_id, unit_id, ...params } = data;
    
    try {
      // Crear nueva tarea como usuario (no del sistema)
      const result = await createGeneratedTask.mutateAsync({
        template_id: template_id,
        param_values: params,
        organization_id: userData.organization.id,
        unit_id: unit_id ? unit_id : null,
        is_system: false // Usuarios crean tareas de organización
      });
      
      if (result.new_task) {
        toast({
          title: "Tarea Creada",
          description: `Tarea creada exitosamente con código ${result.generated_code}`,
          variant: "default"
        });
        
        // Pasar la tarea creada al componente padre
        onTaskCreated?.(result.new_task);
        onClose();
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea personalizada",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const ParameterField = ({ param }: { param: any }) => {
    // Use the cached options from parameterOptions state
    const options = parameterOptions[param.id] || [];

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

  // Generate preview description
  const generatePreview = () => {
    const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
    if (!selectedTemplate || !parameters) return "";
    
    try {
      return generatePreviewDescription(
        selectedTemplate.name_template || "",
        watchedValues,
        parameters,
        parameterOptions
      );
    } catch (error) {
      return selectedTemplate.name_template || "";
    }
  };

  if (!open) return null;

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title="Crear Tarea Personalizada"
            description="Crear una nueva tarea basada en plantilla para su organización"
            onClose={handleClose}
          />
        ),
        body: (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} id="create-task-form">
              <CustomModalBody columns={1}>
                <div className="space-y-4">
                  {/* Plantilla de Tarea */}
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
                                {template.name_template || template.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo de Unidad */}
                  <FormField
                    control={form.control}
                    name="unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={unitsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar unidad..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units?.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Parámetros de la Plantilla */}
                  {selectedTemplateId && parameters && parameters.length > 0 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-3">Parámetros de la Plantilla</h3>
                        <div className="space-y-3">
                          {parameters
                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                            .map((param) => (
                              <ParameterField key={param.name} param={param} />
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {selectedTemplateId && (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium mb-2">Vista Previa</h3>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                          {generatePreview() || "Seleccione valores para ver la vista previa"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CustomModalBody>
            </form>
          </Form>
        ),
        footer: (
          <CustomModalFooter
            onClose={handleClose}
            isSubmitting={isSubmitting}
            submitText="Crear Tarea"
            form="create-task-form"
          />
        )
      }}
    </CustomModalLayout>
  );
}