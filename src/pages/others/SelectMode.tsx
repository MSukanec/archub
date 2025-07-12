import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useToast } from "@/hooks/use-toast";
import { Step4SelectMode } from "@/components/onboarding/Step4SelectMode";

export default function SelectMode() {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // Mutation for updating user type
  const updateUserTypeMutation = useMutation({
    mutationFn: async (userType: string) => {
      if (!userData?.user?.id) throw new Error('Usuario no encontrado');
      if (!supabase) throw new Error('Supabase no está configurado');

      const { error } = await supabase
        .from('user_preferences')
        .update({
          last_user_type: userType,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userData.user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      console.log('User type updated successfully, navigating to dashboard');
      toast({
        title: "Modo actualizado",
        description: "Tu modo de uso se ha actualizado correctamente.",
      });
      
      // Navigate to dashboard
      setSidebarContext('organization');
      navigate('/organization/dashboard');
    },
    onError: (error) => {
      console.error('Error updating user type:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el modo. Intenta nuevamente.",
      });
    },
  });

  const handleModeSelect = (modeType: string) => {
    console.log('SelectMode - Processing mode selection:', modeType);
    setSelectedMode(modeType);
  };

  const handleFinish = () => {
    if (selectedMode) {
      updateUserTypeMutation.mutate(selectedMode);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Elegir modo de uso
          </h1>
        </div>

        {/* Mode selection */}
        <Step4SelectMode 
          isOnboarding={false}
          onFinish={(modeType: string) => {
            console.log('SelectMode - Received mode selection:', modeType);
            updateUserTypeMutation.mutate(modeType);
          }}
          isLoading={updateUserTypeMutation.isPending}
        />
      </div>
    </div>
  );
}