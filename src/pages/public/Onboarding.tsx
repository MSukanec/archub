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
import { useNavigationStore } from "@/stores/navigationStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { Step1UserData } from "@/components/onboarding/Step1UserData";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, initialized, setCompletingOnboarding } = useAuthStore();
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();

  const { toast } = useToast();
  const { setTheme } = useThemeStore();
  const { 
    formData, 
    updateFormData, 
    resetOnboarding
  } = useOnboardingStore();

  // Basic auth check without onboarding redirection
  if (!initialized || authLoading) {
    return <LoadingSpinner fullScreen size="lg" />;
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

      // Update user_preferences table - always set to professional mode
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .update({
          theme: formData.theme,
          last_user_type: 'professional', // Always set to professional by default
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (preferencesError) {
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
      // Set bypass flags for immediate access
      localStorage.setItem('onboarding_bypass', 'true');
      localStorage.setItem('onboarding_bypass_user_id', userData?.user?.id || '');
      
      // Set sidebar to general level (hub mode)
      setSidebarLevel('general');
      
      // Navigate directly to Home page
      navigate('/home');
      resetOnboarding();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración. Intenta nuevamente.",
      });
    },
  });

  if (userLoading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  const renderCurrentStep = () => {
    return <Step1UserData onFinish={handleFinishOnboarding} />;
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--main-sidebar-bg)' }}>
      {/* Left Panel - Dark */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative">
        <div className="max-w-md space-y-8 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/Seencel512.png" 
              alt="Seencel Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold !text-white">
              ¡Estás a un paso de
              <br />
              <span style={{ color: 'var(--accent)' }}>Comenzar!</span>
            </h1>
            <p className="text-base !text-gray-400">
              Completa tu perfil para personalizar tu experiencia en Seencel.
              Solo te tomará un momento.
            </p>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 pt-8">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Light */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="w-full flex-1 flex items-stretch p-4 lg:p-6">
          <div className="w-full h-full flex flex-col rounded-3xl px-6 lg:px-16 py-6" style={{ backgroundColor: 'var(--layout-bg)' }}>
            {/* Logo mobile */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 lg:hidden">
                <img 
                  src="/Seencel512.png" 
                  alt="Seencel Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>

            {/* Form Content - Centered vertically */}
            <div className="flex-1 flex items-center justify-center">
              {renderCurrentStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}