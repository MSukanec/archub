import React, { useState, useEffect } from 'react';
import { Building, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComboBox } from "@/components/ui-custom/fields/ComboBoxWriteField";

import { useUnits } from "@/hooks/use-units";
import { useCurrencies } from "@/hooks/use-currencies";
import { useCreateIndirectCost, useUpdateIndirectCost, useIndirectCost } from "@/hooks/use-indirect-costs";

// Schema de validación
const indirectCostSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  category: z.string().optional(),
  unit_id: z.string().optional(),
  amount: z.number().min(0, "El monto debe ser mayor o igual a 0").optional(),
  currency_id: z.string().optional(),
  valid_from: z.string().optional(),
});

type IndirectCostForm = z.infer<typeof indirectCostSchema>;

interface IndirectCostsModalData {
  organizationId: string;
  isEditing?: boolean;
  indirectCostId?: string;
}

interface IndirectCostsModalProps {
  modalData: IndirectCostsModalData;
  onClose: () => void;
}

export function IndirectCostsModal({ modalData, onClose }: IndirectCostsModalProps) {
  const { organizationId, isEditing = false, indirectCostId } = modalData;
  
  // Hooks para datos
  const { data: units = [] } = useUnits();
  const { data: currencies = [] } = useCurrencies();
  const { data: existingIndirectCost } = useIndirectCost(isEditing && indirectCostId ? indirectCostId : null);
  
  // Mutations
  const createIndirectCost = useCreateIndirectCost();
  const updateIndirectCost = useUpdateIndirectCost();

  // Form setup
  const form = useForm<IndirectCostForm>({
    resolver: zodResolver(indirectCostSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      unit_id: '',
      amount: 0,
      currency_id: '',
      valid_from: new Date().toISOString().split('T')[0],
    },
  });

  // Cargar datos existentes si estamos editando
  useEffect(() => {
    if (isEditing && existingIndirectCost) {
      form.reset({
        name: existingIndirectCost.name || '',
        description: existingIndirectCost.description || '',
        category: existingIndirectCost.category || '',
        unit_id: existingIndirectCost.unit_id || '',
        amount: existingIndirectCost.current_value?.amount || 0,
        currency_id: existingIndirectCost.current_value?.currency_id || '',
        valid_from: existingIndirectCost.current_value?.valid_from || new Date().toISOString().split('T')[0],
      });
    }
  }, [existingIndirectCost, form, isEditing]);

  // Prepare options for comboboxes
  const unitOptions = units.map(unit => ({
    value: unit.id,
    label: `${unit.name} (${unit.symbol})`
  }));

  const currencyOptions = currencies.map(currency => ({
    value: currency.id,
    label: `${currency.name} (${currency.symbol})`
  }));

  // Submit handler
  const handleSubmit = async (data: IndirectCostForm) => {
    try {
      const indirectCostData = {
        organization_id: organizationId,
        name: data.name,
        description: data.description || undefined,
        category: data.category || undefined,
        unit_id: data.unit_id || undefined,
        is_active: true,
      };

      const valueData = (data.amount !== undefined && data.currency_id) ? {
        indirect_cost_id: indirectCostId || '', // Se asignará en el hook
        amount: data.amount,
        currency_id: data.currency_id,
        valid_from: data.valid_from || new Date().toISOString().split('T')[0],
      } : undefined;

      if (isEditing && indirectCostId) {
        await updateIndirectCost.mutateAsync({
          indirectCostId,
          indirectCost: indirectCostData,
          newValue: valueData,
        });
      } else {
        await createIndirectCost.mutateAsync({
          indirectCost: indirectCostData,
          initialValue: valueData,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Información Básica</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Gastos Generales"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción detallada del costo indirecto..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Administrativos, Operativos"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <FormControl>
                  <ComboBox
                    options={unitOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar unidad..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Valor Inicial */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Valor Inicial (Opcional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <FormControl>
                    <ComboBox
                      options={currencyOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Seleccionar moneda..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="valid_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Válido desde</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Costo Indirecto" : "Nuevo Costo Indirecto"}
      icon={DollarSign}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Crear"}
      onRightClick={form.handleSubmit(handleSubmit)}
      submitDisabled={createIndirectCost.isPending || updateIndirectCost.isPending}
      showLoadingSpinner={createIndirectCost.isPending || updateIndirectCost.isPending}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      onClose={onClose}
    />
  );
}