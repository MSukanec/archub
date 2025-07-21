import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calculator, Plus } from 'lucide-react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';

// Schema for the form validation
const bulkAddTasksSchema = z.object({
  searchTerm: z.string().optional()
});

type BulkAddTasksFormData = z.infer<typeof bulkAddTasksSchema>;

interface BudgetTaskBulkAddModalProps {
  budgetId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BudgetTaskBulkAddModal({ 
  budgetId, 
  onClose, 
  onSuccess 
}: BudgetTaskBulkAddModalProps) {
  const form = useForm<BulkAddTasksFormData>({
    resolver: zodResolver(bulkAddTasksSchema),
    defaultValues: {
      searchTerm: ''
    }
  });

  const handleSave = async (data: BulkAddTasksFormData) => {
    try {
      console.log('Adding tasks to budget:', budgetId, data);
      // TODO: Implement task addition logic
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding tasks:', error);
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  // View Panel - for displaying existing data (not used in this modal)
  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center text-muted-foreground">
        <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground/60" />
        <p>Selecciona tareas para agregar al presupuesto</p>
      </div>
    </div>
  );

  // Edit Panel - main form content
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="searchTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buscar tareas</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Escribe para buscar tareas disponibles..." 
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="mt-6 p-4 border rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground text-center">
              Aquí aparecerán las tareas disponibles para agregar al presupuesto
            </p>
          </div>
        </div>
      </form>
    </Form>
  );

  // Header Content
  const headerContent = (
    <FormModalHeader 
      title="Agregar Tareas"
      description="Selecciona tareas para incluir en el presupuesto"
      icon={Plus}
    />
  );

  // Footer Content
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleCancel}
      rightLabel="Agregar Tareas"
      onRightClick={form.handleSubmit(handleSave)}
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