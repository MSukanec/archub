import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useThemeStore } from "@/stores/themeStore";
import { Step1UserData } from "@/pages/onboarding/Step1UserData";
import { Step2FinancialSetup } from "@/pages/onboarding/Step2FinancialSetup";
import { Step3Discovery } from "@/pages/onboarding/Step3Discovery";

export default function SelectMode() {
  const [, navigate] = useLocation();
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { toast } = useToast();
  const { setTheme } = useThemeStore();
  const { 
    currentStep, 
    totalSteps, 
    formData, 
    updateFormData, 
    resetOnboarding, 
    setCurrentStep 
  } = useOnboardingStore();

  // Determine if this is onboarding (user hasn't completed it) or just mode change
  const isOnboarding = !userData?.preferences?.onboarding_completed;

  // Initialize form data with existing user data if available
  useEffect(() => {
    if (userData && !userLoading) {
      updateFormData({
        first_name: userData.user_data?.first_name || '',
        last_name: userData.user_data?.last_name || '',
        country: userData.user_data?.country || '',
        birthdate: userData.user_data?.birthdate || '',
        organization_name: userData.organization?.name || '',
        theme: (userData.preferences?.theme === 'dark' ? 'dark' : 'light'),
        discovered_by: userData.user_data?.discovered_by || '',
        discovered_by_other_text: userData.user_data?.discovered_by_other_text || '',
        last_user_type: userData.preferences?.last_user_type || null,
        default_currency_id: '',
        secondary_currency_ids: [],
        default_wallet_id: '',
        secondary_wallet_ids: [],
      });

      // If not onboarding (user completed it), skip to step 4 (mode selection only)
      if (!isOnboarding) {
        setCurrentStep(4);
      } else {
        // If onboarding and has existing data, skip appropriate steps
        if (userData.user_data?.first_name && userData.user_data?.last_name) {
          if (userData.user_data?.discovered_by) {
            setCurrentStep(4); // Skip to mode selection
          } else {
            setCurrentStep(3); // Skip to discovery step
          }
        } else {
          setCurrentStep(1); // Start from beginning
        }
      }
    }
  }, [userData, userLoading, isOnboarding, updateFormData, setCurrentStep]);

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
          discovered_by: formData.discovered_by,
          discovered_by_other_text: formData.discovered_by_other_text || null,
          main_use: formData.main_use || null,
          user_role: formData.user_role || null,
          user_role_other: formData.user_role_other || null,
          team_size: formData.team_size || null,
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

      if (preferencesError) throw preferencesError;

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

      // Save financial preferences if provided
      if (formData.default_currency_id && userData.organization?.id) {
        // Save organization preferences
        const { error: orgPrefError } = await supabase
          .from('organization_preferences')
          .upsert({
            organization_id: userData.organization.id,
            default_currency_id: formData.default_currency_id,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id' });

        if (orgPrefError) throw orgPrefError;

        // Save organization currencies
        if (formData.default_currency_id) {
          const { error: currencyError } = await supabase
            .from('organization_currencies')
            .upsert({
              organization_id: userData.organization.id,
              currency_id: formData.default_currency_id,
              is_default: true,
            }, { onConflict: 'organization_id,currency_id' });

          if (currencyError) throw currencyError;
        }

        // Save secondary currencies
        for (const currencyId of formData.secondary_currency_ids) {
          const { error: secCurrencyError } = await supabase
            .from('organization_currencies')
            .upsert({
              organization_id: userData.organization.id,
              currency_id: currencyId,
              is_default: false,
            }, { onConflict: 'organization_id,currency_id' });

          if (secCurrencyError) throw secCurrencyError;
        }

        // Save organization wallets
        if (formData.default_wallet_id) {
          const { error: walletError } = await supabase
            .from('organization_wallets')
            .upsert({
              organization_id: userData.organization.id,
              wallet_id: formData.default_wallet_id,
              is_default: true,
            }, { onConflict: 'organization_id,wallet_id' });

          if (walletError) throw walletError;
        }

        // Save secondary wallets
        for (const walletId of formData.secondary_wallet_ids) {
          const { error: secWalletError } = await supabase
            .from('organization_wallets')
            .upsert({
              organization_id: userData.organization.id,
              wallet_id: walletId,
              is_default: false,
            }, { onConflict: 'organization_id,wallet_id' });

          if (secWalletError) throw secWalletError;
        }
      }

      // Apply theme immediately
      setTheme(formData.theme === 'dark');

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({
        title: "¡Bienvenido a Archub!",
        description: "Tu configuración se ha guardado exitosamente.",
      });
      
      // Redirect to organization dashboard after successful onboarding
      setSidebarContext('organization');
      navigate('/organization/dashboard');
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

  // Mutation for simple mode change (when not onboarding)
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

  const handleFinishOnboarding = () => {
    console.log('handleFinishOnboarding called', { 
      isOnboarding, 
      last_user_type: formData.last_user_type,
      currentStep,
      hasUserData: !!userData?.user_data?.first_name 
    });
    
    // Si el usuario está en el paso 4 pero ya tiene datos básicos (nombre, discovery), 
    // solo actualizar el tipo de usuario, no hacer onboarding completo
    if (currentStep === 4 && userData?.user_data?.first_name && userData?.user_data?.discovered_by) {
      console.log('User has basic data, just updating user type');
      if (formData.last_user_type) {
        updateUserTypeMutation.mutate(formData.last_user_type);
      }
    } else if (isOnboarding) {
      console.log('Running full onboarding save');
      saveOnboardingMutation.mutate();
    } else {
      console.log('Just updating user type');
      if (formData.last_user_type) {
        updateUserTypeMutation.mutate(formData.last_user_type);
      }
    }
  };

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
    switch (currentStep) {
      case 1:
        return <Step1UserData />;
      case 2:
        return <Step2FinancialSetup />;
      case 3:
        return <Step3Discovery />;
      case 4:
        return (
          <Card className="w-full max-w-2xl mx-auto bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 rounded-lg bg-[var(--accent)] text-white">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Elegir modo de uso</CardTitle>
              <CardDescription className="text-base">
                Elige cómo planeas usar Archub para personalizar tu experiencia. Luego puedes cambiarlo.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card
                  className="bg-[var(--card-bg)] border-[var(--card-border)] cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-300 transform"
                  onClick={() => {
                    if (!saveOnboardingMutation.isPending && !updateUserTypeMutation.isPending) {
                      updateFormData({ last_user_type: 'professional' });
                      handleFinishOnboarding();
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-[var(--accent)] text-white">
                        <Building className="h-5 w-5" />
                      </div>
                      {(saveOnboardingMutation.isPending || updateUserTypeMutation.isPending) && (
                        <div className="flex items-center text-blue-600 dark:text-blue-400">
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          <span className="text-xs font-medium">Guardando...</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg font-semibold">Profesional</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm leading-relaxed">
                      Gestiona proyectos completos con equipos, presupuestos, cronogramas y documentación técnica
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return <Step1UserData />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header with step indicator */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            {isOnboarding ? "¡Bienvenido a Archub!" : "Elegir modo de uso"}
          </h1>
          
          {isOnboarding && currentStep < 4 && (
            <div className="flex items-center justify-center space-x-2 mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Paso {currentStep} de {totalSteps}
              </p>
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }, (_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      index + 1 <= currentStep 
                        ? 'bg-[var(--accent)]' 
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current step content */}
        {renderCurrentStep()}
      </div>
    </div>
  );
}