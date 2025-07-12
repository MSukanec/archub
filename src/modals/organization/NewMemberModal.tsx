import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, User, Calendar, UserCheck } from "lucide-react";

import { CustomModalLayout } from "@/components/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/modal/CustomModalFooter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const memberSchema = z.object({
  email: z.string().email("Debe ser un email válido"),
  role_id: z.string().min(1, "Debe seleccionar un rol"),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface NewMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewMemberModal({ open, onClose }: NewMemberModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: "",
      role_id: "",
    },
  });

  // Fetch available roles (only ORGANIZATION type)
  const { data: roles = [] } = useQuery({
    queryKey: ['organization-roles'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, type')
        .eq('type', 'organization')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (memberData: MemberFormData) => {
      if (!supabase || !userData?.organization?.id) {
        throw new Error('No organization selected');
      }

      // First, check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', memberData.email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (existingUser) {
        // User exists, add to organization
        const { data, error } = await supabase
          .from('organization_members')
          .insert({
            user_id: existingUser.id,
            organization_id: userData.organization.id,
            role_id: memberData.role_id,
            is_active: true,
            joined_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // User doesn't exist, send invitation (would require invitation system)
        throw new Error('El usuario no existe en el sistema. Primero debe registrarse.');
      }
    },
    onSuccess: () => {
      toast({
        title: "Miembro agregado",
        description: "El miembro ha sido agregado exitosamente a la organización.",
      });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al agregar el miembro",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: MemberFormData) => {
    setIsLoading(true);
    try {
      await inviteMemberMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title="Agregar Miembro"
            description="Invita a un nuevo miembro a la organización"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1} padding="md">
            <Form {...form}>
              <form id="member-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Email del Usuario</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="usuario@ejemplo.com"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required-asterisk">Rol</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {userData?.user && (
                  <div className="space-y-2">
                    <FormLabel>Invitado por</FormLabel>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userData.user.avatar_url} />
                        <AvatarFallback>
                          {userData.user.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{userData.user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{userData.user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSubmit={() => form.handleSubmit(handleSubmit)()}
            submitText="Agregar Miembro"
            cancelText="Cancelar"
            isLoading={isLoading}
            form="member-form"
          />
        ),
      }}
    </CustomModalLayout>
  );
}