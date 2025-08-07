import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Crown, Users, Building, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";

import { Layout } from "@/components/layout/desktop/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrganizationStatsCards } from "@/components/cards/OrganizationStatsCards";
import { OrganizationActivityChart } from "@/components/charts/OrganizationActivityChart";
import { OrganizationQuickActions } from "@/components/cards/OrganizationQuickActions";
import { OrganizationRecentProjects } from "@/components/cards/OrganizationRecentProjects";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  useOrganizationStats,
  useOrganizationActivity,
} from "@/hooks/use-organization-stats";
import { useNavigationStore } from "@/stores/navigationStore";
import { useMobileActionBar } from "@/components/layout/mobile/MobileActionBarContext";
import { useMobile } from "@/hooks/use-mobile";

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

// Function to get organization initials
const getOrganizationInitials = (name: string | null | undefined) => {
  if (!name) return "ORG";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function OrganizationDashboard() {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();

  const currentOrganization = userData?.organization;
  const { data: stats, isLoading: statsLoading, error: statsError } = useOrganizationStats();
  const { data: activityData, isLoading: activityLoading, error: activityError } =
    useOrganizationActivity();

  // Set sidebar context and hide mobile action bar on dashboards
  useEffect(() => {
    setSidebarContext("organization");
    if (isMobile) {
      setShowActionBar(false);
    }
  }, [setSidebarContext, setShowActionBar, isMobile]);

  const greeting = getTimeBasedGreeting();
  const userName = userData?.user_data?.first_name || userData?.user?.full_name || "Usuario";

  const headerProps = {
    title: "Resumen de Organización",
    showSearch: false,
    showFilters: false,
  };

  // Show error state if there's an error
  if (statsError || activityError) {
    return (
      <Layout headerProps={headerProps} wide>
            {statsError?.message || activityError?.message || "Inténtalo nuevamente"}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Recargar página
          </Button>
        </div>
      </Layout>
    );
  }

  if (!currentOrganization) {
    return (
      <Layout headerProps={headerProps} wide>
            Selecciona una organización para ver el resumen
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
        {/* Welcome Card with Dynamic Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
                {/* Organization Avatar */}
                    <AvatarImage
                      src={currentOrganization.logo_url}
                      alt={currentOrganization.name}
                    />
                      {getOrganizationInitials(currentOrganization.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Greeting and Organization Info */}
                  <motion.h1
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {greeting}, {userName}
                  </motion.h1>
                    Estás en{" "}
                      {currentOrganization.name}
                    </span>
                  </p>

                      <span>
                        Creado el{" "}
                        {format(
                          new Date(currentOrganization.created_at),
                          "dd/MM/yyyy",
                          { locale: es },
                        )}
                      </span>
                    </div>
                    {currentOrganization.plan && (
                          {currentOrganization.plan.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Organization Stats Cards */}
        <OrganizationStatsCards
          activeProjects={stats?.activeProjects || 0}
          documentsLast30Days={stats?.documentsLast30Days || 0}
          generatedTasks={stats?.generatedTasks || 0}
          financialMovementsLast30Days={
            stats?.financialMovementsLast30Days || 0
          }
          isLoading={statsLoading}
        />

        {/* Activity Chart */}
        <OrganizationActivityChart
          data={activityData || []}
          isLoading={activityLoading}
        />

        {/* Quick Actions & Recent Projects */}
          <OrganizationQuickActions />
          <OrganizationRecentProjects />
        </div>
      </div>
    </Layout>
  );
}
