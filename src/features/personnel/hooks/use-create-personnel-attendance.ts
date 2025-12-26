import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPersonnelAttendance, type CreatePersonnelAttendanceData } from '../services/createPersonnelAttendance';
import { toast } from '@/hooks/use-toast';

export function useCreatePersonnelAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePersonnelAttendanceData) => createPersonnelAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-attendance'] });
      toast({
        title: 'Asistencia registrada',
        description: 'La asistencia se ha registrado correctamente',
      });
    },
    onError: (error) => {
      console.error('Error creating attendance:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la asistencia',
        variant: 'destructive',
      });
    },
  });
}
