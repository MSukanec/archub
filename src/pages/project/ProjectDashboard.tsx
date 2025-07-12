import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, FolderOpen, FileText, Construction, Calculator, DollarSign, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";

import { Layout } from "@/components/layout/desktop/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProjectStatsCards } from "@/components/ui-custom/cards/ProjectStatsCards";
import { ProjectActivityChart } from "@/components/ui-custom/charts/ProjectActivityChart";
import { ProjectQuickActions } from "@/components/ui-custom/cards/ProjectQuickActions";
import { ProjectRecentActivity } from "@/components/ui-custom/cards/ProjectRecentActivity";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useProjectStats,
  useProjectActivity,
} from "@/hooks/use-project-stats";
import { useNavigationStore } from "@/stores/navigationStore";
import { useMobileActionBar } from "@/components/layout/mobile/MobileActionBarContext";
import { useMobile } from "@/hooks/use-mobile";
import { CustomEmptyState } from '@/components/ui-custom/CustomEmptyState'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

// Function to get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return "Buen día";
  } else if (hour >= 12 && hour < 20) {
    return "Buenas tardes";
  } else {
    return "Buenas noches";
  }
};

// Function to get project initials
const getProjectInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function ProjectDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();

  const organizationId = userData?.preferences?.last_organization_id;
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: stats, isLoading: statsLoading } = useProjectStats(projectId);
  const { data: activityData, isLoading: activityLoading } = useProjectActivity(projectId);

  // Mutation for uploading project image
  const updateProjectImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!supabase || !projectId || !organizationId) throw new Error('Missing required parameters');

      // Use the specialized upload function
      const { uploadProjectImage, updateProjectImageUrl } = await import('@/lib/storage/uploadProjectImage');
      
      // Upload image
      const uploadResult = await uploadProjectImage(file, projectId, organizationId);
      
      // Update project data table
      await updateProjectImageUrl(projectId, uploadResult.file_url);

      return uploadResult.file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stats'] });
      toast({
        title: "Imagen actualizada",
        description: "La imagen del proyecto se ha actualizado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al subir imagen",
        description: "No se pudo actualizar la imagen del proyecto.",
        variant: "destructive",
      });
      console.error('Error uploading image:', error);
    },
  });

  // Set sidebar context and hide mobile action bar on dashboards
  useEffect(() => {
    setSidebarContext("project");
    if (isMobile) {
      setShowActionBar(false);
    }
  }, [setSidebarContext, setShowActionBar, isMobile]);

  const greeting = getTimeBasedGreeting();
  const userName = userData?.user_data?.first_name || userData?.user?.full_name || "Usuario";

  const headerProps = {
    title: "Resumen del Proyecto",
    showSearch: false,
    showFilters: false,
  };

  // Find current project
  const currentProject = stats?.project;
  


  if (!currentProject && !statsLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No hay proyecto seleccionado</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona un proyecto para ver el resumen
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Hero Card with Project Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Settings Button - Outside the card to avoid z-index issues */}
          <input
            type="file"
            id="project-image-upload"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                updateProjectImageMutation.mutate(file);
              }
              // Reset input value to allow re-uploading same file
              e.target.value = '';
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-50 cursor-pointer z-50"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const input = document.getElementById('project-image-upload') as HTMLInputElement;
              if (input) {
                input.click();
              }
            }}
            disabled={updateProjectImageMutation.isPending}
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Card className="relative overflow-hidden border-[var(--card-border)] h-48 md:h-56">
            {/* Background Image */}
            {currentProject?.project_data?.project_image_url ? (
              <img 
                src={currentProject.project_data.project_image_url}
                alt="Project background"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  console.error('Error loading project image:', e);
                  // Hide broken image and show fallback
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="absolute inset-0 bg-[var(--accent)]"
              />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <CardContent className="relative z-10 p-4 md:p-6 h-full flex flex-col justify-end">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
                {/* Project Icon */}
                <div className="flex-shrink-0">
                  <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-white/30">
                    <AvatarFallback className="text-sm md:text-lg font-bold text-white bg-white/20">
                      {currentProject ? getProjectInitials(currentProject.name) : 'P'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Project Info */}
                <div className="flex-1">
                  <motion.h1
                    className="text-2xl md:text-4xl font-black text-white mb-1"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {currentProject?.name || 'Proyecto'}
                  </motion.h1>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <p className="text-base md:text-lg text-white/90">
                      Resumen del proyecto
                    </p>
                    {currentProject?.status && (
                      <Badge variant="outline" className="w-fit bg-white/10 text-white border-white/30">
                        {currentProject.status === 'active' ? 'Activo' : 
                         currentProject.status === 'completed' ? 'Completado' : 
                         currentProject.status === 'on_hold' ? 'En Pausa' : 'Estado'}
                      </Badge>
                    )}
                  </div>
                  {currentProject?.created_at && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-white/80">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Creado el {format(new Date(currentProject.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics Cards */}
        <ProjectStatsCards stats={stats} isLoading={statsLoading} />

        {/* Activity Chart - Full Width */}
        <ProjectActivityChart data={activityData || []} isLoading={activityLoading} />

        {/* Recent Activity */}
        <ProjectRecentActivity projectId={projectId} />
      </div>
    </Layout>
  );
}
