import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { FormModalLayout, FormModalHeader, FormModalFooter } from '@/components/modals';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { CourseFaq } from '@shared/schema';

interface CourseFaqFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  faq?: CourseFaq | null;
}

interface FaqFormData {
  course_id: string;
  question: string;
  answer: string;
  sort_index: number;
}

export function CourseFaqFormModal({ isOpen, onClose, courseId, faq }: CourseFaqFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sortIndex, setSortIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question || '');
      setAnswer(faq.answer || '');
      setSortIndex(faq.sort_index || 0);
    } else {
      setQuestion('');
      setAnswer('');
      setSortIndex(0);
    }
  }, [faq]);

  const handleClose = () => {
    setQuestion('');
    setAnswer('');
    setSortIndex(0);
    onClose();
  };

  const createFaqMutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('course_faqs')
        .insert({
          course_id: data.course_id,
          question: data.question,
          answer: data.answer,
          sort_index: data.sort_index
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-faqs'] });
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

  const updateFaqMutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('course_faqs')
        .update({
          question: data.question,
          answer: data.answer,
          sort_index: data.sort_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', faq!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-faqs'] });
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

  const onSubmit = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos obligatorios.',
        variant: 'destructive'
      });
      return;
    }

    const data: FaqFormData = {
      course_id: courseId,
      question: question.trim(),
      answer: answer.trim(),
      sort_index: sortIndex
    };

    setIsLoading(true);
    try {
      if (faq) {
        await updateFaqMutation.mutateAsync(data);
      } else {
        await createFaqMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const headerContent = (
    <FormModalHeader 
      title={faq ? 'Editar FAQ' : 'Nueva FAQ'}
      description="Configura una pregunta frecuente para la landing page del curso."
    />
  );

  const footerContent = (
    <FormModalFooter
      onCancel={handleClose}
      onSubmit={onSubmit}
      submitLabel={faq ? 'Actualizar' : 'Crear'}
      isLoading={isLoading}
    />
  );

  return (
    <FormModalLayout
      isOpen={isOpen}
      onClose={handleClose}
      header={headerContent}
      footer={footerContent}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="question">Pregunta *</Label>
          <Input
            id="question"
            data-testid="input-faq-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="¿Cuál es la pregunta?"
          />
        </div>

        <div>
          <Label htmlFor="answer">Respuesta *</Label>
          <Textarea
            id="answer"
            data-testid="textarea-faq-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Respuesta detallada..."
            rows={5}
          />
        </div>

        <div>
          <Label htmlFor="sort_index">Orden</Label>
          <Input
            id="sort_index"
            data-testid="input-faq-sort-index"
            type="number"
            value={sortIndex}
            onChange={(e) => setSortIndex(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>
    </FormModalLayout>
  );
}
