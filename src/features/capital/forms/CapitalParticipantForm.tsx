import React, { useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IdentityBadge } from '@/components/shared/IdentityBadge';
import { capitalKeys } from '@/core/query-keys';

const partnerSchema = z.object({
  contactId: z.string().min(1, 'Debe seleccionar un contacto'),
  notes: z.string().optional(),
  ownershipPercentage: z.union([
    z.string().transform((val) => val === '' ? null : parseFloat(val)),
    z.number(),
    z.null(),
  ]).refine((val) => val === null || (val >= 0 && val <= 100), {
    message: 'El porcentaje debe estar entre 0 y 100',
  }).optional().nullable(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface LinkedUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  linked_user: LinkedUser | LinkedUser[] | null;
}

export interface CapitalParticipantFormProps {
  organizationId?: string;
  partnerId?: string;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
  hideActions?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

export function CapitalParticipantForm({
  organizationId,
  partnerId,
  mode,
  onSuccess,
  onCancel,
  hideActions = false,
  formRef,
}: CapitalParticipantFormProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const internalFormRef = useRef<HTMLFormElement>(null);
  const actualFormRef = formRef || internalFormRef;

  const orgId = organizationId || userData?.preferences?.last_organization_id;

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: capitalKeys.contactsForPartner(orgId || ''),
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id, 
          first_name, 
          last_name, 
          full_name,
          email,
          company_name,
          linked_user:users!linked_user_id(id, full_name, avatar_url)
        `)
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .order('first_name');

      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: existingPartner, isLoading: partnerLoading } = useQuery({
    queryKey: capitalKeys.partner(partnerId || ''),
    queryFn: async () => {
      if (!partnerId) return null;
      
      const { data, error } = await supabase
        .from('capital_participants')
        .select('id, contact_id, notes, status, ownership_percentage')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!partnerId && mode === 'edit',
  });

  const { data: existingPartnerContactIds = [] } = useQuery<string[]>({
    queryKey: capitalKeys.partnerContactIds(orgId || ''),
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('capital_participants')
        .select('contact_id')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

      if (error) {
        return [];
      }
      return (data || []).map(p => p.contact_id).filter(Boolean);
    },
    enabled: !!orgId && mode === 'create',
  });

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      contactId: existingPartner?.contact_id || '',
      notes: existingPartner?.notes || '',
      ownershipPercentage: existingPartner?.ownership_percentage ?? null,
    },
  });

  React.useEffect(() => {
    if (existingPartner && mode === 'edit') {
      form.reset({
        contactId: existingPartner.contact_id || '',
        notes: existingPartner.notes || '',
        ownershipPercentage: existingPartner.ownership_percentage ?? null,
      });
    }
  }, [existingPartner, mode, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      if (!orgId) throw new Error('No hay organización seleccionada');

      const { data: result, error } = await supabase
        .from('capital_participants')
        .insert({
          organization_id: orgId,
          contact_id: data.contactId,
          notes: data.notes || null,
          status: 'active',
          created_by: userData?.memberships?.[0]?.id || null,
          ownership_percentage: data.ownershipPercentage ?? null,
        })
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capitalKeys.participantsList(orgId || '') });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partnerContactIds(orgId || '') });
      queryClient.invalidateQueries({ queryKey: capitalKeys.kpiList(orgId || '') });
      toast({
        title: 'Socio agregado',
        description: 'El socio ha sido agregado correctamente',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al agregar socio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      if (!partnerId) throw new Error('ID de socio no encontrado');

      const { data: result, error } = await supabase
        .from('capital_participants')
        .update({
          contact_id: data.contactId,
          notes: data.notes || null,
          ownership_percentage: data.ownershipPercentage ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerId)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capitalKeys.participantsList(orgId || '') });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partnerContactIds(orgId || '') });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partner(partnerId || '') });
      queryClient.invalidateQueries({ queryKey: capitalKeys.kpiList(orgId || '') });
      toast({
        title: 'Socio actualizado',
        description: 'Los datos del socio han sido actualizados',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al actualizar socio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: PartnerFormData) => {
    if (mode === 'edit') {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const getContactDisplayName = (contact: Contact): string => {
    const linkedUser = Array.isArray(contact.linked_user) 
      ? contact.linked_user[0] 
      : contact.linked_user;
    
    return contact.full_name || 
           `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
           linkedUser?.full_name || 
           contact.company_name || 
           contact.email ||
           'Sin nombre';
  };

  const contactOptions = useMemo(() => {
    if (!contacts || !Array.isArray(contacts)) return [];
    
    // In create mode, filter out contacts that are already partners
    const availableContacts = mode === 'create' 
      ? contacts.filter(contact => !existingPartnerContactIds.includes(contact.id))
      : contacts;
    
    return availableContacts.map(contact => ({
      value: contact.id,
      label: getContactDisplayName(contact),
      contact, // Include full contact object for rendering
    }));
  }, [contacts, existingPartnerContactIds, mode]);

  const renderContactOption = (option: any) => {
    const contact = option.contact as Contact;
    const displayName = getContactDisplayName(contact);
    
    return (
      <IdentityBadge 
        name={displayName}
        linkedUser={contact.linked_user}
        size="sm"
      />
    );
  };

  const isLoading = contactsLoading || partnerLoading || createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form 
        ref={actualFormRef}
        onSubmit={form.handleSubmit(handleSubmit)} 
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="contactId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contacto <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={contactOptions}
                  placeholder="Seleccionar contacto..."
                  searchPlaceholder="Buscar contacto..."
                  emptyMessage="No se encontraron contactos."
                  className="w-full"
                  disabled={contactsLoading}
                  data-testid="combobox-contact"
                  renderOption={renderContactOption}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ownershipPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Porcentaje societario (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ej: 25.5"
                  value={field.value === null || field.value === undefined ? '' : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? null : parseFloat(val));
                  }}
                  data-testid="input-ownership-percentage"
                />
              </FormControl>
              <FormDescription>
                Participación acordada del socio en la sociedad
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Notas adicionales sobre el socio..."
                  className="resize-none"
                  rows={3}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!hideActions && (
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Agregar Socio'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
export const PartnerFormFields = CapitalParticipantForm;
