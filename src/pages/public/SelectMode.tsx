import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, GraduationCap, Briefcase, Package, HardHat, UserCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ModeOption {
  type: 'professional' | 'learner' | 'provider' | 'worker' | 'visitor';
  title: string;
  description: string;
  icon: typeof Briefcase;
  available: boolean;
}

const modeOptions: ModeOption[] = [
  {
    type: "professional",
    title: "Profesionales y Constructoras",
    description: "Gestiona proyectos completos con equipos, presupuestos y documentación técnica profesional",
    icon: Briefcase,
    available: true,
  },
  {
    type: "learner",
    title: "Cursos y Capacitaciones",
    description: "Accede a cursos especializados y recursos de formación para el desarrollo profesional",
    icon: GraduationCap,
    available: true,
  },
  {
    type: "provider",
    title: "Fabricantes y Proveedores",
    description: "Administra catálogo de productos, cotizaciones y seguimiento de entregas a obras",
    icon: Package,
    available: false,
  },
  {
    type: "worker",
    title: "Mano de Obra y Contratistas",
    description: "Registra avances, reporta incidencias y coordina tareas con el equipo del proyecto",
    icon: HardHat,
    available: false,
  },
  {
    type: "visitor",
    title: "Visitantes y Clientes",
    description: "Explora las funcionalidades de la plataforma sin comprometerte con datos reales",
    icon: UserCircle2,
    available: false,
  }
];

export default function SelectMode() {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { setSidebarContext, setSidebarLevel } = useNavigationStore();
  const { setCompletingOnboarding } = useAuthStore();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [hasFinished, setHasFinished] = useState(false);

  const updateUserTypeMutation = useMutation({
    mutationFn: async (userType: string) => {
      if (!userData?.user?.id) throw new Error('Usuario no encontrado');
      if (!supabase) throw new Error('Supabase no está configurado');

      const { error } = await supabase
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
        setSidebarLevel('learning');
        navigate('/learning/dashboard');
      } else {
        setSidebarContext('organization');
        setSidebarLevel('organization');
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

  const availableModes = modeOptions.filter(m => m.available);
  const upcomingModes = modeOptions.filter(m => !m.available);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Selecciona tu modo de trabajo
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Elige cómo deseas usar Seencel. Podrás cambiar de modo en cualquier momento desde tu perfil.
          </p>
        </div>

        {/* Available Modes Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {availableModes.map((mode) => {
            const isSelected = selectedMode === mode.type;
            const isLoading = updateUserTypeMutation.isPending && isSelected;
            const Icon = mode.icon;
            
            return (
              <Card
                key={mode.type}
                onClick={() => handleModeSelect(mode.type, mode.available)}
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-300
                  hover:border-foreground/40 hover:shadow-lg
                  ${isSelected ? 'border-foreground shadow-lg' : 'border-border'}
                  ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                `}
                data-testid={`mode-select-${mode.type}`}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <Icon className="w-full h-full" strokeWidth={1} />
                </div>

                <div className="p-6 relative">
                  {/* Badge */}
                  <Badge 
                    className="mb-4 border-0 text-white"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Disponible
                  </Badge>

                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-semibold mb-2">
                    {mode.title}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {mode.description}
                  </p>

                  {/* Action Button */}
                  <Button 
                    variant="default" 
                    className="w-full group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Seleccionar
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Upcoming Modes Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingModes.map((mode) => {
            const Icon = mode.icon;
            
            return (
              <Card
                key={mode.type}
                onClick={() => handleModeSelect(mode.type, mode.available)}
                className="relative overflow-hidden cursor-not-allowed opacity-60 border-border transition-all duration-300 hover:opacity-70"
                data-testid={`mode-select-${mode.type}`}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                  <Icon className="w-full h-full" strokeWidth={1} />
                </div>

                <div className="p-6 relative">
                  {/* Badge */}
                  <Badge 
                    variant="outline" 
                    className="mb-4 border-muted-foreground/30"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Próximamente
                  </Badge>

                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-semibold mb-2">
                    {mode.title}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
