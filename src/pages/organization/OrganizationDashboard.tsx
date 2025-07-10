import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  Crown, 
  Users,
  Building
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OrganizationStatsCards } from '@/components/ui-custom/cards/OrganizationStatsCards';
import { OrganizationActivityChart } from '@/components/ui-custom/charts/OrganizationActivityChart';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationStats, useOrganizationActivity } from '@/hooks/use-organization-stats';
import { useNavigationStore } from '@/stores/navigationStore';
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext';
import { useMobile } from '@/hooks/use-mobile';

// Function to get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours()
  
  if (hour >= 6 && hour < 12) {
    return "Buen día"
  } else if (hour >= 12 && hour < 20) {
    return "Buena tarde"
  } else {
    return "Buena noche"
  }
}

// Function to get organization initials
const getOrganizationInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function OrganizationDashboard() {
  const [, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { setShowActionBar } = useMobileActionBar();
  const isMobile = useMobile();
  
  const currentOrganization = userData?.organization;
  const { data: stats, isLoading: statsLoading } = useOrganizationStats();
  const { data: activityData, isLoading: activityLoading } = useOrganizationActivity();

  // Set sidebar context and hide mobile action bar on dashboards
  useEffect(() => {
    setSidebarContext('organization');
    if (isMobile) {
      setShowActionBar(false);
    }
  }, [setSidebarContext, setShowActionBar, isMobile]);

  const greeting = getTimeBasedGreeting()
  const firstName = userData?.user_data?.first_name || userData?.user?.full_name || 'Usuario'

  const headerProps = {
    title: "Resumen de la Organización",
    showSearch: false,
    showFilters: false
  }

  if (!currentOrganization) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No hay organización seleccionada</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona una organización para ver el resumen
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Welcome Card with Dynamic Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                {/* Organization Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-16 w-16 border-2 border-gray-200">
                    <AvatarImage src={currentOrganization.logo_url} alt={currentOrganization.name} />
                    <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getOrganizationInitials(currentOrganization.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Greeting and Organization Info */}
                <div className="flex-1">
                  <motion.h1 
                    className="text-4xl font-black text-gray-900 mb-1"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    {greeting}, {firstName}
                  </motion.h1>
                  <p className="text-lg text-gray-600 mb-3">
                    Estás en <span className="font-semibold">{currentOrganization.name}</span>
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Creado el {format(new Date(currentOrganization.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Crown className="h-4 w-4" />
                      <Badge variant="outline" className="text-xs">
                        Plan Pro
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Organización activa</span>
                    </div>
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
          financialMovementsLast30Days={stats?.financialMovementsLast30Days || 0}
          isLoading={statsLoading}
        />

        {/* Activity Chart */}
        <OrganizationActivityChart
          data={activityData || []}
          isLoading={activityLoading}
        />
      </div>
    </Layout>
  )
}