import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModalLayout } from "@/components/modal";
import { FormModalHeader } from "@/components/modal";
import { FormModalFooter } from "@/components/modal";

import { Package } from "lucide-react";
import { useCreateSubcontract, useUpdateSubcontract, useSubcontract } from "../hooks";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalModalStore } from '@/components/modal';
import { useCurrentUser } from '@/features/users/hooks';
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  const { data: currentUser } = useCurrentUser();

  const createSubcontract = useCreateSubcontract();
  const updateSubcontract = useUpdateSubcontract();
  
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
        await updateSubcontract.mutateAsync({
          subcontractId: modalData.subcontractId,
          data: {
            organization_id: modalData.organizationId,
            date: data.date,
            title: data.title,
            code: data.code || null,
            notes: data.notes || null,
            status: existingSubcontract?.status || 'draft',
            currency_id: existingSubcontract?.currency_id || null,
            amount_total: existingSubcontract?.amount_total || null,
            exchange_rate: existingSubcontract?.exchange_rate || null,
          }
        });

        await logActivity({
          organization_id: modalData.organizationId,
          user_id: currentUser?.user?.id || '',
          action: ACTIVITY_ACTIONS.UPDATE_SUBCONTRACT,
          target_table: TARGET_TABLES.SUBCONTRACTS,
          target_id: modalData.subcontractId,
          metadata: { name: data.title, contractor: null }
        });
      } else {
        const result = await createSubcontract.mutateAsync({
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
        });

        await logActivity({
          organization_id: modalData.organizationId,
          user_id: currentUser?.user?.id || '',
          action: ACTIVITY_ACTIONS.CREATE_SUBCONTRACT,
          target_table: TARGET_TABLES.SUBCONTRACTS,
          target_id: result?.id || '',
          metadata: { name: data.title, contractor: null }
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

  const editPanel = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date" className="text-xs font-medium">
            Fecha *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  placeholder="Seleccionar fecha..."
                  value={form.watch('date') ? format(new Date(form.watch('date')), 'dd/MM/yyyy', { locale: es }) : ''}
                  className="pr-10 cursor-pointer"
                  readOnly
                />
                <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch('date') ? new Date(form.watch('date')) : undefined}
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    form.setValue('date', date.toISOString().split('T')[0]);
                  }
                }}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
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
