import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

import { useToast } from "@/hooks/use-toast";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { Step1UserData } from "@/components/onboarding/Step1UserData";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, initialized, setCompletingOnboarding } = useAuthStore();
  const { data: userData, isLoading: userLoading } = useCurrentUser();

  const { toast } = useToast();
  const { setTheme } = useThemeStore();
  const { 
    formData, 
    updateFormData, 
    resetOnboarding
  } = useOnboardingStore();

  // Basic auth check without onboarding redirection
  if (!initialized || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AuthModal open={true} onOpenChange={() => {}} />
      </div>
    );
  }

  // Initialize form data with existing user data if available
  useEffect(() => {
    if (userData && !userLoading) {
      updateFormData({
        first_name: userData.user_data?.first_name || '',
        last_name: userData.user_data?.last_name || '',
        organization_name: userData.organization?.name || '',
        theme: (userData.preferences?.theme === 'dark' ? 'dark' : 'light'),
        last_user_type: userData.preferences?.last_user_type || null,
      });
    }
  }, [userData, userLoading, updateFormData]);

  const handleFinishOnboarding = () => {
    saveOnboardingMutation.mutate();
  };

  // Mutation to save all onboarding data
  const saveOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.user?.id) throw new Error('Usuario no encontrado');

      const userId = userData.user.id;

      if (!supabase) throw new Error('Supabase no está configurado');

      // Update user_data table  
      const { error: userDataError } = await supabase
        .from('user_data')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          country: formData.country || null,
          birthdate: formData.birthdate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (userDataError) throw userDataError;

      // Update user_preferences table
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .update({
          theme: formData.theme,
          last_user_type: formData.last_user_type,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (preferencesError) {
        console.error('Error updating user preferences:', preferencesError);
        throw preferencesError;
      }

      // Update organization name if provided
      if (formData.organization_name && userData.organization?.id) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({
            name: formData.organization_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userData.organization.id);

        if (orgError) throw orgError;
      }



      // Apply theme immediately
      setTheme(formData.theme === 'dark');

      return { success: true };
    },
    onMutate: async () => {
      // Set flag to prevent AuthRedirect interference during onboarding completion
      setCompletingOnboarding(true);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/current-user'] });
      
      // Optimistically update cache immediately
      queryClient.setQueryData(['/api/current-user'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          preferences: {
            ...oldData.preferences,
            onboarding_completed: true
          }
        };
      });
    },
    onSuccess: () => {
      // Toast removed per user request
      
      // Navigate immediately without delay
      navigate('/select-mode');
      resetOnboarding();
    },
    onError: (error) => {
      console.error('Error saving onboarding data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración. Intenta nuevamente.",
      });
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">Cargando...</p>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    return <Step1UserData onFinish={handleFinishOnboarding} />;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header with step indicator */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            ¡Bienvenido a Archub!
          </h1>
          

        </div>

        {/* Current step content */}
        {renderCurrentStep()}
      </div>
    </div>
  );
}