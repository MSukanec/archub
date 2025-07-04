import { useState } from "react";
import { useLocation } from "wouter";
import { Building, Package, Hammer, Eye, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomRestricted } from "@/components/ui-custom/misc/CustomRestricted";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useNavigationStore } from "@/stores/navigationStore";
import { useToast } from "@/hooks/use-toast";

type UserType = "professional" | "provider" | "worker" | "visitor";

interface ModeOption {
  type: UserType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const modeOptions: ModeOption[] = [
  {
    type: "professional",
    title: "Profesional",
    description: "Estudios de arquitectura, constructoras y empresas de construcción",
    icon: Building,
    color: "bg-[var(--accent)]"
  },
  {
    type: "provider",
    title: "Proveedor de Materiales",
    description: "Empresas que suministran materiales y equipos de construcción",
    icon: Package,
    color: "bg-[var(--accent)]"
  },
  {
    type: "worker",
    title: "Mano de Obra",
    description: "Contratistas, maestros de obra y profesionales independientes",
    icon: Hammer,
    color: "bg-[var(--accent)]"
  },
  {
    type: "visitor",
    title: "Solo Exploración",
    description: "Explora las funcionalidades sin compromiso",
    icon: Eye,
    color: "bg-[var(--accent)]"
  }
];

export function SelectMode() {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<UserType | null>(null);

  const updateUserTypeMutation = useMutation({
    mutationFn: async (userType: UserType) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('Missing required data');
      }
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_user_type: userType })
        .eq('id', userData.preferences.id);
      
      if (error) throw error;
      return userType;
    },
    onSuccess: (userType) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      // Set appropriate sidebar context and navigate based on user type
      if (userType === 'professional') {
        setSidebarContext('organization');
        navigate('/organization/dashboard');
      } else if (userType === 'provider') {
        // For now, redirect to organization dashboard
        // TODO: Create provider-specific dashboard
        setSidebarContext('organization');
        navigate('/organization/dashboard');
      } else if (userType === 'worker') {
        // For now, redirect to organization dashboard
        // TODO: Create worker-specific dashboard
        setSidebarContext('organization');
        navigate('/organization/dashboard');
      } else if (userType === 'visitor') {
        // For now, redirect to organization dashboard
        // TODO: Create visitor-specific dashboard
        setSidebarContext('organization');
        navigate('/organization/dashboard');
      }
      
      toast({
        title: "Modo actualizado",
        description: `Ahora estás usando Archub como ${modeOptions.find(m => m.type === userType)?.title}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el modo de usuario",
        variant: "destructive",
      });
      console.error('Error updating user type:', error);
    }
  });

  const handleModeSelect = (mode: UserType) => {
    setSelectedMode(mode);
    updateUserTypeMutation.mutate(mode);
  };

  const currentUserType = userData?.preferences?.last_user_type;
  const isOnboarding = !currentUserType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {isOnboarding ? "¡Bienvenido a Archub!" : "Elegir modo de uso"}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {isOnboarding 
              ? "Elige cómo quieres usar Archub para personalizar tu experiencia"
              : `Estás usando Archub como: ${modeOptions.find(m => m.type === currentUserType)?.title || 'No definido'}`
            }
          </p>
          {!isOnboarding && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              ¿Quieres cambiar tu modo de uso?
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modeOptions.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.type;
            const isCurrent = currentUserType === mode.type;
            const isLoading = updateUserTypeMutation.isPending && selectedMode === mode.type;
            const isAvailable = mode.type === 'professional'; // Solo profesional está disponible
            
            const cardContent = (
              <Card
                key={mode.type}
                className={`
                  ${isAvailable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-not-allowed opacity-60'}
                  transition-all duration-300 transform
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                  ${isCurrent ? 'ring-2 ring-[var(--accent)]' : ''}
                  ${isLoading ? 'opacity-75' : ''}
                `}
                onClick={() => isAvailable && !isLoading && handleModeSelect(mode.type)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${mode.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {isCurrent && !isLoading && (
                      <div className="flex items-center text-[var(--accent)]">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Actual</span>
                      </div>
                    )}
                    {isLoading && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-5 w-5 mr-1 animate-spin" />
                        <span className="text-sm font-medium">Guardando...</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                    {mode.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
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

        <div className="text-center mt-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Puedes cambiar tu modo de uso en cualquier momento desde tu perfil
          </p>
        </div>
      </div>
    </div>
  );
}