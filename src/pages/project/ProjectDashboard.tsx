import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, FolderOpen, FileText, Construction, Calculator, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";

import { Layout } from "@/components/layout/desktop/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();

  const organizationId = userData?.preferences?.last_organization_id;
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: stats, isLoading: statsLoading } = useProjectStats(projectId);
  const { data: activityData, isLoading: activityLoading } = useProjectActivity(projectId);

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
        {/* Welcome Card with Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)]">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                {/* Project Icon */}
                <div className="flex-shrink-0">
                  <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-border">
                    <AvatarFallback className="text-sm md:text-lg font-bold text-[var(--accent-foreground)] bg-[var(--accent)]">
                      {currentProject ? getProjectInitials(currentProject.name) : 'P'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Project Info */}
                <div className="flex-1">
                  <motion.h1
                    className="text-2xl md:text-4xl font-black text-foreground mb-1"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {currentProject?.name || 'Proyecto'}
                  </motion.h1>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <p className="text-base md:text-lg text-muted-foreground">
                      Resumen del proyecto
                    </p>
                    {currentProject?.status && (
                      <Badge variant="outline" className="w-fit">
                        {currentProject.status === 'active' ? 'Activo' : 
                         currentProject.status === 'completed' ? 'Completado' : 
                         currentProject.status === 'on_hold' ? 'En Pausa' : 'Estado'}
                      </Badge>
                    )}
                  </div>
                  {currentProject?.created_at && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
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

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectQuickActions />
          <ProjectRecentActivity projectId={projectId} />
        </div>
      </div>
    </Layout>
  );
}
