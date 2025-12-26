import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HelpCircle } from 'lucide-react';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCourseFaq, updateCourseFaq } from '../../services';
import type { CourseFaq } from '@shared/schema';
// Schema de validación Zod
const courseFaqSchema = z.object({
  question: z.string().min(1, 'La pregunta es requerida'),
  answer: z.string().min(1, 'La respuesta es requerida'),
  sort_index: z.number().int().min(0, 'El orden debe ser 0 o mayor').default(0),
});
type CourseFaqFormData = z.infer<typeof courseFaqSchema>;
interface CourseFaqFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  faq?: CourseFaq | null;
}
export function CourseFaqFormModal({ isOpen, onClose, courseId, faq }: CourseFaqFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  // Configurar form con React Hook Form
  const form = useForm<CourseFaqFormData>({
    resolver: zodResolver(courseFaqSchema),
    defaultValues: {
      question: '',
      answer: '',
      sort_index: 0,
    }
  });
  // Cargar datos cuando se edita una FAQ
  React.useEffect(() => {
    if (faq) {
      form.reset({
        question: faq.question || '',
        answer: faq.answer || '',
        sort_index: faq.sort_index || 0,
      });
    } else {
      form.reset({
        question: '',
        answer: '',
        sort_index: 0,
      });
    }
  }, [faq, form]);
  // Función de cierre
  const handleClose = () => {
    form.reset();
    onClose();
  };
  // Mutation para crear FAQ
  const createMutation = useMutation({
    mutationFn: (data: CourseFaqFormData) => createCourseFaq({
      courseId,
      question: data.question,
      answer: data.answer,
      sortIndex: data.sort_index,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-faqs', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-landing'] });
      toast({
        title: 'FAQ creada',
        description: 'La pregunta frecuente se creó correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating FAQ:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la FAQ. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });
  // Mutation para actualizar FAQ
  const updateMutation = useMutation({
    mutationFn: (data: CourseFaqFormData) => updateCourseFaq(faq!.id, {
      question: data.question,
      answer: data.answer,
      sortIndex: data.sort_index,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-faqs', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-landing'] });
      toast({
        title: 'FAQ actualizada',
        description: 'Los cambios se guardaron correctamente.'
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating FAQ:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la FAQ. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });
  // Handler de submit
  const onSubmit = async (data: CourseFaqFormData) => {
    setIsLoading(true);
    try {
      if (faq) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // Panel de edición (Formulario)
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pregunta *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="¿Cuál es la pregunta?" 
                  data-testid="input-faq-question"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Respuesta *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Respuesta detallada..."
                  data-testid="textarea-faq-answer"
                  rows={5}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sort_index"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orden</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  placeholder="0"
                  data-testid="input-faq-sort-index"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
  // Header con título, descripción e ícono
  const headerContent = (
    <FormModalHeader 
      title={faq ? 'Editar FAQ': 'Nueva FAQ'}
      description={faq ? 'Actualiza la pregunta frecuente del curso': 'Crea una nueva pregunta frecuente para la landing page del curso'}
      icon={HelpCircle}
    />
  );
  // Footer con botones
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={faq ? 'Actualizar': 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isLoading}
    />
  );
  // Guard: Solo renderizar si el modal está abierto
  if (!isOpen) return null;
  // Layout final
  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}
