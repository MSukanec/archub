import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePersonnelAttendance, type UpdateAttendanceParams } from '../services/updatePersonnelAttendance';
import { toast } from '@/hooks/use-toast';
export function useUpdatePersonnelAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: UpdateAttendanceParams) => updatePersonnelAttendance(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-attendance'] });
      toast({
        title: 'Asistencia actualizada',
        description: 'La asistencia se ha actualizado correctamente',
      });
    },
    onError: (error) => {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la asistencia',
        variant: 'destructive',
      });
    },
  });
}
