/**
 * 👤 UserQuickAccess - Popover de acceso rápido del usuario
 * 
 * Componente que muestra el avatar del usuario y se despliega como popover
 * hacia abajo (fuera del header) mostrando selectores y acceso al perfil.
 * 
 * Inspirado en el diseño de voice chat expandible.
 */

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Building2, FolderOpen, User, ChevronDown, LogOut, ArrowUpRight, Home, CreditCard } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UserQuickAccessProps {
  className?: string;
}

export function UserQuickAccess({ className }: UserQuickAccessProps) {
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [orgSelectorOpen, setOrgSelectorOpen] = useState(false);
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);

  const { data: userData } = useCurrentUser();
  const organizations = userData?.organizations || [];
  const { currentOrganizationId, setCurrentOrganization, selectedProjectId, setSelectedProject } = useProjectContext();
  const { data: projectsLite = [] } = useProjectsLite();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentOrg = organizations.find(o => o.id === currentOrganizationId);
  const currentProject = projectsLite.find(p => p.id === selectedProjectId);

  const getPlanBadgeClass = (planSlug: string | undefined) => {
    switch (planSlug?.toLowerCase()) {
      case 'free':
        return 'bg-[hsl(76,100%,40%)] text-white hover:bg-[hsl(76,100%,40%)]/90';
      case 'pro':
        return 'bg-[hsl(213,100%,33%)] text-white hover:bg-[hsl(213,100%,33%)]/90';
      case 'teams':
        return 'bg-[hsl(271,76%,53%)] text-white hover:bg-[hsl(271,76%,53%)]/90';
      case 'enterprise':
        return 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700';
      default:
        return 'bg-accent text-accent-foreground';
    }
  };

  // Determinar si se deben mostrar los selectores de organización y proyecto
  // NO mostrar en páginas de capacitaciones ni perfil (en cualquier parte de la ruta)
  const shouldShowSelectors = (() => {
    // Ocultar si la ruta contiene '/learning' o '/profile' en cualquier parte
    if (location.includes('/learning')) return false;
    if (location.includes('/profile')) return false;
    
    // Mostrar en todas las demás rutas
    return true;
  })();

  // Mutation para cambiar organización activa
  const switchOrganization = useMutation({
    mutationFn: async (organizationId: string) => {
      console.log('🔄 [UserQuickAccess] Switching to organization:', organizationId);
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', userData?.user?.id)
        .select();
      
      if (error) {
        console.error('❌ [UserQuickAccess] Error switching organization:', error);
        throw error;
      }
      console.log('✅ [UserQuickAccess] Organization switch successful:', data);
      return data;
    },
    onSuccess: () => {
      // Force refresh user data
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.refetchQueries({ queryKey: ['current-user'] });
      setSelectedProject(null, null); // Reset project when switching org
      toast({
        title: "Organización cambiada",
        description: "La organización se ha cambiado exitosamente."
      });
      setOrgSelectorOpen(false);
    },
    onError: (error: any) => {
      console.error('❌ [UserQuickAccess] Organization switch error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la organización.",
        variant: "destructive"
      });
    }
  });

  const handleOrgChange = (orgId: string) => {
    // No hacer nada si ya está seleccionada la misma organización
    if (orgId === currentOrganizationId) {
      console.log('🔄 [UserQuickAccess] Organization already selected:', orgId);
      setOrgSelectorOpen(false);
      return;
    }
    
    console.log('🔄 [UserQuickAccess] Selecting organization:', orgId, 'Current:', currentOrganizationId);
    switchOrganization.mutate(orgId);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId, currentOrganizationId);
    setProjectSelectorOpen(false);
  };

  const handleGoToProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGoToPricing = () => {
    navigate('/settings/pricing-plan');
    setIsOpen(false);
  };

  const handleGoToSubscriptions = () => {
    navigate('/admin/subscriptions');
    setIsOpen(false);
  };

  const handleGoToLanding = () => {
    navigate('/');
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (avatarRef.current) {
      setAvatarRect(avatarRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setOrgSelectorOpen(false);
      setProjectSelectorOpen(false);
    }, 100);
  };

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Avatar - siempre visible */}
      <div ref={avatarRef} className="cursor-pointer">
        <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity ring-0 border-0">
          <AvatarImage src={userData?.user?.avatar_url} />
          <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold ring-0 border-0">
            {userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Popover que se despliega hacia abajo - renderizado en portal */}
      {isOpen && avatarRect && createPortal(
        <AnimatePresence>
          <motion.div
            className="fixed w-72 bg-background border border-border rounded-lg shadow-lg"
            style={{
              top: avatarRect.bottom + 8,
              right: window.innerWidth - avatarRect.right,
              zIndex: 9999
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Header del popover con nombre de usuario */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {userData?.user?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userData?.user?.email || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Button - SIEMPRE PRIMERO */}
            <button
              onClick={handleGoToProfile}
              className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-accent/10 transition-colors group"
              data-testid="button-view-profile"
            >
              <User className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                Ver Perfil
              </span>
            </button>

            {/* Selectores - CONDICIONALES (no en /learning ni /profile) */}
            {shouldShowSelectors && (
              <div className="p-2 border-t border-border">
                  
                  {/* Selector de Organización - Acordeón inline */}
                  <div className="space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrgSelectorOpen(!orgSelectorOpen);
                        setProjectSelectorOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-md hover:bg-accent/10 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-accent" />
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-muted-foreground font-medium">Organización</span>
                          <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors truncate max-w-[180px]">
                            {currentOrg?.name || 'Seleccionar'}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        orgSelectorOpen && "rotate-180"
                      )} />
                    </button>

                    {/* Lista de organizaciones - inline */}
                    <AnimatePresence>
                      {orgSelectorOpen && (
                        <motion.div
                          className="pl-9 pr-2 space-y-0.5 max-h-48 overflow-y-auto"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {organizations.map((org) => (
                            <button
                              key={org.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrgChange(org.id);
                              }}
                              className={cn(
                                "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                                org.id === currentOrganizationId
                                  ? "bg-accent text-accent-foreground font-medium"
                                  : "hover:bg-accent/10"
                              )}
                            >
                              {org.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Selector de Proyecto - Acordeón inline */}
                  <div className="space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectSelectorOpen(!projectSelectorOpen);
                        setOrgSelectorOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-md hover:bg-accent/10 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderOpen className="h-4 w-4 text-accent" />
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-muted-foreground font-medium">Proyecto activo</span>
                          <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors truncate max-w-[180px]">
                            {currentProject?.name || 'Seleccionar'}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        projectSelectorOpen && "rotate-180"
                      )} />
                    </button>

                    {/* Lista de proyectos - inline */}
                    <AnimatePresence>
                      {projectSelectorOpen && (
                        <motion.div
                          className="pl-9 pr-2 space-y-0.5 max-h-48 overflow-y-auto"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {projectsLite.length === 0 ? (
                            <div className="px-3 py-4 text-center">
                              <p className="text-xs text-muted-foreground">No hay proyectos</p>
                            </div>
                          ) : (
                            projectsLite.map((project) => (
                              <button
                                key={project.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProjectChange(project.id);
                                }}
                                className={cn(
                                  "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                                  project.id === selectedProjectId
                                    ? "bg-accent text-accent-foreground font-medium"
                                    : "hover:bg-accent/10"
                                )}
                              >
                                {project.name}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

              </div>
            )}

            {/* Separator + Plan Info + Logout */}
            <div className="border-t border-border">
              {/* Plan Information */}
              <div className="px-4 py-3 flex items-center justify-between hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Badge className={getPlanBadgeClass(userData?.organizations?.[0]?.plan?.slug)}>
                    {userData?.organizations?.[0]?.plan?.slug?.toUpperCase() || 'FREE'}
                  </Badge>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 px-3 text-xs font-medium flex-shrink-0"
                  onClick={handleGoToSubscriptions}
                  data-testid="button-manage-subscription"
                >
                  {userData?.organizations?.[0]?.plan?.slug === 'free' ? 'Upgrade' : 'Gestionar'}
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Landing Page Button */}
              <button
                onClick={handleGoToLanding}
                className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-accent/10 transition-colors border-t border-border group"
                data-testid="button-go-to-landing"
              >
                <Home className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                  Página de Inicio
                </span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-accent/10 transition-colors border-t border-border group"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                  Cerrar sesión
                </span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
