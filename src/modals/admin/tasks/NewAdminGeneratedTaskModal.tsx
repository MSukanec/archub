import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useTaskTemplates, useTaskTemplateParameters } from '@/hooks/use-task-templates'
import { useCreateGeneratedTask, useUpdateGeneratedTask, GeneratedTask } from '@/hooks/use-generated-tasks'
import { useMaterials } from '@/hooks/use-materials'

import { Plus, Trash2, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ORIGINAL ParameterField component
function ParameterField({ parameter, value, onChange, options }: {
  parameter: any;
  value: any;
  onChange: (value: any) => void;
  options: any[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{parameter.label}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Seleccionar ${parameter.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {options?.length > 0 ? (
            options.map((option: any) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>No hay opciones disponibles</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

const generatedTaskSchema = z.object({
  template_id: z.string().min(1, 'La plantilla es requerida'),
  is_public: z.boolean(),
  param_values: z.record(z.any()).optional()
});

type GeneratedTaskFormData = z.infer<typeof generatedTaskSchema>;

interface NewAdminGeneratedTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedTask?: GeneratedTask;
}

export function NewAdminGeneratedTaskModal({ isOpen, onClose, generatedTask }: NewAdminGeneratedTaskModalProps) {
  const isEditing = !!generatedTask;
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState<{ material_id: string; amount: number }>({
    material_id: "",
    amount: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parameterOptions, setParameterOptions] = useState<Record<string, any[]>>({});
  
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { data: templates, isLoading: templatesLoading } = useTaskTemplates();
  const { data: parameters, isLoading: parametersLoading } = useTaskTemplateParameters(selectedTemplateId || null);
  const { data: materials } = useMaterials();
  
  const createGeneratedTask = useCreateGeneratedTask();
  const updateGeneratedTask = useUpdateGeneratedTask();
  // Material hooks will be added when needed

  const form = useForm<GeneratedTaskFormData>({
    resolver: zodResolver(generatedTaskSchema),
    defaultValues: {
      template_id: '',
      is_public: false,
      param_values: {}
    }
  });

  // Load parameter options for all parameters
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const loadOptions = async () => {
        const optionsMap: Record<string, any[]> = {};
        
        for (const param of parameters) {
          try {
            const { data, error } = await supabase!
              .from('task_parameter_values')
              .select('*')
              .eq('parameter_id', param.id);
            
            if (!error && data) {
              optionsMap[param.id] = data.map(option => ({
                id: option.id,
                value: option.id,
                label: option.label
              }));
            }
          } catch (error) {
            console.error('Error loading options for parameter:', param.id, error);
          }
        }
        
        setParameterOptions(optionsMap);
      };
      
      loadOptions();
    }
  }, [parameters]);

  // Initialize form when editing
  useEffect(() => {
    if (generatedTask) {
      setSelectedTemplateId(generatedTask.template_id);
      setCreatedTaskId(generatedTask.id);
      
      // Set param values directly
      if (generatedTask.param_values) {
        setParamValues(generatedTask.param_values);
        form.setValue('param_values', generatedTask.param_values);
      }
      
      form.setValue('template_id', generatedTask.template_id);
      form.setValue('is_public', generatedTask.is_public);
      
    } else {
      setSelectedTemplateId('');
      setParamValues({});
      setCreatedTaskId(null);
      form.reset({
        template_id: '',
        is_public: false,
        param_values: {}
      });
    }
  }, [generatedTask, form]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setParamValues({});
    form.setValue('template_id', templateId);
    form.setValue('param_values', {});
  };

  // Handle parameter value changes
  const handleParameterChange = (paramName: string, value: any) => {
    const newParamValues = { ...paramValues, [paramName]: value };
    setParamValues(newParamValues);
    form.setValue('param_values', newParamValues);
  };

  // ORIGINAL generateDescriptionWithExpressions function
  const generateDescriptionWithExpressions = (paramValues: Record<string, any>) => {
    if (!parameters) return "Seleccione los parámetros para ver la vista previa";

    const currentTemplate = templates?.find(t => t.id === selectedTemplateId);
    if (!currentTemplate) return "Seleccione una plantilla";

    let fragments: string[] = [];

    parameters
      .sort((a, b) => a.position - b.position)
      .forEach(param => {
        const rawValue = paramValues[param.name];
        if (!rawValue) return;

        // Buscar label para select
        let label = rawValue.toString();
        const option = parameterOptions[param.id]?.find(opt => opt.value === rawValue);
        if (option?.label) label = option.label;

        // Aplicar plantilla del parámetro
        const expr = param.expression_template || '{value}';
        const fragment = expr.replace('{value}', label);

        fragments.push(fragment);
      });

    return `${currentTemplate.name_template} ${fragments.join(' ')}.`.trim();
  };

  // Handle form submission
  const onSubmit = async (data: GeneratedTaskFormData) => {
    if (!userData?.user_id) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditing && generatedTask) {
        // Update existing task
        updateGeneratedTask.mutate({
          task_id: generatedTask.id,
          input_param_values: data.param_values || {},
          input_is_system: !data.is_public
        });
      } else {
        // Create new task
        const taskDescription = generateDescriptionWithExpressions(data.param_values || {});
        
        createGeneratedTask.mutate({
          template_id: data.template_id,
          param_values: data.param_values || {},
          is_system: !data.is_public
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Error al procesar la tarea",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Material handling will be added later if needed

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {isEditing ? "Editar Tarea Generada" : "Nueva Tarea Generada"}
          </DialogTitle>
        </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Template Selection */}
          <FormField
            control={form.control}
            name="template_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plantilla de Tarea *</FormLabel>
                <FormControl>
                  <Select 
                    value={field.value}
                    onValueChange={handleTemplateChange}
                    disabled={templatesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name_template}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Parameters Section */}
          {selectedTemplateId && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-medium">Parámetros de la Plantilla</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Configura los valores específicos para esta tarea
              </p>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vista Previa de la Plantilla</Label>
                <p className="text-sm text-muted-foreground">Así se verá el nombre de la tarea generada</p>
                <div className="p-3 bg-accent/10 border border-dashed border-accent rounded-md">
                  <p className="text-sm">{generateDescriptionWithExpressions(paramValues)}</p>
                </div>
              </div>

              {/* Parameter Fields */}
              {parameters?.map((parameter) => (
                <ParameterField
                  key={parameter.id}
                  parameter={parameter}
                  value={paramValues[parameter.name]}
                  onChange={(value) => handleParameterChange(parameter.name, value)}
                  options={parameterOptions[parameter.id] || []}
                />
              ))}
            </div>
          )}

          <Separator />

          {/* Public/Private Toggle */}
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel>Tarea Pública</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Las tareas públicas pueden ser usadas por otros usuarios
                  </p>
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedTemplateId}
            >
              {isSubmitting ? 'Procesando...' : (isEditing ? 'Actualizar' : 'Crear Tarea')}
            </Button>
          </div>
        </form>
      </Form>
      </DialogContent>
    </Dialog>
  );
}