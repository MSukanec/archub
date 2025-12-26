import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FormModalHeader } from '@/components/modal';
import { FormModalFooter } from '@/components/modal';
import { FormModalLayout } from '@/components/modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupportConversationStartForm } from '../forms/AdminSupportConversationStartForm';
interface SupportConversationStartModalProps {
  modalData?: {};
  onClose: () => void;
}
export function AdminSupportConversationStartModal({ onClose }: SupportConversationStartModalProps) {
  const {
    form,
    users,
    onSubmit,
    isSubmitting,
  } = useSupportConversationStartForm({ onClose });
  const handleClose = () => {
    form.reset();
    onClose();
  };
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Escribe tu mensaje aquí..."
                  className="min-h-[120px] resize-none"
                  maxLength={2000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
  const headerContent = (
    <FormModalHeader 
      title="Iniciar Conversación"
      description="Envía un mensaje a un usuario para iniciar una nueva conversación de soporte."
      icon={MessageSquarePlus}
    />
  );
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel="Enviar Mensaje"
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitDisabled={isSubmitting}
    />
  );
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
