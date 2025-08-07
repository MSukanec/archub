
import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";
import { Building, Package, Hammer, Eye, CheckCircle, Loader2 } from "lucide-react";
import { HelpPopover } from "@/components/ui-custom/HelpPopover";

interface ModeOption {
  type: 'professional' | 'provider' | 'worker' | 'visitor';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const modeOptions: ModeOption[] = [
  {
    type: "professional",
    title: "Profesional",
    description: "Gestiona proyectos completos con equipos, presupuestos, cronogramas y documentación técnica",
    icon: Building,
    color: "bg-[var(--accent)]"
  },
  {
    type: "provider",
    title: "Proveedor de Materiales",
    description: "Administra catálogo de productos, cotizaciones y seguimiento de entregas a obras",
    icon: Package,
    color: "bg-[var(--accent)]"
  },
  {
    type: "worker",
    title: "Mano de Obra",
    description: "Registra avances, reporta incidencias y coordina tareas con el equipo del proyecto",
    icon: Hammer,
    color: "bg-[var(--accent)]"
  },
  {
    type: "visitor",
    title: "Solo Exploración",
    description: "Explora las funcionalidades sin comprometerte con datos de proyectos reales",
    icon: Eye,
    color: "bg-[var(--accent)]"
  }
];

function getHelpDescription(type: string): string {
  switch (type) {
    case 'professional':
      return 'Modo ideal para arquitectos, ingenieros, constructoras y estudios. Incluye gestión completa de proyectos, equipos, presupuestos, cronogramas y documentación técnica profesional. Puedes cambiar el modo después.';
    case 'provider':
      return 'Diseñado para empresas proveedoras de materiales y equipos. Permite gestionar catálogos, enviar cotizaciones, rastrear entregas y coordinar con múltiples obras simultáneamente.';
    case 'worker':
      return 'Perfecto para contratistas, maestros de obra y trabajadores independientes. Facilita el registro de avances, reporte de incidencias y coordinación de tareas dentro del equipo.';
    case 'visitor':
      return 'Modo de exploración sin compromiso. Ideal para conocer Archub antes de decidir qué funcionalidades necesitas para tu trabajo específico.';
    default:
      return 'Selecciona el modo que mejor se adapte a tu tipo de trabajo en la construcción.';
  }
}

export default function SelectMode() {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { setCompletingOnboarding } = useAuthStore();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [hasFinished, setHasFinished] = useState(false);



  // Mutation for updating user type
  const updateUserTypeMutation = useMutation({
    mutationFn: async (userType: string) => {
      if (!userData?.user?.id) throw new Error('Usuario no encontrado');
      if (!supabase) throw new Error('Supabase no está configurado');

      // Update both last_user_type and onboarding_completed to ensure complete flow
      console.log('SelectMode: Updating DB with onboarding_completed = true for user:', userData.user.id);
      const { error, data } = await supabase
        .from('user_preferences')
        .update({
          last_user_type: userType,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userData.user.id)
        .select();

      console.log('SelectMode: DB update result:', { data, error });
      if (error) throw error;
      return { success: true };
    },
    onMutate: async (userType: string) => {
      // Set the flag to prevent redirects
      setCompletingOnboarding(true);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/current-user'] });

      // Snapshot previous value
      const previousUserData = queryClient.getQueryData(['/api/current-user']);

      // Optimistically update to the new value
      queryClient.setQueryData(['/api/current-user'], (oldData: any) => {
        if (!oldData) return oldData;
        console.log('SelectMode: Setting optimistic onboarding_completed = true');
        return {
          ...oldData,
          preferences: {
            ...oldData.preferences,
            last_user_type: userType,
            onboarding_completed: true
          }
        };
      });

      return { previousUserData };
    },
    onSuccess: async () => {
      console.log('SelectMode: SUCCESS - Forcing RPC refresh to get updated onboarding status');
      
      // Force cache invalidation
      await queryClient.invalidateQueries({ queryKey: ['/api/current-user'] });
      
      // Force refetch with refresh parameter to ensure RPC returns fresh data  
      // Get the current Supabase session to get the correct token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (token) {
        await queryClient.fetchQuery({ 
          queryKey: ['/api/current-user'], 
          queryFn: () => fetch('/api/current-user?refresh=true', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then(res => res.json())
        });
      } else {
        console.warn('SelectMode: No valid session token found, skipping refresh');
      }
      
      // Set the bypass flag
      console.log('SelectMode: Completed onboarding, preventing future redirects');
      localStorage.setItem('onboarding_bypass', 'true');
      
      // Navigate immediately with React Router
      setSidebarContext('organization');
      navigate('/organization/dashboard');
      
      console.log('SelectMode: Navigation completed with fresh user data');
    },
    onError: (err, userType, context) => {
      // Reset the flag on error
      setCompletingOnboarding(false);
      
      // Rollback on error
      if (context?.previousUserData) {
        queryClient.setQueryData(['/api/current-user'], context.previousUserData);
      }
      console.error('Error updating user type:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el modo. Intenta nuevamente.",
      });
    },
    onSettled: () => {
      // No need for delayed invalidation since we handle it in onSuccess
      console.log('SelectMode: Mutation settled');
    },
  });

  const handleModeSelect = (modeType: string) => {
    // Prevenir múltiples clics
    if (hasFinished || updateUserTypeMutation.isPending) {
      console.log('SelectMode - Preventing duplicate click', { hasFinished, isLoading: updateUserTypeMutation.isPending });
      return;
    }
    
    console.log('SelectMode - Processing mode selection:', modeType);
    console.log('SelectMode - Setting completingOnboarding = true BEFORE mutation');
    setCompletingOnboarding(true);
    setHasFinished(true);
    setSelectedMode(modeType);
    
    // Ejecutar directamente la mutación
    updateUserTypeMutation.mutate(modeType);
  };



  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Mode selection card */}
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
              {modeOptions.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.type;
                const isAvailable = mode.type === 'professional'; // Solo profesional está disponible
                const isLoading = updateUserTypeMutation.isPending;
                
                const cardContent = (
                  <Card
                    key={mode.type}
                    className={`
                      bg-[var(--card-bg)] border-[var(--card-border)]
                      ${isAvailable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-not-allowed opacity-60'}
                      transition-all duration-300 transform
                      ${isSelected ? 'ring-2 ring-[var(--accent)]' : ''}
                      ${isLoading ? 'opacity-75' : ''}
                    `}
                    onClick={() => isAvailable && !isLoading && !hasFinished && handleModeSelect(mode.type)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${mode.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {(isLoading || hasFinished) && isSelected && (
                          <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            <span className="text-xs font-medium">Guardando...</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                          {mode.title}
                        </CardTitle>
                        <HelpPopover
                          title={`Modo ${mode.title}`}
                          description={getHelpDescription(mode.type)}
                          primaryActionText="Entendido"
                          placement="top"
                          iconSize={16}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        {mode.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );

                if (!isAvailable) {
                  return (
                    <CustomRestricted key={mode.type} reason="coming_soon">
                      {cardContent}
                    </CustomRestricted>
                  );
                }

                return cardContent;
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}