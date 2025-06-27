import { useState } from 'react';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface NewAdminOrganizationModalProps {
  open: boolean;
  onClose: () => void;
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

export function NewAdminOrganizationModal({ open, onClose }: NewAdminOrganizationModalProps) {
  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [planId, setPlanId] = useState<string>('');
  const [isActive, setIsActive] = useState<string>('true');
  const [isSystem, setIsSystem] = useState<string>('false');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: plans } = usePlans();

  const createOrganizationMutation = useMutation({
    mutationFn: async (organizationData: {
      name: string;
      created_at: string;
      plan_id: string;
      is_active: boolean;
      is_system: boolean;
    }) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('organizations')
        .insert([organizationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Organización creada",
        description: "La organización se ha creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la organización. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!name.trim() || !planId) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    createOrganizationMutation.mutate({
      name: name.trim(),
      created_at: selectedDate.toISOString(),
      plan_id: planId,
      is_active: isActive === 'true',
      is_system: isSystem === 'true'
    });
  };

  const handleClose = () => {
    setName('');
    setSelectedDate(new Date());
    setPlanId('');
    setIsActive('true');
    setIsSystem('false');
    onClose();
  };

  const header = (
    <CustomModalHeader
      title="Nueva Organización"
      description="Crear una nueva organización en el sistema"
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
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plan" />
            </SelectTrigger>
            <SelectContent>
              {plans?.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} ({plan.max_projects} proyectos, {plan.max_members} miembros)
                </SelectItem>
              ))}
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
      saveText="Crear Organización"
      isLoading={createOrganizationMutation.isPending}
    />
  );

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{ header, body, footer }}
    </CustomModalLayout>
  );
}