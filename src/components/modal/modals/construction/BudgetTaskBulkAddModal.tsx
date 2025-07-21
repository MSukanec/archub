import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { FormModalHeader } from '../../form/FormModalHeader';
import { FormModalFooter } from '../../form/FormModalFooter';
import { FormModalLayout } from '../../form/FormModalLayout';
import { useModalPanelStore } from '../../form/modalPanelStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const bulkAddSchema = z.object({
  searchTerm: z.string().optional()
});

type BulkAddFormData = z.infer<typeof bulkAddSchema>;

interface BudgetTaskBulkAddModalProps {
  modalData?: {
    budgetId?: string;
    onSuccess?: () => void;
  };
  onClose: () => void;
}

export function BudgetTaskBulkAddModal({ modalData, onClose }: BudgetTaskBulkAddModalProps) {
  const { budgetId, onSuccess } = modalData || {};
  const { setPanel } = useModalPanelStore();

  const form = useForm<BulkAddFormData>({
    resolver: zodResolver(bulkAddSchema),
    defaultValues: {
      searchTerm: ''
    }
  });

  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

  const handleSubmit = async (data: BulkAddFormData) => {
    try {
      console.log('Adding tasks to budget:', budgetId, data);
      // TODO: Implement task addition logic
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding tasks:', error);
    }
  };

  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground">
        <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/60" />
        <p>Modal de agregar tareas funcionando correctamente</p>
      </div>
    </div>
  );

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="searchTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buscar Tareas</FormLabel>
                <FormControl>
                  <Input placeholder="Buscar tareas disponibles..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="p-4 border rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground text-center">
              Aquí aparecerán las tareas disponibles para agregar
            </p>
          </div>
        </div>
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title="Agregar Tareas al Presupuesto"
      description="Selecciona las tareas que deseas incluir"
      icon={Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      cancelLabel="Cancelar"
      submitLabel="Agregar Tareas"
      onCancel={onClose}
      onSubmit={form.handleSubmit(handleSubmit)}
      isLoading={false}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}