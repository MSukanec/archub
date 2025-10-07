import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Building, Package, Hammer, Eye, Loader2, GraduationCap, Lock } from "lucide-react";

interface ModeOption {
  type: 'professional' | 'learner' | 'provider' | 'worker' | 'visitor';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const modeOptions: ModeOption[] = [
  {
    type: "professional",
    title: "Profesional",
    description: "Gestiona proyectos completos con equipos, presupuestos y documentación",
    icon: Building,
  },
  {
    type: "learner",
    title: "Capacitaciones",
    description: "Accede a cursos y recursos de formación profesional",
    icon: GraduationCap,
  },
  {
    type: "provider",
    title: "Proveedores",
    description: "Administra catálogo de productos y cotizaciones",
    icon: Package,
  },
  {
    type: "worker",
    title: "Contratistas",
    description: "Registra avances y coordina tareas del proyecto",
    icon: Hammer,
  },
  {
    type: "visitor",
    title: "Visitantes",
    description: "Explora las funcionalidades sin compromiso",
    icon: Eye,
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
      {modeOptions.map((mode) => {
        const Icon = mode.icon;
        const isSelected = selectedMode === mode.type;
        const isAvailable = mode.type === 'professional' || mode.type === 'learner';
        const isLoading = updateUserTypeMutation.isPending && isSelected;
        
        return (
          <div
            key={mode.type}
            onClick={() => handleModeSelect(mode.type, isAvailable)}
            className={`
              flex-1 flex flex-col items-center justify-center
              transition-all duration-500 ease-in-out
              cursor-pointer
              relative overflow-hidden
              ${isAvailable 
                ? 'hover:bg-[var(--accent)] hover:text-white' 
                : 'hover:bg-muted/50'
              }
              bg-background text-foreground
              ${isSelected ? 'bg-[var(--accent)] text-white' : ''}
              ${!isAvailable ? 'opacity-60' : ''}
              group
            `}
            data-testid={`mode-select-${mode.type}`}
          >
            {/* Content Container */}
            <div className="text-center px-8 py-12 space-y-6 relative z-10">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`
                  p-6 rounded-2xl 
                  transition-all duration-500
                  ${isAvailable 
                    ? 'bg-[var(--accent)] text-white group-hover:bg-white group-hover:text-[var(--accent)]' 
                    : 'bg-muted text-muted-foreground'
                  }
                  ${isSelected ? 'bg-white text-[var(--accent)]' : ''}
                `}>
                  {isLoading ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : !isAvailable ? (
                    <Lock className="h-10 w-10" />
                  ) : (
                    <Icon className="h-10 w-10" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 className={`
                text-3xl font-bold
                transition-all duration-500
                ${isAvailable 
                  ? 'group-hover:scale-105' 
                  : ''
                }
              `}>
                {mode.title}
              </h2>

              {/* Description */}
              <p className={`
                text-base max-w-xs mx-auto
                transition-all duration-500
                ${isAvailable 
                  ? 'opacity-80 group-hover:opacity-100' 
                  : 'opacity-60'
                }
              `}>
                {mode.description}
              </p>

              {/* Status Badge */}
              {!isAvailable && (
                <div className="pt-4">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                    <Lock className="h-4 w-4" />
                    Próximamente
                  </span>
                </div>
              )}

              {isLoading && (
                <div className="pt-4">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </span>
                </div>
              )}
            </div>

            {/* Hover Border Effect */}
            <div className={`
              absolute inset-0 border-r border-border/20
              transition-opacity duration-500
              ${isAvailable ? 'group-hover:border-white/30' : ''}
              ${mode.type === 'visitor' ? 'border-r-0' : ''}
            `} />
          </div>
        );
      })}
    </div>
  );
}
