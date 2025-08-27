import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { Package } from "lucide-react";
import { useCreateSubcontract, useUpdateSubcontract, useSubcontract } from "@/hooks/use-subcontracts";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import DatePickerField from '@/components/ui-custom/fields/DatePickerField';

const subcontractSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  title: z.string().min(1, "El título es obligatorio"),
  code: z.string().optional(),
  notes: z.string().optional(),
});

type SubcontractFormData = z.infer<typeof subcontractSchema>;

interface SubcontractFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    subcontractId?: string;
    isEditing?: boolean;
  };
}

export function SubcontractFormModal({ modalData }: SubcontractFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { closeModal } = useGlobalModalStore();

  const createSubcontract = useCreateSubcontract();
  const updateSubcontract = useUpdateSubcontract();
  
  // Datos del subcontrato existente si se está editando
  const { data: existingSubcontract } = useSubcontract(modalData.subcontractId || null);

  const form = useForm<SubcontractFormData>({
    resolver: zodResolver(subcontractSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      title: '',
      code: '',
      notes: '',
    }
  });

  // Cargar datos del subcontrato existente si se está editando
  React.useEffect(() => {
    if (existingSubcontract && modalData.isEditing) {
      form.reset({
        date: existingSubcontract.date,
        title: existingSubcontract.title,
        code: existingSubcontract.code || '',
        notes: existingSubcontract.notes || '',
      });
    }
  }, [existingSubcontract, modalData.isEditing, form]);

  const onSubmit = async (data: SubcontractFormData) => {
    setIsSubmitting(true);

    try {
      if (modalData.isEditing && modalData.subcontractId) {
        // Modo edición - actualizar subcontrato existente
        await updateSubcontract.mutateAsync({
          subcontractId: modalData.subcontractId,
          subcontract: {
            date: data.date,
            title: data.title,
            code: data.code || null,
            notes: data.notes || null,
            status: existingSubcontract?.status || 'draft',
            currency_id: existingSubcontract?.currency_id || null,
            amount_total: existingSubcontract?.amount_total || null,
            exchange_rate: existingSubcontract?.exchange_rate || null,
            winner_bid_id: existingSubcontract?.winner_bid_id || null
          },
          taskIds: [] // Sin tareas
        });
      } else {
        // Modo creación - crear nuevo subcontrato
        await createSubcontract.mutateAsync({
          subcontract: {
            project_id: modalData.projectId,
            organization_id: modalData.organizationId,
            date: data.date,
            title: data.title,
            code: data.code || null,
            notes: data.notes || null,
            status: 'draft',
            currency_id: null,
            amount_total: null,
            exchange_rate: null,
            winner_bid_id: null
          },
          taskIds: [] // Sin tareas
        });
      }
      
      closeModal();

    } catch (error) {
      console.error('Error guardando subcontrato:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el subcontrato",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Panel principal
  const editPanel = (
    <div className="space-y-4">
      {/* Fecha y Código - Inline */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date" className="text-xs font-medium">
            Fecha *
          </Label>
          <DatePickerField
            value={form.watch('date') ? new Date(form.watch('date')) : undefined}
            onChange={(date) => {
              if (date) {
                form.setValue('date', date.toISOString().split('T')[0]);
              }
            }}
            placeholder="Seleccionar fecha..."
          />
          {form.formState.errors.date && (
            <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="code" className="text-xs font-medium">
            Código <span className="text-muted-foreground">(Opcional)</span>
          </Label>
          <Input
            id="code"
            placeholder="Ej: SC-001"
            {...form.register('code')}
          />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>
      </div>

      {/* Título */}
      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs font-medium">
          Título *
        </Label>
        <Input
          id="title"
          placeholder="Ej: Trabajos de albañilería"
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs font-medium">
          Notas
        </Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionales del subcontrato..."
          {...form.register('notes')}
          className="min-h-[120px] resize-none"
        />
      </div>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={modalData.isEditing ? "Editar Subcontrato" : "Crear Subcontrato"}
      description="Gestiona la información básica del subcontrato"
      icon={Package}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={closeModal}
      rightLabel={modalData.isEditing ? "Actualizar Subcontrato" : "Crear Subcontrato"}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isSubmitting}
      submitDisabled={!form.formState.isValid || isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div />}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      onClose={closeModal}
    />
  );
}