import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

interface ModeOption {
  type: 'professional' | 'learner' | 'provider' | 'worker' | 'visitor';
  title: string;
  description: string;
  number: string;
}

const modeOptions: ModeOption[] = [
  {
    type: "professional",
    title: "Profesional",
    description: "Gestiona proyectos completos con equipos, presupuestos y documentación técnica profesional",
    number: "01",
  },
  {
    type: "learner",
    title: "Capacitaciones",
    description: "Accede a cursos especializados y recursos de formación para el desarrollo profesional",
    number: "02",
  },
  {
    type: "provider",
    title: "Proveedores",
    description: "Administra catálogo de productos, cotizaciones y seguimiento de entregas a obras",
    number: "03",
  },
  {
    type: "worker",
    title: "Contratistas",
    description: "Registra avances, reporta incidencias y coordina tareas con el equipo del proyecto",
    number: "04",
  },
  {
    type: "visitor",
    title: "Visitantes",
    description: "Explora las funcionalidades de la plataforma sin comprometerte con datos reales",
    number: "05",
  }
];

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

      const { error, data } = await supabase
        .from('user_preferences')
        .update({
          last_user_type: userType,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userData.user.id)
        .select();

      if (error) throw error;
      return { success: true };
    },
    onMutate: async (userType: string) => {
      setCompletingOnboarding(true);
      await queryClient.cancelQueries({ queryKey: ['current-user'] });

      const previousUserData = queryClient.getQueryData(['current-user']);

      queryClient.setQueryData(['current-user'], (oldData: any) => {
        if (!oldData) return oldData;
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
    onSuccess: (data, userType) => {
      localStorage.setItem('onboarding_bypass', 'true');
      localStorage.setItem('onboarding_bypass_user_id', userData?.user?.id || '');
      
      setCompletingOnboarding(false);
      
      if (userType === 'learner') {
        setSidebarContext('learning');
        navigate('/learning/dashboard');
      } else {
        setSidebarContext('organization');
        navigate('/organization/dashboard');
      }
    },
    onError: (err, userType, context) => {
      setCompletingOnboarding(false);
      
      if (context?.previousUserData) {
        queryClient.setQueryData(['current-user'], context.previousUserData);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el modo. Intenta nuevamente.",
      });
    },
  });

  const handleModeSelect = (modeType: string, isAvailable: boolean) => {
    if (!isAvailable) {
      toast({
        title: "Próximamente",
        description: "Este modo estará disponible pronto.",
      });
      return;
    }

    if (hasFinished || updateUserTypeMutation.isPending) {
      return;
    }
    
    setCompletingOnboarding(true);
    setHasFinished(true);
    setSelectedMode(modeType);
    
    updateUserTypeMutation.mutate(modeType);
  };

  return (
    <div className="flex min-h-screen w-full">
      {modeOptions.map((mode, index) => {
        const isSelected = selectedMode === mode.type;
        const isAvailable = mode.type === 'professional' || mode.type === 'learner';
        const isLoading = updateUserTypeMutation.isPending && isSelected;
        
        return (
          <div
            key={mode.type}
            onClick={() => handleModeSelect(mode.type, isAvailable)}
            className={`
              flex-1 flex flex-col items-center justify-between
              transition-all duration-500 ease-in-out
              cursor-pointer
              relative overflow-hidden
              px-8 py-16
              ${isAvailable 
                ? 'hover:bg-[#1a1a1a]' 
                : 'hover:bg-muted/30'
              }
              bg-background
              ${isSelected ? 'bg-[#1a1a1a]' : ''}
              ${!isAvailable ? 'opacity-60' : ''}
              group
            `}
            data-testid={`mode-select-${mode.type}`}
          >
            {/* Number at top with accent color */}
            <div className="w-full flex justify-center">
              <span className={`
                text-sm font-light tracking-wider
                transition-all duration-500
                ${isAvailable 
                  ? 'text-muted-foreground group-hover:text-[var(--accent)]' 
                  : 'text-muted-foreground'
                }
                ${isSelected ? 'text-[var(--accent)]' : ''}
              `}>
                {mode.number}
              </span>
            </div>

            {/* Center spacer */}
            <div className="flex-1" />

            {/* Title and Description at bottom - all at same height */}
            <div className="w-full flex flex-col items-center relative">
              {/* Title - changes to white on hover */}
              <h2 className={`
                text-2xl font-medium text-center
                transition-all duration-500
                text-foreground
                ${isAvailable 
                  ? 'group-hover:!text-white group-hover:scale-105' 
                  : ''
                }
                ${isSelected ? '!text-white scale-105' : ''}
              `}>
                {mode.title}
              </h2>

              {/* Description - only visible on hover, below title, light gray - ABSOLUTE so it doesn't take space */}
              <p className={`
                absolute top-full mt-4 left-1/2 transform -translate-x-1/2
                text-sm text-center leading-relaxed max-w-xs w-full px-4
                transition-all duration-500
                text-gray-400
                ${isAvailable 
                  ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' 
                  : 'opacity-0'
                }
                ${isSelected ? 'opacity-100 translate-y-0' : ''}
              `}>
                {mode.description}
              </p>

              {/* Status indicators - ABSOLUTE so it doesn't take space */}
              {!isAvailable && (
                <div className={`
                  absolute top-full mt-4 left-1/2 transform -translate-x-1/2
                  flex items-center gap-2 text-sm text-muted-foreground
                  transition-all duration-500
                  opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                `}>
                  <Lock className="h-4 w-4" />
                  <span>Próximamente</span>
                </div>
              )}

              {isLoading && (
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-sm text-white">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </div>
              )}
            </div>

            {/* Vertical separator */}
            {index < modeOptions.length - 1 && (
              <div className={`
                absolute right-0 top-0 bottom-0 w-px
                transition-opacity duration-500
                ${isAvailable ? 'bg-border/20 group-hover:bg-white/10' : 'bg-border/10'}
              `} />
            )}

            {/* Top line decoration */}
            <div className={`
              absolute top-0 left-1/2 transform -translate-x-1/2
              w-12 h-px
              transition-all duration-500
              ${isAvailable 
                ? 'bg-border/30 group-hover:bg-[var(--accent)] group-hover:w-24' 
                : 'bg-border/20'
              }
              ${isSelected ? 'bg-[var(--accent)] w-24' : ''}
            `} />
          </div>
        );
      })}
    </div>
  );
}
