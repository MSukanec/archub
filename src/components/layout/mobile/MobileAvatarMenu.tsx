import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, UserCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useProjects } from "@/hooks/use-projects";

interface MobileAvatarMenuProps {
  onClose: () => void;
  isOpen: boolean;
}

export function MobileAvatarMenu({ onClose }: MobileAvatarMenuProps): React.ReactPortal {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const [expandedOrgSelector, setExpandedOrgSelector] = useState(false);
  const [expandedProjectSelector, setExpandedProjectSelector] = useState(false);

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const queryClient = useQueryClient();

  // Obtener organizaciones y proyectos
  const currentOrganization = userData?.organization;
  const sortedOrganizations = userData?.organizations || [];
  const { data: projectsData } = useProjects(currentOrganization?.id);
  const effectiveCurrentProject = userData?.preferences?.last_project_id;

  // Organization selection mutation
  const organizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      // Obtener el primer proyecto de la nueva organización
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1);

      const firstProjectId = projectsData?.[0]?.id || null;

      const { error } = await supabase
        .from('user_preferences')
        .update({ 
          last_organization_id: organizationId,
          last_project_id: firstProjectId 
        })
        .eq('id', userData.preferences.id);

      if (error) throw error;
      return organizationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setExpandedOrgSelector(false);
    }
  });

  // Project selection mutation
  const projectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error('No user preferences available');
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id);

      if (error) throw error;
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setExpandedProjectSelector(false);
    }
  });

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
  };

  const menuContent = (
    <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9998 }}>
      <div className="flex flex-col w-full mt-16 rounded-t-lg" style={{ backgroundColor: 'var(--menues-bg)', maxHeight: 'calc(100vh - 4rem)' }}>
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--menues-border)' }}>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--menues-fg)' }}>
            Mi Cuenta
          </h1>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--menues-hover-bg)]"
          >
            <X className="h-4 w-4" style={{ color: 'var(--menues-fg)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Organization Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--menues-fg)' }}>
              Organización
            </label>
            <div className="relative">
              <button
                onClick={() => setExpandedOrgSelector(!expandedOrgSelector)}
                className="w-full h-10 px-3 rounded-lg border flex items-center justify-between transition-colors hover:bg-[var(--menues-hover-bg)]"
                style={{ 
                  borderColor: 'var(--menues-border)',
                  backgroundColor: 'var(--menues-bg)',
                  color: 'var(--menues-fg)'
                }}
              >
                <span className="truncate text-left">
                  {currentOrganization?.name || 'Seleccionar organización'}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedOrgSelector ? 'rotate-180' : ''}`} />
              </button>

              {expandedOrgSelector && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
                  style={{ 
                    backgroundColor: 'var(--menues-bg)',
                    borderColor: 'var(--menues-border)'
                  }}
                >
                  {sortedOrganizations.map((org: any) => (
                    <button
                      key={org.id}
                      onClick={() => organizationMutation.mutate(org.id)}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--menues-hover-bg)] transition-colors"
                      style={{ color: 'var(--menues-fg)' }}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--menues-fg)' }}>
              Proyecto
            </label>
            <div className="relative">
              <button
                onClick={() => setExpandedProjectSelector(!expandedProjectSelector)}
                className="w-full h-10 px-3 rounded-lg border flex items-center justify-between transition-colors hover:bg-[var(--menues-hover-bg)]"
                style={{ 
                  borderColor: 'var(--menues-border)',
                  backgroundColor: 'var(--menues-bg)',
                  color: 'var(--menues-fg)'
                }}
              >
                <span className="truncate text-left">
                  {projectsData?.find((p: any) => p.id === effectiveCurrentProject)?.name || 'Seleccionar proyecto'}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${expandedProjectSelector ? 'rotate-180' : ''}`} />
              </button>

              {expandedProjectSelector && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
                  style={{ 
                    backgroundColor: 'var(--menues-bg)',
                    borderColor: 'var(--menues-border)'
                  }}
                >
                  {projectsData?.map((project: any) => (
                    <button
                      key={project.id}
                      onClick={() => projectMutation.mutate(project.id)}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--menues-hover-bg)] transition-colors"
                      style={{ color: 'var(--menues-fg)' }}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Profile Button - Full width */}
          <div className="pt-4">
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)]"
              style={{ 
                color: 'var(--menues-fg)',
                backgroundColor: 'transparent',
                border: '1px solid var(--menues-border)'
              }}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={userData?.user?.avatar_url || ''} />
                <AvatarFallback style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                  {userData?.user?.full_name?.charAt(0) || userData?.user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="font-medium" style={{ color: 'var(--menues-fg)' }}>
                  {userData?.user?.full_name || 'Usuario'}
                </div>
                <div className="text-xs opacity-70" style={{ color: 'var(--menues-fg)' }}>
                  Mi Perfil
                </div>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}