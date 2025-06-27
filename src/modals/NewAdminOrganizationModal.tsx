import { useState, useEffect } from 'react';
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout';
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader';
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody';
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface NewAdminOrganizationModalProps {
  open: boolean;
  onClose: () => void;
  organization?: {
    id: string;
    name: string;
    created_at: string;
    is_active: boolean;
    is_system: boolean;
    plan_id: string;
    created_by: string;
  } | null;
}

// Hook para obtener planes disponibles
function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('plans')
        .select('id, name, max_projects, max_members')
        .order('name');

      if (error) throw error;
      return data;
    }
  });
}

// Hook para buscar usuarios
function useUsersSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['users-search', searchTerm],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      if (searchTerm.length < 3) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 3
  });
}

// Hook para obtener información de un usuario específico
function useUserById(userId: string) {
  return useQuery({
    queryKey: ['user-by-id', userId],
    queryFn: async () => {
      if (!supabase || !userId) throw new Error('Supabase not initialized or no user ID');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });
}

export function NewAdminOrganizationModal({ open, onClose, organization }: NewAdminOrganizationModalProps) {
  const [name, setName] = useState(organization?.name || '');
  const [selectedDate, setSelectedDate] = useState<Date>(organization ? new Date(organization.created_at) : new Date());
  const [planId, setPlanId] = useState<string>(organization?.plan_id || '');
  const [createdBy, setCreatedBy] = useState<string>(organization?.created_by || '');
  const [isActive, setIsActive] = useState<string>(organization ? organization.is_active.toString() : 'true');
  const [isSystem, setIsSystem] = useState<string>(organization ? organization.is_system.toString() : 'false');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; full_name: string; email: string } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: plans } = usePlans();
  const { data: searchedUsers = [] } = useUsersSearch(userSearchTerm);
  const { data: currentCreator } = useUserById(organization?.created_by || '');

  // Debug plans data
  useEffect(() => {
    if (plans) {
      console.log('Plans loaded:', plans);
      console.log('Current planId:', planId);
      const foundPlan = plans.find(p => p.id === planId);
      console.log('Found plan for current planId:', foundPlan);
    }
  }, [plans, planId]);

  // Set initial values when organization is provided
  useEffect(() => {
    if (organization && plans && plans.length > 0) {
      console.log('Setting initial organization values:', organization);
      console.log('Plans available:', plans);
      
      // Verify the plan exists in the plans array
      const planExists = plans.find(p => p.id === organization.plan_id);
      console.log('Plan exists in array:', planExists);
      
      setName(organization.name || '');
      setSelectedDate(new Date(organization.created_at));
      setPlanId(organization.plan_id || '');
      setCreatedBy(organization.created_by || '');
      setIsActive(organization.is_active.toString());
      setIsSystem(organization.is_system.toString());
      console.log('Plan ID set to:', organization.plan_id);
      console.log('Created by set to:', organization.created_by);
    }
  }, [organization, plans]);

  // Set creator information when currentCreator data is loaded
  useEffect(() => {
    if (currentCreator && organization?.created_by) {
      console.log('Setting creator info:', currentCreator);
      setSelectedUser(currentCreator);
      setUserSearchTerm(currentCreator.full_name || currentCreator.email);
    }
  }, [currentCreator, organization?.created_by]);

  const saveOrganizationMutation = useMutation({
    mutationFn: async (organizationData: {
      name: string;
      created_at: string;
      plan_id: string;
      created_by: string;
      is_active: boolean;
      is_system: boolean;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      if (organization) {
        // Update existing organization
        const { data, error } = await supabase
          .from('organizations')
          .update(organizationData)
          .eq('id', organization.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new organization
        const { data, error } = await supabase
          .from('organizations')
          .insert([organizationData])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: organization ? "Organización actualizada" : "Organización creada",
        description: organization 
          ? "La organización se ha actualizado exitosamente."
          : "La organización se ha creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Error saving organization:', error);
      toast({
        title: "Error",
        description: organization 
          ? "No se pudo actualizar la organización. Inténtalo de nuevo."
          : "No se pudo crear la organización. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!name.trim() || !planId || !createdBy) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    saveOrganizationMutation.mutate({
      name: name.trim(),
      created_at: selectedDate.toISOString(),
      plan_id: planId,
      created_by: createdBy,
      is_active: isActive === 'true',
      is_system: isSystem === 'true'
    });
  };

  const handleClose = () => {
    // Only reset if not editing an organization
    if (!organization) {
      setName('');
      setSelectedDate(new Date());
      setPlanId('');
      setCreatedBy('');
      setSelectedUser(null);
      setUserSearchTerm('');
      setIsActive('true');
      setIsSystem('false');
    }
    onClose();
  };

  const header = (
    <CustomModalHeader
      title={organization ? "Editar Organización" : "Nueva Organización"}
      description={organization ? "Modificar los datos de la organización" : "Crear una nueva organización en el sistema"}
      onClose={handleClose}
    />
  );

  const body = (
    <CustomModalBody padding="md">
      <div className="space-y-4">
        {/* Fecha de creación */}
        <div className="space-y-2">
          <Label htmlFor="created_at" className="required-asterisk">
            Fecha de creación
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Creador */}
        <div className="space-y-2">
          <Label className="required-asterisk">Creador</Label>
          <div className="relative">
            <Input
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Buscar usuario (mínimo 3 caracteres)..."
              className="pr-8"
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          {userSearchTerm.length >= 3 && searchedUsers.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {searchedUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setCreatedBy(user.id);
                    setUserSearchTerm(user.full_name || user.email);
                  }}
                  className="p-2 hover:bg-accent cursor-pointer flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-[var(--accent-bg)] rounded-full flex items-center justify-center text-xs">
                    <User className="w-3 h-3" />
                  </div>
                  <div className="text-sm">
                    {user.full_name || user.email}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedUser && (
            <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-md">
              <div className="w-6 h-6 bg-[var(--accent-bg)] rounded-full flex items-center justify-center text-xs">
                <User className="w-3 h-3" />
              </div>
              <span className="text-sm">{selectedUser.full_name || selectedUser.email}</span>
            </div>
          )}
        </div>

        {/* Nombre de la organización */}
        <div className="space-y-2">
          <Label htmlFor="name" className="required-asterisk">
            Nombre de la organización
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ingresa el nombre de la organización"
          />
        </div>

        {/* Plan */}
        <div className="space-y-2">
          <Label className="required-asterisk">Plan</Label>
          <Select value={planId} onValueChange={(value) => {
            console.log('Plan selection changed to:', value);
            setPlanId(value);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plan" />
            </SelectTrigger>
            <SelectContent>
              {plans?.map((plan) => {
                console.log('Rendering plan option:', plan.id, plan.name, 'Current planId:', planId);
                return (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({plan.max_projects} proyectos, {plan.max_members} miembros)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Activa</SelectItem>
              <SelectItem value="false">Inactiva</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={isSystem} onValueChange={setIsSystem}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Regular</SelectItem>
              <SelectItem value="true">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CustomModalBody>
  );

  const footer = (
    <CustomModalFooter
      onCancel={handleClose}
      onSave={handleSubmit}
      saveText={organization ? "Actualizar Organización" : "Crear Organización"}
    />
  );

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{ header, body, footer }}
    </CustomModalLayout>
  );
}