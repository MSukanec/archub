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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import DatePicker from '@/components/ui-custom/DatePicker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const subcontractSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  title: z.string().min(1, "El título es obligatorio"),
  code: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  amount_total: z.number().optional(),
  currency_id: z.string().optional(),
  exchange_rate: z.number().optional(),
  contact_id: z.string().optional(),
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

  // Cargar opciones de monedas
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Cargar contactos
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', modalData.organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', modalData.organizationId)
        .eq('is_active', true)
        .order('company_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const form = useForm<SubcontractFormData>({
    resolver: zodResolver(subcontractSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      title: '',
      code: '',
      notes: '',
      status: 'draft',
      amount_total: undefined,
      currency_id: '',
      exchange_rate: 1,
      contact_id: '',
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
        status: existingSubcontract.status || 'draft',
        amount_total: existingSubcontract.amount_total || undefined,
        currency_id: existingSubcontract.currency_id || '',
        exchange_rate: existingSubcontract.exchange_rate || 1,
        contact_id: existingSubcontract.contact_id || '',
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
            status: data.status || 'draft',
            currency_id: data.currency_id || null,
            amount_total: data.amount_total || null,
            exchange_rate: data.exchange_rate || null,
            contact_id: data.contact_id || null,
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
            status: data.status || 'draft',
            currency_id: data.currency_id || null,
            amount_total: data.amount_total || null,
            exchange_rate: data.exchange_rate || null,
            contact_id: data.contact_id || null,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date" className="text-xs font-medium">
            Fecha *
          </Label>
          <DatePicker
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

      {/* Estado y Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="status" className="text-xs font-medium">
            Estado
          </Label>
          <Select 
            value={form.watch('status') || 'draft'} 
            onValueChange={(value) => form.setValue('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_progreso">En Progreso</SelectItem>
              <SelectItem value="awarded">Adjudicado</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="contact_id" className="text-xs font-medium">
            Subcontratista <span className="text-muted-foreground">(Opcional)</span>
          </Label>
          <Select 
            value={form.watch('contact_id') || ''} 
            onValueChange={(value) => form.setValue('contact_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar subcontratista..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin asignar</SelectItem>
              {contacts.map(contact => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.company_name || contact.full_name || `${contact.first_name} ${contact.last_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Monto y Moneda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="amount_total" className="text-xs font-medium">
            Monto Total <span className="text-muted-foreground">(Opcional)</span>
          </Label>
          <Input
            id="amount_total"
            type="number"
            placeholder="0.00"
            step="0.01"
            {...form.register('amount_total', { 
              setValueAs: (v) => v === '' ? undefined : parseFloat(v) 
            })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="currency_id" className="text-xs font-medium">
            Moneda
          </Label>
          <Select 
            value={form.watch('currency_id') || ''} 
            onValueChange={(value) => form.setValue('currency_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar moneda..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin especificar</SelectItem>
              {currencies.map(currency => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="exchange_rate" className="text-xs font-medium">
            Tipo de Cambio
          </Label>
          <Input
            id="exchange_rate"
            type="number"
            placeholder="1.00"
            step="0.01"
            {...form.register('exchange_rate', { 
              setValueAs: (v) => v === '' ? 1 : parseFloat(v) 
            })}
          />
        </div>
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